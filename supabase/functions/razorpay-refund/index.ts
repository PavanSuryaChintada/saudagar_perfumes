// Admin only. POST {action: 'refund', order_id, amount?, note?} → one Razorpay refund per order.
//             POST {action: 'sync', order_id} → refresh a refund that is still processing.
import { CORS, caller, fail, json, keys, razorpay, serviceClient, toPaise } from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return fail('Use POST.', 405);
  if (!keys().configured) return fail('Online payments are not set up yet.', 503);

  const user = await caller(req);
  if (!user) return fail('Please sign in again.', 401);
  const { data: isAdmin } = await user.client.rpc('is_admin');
  if (!isAdmin) return fail('Only admins can refund.', 403);

  const { action = 'refund', order_id, amount, note } = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof order_id !== 'string') return fail('Missing order.');
  const db = serviceClient();
  const { data: order } = await db
    .from('orders')
    .select('id, order_number, payment_method, payment_status, total, amount_refunded, razorpay_payment_id')
    .eq('id', order_id)
    .maybeSingle();
  if (!order) return fail('Order not found.', 404);

  try {
    if (action === 'sync') {
      const { data: refund } = await db.from('refunds').select('razorpay_refund_id').eq('order_id', order.id).eq('method', 'RAZORPAY').neq('status', 'FAILED').maybeSingle();
      if (!refund?.razorpay_refund_id) return fail('No online refund on this order.', 404);
      const r = await razorpay<{ status: string }>(`/refunds/${refund.razorpay_refund_id}`);
      const status = r.status === 'processed' ? 'REFUNDED' : r.status === 'failed' ? 'FAILED' : 'PROCESSING';
      await db.rpc('update_refund_status', { p_razorpay_refund_id: refund.razorpay_refund_id, p_status: status });
      return json({ status });
    }

    if (order.payment_method !== 'ONLINE' || !order.razorpay_payment_id || !['PAID', 'PARTIALLY_REFUNDED'].includes(order.payment_status)) {
      return fail('Only paid online orders can be refunded here. Record cash refunds from the order page.');
    }
    const { count } = await db.from('refunds').select('id', { count: 'exact', head: true }).eq('order_id', order.id).eq('method', 'RAZORPAY').neq('status', 'FAILED');
    if ((count ?? 0) > 0) return fail('This order already has an online refund.', 409);
    const paid = Number(order.total) - Number(order.amount_refunded ?? 0);
    const value = amount === undefined || amount === null || amount === '' ? paid : Number(amount);
    if (!(value > 0) || value > paid) return fail(`Refund between ₹1 and ₹${paid.toFixed(2)}.`);

    const refund = await razorpay<{ id: string; status: string }>(`/payments/${order.razorpay_payment_id}/refund`, {
      method: 'POST',
      body: { amount: toPaise(value), notes: { order_id: order.id, order_number: order.order_number } },
    });
    const status = refund.status === 'processed' ? 'REFUNDED' : 'PROCESSING';
    const { error } = await db.rpc('record_refund', {
      p_order: order.id,
      p_method: 'RAZORPAY',
      p_amount: value,
      p_status: status,
      p_razorpay_refund_id: refund.id,
      p_reference: order.razorpay_payment_id,
      p_note: typeof note === 'string' ? note : null,
      p_actor: user.id,
    });
    if (error) throw error;
    return json({ status, refund_id: refund.id });
  } catch (err) {
    console.error('refund', err);
    return fail(err instanceof Error ? err.message : 'Refund failed.', 502);
  }
});
