# Phase 2 — Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the whole catalog into Supabase and make it fully admin-managed:
- products with ml variants and sample vials
- categories, collections, notes and the scent profile
- compliance fields
- one audited stock path

The storefront reads everything from the database, with the same look.

**Architecture:**
- **Database:** Postgres owns the rules. Triggers derive product stock, sizes and prices, and guard sold items and stock writes. RPCs do multi-table saves and read shapes: `save_product`, `product_detail`, `search_products`, `search_suggest`, `similar_products`, `catalog_filters`.
- **Storefront adapter:** existing components keep their props. `toLegacyProduct()` maps an RPC card to the shape they already render, and the old `src/data` lookups are replaced with TanStack Query hooks.
- **Seed:** generated once from the current JS data by a script, so collections, notes and filter memberships match today's site. It's committed as a migration and marked sample.

**Tech Stack:** Supabase Postgres (plpgsql, pg_trgm, unaccent), React 19, TanStack Query 5, @dnd-kit (reorder), TipTap + DOMPurify (rich text), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-07-saudagar-store-design.md` (§7 sample variants, §8.1, §8.4 stock path, §13 ratings, §18 phase 2).

## Global Constraints
- **Money:** `numeric(12,2)` rupees. Display stays `RS. 5,500`.
- **Reads:** public reads only see active, non-archived rows. Admin sees all.
- **Writes:** admin only. Every SECURITY DEFINER fn has `set search_path = ''` and its own role check.
- **Stock:** written only through `app_private.apply_stock_change` (called by `adjust_stock` and later order functions). A direct UPDATE of `stock` raises `STOCK_DIRECT_WRITE`.
- **Sold items:** a variant with `units_sold > 0` is never deleted; it is set to stock 0 and hidden. A product with `units_sold > 0` can't be deleted: `PRODUCT_SOLD: … Archive it instead.`
- **Variants:** variant ids stay stable across saves.
- **Reviews:** no fake ratings. `rating_avg` / `rating_count` start at 0, and stars are hidden when the count is 0.
- **Look:** unchanged. Filters sync to the URL.
- **Commits:** no Claude co-author trailer.

## Review Focus
1. Saving a product whose variant was removed in the editor but has sales: the variant is hidden with stock 0, not deleted, and the save succeeds. *(Task 1 SQL test.)*
2. Two attribute filters of different kinds (e.g. occasion = evening AND concentration = attar) narrow the results; two of the same kind widen them. *(Task 2 SQL test.)*
3. An old link like `/collections/oud-royale` or `/collections/solar-citrus` still lands on the right collection. *(Task 1 alias column + Task 4 test.)*
4. A product with no images, no notes or no variants renders without crashing (product page, card, quick buy). *(Task 4 adapter unit test.)*
5. Duplicate note names that differ only in case are refused with a readable message. *(Task 1 SQL test.)*

---

### Task 1: Catalog schema, stock path, save_product
**Files:**
- Create: `supabase/migrations/0004_catalog.sql`, `supabase/tests/0004_catalog.test.sql`

**Interfaces (Produces):**
- **Tables:** `attribute_options`, `categories`, `collections` (incl. `aliases text[]` and hero fields), `notes`, `products`, `product_variants`, `product_media`, `product_categories`, `product_collections`, `product_notes`, `product_attributes`, `inventory_movements`.
- **Stock functions:**
  - `public.adjust_stock(variant_id uuid, delta int, reason text, note text default null) returns int` (admin)
  - `app_private.apply_stock_change(variant_id, delta, reason, order_id, note) returns int`
- **Product functions:**
  - `public.save_product(payload jsonb) returns uuid` (admin). It saves variants by id or new, attaches media by `variant_sku`, sets initial stock through the stock path, and hides sold removed variants.
  - `public.archive_product(id uuid)`, `public.delete_product(id uuid)`
- **Triggers:**
  - Derived product fields: total_stock, available_sizes, min_price, max_price.
  - Search text and vector.
  - Note-family kind check, and a category cycle check.

- [ ] **Step 1: Write the SQL tests.**
  - `save_product` creates a product with 2 variants and initial stock 10; `total_stock = 20`; `min_price` comes from the variant override.
  - Re-saving keeps the variant ids.
  - Removing a variant with `units_sold = 1` leaves it `is_hidden` with stock 0.
  - Direct `update product_variants set stock` raises STOCK_DIRECT_WRITE.
  - `adjust_stock(-15)` below zero raises STOCK_NEGATIVE.
  - Each movement is logged with `stock_after`.
  - `delete_product` on a sold product raises PRODUCT_SOLD.
  - Note `oud` after `Oud` raises a unique violation.
  - A customer can't insert products and sees no inactive product.
- [ ] **Step 2:** Run `npm run db:test` → FAIL.
- [ ] **Step 3:** Write the migration.
- [ ] **Step 4:** Run `npm run db:apply && npm run db:test` → PASS.
- [ ] **Step 5:** Commit `feat(db): catalog schema, audited stock path and save_product`.

### Task 2: Read RPCs — detail, search, suggest, similar, filters
**Files:**
- Create: `supabase/migrations/0005_catalog_reads.sql`, `supabase/tests/0005_catalog_reads.test.sql`

**Interfaces:**
- `product_detail(p_slug text) returns jsonb`. Returns product fields plus:
  - `variants[]` (retail and visible only)
  - `media[]`
  - `notes {top[],heart[],base[]}`, each with name, slug and image
  - `attributes {kind: [{label,slug,strength,is_primary}]}`
  - `categories[]`, `collections[]`
- `search_products(p jsonb) returns jsonb`. Returns `{items: Card[], total, page, page_size, facets: {kind: {slug: count}}}`.
  - **Filter keys:** `q`, `category`, `collection`, `note`, `notes[]`, `note_families[]`, `attrs {kind: slug[]}`, `price_min`, `price_max`, `sizes[]`, `in_stock`, `featured`, `slugs[]`.
  - **Paging and sort:** `sort` is one of `featured|newest|price_asc|price_desc|best_selling`. `page` starts at 1. `page_size` is at most 48.
- **Card:** slug, name, short_description, badge, min_price, compare_at, images[3], sizes[{variant_id, ml, label, price, compare_at, stock}], notes{top,heart,base names}, concentration, category, collections[], rating_avg, rating_count, total_stock, is_featured.
- `search_suggest(q text) returns jsonb`: `{products[≤6], notes[≤5], collections[≤4]}`.
- `similar_products(p_slug text, p_limit int default 4) returns jsonb`: Card[]. Score = 2 × shared notes + 3 × same primary family + shared accords.
- `catalog_filters() returns jsonb`:
  - `categories` as a tree
  - `collections`, and `notes` with family
  - `options {kind: [...]}`
  - `price {min,max}`, `sizes[]`
- `resolve_collection(p_slug text) returns jsonb`: the collection by slug or alias.

- [ ] **Step 1: Write the SQL tests** (fixture products created in the test):
  - **AND/OR rule:** two different attribute kinds are ANDed; two options of one kind are ORed (Review Focus 2).
  - **Search:** `q` matches a note name.
  - **Sorting:** price_asc orders by min_price.
  - **Facets:** counts ignore the attribute filters.
  - **Similar products:** exclude self and rank the shared-note product first.
  - **Aliases:** `resolve_collection('oud-royale')` returns the collection whose aliases contain it.
  - **Visibility:** an inactive product never appears for anon.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(db): catalog read RPCs`.

