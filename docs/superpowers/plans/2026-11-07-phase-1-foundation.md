# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the existing storefront a real foundation:
- TypeScript, lint and test tooling, and real routes
- Supabase schema for roles, profiles, addresses and settings, with RLS
- auth pages
- a guarded admin shell with working Settings and Media library pages
- a shared upload hook on Supabase Storage
- removal of the features the owner cut

**Architecture:**
- **App shape:** one Vite app. The storefront keeps its existing JSX components. A pure
  `resolveStorefrontView()` maps URLs onto the existing "view" switch, so the look is untouched. The
  admin is a lazy-loaded route tree at `/admin/*`.
- **Database changes:** SQL migrations live in `supabase/migrations`. A small Node runner applies
  them through the Supabase Management API and records a checksum for each, so an applied migration
  can never be edited.

**Tech Stack:**
- Already present: React 19, Vite 8, Tailwind 3.
- Added:
  - TypeScript 5.9 (allowJs)
  - react-router 7, @tanstack/react-query 5
  - @supabase/supabase-js 2, zod 3, react-hook-form 7, sonner, lucide-react
  - Vitest 5 + Testing Library + jsdom, Playwright, ESLint 9 + typescript-eslint

**Spec:** `docs/superpowers/specs/2026-11-07-saudagar-store-design.md` (§3, §5, §6, §11.5, §14 settings,
§18 phase 1).

## Global Constraints

- **Prices:** INR only. The display format stays exactly as today: `RS. ` + an en-IN grouped
  integer, e.g. `RS. 5,500`.
- **Indian formats:** a phone is stored as 10 digits matching `^[6-9][0-9]{9}$`; a pincode matches
  `^[1-9][0-9]{5}$`. All dates are IST.
- **Database safety:**
  - Every table has RLS enabled.
  - Every `SECURITY DEFINER` function has `set search_path = ''` and schema-qualifies every name.
  - Migrations are idempotent and never edited once applied (the runner enforces this by checksum).
