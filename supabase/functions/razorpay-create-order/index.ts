// POST {order_id} → a Razorpay order for that store order. The amount always comes from the database.
// If money already reached Razorpay for this order (the confirmation is still on its way), the order is confirmed
// now instead of opening a second payment.
import { CORS, caller, confirmPayment, fail, json, keys, razorpay, razorpayMessage, serviceClient, toPaise, type RazorpayPayment } from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return fail('Use POST.', 405);
  const { keyId, configured } = keys();
  if (!configured) return fail('Online payment is not set up yet. Please choose cash on delivery.', 503);

  const user = await caller(req);
  if (!user) return fail('Your session has expired. Please sign in again.', 401);
  const { order_id } = await req.json().catch(() => ({}));
  if (typeof order_id !== 'string') return fail('Missing order.');

  const db = serviceClient();
  const { data: order } = await db
    .from('orders')
    .select('id, user_id, order_number, status, payment_method, payment_status, total, razorpay_order_id, customer_name, customer_email, customer_phone')
    .eq('id', order_id)
    .maybeSingle();
  if (!order || order.user_id !== user.id) return fail("We couldn't find this order.", 404);
  if (order.payment_method !== 'ONLINE') return fail('This order is cash on delivery, so there is nothing to pay now.');
  if (order.payment_status === 'PAID') return json({ status: 'paid', order_number: order.order_number });
  if (order.status !== 'PENDING') return fail('This order was cancelled, so it can no longer be paid.', 409);
  const amount = toPaise(order.total);
  if (amount < 100) return fail('The order total is too small to pay online.');

  try {
    let rzpOrderId: string | null = null;
    if (order.razorpay_order_id) {
      const existing = await razorpay<{ id: string; amount: number; status: string }>(`/orders/${order.razorpay_order_id}`);
      if (existing.status !== 'created') {
        // A payment was attempted: if one went through, confirm it rather than charging the customer again.
        const { items } = await razorpay<{ items: RazorpayPayment[] }>(`/orders/${existing.id}/payments`);
        const done = items.find((p) => p.status === 'captured' || p.status === 'authorized');
        if (done) {
          const result = await confirmPayment(db, order.id, done.id);
          return result.ok ? json({ status: 'paid', order_number: result.orderNumber }) : fail(result.message, result.status);
        }
      }
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
    console.error('create-order', order.id, razorpayMessage(err));
    return fail("We couldn't start the payment right now. Please try again in a minute, or choose cash on delivery.", 502);
  }
});
