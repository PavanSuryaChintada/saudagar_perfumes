# Saudagar Perfumes

The online store for Saudagar Perfumes: an Indian perfume shop with cash on delivery, free 5 ml
samples, coupons, reviews, returns, and an admin panel that controls the whole storefront.

- **Storefront:** React 19 + Vite + Tailwind, every section and link editable from the admin (CMS).
- **Backend:** Supabase.
  - Postgres with row-level security, auth and storage.
  - Edge functions (Deno) for Razorpay, shipping and the sitemap.
  - pg_cron and pg_net.
- **Hosting:** Vercel.

Setup, keys and the go-live checklist: [docs/SETUP.md](docs/SETUP.md).
What is built, phase by phase: [docs/PROGRESS.md](docs/PROGRESS.md).
Design spec: [docs/superpowers/specs/2026-11-07-saudagar-store-design.md](docs/superpowers/specs/2026-11-07-saudagar-store-design.md).

## Layout

```
src/
  App.jsx, components/      storefront pages and sections (existing design)
  storefront/               bag, checkout, orders, account, catalog, CMS pages
  cms/                      section registry, field schema, links, theme runtime
  admin/                    admin panel (/admin)
  lib/                      Supabase client, auth, money, orders, invoice, SEO, analytics
supabase/
  migrations/               numbered SQL migrations (apply with npm run db:apply)
  tests/                    SQL tests (npm run db:test)
  functions/                edge functions + _shared helpers
  seed/                     CMS seed sources
e2e/                        Playwright tests
scripts/                    database, auth and deploy scripts
```

## Commands

```bash
npm run dev          # storefront + admin on http://localhost:5174
npm run build        # production build
npm test             # unit tests
npm run e2e          # browser tests (builds and previews first)
npm run db:apply     # apply new migrations
npm run db:test      # SQL tests
```

Admin panel: `/admin` (sign in with an admin account).
