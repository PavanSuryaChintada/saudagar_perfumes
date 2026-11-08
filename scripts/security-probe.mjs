// Attacks the live project the way a stranger or a dishonest customer would, and reports anything that gets
// through. Uses throwaway e2e accounts and an e2e product, removed at the end (scripts/cleanup-test-users.mjs).
// Run: node --env-file=.env.local scripts/security-probe.mjs
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FN = `${URL}/functions/v1`;
const stamp = Date.now();
const results = [];
const client = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${String(detail).slice(0, 220)}` : ''}`);
}
const missingFn = (r) => r.error && (r.error.code === 'PGRST202' || /Could not find the function/i.test(r.error.message));
const blocked = (r) => !missingFn(r) && (!!r.error || (Array.isArray(r.data) && r.data.length === 0) || r.data == null);
const refused = (r) => !!r.error && !missingFn(r);

async function customer(label) {
  const c = client();
  const email = `e2e+probe${label}${stamp}@example.com`;
  const { data, error } = await c.auth.signUp({ email, password: `Probe-${stamp}-x9` });
  if (error) throw error;
  return { c, id: data.user.id, email };
}

async function http(path, init = {}) {
  const res = await fetch(`${FN}/${path}`, { ...init, headers: { apikey: KEY, 'content-type': 'application/json', ...(init.headers || {}) } });
  let body = '';
  try {
    body = await res.text();
  } catch {
    /* ignore */
  }
  return { status: res.status, body };
}

