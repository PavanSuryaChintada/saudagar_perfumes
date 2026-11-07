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
- [ ] Tests run at the end (owner: all testing after the last phase)

## Phase 4: Bag, samples, orders
- [ ] Bag saved to account
- [ ] Server-side prices (quote)
- [ ] Free 5 ml samples: earned per 50 ml
- [ ] Sample picker in bag ("Surprise me")
- [ ] Free-shipping progress bar
- [ ] Checkout: address → payment → review
- [ ] Cash on delivery orders
- [ ] Order success page
- [ ] My orders + order details
- [ ] Cancel order (while pending)
- [ ] Admin: orders (live updates, status changes)
- [ ] Admin: inventory (stock in/out with reasons, history)
- [ ] Admin: free samples page
- [ ] Invoice (GST) + packing slip print

## Phase 5: Coupons
- [ ] Coupon codes (percent / flat)
- [ ] Limits, dates, min order, first order
- [ ] Category scope + excluded products
- [ ] Personal codes
- [ ] "Apply coupon" sheet with best offers
- [ ] Welcome offer on signup (code shown in account)
- [ ] Birthday coupons (code shown in account)
- [ ] Admin: coupons pages

## Phase 6: Online payments (Razorpay, off until keys)
- [ ] UPI / cards / netbanking / wallets
- [ ] Payment verify + webhook
- [ ] Auto refund if out of stock
- [ ] Admin refunds

## Phase 7: Shipping
- [ ] Manual courier mode (enter tracking number)
- [ ] India Post flow
- [ ] Delhivery (off until token)
- [ ] Pincode check (product page + checkout)
- [ ] Auto status updates
- [ ] Tracking link for customers
- [ ] Admin: shipping settings

## Phase 8: Returns and refunds
- [ ] Return request with photos
- [ ] Approve / reject
- [ ] Restock or write off
- [ ] Refund or replacement order
- [ ] Admin: returns, refunds pages

## Phase 9: Reviews and back-in-stock
- [ ] Verified-buyer reviews with photos
- [ ] Longevity / sillage feedback
- [ ] Admin approval
- [ ] Ratings on products
- [ ] Helpful votes
- [ ] Wishlist saved to account
- [ ] "Notify me when back" (request saved; shown in admin)

## Phase 10: Admin extras
- [ ] Dashboard charts + KPIs
- [ ] Customers list + birthdays
- [ ] Notifications bell
- [ ] Data export (CSV)

## Phase 11: Launch
- [ ] SEO tags, sitemap, product schema
- [ ] Google Analytics events
- [ ] Rate limits
- [ ] Security review
- [ ] 360 px mobile pass
- [ ] Vercel config
- [ ] SETUP.md (keys, accounts, go-live checklist)

---

## Removed by owner
- ~~WhatsApp automation (templates, order messages, abandoned bag, campaigns)~~, removed 2026-11-07
- Kept: floating "chat on WhatsApp" button (plain link)
