import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { formatINR } from '../../../lib/money';
import { formatIndianPhone } from '../../../lib/phone';
import { ORDER_STATUS_LABEL, allowedNextStatuses, paymentLabel, type OrderStatus } from '../../../lib/orders';
import { formatOrderDateTime } from '../../../storefront/orders/useOrders';
import { PageHeader, Panel } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextArea, TextInput } from '../../ui/Field';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { rpc, throwIf } from '../../catalog/api';
import { useAdminOrder, useOrdersRealtime } from '../../orders/api';
import { StatusBadge } from './OrdersPage';
import { invokeFunction } from '../../../lib/razorpay';
import { useCouriers } from '../../orders/shipping';

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  PACKED: 'Mark packed',
  SHIPPED: 'Mark shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Mark delivered',
  RTO: 'Returned to origin (RTO)',
  CANCELLED: 'Cancel order',
};

export default function OrderDetailPage() {
  useOrdersRealtime();
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: o, isLoading, error } = useAdminOrder(id);
  const [moving, setMoving] = useState<OrderStatus | null>(null);
  const [moveNote, setMoveNote] = useState('');
  const [tracking, setTracking] = useState({ courier_name: '', tracking_number: '', tracking_url: '' });
  const [adminNote, setAdminNote] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [shipCourier, setShipCourier] = useState('');
  const [shipAwb, setShipAwb] = useState('');
  const [retrying, setRetrying] = useState(false);
  const couriers = useCouriers();
  const [refundAmount, setRefundAmount] = useState('');

  useEffect(() => {
    if (!o) return;
    setTracking({ courier_name: o.courier_name ?? '', tracking_number: o.tracking_number ?? '', tracking_url: o.tracking_url ?? '' });
    setAdminNote(o.admin_note ?? '');
  }, [o]);

  if (isLoading) return <p className="text-[14px] text-[#4A4A4A]">Loading…</p>;
  if (error) return <p className="text-[14px] text-rose-600">{toFriendlyError(error)}</p>;
  if (!o) return <p className="text-[14px] text-[#4A4A4A]">This order doesn't exist. <Link to="/admin/orders" className="underline">Back to orders</Link></p>;

  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['admin', 'order', id] }), qc.invalidateQueries({ queryKey: ['admin', 'orders'] })]);
  const next = allowedNextStatuses(o.status as OrderStatus, o.payment_method, o.payment_status);
  const items = o.order_items.filter((i) => i.line_type === 'item');
  const samples = o.order_items.filter((i) => i.line_type === 'sample');
  const a = o.shipping_address || {};
  const infoDirty =
    tracking.courier_name !== (o.courier_name ?? '') || tracking.tracking_number !== (o.tracking_number ?? '') || tracking.tracking_url !== (o.tracking_url ?? '') || adminNote !== (o.admin_note ?? '');

  const saveInfo = async () => {
    setSavingInfo(true);
    try {
      const url = tracking.tracking_url.trim();
      if (url && !/^https?:\/\//i.test(url)) throw new Error('Tracking link must start with http:// or https://');
      await throwIf(
        supabase
          .from('orders')
          .update({
            courier_name: tracking.courier_name.trim() || null,
            tracking_number: tracking.tracking_number.trim() || null,
            tracking_url: url || null,
            admin_note: adminNote.trim() || null,
          })
          .eq('id', o.id),
      );
      if (tracking.tracking_number.trim() && tracking.tracking_number.trim() !== (o.tracking_number ?? '')) {
        await throwIf(
          supabase.from('order_events').insert({
            order_id: o.id,
            kind: 'tracking',
            message: `${tracking.courier_name.trim() || 'Courier'} · ${tracking.tracking_number.trim()}`,
            actor_role: 'admin',
          }),
        );
      }
      await refresh();
      toast.success('Saved.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setSavingInfo(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin/orders" className="inline-flex items-center gap-1 text-[13px] text-[#4A4A4A] hover:text-tk-ink mb-3">
          <ArrowLeft size={13} /> Orders
        </Link>
        <PageHeader
          title={`Order ${o.order_number}`}
          description={`Placed ${formatOrderDateTime(o.created_at)} · ${paymentLabel(o)}`}
          actions={
            <>
              <a href={`/admin/orders/${o.id}/print?doc=invoice`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#C4C1B9] bg-white text-[13px] hover:border-tk-ink">
                <Printer size={13} /> Invoice
              </a>
              <a href={`/admin/orders/${o.id}/print?doc=slip`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#C4C1B9] bg-white text-[13px] hover:border-tk-ink">
                <Printer size={13} /> Packing slip
              </a>
            </>
          }
        />
      </div>

      <Panel title="Status">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={o.status} />
          {next.length === 0 && <span className="text-[13px] text-[#4A4A4A]">No further steps.</span>}
          {next.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === 'CANCELLED' || s === 'RTO' ? 'secondary' : 'primary'}
              onClick={() => {
                if (s === 'SHIPPED' && !o.tracking_number) {
                  setShipCourier(o.courier || couriers[0]?.key || 'other');
                  setShipAwb('');
                  setShipOpen(true);
                  return;
                }
                setMoveNote('');
                setMoving(s);
              }}
            >
              {ACTION_LABEL[s] ?? ORDER_STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
        {o.status === 'CANCELLED' && (
          <p className="mt-3 text-[13px] text-[#454545]">
            Cancelled by {o.cancelled_by === 'customer' ? 'the customer' : 'the store'} on {formatOrderDateTime(o.cancelled_at)}
            {o.cancel_reason ? ` — ${o.cancel_reason}` : ''}. Stock was put back.
          </p>
        )}
        {o.status === 'RTO' && <p className="mt-3 text-[13px] text-[#454545]">The parcel came back. Decide on restocking from the Returns page once it arrives.</p>}
        {o.status === 'PACKED' && !o.tracking_number && (
          <p className="mt-3 text-[13px] text-[#454545]">
            {o.courier === 'delhivery' ? 'Booking with Delhivery…' : 'Awaiting booking: print the label, book the parcel, then press Mark shipped and enter the tracking number.'}
          </p>
        )}
        {(o as unknown as { shipping_error: string | null }).shipping_error && (
          <div className="mt-3 px-3 py-2 bg-rose-50 border border-rose-200 text-[13px] text-rose-700 flex flex-wrap items-center gap-3">
            <span>Courier booking failed: {(o as unknown as { shipping_error: string }).shipping_error}</span>
            <Button
              size="sm"
              variant="secondary"
              busy={retrying}
              onClick={async () => {
                setRetrying(true);
                try {
                  await invokeFunction('shipping', { action: 'create', order_id: o.id });
                  toast.success('Shipment booked.');
                } catch (err) {
                  toast.error(toFriendlyError(err));
                } finally {
                  setRetrying(false);
                  await refresh();
                }
              }}
            >
              Retry shipment
            </Button>
          </div>
        )}
        {(o as unknown as { shipping_status: string | null }).shipping_status && (
          <p className="mt-2 text-[12px] text-[#4F4F4F]">Courier says: {(o as unknown as { shipping_status: string }).shipping_status}</p>
        )}
        {(o as unknown as { label_url: string | null }).label_url && (
          <a href={(o as unknown as { label_url: string }).label_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] underline">Courier label (PDF)</a>
        )}
        {o.payment_method === 'ONLINE' && ['PAID', 'PARTIALLY_REFUNDED'].includes(o.payment_status) && (
          <div className="mt-4 pt-4 border-t border-[#E2E0DB] flex flex-wrap items-end gap-3">
            {['CANCELLED', 'RTO'].includes(o.status) && (
              <p role="status" className="basis-full text-[13.5px] bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2">
                {o.status === 'CANCELLED' ? 'This order was cancelled after it was paid.' : 'This paid order came back to us.'} {formatINR(Number(o.total) - Number(o.amount_refunded ?? 0))} still has to go back to the customer
                {o.status === 'CANCELLED' ? '. An automatic refund starts when it is cancelled (see the history below); refund here if it did not start.' : ', unless you are re-sending it.'}
              </p>
            )}
            <FieldShell
              label="Refund online (₹)"
              htmlFor="rf-amount"
              help={`Up to ${formatINR(Number(o.total) - Number(o.amount_refunded ?? 0))} can still be refunded${Number(o.amount_refunded ?? 0) > 0 ? ` (${formatINR(Number(o.amount_refunded))} already refunded)` : ''}. Leave empty for all of it; you can refund part now and more later.`}
            >
              <TextInput id="rf-amount" inputMode="decimal" placeholder="Full amount" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="max-w-[160px]" />
            </FieldShell>
            <Button variant="secondary" onClick={() => setRefunding(true)}>Refund to customer</Button>
          </div>
        )}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5 min-w-0">
          <Panel title="Items">
            <div className="divide-y divide-[#E9E7E2]">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 py-2.5 text-[14px]">
                  <div className="w-12 h-12 bg-[#F4F3EE] shrink-0">{i.image_url && <img src={i.image_url} alt="" className="w-full h-full object-contain" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{i.product_name}</p>
                    <p className="text-[12px] text-[#4F4F4F]">{i.variant_label} · SKU {(i as unknown as { sku: string }).sku}</p>
                  </div>
                  <span className="text-[13px] text-[#454545] tabular-nums">{i.qty} × {formatINR(Number(i.unit_price))}</span>
                  <span className="w-24 text-right tabular-nums">{formatINR(Number(i.line_total))}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#E2E0DB] space-y-1 text-[14px] max-w-[320px] ml-auto">
              <div className="flex justify-between text-[#454545]"><span>Subtotal</span><span>{formatINR(Number(o.subtotal))}</span></div>
              {Number(o.discount) > 0 && <div className="flex justify-between text-emerald-700"><span>Discount {o.coupon_code ? `(${o.coupon_code})` : ''}</span><span>−{formatINR(Number(o.discount))}</span></div>}
              <div className="flex justify-between text-[#454545]"><span>Delivery</span><span>{Number(o.shipping_fee) === 0 ? 'Free' : formatINR(Number(o.shipping_fee))}</span></div>
              <div className="flex justify-between font-medium pt-1 border-t border-[#E2E0DB]"><span>Total</span><span>{formatINR(Number(o.total))}</span></div>
            </div>
          </Panel>

          <Panel title={`Free samples (${samples.length} of ${o.samples_entitled})`}>
            {samples.length === 0 && o.samples_entitled === 0 && <p className="text-[13px] text-[#4A4A4A]">This order didn't earn samples.</p>}
            <ul className="space-y-1 text-[14px]">
              {samples.map((s) => (
                <li key={s.id}>
                  {s.product_name} · {s.variant_label}
                  <span className="text-[12px] text-[#4F4F4F]">{s.sample_auto ? ' — chosen by the store' : ' — customer’s pick'}</span>
                </li>
              ))}
            </ul>
            {o.samples_short > 0 && (
              <p className="mt-2 text-[13px] text-rose-600">{o.samples_short} sample{o.samples_short === 1 ? ' was' : 's were'} out of stock at order time. Consider adding one by hand.</p>
            )}
          </Panel>

          <Panel title="History">
            <ul className="space-y-2 text-[13.5px]">
              {(o.order_events ?? []).map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="text-[#4F4F4F] whitespace-nowrap">{formatOrderDateTime(e.created_at)}</span>
                  <span>
                    {e.to_status ? ORDER_STATUS_LABEL[e.to_status as OrderStatus] ?? e.to_status : e.kind === 'tracking' ? 'Tracking added' : 'Note'}
                    {e.message ? <span className="text-[#454545]"> — {e.message}</span> : null}
                    {e.actor_role ? <span className="text-[#575757]"> · {e.actor_role}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Customer">
            <p className="text-[14px]">{o.customer_name}</p>
            <p className="text-[13px] text-[#454545]">{o.customer_email}</p>
            {o.customer_phone && (
              <p className="text-[13px] text-[#454545]">
                <a href={`tel:+91${o.customer_phone}`} className="underline">{formatIndianPhone(o.customer_phone)}</a>
              </p>
            )}
            <p className="text-[12px] text-[#454545] mt-4 mb-1 font-medium">Ship to</p>
            <p className="text-[13.5px] leading-relaxed text-[#444444]">
              {a.full_name}
              <br />
              {[a.line1, a.line2].filter(Boolean).join(', ')}
              {a.landmark ? <><br />Near {a.landmark}</> : null}
              <br />
              {a.city}, {a.state} {a.pincode}
            </p>
            {o.note && (
              <>
                <p className="text-[12px] text-[#454545] mt-4 mb-1 font-medium">Customer note</p>
                <p className="text-[13.5px] text-[#444444] whitespace-pre-line">{o.note}</p>
              </>
            )}
          </Panel>

          <Panel title="Shipping & notes">
            <div className="space-y-3">
              <FieldShell label="Courier" htmlFor="t-courier">
                <TextInput id="t-courier" placeholder="e.g. India Post" value={tracking.courier_name} onChange={(e) => setTracking({ ...tracking, courier_name: e.target.value })} />
              </FieldShell>
              <FieldShell label="Tracking number" htmlFor="t-num">
                <TextInput id="t-num" placeholder="e.g. EK123456789IN" value={tracking.tracking_number} onChange={(e) => setTracking({ ...tracking, tracking_number: e.target.value })} />
              </FieldShell>
              <FieldShell label="Tracking link" htmlFor="t-url" help="The customer sees a 'Track parcel' link.">
                <TextInput id="t-url" placeholder="https://…" value={tracking.tracking_url} onChange={(e) => setTracking({ ...tracking, tracking_url: e.target.value })} />
              </FieldShell>
              <FieldShell label="Internal note" htmlFor="t-note" help="Only admins see this.">
                <TextArea id="t-note" rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
              </FieldShell>
              <Button onClick={saveInfo} busy={savingInfo} disabled={!infoDirty}>Save</Button>
            </div>
          </Panel>
        </aside>
      </div>

      <ConfirmDialog
        open={shipOpen}
        onOpenChange={setShipOpen}
        title="Mark shipped"
        description={
          <span className="block space-y-3 text-tk-ink">
            <span className="block">
              <label htmlFor="ship-courier" className="block text-[12px] text-[#454545] mb-1 font-medium">Courier</label>
              <select id="ship-courier" value={shipCourier} onChange={(e) => setShipCourier(e.target.value)} className="w-full border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white">
                {couriers.map((c) => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </select>
            </span>
            <span className="block">
              <label htmlFor="ship-awb" className="block text-[12px] text-[#454545] mb-1 font-medium">Tracking / article number</label>
              <input id="ship-awb" value={shipAwb} onChange={(e) => setShipAwb(e.target.value)} placeholder="e.g. EK123456789IN" className="w-full border border-[#C4C1B9] px-2 py-2 text-[14px]" />
            </span>
            <span className="block text-[13px] text-[#454545]">The customer sees the tracking link on their order.</span>
          </span>
        }
        confirmLabel="Mark shipped"
        onConfirm={async () => {
          try {
            await rpc('ship_order', { p_order: o.id, p_courier: shipCourier, p_tracking: shipAwb, p_note: null });
            await refresh();
            toast.success('Order shipped.');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />

      <ConfirmDialog
        open={refunding}
        onOpenChange={setRefunding}
        title="Refund this order online?"
        description={`Razorpay sends ${refundAmount ? formatINR(Number(refundAmount)) : `the remaining ${formatINR(Number(o.total) - Number(o.amount_refunded ?? 0))}`} back to the card, UPI or bank the customer paid with. It usually arrives in 5–7 working days.`}
        confirmLabel="Refund"
        danger
        onConfirm={async () => {
          try {
            await invokeFunction('razorpay-refund', { action: 'refund', order_id: o.id, amount: refundAmount.trim() || undefined });
            setRefundAmount('');
            await refresh();
            toast.success('Refund started.');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />

      <ConfirmDialog
        open={!!moving}
        onOpenChange={(open) => !open && setMoving(null)}
        title={moving ? `${ACTION_LABEL[moving] ?? ORDER_STATUS_LABEL[moving]}?` : ''}
        description={
          <span className="block space-y-2">
            {moving === 'CANCELLED' && <span className="block">Stock for every item and sample goes back on the shelf.</span>}
            {moving === 'DELIVERED' && o.payment_method === 'COD' && <span className="block">This also records the cash ({formatINR(Number(o.total))}) as collected.</span>}
            <textarea
              rows={2}
              value={moveNote}
              onChange={(e) => setMoveNote(e.target.value)}
              placeholder={moving === 'CANCELLED' ? 'Reason (shown to the customer)' : 'Note (optional)'}
              aria-label="Note"
              className="w-full border border-[#C4C1B9] px-2 py-1.5 text-[14px] text-tk-ink"
            />
          </span>
        }
        confirmLabel={moving ? ACTION_LABEL[moving] ?? 'Confirm' : 'Confirm'}
        danger={moving === 'CANCELLED'}
        onConfirm={async () => {
          if (!moving) return;
          try {
            await rpc('set_order_status', { p_order: o.id, p_status: moving, p_note: moveNote || null });
            if (moving === 'CANCELLED' && o.courier === 'delhivery' && o.tracking_number) {
              await invokeFunction('shipping', { action: 'cancel', order_id: o.id }).catch((e) => toast.error(`Cancel the Delhivery shipment by hand: ${toFriendlyError(e)}`));
            }
            await refresh();
            toast.success(`Order ${ORDER_STATUS_LABEL[moving].toLowerCase()}.`);
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />
    </div>
  );
}
