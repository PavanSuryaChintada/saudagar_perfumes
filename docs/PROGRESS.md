# Saudagar Store: Build Progress

`[x]` done · `[ ]` not yet · ◐ = phase in progress

**Overall: phases 1–2 done, phase 3 next, 9 phases left (11 total; WhatsApp automation removed by owner)**

---

## Phase 1: Foundation ✅ (merged, PR #1)
- [x] TypeScript, lint, unit tests, browser tests
- [x] Supabase database (Mumbai region)
- [x] Roles: admin / customer
- [x] Profiles, address book, store settings
- [x] Row-level security on every table
- [x] Migration runner (blocks edited migrations)
- [x] Sign up (email + password only)
- [x] Login, forgot password, reset password
- [x] Account: personal details
- [x] Birthday (set once, locked)
- [x] Address book (one default)
- [x] Admin panel at /admin (guarded)
- [x] Admin: dashboard
- [x] Admin: settings page
- [x] Admin: media library (Supabase Storage uploads)
- [x] Image compression on upload
- [x] Real page URLs + old link redirects
- [x] 404 page
- [x] Removed: currency switcher
- [x] Removed: engraving
- [x] Removed: priority / special-pack delivery
- [x] Removed: unused components, mock data
- [x] Test admin login (test@gmail.com)

## Phase 2: Catalog ✅ (issue #2)
- [x] Categories (tree)
- [x] Collections (hero, video, old-link aliases)
- [x] Notes library + note families
- [x] Scent profile options (family, accords, concentration, intensity, longevity, sillage, season, day/night, occasion, gender)
- [x] Products + bottle sizes (ml variants)
- [x] Sample vials (5 ml) as stock items
- [x] Compliance fields (MRP, origin, manufacturer, HSN, GST…)
- [x] Story fields (perfumer, year, inspiration, how to wear)
- [x] Stock changes only with a reason, every change logged
- [x] Sold sizes hidden, never deleted
- [x] Sold products: archive only
- [x] Search (names, notes, families, collections)
- [x] Filters: AND across types, OR within a type
- [x] Similar scents ranking
- [x] Sample catalog: current 16 products moved into the database
- [x] Storefront reads products from the database
- [x] Shop / category / note / search pages
- [x] Filters saved in the URL
- [x] Product page: note pyramid, accords, profile, compliance, similar, recently viewed
- [x] Fake reviews removed ("No reviews yet")
- [x] Admin: products list
- [x] Admin: product editor
- [x] Admin: categories
- [x] Admin: collections
- [x] Admin: notes
- [x] Admin: scent profile options

## Phase 3: CMS (everything editable) ✅
- [x] Page builder (add / reorder / hide / duplicate / delete sections)
- [x] Every home section editable
- [x] Story page editable
- [x] New pages (landing pages, text pages)
- [x] Policy pages (shipping, returns, privacy, terms) — placeholder text to replace
- [x] Header, mega menu, mobile menu
- [x] Footer
- [x] Announcement bars (with dates)
- [x] Stories viewer content
- [x] Instagram reels content
- [x] Testimonials, FAQs
- [x] Theme colours + fonts
- [x] Brand: logo, socials, contact
- [x] Preloader on/off
- [x] SEO per page
- [x] Stockists / boutiques section (hidden until filled)
- [x] Search suggestions editable
- [x] Tests run at the end (owner: all testing after the last phase)

## Phase 4: Bag, samples, orders ✅
- [x] Bag saved to account
- [x] Server-side prices (quote)
- [x] Free 5 ml samples: earned per 50 ml
- [x] Sample picker in bag ("Surprise me")
- [x] Surprise samples weighted by vial stock
- [x] Free-shipping progress bar
- [x] Checkout: address → payment → review
- [x] Cash on delivery orders
- [x] Order success page
- [x] My orders + order details
- [x] Cancel order (while pending)
- [x] Admin: orders (live updates, status changes)
- [x] Admin: inventory (stock in/out with reasons, history)
- [x] Admin: free samples page
- [x] Invoice (GST) + packing slip print
- [x] Product editor: category first, then scent type, notes, details
- [x] "Offer as a free sample" switch per product
- [x] Copy details from another product
- [x] Own product-page sections per product + store defaults
- [x] "Shop all" buttons go where the admin chooses
- [x] New CMS sections start with sample content

## Phase 5: Coupons ✅
- [x] Coupon codes (percent / flat)
- [x] Limits, dates, min order, first order
- [x] Category scope + excluded products
- [x] Personal codes
- [x] "Apply coupon" sheet with best offers
- [x] Welcome offer on signup (code shown in account)
- [x] Birthday coupons (code shown in account)
- [x] Admin: coupons pages

