# Supabase — production settings

The store runs on **one** Supabase project:

| | |
|---|---|
| Name | `saudagar-perfumers-mumbai` |
| Ref | `ijwbzjwpqscekkqgiuzq` |
| Region | Mumbai (ap-south-1) |
| Dashboard | https://supabase.com/dashboard/project/ijwbzjwpqscekkqgiuzq |

> The other project in the org, `saudagarperfumers's Project` (`wsufudoytvhezjkzdxox`, Singapore), is **not
> used by the store** (it only has the test admin and default settings). Changing settings there has no effect.
> Delete it: open that project → Project Settings → General → Delete project.

Each item says where to click, what to set, and why. "Done" means it is already set by the code or scripts.

---

## 1. Plan and billing — before launch

| Where | Set to | Why |
|---|---|---|
| Organization → Billing → Plan | **Pro** | Daily backups (7 days), no pausing after a week idle, more bandwidth, image resizing, leaked-password check. |
| Organization → Billing → Spend cap | **On** | No surprise bills. Turn it off only if you choose to pay for traffic spikes. |
| Project → Settings → Add-ons → Point-in-time recovery | Optional (paid) | Restore the database to any minute, not just last night. Worth it once orders are steady. |
| Project → Settings → Compute | Micro to start | Move to Small if Reports → Database shows CPU above ~70% for long periods. |

## 2. Data API (Integrations → Data API → Settings)

| Setting | Set to | Why |
|---|---|---|
| Exposed schemas | `public` only (remove `graphql_public`) | The store does not use GraphQL; fewer doors. |
| Extra search path | `public, extensions` | Leave as is. |
| **Max rows** | **1000** (fine up to 5000) | A safety cap on how many rows one request can return. The store never depends on it: every list and CSV export reads page by page, so exports are complete at any value. A high value like 50,000 only lets one request pull huge amounts of data, which is slower and costs bandwidth. |
| Pool size | Configured automatically | Leave empty. |
| Automatically expose new tables | **Off** | Every table the store uses already has its permissions set in the migrations. Off means a future table is private until someone grants access on purpose. |
| Harden Data API (custom schema) | Not needed | Access is controlled by row level security and explicit function permissions (see §7). |

## 3. Authentication

**URL configuration** — done by `npm run auth:configure` (run it again after you buy a domain):

```bash
SITE_URL=https://www.saudagarperfumes.com npm run auth:configure
```

- Site URL = the live address. Redirect URLs = that address and localhost only. **Never add a wildcard such as
  `https://*.vercel.app/**`**: anyone can create a Vercel site, and a password-reset link could be sent there.
  (This hole existed and is now closed.)

**Email** (Authentication → Emails → SMTP settings):

1. Add a custom SMTP provider (Resend, Brevo, Zoho or Amazon SES). The built-in mailer sends only to your own
   team's addresses, about 2 emails an hour.
2. Then turn on **Confirm email**: `CONFIRM_EMAIL=on SITE_URL=https://… npm run auth:configure`.
   This stops fake sign-ups with made-up addresses.
3. Authentication → Rate limits → *Emails sent per hour*: raise to about 30–60 once SMTP is in.
4. Authentication → Emails → Templates: put the store name and logo in the sign-up and reset emails.

**Passwords** (Authentication → Sign In / Providers → Email):

| Setting | Set to |
|---|---|
| Minimum length | 8 — done |
| Required characters | Letters and digits — done (the sign-up and reset forms check the same) |
| Leaked password protection | **On** (Pro plan) — refuses passwords found in data leaks |
| Secure email change | On — done |

**Sessions and attack protection**:

| Setting | Set to |
|---|---|
| Refresh token rotation | On — done |
| JWT expiry | 3600 seconds (default) |
| Bot protection (CAPTCHA) | Recommended after launch: Cloudflare Turnstile. Needs a small code change on the sign-up and sign-in forms; ask for it when you're ready. |
| Anonymous sign-ins | Off — done |

**Your own Supabase account** (avatar → Account → Security): turn on **two-factor authentication** for everyone in
the organization. Whoever can open the dashboard can read every order.

## 4. Database (Project → Settings → Database)

| Setting | Set to | Why |
|---|---|---|
| SSL enforcement | **On** | Direct database connections must be encrypted. |
| Network restrictions | Only the IPs that need direct database access | The store and the scripts use the HTTPS APIs, not direct connections, so you can restrict this tightly. |
| Database password | Long and random, stored in a password manager | Reset it here if it was ever shared. |

## 5. Edge function secrets (Edge Functions → Secrets)

| Secret | When |
|---|---|
| `SHIPPING_HOOK_SECRET` | **Now.** Run `npm run hook:secret`: it creates one random value and stores it in Vault and here. Without it, cancelled paid orders are not refunded automatically (they still show under Refunds → Refunds due). |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | When you go live with online payment. Use **live** keys only in production. |
| `RAZORPAY_WEBHOOK_SECRET` | Same time. In Razorpay → Webhooks, point to `https://ijwbzjwpqscekkqgiuzq.supabase.co/functions/v1/razorpay-webhook` with events `payment.authorized`, `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`. |
| `DELHIVERY_TOKEN` | Only if you book Delhivery automatically. |
| `SITE_URL` | The live address (used by the sitemap). |

## 6. API keys (Project → Settings → API keys)

- The website uses only the **publishable** key. The secret / service-role key must never be in the website,
  in Vercel's `VITE_` variables, or in chat.
- Keep the legacy `anon` / `service_role` keys **enabled**: the edge functions still use them.
- The personal access token in `.env.local` (`SUPABASE_ACCESS_TOKEN`) can change anything in your account.
  **Revoke it** (Account → Access tokens) when development is finished, and make a new one only when needed.

## 7. Security model (already in place)

- Every table has row level security. Visitors can't write any table directly; customers write only their own
  rows; orders, stock, coupons and refunds change only through server functions that check who is calling.
- Server functions are callable only by the roles that need them. `supabase/tests/0024_hardening.test.sql` fails
  if a new function or table is opened up by mistake.
- Prices, discounts, stock and free samples are always worked out on the server; the browser only sends what
  was chosen.
- Payments: Razorpay signatures and amounts are checked on the server; a payment that can't be used is
  refunded automatically; a second payment for the same order is refunded; refunds can never add up to more
  than was paid.
- Rate limits use the visitor's real IP (Supabase's edge header), not one the browser could fake.
- Storage buckets can't be listed by the public; return photos are private.

## 8. Before launch: run the advisors

```bash
npm run db:audit
```

or Dashboard → Advisors. What you should see:

| Finding | Expected? |
|---|---|
| `anon_security_definer_function_executable` (11) | Yes: the storefront functions (prices, samples, reviews, pincode check, newsletter). |
| `authenticated_security_definer_function_executable` | Yes: customer and admin actions; each checks the caller inside. |
| `auth_leaked_password_protection` | Turn it on (Pro), then it disappears. |
| `unused_index` | Yes, until there is real traffic. |
| Anything else | Not expected; ask before launch. |

## 9. Monitoring after launch

- Reports → API / Database: watch error rates and slow queries in the first weeks.
- Logs → Edge Functions: payment, refund and shipping problems are logged here with the order id.
- Admin → Dashboard: the setup checklist, refunds due and courier failures appear at the top.
