# Saudagar Perfumes — setup and go-live

Everything is built. Integrations that need the owner's accounts are **switched off** and start
working when their keys are added. This page lists every account, key and switch, then the go-live
checklist.

## 1. Accounts

| Account | Used for | Status |
|---|---|---|
| Supabase (project `ijwbzjwpqscekkqgiuzq`, Mumbai) | Database, auth, storage, edge functions, cron | Live (free plan) — **upgrade to Pro before launch** |
| Vercel | Hosting the store | Connect the GitHub repo, framework = Vite |
| Razorpay | Online payments | Add keys (§3) |
| Delhivery | Automatic courier booking | Optional — add token (§4) |
| SMTP provider (e.g. Resend, Zoho, SES) | Password reset and sign-up emails | Add in Supabase → Auth → SMTP |
| Google Analytics 4 / Tag Manager | Analytics | Optional — paste the ID in Admin → Settings |

## 2. Local development

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:5174
```

`.env.local` (never committed):

| Variable | Where it comes from |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project settings → API (the publishable key only) |
| `SUPABASE_PROJECT_REF` | the project id |
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access tokens (used by the scripts below) |
| `SUPABASE_DB_PASSWORD`, `DATABASE_URL` | Supabase → Database settings |

Scripts:

| Command | Does |
|---|---|
| `npm run db:apply` | Applies new files in `supabase/migrations` (checksummed; never edit an applied file — add a new one) |
| `npm run db:test` | Runs every `supabase/tests/*.test.sql` inside a rolled-back transaction |
| `npm run db:types` | Regenerates `src/lib/database.types.ts` |
| `npm run functions:deploy [name…]` | Deploys edge functions |
| `npm test` / `npm run e2e` | Unit tests / Playwright tests |
| `npm run lint` / `npm run typecheck` / `npm run build` | Checks and production build |
| `node --env-file=.env.local scripts/create-admin.mjs` | Creates or repairs the admin user |
| `node --env-file=.env.local scripts/configure-auth.mjs` | Auth settings (site URL, password length, email confirmation) |

## 3. Razorpay (online payments)

1. In Razorpay, create API keys (test first, then live).
2. In Supabase → Edge Functions → Secrets add:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET` (any long random string; the same value goes into Razorpay)
3. In Razorpay → Webhooks add `https://ijwbzjwpqscekkqgiuzq.supabase.co/functions/v1/razorpay-webhook`
   with events `payment.captured`, `payment.authorized`, `payment.failed`, `refund.processed`,
   `refund.failed`, and the webhook secret from step 2.
4. Admin → Settings → **Online payment** → on.
5. Place a test order with Razorpay test cards; check it becomes *Paid* and stock moves.

How it behaves:
- Online orders reserve nothing until paid.
- If a product sells out between payment and confirmation, the payment is refunded automatically.
- Unpaid online orders are cancelled after 24 hours.

## 4. Shipping

**Default (no setup):**
1. Mark the order *Packed*.
2. Print the invoice and packing slip, then book the parcel with any courier.
3. Press *Mark shipped* and enter the tracking number. The customer gets the tracking link.

India Post is set to *prepaid only* until you confirm it collects cash for you
(Admin → Shipping → couriers).

**Delhivery (optional, automatic booking):** the integration is written from Delhivery's public
developer documentation and is **unverified**. Check every endpoint against the API documents issued
with your account before relying on it.

1. Supabase secrets: `DELHIVERY_TOKEN`, `SHIPPING_HOOK_SECRET` (long random string).
2. Supabase → Database → Vault: add a secret named `shipping_hook_secret` with the **same** value.
3. Admin → Shipping:
   - Pickup location name, exactly as registered with Delhivery.
   - Mode *Staging*.
   - *Book with Delhivery* on.
   - Status updates: webhook or poll.
4. Webhook option: ask Delhivery to push status to
   `https://ijwbzjwpqscekkqgiuzq.supabase.co/functions/v1/shipment-status-webhook?secret=<SHIPPING_HOOK_SECRET>`.
5. Test a staging order end to end, then switch the mode to *Production*.

**Perfume is flammable.** Before go-live, get written confirmation from Delhivery and India Post of
what they accept and by which mode (usually surface only). Products marked *Ships by surface only*
show the longer delivery estimate and are booked as surface with Delhivery.

## 5. Email (SMTP)

Supabase's built-in email is rate-limited and not for production.
1. Add your SMTP provider in Supabase → Auth → SMTP settings.
2. Then turn email confirmation on (`scripts/configure-auth.mjs` sets `mailer_autoconfirm`; set it to `false`).

## 6. Domain

1. Add the domain in Vercel.
2. Change `https://saudagarperfumes.com` in `public/robots.txt` to the real address.
3. Set the Supabase secret `SITE_URL` (used by the sitemap) to the real address.
4. Set the Supabase Auth site URL and redirect URLs to the real address (`scripts/configure-auth.mjs`).

## 7. Content to replace before launch

- Products: the 16 products are sample content from the original site (marked in each product's
  internal note). Replace names, prices, photos, notes, stock and compliance details.
- Policy pages (Admin → Pages): contact, shipping, returns, privacy, terms contain placeholders.
- Admin → Settings → Business: GSTIN, legal name, address, state. Invoices warn until these are filled.
- Admin → Site content → Brand: support email (currently an `.example` address), address, social links.
- Coupons: `SAMPLE10` is a switched-off sample. The welcome offer gives 10% off the first order — adjust or switch off in Coupons → Welcome offer.
- Testimonials and announcements are seeded switched off; only publish real customer words.
- Boutiques page stays hidden until Brand → *Show boutiques* is on.

## 8. Go-live checklist

- [ ] Supabase Pro plan; daily backups on
- [ ] SMTP set, email confirmation on
- [ ] Domain, robots.txt, `SITE_URL`, auth URLs (§6)
- [ ] Razorpay live keys + webhook, test payment and refund (§3) — or keep COD only
- [ ] Courier confirmation for perfume in writing (§4)
- [ ] All placeholder content replaced (§7)
- [ ] Admin password changed from the test password; only real admins have the admin role
- [ ] `npm run db:test`, `npm test`, `npm run e2e`, `npm run build` all green
- [ ] Submit `https://<domain>/sitemap.xml` in Google Search Console
- [ ] GA4 ID in Admin → Settings (optional)

## 9. Security notes

- The browser only ever sees the Supabase **publishable** key. Service-role keys, Razorpay secret,
  Delhivery token and hook secrets live only in Supabase secrets / Vault.
- Every table has row-level security.
  - Customers read only their own orders, addresses, carts, returns, reviews in progress and personal coupons.
  - There is no public coupon list.
- Money, stock and order status change only inside database functions:
  - Stock goes through one logged path.
  - Orders are guarded by a trigger.
  - Payment confirmation, refunds and courier updates are callable by the service role only.
- Admin functions check `is_admin()` inside the function, not only in the UI.
- Public write paths are rate-limited per user or IP: orders, returns, reviews, back-in-stock,
  newsletter and helpful votes.
- Vercel sends HSTS, no-sniff, frame-deny, a referrer policy and a CSP. The CSP allows only Supabase,
  Razorpay, Google Fonts and Google Analytics.
- Customer uploads go to the customer's own folder.
  - Return photos are private: shown to admins with short-lived links.
  - Review photos are public and limited to images.
