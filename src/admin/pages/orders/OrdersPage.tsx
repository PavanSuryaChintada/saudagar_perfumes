import { useEffect, useMemo, useState } from 'react';
import { Pager } from '../../ui/Pager';
import { Link, useSearchParams } from 'react-router';
import { PageHeader } from '../../ui/PageHeader';
import { TextInput } from '../../ui/Field';
import { Button } from '../../ui/Button';
import { PAGE_SIZE, useAdminOrders, useOrdersRealtime } from '../../orders/api';
import { ORDER_STATUS_LABEL, paymentLabel, type OrderStatus } from '../../../lib/orders';
import { formatRupees as formatINR } from '../../../lib/money';
import { fetchAll } from '../../../lib/fetchAll';
import { toFriendlyError } from '../../../lib/errors';
import { formatOrderDateTime } from '../../../storefront/orders/useOrders';
import { supabase } from '../../../lib/supabase';
import { downloadCsv, toCsv } from '../../export/csv';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { BulkBar, BulkButton, RowCheck } from '../../ui/BulkBar';
import { Modal } from '../../ui/Modal';
import { rpc } from '../../catalog/api';
import { useCouriers, useShippingSettings } from '../../orders/shipping';
import type { AdminOrder } from '../../orders/api';

interface BulkResult {
  done: number;
  skipped: { order_number: string; message: string }[];
}

/** One toast that says what happened, and why any order was left alone. */
function reportBulk(r: BulkResult, verb: string) {
  if (r.done) toast.success(`${r.done} order${r.done === 1 ? '' : 's'} ${verb}.`);
  if (r.skipped.length) {
    toast.warning(`${r.skipped.length} order${r.skipped.length === 1 ? ' was' : 's were'} left as they were`, {
      description: r.skipped.slice(0, 6).map((x) => `${x.order_number}: ${x.message}`).join('  ·  '),
      duration: 12000,
    });
  }
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'New' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RTO', label: 'RTO' },
];

