// Refunds through Razorpay. Callers: an admin (JWT), or the database when a paid online order is cancelled
// (x-hook-secret). Every refund is reserved in the ledger first (begin_refund), so several partial refunds are
// fine and a double click can never refund more than was paid.
//   {action: 'refund', order_id, amount?, note?}  admin: refund part or all of what's left
//   {action: 'auto', order_id}                    hook: refund everything that's left
//   {action: 'sync', order_id}                    admin: refresh refunds that are still processing
import { CORS, caller, code, fail, friendly, fromHook, json, keys, razorpay, razorpayMessage, serviceClient, toPaise } from '../_shared/razorpay.ts';

const mapStatus = (s: string) => (s === 'processed' ? 'REFUNDED' : s === 'failed' ? 'FAILED' : 'PROCESSING');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return fail('Use POST.', 405);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = typeof body.action === 'string' ? body.action : 'refund';
  const viaHook = fromHook(req);
  let actor: string | null = null;
  if (viaHook) {
    if (action !== 'auto') return fail('Not allowed.', 403);
  } else {
    const user = await caller(req);
    if (!user) return fail('Your session has expired. Please sign in again.', 401);
    const { data: isAdmin } = await user.client.rpc('is_admin');
    if (!isAdmin) return fail('Only admins can refund.', 403);
    if (action === 'auto') return fail('Not allowed.', 403);
    actor = user.id;
  }
  if (!keys().configured) {
    return fail('Online payment is not set up, so nothing can be refunded through Razorpay. Refund by UPI or bank transfer and record it on the return.', 503);
  }
  const orderId = body.order_id;
  if (typeof orderId !== 'string') return fail('Missing order.');
  const db = serviceClient();

  if (action === 'sync') {
    const { data: rows } = await db.from('refunds').select('id, razorpay_refund_id').eq('order_id', orderId).eq('method', 'RAZORPAY').eq('status', 'PROCESSING');
    let updated = 0;
    for (const row of rows ?? []) {
      if (!row.razorpay_refund_id) continue;
      try {
        const r = await razorpay<{ status: string }>(`/refunds/${row.razorpay_refund_id}`);
        await db.rpc('finish_refund', { p_refund: row.id, p_razorpay_refund_id: null, p_status: mapStatus(r.status) });
        updated += 1;
      } catch (err) {
        console.error('refund sync', row.id, razorpayMessage(err));
      }
    }
    return json({ checked: (rows ?? []).length, updated });
  }

  const amount = body.amount === undefined || body.amount === null || body.amount === '' ? null : Number(body.amount);
  if (amount !== null && !(amount > 0)) return fail('Enter an amount above ₹0.');
  const { data: started, error } = await db.rpc('begin_refund', {
    p_order: orderId,
    p_amount: action === 'auto' ? null : amount,
    p_note: action === 'auto' ? 'Automatic refund: order cancelled' : typeof body.note === 'string' ? body.note : null,
    p_actor: actor,
  });
  if (error) {
    // The hook fires on every paid cancellation; "nothing left to refund" is not worth an error.
    if (viaHook && ['REFUND_DONE', 'REFUND_NOT_ALLOWED'].includes(code(error))) return json({ skipped: friendly(error) });
    return fail(friendly(error), code(error) === 'ORDER_NOT_FOUND' ? 404 : 400);
  }
  const s = started as { refund_id: string; amount: number; payment_id: string; order_number: string };

  try {
    const refund = await razorpay<{ id: string; status: string }>(`/payments/${s.payment_id}/refund`, {
      method: 'POST',
      body: { amount: toPaise(s.amount), notes: { order_id: orderId, order_number: s.order_number, refund_row: s.refund_id } },
    });
    const status = mapStatus(refund.status);
    await db.rpc('finish_refund', { p_refund: s.refund_id, p_razorpay_refund_id: refund.id, p_status: status });
    return json({ status, refund_id: refund.id, amount: s.amount });
  } catch (err) {
    const why = razorpayMessage(err);
    console.error('refund', orderId, why);
    await db.rpc('finish_refund', { p_refund: s.refund_id, p_razorpay_refund_id: null, p_status: 'FAILED', p_note: why.slice(0, 200) });
    return fail(`Razorpay didn't accept the refund (${why}). Nothing was refunded; you can try again.`, 502);
  }
});
