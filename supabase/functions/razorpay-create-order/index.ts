// POST {order_id} → a Razorpay order for that store order. The amount always comes from the database.
import { CORS, caller, fail, json, keys, razorpay, serviceClient, toPaise } from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return fail('Use POST.', 405);
  const { keyId, configured } = keys();
  if (!configured) return fail('Online payments are not set up yet. Please choose cash on delivery.', 503);

  const user = await caller(req);
  if (!user) return fail('Please sign in again.', 401);
  const { order_id } = await req.json().catch(() => ({}));
  if (typeof order_id !== 'string') return fail('Missing order.');

  const db = serviceClient();
  const { data: order } = await db
    .from('orders')
    .select('id, user_id, order_number, status, payment_method, payment_status, total, razorpay_order_id, customer_name, customer_email, customer_phone')
    .eq('id', order_id)
    .maybeSingle();
  if (!order || order.user_id !== user.id) return fail('Order not found.', 404);
  if (order.payment_method !== 'ONLINE') return fail('This order is cash on delivery.');
  if (order.status !== 'PENDING') return fail('This order can no longer be paid.', 409);
  if (order.payment_status === 'PAID') return fail('This order is already paid.', 409);
  const amount = toPaise(order.total);
  if (amount < 100) return fail('The order total is too small to pay online.');

  try {
    let rzpOrderId: string | null = null;
    if (order.razorpay_order_id) {
      // Reuse the existing Razorpay order on a retry or double click.
      const existing = await razorpay<{ id: string; amount: number; status: string }>(`/orders/${order.razorpay_order_id}`);
      if (existing.amount === amount && existing.status !== 'paid') rzpOrderId = existing.id;
    }
    if (!rzpOrderId) {
      const created = await razorpay<{ id: string }>('/orders', {
        method: 'POST',
        body: { amount, currency: 'INR', receipt: order.order_number, notes: { order_id: order.id, order_number: order.order_number } },
      });
      rzpOrderId = created.id;
      const { error } = await db.rpc('set_razorpay_order', { p_order: order.id, p_razorpay_order_id: rzpOrderId });
      if (error) throw error;
    }
    return json({
      key_id: keyId,
      razorpay_order_id: rzpOrderId,
      amount,
      currency: 'INR',
      order_number: order.order_number,
      prefill: { name: order.customer_name ?? '', email: order.customer_email ?? '', contact: order.customer_phone ?? '' },
    });
  } catch (err) {
    console.error('create-order', err);
    return fail(err instanceof Error ? err.message : 'Could not start the payment.', 502);
  }
});
