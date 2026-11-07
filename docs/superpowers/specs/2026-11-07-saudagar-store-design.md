# Saudagar Perfumes — Full Store, Admin Panel and CMS: Design

Date: 2026-11-07 · Status: draft for owner approval

"The reference spec" in this document means the owner's feature brief, saved verbatim at
[`docs/reference/ecommerce-reference-spec.md`](../../reference/ecommerce-reference-spec.md). Section
numbers like "reference spec §9" point into that file. Where the two differ, this document wins.

---

## 1. What this is and why

The Saudagar storefront exists today as a finished-looking React site with **no backend**. Every
product, price, review, menu, banner and promo code is hardcoded in `src/data/*` and inside the
components. Promo codes are checked in the browser. Nothing is saved anywhere.

This project turns it into a working Indian D2C perfume store that the owner runs entirely from an
admin panel:

- **Store management:** products, bottle sizes, notes and scent profile, stock, orders, customers,
  coupons, the free-sample programme, reviews, returns and refunds, shipping, payments and WhatsApp.
- **Complete CMS:** every word, image, video, menu and section a visitor sees is editable, can be
  reordered, and can be hidden.
- **Real accounts:** sign-in, addresses, order history and wishlist, all backed by Supabase.

Success means the owner can launch and run the store without a developer. They can add a perfume,
change the home page, run a coupon, ship an order and process a return, all from `/admin`.

## 2. Goals, non-goals, anti-goals

**Goals**
- Everything currently on the site is driven by the database and editable in the admin.
- The full commerce loop works end to end: browse → bag → checkout (COD) → order → pack → ship →
  deliver → review / return. Online payment (Razorpay) is built but stays off until keys arrive.
- The free 5 ml sample programme (§7) works and every rule of it is admin-editable.
- Coupons carry the reference spec's rules exactly (§9).
- Every external integration (Razorpay, Delhivery, India Post, WhatsApp, Google sign-in, GA4) is
  fully built behind an off switch, so the owner only has to paste keys later.

**Non-goals (decided by the owner)**
- International shipping and multi-currency. India only, ₹ only. The currency switcher is removed.
- Bottle engraving. Removed from the product page, cart, account page and orders.
- Delivery tiers: "Priority White-Glove next-day +₹500" and the special presentation-box delivery
  option are removed. There is one standard delivery with a fee and a free-shipping threshold.
- COD advance payment. COD is plain cash on delivery with nothing paid up front.
- Guest checkout. Customers must sign in to check out.
- Staff roles. There is one role, `admin`, plus customers.
- A redesign. The current look is kept exactly.
- Cloudinary. All media goes to Supabase Storage.
- Native mobile apps.

**Anti-goals (the project fails if any of these happen, even if it "works")**
- The browser decides a price, discount, shipping fee, sample entitlement or amount to charge.
- Any visitor-facing content still lives in component code.
- Fake reviews, ratings or review counts reach the live site. Every product starts at zero.
- The CMS lets the owner break the design. CMS fields map onto the existing designs; there is no
  free-form HTML injection.
- An admin action fails silently, or shows a raw database error.
- Sample or bottle stock drifts from reality: something gets sold or given away that isn't on the shelf.

## 3. Constraints

- **Supabase, free plan now, Pro before launch** (the owner confirmed the upgrade). The build must work
  on free:
  - No image transformations on free. Images are compressed in the browser to WebP before upload.
    A `media.transforms_enabled` setting switches image URLs to Supabase's render endpoint once Pro
    is active.
  - 50 MB per file on free. Video uploads are capped at 50 MB, with a clear message.
  - About 5 GB of downloads a month on free. Seed content keeps pointing at the existing
    `/public/images` and `/public/videos` files (served by Vercel), so development doesn't burn the
    Supabase quota. New uploads from the admin go to Storage.
- **Email:** Supabase's built-in mail sender only delivers to the project's own team addresses.
  Until the owner adds a custom SMTP provider, **email confirmation on signup is turned off**, so
  customers can register and sign in straight away. Password-reset emails will not reach real
  customers until SMTP is configured. This goes on the go-live checklist.
- **Hosting:** Vercel. Domain to be decided (placeholder in config).
- **Indian defaults:** ₹ INR, IST for every date, window and report, +91 10-digit phones, 6-digit
  pincodes, GST-inclusive prices, GST invoices.
- **Mobile first:** every storefront and admin page works at 360 px wide, nothing sits under the
  bottom nav, and no page scrolls sideways.
- **Credentials not yet available:** Razorpay, Delhivery, India Post, Meta WhatsApp, Google OAuth,
  GA4/GTM, business/GST details, policy text. Clearly marked placeholders are used everywhere.
- There is a single Supabase project. SQL tests run inside `BEGIN … ROLLBACK`. A second (staging)
  project is recommended before launch; this goes in SETUP.md.

## 4. Decisions on record

**Made by the owner**

| Topic | Decision |
|---|---|
| Market | India only, ₹ only; remove currency switcher |
| COD | Plain COD, no advance payment |
| Checkout | Sign-in required |
| Engraving, priority delivery, special-pack delivery | Removed |
| Reviews | Start at zero; verified buyers only; admin approves before they show |
| Boutiques section | Kept as an editable section, hidden until filled in |
| Integrations | Built now, keys pasted later |
| Business/GST/policy details | Placeholders |
| Look | Keep the current design exactly; admin uses the same fonts and colours in a plain style |
| Supabase plan | Upgrade to Pro before launch |
| Hosting | Vercel |
| Roles | One `admin` role |
| Media | Supabase Storage, not Cloudinary |
| Admin test login | `test@gmail.com` / `test1234` (owner will change it) |
| Free samples | Every 50 ml of perfume earns a free 5 ml sample, chosen by the customer from an admin-controlled list; everything editable |

