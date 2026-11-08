// The dashboard's Today / Orders / Payments / Stock views, fed by public.admin_insights.
import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { formatRupees as formatINR } from '../../../lib/money';
import { Panel } from '../../ui/PageHeader';

export interface Insights {
  days: number;
  today: { orders: number; revenue: number; week_orders: number; week_revenue: number; to_pack: number; to_ship: number; unpaid: number; returns_waiting: number; refunds_due: number };
  pipeline: {
    steps: { status: string; label: string; count: number }[];
    cancelled: number;
    rto: number;
    late: { id: string; order_number: string; customer: string | null; stage: string; age: number }[];
  };
  payments: {
    revenue: number;
    cod: { orders: number; revenue: number };
    online: { orders: number; revenue: number };
    cod_to_collect: { orders: number; amount: number };
    refunds: { count: number; amount: number };
    rto_cod: number;
    cod_shipped: number;
  };
  stock: {
    low_threshold: number;
    sold_out: { id: string; product: string; size: string; sku: string; stock: number }[];
    low: { id: string; product: string; size: string; sku: string | null; stock: number | null; ml: number | null }[];
    low_ml: number;
    best: { id: string; product: string; units: number; revenue: number }[];
    slow: { id: string; product: string; stock: number | null }[];
    never_sold_sizes: number;
    vials: { in_stock: number; kinds: number; low: number };
  };
}

/** Validated pair (dataviz validator: lightness, chroma, CVD and contrast all pass). */
const COD_COLOR = '#C4823F';
const ONLINE_COLOR = '#2E6BD6';

