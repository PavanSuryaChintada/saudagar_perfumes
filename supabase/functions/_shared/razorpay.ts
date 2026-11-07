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

interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  notes?: Record<string, string>;
}

/**
 * The one confirmation path (verify and webhook): the payment must belong to the order and match its amount;
 * authorised payments are captured; if the order can't be fulfilled the payment is refunded at once.
 */
export async function confirmPayment(db: SupabaseClient, orderId: string, paymentId: string): Promise<{ ok: true; orderNumber: string } | { ok: false; status: number; message: string }> {
  const { data: order } = await db.from('orders').select('id, order_number, total, razorpay_order_id, payment_status, razorpay_payment_id').eq('id', orderId).maybeSingle();
  if (!order) return { ok: false, status: 404, message: 'Order not found.' };
  if (order.payment_status === 'PAID') {
    return order.razorpay_payment_id === paymentId ? { ok: true, orderNumber: order.order_number } : { ok: false, status: 409, message: 'This order is already paid.' };
  }
  let payment = await razorpay<RazorpayPayment>(`/payments/${paymentId}`);
  if (payment.order_id !== order.razorpay_order_id) return { ok: false, status: 400, message: 'The payment does not belong to this order.' };
  if (payment.amount !== toPaise(order.total)) return { ok: false, status: 400, message: 'The amount paid does not match the order.' };
  if (payment.status === 'authorized') {
    payment = await razorpay<RazorpayPayment>(`/payments/${paymentId}/capture`, { method: 'POST', body: { amount: payment.amount, currency: 'INR' } });
  }
  if (payment.status !== 'captured') return { ok: false, status: 402, message: 'The payment was not completed.' };

  const { error } = await db.rpc('confirm_order_payment', {
    p_order: order.id,
    p_razorpay_order_id: payment.order_id,
    p_payment_id: payment.id,
    p_amount_paise: payment.amount,
  });
  if (!error) return { ok: true, orderNumber: order.order_number };
  if (code(error) === 'ALREADY_PAID') return { ok: false, status: 409, message: friendly(error) };

  // Paid but can't be fulfilled (sold out, cancelled): refund straight away.
  try {
    const refund = await razorpay<{ id: string; status: string }>(`/payments/${payment.id}/refund`, {
      method: 'POST',
      body: { amount: payment.amount, notes: { order_id: order.id, reason: friendly(error) } },
    });
    await db.rpc('record_refund', {
      p_order: order.id,
      p_method: 'RAZORPAY',
      p_amount: payment.amount / 100,
      p_status: refund.status === 'processed' ? 'REFUNDED' : 'PROCESSING',
      p_razorpay_refund_id: refund.id,
      p_reference: payment.id,
      p_note: `Automatic refund: ${friendly(error)}`,
      p_actor: null,
    });
  } catch (refundErr) {
    console.error('automatic refund failed', order.id, refundErr);
  }
  return { ok: false, status: 409, message: `${friendly(error)} Your payment is being refunded in full.` };
}
