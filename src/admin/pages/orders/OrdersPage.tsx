import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PageHeader } from '../../ui/PageHeader';
import { TextInput } from '../../ui/Field';
import { Button } from '../../ui/Button';
import { PAGE_SIZE, useAdminOrders, useOrdersRealtime } from '../../orders/api';
import { ORDER_STATUS_LABEL, paymentLabel, type OrderStatus } from '../../../lib/orders';
import { formatINR } from '../../../lib/money';
import { toFriendlyError } from '../../../lib/errors';
import { formatOrderDateTime } from '../../../storefront/orders/useOrders';

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
  CANCELLED: 'bg-[#F4F3EE] text-[#777777] border-[#E0DDD5]',
  RTO: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 border text-[10.5px] uppercase tracking-[0.06em] whitespace-nowrap ${STATUS_TONE[status] ?? ''}`}>
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
      <PageHeader title="Orders" description="New orders appear here live. Open an order to pack, ship, print the invoice or cancel it." />
      <div className="flex flex-wrap gap-1 mb-3">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => update({ status: f.value })}
            className={`px-3 py-1.5 text-[12px] border ${status === f.value ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#D5D3CC] text-[#555555] hover:border-tk-ink'}`}
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

      {error && <p className="text-[13px] text-rose-600 mb-3">{toFriendlyError(error)}</p>}
      <div className="bg-white border border-[#EAEAEA] overflow-x-auto">
        <table className="w-full text-[13px] min-w-[720px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-[#777777] border-b border-[#EAEAEA]">
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Items</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Payment</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {isLoading && (
              <tr><td colSpan={6} className="px-3 py-6 text-[#777777]">Loading…</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-[#777777]">No orders {status || params.get('q') ? 'match these filters' : 'yet'}.</td></tr>
            )}
            {rows.map((o) => {
              const items = o.order_items.filter((i) => i.line_type === 'item').reduce((n, i) => n + i.qty, 0);
              const samples = o.order_items.filter((i) => i.line_type === 'sample').length;
              return (
                <tr key={o.id} className="hover:bg-[#FAFAF7]">
                  <td className="px-3 py-2.5">
                    <Link to={`/admin/orders/${o.id}`} className="font-medium text-tk-ink hover:underline">{o.order_number}</Link>
                    <p className="text-[11px] text-[#888888]">{formatOrderDateTime(o.created_at)}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p>{o.customer_name}</p>
                    <p className="text-[11px] text-[#888888]">{[o.ship_city, o.ship_state].filter(Boolean).join(', ')}</p>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-[#555555]">
                    {items} item{items === 1 ? '' : 's'}
                    {samples > 0 && ` + ${samples} sample${samples === 1 ? '' : 's'}`}
                    {o.samples_short > 0 && <span className="block text-rose-600 text-[11px]">{o.samples_short} sample short</span>}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{formatINR(Number(o.total))}</td>
                  <td className="px-3 py-2.5 text-[12px] text-[#555555]">{paymentLabel(o)}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={o.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-3 mt-3 text-[12px]">
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => update({ page: String(page - 1) })}>Previous</Button>
          <span>Page {page + 1} of {pages}</span>
          <Button size="sm" variant="secondary" disabled={page + 1 >= pages} onClick={() => update({ page: String(page + 1) })}>Next</Button>
        </div>
      )}
    </div>
  );
}
