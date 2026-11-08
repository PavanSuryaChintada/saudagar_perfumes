// Whole-journey tests against the live project, as customers and as the admin, with the edge cases around each step:
// coupons, the last bottle bought twice at once, packing and shipping, delivery, reviews, returns and refunds, gift
// packs, archived products and back-in-stock requests. Everything uses e2e markers and is removed at the end.
// Run: node --env-file=.env.local scripts/scenario-test.mjs
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const stamp = Date.now();
const results = [];
const client = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const missingFn = (r) => r.error && (r.error.code === 'PGRST202' || /Could not find the function/i.test(r.error.message));
const refused = (r) => !!r.error && !missingFn(r);
const msg = (r) => (r.error ? r.error.message.slice(0, 110) : JSON.stringify(r.data ?? null).slice(0, 110));

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${String(detail).slice(0, 200)}` : ''}`);
}
function must(r, what) {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data;
}

const admin = client();
must(await admin.auth.signInWithPassword({ email: 'test@gmail.com', password: 'test1234' }), 'admin sign-in');

async function product(tag, stock, price = 2400) {
  must(
    await admin.rpc('save_product', {
      payload: {
        slug: `e2e-scn-${tag}-${stamp}`,
        name: `E2E Scenario ${tag} ${stamp}`,
        base_price: price,
        is_active: true,
        counts_toward_samples: true,
        variants: [{ sku: `E2E-SCN-${tag}-${stamp}`, kind: 'retail', size_ml: 50, label: '50 ml', initial_stock: stock }],
      },
    }),
    `create product ${tag}`,
  );
  const p = must(await admin.from('products').select('id, slug, product_variants(id)').eq('slug', `e2e-scn-${tag}-${stamp}`).single(), 'read product');
  return { id: p.id, slug: p.slug, variant: p.product_variants[0].id };
}
const stockOf = async (variant) => must(await admin.from('product_variants').select('stock').eq('id', variant).single(), 'stock').stock;

async function customer(label) {
  const c = client();
  const email = `e2e+scn${label}${stamp}@example.com`;
  const { data, error } = await c.auth.signUp({ email, password: `Scn-${stamp}-x9` });
  if (error) throw error;
  const addr = must(
    await c
      .from('addresses')
      .insert({ user_id: data.user.id, label: 'Home', full_name: `Scenario ${label}`, phone: `98765${String(stamp).slice(-5)}`.slice(0, 10), line1: '1 Test Street', city: 'Pune', state: 'Maharashtra', pincode: '411001', is_default: true })
      .select('id')
      .single(),
    'address',
  );
  return { c, id: data.user.id, email, addr: addr.id };
}
const place = (who, items, extra = {}) =>
  who.c.rpc('create_order', {
    p_address_id: who.addr,
    p_items: items,
    p_coupon_code: extra.coupon ?? null,
    p_payment_method: 'COD',
    p_samples: extra.samples ?? [],
    p_note: null,
    p_client_ref: crypto.randomUUID(),
  });
const idOf = (r) => r.data?.id ?? r.data;

