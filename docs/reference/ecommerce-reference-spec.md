# Reference spec (supplied by the owner, 2026-11-07)

> This is the feature-depth reference the owner supplied. It is reproduced verbatim below.
> **Where it differs from `docs/superpowers/specs/2026-11-07-saudagar-store-design.md`, the design
> doc wins.** Key overrides:
> - Supabase Storage replaces Cloudinary.
> - India-only, plain COD with no advance.
> - The existing Saudagar look is kept; there is no fresh identity.
> - The free-sample programme is added.
> - Reviews are added.
> - Journal, community and influencer pages are deferred.

---

You are building a complete, production-ready e-commerce website and admin panel for [BRAND NAME], an Indian perfume brand. It is a fresh build for a new client. It must match the feature depth of a clothing store we already shipped: storefront, fully editable CMS, coupons, payments, shipping, returns, WhatsApp automation, inventory and invoices. It needs its own visual identity and perfume-specific catalog features. Do not copy the old store's branding, wording or layouts.

## 0. Before you write code

1. Ask me for anything below that you don't have: brand name, domain, logo, colours and fonts (or permission to propose them), Supabase project, Razorpay keys (test first), Delhivery API token and registered pickup location, India Post business-account details (if any), Meta WhatsApp Business phone number ID and token, Cloudinary cloud name and unsigned upload preset, GSTIN and invoice details, return policy. Use clearly marked placeholders for anything missing. Never block on credentials.
2. Write a short design spec and a phased build plan (§15), show it to me, and wait for my OK.
3. At the end of every phase, run lint, typecheck, unit tests and a production build. Tell me plainly what passed and what failed.

## 1. Stack

- Frontend: React 18, Vite, TypeScript, Tailwind, shadcn/ui (Radix), react-router v6, TanStack Query, zustand (cart), react-hook-form with zod, framer-motion and/or GSAP, Recharts (admin charts), sonner, date-fns, lucide-react.
- Backend: Supabase. That means Postgres with RLS, SQL functions/RPCs and triggers; Auth (email+password and Google OAuth); Realtime; Edge Functions (Deno); pg_cron; pg_net; Vault.
- Media: Cloudinary unsigned uploads for every admin image and video, with on-the-fly transforms (f_auto, q_auto, responsive widths).
- Payments: Razorpay. Shipping: Delhivery and India Post. Messaging: WhatsApp Business Cloud API (Meta).
- Hosting: Vercel (SPA rewrites, security headers). Analytics: GA4 and GTM with ecommerce events.
- Tests: Vitest (with Testing Library) for pure logic, Playwright for e2e.

## 2. Ground rules (non-negotiable)

- Money is computed only on the server. The browser never decides a price, discount, shipping fee or amount to charge.
- Every table has RLS. Content tables are public-read and admin-write, using one has_role(uid, 'admin') helper over a user_roles table (roles: admin, customer). Customer data is own-row only. The browser can never insert into orders or order_items directly.
- Components contain no demo content. Everything a visitor reads comes from the database and is editable in the admin. Seed migrations fill in sensible starting content, marked as sample content.
- Migrations are idempotent (if not exists / drop … if exists), applied in order, and never edited after they are applied.
- Secrets live only in Supabase Edge Function secrets or Vault. Only publishable keys go in the client bundle.
- Indian defaults: ₹ INR; IST for every date, coupon window and report; +91 10-digit phones; 6-digit pincodes; GST invoices.
- Mobile first. Every storefront and admin page works at 360px wide, nothing sits under the bottom tab bar, and the page never scrolls sideways.
- Use styled dialogs only, never window.alert/confirm/prompt. Map DB exceptions to friendly error messages through one helper.
- Edge functions share one CORS helper and consistent JSON errors (401, 403, 400, 409, 502, 500). Public endpoints are rate-limited.

## 3. Perfume catalog (replaces the clothing size system)

