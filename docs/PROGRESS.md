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

## Phase 13: Admin made easy ✅
- [x] Guide page (12 steps in the order to do them, with live progress) and "How this page works" on every page
- [x] One search for the whole admin (Ctrl+K): products, SKUs, orders, customers, categories, notes, scent options, collections, coupons, pages, admin pages
- [x] Searchable pickers instead of long radio/checkbox lists, with "+ Add" to create a missing category, collection or note in place
- [x] Product: one main category + any number of "Also list under" categories, both searchable
- [x] Menu reordered: Daily → Catalog setup (in order) → Marketing → Website → Settings; sidebar scrolls
- [x] Products page shows what to set up before the first product; editor warns about unsaved changes and jumps to the first error
- [x] Admin button only for admins (tested both ways)
- [x] Tests: 240 unit, 12 SQL files, 33 browser tests

## Phase 14: Bulk tools, dashboards, scrolling, pagination ✅ (PR #27)
- [x] Bulk order and product actions; spreadsheet prices/stock and product import
- [x] Dashboard views: Today, Orders pipeline, Payments & refunds, Stock & products
- [x] Native scrolling in the admin; pagination on every list and on the shop, notes and account orders

## Phase 15: Liquid stock, simpler product editor, invoice editor ✅
- [x] Perfume stock is the liquid (ml, L or tola); every bottle and free sample takes its ml; a size is sold out once less is left than it holds
- [x] Sets and accessories counted in pieces; switch per product
- [x] Stock history per product with totals for orders vs samples
- [x] Product editor: category → name → sizes & prices (SKU fills itself) → stock → photos → scent → notes; the rest folded under More details; Copy from… on every section
- [x] Store-wide label details (Settings → Product details) used by every product page
- [x] Phone pictures for every page, site-content, story, category and collection image
- [x] Invoice editor with live preview: every line on the invoice and packing slip
- [x] Readability: sentence-case labels and headings, darker text, visible scroll bars, clearer toggles
- [x] Tests: 263 unit, 14 SQL files, 33 browser tests

## Phase 16: Premium Gift Pack and suggested samples ✅
- [x] Gift pack page (/gift-pack): customers choose any 5 perfumes (repeats allowed), 20 ml each
- [x] Price: each perfume costs 66.67% of its 30 ml price, minus the pack discount; only perfumes with a 30 ml size can be chosen
- [x] Each pick is poured from that perfume's own stock; boxes aren't counted; cancelling or a returned pack puts it back
- [x] One free 10 ml sample per pack, chosen like "Surprise me", never one of the pack's perfumes
- [x] The pack's ml doesn't earn normal samples
- [x] "Try our Premium Gift Pack" card in the bag, hidden once a pack is in the bag
- [x] Free samples start filled with suggestions (chosen like "Surprise me"); customers can swap them by searching the sample list
- [x] Order page, invoice, packing slip and admin order list each pack's perfumes and its sample
- [x] Admin → Gift pack: every rule, word and picture editable, with a live price preview and warnings
- [x] Bag problems that don't belong to one line are now shown, so checkout is never blocked without a reason
- [x] Fixed: removing a sold size of a perfume no longer pours its liquid away
- [x] Tests: 284 unit, 15 SQL files, 33 browser tests

## Phase 17: Professional admin, shop words, CMS everywhere ✅
- [x] Admin look: dark sidebar with clear section headings, fixed top bar, panels with header strips, ₹ amounts
- [x] Column headings on every admin list; labelled Edit / Delete buttons; coloured Shown / Hidden / stock labels
- [x] Gift pack words are plain sentences; the numbers show automatically from the rules (no codes)
- [x] Site content → Shop words: bag, buttons, empty pages, checkout, wishlist, notes page and page-not-found wording
- [x] Every category and collection page opens with its own picture or film (phone picture optional)
- [x] Product page in the CMS (Pages → Product page): composition, reviews, “You may also appreciate”, recently viewed, plus any section; reorder, hide, add
- [x] Category & collection pages in the CMS (Pages → Category & collection pages): add sections above or below the banner and products
- [x] Ready-made sections: Best sellers, New arrivals, Gift ideas, Trending now; search and pick the products
- [x] Each product can hand-pick its “You may also appreciate” products; automatic when none are picked
- [x] Clearer section names; “Products I pick” is the first choice in every products section

