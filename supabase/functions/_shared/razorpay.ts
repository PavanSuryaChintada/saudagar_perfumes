// Shared helpers for the Razorpay edge functions: API client, HMAC checks, paise maths, auth and responses.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

export const fail = (message: string, status = 400) => json({ error: message }, status);

export function keys() {
  const keyId = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
  return { keyId, keySecret, configured: !!keyId && !!keySecret };
}

export const toPaise = (rupees: number) => Math.round(Number(rupees) * 100);

export async function razorpay<T = Record<string, unknown>>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { keyId, keySecret } = keys();
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`, 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const description = (data as { error?: { description?: string } })?.error?.description ?? `Razorpay error ${res.status}`;
    throw new Error(description);
  }
  return data as T;
}

export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string compare. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** True when the request carries the server hook secret (database triggers and scheduled jobs). */
export function fromHook(req: Request, header = 'x-hook-secret'): boolean {
  const secret = Deno.env.get('SHIPPING_HOOK_SECRET') ?? '';
  return !!secret && safeEqual(req.headers.get(header) ?? '', secret);
}

export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
}

/** The signed-in caller (from the Authorization header), or null. */
export async function caller(req: Request): Promise<{ id: string; client: SupabaseClient } | null> {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data } = await client.auth.getUser();
  return data.user ? { id: data.user.id, client } : null;
}

/** Turns "CODE: sentence" database errors into the sentence. */
export function friendly(err: unknown): string {
  const message = err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err);
  const m = message.match(/^[A-Z][A-Z0-9_]{2,}:\s*(.+)$/s);
  return m ? m[1] : message;
}

export function code(err: unknown): string {
  const message = err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err);
  return message.match(/^([A-Z][A-Z0-9_]{2,}):/)?.[1] ?? '';
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  amount_refunded?: number;
  currency?: string;
  status: string;
  notes?: Record<string, string>;
}

/** Database errors that mean "this payment can't be used for this order" — the only ones that trigger a refund. */
const UNUSABLE = new Set(['OUT_OF_STOCK', 'ORDER_CANCELLED', 'PAYMENT_MISMATCH', 'PAYMENT_METHOD', 'ORDER_NOT_FOUND']);

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

type Outcome = { ok: true; orderNumber: string } | { ok: false; status: number; message: string };

/** A captured payment that can't be kept: refunded in full and written to the order's refund ledger. */
async function refundUnusable(db: SupabaseClient, order: { id: string }, payment: RazorpayPayment, reason: string) {
  const refund = await razorpay<{ id: string; status: string }>(`/payments/${payment.id}/refund`, {
    method: 'POST',
    body: { amount: payment.amount - (payment.amount_refunded ?? 0), notes: { order_id: order.id, reason: reason.slice(0, 200) } },
  });
  const { error } = await db.rpc('record_refund', {
    p_order: order.id,
    p_method: 'RAZORPAY',
    p_amount: (payment.amount - (payment.amount_refunded ?? 0)) / 100,
    p_status: refund.status === 'processed' ? 'REFUNDED' : 'PROCESSING',
    p_razorpay_refund_id: refund.id,
    p_reference: payment.id,
    p_note: `Automatic refund: ${reason}`,
    p_actor: null,
  });
  if (error) console.error('record automatic refund', order.id, error);
}

/** A second payment for an order that is already paid: given back, logged on the order (not in its ledger). */
async function refundDuplicate(db: SupabaseClient, order: { id: string; order_number: string }, payment: RazorpayPayment): Promise<Outcome> {
  if (payment.status === 'captured') {
    await razorpay(`/payments/${payment.id}/refund`, { method: 'POST', body: { amount: payment.amount, notes: { order_id: order.id, reason: 'duplicate payment' } } });
    await db.from('order_events').insert({
      order_id: order.id,
      kind: 'refund',
      message: `Second payment ${payment.id} (${rupees(payment.amount)}) refunded automatically: the order was already paid`,
      actor_role: 'system',
    });
  }
  return {
    ok: false,
    status: 409,
    message: `Order ${order.order_number} was already paid, so this extra payment of ${rupees(payment.amount)} ${payment.status === 'captured' ? 'is being refunded in full' : 'will be released back to you automatically'}.`,
  };
}

/**
 * The one confirmation path (verify and webhook). The payment must belong to the order, be in rupees and match the
 * order total; authorised payments are captured. Business refusals (sold out, cancelled) refund the payment at once;
 * anything else is thrown so the caller can retry — a good payment is never refunded because of a passing error.
 */
export async function confirmPayment(db: SupabaseClient, orderId: string, paymentId: string): Promise<Outcome> {
  const { data: order, error: readError } = await db
    .from('orders')
    .select('id, order_number, total, status, razorpay_order_id, payment_status, razorpay_payment_id')
    .eq('id', orderId)
    .maybeSingle();
  if (readError) throw readError;
  if (!order) return { ok: false, status: 404, message: "We couldn't find this order." };

  let payment = await razorpay<RazorpayPayment>(`/payments/${paymentId}`);
  if (order.payment_status === 'PAID' && order.razorpay_payment_id === payment.id) return { ok: true, orderNumber: order.order_number };
  if (payment.order_id !== order.razorpay_order_id) return { ok: false, status: 400, message: 'This payment belongs to a different order.' };
  if (payment.status === 'refunded' || (payment.amount_refunded ?? 0) >= payment.amount) {
    return { ok: false, status: 409, message: 'This payment has already been refunded.' };
  }
  if (!['PENDING', 'FAILED'].includes(order.payment_status)) return refundDuplicate(db, order, payment);
  if ((payment.currency ?? 'INR') !== 'INR' || payment.amount !== toPaise(order.total)) {
    if (payment.status === 'captured') await refundUnusable(db, order, payment, 'amount did not match the order');
    return { ok: false, status: 400, message: 'The amount paid did not match the order, so the payment is being returned to you.' };
  }
  if (payment.status === 'authorized') {
    try {
      payment = await razorpay<RazorpayPayment>(`/payments/${paymentId}/capture`, { method: 'POST', body: { amount: payment.amount, currency: 'INR' } });
    } catch (err) {
      // The webhook and the browser can capture at the same moment: if it's captured now, carry on.
      payment = await razorpay<RazorpayPayment>(`/payments/${paymentId}`);
      if (payment.status !== 'captured') throw err;
    }
  }
  if (payment.status !== 'captured') {
    return payment.status === 'failed'
      ? { ok: false, status: 402, message: "The payment didn't go through and no money was taken. Please try again." }
      : { ok: false, status: 202, message: "Your payment is still being processed. We'll confirm the order as soon as it completes — please don't pay again." };
  }

  const { error } = await db.rpc('confirm_order_payment', {
    p_order: order.id,
    p_razorpay_order_id: payment.order_id,
    p_payment_id: payment.id,
    p_amount_paise: payment.amount,
  });
  if (!error) return { ok: true, orderNumber: order.order_number };
  const reason = code(error);
  if (reason === 'ALREADY_PAID') return refundDuplicate(db, order, payment);
  if (!UNUSABLE.has(reason)) throw error;

  await refundUnusable(db, order, payment, friendly(error));
  return { ok: false, status: 409, message: `${friendly(error)} Your payment of ${rupees(payment.amount)} is being refunded in full; it usually reaches you in 5–7 working days.` };
}

/** Razorpay's own error text, for logs and admin messages. */
export function razorpayMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
