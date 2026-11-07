import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { formatINR } from '../../../lib/money';
import { signedUrls } from '../../../lib/media/privateUpload';
import { invokeFunction } from '../../../lib/razorpay';
import { formatOrderDateTime } from '../../../storefront/orders/useOrders';
import { RETURN_REASONS } from '../../../storefront/orders/ReturnSection';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextArea, TextInput } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { MediaPreview } from '../../ui/MediaField';
import { rpc, throwIf } from '../../catalog/api';

interface ReturnRow {
  id: string;
  order_id: string;
  status: string;
  reason: string;
  details: string | null;
  items: { order_item_id: string; qty: number }[];
  media: string[];
  customer_note: string | null;
  return_method: string | null;
  return_courier: string | null;
  return_tracking: string | null;
  stock_decision: string | null;
  resolution: string | null;
  refund_amount: number | null;
  replacement_order_id: string | null;
  created_at: string;
  order: {
    id: string;
    order_number: string;
    customer_name: string | null;
    customer_phone: string | null;
    payment_method: string;
    payment_status: string;
    total: number;
    amount_refunded: number;
    order_items: { id: string; product_name: string; variant_label: string | null; qty: number; unit_price: number }[];
  };
}

const STATUS: Record<string, string> = {
  REQUESTED: 'New request',
  APPROVED: 'Approved',
  PICKUP_SCHEDULED: 'Pickup scheduled',
  IN_TRANSIT: 'Coming back',
  RECEIVED: 'Received',
  REFUNDED: 'Refunded',
  REPLACED: 'Replaced',
  REJECTED: 'Declined',
};
const REASON = Object.fromEntries(RETURN_REASONS.map((r) => [r.value, r.label]));
const FILTERS = ['REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', ''];

export default function ReturnsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('REQUESTED');
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'returns', filter],
    queryFn: async () => {
      let q = supabase
        .from('returns')
        .select('*, order:orders!returns_order_id_fkey(id, order_number, customer_name, customer_phone, payment_method, payment_status, total, amount_refunded, order_items(id, product_name, variant_label, qty, unit_price))')
        .order('created_at', { ascending: false });
      if (filter === 'IN_TRANSIT') q = q.in('status', ['PICKUP_SCHEDULED', 'IN_TRANSIT']);
      else if (filter) q = q.eq('status', filter);
      return (await throwIf(q)) as unknown as ReturnRow[];
    },
  });
  const current = rows.find((r) => r.id === openId) ?? null;
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'returns'] });

  return (
    <div>
      <PageHeader title="Returns" description="Approve or decline, follow the parcel back, decide restock or write-off, then refund or send a replacement." />
      <div className="flex flex-wrap gap-1 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f || 'all'}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-[12px] border ${filter === f ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#D5D3CC] text-[#555555] hover:border-tk-ink'}`}
          >
            {f ? STATUS[f] : 'All'}
          </button>
        ))}
      </div>
      <div className="bg-white border border-[#EAEAEA] divide-y divide-[#F0F0F0]">
        {isLoading && <p className="px-3 py-6 text-[13px] text-[#777777]">Loading…</p>}
        {!isLoading && rows.length === 0 && <p className="px-3 py-6 text-[13px] text-[#777777]">Nothing here.</p>}
        {rows.map((r) => (
          <button key={r.id} type="button" onClick={() => setOpenId(r.id)} className="w-full text-left flex items-center gap-3 px-3 py-3 hover:bg-[#FAFAF7] text-[13px]">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{r.order.order_number} · {r.order.customer_name}</p>
              <p className="text-[11px] text-[#888888] truncate">{REASON[r.reason]} · {formatOrderDateTime(r.created_at)}{r.details ? ` · ${r.details}` : ''}</p>
            </div>
            <span className="text-[10.5px] uppercase tracking-[0.06em] px-2 py-0.5 border border-[#E0DDD5] bg-[#F4F3EE]">{STATUS[r.status]}</span>
          </button>
        ))}
      </div>
      {current && <ReturnModal r={current} onClose={() => setOpenId(null)} onChanged={refresh} />}
    </div>
  );
}

