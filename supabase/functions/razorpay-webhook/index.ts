// Razorpay webhook: the safety net for customers who close the tab after paying.
// Events: payment.captured, payment.authorized, payment.failed, refund.processed, refund.failed.
import { confirmPayment, fail, hmacHex, json, keys, safeEqual, serviceClient } from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return fail('Use POST.', 405);
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? '';
  if (!secret || !keys().configured) return fail('Not configured.', 503);

  const raw = await req.text();
  const signature = req.headers.get('X-Razorpay-Signature') ?? '';
  const expected = await hmacHex(secret, raw);
  if (!safeEqual(expected, signature)) return fail('Bad signature.', 401);

  const event = JSON.parse(raw) as {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; notes?: Record<string, string>; error_description?: string } };
      refund?: { entity: { id: string } };
    };
  };
  const db = serviceClient();

  try {
    if (event.event === 'payment.captured' || event.event === 'payment.authorized') {
      const p = event.payload.payment!.entity;
      const orderId = p.notes?.order_id ?? (await db.from('orders').select('id').eq('razorpay_order_id', p.order_id).maybeSingle()).data?.id;
      if (orderId) await confirmPayment(db, orderId, p.id);
    } else if (event.event === 'payment.failed') {
      const p = event.payload.payment!.entity;
      const orderId = p.notes?.order_id ?? (await db.from('orders').select('id').eq('razorpay_order_id', p.order_id).maybeSingle()).data?.id;
      if (orderId) await db.rpc('mark_payment_failed', { p_order: orderId, p_reason: p.error_description ?? 'Payment failed' });
    } else if (event.event === 'refund.processed' || event.event === 'refund.failed') {
      const r = event.payload.refund!.entity;
      await db.rpc('update_refund_status', { p_razorpay_refund_id: r.id, p_status: event.event === 'refund.processed' ? 'REFUNDED' : 'FAILED' });
    }
  } catch (err) {
    console.error('webhook', event.event, err);
    return fail('Temporary error, please retry.', 500);
  }
  return json({ received: true });
});
