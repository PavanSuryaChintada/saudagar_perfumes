// Razorpay webhook: the safety net for customers who close the tab after paying.
// Events: payment.captured, payment.authorized, payment.failed, refund.processed, refund.failed.
// Answers 200 once an event is handled (or can't ever be); 500 only for passing errors, so Razorpay retries.
import { confirmPayment, fail, hmacHex, json, keys, razorpayMessage, safeEqual, serviceClient } from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return fail('Use POST.', 405);
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? '';
  if (!secret || !keys().configured) return fail('Not configured.', 503);

  const raw = await req.text();
  const signature = req.headers.get('X-Razorpay-Signature') ?? '';
  const expected = await hmacHex(secret, raw);
  if (!safeEqual(expected, signature)) return fail('Bad signature.', 401);

  let event: {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; notes?: Record<string, string>; error_description?: string } };
      refund?: { entity: { id: string; notes?: Record<string, string> } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return fail('Bad payload.', 400);
  }
  const db = serviceClient();

  // The Razorpay order id is authoritative (payment notes can be set by the browser).
  const orderFor = async (p: { order_id: string; notes?: Record<string, string> }) => {
    if (p.order_id) {
      const { data, error } = await db.from('orders').select('id').eq('razorpay_order_id', p.order_id).maybeSingle();
      if (error) throw error;
      if (data) return data.id as string;
    }
    return null;
  };

  try {
    if (event.event === 'payment.captured' || event.event === 'payment.authorized') {
      const p = event.payload.payment!.entity;
      const orderId = await orderFor(p);
      if (orderId) await confirmPayment(db, orderId, p.id);
    } else if (event.event === 'payment.failed') {
      const p = event.payload.payment!.entity;
      const orderId = await orderFor(p);
      if (orderId) {
        const { error } = await db.rpc('mark_payment_failed', { p_order: orderId, p_reason: p.error_description ?? 'Payment failed' });
        if (error) throw error;
      }
    } else if (event.event === 'refund.processed' || event.event === 'refund.failed') {
      const r = event.payload.refund!.entity;
      const status = event.event === 'refund.processed' ? 'REFUNDED' : 'FAILED';
      const { data: known, error } = await db.rpc('update_refund_status', { p_razorpay_refund_id: r.id, p_status: status });
      if (error) throw error;
      // The webhook can arrive before the refund call has saved Razorpay's id: match it by our ledger row.
      if (!known && r.notes?.refund_row) {
        const { error: e2 } = await db.rpc('finish_refund', { p_refund: r.notes.refund_row, p_razorpay_refund_id: r.id, p_status: status });
        if (e2) throw e2;
      }
    }
  } catch (err) {
    console.error('webhook', event.event, razorpayMessage(err));
    return fail('Temporary error, please retry.', 500);
  }
  return json({ received: true });
});
