// One-step connections. Put the keys in .env.local (never committed), then:
//   npm run connect -- check        what is connected and what is missing (prints no secrets)
//   npm run connect -- razorpay     test the Razorpay keys, save them on the server, switch online payments on
//   npm run connect -- delhivery    test the Delhivery token, save it, switch automatic booking on
//   npm run connect -- analytics    save the Google Analytics / Meta Pixel IDs
//
// .env.local names:
//   RAZORPAY_KEY_ID=rzp_test_… or rzp_live_…     RAZORPAY_KEY_SECRET=…     RAZORPAY_WEBHOOK_SECRET=… (the one typed in Razorpay → Webhooks)
//   DELHIVERY_TOKEN=…     DELHIVERY_MODE=staging|production     DELHIVERY_PICKUP_LOCATION=… (exactly as registered with Delhivery)
//   GA4_ID=G-…     GTM_ID=GTM-…     META_PIXEL_ID=…
// Every key is tested before it is saved. Nothing secret is ever printed.
import { randomBytes } from 'node:crypto';
import { env, mgmt, runSql } from './lib/mgmt.mjs';

const ref = env('SUPABASE_PROJECT_REF');
const what = process.argv[2] ?? 'check';
const opt = (name) => (process.env[name] ?? '').trim();
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => console.log(`  ✗ ${msg}`);
const stop = (msg) => {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
};
const sqlText = (v) => `'${String(v).replace(/'/g, "''")}'`;

async function setSetting(key, value) {
  await runSql(`update public.settings set value = ${sqlText(JSON.stringify(value))}::jsonb where key = ${sqlText(key)}`);
}
async function serverSecrets() {
  const list = await mgmt(`/projects/${ref}/secrets`);
  return new Set(list.map((s) => s.name));
}
async function saveSecrets(pairs) {
  await mgmt(`/projects/${ref}/secrets`, { method: 'POST', body: Object.entries(pairs).map(([name, value]) => ({ name, value })) });
}

/** The link that lets the database start refunds and courier bookings (Vault + function secret, same value). */
async function ensureHookSecret() {
  const [{ has }] = await runSql(`select exists (select 1 from vault.secrets where name = 'shipping_hook_secret') as has`);
  const names = await serverSecrets();
  if (has && names.has('SHIPPING_HOOK_SECRET')) return ok('Database link for refunds and bookings is set');
  const secret = randomBytes(32).toString('hex');
  if (has) await runSql(`select vault.update_secret((select id from vault.secrets where name = 'shipping_hook_secret'), ${sqlText(secret)})`);
  else await runSql(`select vault.create_secret(${sqlText(secret)}, 'shipping_hook_secret', 'Database to edge function hooks (refunds, courier booking)')`);
  await saveSecrets({ SHIPPING_HOOK_SECRET: secret });
  ok('Database link for refunds and bookings created');
}

async function functionsUrl() {
  const [{ url }] = await runSql(`select value #>> '{}' as url from public.settings where key = 'shipping.functions_url'`);
  return url;
}

