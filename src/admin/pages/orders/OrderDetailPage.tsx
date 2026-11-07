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
  const [refundAmount, setRefundAmount] = useState('');

  useEffect(() => {
    if (!o) return;
    setTracking({ courier_name: o.courier_name ?? '', tracking_number: o.tracking_number ?? '', tracking_url: o.tracking_url ?? '' });
    setAdminNote(o.admin_note ?? '');
  }, [o]);

  if (isLoading) return <p className="text-[13px] text-[#777777]">Loading…</p>;
  if (error) return <p className="text-[13px] text-rose-600">{toFriendlyError(error)}</p>;
  if (!o) return <p className="text-[13px] text-[#777777]">This order doesn't exist. <Link to="/admin/orders" className="underline">Back to orders</Link></p>;

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
        <Link to="/admin/orders" className="inline-flex items-center gap-1 text-[12px] text-[#777777] hover:text-tk-ink mb-3">
          <ArrowLeft size={13} /> Orders
        </Link>
        <PageHeader
          title={`Order ${o.order_number}`}
          description={`Placed ${formatOrderDateTime(o.created_at)} · ${paymentLabel(o)}`}
          actions={
            <>
              <a href={`/admin/orders/${o.id}/print?doc=invoice`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#D5D3CC] bg-white text-[12px] hover:border-tk-ink">
                <Printer size={13} /> Invoice
              </a>
              <a href={`/admin/orders/${o.id}/print?doc=slip`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#D5D3CC] bg-white text-[12px] hover:border-tk-ink">
                <Printer size={13} /> Packing slip
              </a>
            </>
          }
        />
      </div>

      <Panel title="Status">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={o.status} />
          {next.length === 0 && <span className="text-[12px] text-[#777777]">No further steps.</span>}
          {next.map((s) => (
            <Button key={s} size="sm" variant={s === 'CANCELLED' || s === 'RTO' ? 'secondary' : 'primary'} onClick={() => { setMoveNote(''); setMoving(s); }}>
              {ACTION_LABEL[s] ?? ORDER_STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
        {o.status === 'CANCELLED' && (
          <p className="mt-3 text-[12px] text-[#555555]">
            Cancelled by {o.cancelled_by === 'customer' ? 'the customer' : 'the store'} on {formatOrderDateTime(o.cancelled_at)}
            {o.cancel_reason ? ` — ${o.cancel_reason}` : ''}. Stock was put back.
          </p>
        )}
        {o.status === 'RTO' && <p className="mt-3 text-[12px] text-[#555555]">The parcel came back. Decide on restocking from the Returns page once it arrives.</p>}
        {o.payment_method === 'ONLINE' && ['PAID', 'PARTIALLY_REFUNDED'].includes(o.payment_status) && (
          <div className="mt-4 pt-4 border-t border-[#EAEAEA] flex flex-wrap items-end gap-3">
            <FieldShell label="Refund online (₹)" htmlFor="rf-amount" help={`Paid ${formatINR(Number(o.total) - Number(o.amount_refunded ?? 0))}. Leave empty to refund in full.`}>
              <TextInput id="rf-amount" inputMode="decimal" placeholder="Full amount" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="max-w-[160px]" />
            </FieldShell>
            <Button variant="secondary" onClick={() => setRefunding(true)}>Refund to customer</Button>
          </div>
        )}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5 min-w-0">
          <Panel title="Items">
            <div className="divide-y divide-[#F0F0F0]">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                  <div className="w-12 h-12 bg-[#F4F3EE] shrink-0">{i.image_url && <img src={i.image_url} alt="" className="w-full h-full object-contain" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{i.product_name}</p>
                    <p className="text-[11px] text-[#888888]">{i.variant_label} · SKU {(i as unknown as { sku: string }).sku}</p>
                  </div>
                  <span className="text-[12px] text-[#555555] tabular-nums">{i.qty} × {formatINR(Number(i.unit_price))}</span>
                  <span className="w-24 text-right tabular-nums">{formatINR(Number(i.line_total))}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#EAEAEA] space-y-1 text-[13px] max-w-[320px] ml-auto">
              <div className="flex justify-between text-[#555555]"><span>Subtotal</span><span>{formatINR(Number(o.subtotal))}</span></div>
              {Number(o.discount) > 0 && <div className="flex justify-between text-emerald-700"><span>Discount {o.coupon_code ? `(${o.coupon_code})` : ''}</span><span>−{formatINR(Number(o.discount))}</span></div>}
              <div className="flex justify-between text-[#555555]"><span>Delivery</span><span>{Number(o.shipping_fee) === 0 ? 'Free' : formatINR(Number(o.shipping_fee))}</span></div>
              <div className="flex justify-between font-medium pt-1 border-t border-[#EAEAEA]"><span>Total</span><span>{formatINR(Number(o.total))}</span></div>
            </div>
          </Panel>

          <Panel title={`Free samples (${samples.length} of ${o.samples_entitled})`}>
            {samples.length === 0 && o.samples_entitled === 0 && <p className="text-[12px] text-[#777777]">This order didn't earn samples.</p>}
            <ul className="space-y-1 text-[13px]">
              {samples.map((s) => (
                <li key={s.id}>
                  {s.product_name} · {s.variant_label}
                  <span className="text-[11px] text-[#888888]">{s.sample_auto ? ' — chosen by the store' : ' — customer’s pick'}</span>
                </li>
              ))}
            </ul>
            {o.samples_short > 0 && (
              <p className="mt-2 text-[12px] text-rose-600">{o.samples_short} sample{o.samples_short === 1 ? ' was' : 's were'} out of stock at order time. Consider adding one by hand.</p>
            )}
          </Panel>

          <Panel title="History">
            <ul className="space-y-2 text-[12.5px]">
              {(o.order_events ?? []).map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="text-[#888888] whitespace-nowrap">{formatOrderDateTime(e.created_at)}</span>
                  <span>
                    {e.to_status ? ORDER_STATUS_LABEL[e.to_status as OrderStatus] ?? e.to_status : e.kind === 'tracking' ? 'Tracking added' : 'Note'}
                    {e.message ? <span className="text-[#666666]"> — {e.message}</span> : null}
                    {e.actor_role ? <span className="text-[#999999]"> · {e.actor_role}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Customer">
            <p className="text-[13px]">{o.customer_name}</p>
            <p className="text-[12px] text-[#666666]">{o.customer_email}</p>
            {o.customer_phone && (
              <p className="text-[12px] text-[#666666]">
                <a href={`tel:+91${o.customer_phone}`} className="underline">{formatIndianPhone(o.customer_phone)}</a>
              </p>
            )}
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#555555] mt-4 mb-1">Ship to</p>
            <p className="text-[12.5px] leading-relaxed text-[#444444]">
              {a.full_name}
              <br />
              {[a.line1, a.line2].filter(Boolean).join(', ')}
              {a.landmark ? <><br />Near {a.landmark}</> : null}
              <br />
              {a.city}, {a.state} {a.pincode}
            </p>
            {o.note && (
              <>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#555555] mt-4 mb-1">Customer note</p>
                <p className="text-[12.5px] text-[#444444] whitespace-pre-line">{o.note}</p>
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
        open={refunding}
        onOpenChange={setRefunding}
        title="Refund this order online?"
        description={`Razorpay sends ${refundAmount ? formatINR(Number(refundAmount)) : 'the full amount'} back to the customer's payment method. One online refund per order.`}
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
              className="w-full border border-[#D5D3CC] px-2 py-1.5 text-[13px] text-tk-ink"
            />
          </span>
        }
        confirmLabel={moving ? ACTION_LABEL[moving] ?? 'Confirm' : 'Confirm'}
        danger={moving === 'CANCELLED'}
        onConfirm={async () => {
          if (!moving) return;
          try {
            await rpc('set_order_status', { p_order: o.id, p_status: moving, p_note: moveNote || null });
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