/** A big number that opens the list behind it. `attention` turns the edge amber when there is work waiting. */
export function Stat({ label, value, hint, to, attention }: { label: string; value: string | number; hint?: string; to?: string; attention?: boolean }) {
  const busy = attention && Number(value) > 0;
  const body = (
    <div className={`h-full bg-white border px-4 py-3 ${busy ? 'border-amber-300 border-l-4 border-l-amber-500' : 'border-[#E2E0DB]'} ${to ? 'group-hover:border-tk-ink' : ''}`}>
      <p className="text-[12.5px] font-medium text-[#454545]">{label}</p>
      <p className="text-[26px] leading-tight text-tk-ink tabular-nums mt-1">{value}</p>
      {hint && <p className="text-[12.5px] text-[#4A4A4A] mt-0.5">{hint}</p>}
      {to && (
        <p className="mt-2 inline-flex items-center gap-1 text-[12.5px] text-tk-accent group-hover:underline underline-offset-4">
          Open <ArrowRight size={12} aria-hidden />
        </p>
      )}
    </div>
  );
  return to ? (
    <Link to={to} className="group block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export function TodayView({ d }: { d: Insights['today'] }) {
  return (
    <Panel title="Today at a glance" description="What came in, and what's waiting for you. Amber tiles have work to do.">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="Orders today" value={d.orders} hint={`${formatINR(Number(d.revenue))} · this week ${d.week_orders}`} to="/admin/orders" />
        <Stat label="Ready to pack" value={d.to_pack} hint="Cash orders and paid online orders" to="/admin/orders?status=PENDING" attention />
        <Stat label="Packed, not shipped" value={d.to_ship} hint="Add the courier and tracking" to="/admin/orders?status=PACKED" attention />
        <Stat label="Awaiting online payment" value={d.unpaid} hint="Cancelled after 24 hours if unpaid" to="/admin/orders?status=PENDING" />
        <Stat label="Returns to handle" value={d.returns_waiting} hint="New requests and parcels received" to="/admin/returns" attention />
        <Stat label="Refunds due" value={d.refunds_due} hint="Paid orders cancelled or returned" to="/admin/refunds" attention />
        <Stat label="This week's revenue" value={formatINR(Number(d.week_revenue))} hint="Last 7 days, excluding cancelled and unpaid" />
      </div>
    </Panel>
  );
}

export function OrdersView({ d, days }: { d: Insights['pipeline']; days: number }) {
  return (
    <div className="space-y-5">
      <Panel title="Where orders are now" description={`Each step opens those orders. Delivered counts the last ${days} days.`}>
        <ol className="grid gap-2 grid-cols-2 md:grid-cols-5" aria-label="Order steps">
          {d.steps.map((s, i) => (
            <li key={s.status} className="relative">
              <Link to={`/admin/orders?status=${s.status}`} className="group block h-full bg-white border border-[#E2E0DB] hover:border-tk-ink px-3 py-3">
                <span className="block text-[12px] text-[#4A4A4A] tabular-nums">Step {i + 1}</span>
                <span className="block text-[14px] font-medium text-tk-ink">{s.label}</span>
                <span className="block text-[26px] leading-tight tabular-nums mt-1">{s.count}</span>
              </Link>
              {i < d.steps.length - 1 && (
                <ChevronRight size={16} className="hidden md:block absolute -right-[13px] top-1/2 -translate-y-1/2 text-[#666666] z-10" aria-hidden />
              )}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[13px] text-[#454545]">
          Last {days} days: {d.cancelled} cancelled · {d.rto} returned to us (RTO).
        </p>
      </Panel>

      <Panel title={`Running late · ${d.late.length}`} description="Not packed after 2 days, not shipped 2 days after packing, or not delivered 10 days after shipping.">
        {d.late.length === 0 ? (
          <p className="text-[14px] text-emerald-800">Nothing is late. Well done.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px] min-w-[480px]">
              <thead>
                <tr className="text-left text-[12px] border-b border-[#E2E0DB] font-medium">
                  <th className="py-2 pr-3 font-medium">Order</th>
                  <th className="py-2 pr-3 font-medium">Customer</th>
                  <th className="py-2 pr-3 font-medium">Stuck at</th>
                  <th className="py-2 font-medium text-right">Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E7E2]">
                {d.late.map((o) => (
                  <tr key={`${o.id}-${o.stage}`}>
                    <td className="py-2 pr-3">
                      <Link to={`/admin/orders/${o.id}`} className="font-medium underline decoration-[#C4C1B9] underline-offset-4 hover:decoration-tk-ink">{o.order_number}</Link>
                    </td>
                    <td className="py-2 pr-3">{o.customer}</td>
                    <td className="py-2 pr-3 text-amber-800">{o.stage}</td>
                    <td className="py-2 text-right tabular-nums">{o.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/** Part-to-whole of two: one bar, 2px gap between the parts, direct labels, legend, hover detail, table fallback. */
function SplitBar({ parts }: { parts: { label: string; value: number; count: number; color: string }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = parts.reduce((n, p) => n + p.value, 0);
  if (!total) return <p className="text-[14px] text-[#4A4A4A]">No sales in this period yet.</p>;
  const pct = (v: number) => Math.round((v / total) * 100);
  return (
    <div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 mb-3 text-[13px]" aria-label="Legend">
        {parts.map((p) => (
          <li key={p.label} className="inline-flex items-center gap-2 text-[#454545]">
            <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: p.color }} aria-hidden />
            {p.label}
          </li>
        ))}
      </ul>
      <div className="relative">
        <div className="flex h-9 gap-[2px] bg-white" role="img" aria-label={parts.map((p) => `${p.label} ${pct(p.value)}%`).join(', ')}>
          {parts.map((p, i) =>
            p.value > 0 ? (
              <div
                key={p.label}
                className="h-full cursor-default first:rounded-l-[4px] last:rounded-r-[4px]"
                style={{ width: `${(p.value / total) * 100}%`, background: p.color, opacity: hover === null || hover === i ? 1 : 0.55 }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            ) : null,
          )}
        </div>
        {hover !== null && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-white border border-[#C4C1B9] px-3 py-2 text-[13px] shadow-sm whitespace-nowrap" role="status">
            <strong>{parts[hover].label}</strong> · {formatINR(parts[hover].value)} · {parts[hover].count} orders · {pct(parts[hover].value)}%
          </div>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 text-[13.5px]">
        {parts.map((p, i) => (
          <p key={p.label} className={i === 1 ? 'text-right' : ''}>
            <span className="font-medium text-tk-ink">{p.label} {pct(p.value)}%</span>
            <span className="block text-[#454545] tabular-nums">{formatINR(p.value)} · {p.count} orders</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export function PaymentsView({ d, days }: { d: Insights['payments']; days: number }) {
  const refundRate = d.revenue > 0 ? Math.round((Number(d.refunds.amount) / Number(d.revenue)) * 1000) / 10 : 0;
  const rtoRate = d.cod_shipped > 0 ? Math.round((d.rto_cod / d.cod_shipped) * 1000) / 10 : 0;
  return (
    <div className="space-y-5">
      <Panel title={`How customers paid · last ${days} days`} description="Revenue from orders that count as sales (cancelled and unpaid online orders left out).">
        <SplitBar
          parts={[
            { label: 'Cash on delivery', value: Number(d.cod.revenue), count: d.cod.orders, color: COD_COLOR },
            { label: 'Online', value: Number(d.online.revenue), count: d.online.orders, color: ONLINE_COLOR },
          ]}
        />
      </Panel>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="Cash still to collect" value={formatINR(Number(d.cod_to_collect.amount))} hint={`${d.cod_to_collect.orders} COD orders not delivered yet`} to="/admin/orders?status=SHIPPED" />
        <Stat label={`Refunded · ${days} days`} value={formatINR(Number(d.refunds.amount))} hint={`${d.refunds.count} refunds`} to="/admin/refunds" />
        <Stat label="Refund rate" value={`${refundRate}%`} hint="Refunds as a share of revenue" />
        <Stat label="COD returned to us" value={`${rtoRate}%`} hint={`${d.rto_cod} of ${d.cod_shipped} COD parcels shipped came back`} to="/admin/orders?status=RTO" />
      </div>
    </div>
  );
}

function StockList({ rows, empty, right }: { rows: { id: string; product: string; size?: string; sku?: string }[]; empty: string; right: (r: never) => string }) {
  if (!rows.length) return <p className="text-[14px] text-[#4A4A4A]">{empty}</p>;
  return (
    <ul className="divide-y divide-[#E9E7E2] text-[14px]">
      {rows.map((r, i) => (
        <li key={`${r.id}-${r.sku ?? i}`} className="py-2 flex justify-between gap-3">
          <Link to={`/admin/products/${r.id}`} className="min-w-0 hover:underline underline-offset-4">
            <span className="block truncate">{r.product}</span>
            {r.size && <span className="block text-[12.5px] text-[#4A4A4A]">{r.size}{r.sku ? ` · ${r.sku}` : ''}</span>}
          </Link>
          <span className="shrink-0 tabular-nums text-[#3F3F3F]">{right(r as never)}</span>
        </li>
      ))}
    </ul>
  );
}

export function StockView({ d, days }: { d: Insights['stock']; days: number }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="Sizes sold out" value={d.sold_out.length} hint="Live products with a size at 0" to="/admin/inventory" attention />
        <Stat label="Running low" value={d.low.length} hint={`Perfumes at ${d.low_ml} ml or less; pieces at ${d.low_threshold} or fewer`} to="/admin/inventory" attention />
        <Stat label="Sizes never sold" value={d.never_sold_sizes} hint="Live sizes with no sales yet" to="/admin/products" />
        <Stat label="Sample vials in stock" value={d.vials.in_stock} hint={`${d.vials.kinds} scents · ${d.vials.low} running low`} to="/admin/samples" attention={d.vials.low > 0} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Sold out" description="Restock from Inventory, or hide the size.">
          <StockList rows={d.sold_out} empty="Nothing is sold out." right={() => 'sold out'} />
        </Panel>
        <Panel title="Running low">
          <StockList
            rows={d.low.map((r) => ({ ...r, size: r.ml !== null ? undefined : r.size, sku: r.sku ?? undefined }))}
            empty="Nothing is running low."
            right={(r: { stock: number | null; ml: number | null }) => (r.ml !== null ? `${Number(r.ml).toLocaleString('en-IN')} ml left` : `${r.stock} left`)}
          />
        </Panel>
        <Panel title={`Best sellers · ${days} days`}>
          <StockList rows={d.best} empty="No sales in this period yet." right={(r: { units: number; revenue: number }) => `${r.units} sold · ${formatINR(Number(r.revenue))}`} />
        </Panel>
        <Panel title={`Not selling · ${days} days`} description="Live products older than the period with no sales in it. Consider a feature, a coupon, or a sample.">
          <StockList rows={d.slow} empty="Every live product sold at least once." right={(r: { stock: number | null }) => `${r.stock ?? 0} in stock`} />
        </Panel>
      </div>
    </div>
  );
}