export const STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  PACKED: 'bg-sky-50 text-sky-800 border-sky-200',
  SHIPPED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  OUT_FOR_DELIVERY: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-[#F4F3EE] text-[#4A4A4A] border-[#D3D0C8]',
  RTO: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 border text-[12.5px] whitespace-nowrap ${STATUS_TONE[status] ?? ''} font-medium`}>
      {ORDER_STATUS_LABEL[status as OrderStatus] ?? status}
    </span>
  );
}

export default function OrdersPage() {
  useOrdersRealtime();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const { data, isLoading, error } = useAdminOrders({ status, search: params.get('q') ?? '', page });
  const rows = data?.rows ?? [];
  const qc = useQueryClient();
  const couriers = useCouriers();
  const { data: shipSettings } = useShippingSettings();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [shipping, setShipping] = useState<Record<string, { courier: string; tracking: string }> | null>(null);
  // Selection belongs to the page being looked at.
  const paramKey = params.toString();
  useEffect(() => setSelected(new Set()), [paramKey]);
  const chosen = useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected]);
  const allShown = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id: string, on: boolean) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
  const setStatusFor = async (to: 'PACKED' | 'DELIVERED', verb: string) => {
    setBusy(true);
    try {
      reportBulk(await rpc<BulkResult>('bulk_order_status', { p_orders: chosen.map((o) => o.id), p_status: to, p_note: null }), verb);
      await refresh();
      setSelected(new Set());
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };
  const openShip = () => {
    const fallback = String(shipSettings?.['shipping.default_courier'] ?? couriers[0]?.key ?? 'other');
    setShipping(Object.fromEntries(chosen.filter((o) => o.status === 'PACKED').map((o) => [o.id, { courier: fallback, tracking: '' }])));
  };
  const print = (doc: 'invoice' | 'slip') => window.open(`/admin/orders/print?doc=${doc}&ids=${chosen.map((o) => o.id).join(',')}`, '_blank', 'noopener');
  const exportChosen = () =>
    downloadCsv(
      `orders-selected-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        chosen.map((o: AdminOrder) => ({
          order_number: o.order_number,
          created_at: o.created_at,
          customer: o.customer_name,
          phone: o.customer_phone,
          city: o.ship_city,
          state: o.ship_state,
          total: o.total,
          payment: paymentLabel(o),
          status: ORDER_STATUS_LABEL[o.status as OrderStatus] ?? o.status,
        })),
      ),
    );
  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description="New orders appear here live. Open an order to pack, ship, print the invoice or cancel it."
        actions={
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const rows = await fetchAll<Record<string, unknown>>((from, to) => {
                  let q = supabase
                    .from('orders')
                    .select(
                      'order_number, created_at, status, payment_method, payment_status, subtotal, discount, shipping_fee, total, amount_refunded, coupon_code, customer_name, customer_email, customer_phone, ship_city, ship_state, ship_pincode, courier_name, tracking_number, samples_entitled, samples_short',
                      { count: 'exact' },
                    )
                    .order('created_at', { ascending: false })
                    .order('id', { ascending: false });
                  if (status) q = q.eq('status', status);
                  return q.range(from, to) as unknown as PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown; count: number | null }>;
                });
                downloadCsv(`orders-${status || 'all'}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
              } catch (err) {
                toast.error(toFriendlyError(err));
              }
            }}
          >
            <Download size={14} /> Export CSV
          </Button>
        }
      />
      <div className="flex flex-wrap gap-1 mb-3">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => update({ status: f.value })}
            className={`px-3 py-1.5 text-[13px] border ${status === f.value ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#C4C1B9] text-[#454545] hover:border-tk-ink'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2 mb-4 max-w-[480px]"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: search.trim() });
        }}
      >
        <TextInput placeholder="Order number, name, phone or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search orders" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {error && <p className="text-[14px] text-rose-600 mb-3">{toFriendlyError(error)}</p>}
      <div className="bg-white border border-[#E2E0DB] overflow-x-auto">
        <table className="w-full text-[14px] min-w-[720px]">
          <thead>
            <tr className="text-left text-[12px] text-[#4A4A4A] border-b border-[#E2E0DB] font-medium">
              <th className="pl-3 py-2 w-8">
                <RowCheck checked={allShown} onChange={(on) => setSelected(on ? new Set(rows.map((r) => r.id)) : new Set())} label="Select every order on this page" />
              </th>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Items</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Payment</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E7E2]">
            {isLoading && (
              <tr><td colSpan={7} className="px-3 py-6 text-[#4A4A4A]">Loading…</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-[#4A4A4A]">No orders {status || params.get('q') ? 'match these filters' : 'yet'}.</td></tr>
            )}
            {rows.map((o) => {
              const items = o.order_items.filter((i) => i.line_type === 'item').reduce((n, i) => n + i.qty, 0);
              const samples = o.order_items.filter((i) => i.line_type === 'sample').length;
              return (
                <tr key={o.id} className={`hover:bg-[#FAFAF7] ${selected.has(o.id) ? 'bg-[#FBF8F1]' : ''}`}>
                  <td className="pl-3 py-2.5 align-top">
                    <RowCheck checked={selected.has(o.id)} onChange={(on) => toggle(o.id, on)} label={`Select ${o.order_number}`} />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link to={`/admin/orders/${o.id}`} className="font-medium text-tk-ink underline decoration-[#C4C1B9] underline-offset-4 hover:decoration-tk-ink">{o.order_number}</Link>
                    <p className="text-[12px] text-[#4F4F4F]">{formatOrderDateTime(o.created_at)}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p>{o.customer_name}</p>
                    <p className="text-[12px] text-[#4F4F4F]">{[o.ship_city, o.ship_state].filter(Boolean).join(', ')}</p>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] text-[#454545]">
                    {items} item{items === 1 ? '' : 's'}
                    {samples > 0 && ` + ${samples} sample${samples === 1 ? '' : 's'}`}
                    {o.samples_short > 0 && <span className="block text-rose-600 text-[12px]">{o.samples_short} sample short</span>}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{formatINR(Number(o.total))}</td>
                  <td className="px-3 py-2.5 text-[13px] text-[#454545]">{paymentLabel(o)}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={o.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager
        page={page + 1}
        pageCount={pages}
        onPage={(p) => update({ page: p > 1 ? String(p - 1) : '' })}
        from={(data?.count ?? 0) ? page * PAGE_SIZE + 1 : 0}
        to={Math.min(data?.count ?? 0, (page + 1) * PAGE_SIZE)}
        total={data?.count ?? 0}
        noun="orders"
      />
      {selected.size > 0 && <div className="h-24" aria-hidden />}
      <BulkBar count={selected.size} noun={['order', 'orders']} onClear={() => setSelected(new Set())}>
        <BulkButton disabled={busy} onClick={() => setStatusFor('PACKED', 'marked packed')}>Mark packed</BulkButton>
        <BulkButton disabled={busy} onClick={openShip}>Ship…</BulkButton>
        <BulkButton disabled={busy} onClick={() => setStatusFor('DELIVERED', 'marked delivered')}>Mark delivered</BulkButton>
        <BulkButton disabled={busy} onClick={() => print('invoice')}>Print invoices</BulkButton>
        <BulkButton disabled={busy} onClick={() => print('slip')}>Print packing slips</BulkButton>
        <BulkButton disabled={busy} onClick={exportChosen}>Export</BulkButton>
      </BulkBar>

      <Modal
        open={!!shipping}
        onOpenChange={(o) => !o && !busy && setShipping(null)}
        wide
        title="Ship the selected orders"
        description="Choose the courier and enter the tracking number for each packed order. Customers see tracking on their order straight away."
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setShipping(null)}>Cancel</Button>
            <Button
              busy={busy}
              disabled={!shipping || !Object.keys(shipping).length}
              onClick={async () => {
                if (!shipping) return;
                const missing = Object.entries(shipping).filter(([, v]) => !v.tracking.trim());
                if (missing.length) return toast.error('Enter a tracking number for every order, or untick the ones you are not shipping now.');
                setBusy(true);
                try {
                  reportBulk(
                    await rpc<BulkResult>('bulk_ship_orders', {
                      p_rows: Object.entries(shipping).map(([order_id, v]) => ({ order_id, courier: v.courier, tracking: v.tracking.trim() })),
                    }),
                    'shipped',
                  );
                  await refresh();
                  setShipping(null);
                  setSelected(new Set());
                } catch (err) {
                  toast.error(toFriendlyError(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Ship {shipping ? Object.keys(shipping).length : 0} orders
            </Button>
          </>
        }
      >
        {shipping && (
          <div className="space-y-3">
            {chosen.filter((o) => o.status !== 'PACKED').length > 0 && (
              <p className="text-[13px] bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2">
                {chosen.filter((o) => o.status !== 'PACKED').map((o) => o.order_number).join(', ')}: not packed yet, so they are left out. Mark them packed first.
              </p>
            )}
            {Object.keys(shipping).length === 0 ? (
              <p className="text-[14px] text-[#454545]">None of the selected orders is packed yet.</p>
            ) : (
              <div className="divide-y divide-[#E9E7E2] border border-[#E2E0DB]">
                {chosen
                  .filter((o) => shipping[o.id])
                  .map((o) => (
                    <div key={o.id} className="grid gap-2 sm:grid-cols-[150px_1fr_1fr] items-center px-3 py-2.5">
                      <p className="text-[14px] font-medium">
                        {o.order_number}
                        <span className="block text-[12px] font-normal text-[#4A4A4A]">{o.customer_name} · {o.ship_city}</span>
                      </p>
                      <select
                        aria-label={`Courier for ${o.order_number}`}
                        value={shipping[o.id].courier}
                        onChange={(e) => setShipping({ ...shipping, [o.id]: { ...shipping[o.id], courier: e.target.value } })}
                        className="w-full border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white"
                      >
                        {couriers.map((c) => (
                          <option key={c.key} value={c.key}>{c.name}</option>
                        ))}
                      </select>
                      <TextInput
                        aria-label={`Tracking number for ${o.order_number}`}
                        placeholder="Tracking / AWB number"
                        value={shipping[o.id].tracking}
                        onChange={(e) => setShipping({ ...shipping, [o.id]: { ...shipping[o.id], tracking: e.target.value } })}
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