- **Secrets:** only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` may reach the bundle. The
  service-role key is never written to disk.
- **No browser dialogs:** no `window.alert/confirm/prompt`. Use styled dialogs and `sonner` toasts
  (admin) or the existing `Toast` (storefront).
- **Look:** the storefront look must not change, apart from removing the cut features.
- **Mobile:** every new page works at 360 px wide with no sideways scroll.
- **Commits:** no Claude co-author trailer.

## Review Focus

1. A signed-out visitor opening any `/admin/*` URL lands on `/admin/login` and returns to that URL
   after signing in. They never see a blank page. *(Task 7 e2e test.)*
2. A signed-in customer who is not an admin gets "You don't have access" at `/admin`, and RLS refuses
   their writes to `settings`. *(Task 2 SQL test, Task 7 component test.)*
3. Refreshing or deep-linking any route, such as `/product/x`, `/collections/y` or `/admin/settings`,
   renders it. Old `?id=` and `?collection=` links redirect. *(Task 6 unit tests, `vercel.json` rewrite.)*
4. Phone input written as `+91 98765 43210`, `098765-43210` or `9876543210` all normalise to
   `9876543210`. `12345` and `5876543210` are rejected with a message. *(Task 5 unit test.)*
5. Uploading a file over 50 MB, or a type the browser can't decode (e.g. HEIC), is refused with a
   readable message, and the rest of a multi-file upload continues. *(Task 3 unit test.)*

---

### Task 1: Tooling — TypeScript, ESLint, Vitest, scripts, env example, Vercel rewrite

**Files:**
- Create: `tsconfig.json`, `tsconfig.node.json`, `eslint.config.js`, `vitest.config.ts`, `src/vite-env.d.ts`, `.env.example`, `vercel.json`, `src/lib/money.ts`, `src/lib/money.test.ts`
- Modify: `package.json` (scripts + deps), `.gitignore` (add `playwright-report`, `test-results`)

**Interfaces:**
- Produces: `formatINR(amount: number): string` in `src/lib/money.ts`. Scripts: `lint`,
  `typecheck` (`tsc --noEmit -p tsconfig.json`), `test` (`vitest run`), `build`, `db:apply`,
  `db:test`, `e2e`.

- [ ] Step 1: Install deps (exact majors above). Write `money.test.ts`:
  `formatINR(5500) === 'RS. 5,500'`, `formatINR(125000) === 'RS. 1,25,000'`, `formatINR(4999.6) === 'RS. 5,000'`, `formatINR(0) === 'RS. 0'`.
- [ ] Step 2: `npx vitest run src/lib/money.test.ts` → FAIL (module missing).
- [ ] Step 3: Implement `formatINR` (round, `toLocaleString('en-IN')`). The tsconfig needs `allowJs: true`, `checkJs: false`, `jsx: react-jsx`, `strict: true`, and includes `src`. ESLint: TS rules for `.ts/.tsx`, the recommended JS rules for `.jsx` with `no-unused-vars` as a warning, and react-hooks rules everywhere. `vercel.json` rewrites `/(.*)` → `/index.html`.
- [ ] Step 4: `npm run test && npm run typecheck && npm run lint && npm run build` → all pass.
- [ ] Step 5: Commit `chore: add TypeScript, ESLint, Vitest and project scripts`.

### Task 2: Migration runner + foundation schema (roles, profiles, addresses, settings)

**Files:**
- Create: `scripts/lib/mgmt.mjs`, `scripts/db-apply.mjs`, `scripts/db-test.mjs`, `supabase/migrations/0001_foundation.sql`, `supabase/tests/0001_foundation.test.sql`

**Interfaces:**
- **Scripts (`scripts/lib/mgmt.mjs`):** `runSql(query: string): Promise<any[]>` POSTs to
  `/v1/projects/$SUPABASE_PROJECT_REF/database/query` and throws on error. It is used by all scripts,
  which run with `node --env-file=.env.local`.
- **`db:apply`:** creates `public._app_migrations(name text primary key, checksum text, applied_at timestamptz)`
  if missing. It applies each unapplied file in name order and refuses if an applied file's sha256
  changed.
- **`db:test`:** runs each `supabase/tests/*.sql` wrapped in `begin; … rollback;`. A test fails by
  raising.
- **SQL types and functions:**
  - type `public.app_role` (`admin`, `customer`)
  - `public.has_role(_uid uuid, _role public.app_role) returns boolean`
  - `public.is_admin() returns boolean` (callable by anon/authenticated)
  - `public.set_updated_at()` trigger fn
  - `public.site_bootstrap() returns jsonb`, which returns `{settings: {key: value}}` for public settings
- **Tables:** `user_roles`, `profiles`, `addresses`, `settings`, with columns per spec §6 / §14.

- [ ] Step 1: Write `0001_foundation.test.sql`. Each assertion is a `do $$ … assert …; $$`.
  - **Signup trigger:** inserting into `auth.users` (meta `full_name`, `phone: '+91 98765 43210'`)
    creates a profile with phone `9876543210` and a `customer` role.
  - **DOB lock:** acting as that user (`set local role authenticated` + `request.jwt.claims`),
    setting `date_of_birth` succeeds and sets `dob_locked = true`. A second change raises
    `DOB_LOCKED`.
  - **Single default address:** that user's second address with `is_default = true` leaves
    exactly one default. Their first address was made default automatically.
  - **RLS:** as anon, `select key from settings` returns only `is_public` rows. As the customer,
    `update settings` affects 0 rows. As the customer, selecting another user's profile returns 0
    rows. `public.is_admin()` is false for the customer.
- [ ] Step 2: `npm run db:test` → FAIL (relations missing).
- [ ] Step 3: Write `0001_foundation.sql`:
  - Extensions: `pg_trgm`, `unaccent` in schema `extensions`.
  - Enum, tables, explicit grants, RLS policies.
  - **`handle_new_user`** (after insert on `auth.users`): normalises phone with the same rules as
    `normalizeIndianPhone` in Task 5, stores null if invalid, copies email.
  - **`profiles_guard`** (before update): only when `auth.uid()` is not null and the caller isn't
    admin. It locks email, enforces the DOB lock and blocks direct `dob_locked` edits.
  - **`addresses_single_default`** triggers: the first address becomes default; a new default
    clears the others; deleting the default promotes the newest remaining address.
  - **Seed settings** (`on conflict do nothing`). `=` marks the value; `public` is readable by anon.
    - Public:
      - `store.name` = "Saudagar Perfumes"
      - `shipping.fee` = 250, `shipping.free_threshold` = 4999, `shipping.default_eta` = {min:3, max:7}
      - `cod.enabled` = true, `cod.min_order` = 0
      - `returns.window_days` = 7
      - `samples.enabled` = true, `samples.ml_per_sample` = 50, `samples.sample_size_ml` = 5,
        `samples.max_per_order` = 4, `samples.allow_duplicates` = true
      - `payments.online_enabled` = false
      - `auth.google_enabled` = false
      - `media.transforms_enabled` = false
      - `whatsapp.floating_number` = ""
      - `analytics.ga4_id` = "", `analytics.gtm_id` = ""
    - Private:
      - `inventory.low_stock_threshold` = 5
      - `orders.prefix` = "SAU-"
      - `whatsapp.enabled` = false
- [ ] Step 4: `npm run db:apply && npm run db:test` → applies 0001, all assertions pass. A second
  `db:apply` prints "nothing to apply".
- [ ] Step 5: Commit `feat(db): migration runner and foundation schema with RLS`.

### Task 3: Storage buckets, media_assets, upload helpers

**Files:**
- Create: `supabase/migrations/0002_storage.sql`, `supabase/tests/0002_storage.test.sql`, `src/lib/media/upload.ts`, `src/lib/media/upload.test.ts`, `src/lib/media/useUpload.ts`

**Interfaces:**
- **Buckets:**
  - `media`: public, 50 MB, image/* + mp4/webm/quicktime.
  - `reviews`: public, 10 MB, jpeg/png/webp.
  - `returns`: private, 50 MB, images + video.
- **`storage.objects` policies:**
  - `media`: write by admin.
  - `reviews` and `returns`: write under the uploader's own `auth.uid()` folder.
  - `returns`: read by owner or admin.
- **Table:** `public.media_assets(id, bucket, path, url, kind, mime, bytes, width, height, alt, uploaded_by, created_at, unique(bucket,path))`, admin-only RLS.
- **Pure helpers (`src/lib/media/upload.ts`):**
  - `fitWithin(w: number, h: number, max = 2400): {width: number, height: number}`
  - `validateUpload(file: {size: number, type: string}, opts: {maxBytes: number, accept: string[]}): string | null` returns the error message or null
  - `buildStoragePath(originalName: string, ext: string, now: Date, rand: string): string` returns `images|videos/YYYY/MM/<slug>-<rand>.<ext>`
  - `publicUrl(bucket: string, path: string): string`
- **Browser functions:**
  - `compressImage(file: File): Promise<{blob: Blob, width: number, height: number}>`: WebP 0.82; SVG/GIF are passed through.
  - `uploadWithProgress(bucket, path, body, contentType, accessToken, onProgress): Promise<void>`: XHR POST to `/storage/v1/object/{bucket}/{path}`.
- **Hook:** `useUpload({bucket}) → {upload(files: File[]): Promise<MediaAsset[]>, items: {name, progress, error?}[]}`. It records each upload in `media_assets`.

- [ ] Step 1: Write the tests.
  - Unit:
    - `fitWithin(4800,3200)` = `{width:2400,height:1600}`; `fitWithin(800,600)` is unchanged.
    - `validateUpload({size:60*1024*1024,type:'video/mp4'},…)` mentions "50 MB".
    - `validateUpload({size:1000,type:'image/heic'},…)` returns "Use JPG, PNG, WebP…".
    - `buildStoragePath('Deep Canopy Hero!.PNG','webp',new Date('2026-11-07T10:00:00Z'),'ab12')` = `images/2026/11/deep-canopy-hero-ab12.webp`.
  - SQL: the three buckets exist with the right `public` flags. A customer can't insert into
    `media_assets`.
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement the migration and helpers.
- [ ] Step 4: `npm run test && npm run db:apply && npm run db:test` → PASS.
- [ ] Step 5: Commit `feat(media): storage buckets, media_assets and upload helpers`.

### Task 4: Auth configuration + test admin

**Files:**
- Create: `scripts/configure-auth.mjs`, `scripts/create-admin.mjs`

**Interfaces:**
- **`configure-auth.mjs`:** PATCHes `/v1/projects/{ref}/config/auth` with `mailer_autoconfirm: true`,
  `site_url` (default `http://localhost:5174`, overridable via `SITE_URL`) and
  `uri_allow_list` (localhost + `*.vercel.app`).
- **`create-admin.mjs <email> <password>`:**
  - Fetches the service-role key in memory from `/v1/projects/{ref}/api-keys?reveal=true`.
  - Creates or finds the user via `/auth/v1/admin/users` with `email_confirm: true`.
  - Inserts the `admin` role with `on conflict do nothing`.

- [ ] Step 1: Run `node --env-file=.env.local scripts/configure-auth.mjs` → prints the updated settings.
- [ ] Step 2: Run `node --env-file=.env.local scripts/create-admin.mjs test@gmail.com test1234` → "admin ready". Run it again → still "admin ready" (idempotent).
- [ ] Step 3: Verify with SQL: `select public.has_role(id,'admin') from auth.users where email='test@gmail.com'` → true.
- [ ] Step 4: Commit `chore(auth): auth config and create-admin scripts`.

### Task 5: Supabase client, AuthProvider, phone helper, auth pages

**Files:**
- Create:
  - Libs: `src/lib/supabase.ts`, `src/lib/phone.ts`, `src/lib/phone.test.ts`, `src/lib/errors.ts`, `src/lib/errors.test.ts`, `src/lib/auth.tsx`
  - Pages: `src/storefront/auth/AuthLayout.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`

**Interfaces:**
- **Client:** `supabase` (typed client), which throws at import if the env vars are missing.
- **Phone:** `normalizeIndianPhone(input: string): string | null`.
- **Errors:** `toFriendlyError(err: unknown): string` maps Supabase auth errors to readable
  sentences: invalid login credentials, user already registered, weak password, rate limit; plus
  coded SQL exceptions like `DOB_LOCKED: …`, where the text after the code is shown.
- **Auth:** `<AuthProvider>` and `useAuth() → {session, user, profile, isAdmin, loading, signIn(email, pw), signUp({fullName, email, phone, password}), signOut(), sendReset(email), updatePassword(pw), refreshProfile()}`.
  - `isAdmin` comes from `rpc('is_admin')`.
  - The reset `redirectTo` is `${origin}/reset-password`.
- **Auth pages:**
  - They honour `?next=`.
  - The look follows the existing storefront: white, `#111111` ink, `#C4823F` accent, uppercase
    tracked labels, square buttons.

- [ ] Step 1: Write the tests.
  - `normalizeIndianPhone`: the five cases in Review Focus item 4.
  - `toFriendlyError({message:'Invalid login credentials'})` → "That email and password don't match."
  - `toFriendlyError({message:'DOB_LOCKED: Date of birth can only be set once'})` → "Date of birth can only be set once".
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement the helpers, provider and pages. Register validates with zod (name ≥ 2,
  email, phone via `normalizeIndianPhone`, password ≥ 8) and passes `full_name` and `phone` as user
  metadata.
- [ ] Step 4: `npm run test && npm run typecheck` → PASS.
- [ ] Step 5: Commit `feat(auth): supabase client, auth provider and auth pages`.

### Task 6: Real routes for the storefront (URLs preserved)

**Files:**
- Create: `src/app/routes.ts`, `src/app/routes.test.ts`, `src/app/AppRouter.tsx`, `src/storefront/NotFoundPage.tsx`
- Modify: `src/main.jsx` → `src/main.tsx` (BrowserRouter, QueryClientProvider, AuthProvider, Toaster), `src/App.jsx` (derive view from `useLocation`, replace `pushState` with `navigate`)

**Interfaces:**
- **`resolveStorefrontView`:** `resolveStorefrontView(pathname: string, search: string, productExists: (id: string) => boolean): {view: StorefrontView, productId?: string, collectionSlug?: string, redirectTo?: string}`.
  - `StorefrontView` is one of: `'home'|'product'|'collection'|'wishlist'|'story'|'account'|'checkout'|'login'|'register'|'forgot-password'|'reset-password'|'notfound'`.
- **`<AppRouter>`:** `/admin/*` loads the admin (lazy, from Task 7); everything else goes to `App`.

- [ ] Step 1: Write the tests.
  - `/` → home.
  - `/product/saudagar-deep-canopy` → product. An unknown product → notfound.
  - `/?id=saudagar-deep-canopy` → redirectTo `/product/saudagar-deep-canopy`.
  - `/?collection=royal` → redirectTo `/collections/royal`.
  - `/collections/` → collection `signature` (today's fallback).
  - `/about` → story. `/profile` → account.
  - `/login`, `/register`, `/forgot-password`, `/reset-password` → their views.
  - `/nope` → notfound.
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement. `App.jsx` keeps every existing show/hide rule (header, footer, bottom nav)
  and its title effects. `account` and `checkout` redirect to `/login?next=…` when signed out.
- [ ] Step 4: `npm run test && npm run build`. Manually: `npm run dev`, visit `/`, `/product/saudagar-deep-canopy`, `/collections/royal`, `/?id=saudagar-amber-bark`, `/zzz`. Each renders as before, and the 404 renders for the last.
- [ ] Step 5: Commit `feat(routing): real routes with legacy URL redirects and 404`.

### Task 7: Admin shell, guard, Settings page, Media library page

**Files:**
- Create:
  - App and layout: `src/admin/AdminApp.tsx`, `src/admin/AdminLayout.tsx`, `src/admin/RequireAdmin.tsx`, `src/admin/RequireAdmin.test.tsx`
  - Pages: `src/admin/pages/AdminLoginPage.tsx`, `src/admin/pages/DashboardPage.tsx`, `src/admin/pages/SettingsPage.tsx`, `src/admin/pages/MediaLibraryPage.tsx`
  - Settings: `src/admin/settings/schema.ts`, `src/admin/settings/schema.test.ts`
  - Shared UI: `src/admin/ui/*` (Button, Field, ConfirmDialog, PageHeader)
  - E2E: `e2e/admin.spec.ts`, `e2e/storefront.spec.ts`, `playwright.config.ts`

**Interfaces:**
- **Guard:** `<RequireAdmin>` renders children if `isAdmin`. Signed out, it navigates to
  `/admin/login?next=<path>`. Signed in but not an admin, it renders "You don't have access".
- **Settings schema:** `SETTINGS_SCHEMA: {group: string, fields: {key: string, label: string, type: 'text'|'number'|'boolean'|'json', help?: string, min?: number}[]}[]`. It covers every key seeded in Task 2.
- **`parseSettingInput`:** `parseSettingInput(field, raw: string|boolean): {ok: true, value: unknown} | {ok: false, error: string}`.
- **Sidebar nav:** only the built pages for now: Dashboard, Settings, Media library. The section
  headings come from spec §14.
- **Dashboard:** a welcome message and a setup checklist (Razorpay, Delhivery, WhatsApp, SMTP, Pro
  plan). The checklist is static text until the integrations-status function lands.
- **Media library:** a grid of `media_assets` with search and multi-upload with per-file progress
  (`useUpload`). It also has copy URL, edit alt text, and delete, which removes the storage object
  and the row after a ConfirmDialog.

- [ ] Step 1: Write the tests.
  - `RequireAdmin` with a mocked `useAuth`:
    - signed out → navigates to `/admin/login?next=%2Fadmin%2Fsettings`
    - customer → "You don't have access"
    - admin → children
  - `parseSettingInput`: number field with `'-5'` and `min: 0` → error; `'250'` → 250; boolean passes through.
  - E2E:
    - `/admin` signed out → URL is `/admin/login?next=%2Fadmin`.
    - Sign in with `test@gmail.com`/`test1234` → "Dashboard" heading.
    - Home at a 360 px viewport → `document.documentElement.scrollWidth <= 360`.
    - `/?id=saudagar-amber-bark` → URL `/product/saudagar-amber-bark`.
- [ ] Step 2: Run the unit tests → FAIL.
- [ ] Step 3: Implement. The admin look is plain: white, `#111111`, `#C4823F` accent, the site's
  sans font, hairline borders. On mobile the sidebar collapses into a drawer.
- [ ] Step 4: `npm run test && npm run e2e` → PASS.
- [ ] Step 5: Commit `feat(admin): guarded admin shell, settings and media library`.

### Task 8: Remove cut features and dead code; wire account profile and addresses

**Files:**
- Delete:
  - The 24 unused components (spec §5.2 list; keep `BluorngStores`, `ValueProps`, `CampaignBanner`).
  - `src/data/products.js`, `product.html`, `src/main.js`, `src/product.js`, `src/styles/main.css`, `src/styles/product.css`.
- Modify:
  - `src/data/bluorngSaudagarData.js`: drop `CURRENCIES` and the currency storage functions; `formatPrice(amount)` delegates to `formatINR`; the default cart is `[]`.
  - Every component that takes `activeCurrency` or `onCurrencyChange`.
  - `BluorngPDP.jsx` (engraving accordion), `BluorngCartDrawer.jsx` (engraving line; the gift note becomes "Add a note for us"), `BluorngCheckoutPage.jsx` (courier-protocol tiers and the +₹500), `BluorngAccountPage.jsx`, `BluorngQuickBuyModal.jsx`.
- Create: `src/storefront/account/useAccount.ts`

**Interfaces:**
- **Consumes:** `useAuth()` and `toFriendlyError()` from Task 5; tables `profiles` and `addresses`
  from Task 2.
- **`useAccount`:** `useAccount() → {profile, addresses, saveProfile(patch), saveAddress(addr), deleteAddress(id), setDefault(id)}`, built on TanStack Query.
- **Account page tabs:** Orders (empty state until phase 4), Addresses (real CRUD), Profile & settings (name, phone, DOB set-once, WhatsApp opt-in). The engraving tab and currency selector are removed.

- [ ] Step 1: `grep -rn "activeCurrency\|onCurrencyChange\|CURRENCIES\|engrav\|shippingMethod\|White-Glove" src` → this list is what Step 2 removes.
- [ ] Step 2: Remove and rewire, keeping layout and classes untouched elsewhere.
- [ ] Step 3: Run the same grep → no matches. Then `npm run lint && npm run typecheck && npm run test && npm run build` → PASS.
- [ ] Step 4: Manually: register a new customer, add two addresses (the second as default → only one default), set DOB, try changing DOB → friendly "can only be set once" message.
- [ ] Step 5: Commit `refactor: remove currency, engraving and delivery tiers; wire account to Supabase`.

### Phase close-out
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build && npm run db:test && npm run e2e`. Record pass/fail for each.
- [ ] Push the branch `phase-1-foundation`, `gh pr create` (summary + verification results, no Claude attribution), `gh pr merge --merge --delete-branch`.