## Phase 18: One Website screen ✅
- [x] Admin → Website (CMS): tabs Pages, Content, Site settings, Media
- [x] Pick a page, click a section on the left (numbered, eye to show/hide, arrows to move), edit it on the right with Shown on site, View on site, copy, delete and save
- [x] Content (announcements, stories, reels, testimonials, FAQs, boutiques) and Site settings (theme, brand, menus, footer, shop words, SEO) work the same way
- [x] Lists inside a section are cards (Tile 1, Tile 2 …) with move, copy and remove; text lists are numbered
- [x] Leaving with unsaved changes asks first; old admin addresses forward to the new screen
- [x] Tests: 302 unit, 16 SQL files, 33 browser tests

## Phase 19: Easier links, mega menu, tidy notifications, order steps ✅
- [x] Every button and link: “Button text”, then “Button goes to” with simple choices (Product, Category, Collection, Note, Page, Shop page, Other website, Nothing) and a search; no addresses to type
- [x] Mega menu and Phone menu named clearly in Site settings, with a Mega menu shortcut in the sidebar
- [x] Notifications about deleted orders and products are removed with them (test orders no longer fill the bell)
- [x] Orders: the bulk bar only offers steps the chosen orders can still take (no “Mark packed” on packed orders)
- [x] Shipping: plain explanation of the tracking number (AWB) and what happens once Delhivery is connected

## Phase 20: Ready to connect payments, couriers and tracking ✅
- [x] Admin → Connections: Razorpay, Delhivery, India Post and tracking IDs, each with status, what to send, webhook address and a Test button (keys never shown)
- [x] One-step setup: `npm run connect -- razorpay | delhivery | analytics | check` tests each key before saving it (see docs/INTEGRATIONS.md)
- [x] Each order is booked only with its own courier; pick the courier when packing (before, every packed order would have gone to Delhivery)
- [x] India Post wired in and waiting for its business API documents; works by hand meanwhile
- [x] Meta Pixel next to Google Analytics (visits, add to bag, checkout, purchase)
- [x] Parcel weight counts sold items only (samples and gift-pack pours ride inside)
- [x] Catalog setup steps numbered 1–4 in the sidebar

## Phase 21: Google listings in plain words, clearer sample list ✅
- [x] “How it shows on Google” on products, categories, collections and pages: a live Google preview written automatically from the page; “Write my own words” with a plain length guide
- [x] The shop uses the same automatic words, and now honours the words written for categories and collections (they were ignored before)
- [x] Site settings → Google & sharing in plain words
- [x] Free samples list in clear columns: perfume, liquid left, samples it can give, offered

## Phase 22: Shop polish and many more filters ✅
- [x] One small corner everywhere (no mix of pill and square shapes); faint grey text darkened; tiny text enlarged; category strip labels no longer cut off; calmer spacing between home sections
- [x] Filters: offers (on sale, new arrivals, in stock), category, collection, price (bands or your own range), size, fragrance family, accords, notes (searchable), note families, intensity, concentration, longevity, sillage, occasion, season, day or night, wear it as
- [x] Filter panel redesigned: larger text and checkboxes, counts in boxes, choices with no match hidden, chips for short choices, search and “show all” in long lists
- [x] Sort is a proper menu (Featured, Newest, Best sellers, Price low to high, Price high to low); clear Filters button and “Filtered by” chips

## Owner to-do before going live (see docs/SETUP.md and docs/SUPABASE.md)
- [ ] Run `npm run hook:secret` (automatic refunds); delete the unused Singapore Supabase project
- [ ] Supabase Pro, SMTP, domain
- [ ] Send Razorpay, Delhivery and India Post details (see docs/INTEGRATIONS.md); GA4 / Meta Pixel IDs
- [ ] Courier confirmation for shipping perfume; Delhivery token (optional)
- [ ] Replace sample products, policy text, GSTIN and business details
- [ ] Change the test admin password

---

## Removed by owner
- ~~WhatsApp automation (templates, order messages, abandoned bag, campaigns)~~, removed 2026-11-07
- Kept: floating "chat on WhatsApp" button (plain link)