### Task 3: Seed generator and sample catalog
**Files:**
- Create: `scripts/generate-catalog-seed.mjs`, `supabase/migrations/0006_seed_catalog.sql` (generated)

**Decisions:**
- **Collections:**
  - `signature` (aliases all, new-in, discovery-sets, bespoke-atelier, bespoke), `royal` (oud-royale, royal-attars), `exotic` (dark, obsidian, noir), `fresh` (aquatic, solar-citrus, solar, citrus).
  - Plus `latest-drop` (first 8 products, the home "Latest drop") and `exclusive-coffrets` (collection = 'Exclusive Coffrets').
  - Memberships are computed by running today's `filterProductsByTheme`, so the pages show the same products.
- **Categories:** the distinct `product.category` values, flat.
- **Notes:**
  - The distinct note names. The family comes from the first `FILTER_SECTIONS.notes` keyword match.
- **Attributes:**
  - From today's `classifyProduct`: intensity, occasions, concentration.
  - Primary family: the product's most common note family.
  - Accords: note families with strength 100 / 75 / 50.
  - Gender: unisex.
  - Seasons and time of day derived from occasions (summer → Summer; evening/date-night → Night; daily → Day).
  - Longevity and sillage from intensity.
  - All of it is marked sample.
- **Variants:** from `sizes`. SKU `SAU-<SLUG-ABBR>-<ML>`, stock 25, weight_g = round(ml × 4 + 250).
- **Sample vials:** each product that counts toward samples gets a `5 ml sample` variant (stock 20, in pool).
- **Every seeded row is marked sample:** products with badge kept, and a `notes`/`description` note "Sample content — replace" in the admin-only `admin_note` column on products.