try {
  const P1 = await product('main', 5);
  const P2 = await product('last', 1);
  const A = await customer('a');
  const B = await customer('b');
  const C = await customer('c');

  // ---------- Coupons ----------
  const code = `E2E-${stamp}`;
  must(
    await admin.rpc('save_coupon', {
      payload: { code, kind: 'general', discount_type: 'PERCENT', value: 10, usage_limit: 1, per_customer_limit: 1, min_order: 0, is_active: true, is_listed: false, description: 'E2E scenario' },
    }),
    'save coupon',
  );
  {
    const q = await A.c.rpc('quote_order', { p_items: [{ variant_id: P1.variant, qty: 1 }], p_coupon_code: code, p_payment_method: 'COD', p_samples: [] });
    check('coupon: 10 % off is worked out on the server', !q.error && Number(q.data?.discount) === 240, msg(q));
    const lower = await A.c.rpc('quote_order', { p_items: [{ variant_id: P1.variant, qty: 1 }], p_coupon_code: code.toLowerCase(), p_payment_method: 'COD', p_samples: [] });
    check('coupon: code works in small letters too', !lower.error && Number(lower.data?.discount) === 240, msg(lower));
  }
  const oA = await place(A, [{ variant_id: P1.variant, qty: 1 }], { coupon: code });
  check('coupon: first customer orders with it', !oA.error, msg(oA));
  {
    const { data: o } = await A.c.from('orders').select('discount, total').eq('id', idOf(oA)).single();
    check('coupon: the order keeps the discount', Number(o?.discount) === 240, JSON.stringify(o));
    const oB = await place(B, [{ variant_id: P1.variant, qty: 1 }], { coupon: code });
    const gotDiscount = !oB.error && Number((await B.c.from('orders').select('discount').eq('id', idOf(oB)).single()).data?.discount) > 0;
    check('coupon: a one-use coupon cannot be used twice', !gotDiscount, oB.error ? oB.error.message.slice(0, 90) : 'second order got the discount');
    if (!oB.error) await B.c.rpc('cancel_order', { p_order: idOf(oB), p_reason: 'scenario' });
    must(await A.c.rpc('cancel_order', { p_order: idOf(oA), p_reason: 'scenario' }), 'cancel coupon order');
    const oB2 = await place(B, [{ variant_id: P1.variant, qty: 1 }], { coupon: code });
    const d2 = oB2.error ? null : (await B.c.from('orders').select('discount').eq('id', idOf(oB2)).single()).data?.discount;
    check('coupon: freed again when the order using it is cancelled', Number(d2) === 240, oB2.error ? oB2.error.message.slice(0, 90) : `discount ${d2}`);
    if (!oB2.error) await B.c.rpc('cancel_order', { p_order: idOf(oB2), p_reason: 'scenario' });
  }

  // ---------- The last bottle, bought by two people at the same moment ----------
  {
    const [r1, r2] = await Promise.all([place(A, [{ variant_id: P2.variant, qty: 1 }]), place(B, [{ variant_id: P2.variant, qty: 1 }])]);
    const wins = [r1, r2].filter((r) => !r.error).length;
    const left = await stockOf(P2.variant);
    check('last bottle: only one of two buyers at the same moment gets it', wins === 1 && left === 0, `${wins} orders, stock ${left}; ${[r1, r2].map(msg).join(' / ')}`);
    for (const [r, who] of [
      [r1, A],
      [r2, B],
    ]) if (!r.error) await who.c.rpc('cancel_order', { p_order: idOf(r), p_reason: 'scenario' });
    check('last bottle: back in stock after the cancel', (await stockOf(P2.variant)) === 1);
  }
  {
    const start = await stockOf(P1.variant);
    const rs = await Promise.all([A, B, C].map((w) => place(w, [{ variant_id: P1.variant, qty: 2 }])));
    const wins = rs.filter((r) => !r.error).length;
    const left = await stockOf(P1.variant);
    check('three buyers of 2 each with 5 in stock: never sold below zero', left >= 0 && left === start - wins * 2 && wins === 2, `${wins} orders, stock ${start} → ${left}`);
    for (const [i, r] of rs.entries()) if (!r.error) await [A, B, C][i].c.rpc('cancel_order', { p_order: idOf(r), p_reason: 'scenario' });
  }

  // ---------- Archived products ----------
  {
    must(await admin.rpc('archive_product', { p_id: P2.id, p_archived: true }), 'archive');
    const r = await place(C, [{ variant_id: P2.variant, qty: 1 }]);
    check('archived perfume cannot be ordered', refused(r), msg(r));
    const anon = await client().from('products').select('id').eq('id', P2.id);
    check('archived perfume is hidden from visitors', !anon.data?.length, msg(anon));
    must(await admin.rpc('archive_product', { p_id: P2.id, p_archived: false }), 'unarchive');
  }

  // ---------- Packing, shipping, delivery ----------
  const o = await place(A, [{ variant_id: P1.variant, qty: 1 }]);
  check('order for the delivery journey', !o.error, msg(o));
  const orderId = idOf(o);
  const { data: line } = await A.c.from('order_items').select('id').eq('order_id', orderId).eq('line_type', 'item').single();
  {
    const early = await admin.rpc('ship_order', { p_order: orderId, p_courier: 'other', p_tracking: 'E2E123', p_note: null });
    check('cannot ship before packing', refused(early), msg(early));
    const skip = await admin.rpc('set_order_status', { p_order: orderId, p_status: 'DELIVERED', p_note: null });
    check('cannot jump from new straight to delivered', refused(skip), msg(skip));
    // Hand-booked courier: packing a Delhivery order books a real pickup once Delhivery is connected.
    must(await admin.rpc('set_order_courier', { p_order: orderId, p_courier: 'other' }), 'manual courier');
    const { data: pinned } = await admin.from('orders').select('courier').eq('id', orderId).single();
    if (pinned?.courier !== 'other') throw new Error('test order is not on the manual courier; refusing to pack it');
    must(await admin.rpc('set_order_status', { p_order: orderId, p_status: 'PACKED', p_note: null }), 'pack');
    const lateCancel = await A.c.rpc('cancel_order', { p_order: orderId, p_reason: 'changed my mind' });
    check('customer cannot cancel once packed', refused(lateCancel), msg(lateCancel));
    const noAwb = await admin.rpc('ship_order', { p_order: orderId, p_courier: 'other', p_tracking: '   ', p_note: null });
    check('shipping needs a tracking number', refused(noAwb), msg(noAwb));
    const shipped = await admin.rpc('ship_order', { p_order: orderId, p_courier: 'other', p_tracking: 'E2E123', p_note: null });
    check('admin ships with a tracking number', !shipped.error, msg(shipped));
    const review0 = await A.c.rpc('submit_review', { p_order_item: line.id, p_rating: 5, p_title: 'x', p_body: 'x', p_longevity: null, p_sillage: null, p_display_name: 'A', p_city: null, p_media: [] });
    check('review not allowed before delivery', refused(review0), msg(review0));
    const ret0 = await A.c.rpc('request_return', { p_order: orderId, p_reason: 'DAMAGED', p_details: null, p_items: [{ order_item_id: line.id, qty: 1 }], p_media: [] });
    check('return not allowed before delivery', refused(ret0), msg(ret0));
    must(await admin.rpc('set_order_status', { p_order: orderId, p_status: 'DELIVERED', p_note: null }), 'deliver');
    const back = await admin.rpc('set_order_status', { p_order: orderId, p_status: 'PENDING', p_note: null });
    check('a delivered order cannot go back to new', refused(back), msg(back));
    const { data: seen } = await A.c.from('orders').select('status, tracking_number').eq('id', orderId).single();
    check('customer sees delivered with the tracking number', seen?.status === 'DELIVERED' && seen?.tracking_number === 'E2E123', JSON.stringify(seen));
  }

  // ---------- Reviews ----------
  {
    const bad = await A.c.rpc('submit_review', { p_order_item: line.id, p_rating: 6, p_title: 'x', p_body: 'x', p_longevity: null, p_sillage: null, p_display_name: 'A', p_city: null, p_media: [] });
    check('review refuses 6 stars', refused(bad), msg(bad));
    const other = await B.c.rpc('submit_review', { p_order_item: line.id, p_rating: 5, p_title: 'x', p_body: 'x', p_longevity: null, p_sillage: null, p_display_name: 'B', p_city: null, p_media: [] });
    check("cannot review someone else's purchase", refused(other), msg(other));
    const ok = await A.c.rpc('submit_review', { p_order_item: line.id, p_rating: 4, p_title: 'Lovely', p_body: 'Lasts all day', p_longevity: null, p_sillage: null, p_display_name: 'Asha', p_city: 'Pune', p_media: [] });
    check('customer reviews what was delivered', !ok.error, msg(ok));
    const twice = await A.c.rpc('submit_review', { p_order_item: line.id, p_rating: 1, p_title: 'x', p_body: 'x', p_longevity: null, p_sillage: null, p_display_name: 'A', p_city: null, p_media: [] });
    const { data: mine } = await admin.from('reviews').select('id, rating, status').eq('product_id', P1.id);
    check('one review per purchase (a second try does not add another)', (mine?.length ?? 0) === 1, `${mine?.length} reviews; ${msg(twice)}`);
    const reviewId = mine?.[0]?.id;
    const hidden = await client().rpc('product_reviews', { p_slug: P1.slug, p_sort: 'newest', p_page: 0, p_page_size: 10 });
    const hiddenCount = JSON.stringify(hidden.data ?? '').includes('Lasts all day');
    check('a review is not public until approved', !hiddenCount, msg(hidden));
    must(await admin.rpc('moderate_review', { p_review: reviewId, p_status: 'APPROVED', p_note: null }), 'approve');
    const shown = await client().rpc('product_reviews', { p_slug: P1.slug, p_sort: 'newest', p_page: 0, p_page_size: 10 });
    check('approved review shows to visitors', JSON.stringify(shown.data ?? '').includes('Lasts all day'), msg(shown));
    const selfVote = await A.c.rpc('vote_review', { p_review: reviewId });
    check('cannot vote your own review helpful', refused(selfVote), msg(selfVote));
    await B.c.rpc('vote_review', { p_review: reviewId });
    await B.c.rpc('vote_review', { p_review: reviewId });
    await B.c.rpc('vote_review', { p_review: reviewId });
    const { data: rv } = await admin.from('reviews').select('helpful_count').eq('id', reviewId).single();
    check('one customer counts once in "helpful"', (rv?.helpful_count ?? 0) <= 1, JSON.stringify(rv));
  }

  // ---------- Returns and refunds ----------
  {
    const startStock = await stockOf(P1.variant);
    const dup = await A.c.rpc('request_return', {
      p_order: orderId,
      p_reason: 'DAMAGED',
      p_details: 'twice the same bottle',
      p_items: [
        { order_item_id: line.id, qty: 1 },
        { order_item_id: line.id, qty: 1 },
      ],
      p_media: [],
    });
    check('return refuses the same bottle listed twice (more than was bought)', refused(dup), msg(dup));
    let returnId = dup.error ? null : dup.data;
    if (!returnId) {
      const tooMany = await A.c.rpc('request_return', { p_order: orderId, p_reason: 'DAMAGED', p_details: null, p_items: [{ order_item_id: line.id, qty: 2 }], p_media: [] });
      check('return refuses more than was bought', refused(tooMany), msg(tooMany));
      const badMedia = await A.c.rpc('request_return', { p_order: orderId, p_reason: 'DAMAGED', p_details: null, p_items: [{ order_item_id: line.id, qty: 1 }], p_media: ['someone-else/photo.jpg'] });
      check("return refuses photos from someone else's folder", refused(badMedia), msg(badMedia));
      const r = await A.c.rpc('request_return', { p_order: orderId, p_reason: 'LEAKING', p_details: 'Cap leaked', p_items: [{ order_item_id: line.id, qty: 1 }], p_media: [] });
      check('customer asks for a return after delivery', !r.error, msg(r));
      returnId = r.data;
    }
    const again = await A.c.rpc('request_return', { p_order: orderId, p_reason: 'LEAKING', p_details: null, p_items: [{ order_item_id: line.id, qty: 1 }], p_media: [] });
    check('only one return per order', refused(again), msg(again));
    const selfApprove = await A.c.rpc('review_return', { p_return: returnId, p_approve: true, p_note: null, p_method: 'POST' });
    check('customer cannot approve their own return', refused(selfApprove), msg(selfApprove));
    must(await admin.rpc('review_return', { p_return: returnId, p_approve: true, p_note: 'Please post it back', p_method: 'POST' }), 'approve return');
    must(await A.c.rpc('set_return_tracking', { p_return: returnId, p_courier: 'India Post', p_tracking: 'E2EPOST1' }), 'return tracking');
    must(await admin.rpc('receive_return', { p_return: returnId, p_decision: 'RESTOCK' }), 'receive');
    const after = await stockOf(P1.variant);
    check('received return puts exactly what was returned back on the shelf', after === startStock + 1, `stock ${startStock} → ${after}`);
    const twiceIn = await admin.rpc('receive_return', { p_return: returnId, p_decision: 'RESTOCK' });
    check('a return cannot be received twice', refused(twiceIn) && (await stockOf(P1.variant)) === after, msg(twiceIn));
    const over = await admin.rpc('refund_return_manually', { p_return: returnId, p_amount: 999999, p_reference: 'UPI-E2E', p_note: null });
    check('refund cannot be more than was paid', refused(over), msg(over));
    const zero = await admin.rpc('refund_return_manually', { p_return: returnId, p_amount: 0, p_reference: 'UPI-E2E', p_note: null });
    check('refund cannot be zero', refused(zero), msg(zero));
    const custRefund = await A.c.rpc('refund_return_manually', { p_return: returnId, p_amount: 100, p_reference: 'x', p_note: null });
    check('customer cannot refund themselves', refused(custRefund), msg(custRefund));
    const good = await admin.rpc('refund_return_manually', { p_return: returnId, p_amount: 2400, p_reference: 'UPI-E2E', p_note: null });
    check('admin records the refund', !good.error, msg(good));
    const more = await admin.rpc('refund_return_manually', { p_return: returnId, p_amount: 2400, p_reference: 'UPI-E2E-2', p_note: null });
    const { data: refunds } = await admin.from('refunds').select('amount, status').eq('order_id', orderId);
    const total = (refunds ?? []).filter((x) => x.status !== 'FAILED').reduce((n, x) => n + Number(x.amount), 0);
    check('refunds can never add up to more than the order', total <= 2650, `refunded ${total}; ${msg(more)}`);
    const { data: rs } = await A.c.from('returns').select('status').eq('id', returnId).single();
    check('customer sees the return as refunded', ['REFUNDED', 'RECEIVED'].includes(rs?.status), JSON.stringify(rs));
  }

  // ---------- Gift pack ----------
  {
    const opts = must(await client().rpc('gift_pack_options'), 'gift pack options');
    if (opts?.enabled && opts.perfumes?.length) {
      const pid = opts.perfumes[0].product_id;
      const short = await C.c.rpc('quote_order', { p_items: [{ key: 'k1', picks: [pid] }], p_coupon_code: null, p_payment_method: 'COD', p_samples: [] });
      const shortOk = !short.error && !(short.data?.lines ?? []).some((l) => l.kind === 'gift_pack' && !(short.data?.problems ?? []).length);
      check(`gift pack with 1 of ${opts.count} perfumes is not accepted`, refused(short) || shortOk, msg(short));
      const shortOrder = await place(C, [{ key: 'k1', picks: [pid] }]);
      check('gift pack with too few perfumes cannot be ordered', refused(shortOrder), msg(shortOrder));
      const tooMany = await place(C, [{ key: 'k2', picks: Array(Number(opts.count) + 3).fill(pid) }]);
      check('gift pack with too many perfumes cannot be ordered', refused(tooMany), msg(tooMany));
      const fake = await place(C, [{ key: 'k3', picks: Array(Number(opts.count)).fill('00000000-0000-0000-0000-000000000000') }]);
      check('gift pack with made-up perfumes cannot be ordered', refused(fake), msg(fake));
    } else check('gift pack is switched off (skipped)', true);
  }

  // ---------- Back in stock and wishlist ----------
  {
    const [x] = await Promise.all([place(A, [{ variant_id: P2.variant, qty: 1 }])]);
    const r1 = await client().rpc('request_back_in_stock', { p_variant: P2.variant, p_email: `e2e+wait${stamp}@example.com` });
    const r2 = await client().rpc('request_back_in_stock', { p_variant: P2.variant, p_email: `e2e+wait${stamp}@example.com` });
    const { data: waits } = await admin.from('back_in_stock_requests').select('id').eq('variant_id', P2.variant);
    if (/RATE_LIMITED/.test(r1.error?.message ?? '')) check('back-in-stock: rate limit is on (this computer was limited by the flood test)', true);
    else check('back-in-stock: asking twice keeps one request', !r1.error && (waits?.length ?? 0) === 1, `${waits?.length} requests; ${msg(r2)}`);
    if (!x.error) await A.c.rpc('cancel_order', { p_order: idOf(x), p_reason: 'scenario' });
    const w = await A.c.rpc('set_wishlist', { p_slugs: [P1.slug, P1.slug, 'no-such-perfume'] });
    const { data: wl } = await A.c.rpc('my_wishlist');
    const slugs = JSON.stringify(wl ?? []);
    check('wishlist saves real perfumes once and ignores made-up ones', !w.error && !slugs.includes('no-such-perfume') && slugs.split(P1.slug).length - 1 === 1, `${msg(w)} ${slugs.slice(0, 120)}`);
  }
} catch (err) {
  check('scenario ran to the end', false, err.message);
} finally {
  await admin.auth.signOut();
  execSync('node --env-file=.env.local scripts/cleanup-test-users.mjs', { stdio: 'inherit' });
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('Failed:');
  for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
  process.exitCode = 1;
}