**Proposed by Claude, not yet confirmed by the owner (the sample answers 1–4 were skipped, so these
are Claude's suggested defaults)**
- Sample entitlement is counted in **total ml**, not bottles (§7).
- The admin sets a per-order cap and marks which products count.
- 5 ml vial stock is tracked.
- Duplicate picks are allowed, and an unpicked slot is "Surprise me".

## 5. Architecture

### 5.1 One app, two faces
A single Vite + React 19 app. The storefront and the admin panel share auth, the Supabase client
and helpers. The admin lives at `/admin/*` and is lazy-loaded, so customers never download it.

**Frontend stack:**
- Already in the repo: React 19, Vite, Tailwind 3, framer-motion, GSAP, Lenis.
- Added:
  - TypeScript (`allowJs`; new code in TS, existing JSX converted only when touched)
  - react-router v7 (declarative mode)
  - TanStack Query v5, zustand (cart), react-hook-form + zod (admin forms)
  - Radix primitives (dialogs, menus, popovers in admin), sonner (toasts)
  - Recharts (dashboard), date-fns + @date-fns/tz (IST)
  - lucide-react (admin icons only)
  - @supabase/supabase-js v2
  - TipTap (rich text) + DOMPurify (sanitising rich text on render)
  - @dnd-kit (drag reorder in admin lists)
  - Vitest + Testing Library, Playwright, ESLint

**Backend (Supabase):**
- Postgres with RLS on every table
- SQL functions/RPCs and triggers
- Auth (email + password; Google behind a switch)
- Storage buckets, Realtime, Edge Functions (Deno), pg_cron, pg_net, Vault

### 5.2 Repository layout
```
src/
  main.tsx, app/            router, providers, layouts, error boundary
  lib/                      supabase client, money, ist, media (upload + url), errors, seo, analytics
  components/               existing storefront components (kept), now fed by props/hooks
  storefront/               new storefront pages/hooks (orders, auth, notes pages, bag page …)
  cms/                      section registry, field types, schema-driven form
  admin/                    admin pages and components (lazy)
supabase/
  migrations/               0001_… .sql — idempotent, applied in order, never edited once applied
  functions/_shared/        cors, errors, razorpay, shipping/ (adapter + pure core), whatsapp
  functions/<name>/         one folder per edge function
  tests/                    SQL assertion scripts (run in BEGIN … ROLLBACK)
scripts/                    create-admin, upload-seed-media, db-apply, export helpers
docs/                       this spec, plans, SETUP.md
```
The 24 components that nothing imports (`Header.jsx`, `Hero.jsx`, `ProductPage.jsx`, `CartDrawer.jsx`,
etc.) are deleted. So are `src/data/products.js`, which only those dead components use, and the
leftover vanilla-JS files (`product.html`, `src/main.js`, `src/product.js`, `src/styles/main.css`,
`src/styles/product.css`) if nothing still loads them. All of it remains in git history.

Three of the unused components are kept, because they come back as CMS section types (§11.3):
`BluorngStores.jsx`, `ValueProps.jsx` and `CampaignBanner.jsx`.

Once the database is seeded, the `src/data/*` files are deleted. A visitor-facing string left in
component code counts as a bug.

### 5.3 Data flow rules
- The storefront reads through supabase-js with the publishable key, under RLS. Content tables are
  public-read.
- **Money flows only through `quote_order` / `create_order`** (§8). The bag, checkout and review
  steps display only what the server returns.
- The admin writes simple tables directly (under admin RLS). Anything multi-table goes through an RPC
  in one transaction: `save_product`, `save_coupon`, `save_mega_menu`, `reorder(table, ids[])`, and so on.
- First paint uses one `site_bootstrap()` RPC that returns public settings, brand, theme tokens,
  announcement bars, navigation, footer and preloader config in one round trip. It is cached by
  TanStack Query and refreshed in the background.
- Realtime: `orders` and `admin_notifications` are in the `supabase_realtime` publication.
- Errors: SQL raises coded exceptions (`OUT_OF_STOCK`, `COUPON_INVALID`, `COD_MIN`, …) with a JSON
  detail. One `toFriendlyError()` helper maps every database or edge error to a sentence. Only styled
  dialogs are used, never `alert`/`confirm`/`prompt`.
- Every `SECURITY DEFINER` function sets `search_path = ''` and checks the caller's role itself.

### 5.4 Routes
**Storefront.** Existing URLs keep working. The legacy `?id=` and `?collection=` query forms redirect
to the paths below.

| Path | Page |
|---|---|
| `/` | Home (CMS sections) |
| `/shop` | All products (listing) |
| `/collections/:slug` | Collection page (existing themed hero + listing) |
| `/categories/:slug` | Category listing (children included) |
| `/notes`, `/notes/:slug` | Notes index; every perfume containing a note |
| `/product/:slug` | Product page |
| `/search?q=` | Search results |
| `/bag` | Bag page (the drawer stays too) |
| `/checkout` | Address → Payment → Review → Place order (sign-in required) |
| `/order/:number/success` | Order placed |
| `/account`, `/account/orders`, `/account/orders/:number`, `/account/addresses`, `/account/profile` | Account |
| `/wishlist` | Wishlist |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth |
| `/story` | Brand story (CMS page, existing design) |
| `/pages/:slug` | About, contact, shipping policy, returns policy, privacy, terms (CMS) |
| `*` | 404 |

**Admin:** `/admin/login` plus the pages in §14. Every `/admin/*` route requires `has_role(uid,'admin')`.
The UI guard is a convenience; RLS is the real guard.

## 6. Accounts and auth

- Tables:
  - `profiles`: id = auth uid, full_name, phone (+91, 10 digits), date_of_birth, dob_locked,
    whatsapp_opt_in, marketing_opt_in, created_at.
  - `user_roles`: user_id, role enum `admin|customer`, with a unique (user_id, role) pair.
  - `addresses`: user_id, label Home/Work/Other, name, phone, line1, line2, landmark, city, state,
    pincode, is_default. A trigger keeps exactly one default per user.
- `has_role(uid, role)`: stable, security definer. It is the single helper every policy uses.
- The signup trigger creates the profile and the `customer` role. It then issues the welcome coupon
  (§9.3) and queues the WhatsApp welcome message (inert until WhatsApp is on).
- Date of birth can be set once by the customer and is then locked. Only the admin can correct it.
- Register collects name, email, phone and password. Login, forgot and reset password use Supabase
  Auth. The Google button only renders when `auth.google_enabled` is true.
- `scripts/create-admin.mjs` creates `test@gmail.com / test1234` through the Auth admin API, using the
  service-role key fetched from the Management API at run time (never written to disk), and grants
  it `admin`. The README explains how to make any user an admin.
- Guest wishlist and cart are kept locally and merged into the account on sign-in.

## 7. The free 5 ml sample programme

**Rule (all values are admin settings):**
> For every **50 ml** of eligible perfume in the order, the customer earns **one free 5 ml sample**,
> up to a **maximum per order**, chosen from the **sample list** the admin controls.

- **Entitlement:** `min(max_per_order, floor(Σ(size_ml × qty) ÷ ml_per_sample))`. The sum covers
  retail lines whose product has `counts_toward_samples = true`.
  - Examples at 50 ml: one 50 ml bottle = 1 sample, two 50 ml = 2, one 100 ml = 2, one 30 ml = 0,
    two 30 ml = 1.
  - Discovery sets, attars sold in tiny sizes and accessories are simply left unticked.
  - The seed ticks every perfume and attar bottle, and leaves the discovery coffret and the two
    accessories unticked.
  - A variant with no `size_ml` never counts.
- **Settings** (`settings` table, `samples.*`):
  - `enabled` (true)
  - `ml_per_sample` (50)
  - `sample_size_ml` (5, used for display and labels)
  - `max_per_order` (4)
  - `allow_duplicates` (true)
  - the bag copy (heading and helper text)
- **The sample list:** a sample vial is a **product variant with `kind = 'sample'`** on the scent's
  own product (for example "Deep Canopy · 5 ml sample"). It has its own SKU and stock and an
  `in_sample_pool` flag. Sample variants are never sold: they are excluded from size selectors,
  listings and paid lines. Because they are ordinary variants, stock, movements, low-stock alerts and
  restocks use the same inventory system as bottles. A scent appears in the picker only when it is
  active, in the pool and has stock > 0.
- **Bag:**
  - Shows "You've earned N free samples" with a picker sheet listing pool scents (image, name).
  - The customer fills N slots. Each slot is a scent or **Surprise me**, which is the default for
    any slot they don't fill.
  - If the bag shrinks, extra picks are trimmed using the server's numbers.
  - If the bag is short of the next sample, it shows "Add X ml more for another free sample".
- **Server:**
  - `quote_order` returns:
    - `samples { entitlement, accepted[], rejected[] {variant_id, reason}, next_threshold_ml }`
  - `create_order` validates the picks again:
    - Each "Surprise me" slot, and any pick that ran out since the quote, is auto-assigned at
      order time. The server prefers in-stock pool scents that aren't already in the bag or the
      other samples, highest stock first.
    - If the pool is empty, the order still goes through with fewer samples. The difference is
      recorded on the order (`samples_short`) and shown to the admin.
    - A sample never blocks an order.
  - Sample lines are `order_items` with `line_type = 'sample'` and price 0.
- **Stock:** sample stock moves with the order, exactly like bottles. It goes down when bottle
  stock goes down (§8.4) and is restored on cancellation.
- **Admin → Free samples page:**
  - The rule settings, with a live example calculator.
  - The pool list: product, stock, in-pool toggle, reorder, low-stock highlight.
  - "Add sample vial" for any product (creates the sample variant).
  - Samples given per scent over the last 30 days.
- **Packing slip and admin order detail** list samples separately and clearly, including any
  shortfall.

## 8. Catalog, cart, pricing, orders

### 8.1 Catalog (follows the reference spec §3, adjusted)
- `categories` form a tree:
  - parent_id, slug, name, description, image/video, position, is_active, SEO fields.
- `collections` carry the fields of the existing collection themes:
  - name, short_name, headline, tagline, descriptor, notes_subtitle.
  - hero: video, poster, badge, title, tagline, subtext, accent tag.
  - position, is_active.
- `products`:
  - Basics: slug, name, short_description, description (rich text), primary_category_id,
    base_price, compare_at_price, badge text, is_featured, is_active, archived_at.
  - Flags: `counts_toward_samples`, `ships_surface_only`.
  - Story: perfumer, launch_year, inspiration (rich text), how_to_wear.
  - Compliance: net quantity comes from the variant. Product fields: country_of_origin,
    manufacturer / packer / importer name and address, consumer-care contact, shelf life / best
    before, ingredients, allergens, caution text ("for external use only", flammability), HSN code
    (default 3303), GST rate (default 18%). All are editable, and defaults come from settings.
  - Derived by triggers, never written by hand: total_stock, available_sizes, min_price, units_sold,
    rating_avg, rating_count, search vector.
- `product_variants`:
  - sku (unique), `kind` (`retail` | `sample`), size_ml, optional concentration option, label
    (e.g. "50 ml · EDP").
  - price (null = base price), compare_at, stock (≥ 0).
  - weight_g, box L/W/H mm, own images, is_active, is_hidden, position, in_sample_pool.
- `product_media`: product_id, optional variant_id, kind image/video, url, alt, position.
- `product_categories` (extra categories) and `product_collections` (with position).
- `notes`:
  - Fields: name (unique, case-insensitive), slug, `family_option_id` (a note family), short
    description, image, is_active, position.
  - `product_notes`: product_id, note_id, tier `top|heart|base`, position.
- `attribute_options`:
  - Columns: kind, label, slug, description, badge, position, is_active.
  - Kinds: `family`, `note_family`, `accord`, `concentration`, `intensity`, `longevity`, `sillage`,
    `season`, `time_of_day`, `occasion`, `gender`.
  - `note_family` and `intensity` exist because the current filter sidebar already uses those
    groupings. The descriptions and badges in `fragranceFilters.js` are seeded into these options,
    and the keyword-matching `classifyProduct()` hack is deleted.
- `product_attributes`: product_id, option_id, strength 1–100 (accords), is_primary (family).
- **Rules:**
  - `save_product(payload)` saves product, variants (ids stay stable), categories, collections,
    notes, attributes and media in one transaction.
  - A variant that has ever been sold is set to stock 0 and hidden, never deleted.
  - Deleting a product that was ever sold is refused, with "archive it instead".
- **Storefront:**
  - Product page: gallery, size selector (price, stock, images, MRP strike-through, % off),
    note pyramid, accords as strength bars, scent profile, story, a "Details & compliance"
    accordion, similar scents (shared notes + same family), recently viewed, pincode check, and a
    sticky mobile add-to-bag bar.
  - Listing pages (shop, collection, category, note, search) use the existing filter-sidebar design.
    Its options come from the database:
    - Filters: category, collection, note / note family, family, concentration, intensity, gender,
      season, occasion, longevity, sillage, price range, bottle size, in stock.
    - Sorts: featured, newest, price ↑/↓, best selling.
    - Filters sync to the URL. Pagination and empty states are included.
  - Search runs one `search_products(q, filters, sort, page)` RPC (full text + `pg_trgm` over name,
    notes, family and collections). `search_suggest(q)` feeds the existing search modal.

### 8.2 Cart and quote
- The zustand cart is persisted locally: lines `{variant_id, qty}`, sample picks, coupon code and an
  optional order note.
  - For signed-in users it is mirrored to `carts` / `cart_items`, which the abandoned-cart messages need.
  - Quantities run 1–99, capped by stock.
- `quote_order(items, coupon_code, payment_method, samples)` is `stable`, security definer and
  callable by anon. It returns:
  - lines, unavailable/short lines (listed, not thrown)
  - subtotal, coupon `{ok, reason, message, discount}`, discount, shipping, total
  - `cod {allowed, reason, min_order}`
  - `samples {…}` (§7)
  - `free_shipping {threshold, remaining}`
- Shipping is `settings.shipping_fee`, or 0 when (subtotal − discount) ≥ `settings.free_shipping_threshold`.
- The free-shipping progress bar and all totals in the drawer, bag page and checkout show only this quote.

### 8.3 Checkout and order creation
- **Address step:** pick a saved address or add one. The pincode is validated and courier
  serviceability is checked (§10).
- **Payment step:**
  - Cash on delivery, enabled with `cod_enabled` and optionally a `cod_min_order`. It is disabled
    with the reason shown when it is off, below the minimum, or not serviceable for that pincode or
    courier.
  - Online (Razorpay) appears only when `payments.online_enabled` is true and keys are set.
  - If both are off, checkout explains that ordering is paused, and the admin dashboard shows a warning.
- **Review step**, then **Place order**.
- `create_order(address_id, items, coupon_code, payment_method, samples, note)`:
  - Re-runs the quote and saves exactly that result. Errors are friendly: out of stock (with name,
    available and requested), the coupon message plus "Remove it to continue", and the COD minimum.
  - Inserts the order with a human-readable number (`settings.order_prefix` + sequence, e.g.
    `SAU-100001`).
  - Inserts `order_items` snapshots: name, variant label, image, qty, unit price, line type, HSN,
    GST rate.
  - The address is snapshotted onto the order.
- **The order note** is a plain optional "Note for us". The calligraphy gift-card copy is removed
  with the special packaging.

### 8.4 When stock moves
- **COD:** stock (bottles and samples) is decremented at `create_order`, with a `stock >= qty` guard,
  and the coupon redemption is recorded then too (there is no payment event to wait for).
  `payment_status` stays `PENDING` until the order is `DELIVERED`, when a trigger marks it `PAID`.
- **Online:** the order is created `PENDING` and unpaid, and nothing is reserved.
  `confirm_order_payment` (service role only, row-locked) decrements stock, records the coupon
  redemption and marks the order `PAID`. If a line fails, it raises `OUT_OF_STOCK` and the edge
  function refunds automatically. Unpaid online orders are expired by cron after 24 h.
- **Every stock write goes through one function**, `adjust_stock(variant, delta, reason, order_id, note)`.
  A trigger logs each change to `inventory_movements`: delta, stock_after, reason, order, who and when.
  - Reasons: `order`, `cancel_restock`, `return_restock`, `restock`, `damaged`, `tester_sample_use`,
    `write_off`, `correction`.
- Cancelling restocks exactly once (`stock_restored_at`), and releases the COD coupon redemption.

### 8.5 Order lifecycle
- **Statuses:** `PENDING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED`, plus `CANCELLED` and `RTO`.
- `order_transition_allowed(from, to, order)` is the single source of valid moves. The admin dropdown
  only offers those moves.
  - `PACKED` requires COD, or `payment_status = PAID`.
  - The customer can cancel only while the order is `PENDING`. A guard trigger blocks every other
    customer change.
  - The admin can cancel any time before delivery.
- **Payment status:** `PENDING | PAID | FAILED | REFUNDED | PARTIALLY_REFUNDED`.
- `paymentLabel(order)` is unit-tested and used everywhere (customer orders, admin, invoice). Its labels:
  - Awaiting payment
  - Paid
  - Payment failed
  - Cash on delivery · ₹X due
  - Paid (cash collected)
  - Refunded
  - Partially refunded
- **RTO:** when the parcel is back, the admin chooses Restock or Write off (§12), the same as returns.

## 9. Coupons

The reference spec §8 carries over **exactly**: kinds, fields, code normalisation, scope by categories
(children included) with excluded products, the 10-step evaluation order with reason codes and
friendly messages, the discount maths and caps, no public coupon list (RLS), `available_coupons(bag)`
for the "Apply coupon" sheet, `save_coupon`, and the three admin tabs (Coupons, Welcome offer,
Birthday). The adjustments:

- **§9.1 COD:** the redemption is counted at order placement and released if the order is cancelled.
  For online payments it is counted at payment confirmation.
- **§9.2:** all windows and the birthday calendar run in IST.
- **§9.3 Welcome offer:** issued by the signup trigger as described. The WhatsApp message is queued
  but stays inert while WhatsApp is off. The code is also shown on the account page, so it is useful
  before WhatsApp exists.
- The hardcoded codes (`SAUDAGAR10`, `ROYALVIP`, `FIRSTORDER`, `ROYALOUD`, `BLUORNG10`) are deleted.
  The seed creates one sample general coupon, clearly marked as sample.

## 10. Shipping (Delhivery + India Post + manual)

The reference spec §9 carries over, adjusted for credentials that don't exist yet:

- **One courier adapter interface** in `supabase/functions/_shared/shipping/`:
  - serviceability, createShipment, schedulePickup, cancel, track, createReturn.
  - A **pure, unit-tested core** handles parcel weight/dimensions, COD collectable (= order total),
    payload builders and raw-status → our-status mapping per courier.
- **Couriers:**
  - **Manual (default until Delhivery keys exist).** The admin picks a courier name (India Post,
    Delhivery or other), prints the label and invoice, books the parcel, and enters the
    AWB/article number. The tracking URL is built from that courier's template (`{awb}`). The order
    becomes `SHIPPED` and the "shipped" message is queued. The admin sets Out for delivery,
    Delivered or RTO by hand.
  - **India Post** uses the manual flow above. Whether it accepts COD is a setting, off by default.
  - **Delhivery** is implemented against Delhivery's developer documentation, **staging only**, and
    is labelled unverified in the code and in SETUP.md until the owner's token and the docs issued
    with the account are checked. It covers serviceability (COD + ETA), forward shipment, AWB,
    pickup, label PDF, cancel, tracking, reverse pickup and an optional rate estimate.
- **Serviceability without Delhivery:** format check, plus an admin-editable list of blocked pincodes
  and COD-disabled pincodes, plus a default ETA from settings. Once Delhivery is on, its answer is
  used, with fallback to India Post as in the reference spec.
- **Flow:**
  - Setting an order to `PACKED` fires a DB trigger. It calls `shipping-create` through pg_net,
    authenticated with `SHIPPING_HOOK_SECRET` from Vault.
  - Delhivery orders get an AWB and pickup. Manual orders show "Awaiting booking".
  - Errors are saved to `shipping_error` with a **Retry shipment** button and never block the admin.
- **Status updates:** `shipment-status-webhook` (shared secret, verify_jwt off) **or** a cron poll,
  selected by a setting. Both are built.
- **Order columns:** as listed in the reference spec §9.
- **Flammable goods:**
  - The product-level `ships_surface_only` flag goes to Delhivery as surface mode and changes the
    ETA shown.
  - SETUP.md records that the owner must get written confirmation from Delhivery and India Post of
    what they accept, and by which mode.
- **Admin → Shipping settings:** default courier, pickup location, per-courier COD allowed, tracking
  URL templates, packaging weight and box defaults, webhook vs poll, blocked/COD-disabled pincodes,
  default ETA, and a pincode test tool.

## 11. CMS

### 11.1 Page builder
- `website_sections`: id, page (text), section_type (text, not enum), position, is_visible, config
  jsonb, updated_at.
- **Pages:** a `pages` table holds slug, title, `layout` (`sections` | `rich_text`), rich-text body,
  SEO and is_published.
  - `home` and `story` are seeded as section pages.
  - About, contact and the four policy pages are seeded as rich-text pages.
  - **The admin can create new pages of either kind**, such as a Diwali gifting landing page built
    from sections. They are served at `/pages/:slug` and can be linked from the navigation or footer.
  - `home` and `story` can't be deleted. Any other page can.
- One registry, `src/cms/registry.ts`, maps each `section_type` to:
  - its component, admin label and description
  - a **field schema**
  - the admin form, which is generated from that schema
  
  A new section type needs only a component and a registry entry.
- **Field types:**
  - Basic: text, textarea, rich text, number, boolean, select, colour.
  - Media: upload image/video with a real progress bar, pick from the library, or paste a URL.
  - Link picker: page / category / collection / note / product / custom URL.
  - Pickers: category, collection, and product. The product picker is either automatic (source +
    count) or hand-picked (with a max).
  - Lists: repeatable, reorderable, with sub-fields.
  - Conditional fields via `showIf`.
- **Section actions per page:** add, reorder, hide/show, duplicate, delete, and "View on site".
  Changes go live on save, and clearing a field really removes it from the page. Defaults come from
  the seed migration, never from component code. A newly added section starts empty.
- **Product sources** (any section that shows products) resolve through one `section_products(config)`
  RPC. Modes: collection, category, featured, new arrivals, best sellers (by units_sold), or
  hand-picked; plus a limit.

### 11.2 Existing sections become section types (same design, data from config)
Each current component stops importing constants and receives `config`. The exact field list for
each is taken from what the component renders today.

| Section type | Current component | Main fields |
|---|---|---|
| `hero_video_carousel` | BluorngHero | slides (video, poster, title, label), CTA labels + links. Replaces the vite plugin that scans `/public/videos` |
| `kinetic_marquee` | LuxuryKineticMarquee | items[], speed, reverse |
| `category_tiles` | BluorngCategories | tiles (title, subtitle, image, link) |
| `product_carousel` | BluorngFeaturedCollection | heading, subheading, product source, CTA |
| `campaign_banner_animated` | AnimatedCampaignBanner | lines, two CTAs |
| `product_showcase` | BluorngCustomExclusive | heading, copy, product source, CTA |
| `gallery_tiles` | BluorngGalleryHero | 3 tiles (media, title, subtitle, link) |
| `product_grid` | BluorngSignatureCollection | heading, product source, CTA |
| `editorial_story` | BluorngEditorial | statement, bento items, collection entries |
| `testimonials` | BluorngTestimonials | heading; items come from the `testimonials` table |
| `instagram_reels` | BluorngInstagramReels | heading; items come from the Reels admin |
| `seo_accordion` | BluorngFooterAccordions | SEO text blocks, popular-search tabs and terms |
| `story_hero`, `story_tenets`, `story_timeline` | BluorngStoryPage | the story page's three blocks |

### 11.3 New section types (built in the existing visual language)
`stockists` (revives BluorngStores; seeded **hidden**), `promise_strip` (revives ValueProps),
`promo_banner` (revives CampaignBanner), `shop_by_note` (note tiles → `/notes/:slug`), `faq` (from the
FAQ table), `rich_text`, `newsletter_whatsapp_optin`.

**Not in this build** (they could be added later as section types): journal/lookbook, community UGC
bento, influencer picks, and launch countdown. The existing **Stories** viewer and **Instagram Reels**
are the admin-managed equivalents for now. Each has its own admin page with media, caption and
tagged products.

### 11.4 Global CMS tabs and dedicated pages
- **Theme:** CSS-variable tokens applied at runtime.
  - Tokens: accent (light), accent (dark), ink, page background (light and dark), display font, body
    font (from a curated Google Fonts list).
  - The five brand colours hardcoded across the components (`#C4823F`, `#ECC86A`, `#D4AF37`,
    `#111111`, `#0B0A0D`) are replaced with these tokens by a codemod. Neutral greys stay as they are.
  - The dark/light toggle stays.
- **Brand:**
  - Name, logos (light/dark), favicon.
  - Instagram, WhatsApp and YouTube links, plus the WhatsApp number for the floating button.
  - Support email, phone, hours and address.
- **Preloader:** enabled, frequency (every load or once per session), duration, plus the current
  curtain preloader's own fields (colours/images, text or logo).
- **SEO:** defaults, and per-page title, description and OG image.
- **Announcements:** multiple bars, ordered, each with an active toggle, optional link and optional
  start/end dates (IST).
- **Navigation:** header links, the fullscreen mega nav and the mobile drawer.
  - Mega nav tabs carry the current fields: numeral, title, subtitle, collection link, image, video,
    concentration line, and two side-bento cards (title, subtitle, badge, video, link).
  - The product count shown on each tab is computed, not typed.
- **Footer:** link columns, newsletter copy, wordmark, socials.
- **Stories:** slides with media, title, subtitle, tag, duration, tagged product, active flag, order.
- **Reels:** video/thumbnail, title, tagged products, active flag, order.
- **Testimonials and FAQs:** CRUD, active toggle, reorder.
- **Content pages:** about, contact, shipping policy, returns policy, privacy, terms. The policy pages
  are needed live for Razorpay KYC.
- **Media library:** every upload is recorded in `media_assets` (bucket, path, url, kind, mime, bytes,
  width, height, alt, uploaded_by). It is searchable and reusable from every media field.

### 11.5 Uploads
- One shared `useUpload` hook is used by every uploader. There is no second implementation.
  - Uploads go by XHR to the Storage REST endpoint, which gives real progress.
  - Images are compressed to WebP in the browser first (long edge ≤ 2400 px).
  - Uploads above the plan's file limit are refused with a clear message.
- **Buckets:**
  - `media`: public read, admin write. Catalog and CMS.
  - `reviews`: public read. Insert only by the verified reviewer, under their own uid prefix.
  - `returns`: private. The owner and admin read through signed URLs.
- `mediaUrl(url, {width})` returns the original on free, and the render-endpoint URL once
  `media.transforms_enabled` is on (Pro).
- Seed content references the existing `/public` files. `scripts/upload-seed-media.mjs` can move
  them into Storage later.

## 12. Cancellations, returns, refunds
The reference spec §10 carries over, minus anything about COD advances:
- **Returns:**
  - Accepted within `return_window_days` (default 7) of delivery, for damaged, leaking, wrong or
    missing items only. The policy wording is editable.
  - The customer adds up to 3 photos/videos to the `returns` bucket.
  - Statuses run NONE → … → REFUNDED / REPLACED / REJECTED.
  - Approval books a Delhivery reverse pickup, or asks the customer to post it and enter the article
    number.
  - When it is RECEIVED, the admin chooses **Restock** or **Write off (damaged)**. Both are logged.
    A leaked bottle never goes back on sale.
- **Resolving:**
  - Online payments: refund via Razorpay.
  - COD: a manual UPI/bank refund recorded with a reference.
  - Or a ₹0 replacement order, which takes stock and is set to PACKED.
- **Refunds page:**
  - Lists every refund, with Razorpay refund id and status (PROCESSING / REFUNDED).
  - "Refund via Razorpay" (with a confirm step) and "Refresh status".
  - Manual status and notes for COD and rejected cases.

## 13. Reviews, wishlist, back-in-stock (not in the reference spec; decided here)
- **Reviews:**
  - `reviews` columns:
    - product_id, user_id, order_item_id
    - rating 1–5, title, body
    - longevity and sillage choices (from attribute options, as the current review form has)
    - display name and city (prefilled from the profile and order, editable)
    - status `PENDING | APPROVED | REJECTED`, timestamps
  - `review_media` holds up to 4 images per review. `review_votes` holds helpful votes, one per user.
  - Only a customer with a `DELIVERED` order containing the product can review it, once per product.
  - Reviews need approval before they show. The admin **Reviews** page has approve / reject / hide.
  - Product rating_avg and rating_count count approved reviews only. With zero reviews, the product
    page shows "No reviews yet". The existing review section's layout is kept.
  - All hardcoded reviews (`productReviewsData.js`) and ratings are deleted.
- **Wishlist:** a `wishlists` table for signed-in users. A guest's local wishlist merges on sign-in.
- **Notify me when it's back:** `back_in_stock_requests` stores variant, user or phone, and notified_at.
  When stock goes from 0 to above 0, the WhatsApp `back_in_stock` message is queued.

## 14. Admin panel

**Look:** clean and functional, using the storefront's fonts and colours. A sidebar on desktop and a
top bar with a drawer on mobile. Tables have search and filters. Forms open in drawers or modals,
with an unsaved-changes guard. Styled confirm dialogs only.

**Navigation**
- **Dashboard**
- **Sales:** Orders · Returns · Refunds · Customers
- **Catalog:** Products · Inventory · Free samples · Categories · Collections · Notes · Scent profile · Reviews
- **Marketing:** Coupons · WhatsApp
- **Content (CMS):** Pages & sections · Navigation · Footer · Announcements · Stories · Reels ·
  Testimonials & FAQ · Content pages · Media library · Theme · Brand · Preloader · SEO
- **Setup:** Shipping · Payments · Invoice · Settings · Data export

**Page details**
- **Dashboard:**
  - Period switch (7 / 30 / 90 days) and a revenue & orders chart.
  - KPIs: revenue, orders, AOV, pending orders, customers, low-stock count.
  - Breakdowns: top 10 cities, top 8 states, top products by revenue, top notes by revenue.
  - Warnings, e.g. "checkout paused" or "sample pool empty".
- **Orders:**
  - Search by number, name, phone or email. Filters: status, payment, courier, date.
  - Valid-transition dropdown, payment label, and a shipping column (courier, AWB, tracking,
    error + Retry).
  - Live updates.
  - Detail drawer: items, samples, address, timeline, internal notes.
  - Print invoice, label and packing slip. CSV export.
- **Inventory:**
  - A per-variant table covering bottles **and sample vials**: search by product, SKU or size,
    category filter, low-stock highlight.
  - Add/remove stock with a reason. Full movement history per variant.
- **Customers:** search, set or correct birthday, order count, total spent, CSV export.
- **Invoice template and printable invoice:**
  - Template fields: company name, tagline, address, phone, email, website, GSTIN, seller state,
    invoice prefix, colours, logo.
  - The invoice per order is printable and can be saved as PDF.
  - It shows a tax-inclusive breakdown with HSN per line: CGST + SGST when the ship-to state equals
    the seller state, otherwise IGST.
- **Settings** (a typed key/value table with a `public` flag; anon can read only public keys):
  - shipping fee, free-shipping threshold
  - COD enabled, COD minimum
  - return window, low-stock threshold, order prefix, default ETA
  - `samples.*`, `payments.online_enabled`, `auth.google_enabled`, `media.transforms_enabled`
  - WhatsApp switches
- **Payments and WhatsApp settings** show whether each secret is set, never its value. The
  `admin-integrations-status` edge function reports this.
- **Notifications bell:** `admin_notifications` + Realtime, for new orders, failed shipments, return
  requests, low stock and reviews awaiting approval.
- **Data export:** a CSV of every main table, as a backup.

## 15. Payments (Razorpay — built, off until keys)
The reference spec §7 carries over, minus COD advances:
- **Edge functions:**
  - `razorpay-create-order`: input is `{order_id}` only; the amount comes from the order. It checks
    the owner, PENDING status and ≥ 100 paise, and reuses the Razorpay order on double-click.
  - `razorpay-verify-payment`: constant-time HMAC check, order match, fetch + capture, idempotent,
    409 for a different payment on a paid order.
  - `razorpay-webhook`: signature verified, runs the same confirm path.
  - `razorpay-refund` (admin): one refund per order, ≤ amount paid, plus status sync.
- `_shared/razorpay.ts` holds the client, HMAC verification and paise helpers.
- There is a unique index on `razorpay_payment_id`.
- **Checkout feedback:**
  - On failure, show Razorpay's own error description.
  - If the customer dismisses the payment window, show "Payment cancelled" and leave the order
    PENDING. The customer can retry from Orders.

## 16. WhatsApp (Meta Cloud API — built, off)
The reference spec §11 carries over in full:
- Tables: templates, queue, logs, preferences, campaigns, abandoned carts.
- Every trigger listed there, minus `cod_verification` advance wording.
  - `cod_verification` becomes a plain "confirm your COD order" message.
- Jobs: `whatsapp-process-queue` (5 min cron, retries with backoff), `abandoned-cart-scan` (hourly),
  `whatsapp-webhook`. An inbound "STOP" sets the customer's marketing opt-out.
- **Off switch:** while `WHATSAPP_ENABLED` is false, every message is logged as `skipped`.
- **Admin tabs:** Logs, Queue (with retry), Templates, Campaigns, Settings.

## 17. SEO, analytics, performance, security, ops
- **SEO:** a `useSEO` hook (title, description, canonical, OG, Twitter). JSON-LD for Product (an
  Offer per retail variant), Organization and BreadcrumbList. `sitemap.xml` comes from an edge
  function behind a Vercel rewrite; `robots.txt` is static.
- **Analytics:** GA4/GTM ecommerce events as in the reference spec, inert until an ID is set in settings.
- **Performance:** responsive images via `mediaUrl`, lazy-loading below the fold, video posters, and
  `prefers-reduced-motion` respected.
- **Rate limits:** a `rate_limits` table and `check_rate_limit(key, max, window_seconds)` on the
  pincode check, notify-me, newsletter, review submission and `create_order`.
- **pg_cron:**
  - WhatsApp queue: every 5 min
  - Abandoned carts: hourly
  - Unpaid online order expiry: hourly
  - Tracking poll: every 3 h
  - Rate-limit cleanup: daily
- **Vercel:** SPA rewrite, asset caching, security headers, and a CSP allowing Supabase, Razorpay
  and Google.
- **Security review (last phase):**
  - Every RLS policy and every `SECURITY DEFINER` function is reviewed against a checklist.
  - The client bundle is grepped for anything except publishable keys.

## 18. Build phases
One phase at a time. At the end of each, run lint, typecheck, unit tests and a production build, and
report plainly what passed and what failed. The store can take real COD orders at the end of **phase 4**.

1. **Foundation:**
   - TypeScript, router (all current URLs preserved), providers, ESLint/Vitest/Playwright.
   - Supabase client, roles/profiles/addresses/settings migrations, signup trigger.
   - Auth pages, admin shell + guard, test admin, buckets + `media_assets` + `useUpload`.
   - Delete dead components; remove the currency switcher, engraving and delivery tiers.
2. **Catalog:**
   - Schema, triggers and `save_product`; seed the current 16 products as **sample** data with
     notes, profile and variants.
   - Admin: Products, Categories, Collections, Notes, Scent profile.
   - Storefront: listings, filters, product page, search, quick-buy, wishlist.
3. **CMS:**
   - Registry, schema-driven editor, every existing section as a section type, plus the new types.
   - Story page, global tabs, navigation/mega nav, footer, stories, reels, testimonials/FAQ,
     content pages, media library, theme codemod.
4. **Cart, samples, orders:**
   - Cart store + mirror, `quote_order`, the sample programme (admin + bag picker), `create_order`
     (COD), checkout.
   - Order success and account orders/addresses/profile.
   - Admin Orders, Inventory, invoice template + printable invoice and packing slip.
5. **Coupons:** general, welcome offer, birthday, the `available_coupons` sheet.
6. **Online payments:** the Razorpay functions and checkout path, switched off.
7. **Shipping:** adapter + pure core, manual/India Post flow, Delhivery (staging, unverified), PACKED
   trigger, serviceability, webhook/poll, customer tracking.
8. **Returns:** cancellations, returns (photos, approval, reverse pickup, restock vs write-off),
   refunds, replacement orders.
9. **Reviews and back-in-stock.**
10. **WhatsApp:** templates, queue, cron, webhook, campaigns, abandoned carts. Switched off.
11. **Admin extras:** dashboard, customers, notifications bell, data export.
12. **Launch hardening:**
    - SEO, analytics, rate limits, the security review, a 360 px pass and `vercel.json`.
    - SETUP.md: every account step, every secret and the function that uses it, deploy commands,
      cron SQL, the SMTP and Pro-upgrade steps, a staging-project recommendation, and the go-live
      checklist.
    - README: architecture, and how to make a user an admin.

## 19. Testing
- **Vitest (pure logic):**
  - money/paise, `paymentLabel`, coupon reason text, HMAC against a known vector
  - shipping payload builders and status mapping per courier
  - sample entitlement (a TS mirror of the SQL rule, checked against the same table of cases)
  - similar-scent scoring, IST/birthday helpers, link resolution, the CMS schema → form generator
- **SQL tests** (`supabase/tests`, inside `BEGIN … ROLLBACK`):
  - `quote_order` and `create_order` cases: stock, coupons, the sample examples in §7, COD minimum
  - transitions, the customer guard trigger
  - RLS checks as anon, customer and admin
- **Playwright:**
  - Home renders seeded CMS content with no console errors.
  - Product → bag → samples → checkout → COD order placed. The order is tagged as a test and
    cleaned up afterwards.
  - The admin route is guarded.
  - No horizontal scroll at 360 px.
- **Never in automated tests:** live shipments or real payments. The first real Delhivery shipment
  and India Post booking are done together with the owner.

## 20. Left to the builder
- Exact field lists of each section type (read from the current component), admin page layouts,
  query keys and caching, file names, the order-number sequence start.
- How the theme codemod is implemented, as long as the five tokens drive every place those colours
  appear today.
- Seed wording, as long as every seeded item is visibly marked **sample** in the admin.

## 21. Still needed from the owner (none block the build)
- Domain, business/legal name, GSTIN, registered address, seller state, consumer-care contact, and
  confirmation of HSN 3303 / 18% with their CA.
- Policy texts (shipping, returns, privacy, terms) and the exact return rules.
- Real products, photos and videos to replace the sample data.
- Keys: Razorpay (test, then live), Delhivery token + pickup location + API docs, India Post (business
  API or manual), Meta WhatsApp (phone number ID, token, approved templates), Google OAuth client,
  GA4/GTM IDs, an SMTP provider.
- The Supabase Pro upgrade before launch.
- Confirmation of the four sample-programme defaults in §4.