- [ ] **Step 1:** Generate, apply, then run SQL spot checks: 16 products; `royal` has the same slugs `filterProductsByTheme('royal')` returns; no product has rating_count > 0.
- [ ] **Step 2:** Commit `feat(db): sample catalog seed generated from the current storefront data`.

### Task 4: Storefront data layer and adapter
**Files:**
- Create: `src/storefront/catalog/api.ts`, `src/storefront/catalog/adapter.ts`, `src/storefront/catalog/adapter.test.ts`, `src/storefront/catalog/hooks.ts`, `src/storefront/catalog/filters.ts`, `src/storefront/catalog/filters.test.ts`

**Interfaces:**
- **Adapter:** `toLegacyProduct(card | detail) → LegacyProduct`, with fields `{id: slug, name, category, collection, price, compareAtPrice, badge, rating, reviewsCount, images, sizes: {ml, label, price, variantId, stock}[], notes: {top, heart, base}, description, concentration, inStock}`.
- **Filters in the URL:** `filtersFromSearch(URLSearchParams) → SearchParams` and `filtersToSearch(SearchParams) → string`. Keys: `q`, `sort`, `page`, `notes`, `families`, `<kind>`, `min`, `max`, `size`, `stock`.
- **Hooks:** `useProductDetail(slug)`, `useProductSearch(params)`, `useProductsBySlugs(slugs)`, `useCatalogFilters()`, `useSearchSuggest(q)`, `useSimilarProducts(slug)`, `useCollection(slug)`.

- [ ] **Step 1: Write the unit tests.**
  - **Adapter:** a product with no media falls back to a placeholder image; no variants gives `sizes = []` and `inStock = false`; ratings with count 0 map to `rating: 0, reviewsCount: 0`.
  - **Filter round-trip:** `?occasion=evening,daily&min=3000&sort=price_asc` survives a round trip.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit.

### Task 5: Storefront pages on the database
**Files:**
- Modify:
  - Shell and routes: `App.jsx`, `src/app/routes.ts` (+ test)
  - Listing and product: `BluorngCollectionPage.jsx`, `BluorngCollectionHero.jsx`, `BluorngFilterSidebar.jsx`, `BluorngPDP.jsx`, `BluorngProductReviews.jsx`, `BluorngProductCard.jsx`, `BluorngQuickBuyModal.jsx`
  - Home and overlays: `BluorngFeaturedCollection.jsx`, `BluorngCustomExclusive.jsx`, `BluorngSignatureCollection.jsx`, `BluorngSearchModal.jsx`, `BluorngWishlistPage.jsx`, `BluorngCartDrawer.jsx`, `BluorngCheckoutPage.jsx`
- Create: `src/storefront/ListingPage.jsx` (shop, category, note, search), `src/storefront/NotesIndexPage.jsx`
- Delete: `src/data/fragranceFilters.js`, `src/data/collectionThemes.js`, `src/data/productReviewsData.js`, plus `ALL_PRODUCTS` from `bluorngSaudagarData.js`.