function ReturnModal({ r, onClose, onChanged }: { r: ReturnRow; onClose: () => void; onChanged: () => Promise<unknown> }) {
  const [media, setMedia] = useState<Record<string, string>>({});
  const [note, setNote] = useState(r.customer_note ?? '');
  const [method, setMethod] = useState('POST');
  const [courier, setCourier] = useState(r.return_courier ?? '');
  const [tracking, setTracking] = useState(r.return_tracking ?? '');
  const [refundAmount, setRefundAmount] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const o = r.order;
  const returned = r.items.map((it) => ({ ...it, item: o.order_items.find((x) => x.id === it.order_item_id) }));
  const value = returned.reduce((s, x) => s + (x.item ? Number(x.item.unit_price) * x.qty : 0), 0);

  useEffect(() => {
    signedUrls('returns', r.media).then(setMedia).catch(() => setMedia({}));
    setRefundAmount(String(Math.min(value, Number(o.total) - Number(o.amount_refunded))));
  }, [r.media, value, o.total, o.amount_refunded]);

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await fn();
      await onChanged();
      toast.success(done);
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onOpenChange={(open) => !open && !busy && onClose()} title={`Return · ${o.order_number}`} description={`${REASON[r.reason]} · ${STATUS[r.status]}`} wide>
      <div className="space-y-5 text-[13px]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#555555] mb-1">Items</p>
          <ul className="space-y-1">
            {returned.map((x) => (
              <li key={x.order_item_id}>{x.qty} × {x.item?.product_name} · {x.item?.variant_label}</li>
            ))}
          </ul>
          <p className="text-[12px] text-[#777777] mt-1">
            Worth {formatINR(value)} · <Link to={`/admin/orders/${o.id}`} className="underline">open order</Link> · {o.customer_phone}
          </p>
        </div>
        {r.details && <p className="text-[#444444] whitespace-pre-line">{r.details}</p>}
        {r.media.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {r.media.map((p) => (
              <a key={p} href={media[p]} target="_blank" rel="noreferrer" className="w-24 h-24 bg-[#F4F3EE] border border-[#EAEAEA] overflow-hidden block">
                {media[p] && <MediaPreview url={media[p]} />}
              </a>
            ))}
          </div>
        )}

        {r.status === 'REQUESTED' && (
          <div className="space-y-3 border-t border-[#EAEAEA] pt-4">
            <FieldShell label="Message to the customer" htmlFor="rt-note" help="Required when declining.">
              <TextArea id="rt-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Sorry about this — please post it back and we'll replace it." />
            </FieldShell>
            <FieldShell label="How it comes back" htmlFor="rt-method">
              <select id="rt-method" value={method} onChange={(e) => setMethod(e.target.value)} className="w-full sm:max-w-[320px] border border-[#D5D3CC] px-2 py-2 text-[13px] bg-white">
                <option value="POST">Customer posts it back (e.g. India Post)</option>
                <option value="PICKUP">Courier pickup</option>
                <option value="NOT_NEEDED">No need to send it back (write it off)</option>
              </select>
            </FieldShell>
            <div className="flex gap-2">
              <Button busy={busy} onClick={() => act(() => rpc('review_return', { p_return: r.id, p_approve: true, p_note: note, p_method: method }), 'Return approved.')}>Approve</Button>
              <Button variant="secondary" disabled={busy} onClick={() => act(() => rpc('review_return', { p_return: r.id, p_approve: false, p_note: note, p_method: null }), 'Return declined.')}>Decline</Button>
            </div>
          </div>
        )}

        {['APPROVED', 'PICKUP_SCHEDULED', 'IN_TRANSIT'].includes(r.status) && (
          <div className="space-y-3 border-t border-[#EAEAEA] pt-4">
            <p className="text-[12px] text-[#555555]">{r.return_method === 'PICKUP' ? 'Arrange the courier pickup, then add its tracking number.' : 'Waiting for the customer to post it back.'}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldShell label="Courier" htmlFor="rt-courier"><TextInput id="rt-courier" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. India Post" /></FieldShell>
              <FieldShell label="Tracking number" htmlFor="rt-tracking"><TextInput id="rt-tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} /></FieldShell>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={busy} onClick={() => act(() => rpc('update_return', { p_return: r.id, p_status: 'IN_TRANSIT', p_courier: courier, p_tracking: tracking }), 'Saved.')}>Save as coming back</Button>
              <Button busy={busy} onClick={() => act(() => rpc('receive_return', { p_return: r.id, p_decision: 'RESTOCK' }), 'Received and restocked.')}>Received · restock</Button>
              <Button variant="danger" disabled={busy} onClick={() => act(() => rpc('receive_return', { p_return: r.id, p_decision: 'WRITE_OFF' }), 'Received and written off.')}>Received · write off (damaged)</Button>
            </div>
            <p className="text-[11px] text-[#888888]">A leaked or opened bottle should always be written off.</p>
          </div>
        )}

        {r.status === 'RECEIVED' && (
          <div className="space-y-4 border-t border-[#EAEAEA] pt-4">
            <p className="text-[12px] text-[#555555]">Stock decision: {r.stock_decision === 'RESTOCK' ? 'put back on sale' : 'written off'}. Now resolve it.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldShell label="Refund amount (₹)" htmlFor="rt-amount" help={`Paid ${formatINR(Number(o.total) - Number(o.amount_refunded))}.`}>
                <TextInput id="rt-amount" inputMode="decimal" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
              </FieldShell>
              {o.payment_method === 'COD' && (
                <FieldShell label="UPI / bank reference" htmlFor="rt-ref">
                  <TextInput id="rt-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. UPI 412345678901" />
                </FieldShell>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {o.payment_method === 'COD' ? (
                <Button busy={busy} onClick={() => act(() => rpc('refund_return_manually', { p_return: r.id, p_amount: Number(refundAmount), p_reference: reference, p_note: null }), 'Refund recorded.')}>
                  Record refund (UPI / bank)
                </Button>
              ) : (
                <Button
                  busy={busy}
                  onClick={() =>
                    act(async () => {
                      await invokeFunction('razorpay-refund', { action: 'refund', order_id: o.id, amount: Number(refundAmount) });
                      await rpc('mark_return_refunded', { p_return: r.id });
                    }, 'Refund started through Razorpay.')
                  }
                >
                  Refund via Razorpay
                </Button>
              )}
              <Button variant="secondary" disabled={busy} onClick={() => act(() => rpc('create_replacement_order', { p_return: r.id }), 'Replacement order created and packed.')}>
                Send a replacement (₹0 order)
              </Button>
            </div>
          </div>
        )}

        {['REFUNDED', 'REPLACED', 'REJECTED'].includes(r.status) && (
          <p className="border-t border-[#EAEAEA] pt-4 text-[12.5px]">
            {r.status === 'REFUNDED' && `Refunded ${formatINR(Number(r.refund_amount ?? 0))}.`}
            {r.status === 'REPLACED' && r.replacement_order_id && (
              <Link to={`/admin/orders/${r.replacement_order_id}`} className="underline">Open the replacement order</Link>
            )}
            {r.status === 'REJECTED' && `Declined: ${r.customer_note ?? ''}`}
          </p>
        )}
      </div>
    </Modal>
  );
}
