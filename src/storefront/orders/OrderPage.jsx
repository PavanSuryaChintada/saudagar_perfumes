import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router';
import { useOrder, useCancelOrder, formatOrderDate, formatOrderDateTime } from './useOrders';
import { ORDER_STATUS_LABEL, ORDER_STEPS, canCustomerCancel, paymentLabel } from '../../lib/orders';
import { formatINR } from '../../lib/money';
import { toFriendlyError } from '../../lib/errors';
import { formatIndianPhone } from '../../lib/phone';
import MinimalHeader from '../MinimalHeader';
import { PLACEHOLDER_IMAGE } from '../catalog/adapter';
import { payOrder } from '../../lib/razorpay';
import { useQueryClient } from '@tanstack/react-query';

const STEP_TIME = { PENDING: 'created_at', PACKED: 'packed_at', SHIPPED: 'shipped_at', OUT_FOR_DELIVERY: 'out_for_delivery_at', DELIVERED: 'delivered_at' };

/** /orders/:id — confirmation after checkout and the customer's order details. */
export default function OrderPage({ orderId, theme, onToggleTheme, onNavigateHome }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const justPlaced = params.get('placed') === '1';
  const paymentNotice = params.get('payment');
  const qc = useQueryClient();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(paymentNotice === 'failed' ? params.get('reason') || 'The payment failed.' : '');
  const pay = async (id) => {
    setPaying(true);
    setPayError('');
    try {
      const r = await payOrder(id);
      if (r.status === 'failed') setPayError(r.message);
      if (r.status === 'dismissed') setPayError('Payment cancelled. Your order is saved — pay whenever you are ready.');
      await qc.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      setPayError(toFriendlyError(err));
    } finally {
      setPaying(false);
    }
  };
  const { data: order, isLoading, error } = useOrder(orderId);
  const cancel = useCancelOrder();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const back = () => navigate('/account');

  let body;
  if (isLoading) body = <p className="py-24 text-center text-[13px] text-[#888888]">Loading your order…</p>;
  else if (error) body = <p className="py-24 text-center text-[13px] text-rose-600">{toFriendlyError(error)}</p>;
  else if (!order) body = <p className="py-24 text-center text-[13px] text-[#888888]">We couldn't find this order.</p>;
  else {
    const items = order.order_items.filter((i) => i.line_type === 'item');
    const samples = order.order_items.filter((i) => i.line_type === 'sample');
    const a = order.shipping_address || {};
    const stopped = order.status === 'CANCELLED' || order.status === 'RTO';
    const reached = ORDER_STEPS.indexOf(order.status);

    body = (
      <div className="space-y-10">
        {justPlaced && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3 pb-8 border-b border-[#F0F0F0] dark:border-white/10">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold border border-emerald-200 dark:border-emerald-800/40">
              ✓
            </div>
            <span className="text-[10px] uppercase tracking-[0.24em] font-medium text-tk-accent dark:text-tk-accent-night block">Order placed</span>
            <h1 className="text-[26px] sm:text-[32px] font-normal uppercase tracking-tight">Thank you{order.customer_name ? `, ${order.customer_name.split(' ')[0]}` : ''}.</h1>
            <p className="text-[12.5px] text-[#777777] dark:text-[#A09D96]">
              Your order number is <span className="font-mono font-semibold text-tk-ink dark:text-white">{order.order_number}</span>.
              {order.payment_method === 'COD' && <> Please keep {formatINR(Number(order.total))} ready for the courier.</>}
            </p>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-[0.24em] text-[#888888] block mb-1 font-medium">Order {order.order_number}</span>
            <h2 className="text-[22px] sm:text-[28px] font-normal tracking-[-0.01em]">{ORDER_STATUS_LABEL[order.status] ?? order.status}</h2>
            <p className="text-[12px] text-[#777777] dark:text-[#999999] mt-0.5">Placed on {formatOrderDate(order.created_at)} · {paymentLabel(order)}</p>
          </div>
          {canCustomerCancel(order.status) && !confirming && (
            <button type="button" onClick={() => setConfirming(true)} className="text-[11px] uppercase tracking-[0.16em] text-rose-600 hover:text-rose-700 underline underline-offset-4 self-start sm:self-auto">
              Cancel order
            </button>
          )}
        </div>

        {order.payment_method === 'ONLINE' && order.status === 'PENDING' && order.payment_status !== 'PAID' && (
          <div className="p-5 border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 space-y-3 text-[12.5px]">
            <p className="font-medium">
              {paymentNotice === 'cancelled' && !payError ? 'Payment cancelled. Your order is saved.' : 'This order is waiting for payment.'}
            </p>
            {payError && <p className="text-rose-600">{payError}</p>}
            <p className="text-[#666666] dark:text-[#AAAAAA]">Unpaid online orders are cancelled after 24 hours.</p>
            <button
              type="button"
              disabled={paying}
              onClick={() => pay(order.id)}
              className="px-5 py-2 bg-tk-ink hover:bg-tk-accent text-white dark:bg-tk-gold dark:text-tk-night text-[11px] uppercase tracking-wider rounded-[2px] disabled:opacity-60"
            >
              {paying ? 'Opening payment…' : `Pay ${formatINR(Number(order.total))} now`}
            </button>
          </div>
        )}

        {confirming && (
          <div className="p-5 border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 space-y-3 text-[12.5px]">
            <p className="font-medium">Cancel this order?</p>
            <label htmlFor="cancel-reason" className="block text-[10.5px] uppercase tracking-wider text-[#777777]">Reason (optional)</label>
            <input
              id="cancel-reason"
              type="text"
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-white dark:bg-transparent outline-none"
            />
            {cancelError && <p className="text-rose-600 text-[11.5px]">{cancelError}</p>}
            <div className="flex gap-4">
              <button
                type="button"
                disabled={cancel.isPending}
                onClick={async () => {
                  setCancelError('');
                  try {
                    await cancel.mutateAsync({ id: order.id, reason });
                    setConfirming(false);
                  } catch (err) {
                    setCancelError(toFriendlyError(err));
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] uppercase tracking-wider rounded-[2px] disabled:opacity-60"
              >
                {cancel.isPending ? 'Cancelling…' : 'Yes, cancel it'}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="text-[11px] uppercase tracking-wider text-[#777777]">Keep my order</button>
            </div>
          </div>
        )}

        {stopped ? (
          <p className="px-4 py-3 text-[12.5px] border border-[#EEEEEE] dark:border-white/10 text-[#666666] dark:text-[#AAAAAA]">
            {order.status === 'CANCELLED'
              ? `This order was cancelled on ${formatOrderDate(order.cancelled_at)}${order.cancel_reason ? ` — ${order.cancel_reason}` : ''}.`
              : 'This parcel came back to us. We will be in touch.'}
          </p>
        ) : (
          <ol className="grid grid-cols-5 gap-1 text-[10px] sm:text-[11px] uppercase tracking-[0.08em]" aria-label="Order progress">
            {ORDER_STEPS.map((s, i) => {
              const done = i <= reached;
              const at = order[STEP_TIME[s]];
              return (
                <li key={s} className="space-y-1.5" aria-current={i === reached ? 'step' : undefined}>
                  <span className={`block h-[3px] ${done ? 'bg-tk-ink dark:bg-tk-accent-night' : 'bg-[#EEEEEE] dark:bg-white/10'}`} />
                  <span className={done ? 'text-tk-ink dark:text-white font-medium' : 'text-[#AAAAAA]'}>{ORDER_STATUS_LABEL[s]}</span>
                  {done && at && <span className="block normal-case tracking-normal text-[10px] text-[#888888]">{formatOrderDate(at)}</span>}
                </li>
              );
            })}
          </ol>
        )}

        {order.tracking_number && (
          <p className="text-[12.5px]">
            {order.courier_name || 'Courier'} tracking: <span className="font-mono">{order.tracking_number}</span>
            {order.tracking_url && (
              <a href={order.tracking_url} target="_blank" rel="noreferrer" className="ml-2 underline underline-offset-4 text-tk-accent dark:text-tk-accent-night">Track parcel</a>
            )}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="divide-y divide-[#F0F0F0] dark:divide-white/10 border-y border-[#F0F0F0] dark:border-white/10">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-4 py-4">
                  <img src={i.image_url || PLACEHOLDER_IMAGE} alt="" className="w-16 h-16 object-contain bg-[#F7F7F6] dark:bg-[#18171C] rounded-[2px]" />
                  <div className="flex-1 min-w-0 text-[12.5px]">
                    <p className="uppercase tracking-wide truncate">{i.product_name}</p>
                    <p className="text-[11.5px] text-[#888888]">{i.variant_label} · Qty {i.qty} · {formatINR(Number(i.unit_price))} each</p>
                  </div>
                  <span className="text-[13px] tabular-nums">{formatINR(Number(i.line_total))}</span>
                </div>
              ))}
            </div>
            {(samples.length > 0 || order.samples_short > 0) && (
              <div className="text-[12.5px]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-tk-accent dark:text-tk-accent-night font-medium mb-2">Free samples</p>
                <ul className="space-y-1 text-[#555555] dark:text-[#BBBBBB]">
                  {samples.map((s) => (
                    <li key={s.id}>
                      {s.product_name} · {s.variant_label}
                      {s.sample_auto && <span className="text-[#999999]"> (chosen for you)</span>}
                    </li>
                  ))}
                </ul>
                {order.samples_short > 0 && (
                  <p className="mt-2 text-[11.5px] text-[#888888]">
                    {order.samples_short} sample{order.samples_short === 1 ? ' was' : 's were'} out of stock when you ordered — sorry about that.
                  </p>
                )}
              </div>
            )}
            {order.note && (
              <p className="text-[12.5px] text-[#666666] dark:text-[#AAAAAA]">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#888888] block mb-1">Your note</span>
                {order.note}
              </p>
            )}
          </div>

          <div className="space-y-6 text-[12.5px]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#888888] mb-2 font-medium">Delivering to</p>
              <p className="leading-relaxed text-[#555555] dark:text-[#BBBBBB]">
                <span className="text-tk-ink dark:text-white font-medium">{a.full_name}</span>
                <br />
                {[a.line1, a.line2, a.landmark && `Near ${a.landmark}`].filter(Boolean).join(', ')}
                <br />
                {a.city}, {a.state} {a.pincode}
                <br />
                {a.phone && formatIndianPhone(a.phone)}
              </p>
            </div>
            <div className="space-y-1.5 pt-4 border-t border-[#F0F0F0] dark:border-white/10">
              <div className="flex justify-between text-[#777777]"><span>Subtotal</span><span>{formatINR(Number(order.subtotal))}</span></div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                  <span>−{formatINR(Number(order.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-[#777777]"><span>Delivery</span><span>{Number(order.shipping_fee) === 0 ? 'FREE' : formatINR(Number(order.shipping_fee))}</span></div>
              <div className="flex justify-between text-[14px] font-medium pt-2 border-t border-[#F0F0F0] dark:border-white/10"><span>Total</span><span>{formatINR(Number(order.total))}</span></div>
              <p className="text-[11px] text-[#888888]">{paymentLabel(order)}</p>
            </div>
            {order.order_events?.length > 0 && (
              <div className="pt-4 border-t border-[#F0F0F0] dark:border-white/10">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#888888] mb-2 font-medium">History</p>
                <ul className="space-y-1.5 text-[11.5px] text-[#666666] dark:text-[#AAAAAA]">
                  {order.order_events
                    .filter((e) => e.kind !== 'note')
                    .map((e) => (
                      <li key={e.id}>
                        <span className="text-[#999999]">{formatOrderDateTime(e.created_at)}</span> · {e.to_status ? ORDER_STATUS_LABEL[e.to_status] ?? e.to_status : e.kind}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-tk-night text-tk-ink dark:text-white transition-colors duration-300 font-sans pb-28">
      <MinimalHeader backLabel="Your orders" onBack={back} onLogo={onNavigateHome} theme={theme} onToggleTheme={onToggleTheme} />
      <main className="max-w-5xl mx-auto px-4 sm:px-10 pt-10 sm:pt-14">{body}</main>
    </div>
  );
}