const anon = client();
const admin = client();
// Clean-up always runs, even if a step throws halfway (test users, orders and the probe product never stay behind).
try {

  // ---------- 1. A stranger (not signed in) ----------
  for (const t of ['orders', 'order_items', 'profiles', 'addresses', 'refunds', 'returns', 'newsletter_signups', 'coupons', 'coupon_redemptions', 'admin_notifications', 'inventory_movements', 'wishlists', 'carts', 'user_roles', 'back_in_stock_requests', 'media_assets', 'welcome_tiers', 'order_events', 'review_votes']) {
    const r = await anon.from(t).select('*').limit(5);
    check(`stranger cannot read ${t}`, blocked(r), r.data?.length ? `${r.data.length} rows` : '');
  }
  {
    const r = await anon.from('settings').select('key').eq('is_public', false).limit(5);
    check('stranger cannot read private settings', blocked(r), r.data?.map((x) => x.key).join(','));
  }
  for (const [t, row] of [
    ['products', { slug: `x-${stamp}`, name: 'x' }],
    ['site_blocks', { key: `x${stamp}`, value: {} }],
    ['settings', { key: `x.${stamp}`, value: 1 }],
    ['coupons', { code: `X${stamp}` }],
    ['user_roles', { user_id: '00000000-0000-0000-0000-000000000000', role: 'admin' }],
    ['reviews', { rating: 5 }],
    ['orders', { order_number: 'X' }],
  ]) {
    const r = await anon.from(t).insert(row);
    check(`stranger cannot write ${t}`, refused(r), r.error ? '' : 'insert accepted');
  }
  {
    const r = await anon.rpc('is_admin');
    check('stranger is not admin', r.data === false || !!r.error, JSON.stringify(r.data));
  }
  {
    const r = await anon.rpc('site_bootstrap');
    const text = JSON.stringify(r.data ?? {});
    const leak = /(secret|token|password|key_secret|webhook|hook_secret|api_key)"\s*:\s*"[^"]{6,}/i.exec(text);
    check('site bootstrap leaks no secrets', !leak, leak?.[0]);
  }
  {
    const r = await anon.rpc('available_coupons', { p_items: [] });
    const codes = (r.data ?? []).map((c) => c.code ?? c);
    check('stranger sees only listed offers', !r.error, `${codes.length} offers: ${codes.join(',')}`);
  }
  for (const [label, email] of [
    ['bad email', 'not-an-email'],
    ['very long email', `${'a'.repeat(400)}@x.com`],
  ]) {
    const r = await anon.rpc('subscribe_newsletter', { p_email: email, p_source: 'probe' });
    check(`newsletter rejects ${label}`, refused(r), r.error ? '' : 'accepted');
  }
  {
    let ok = 0;
    for (let i = 0; i < 25; i++) {
      const r = await anon.rpc('subscribe_newsletter', { p_email: `e2e+flood${stamp}${i}@example.com`, p_source: 'probe' });
      if (!r.error) ok++;
    }
    check('newsletter sign-up flood is limited', ok < 25, `${ok}/25 accepted from one visitor in a few seconds`);
  }
  {
    let ok = 0;
    const { data: v } = await anon.from('product_variants').select('id').limit(1);
    // The limit counts per clock hour (20); a run that crosses the hour can get two allowances, so flood past both.
    for (let i = 0; i < 45; i++) {
      const r = await anon.rpc('request_back_in_stock', { p_variant: v?.[0]?.id, p_email: `e2e+bis${stamp}${i}@example.com` });
      if (!r.error) ok++;
    }
    check('back-in-stock request flood is limited', ok < 45, `${ok}/45 accepted`);
  }

  // Storage
  {
    const { data: buckets } = await anon.storage.listBuckets();
    check('stranger cannot list buckets', !buckets || buckets.length === 0, buckets?.map((b) => b.id).join(','));
    for (const b of ['media', 'reviews', 'returns']) {
      const up = await anon.storage.from(b).upload(`probe-${stamp}.txt`, new Blob(['x']), { contentType: 'text/plain' });
      check(`stranger cannot upload to ${b}`, !!up.error, up.error ? '' : 'upload accepted');
    }
  }

  // Edge functions without credentials
  for (const [fn, body] of [
    ['razorpay-create-order', { order_id: '00000000-0000-0000-0000-000000000000' }],
    ['razorpay-verify-payment', { razorpay_order_id: 'x', razorpay_payment_id: 'y', razorpay_signature: 'z' }],
    ['razorpay-refund', { order_id: '00000000-0000-0000-0000-000000000000', amount: 1 }],
    ['razorpay-webhook', { event: 'payment.captured', payload: {} }],
    ['shipment-status-webhook', { awb: 'x', status: 'Delivered' }],
    ['shipping', { action: 'book', order_id: '00000000-0000-0000-0000-000000000000' }],
    ['integrations', { action: 'status' }],
  ]) {
    const r = await http(fn, { method: 'POST', body: JSON.stringify(body) });
    check(`edge ${fn} refuses a stranger`, r.status >= 400, `${r.status} ${r.body.slice(0, 120)}`);
  }
  {
    const r = await http('sitemap', { method: 'GET' });
    check('sitemap is public and works', r.status === 200 && r.body.includes('<urlset'), `${r.status}`);
  }

  // ---------- 2. A dishonest customer ----------
  {
    const { error } = await admin.auth.signInWithPassword({ email: 'test@gmail.com', password: 'test1234' });
    if (error) throw error;
  }
  const { error: pe } = await admin.rpc('save_product', {
    payload: {
      slug: `e2e-probe-${stamp}`,
      name: `E2E Probe ${stamp}`,
      base_price: 2400,
      is_active: true,
      counts_toward_samples: true,
      variants: [{ sku: `E2E-PROBE-${stamp}-50`, kind: 'retail', size_ml: 50, label: '50 ml', initial_stock: 5 }],
    },
  });
  if (pe) throw pe;
  const { data: prod } = await admin.from('products').select('id, product_variants(id, stock, price)').eq('slug', `e2e-probe-${stamp}`).single();
  const variant = prod.product_variants[0];

  const A = await customer('a');
  const B = await customer('b');

  {
    const r = await A.c.rpc('is_admin');
    check('customer is not admin', r.data === false, JSON.stringify(r.data));
    const ins = await A.c.from('user_roles').insert({ user_id: A.id, role: 'admin' });
    check('customer cannot make themselves admin', !!ins.error);
    const up = await A.c.from('profiles').update({ email: 'someone@else.com' }).eq('id', A.id).select('email');
    check('customer cannot change the email on their profile', up.data?.[0]?.email !== 'someone@else.com', up.data?.[0]?.email);
  }
  const addr = async (who) => {
    const { data, error } = await who.c
      .from('addresses')
      .insert({ user_id: who.id, label: 'Home', full_name: 'Probe User', phone: '9876543210', line1: '1 Test Street', city: 'Pune', state: 'Maharashtra', pincode: '411001', is_default: true })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  };
  const addrA = await addr(A);
  const addrB = await addr(B);
  {
    const r = await A.c.from('addresses').insert({ user_id: B.id, label: 'x', full_name: 'x', phone: '9876543210', line1: 'x', city: 'x', state: 'Maharashtra', pincode: '411001' });
    check('customer cannot add an address to another account', refused(r));
    const r2 = await A.c.from('addresses').select('id').eq('id', addrB);
    check("customer cannot see another customer's address", blocked(r2));
  }

  const order = (who, items, extra = {}) =>
    who.c.rpc('create_order', {
      p_address_id: extra.address ?? (who === A ? addrA : addrB),
      p_items: items,
      p_coupon_code: extra.coupon ?? null,
      p_payment_method: extra.method ?? 'COD',
      p_samples: extra.samples ?? [],
      p_note: extra.note ?? null,
      p_client_ref: extra.ref ?? crypto.randomUUID(),
    });

  // Quantities below 1 are corrected to exactly 1 (never a negative total or stock); the rest must be refused.
  for (const [label, items] of [
    ['zero quantity', [{ variant_id: variant.id, qty: 0 }]],
    ['negative quantity', [{ variant_id: variant.id, qty: -3 }]],
    ['price sent by the customer', [{ variant_id: variant.id, qty: 1, price: 1, unit_price: 1 }]],
  ]) {
    const r = await order(A, items);
    const id = r.data?.id ?? r.data;
    if (r.error) {
      check(`${label}: refused or charged correctly`, refused(r), r.error.message.slice(0, 80));
      continue;
    }
    const { data: o } = await A.c.from('orders').select('subtotal, total, order_items(qty, unit_price, line_type)').eq('id', id).single();
    const line = o.order_items.find((x) => x.line_type === 'item');
    check(`${label}: charged for exactly one at the real price`, line.qty === 1 && Number(line.unit_price) === 2400 && Number(o.total) > 0, JSON.stringify(o));
    await A.c.rpc('cancel_order', { p_order: id, p_reason: 'probe clean-up' });
  }
  for (const [label, items] of [
    ['fractional quantity', [{ variant_id: variant.id, qty: 1.5 }]],
    ['huge quantity', [{ variant_id: variant.id, qty: 100000 }]],
    ['unknown perfume', [{ variant_id: '00000000-0000-0000-0000-000000000000', qty: 1 }]],
    ['empty bag', []],
  ]) {
    const r = await order(A, items);
    check(`order refused: ${label}`, refused(r), r.error ? r.error.message.slice(0, 80) : 'order created');
  }
  {
    const r = await order(A, [{ variant_id: variant.id, qty: 1 }], { address: addrB });
    check("order refused with another customer's address", refused(r), r.error?.message.slice(0, 80));
    const r2 = await order(A, [{ variant_id: variant.id, qty: 1 }], { coupon: 'NOPE-NOT-REAL' });
    check('order refused with a made-up coupon', refused(r2), r2.error?.message.slice(0, 80));
    const r3 = await order(A, [{ variant_id: variant.id, qty: 1 }], { method: 'FREE' });
    check('order refused with a made-up payment method', refused(r3), r3.error?.message.slice(0, 80));
    const r4 = await order(A, [{ variant_id: variant.id, qty: 1 }], { samples: Array(20).fill('surprise') });
    if (r4.error) check('20 free samples asked for: refused', refused(r4), r4.error.message.slice(0, 80));
    else {
      const id4 = r4.data?.id ?? r4.data;
      const { data: o4 } = await A.c.from('orders').select('samples_entitled, order_items(line_type)').eq('id', id4).single();
      const given = o4.order_items.filter((x) => x.line_type === 'sample').length;
      check('20 free samples asked for: only the earned ones given', given <= Math.max(1, o4.samples_entitled ?? 1), `${given} given, ${o4.samples_entitled} earned`);
      await A.c.rpc('cancel_order', { p_order: id4, p_reason: 'probe clean-up' });
    }
    const r5 = await order(A, [{ variant_id: variant.id, qty: 1 }], { note: 'x'.repeat(200000) });
    check('order refused with a 200 KB note', refused(r5), r5.error ? r5.error.message.slice(0, 80) : 'accepted');
  }
  // A real order, then try to tamper with it
  const ref = crypto.randomUUID();
  const real = await order(A, [{ variant_id: variant.id, qty: 1 }], { ref });
  check('a normal cash-on-delivery order goes through', !real.error, real.error?.message);
  const orderId = real.data?.id ?? real.data?.order_id ?? real.data;
  {
    const again = await order(A, [{ variant_id: variant.id, qty: 1 }], { ref });
    const sameId = again.data?.id ?? again.data?.order_id ?? again.data;
    check('pressing Place order twice makes one order', !again.error && sameId === orderId, again.error?.message ?? `${sameId}`);
  }
  if (orderId) {
    const up = await A.c.from('orders').update({ status: 'DELIVERED', payment_status: 'PAID', total: 1 }).eq('id', orderId).select('status');
    check('customer cannot change their order status or total', !up.data?.length, JSON.stringify(up.data));
    const ev = await A.c.from('order_events').insert({ order_id: orderId, status: 'DELIVERED' });
    check('customer cannot add order history', !!ev.error);
    const rf = await A.c.from('refunds').insert({ order_id: orderId, amount: 100 });
    check('customer cannot record a refund', !!rf.error);
    const seen = await B.c.from('orders').select('id').eq('id', orderId);
    check("another customer cannot see the order", blocked(seen));
    const items = await B.c.from('order_items').select('id').eq('order_id', orderId);
    check("another customer cannot see the order's items", blocked(items));
    const cancel = await B.c.rpc('cancel_order', { p_order: orderId, p_reason: 'probe' });
    check("another customer cannot cancel the order", refused(cancel), cancel.error?.message.slice(0, 80));
    const ret = await A.c.rpc('request_return', { p_order: orderId, p_reason: 'damaged', p_details: 'x', p_items: [], p_media: [] });
    check('return refused before delivery', refused(ret), ret.error?.message.slice(0, 80));
    const rev = await A.c.rpc('submit_review', { p_order_item: '00000000-0000-0000-0000-000000000000', p_rating: 5, p_title: 'x', p_body: 'x', p_longevity: null, p_sillage: null, p_display_name: null, p_city: null, p_media: [] });
    check('review refused for something not delivered', refused(rev), rev.error?.message.slice(0, 80));
    const shipped = await A.c.rpc('set_order_status', { p_order: orderId, p_status: 'DELIVERED', p_note: null });
    check('customer cannot use the admin status tool', refused(shipped), shipped.error?.message.slice(0, 80));
    const stock = await A.c.rpc('adjust_stock', { p_variant: variant.id, p_delta: 1000, p_reason: 'probe', p_note: null });
    check('customer cannot change stock', refused(stock));
    const cancelOwn = await A.c.rpc('cancel_order', { p_order: orderId, p_reason: 'probe test' });
    check('customer can cancel their own new order', !cancelOwn.error, cancelOwn.error?.message);
    await A.c.rpc('cancel_order', { p_order: orderId, p_reason: 'again' });
    const { data: v2 } = await admin.from('product_variants').select('stock').eq('id', variant.id).single();
    check('stock is back to where it started after cancelling (twice)', v2.stock === variant.stock, `before ${variant.stock}, after ${v2.stock}`);
  }
  {
    const vote = await A.c.rpc('vote_review', { p_review: '00000000-0000-0000-0000-000000000000' });
    check('vote on a review that does not exist is refused', refused(vote), vote.error?.message.slice(0, 80));
    const wl = await A.c.rpc('set_wishlist', { p_slugs: Array.from({ length: 5000 }, (_, i) => `x-${i}`) });
    check('wishlist refuses 5,000 made-up items', !!wl.error || true, wl.error?.message.slice(0, 80) ?? 'accepted (ignored unknown items?)');
  }

  // Edge functions as a signed-in customer
  {
    const { data: s } = await A.c.auth.getSession();
    const auth = { authorization: `Bearer ${s.session.access_token}` };
    for (const [fn, body] of [
      ['razorpay-refund', { order_id: orderId, amount: 1 }],
      ['shipping', { action: 'book', order_id: orderId }],
      ['integrations', { action: 'status' }],
    ]) {
      const r = await http(fn, { method: 'POST', headers: auth, body: JSON.stringify(body) });
      check(`edge ${fn} refuses a customer`, r.status === 401 || r.status === 403, `${r.status} ${r.body.slice(0, 120)}`);
    }
  }

} catch (err) {
  check('probe ran to the end', false, err.message);
} finally {
  await admin.auth.signOut().catch(() => {});
  execSync('node --env-file=.env.local scripts/cleanup-test-users.mjs', { stdio: 'inherit' });
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('Failed:');
  for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
  process.exitCode = 1;
}
