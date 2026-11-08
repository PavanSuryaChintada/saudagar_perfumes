# Connecting payments, couriers and tracking

Everything is built and waiting. Each service is switched on in one step once its keys arrive. You can see the
state of each one any time in **Admin → Connections**.

## What to send

| Service | What to send | Where to find it |
|---|---|---|
| Razorpay (online payments) | Key ID, Key Secret, and a webhook secret | Razorpay Dashboard → Account & Settings → API Keys. Start with **test** keys; switch to live keys after a test order. The webhook secret is any long password you type when adding the webhook (address shown in Admin → Connections). |
| Delhivery (courier) | API token, the pickup location name, and test or live | Your Delhivery business account (ask your Delhivery account manager for the API token). The pickup location name must match exactly what is registered with Delhivery. |
| India Post (courier) | The API documents and credentials from your India Post business account | Given by India Post with the business account. |
| Google Analytics | GA4 measurement ID (G-…) | Google Analytics → Admin → Data streams. |
| Meta Pixel | Pixel ID (a long number) | Meta Events Manager → Data sources. |

Google Analytics and Meta Pixel IDs can also be typed straight into **Admin → Settings → Analytics**.

## What happens when each is switched on

**Razorpay**
- The keys are tested first, then saved on the server (never in the website code, never shown in the admin).
- “Pay online” appears at checkout. Paid orders are confirmed by Razorpay’s signature, so they can’t be faked.
- Cancelling a paid order starts the refund automatically; the Refunds page shows each refund’s progress.
- Webhook (add in Razorpay → Webhooks): the address in Admin → Connections, events `payment.captured`,
  `payment.failed`, `refund.processed`, `refund.failed`, secret = the webhook secret you sent.

**Delhivery**
- The token is tested first, then saved on the server.
- New orders go with Delhivery by default. When you mark an order packed (you can pick another courier in that
  window), the store books it: tracking number (AWB), a label PDF to print and stick on the box, and a pickup.
- Tracking is checked every 30 minutes and the order moves to Shipped, Out for delivery and Delivered by itself.
  Nothing needs setting up at Delhivery’s end.
- Start in test (staging) mode, book one test order, then switch to live.

**India Post**
- Until the API is connected: book at the post office, open the order, press **Mark shipped** and type the
  article number. Customers get a tracking link.
- When the documents arrive, automatic booking and tracking are added in one file
  (`supabase/functions/_shared/shipping/indiapost.ts`); the rest of the store is already wired for it.

**The database link**
- Automatic refunds and courier bookings need a private link between the database and the server functions.
  It is created with the first service you connect.

## For whoever runs the setup

Put the keys in `.env.local` (never committed):

```
RAZORPAY_KEY_ID=rzp_test_…
RAZORPAY_KEY_SECRET=…
RAZORPAY_WEBHOOK_SECRET=…
DELHIVERY_TOKEN=…
DELHIVERY_MODE=staging            # or production
DELHIVERY_PICKUP_LOCATION=…       # exactly as registered with Delhivery
GA4_ID=G-…
META_PIXEL_ID=…
```

Then run one of:

```
npm run connect -- check        # what is connected and what is missing (prints no secrets)
npm run connect -- razorpay     # tests the keys, saves them, switches online payments on
npm run connect -- delhivery    # tests the token, saves it, switches automatic booking on
npm run connect -- analytics    # saves the Google Analytics / Meta Pixel IDs
```

Each step tests the key before saving it and stops with a plain message if something is wrong. After
connecting, press **Test connection** in Admin → Connections, then place one test order end to end.