## Phase 6: Online payments (Razorpay, off until keys) ✅
- [x] UPI / cards / netbanking / wallets (Razorpay checkout)
- [x] Payment verify + webhook
- [x] Auto refund if out of stock
- [x] Admin refunds
- [x] Stock, samples and coupon taken only when paid
- [x] Unpaid online orders cancelled after 24 h
- [x] "Pay now" on unpaid orders
- [ ] Owner: add Razorpay keys + webhook secret, then switch on in Settings

## Phase 7: Shipping ✅
- [x] Manual courier mode (enter tracking number)
- [x] India Post flow (prepaid until its COD is confirmed)
- [x] Delhivery (off until token; marked unverified)
- [x] Pincode check (product page + checkout)
- [x] Blocked and no-COD pincode lists
- [x] Auto status updates (webhook or 30-min poll)
- [x] Tracking link for customers
- [x] Admin: shipping settings + pincode test
- [x] Retry shipment on courier errors
- [ ] Owner: Delhivery token, pickup location, written OK for shipping perfume

## Phase 8: Returns and refunds ✅
- [x] Return request with photos (within the return window)
- [x] Approve / reject (message to customer)
- [x] Courier pickup, or customer posts it back with tracking
- [x] Restock or write off (logged)
- [x] Refund (Razorpay or UPI / bank) or ₹0 replacement order
- [x] Admin: returns, refunds pages

## Phase 9: Reviews and back-in-stock ✅
- [x] Verified-buyer reviews with photos
- [x] Longevity / sillage feedback
- [x] Admin approval (approve / hide / reject)
- [x] Ratings on products (approved only)
- [x] Helpful votes
- [x] Wishlist saved to account (merges on sign-in)
- [x] "Notify me when back" (request saved; shown in admin)

## Phase 10: Admin extras ✅
- [x] Dashboard chart + KPIs (7 / 30 / 90 days)
- [x] Top products, notes, cities, states
- [x] Warnings (checkout paused, sample list empty, GSTIN missing, courier errors)
- [x] Customers list + birthdays + CSV
- [x] Notifications bell (live)
- [x] Data export (CSV of every main table) + orders CSV

## Phase 11: Launch ✅
- [x] SEO tags, canonical, Open Graph, sitemap, product + breadcrumb + organisation schema
- [x] Google Analytics events (off until an ID is set)
- [x] Rate limits (orders, returns, reviews, notify-me, newsletter, votes)
- [x] Security review (RLS, definer functions, bundle has no secrets)
- [x] 360 px mobile pass (storefront + admin)
- [x] Vercel config (rewrites, caching, HSTS, CSP)
- [x] SETUP.md (keys, accounts, go-live checklist) + README
- [x] Full test pass: lint, typecheck, 219 unit, 11 SQL files, build, 31 browser tests

## Phase 12: Hardening, clearer errors, smoother admin ✅ (issue #22)
- [x] Coupons held from placement for online orders too (no stacking a one-use code on unpaid orders)
- [x] Payments: duplicate payments refunded, no second charge after an unconfirmed payment, capture race, refunds only for real refusals
- [x] Refund ledger: several partial refunds, never more than paid; Razorpay statuses read-only; automatic refund on cancel; Refunds due list
- [x] COD limits (largest COD order, open COD orders per customer); first-order offers checked by phone number
- [x] Function and table permissions locked down (test keeps it so); real-IP rate limits; storage listing closed
- [x] Advisors: per-row auth checks, duplicate policies and unindexed foreign keys fixed; pg_net moved
- [x] Auth: exact redirect URLs (no *.vercel.app wildcard), passwords need letters and numbers
- [x] Every error translated into plain sentences; no raw SQL on screen
- [x] Dashboard setup checklist; exports complete at any Max rows; customer GST invoice; admin button on the account page
- [x] Sign-out always works (offline or expired session) and clears cached data
- [x] Demo deployments hidden from search engines until `VITE_ALLOW_INDEXING=true`
- [x] docs/SUPABASE.md: every production setting
- [x] Full test pass: lint, typecheck, 236 unit, 12 SQL files, build, 31 browser tests

## Owner to-do before going live (see docs/SETUP.md and docs/SUPABASE.md)
- [ ] Run `npm run hook:secret` (automatic refunds); delete the unused Singapore Supabase project
- [ ] Supabase Pro, SMTP, domain
- [ ] Razorpay keys + webhook (or stay COD only)
- [ ] Courier confirmation for shipping perfume; Delhivery token (optional)
- [ ] Replace sample products, policy text, GSTIN and business details
- [ ] Change the test admin password

---

## Removed by owner
- ~~WhatsApp automation (templates, order messages, abandoned bag, campaigns)~~, removed 2026-11-07
- Kept: floating "chat on WhatsApp" button (plain link)