**Routes added:** `/shop`, `/categories/:slug`, `/notes`, `/notes/:slug`, `/search?q=`. `/product/:slug` always resolves to `product`; the page shows the 404 when the RPC returns null.

**Product page additions:**
- Accords as strength bars, the scent profile, the story, and a "Details & compliance" accordion.
- Similar scents.
- Recently viewed (localStorage, try/catch).
- An estimated delivery line from `shipping.default_eta`.
- Reviews: an empty state ("No reviews yet").

- [ ] **Step 1:** Update the routes tests (`/shop`, `/categories/x`, `/notes`, `/notes/x`, `/search`; an unknown product slug → product view). Watch them FAIL, then implement and PASS.
- [ ] **Step 2:** Rewire the components.
- [ ] **Step 3:** Add e2e tests:
  - The home "Latest drop" shows 8 cards from the DB.
  - The product page shows the note pyramid and "No reviews yet".
  - `/collections/oud-royale` shows the Royal hero.
  - Filtering by occasion updates the URL and the count.
  - Search suggests a product for a note name.
- [ ] **Step 4:** lint, typecheck, unit tests, build, e2e → PASS.
- [ ] **Step 5:** Commit.

### Task 6: Admin catalog pages
**Files:**
- Create:
  - Shared UI: `src/admin/ui/Modal.tsx`, `src/admin/ui/MediaField.tsx` (upload / pick from library / paste URL), `src/admin/ui/SortableList.tsx`, `src/admin/ui/RichText.tsx`, `src/admin/ui/DataTable.tsx`
  - Pages: `src/admin/pages/catalog/ProductsPage.tsx`, `ProductEditorPage.tsx`, `CategoriesPage.tsx`, `CollectionsPage.tsx`, `NotesPage.tsx`, `ScentProfilePage.tsx`
  - Editor logic: `src/admin/catalog/productForm.ts`, with its test `productForm.test.ts`
- Modify: `src/admin/nav.ts`, `src/admin/AdminApp.tsx`

**Interfaces:**
- **Payload builder:** `toSavePayload(form) → jsonb payload` for `save_product`, and `fromDetail(detail) → form`.
- **Validation:** `validateProductForm(form) → Record<string,string>`:
  - slug format, name, base price ≥ 0, unique SKUs within the form, at least one retail variant
  - accord strength 1–100
  - a launch year of 1900 or later

**Pages:**
- **Products list:** search, status chips (active/draft/archived), stock and price columns, Duplicate, Archive.
- **Product editor sections:**
  - Basics: name, slug auto, badge, short description, rich-text description, concentration line.
  - Media gallery: upload, reorder, alt text, variant image.
  - Sizes and pricing: variants table with Add stock / Remove stock.
  - Categories and collections.
  - Notes: Top / Heart / Base search-select with an inline "add new note" and reorder.
  - Scent profile: family (primary and secondary), accords with sliders, concentration, intensity, longevity, sillage, seasons, time of day, occasions, gender.
  - Story: perfumer, launch year, inspiration, how to wear.
  - Details & compliance.
  - Flags: active, featured, counts toward samples, ships surface only, sample vial.
- **Categories:** a tree with parent select, reorder, image/video, active.
- **Collections:** hero fields, aliases ("old links"), product assignment with order.
- **Notes:** CRUD, search, family, image, reorder. Duplicate names are refused.
- **Scent profile:** a tab per kind, with CRUD, reorder and active.

- [ ] **Step 1:** Write the `productForm` tests (each validation rule; the payload maps `variant_sku` media; a round trip from `fromDetail`). FAIL.
- [ ] **Step 2:** Implement until the tests PASS.
- [ ] **Step 3:** Build the pages. E2E: the admin creates a product with two sizes and notes, it appears on `/product/<slug>`, and archiving hides it.
- [ ] **Step 4:** Full verification.
- [ ] **Step 5:** Commit, push, open a PR that closes #2, merge.
