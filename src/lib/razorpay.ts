import { supabase } from './supabase';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (resp: unknown) => void) => void };
  }
}

const SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
let loading: Promise<void> | null = null;

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error("We couldn't load the payment window. Check your connection and try again."));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/** Reads the `{error}` body from a failed edge-function call. */
async function functionError(error: unknown): Promise<Error> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = await ctx.json();
      if (body?.error) return new Error(body.error);
    } catch {
      // fall through
    }
  }
  return new Error((error as Error)?.message || 'Something went wrong with the payment.');
}

export async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw await functionError(error);
  return data as T;
}

export type PayResult = { status: 'paid'; orderNumber: string } | { status: 'dismissed' } | { status: 'failed'; message: string };

/** Opens Razorpay for a store order and confirms the payment on the server. */
export async function payOrder(orderId: string, opts: { brand?: string; color?: string } = {}): Promise<PayResult> {
  const start = await invokeFunction<{
    key_id: string;
    razorpay_order_id: string;
    amount: number;
    currency: string;
    order_number: string;
    prefill: Record<string, string>;
  }>('razorpay-create-order', { order_id: orderId });
  await loadCheckout();

  return new Promise<PayResult>((resolve) => {
    let settled = false;
    const done = (r: PayResult) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    const rzp = new window.Razorpay!({
      key: start.key_id,
      order_id: start.razorpay_order_id,
      amount: start.amount,
      currency: start.currency,
      name: opts.brand || 'Saudagar Perfumers',
      description: `Order ${start.order_number}`,
      prefill: start.prefill,
      theme: opts.color ? { color: opts.color } : undefined,
      handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const ok = await invokeFunction<{ order_number: string }>('razorpay-verify-payment', { order_id: orderId, ...resp });
          done({ status: 'paid', orderNumber: ok.order_number });
        } catch (err) {
          done({ status: 'failed', message: (err as Error).message });
        }
      },
      modal: { ondismiss: () => done({ status: 'dismissed' }) },
    });
    rzp.on('payment.failed', (resp) => {
      const description = (resp as { error?: { description?: string } })?.error?.description;
      done({ status: 'failed', message: description || 'The payment failed. You can try again from your order.' });
    });
    rzp.open();
  });
}