### 3.1 Products and variants
- A variant is a bottle size in ml (e.g. 8 ml travel, 30 ml, 50 ml, 100 ml). Concentration is an optional second axis, for a scent sold as both EDT and EDP.
- Each variant has: SKU, price (follows the product's base price unless overridden), compare-at/MRP, stock, gross weight in grams, box dimensions and optional images of its own.
- Product-level stock and "available sizes" are derived from variants by triggers and never written directly.
- Discovery sets, gift sets and decants are normal products.
- Product fields: slug, name, short and long description, image gallery, videos, featured flag, active flag, base price, compare-at.
- Categories form a tree (parent/child, image or video, description, position). A product has one primary category plus extra categories through a join table. Collections have their own pages.
- save_product RPC saves the product, variants, categories, notes and profile in one transaction and keeps variant ids stable, so carts and order history keep pointing at them.
- A variant that has already been sold is set to 0 stock and hidden, never deleted. Deleting a product that was ever sold is refused (archive it instead).

### 3.2 Notes (replaces the old "Sizes" admin)
- `notes` library: name, slug, family, short description, image, active, position. The admin "Notes" page supports CRUD, search, reorder and image upload, and rejects duplicate names case-insensitively.
- `product_notes` columns: product_id, note_id, tier ('top' | 'heart' | 'base'), position. The product editor has three search-select pickers (Top / Heart / Base), reordering within a tier, and an inline "add new note" option.
- Storefront:
  - Note pyramid on the product page (top → heart → base, with images).
  - /notes/:slug pages listing every perfume that contains the note.
  - Notes as a listing filter.
  - "Similar scents", ranked by shared notes plus same family.

### 3.3 Scent profile (all options admin-managed, nothing hardcoded)
- One `attribute_options` table (kind: family | accord | concentration | longevity | sillage | season | time_of_day | occasion | gender; label; slug; position; active). A link table `product_attributes` holds product_id, option_id, and a strength from 1–100 for accords.
- On the product page:
  - Fragrance family: primary plus optional secondary.
  - Main accords as strength bars.
  - Concentration (Extrait / Parfum / EDP / EDT / EDC / Attar / Body mist).
  - Longevity and sillage, labelled as the brand's own claims.
  - Seasons, day/night, occasions, and feminine/masculine/unisex.
  - Story fields: perfumer/nose, launch year, inspiration (rich text), how-to-wear tips.
- Every attribute is a filter on listing and search pages.

### 3.4 Compliance block (India)
- India's Legal Metrology (Packaged Commodities) rules require certain details on e-commerce listings. Show them in a "Details & compliance" accordion:
  - Net quantity (from the variant), MRP inclusive of taxes, and country of origin.
  - Manufacturer / packer / importer name and address, and consumer-care contact.
  - Best-before or shelf life, ingredients, allergens, "for external use only", flammability caution.
  - HSN code (perfumes are usually 3303) and GST rate.
- Confirm the exact list, HSN code and GST rate with the client and their CA. Make every field editable, not hardcoded.

## 4. Storefront

- **Home:** rendered entirely from CMS sections (§5).
- **Listing pages** (shop all, category, collection, note, search):
  - Filters: category, collection, notes, family, concentration, gender, season, occasion, price range, bottle size, in stock.
  - Sorts: featured, newest, price ↑/↓, best selling.
  - Filters sync to the URL. Include pagination and empty states.
- **Search:** over name, notes, family and collection, with suggestions in the navbar.
- **Product page:**
  - Gallery with image, video and zoom.
  - Bottle-size selector that updates price, stock and images; MRP strike-through and % off.
  - Stock state, with a "Notify me when it's back" WhatsApp opt-in.
  - Pincode check: courier serviceability, ETA and COD availability.
  - Note pyramid, accords, scent profile, story, compliance accordion, similar scents, recently viewed.
  - Add to bag / buy now / wishlist / share, with a sticky add-to-bag bar on mobile.
- **Bag:** cart drawer and bag page. Quantities 1–99, capped by stock; live server quote (§6); coupon sheet; free-shipping progress bar.
- **Checkout (sign-in required):** Address → Payment → Review → Pay.
- **Orders:** order success page; orders list and detail with status timeline, payment label, courier and tracking link, cancel while PENDING, return request inside the window, invoice download.
- **Account:**
  - Name and phone.
  - Date of birth, set once and locked afterwards.
  - Address book with labels (Home/Work/Other); a trigger enforces a single default.
  - WhatsApp marketing opt-in/out.
- **Wishlist:** DB-backed.
- **Auth:** login, register (name, email, phone, password), Google sign-in, forgot/reset password. A trigger creates the profile and customer role on signup.
- **Content pages:** journal/lookbook, plus About, Contact, Shipping policy, Returns policy, Privacy and Terms, all editable from the CMS. Razorpay KYC needs the policy pages live.
- **Global:** announcement bar(s), mega menu, CMS-driven footer, floating WhatsApp button, mobile bottom nav, configurable preloader, 404, error boundary.

## 5. CMS (everything editable)

- **Page builder:** `website_sections` (page, section_type as text not enum, position, is_visible, config jsonb). One registry maps each section_type to its component, admin label and description, and a field schema. The admin form is generated from the schema, so a new section type needs only a component and a registry entry.
- **Field types:**
  - Basic: text, textarea/rich text, number, boolean, select, colour.
  - Media: upload an image or video with a real progress bar, or paste a URL.
  - Link picker: page / category / collection / note / product / custom URL.
  - Category picker; product picker (automatic with a count, or hand-picked with a max).
  - Reorderable repeatable lists with sub-fields; conditional fields (showIf).
- **Section actions:** add, reorder (up/down), hide/show, duplicate and delete sections, per page. Changes go live on save, with a "View on site" link. Clearing a field really removes it from the page. Defaults come from seed migrations, never from component code.
- **Section library.** Design these fresh for a fragrance house; at minimum:
  - Heroes and campaigns: cinematic video/image hero, campaign carousel, product belt marquee, text-reveal statement, promo banner.
  - Product showcases: collections grid, best sellers / new arrivals (auto or hand-picked), gift sets / discovery set promo, launch countdown with notify-me.
  - Scent content: shop by note (ingredient tiles linking to /notes/:slug), fragrance families, ingredient spotlight (image, story, products using it), scent story / editorial split.
  - Trust and community: store promise strip (authenticity, shipping, returns, payments), testimonials, FAQ, newsletter / WhatsApp opt-in, community UGC bento, influencer picks (video plus tagged products), Instagram reels, journal grid, boutiques/stockists.
- **CMS tabs:**
  - Theme: colour and font tokens applied at runtime as CSS variables.
  - Brand: name, logo, favicon, Instagram/WhatsApp/YouTube, support email, phone and hours, address.
  - Preloader: colour/image/video background, text or logo, duration.
  - SEO: per-page title, description and OG image, plus defaults.
  - Media library: every upload recorded in media_assets and reusable through a picker.
  - Content: testimonials and FAQs with CRUD, toggle and reorder.
  - Marketing: multiple announcement bars, ordered, with active toggle, optional link and optional start/end dates.
- **Dedicated admin pages for media-heavy content:**
  - Mega menu: tabs → heading groups → links. A tab is either a category tab or a custom link, with its own hero image and subhead. Each link has a hover image. A trigger caps featured products at 2 per tab.
  - Journal/lookbook: slides with image/video, caption, tagged product, active flag and order.
  - Community photos: handle and bento size (sm/md/lg/wide/tall); each field saves instantly.
  - Influencer picks: name, handle, uploaded video OR external link (exactly one, enforced by a CHECK constraint), thumbnail, quote and tagged products. The modal stays open after the first save so products can be tagged straight away.
- **Uploads:** one shared `useCloudinaryUpload` hook (XHR with real progress, env-based cloud name and preset) used by every uploader. No second implementation.

## 6. Cart, pricing and checkout

- **Cart storage:** the cart lives in zustand, persisted locally. For signed-in users it is mirrored to carts/cart_items, which the abandoned-cart messages need.
- **`quote_order(items, coupon_code, payment_method)`:** stable, security definer, callable by anon.
  - Prices every line from the DB.
  - Lists unavailable or short-stock lines separately instead of failing.
  - Applies the coupon (§8).
  - Shipping = the fee, unless (subtotal − discount) ≥ the free-shipping threshold.
  - Returns lines, unavailable, subtotal, coupon {ok, reason, message, discount}, discount, shipping, total, and cod {allowed, reason, min_order, advance_percent, advance}.
  - Bag, checkout and review show only this quote.
- **`create_order(...)`:** re-runs quote_order and saves exactly that result, with friendly errors:
  - Out of stock, with name, available and requested.
  - The coupon message plus "Remove it to continue".
  - The COD minimum.
  It inserts a PENDING order with a human-readable order number, and order_items snapshots (name, variant label like "50 ml · EDP", image, qty, price at purchase).
- **Checkout steps:**
  - Address: a saved address or a new one; validate the pincode and run courier serviceability.
  - Payment: Razorpay online, or COD with the advance amount shown. COD is disabled with the reason shown when it's off, below the minimum, or not supported for that pincode or courier.
  - Review, then Pay.

## 7. Payments (Razorpay)

- **Checkout methods:** UPI, cards, netbanking and wallets.
- **COD:** always takes an advance of cod_advance_percent (setting, default 20) through Razorpay. The balance is collected on delivery. Settings: cod_enabled, cod_min_order (0 = none).
- **`razorpay-create-order` (edge function):**
  - Input is {order_id} only; any amount sent is ignored.
  - The bearer user must own the order, and the order must be PENDING.
  - Amount in paise = total (prepaid) or the advance (COD), and must be ≥ 100.
  - Reuses the existing Razorpay order when the amount matches and it isn't paid, so double-clicks are safe.
  - Saves razorpay_order_id and returns {order, key_id}.
- **`razorpay-verify-payment`:**
  - Checks HMAC-SHA256(order_id|payment_id) with a constant-time compare.
  - The Razorpay order must match the stored one.
  - Fetches the payment from Razorpay: amount and order must match. Captures it if authorized; it must end up captured.
  - Idempotent: the same payment returns success, a different payment on an already-paid order returns 409.
- **`confirm_order_payment` (DB function, service_role only, row-locks the order):**
  - Decrements each variant's stock with a `stock >= qty` guard. If any line fails, it raises OUT_OF_STOCK, and the edge function refunds the payment automatically and tells the customer.
  - Increments coupon used_count and inserts coupon_redemptions, so coupons only count on paid orders.
  - Prepaid orders become PAID. COD orders get cod_advance_paid = true while payment_status stays PENDING.
- **`razorpay-webhook`** (payment.captured, payment.failed, refund.processed) with signature verification. It is the safety net for customers who close the tab after paying; it runs the same idempotent confirm path.
- **Safeguards:** a unique index on razorpay_payment_id. A trigger marks COD orders PAID when they become DELIVERED. A guard trigger lets a signed-in customer change only status PENDING → CANCELLED and nothing else.
- **`paymentLabel(order)` helper** (unit-tested), used on customer orders, admin orders and the invoice. States: Awaiting payment / Paid / Payment failed / Awaiting advance / "Advance ₹X paid · ₹Y due on delivery" / Paid in full / Refunded.
- **Checkout feedback:** show Razorpay's error description on payment.failed. Dismissing the modal shows "Payment cancelled" and leaves the order PENDING; the customer can retry from Orders.
- **`razorpay-refund` (admin only):**
  - refund {order_id, amount}: amount ≤ amount paid, one refund per order (409 if one exists). A full refund sets payment_status REFUNDED. Refund status is PROCESSING or REFUNDED depending on Razorpay's response.
  - sync: refreshes a PROCESSING refund.
- **Shared module:** `_shared/razorpay.ts` holds the API client, HMAC verify and the paise helpers.

## 8. Coupons (carry these rules over exactly)

- **Kinds:** one coupons table, with kind general | welcome | birthday.
- **Fields:**
  - Code: uppercase A–Z, 0–9, - and _, 2–40 characters, normalized by a trigger.
  - Type and value: PERCENT (≤ 100) or FLAT ₹; value > 0.
  - Limits: max-discount cap, min order (measured on eligible items only), total uses, uses per customer, first order only.
  - Window and visibility: starts/expires (IST), active; listed (shown in the checkout list) vs hidden (must be typed).
  - Ownership: assigned customer (personal code) and an admin note.
- **Scope:** the whole store, or chosen categories (child categories included). Specific products can be excluded.
- **Evaluation:** one SQL function, checking in this order. Each failure returns a reason code and a friendly message:
  1. Someone else's personal code (answered as "doesn't exist")
  2. Inactive
  3. Not started
  4. Expired
  5. Sign-in required
  6. Already used
  7. Fully redeemed
  8. First order only
  9. Nothing eligible in the bag
  10. Below the minimum order ("needs ₹X of eligible items")

  Discount = percent of the eligible amount (rounded) or the flat value, capped by max discount and by the eligible amount.
- **No public coupon list (RLS):** customers can read only their own personal codes. Everything else goes through quote_order, available_coupons and create_order.
- **Checkout "Apply coupon" sheet:** `available_coupons(bag)` returns listed general coupons plus the shopper's personal codes, each priced against the bag. Usable codes come first, biggest saving first. The others say why they can't be used yet. Codes that can never apply are hidden.
- **Admin save:** `save_coupon` RPC saves the coupon and its scope atomically. A duplicate code returns a friendly error.
- **Admin → Coupons tabs:**
  - Coupons: search; usage shown as x / y; status chips; edit modal with every field, category-scope search, excluded-product search and customer search for personal codes.
  - Welcome offer: settings (enabled, code prefix, valid days, min order, max discount, first order only) plus weighted tiers (label, type, value, target %, active).
    - On signup the DB issues exactly one personal PREFIX-XXXXXX code per customer, picking a tier by weight.
    - It queues a WhatsApp welcome_offer message with the code.
    - Stats show issued and used per tier. A tier that has issued codes is switched off instead of deleted.
  - Birthday:
    - The admin picks a date on a calendar and sees every customer born on that day.
    - The admin sets every coupon setting plus a prefix, then releases one personal code per customer per birthday year. Customers who already have one are skipped.
    - Each customer gets a WhatsApp birthday message with the code.

## 9. Shipping: Delhivery + India Post (no Shiprocket)

- **One courier adapter interface** in `_shared/shipping/`:
  - Methods: serviceability(pincode, cod) → {serviceable, cod, eta_days}; createShipment; schedulePickup; cancel; track; createReturn.
  - A pure, unit-tested core: parcel weight and dimensions from variant weights plus a packaging setting; COD collectable = total − advance paid; payload builders; mapping from each courier's raw status to our status.
- **Delhivery (fully automated):**
  - Uses the client's API token, staging first and then production. Take the endpoint list from the API docs Delhivery provides with the account; do not guess endpoints.
  - Wire up: pincode serviceability with COD and ETA (product page and checkout); forward shipment from the registered pickup location; AWB; pickup request; shipping label PDF; cancel; tracking; reverse pickup for returns; optional rate estimate.
  - Status updates come from Delhivery's push webhook if the account has it enabled, otherwise from a cron poll of undelivered AWBs. Build both and choose with a setting.
- **India Post (Speed Post / Registered Parcel):** for pincodes Delhivery can't reach, or by admin choice.
  - The default is assisted-manual mode, which needs no API:
    1. The admin picks India Post on the order and prints the address label and invoice from the admin.
    2. They book the parcel at the post office and enter the article number.
    3. The system saves it, builds the tracking link from a URL template in Shipping settings ({awb} placeholder), marks the order SHIPPED and sends the WhatsApp shipped message.
    4. The admin sets Delivered or RTO from the order page.
  - If the client has India Post business-customer API access, implement the same adapter. Ask me which case applies.
  - COD by India Post is allowed only if the client's contract supports it (a "COD allowed" setting per courier).
- **Routing:** a default courier setting. At checkout, check serviceability with the default courier. If the pincode isn't serviceable, fall back to India Post (prepaid only unless its COD is on). The admin can switch courier on any order before it ships.
- **Flow:**
  1. Paid (or advance-paid) orders sit in PENDING.
  2. The admin sets PACKED. A DB trigger (pg_net, authenticated with SHIPPING_HOOK_SECRET stored in Vault) calls `shipping-create`.
  3. For Delhivery, that creates the shipment, AWB and pickup. For India Post, the order shows "Awaiting booking".
- **Order columns:** courier, courier_order_id, awb_number, tracking_url, label_url, pickup_scheduled_at, shipped_at, out_for_delivery_at, delivered_at, rto_initiated_at, shipping_status (raw), shipping_error.
- **Errors never block the admin:** they are saved to shipping_error and shown with a "Retry shipment" button.
- **`shipment-status-webhook`:**
  - Authenticated by a shared secret, deployed with verify_jwt off.
  - Maps events: picked up / in transit → SHIPPED; out for delivery; delivered → DELIVERED (COD becomes PAID); RTO.
  - Always returns 200 for AWBs it doesn't recognise.
- **Cancel:** cancelling an order calls `shipping-cancel`.
- **Realtime:** orders is in the supabase_realtime publication, so the admin orders table updates live.
- **Perfume caution:** alcohol-based perfume is flammable, and couriers restrict it (often surface-only). India Post restricts inflammable articles. Before go-live, get written confirmation from Delhivery and India Post of what they accept and by which mode. Add a product-level "ships surface only" flag, pass surface mode to Delhivery, show the matching ETA, and record all of this in SETUP.md.

## 10. Cancellations, returns, refunds

- **Cancelling:**
  - The customer can cancel while the order is PENDING; the admin can cancel any time before delivery.
  - Cancelling restocks exactly once (stock_restored_at) and cancels the courier shipment.
  - The admin confirms a Razorpay refund of the online-paid amount.
- **Returns (perfume policy, wording editable; confirm the rules with the client):**
  - Accepted within return_window_days (setting) of delivered_at, only for damaged, leaking, wrong or missing items.
  - The customer picks a reason, writes details and uploads up to 3 photos/videos.
  - Statuses: NONE / REQUESTED / APPROVED / PICKUP_SCHEDULED / IN_TRANSIT / RECEIVED / REFUNDED / REPLACED / REJECTED.
- **Admin Returns page:**
  - Approve or reject, with a note the customer sees.
  - On approval, book a Delhivery reverse pickup, or ask the customer to send it by India Post and enter the article number.
  - Track the return.
  - When it is RECEIVED, choose "Restock" or "Write off (damaged)". Both are logged in inventory history. A leaked bottle never goes back into sale.
  - Resolve with either:
    - Refund: Razorpay refund for the online amount; a COD cash refund is recorded as a manual UPI/bank transfer with a reference.
    - Replace: a ₹0 replacement order with the same items, which takes stock and is set PACKED so it ships automatically.
- **Admin Refunds page:**
  - Lists every refund. The Manage dialog has "Refund via Razorpay" (amount prefilled with the amount paid, plus a confirm step) and "Refresh status" while PROCESSING.
  - Shows the Razorpay refund id. A manual status and notes field covers rejected refunds.

## 11. WhatsApp automation (Meta Cloud API)

- **Tables:**
  - notification_templates: name, trigger, language, body, variables, Meta template name, active.
  - notification_queue: status, attempts, next attempt, error.
  - whatsapp_logs: sent / delivered / read / failed, updated by the webhook.
  - Also: customer_notification_preferences, marketing_campaigns, abandoned_carts.
- **Triggers:**
  - Orders: order_placed, order_packed, order_shipped (with tracking link), out_for_delivery, order_delivered, order_cancelled.
  - Payments and refunds: payment_success, payment_failed, cod_verification, refund_initiated, refund_completed.
  - Returns: return_requested, return_approved, return_received.
  - Cart and catalog: abandoned_cart_1h/24h/48h, back_in_stock, new_arrivals.
  - Customer and marketing: welcome, welcome_offer (with code), birthday (with code), marketing_campaign.
- **Jobs and webhook:**
  - `process-queue` runs on pg_cron every 5 minutes, with retries and backoff.
  - `abandoned-cart-scan` runs hourly.
  - `whatsapp-webhook` checks the verify token and signature, records delivery statuses, and treats an inbound "STOP" as a marketing opt-out.
- **Off switch:** when WHATSAPP_ENABLED is false, everything is inert (messages are logged as skipped), so the site works before Meta approves the templates.
- **Admin WhatsApp page tabs:**
  - Logs.
  - Queue, with retry.
  - Templates: enable/disable and edit.
  - Campaigns: audience = all opted-in, bought product X, or no order in N days; send now or schedule.
  - Settings: shows whether each secret is set, never its value.

## 12. Admin panel

- **Access:** admin routes are guarded by has_role. Admin route code is code-split.
- **Nav:** Dashboard · Orders · Refunds · Returns · Categories & Collections · Notes · Scent profile (attribute options) · Products · Inventory · Coupons · Customers · Shipping · Invoice · Settings · WhatsApp · CMS · Mega menu · Journal · Community · Influencer picks.
- **Notifications bell:** admin_notifications plus Realtime, for new orders, failed shipments, return requests and low stock.
- **Dashboard:**
  - Period switch (7/30/90 days) and a revenue & orders chart.
  - KPIs: revenue, orders, average order value, pending orders, customers, low-stock count.
  - Breakdowns: orders by city (top 10) and by state (top 8), top products by revenue, top notes by revenue.
- **Orders:**
  - Search by order number, name, phone or email. Filters: status, payment, courier, date.
  - Status dropdown that allows only valid transitions.
  - Payment label, plus a shipping column (courier, AWB, tracking, error and Retry).
  - Live Realtime updates.
  - Detail drawer: items, address, timeline, internal notes.
  - Print invoice and label; CSV export.
- **Inventory:**
  - Per-variant stock table with search (product, SKU, size), a category filter and low-stock highlighting (threshold from a setting).
  - Add/remove stock with a reason (restock, damaged, tester/sample use, correction).
  - Full history per variant in inventory_movements: delta, stock after, reason, linked order, who and when.
  - Every stock write goes through one path that sets a reason, and a trigger logs it.
- **Customers:**
  - List with search; set or correct a birthday; order count and total spent.
  - CSV export.
- **Shipping settings:** default courier, pickup location, per-courier COD allowed, tracking URL templates, packaging weight and box defaults, webhook vs poll mode, and a pincode serviceability test tool.
- **Invoice template:**
  - Template fields: company name, tagline, address, phone, email, website, GSTIN, invoice prefix, tax label and rate, colours and logo.
  - A printable invoice page per order (save as PDF) showing a tax-inclusive breakdown and HSN per line.
- **Settings** (key/value table): shipping fee, free-shipping threshold, COD enabled, COD minimum, COD advance %, return window days, low-stock threshold, WhatsApp number for the floating button.
- **Data export panel:** CSV of every main table, as a backup.

## 13. SEO, analytics, performance, ops

- **SEO:**
  - A useSEO hook for per-page title, description, canonical, OG and Twitter tags.
  - JSON-LD: Product with an Offer per variant, Organization, BreadcrumbList.
  - A generated sitemap.xml and robots.txt.
- **Analytics:** GA4/GTM ecommerce events: view_item_list, view_item, add_to_cart, remove_from_cart, begin_checkout, add_shipping_info, add_payment_info, purchase (once per order), sign_up, login. An optional Google Merchant Center feed.
- **Performance:** Cloudinary responsive images, lazy-load below the fold, video posters, prefers-reduced-motion respected.
- **Accessibility:** contrast, focus states, keyboard navigation.
- **Rate limiting:** a rate_limits table plus check_rate_limit(key, max, window_seconds), applied to the pincode check, notify-me, newsletter and order creation.
- **pg_cron jobs:** WhatsApp queue (5 min), abandoned carts (hourly), tracking poll fallback (every few hours), rate-limit cleanup (daily).
- **Vercel:** SPA rewrite, asset caching, and security headers including a CSP that allows Razorpay, Cloudinary, Supabase and Google.

## 14. Visual direction

- This is a fresh identity for a fragrance house, not the clothing store's look.
- If I don't give you brand assets, propose 2–3 directions (palette, type pairing, motion style) and let me pick before you build the UI.
- Aim for calm, sensory and premium:
  - Generous whitespace.
  - An editorial serif display face with a clean sans.
  - A restrained palette drawn from the bottles and ingredients.
  - Slow cinematic motion (scroll reveals, video heroes), with bottle and ingredient photography doing the work.
- Every colour and font is a token that can be edited in CMS → Theme.

## 15. Build order (one phase at a time, verified before moving on)

1. Foundation: Supabase schema, roles, RLS pattern, auth (email and Google), profiles trigger, upload hook, layout shell, theme tokens.
2. Catalog: categories, collections, products, ml variants, notes, scent profile, compliance fields, save_product, admin product editor.
3. Storefront and CMS: section registry, schema-driven editor, all section types, theme/brand/SEO/media/preloader, mega menu, journal, community, influencer picks, listing/search/product pages.
4. Cart, quote_order, create_order, checkout, Razorpay (create, verify, confirm, webhook), payment labels.
5. Coupons: general, welcome offer, birthday, available_coupons sheet.
6. Shipping: courier adapter, Delhivery, India Post manual mode, triggers, webhook/poll, admin shipping UI, customer tracking.
7. Cancellations, returns (photos, approve, reverse pickup, restock vs write-off), refunds, replacement orders.
8. WhatsApp: templates, queue, cron, webhook, campaigns, abandoned carts, back in stock.
9. Admin dashboard, inventory, customers, invoice, settings, data export, notifications.
10. SEO, analytics, rate limits, security review of every RLS policy and SECURITY DEFINER function, mobile pass at 360px, launch checklist.

## 16. Testing

- **Vitest** for all pure logic: pricing helpers, paise conversion, HMAC verify against a known vector, paymentLabel, coupon reason text, shipping payload builders and status mapping per courier, COD collectable, similar-scent scoring, IST/birthday date helpers, search, link resolution.
- **Playwright:**
  - Home renders seeded CMS content with no console errors.
  - Product → bag → checkout reaches Razorpay in test mode.
  - The admin route is guarded.
  - No horizontal scroll at 360px.
- **Never in automated tests:** live shipments or real payments. The first real Delhivery shipment and the first India Post booking are done together with me.
- **Live test checklist** (Razorpay test mode):
  - Prepaid order → PAID, stock down, coupon count +1.
  - Replaying the verify request → success with no second stock decrement.
  - Tampered amount or signature → 400.
  - COD → advance charged, then marked paid on delivery.
  - Refund → refund id stored, status REFUNDED or PROCESSING.

## 17. Deliverables

- The repo: migrations, edge functions, frontend.
- SETUP.md covering:
  - Every external account step: Razorpay (keys, webhook), Delhivery (token, pickup location, webhook), India Post, Meta WhatsApp (app, webhook, a template list with sample text and category to submit for approval), Google OAuth, Cloudinary preset, GA4/GTM, Search Console.
  - Every secret, and which function uses it.
  - Every edge-function deploy command and the cron SQL.
  - A go-live checklist.
- README: architecture overview, and how to make a user an admin.
- Seed data: about 6 sample perfumes with notes, profile and variants, so every page renders on day one, clearly marked for the client to replace.