async function razorpay() {
  console.log('\nRazorpay');
  const id = opt('RAZORPAY_KEY_ID');
  const secret = opt('RAZORPAY_KEY_SECRET');
  const hook = opt('RAZORPAY_WEBHOOK_SECRET');
  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(id)) stop('RAZORPAY_KEY_ID in .env.local should look like rzp_test_… or rzp_live_…');
  if (!secret) stop('Add RAZORPAY_KEY_SECRET to .env.local.');
  const res = await fetch('https://api.razorpay.com/v1/payments?count=1', { headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}` } });
  if (res.status === 401) stop('Razorpay did not accept the Key ID and Key Secret. Copy them again from Razorpay.');
  if (!res.ok) stop(`Razorpay answered with an error (${res.status}). Try again in a minute.`);
  ok(`Keys work (${id.startsWith('rzp_live_') ? 'LIVE: real money' : 'test mode: no real money'})`);
  const pairs = { RAZORPAY_KEY_ID: id, RAZORPAY_KEY_SECRET: secret };
  if (hook) pairs.RAZORPAY_WEBHOOK_SECRET = hook;
  await saveSecrets(pairs);
  ok('Saved on the server');
  await ensureHookSecret();
  await setSetting('payments.online_enabled', true);
  ok('Online payments switched on at checkout');
  const base = await functionsUrl();
  console.log(`\n  In Razorpay → Account & Settings → Webhooks, add:\n    URL:    ${base}/razorpay-webhook\n    Events: payment.captured, payment.failed, refund.processed, refund.failed\n    Secret: the same text as RAZORPAY_WEBHOOK_SECRET`);
  if (!hook) bad('RAZORPAY_WEBHOOK_SECRET is missing: payments still work, but add it so Razorpay can confirm late payments and refunds.');
}

async function delhivery() {
  console.log('\nDelhivery');
  const token = opt('DELHIVERY_TOKEN');
  const mode = opt('DELHIVERY_MODE') === 'production' ? 'production' : 'staging';
  const pickup = opt('DELHIVERY_PICKUP_LOCATION');
  if (!token) stop('Add DELHIVERY_TOKEN to .env.local.');
  const base = mode === 'production' ? 'https://track.delhivery.com' : 'https://staging-express.delhivery.com';
  const res = await fetch(`${base}/c/api/pin-codes/json/?filter_codes=110001`, { headers: { Authorization: `Token ${token}`, Accept: 'application/json' } });
  if (res.status === 401 || res.status === 403) stop(`Delhivery did not accept the token for ${mode}. Check DELHIVERY_TOKEN and DELHIVERY_MODE.`);
  if (!res.ok) stop(`Delhivery answered with an error (${res.status}).`);
  ok(`Token works (${mode === 'production' ? 'LIVE' : 'staging: test bookings'})`);
  if (!pickup) stop('Add DELHIVERY_PICKUP_LOCATION (the warehouse name exactly as registered with Delhivery).');
  await saveSecrets({ DELHIVERY_TOKEN: token });
  ok('Saved on the server');
  await ensureHookSecret();
  await setSetting('delhivery.mode', mode);
  await setSetting('delhivery.pickup_location', pickup);
  await setSetting('delhivery.enabled', true);
  await setSetting('shipping.status_updates', 'poll');
  await setSetting('shipping.default_courier', 'delhivery');
  ok('Automatic booking on: packed orders get an AWB, a label and a pickup');
  ok('Tracking checked every 30 minutes (nothing to set up at Delhivery)');
  ok('New orders go with Delhivery by default (change per order when packing)');
}

async function analytics() {
  console.log('\nAnalytics');
  const ga = opt('GA4_ID');
  const gtm = opt('GTM_ID');
  const pixel = opt('META_PIXEL_ID');
  if (ga && !/^G-[A-Z0-9]+$/.test(ga)) stop('GA4_ID should look like G-XXXXXXX.');
  if (gtm && !/^GTM-[A-Z0-9]+$/.test(gtm)) stop('GTM_ID should look like GTM-XXXXXX.');
  if (pixel && !/^[0-9]{10,20}$/.test(pixel)) stop('META_PIXEL_ID is the number from Meta Events Manager.');
  if (!ga && !gtm && !pixel) stop('Add GA4_ID, GTM_ID or META_PIXEL_ID to .env.local.');
  if (ga) await setSetting('analytics.ga4_id', ga);
  if (gtm) await setSetting('analytics.gtm_id', gtm);
  if (pixel) await setSetting('analytics.meta_pixel_id', pixel);
  ok('Saved. Visits and sales are tracked from the next page load.');
}

async function check() {
  const names = await serverSecrets();
  const [r] = await runSql(`select
      exists (select 1 from vault.secrets where name = 'shipping_hook_secret') as hook,
      (select value from public.settings where key = 'payments.online_enabled') = 'true'::jsonb as online,
      (select value from public.settings where key = 'delhivery.enabled') = 'true'::jsonb as delhivery,
      (select value #>> '{}' from public.settings where key = 'delhivery.mode') as mode,
      (select value #>> '{}' from public.settings where key = 'delhivery.pickup_location') as pickup,
      (select value #>> '{}' from public.settings where key = 'shipping.default_courier') as courier,
      (select value #>> '{}' from public.settings where key = 'analytics.ga4_id') as ga,
      (select value #>> '{}' from public.settings where key = 'analytics.meta_pixel_id') as pixel,
      exists (select 1 from cron.job where jobname = 'shipping-poll') as poll_job`);
  console.log('\nConnections');
  (names.has('SHIPPING_HOOK_SECRET') && r.hook ? ok : bad)('Database link for automatic refunds and courier bookings');
  (names.has('RAZORPAY_KEY_ID') && names.has('RAZORPAY_KEY_SECRET') ? ok : bad)('Razorpay keys on the server');
  (names.has('RAZORPAY_WEBHOOK_SECRET') ? ok : bad)('Razorpay webhook secret on the server');
  (r.online ? ok : bad)('Online payments switched on');
  (names.has('DELHIVERY_TOKEN') ? ok : bad)('Delhivery token on the server');
  (r.delhivery ? ok : bad)(`Delhivery automatic booking on (${r.mode ?? 'staging'})`);
  (r.pickup ? ok : bad)('Delhivery pickup location name');
  (r.poll_job ? ok : bad)('Tracking check every 30 minutes scheduled');
  console.log(`  · Default courier for new orders: ${r.courier || 'not set'}`);
  bad('India Post automatic booking: waiting for the India Post business API documents');
  (r.ga ? ok : bad)('Google Analytics ID');
  (r.pixel ? ok : bad)('Meta Pixel ID');
}

const steps = { check, razorpay, delhivery, analytics };
if (!steps[what]) stop(`Unknown step "${what}". Use: check, razorpay, delhivery or analytics.`);
await steps[what]();
if (what !== 'check') await check();
