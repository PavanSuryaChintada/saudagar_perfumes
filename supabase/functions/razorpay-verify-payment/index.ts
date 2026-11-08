// POST {order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature} after the checkout succeeds.
import { CORS, caller, confirmPayment, fail, hmacHex, json, keys, razorpayMessage, safeEqual, serviceClient } from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return fail('Use POST.', 405);
  const { keySecret, configured } = keys();
  if (!configured) return fail('Online payment is not set up yet.', 503);

  const user = await caller(req);
  if (!user) return fail('Your session has expired. Please sign in again. Your payment is safe and the order will update on its own.', 401);
  const body = await req.json().catch(() => ({}));
  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body as Record<string, unknown>;
  if ([order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature].some((v) => typeof v !== 'string')) return fail('Missing payment details.');

  const db = serviceClient();
  const { data: order } = await db.from('orders').select('id, user_id, razorpay_order_id').eq('id', order_id as string).maybeSingle();
  if (!order || order.user_id !== user.id) return fail("We couldn't find this order.", 404);
  if (order.razorpay_order_id !== razorpay_order_id) return fail('This payment belongs to a different order.');

  const expected = await hmacHex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
  if (!safeEqual(expected, razorpay_signature as string)) {
    return fail("We couldn't verify this payment. If money was taken, it will be confirmed or refunded automatically.", 400);
  }

  try {
    const result = await confirmPayment(db, order.id, razorpay_payment_id as string);
    return result.ok ? json({ status: 'paid', order_number: result.orderNumber }) : fail(result.message, result.status);
  } catch (err) {
    console.error('verify-payment', order.id, razorpayMessage(err));
    return fail("We received your payment but couldn't confirm the order just yet. Please don't pay again; it will update here within a few minutes.", 502);
  }
});
