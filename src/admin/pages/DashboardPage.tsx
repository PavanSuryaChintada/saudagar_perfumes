import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { formatRupees as formatINR } from '../../lib/money';
import { toFriendlyError } from '../../lib/errors';
import { PageHeader, Panel } from '../ui/PageHeader';
import { Part, PartsLayout, usePart, type PartDef } from '../ui/Parts';
import { OrdersView, PaymentsView, StockView, TodayView, type Insights } from './dashboard/InsightViews';

interface Dashboard {
  days: number;
  kpis: { revenue: number; orders: number; aov: number; pending: number; unpaid: number; to_ship: number; customers: number; new_customers: number; low_stock: number; returns_waiting: number; reviews_waiting: number; refunds_due: number };
  series: { day: string; revenue: number; orders: number }[];
  cities: { label: string; orders: number; revenue: number }[];
  states: { label: string; orders: number; revenue: number }[];
  products: { label: string; units: number; revenue: number; id: string }[];
  notes: { label: string; revenue: number }[];
  warnings: { level: 'critical' | 'serious' | 'warning'; text: string; link: string }[];
  setup: { key: string; label: string; hint: string; link: string; done: boolean }[];
}

/** Switched off until their keys are added; nothing in the database can tell whether they are set. */

const dayLabel = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const compact = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `₹${Math.round(n)}`);

function Kpi({ label, value, hint, to, alert }: { label: string; value: string; hint?: string; to?: string; alert?: boolean }) {
  const body = (
    <div
      className={`bg-white border border-[#E0DBD1] border-l-[3px] px-4 py-3.5 h-full shadow-[0_1px_2px_rgba(20,20,20,0.05)] ${
        alert ? 'border-l-tk-accent' : 'border-l-[#E0DBD1]'
      }`}
    >
      <p className="text-[12.5px] text-[#3F3F3F] font-medium">{label}</p>
      <p className="text-[26px] leading-tight font-semibold text-tk-ink tabular-nums mt-1">{value}</p>
      {hint && <p className="text-[12.5px] text-[#4F4F4F] mt-0.5">{hint}</p>}
      {to && <p className="text-[12.5px] text-tk-accent font-medium mt-1.5">Open →</p>}
    </div>
  );
  return to ? <Link to={to} className="block hover:-translate-y-px transition-transform">{body}</Link> : body;
}

/** Revenue per day: one series, thin bars on a baseline, hover for the day's revenue and orders. */
function RevenueChart({ series }: { series: Dashboard['series'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 200;
  const pad = { l: 48, r: 8, t: 12, b: 24 };
  const max = Math.max(1, ...series.map((d) => d.revenue));
  const nice = (() => {
    const p = 10 ** Math.floor(Math.log10(max));
    const m = max / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  })();
  const ticks = [0, nice / 2, nice];
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const step = iw / Math.max(1, series.length);
  const bw = Math.max(2, Math.min(18, step - 2));
  const y = (v: number) => pad.t + ih - (v / nice) * ih;
  const labelEvery = Math.ceil(series.length / 8);
  const h = hover !== null ? series[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Revenue per day over the last ${series.length} days`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#E6E4DF" strokeWidth={1} />
            <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" fontSize={11} fill="#5A5A5A">{compact(t)}</text>
          </g>
        ))}
        {series.map((d, i) => {
          const x = pad.l + i * step + (step - bw) / 2;
          const top = y(d.revenue);
          const height = pad.t + ih - top;
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${dayLabel(d.day)}: ${formatINR(d.revenue)}, ${d.orders} orders`}>
              <rect x={pad.l + i * step} y={pad.t} width={step} height={ih} fill="transparent" />
              {d.revenue > 0 && (
                <path
                  d={`M${x},${pad.t + ih} V${top + Math.min(4, height)} Q${x},${top} ${x + Math.min(4, bw / 2)},${top} H${x + bw - Math.min(4, bw / 2)} Q${x + bw},${top} ${x + bw},${top + Math.min(4, height)} V${pad.t + ih} Z`}
                  fill="rgb(var(--c-accent))"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={pad.l + i * step + step / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#5A5A5A">{dayLabel(d.day)}</text>
              )}
            </g>
          );
        })}
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="#CCCCCC" strokeWidth={1} />
      </svg>
      {h && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 bg-tk-ink text-white text-[12px] px-2.5 py-1.5 shadow"
          style={{ left: `${((pad.l + (hover! + 0.5) * step) / W) * 100}%`, top: 0 }}
          role="status"
        >
          <p className="font-medium">{dayLabel(h.day)}</p>
          <p className="tabular-nums">{formatINR(h.revenue)} · {h.orders} order{h.orders === 1 ? '' : 's'}</p>
        </div>
      )}
      <details className="mt-2 text-[13px]">
        <summary className="cursor-pointer text-[#4A4A4A]">Show as a table</summary>
        <table className="mt-2 w-full max-w-[420px]">
          <thead>
            <tr className="text-left text-[12px] text-[#4A4A4A]"><th className="py-1 font-medium">Day</th><th className="py-1 font-medium text-right">Revenue</th><th className="py-1 font-medium text-right">Orders</th></tr>
          </thead>
          <tbody>
            {series.filter((d) => d.orders > 0).map((d) => (
              <tr key={d.day} className="border-t border-[#E9E7E2]"><td className="py-1">{dayLabel(d.day)}</td><td className="py-1 text-right tabular-nums">{formatINR(d.revenue)}</td><td className="py-1 text-right tabular-nums">{d.orders}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function RankList({ rows, value, empty, link }: { rows: { label: string; revenue: number; orders?: number; units?: number; id?: string }[]; value: 'revenue'; empty: string; link?: (r: { id?: string }) => string }) {
  const max = Math.max(1, ...rows.map((r) => r[value]));
  if (!rows.length) return <p className="text-[13px] text-[#4F4F4F]">{empty}</p>;
  return (
    <ol className="space-y-2 text-[13.5px]">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3">
            {link && r.id ? <Link to={link(r)} className="truncate hover:underline">{r.label}</Link> : <span className="truncate">{r.label}</span>}
            <span className="tabular-nums text-[#454545] shrink-0">{formatINR(r.revenue)}{r.orders !== undefined ? ` · ${r.orders}` : r.units !== undefined ? ` · ${r.units} sold` : ''}</span>
          </div>
          <span className="block h-1 mt-1 bg-[#E9E7E2]"><span className="block h-full bg-tk-accent" style={{ width: `${(r[value] / max) * 100}%` }} /></span>
        </li>
      ))}
    </ol>
  );
}

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard', days],
    queryFn: async () => {
      const { data: d, error: e } = await supabase.rpc('admin_dashboard', { p_days: days });
      if (e) throw e;
      return d as unknown as Dashboard;
    },
    refetchInterval: 60_000,
  });
  const k = data?.kpis;
  const hasSales = useMemo(() => (data?.series ?? []).some((d) => d.orders > 0), [data]);
  const setup = data?.setup ?? [];
  const setupDone = setup.filter((s) => s.done).length;
  const setupLeft = setup.length - setupDone;
  const [params] = useSearchParams();
  const oldView = params.get('view');
  const insights = useQuery({
    queryKey: ['admin', 'insights', days],
    queryFn: async () => {
      const { data: d, error: e } = await supabase.rpc('admin_insights', { p_days: days });
      if (e) throw e;
      return d as unknown as Insights;
    },
    refetchInterval: 60_000,
  });
  const ins = insights.data;
  const attention = k ? Number(k.pending) + Number(k.returns_waiting) + Number(k.reviews_waiting) + Number(k.refunds_due ?? 0) + Number(k.low_stock) : 0;
  const parts: PartDef[] = [
    { id: 'attention', label: 'Needs attention', hint: k ? (attention ? `${attention} thing${attention === 1 ? '' : 's'} to do` : 'All clear') : undefined, status: k && !attention ? 'done' : null },
    { id: 'sales', label: 'Sales', hint: k ? `${formatINR(Number(k.revenue))} in ${days} days` : undefined },
    { id: 'orders', label: 'Orders', hint: 'Where every order is' },
    { id: 'payments', label: 'Payments and refunds', hint: 'Cash and online' },
    { id: 'stock', label: 'Stock and products', hint: 'Running low, best sellers' },
    ...(setupLeft > 0 ? [{ id: 'setup', label: 'Store setup', hint: `${setupDone} of ${setup.length} done` } as PartDef] : []),
  ];
  const [part, setPart] = usePart(parts, oldView === 'orders' || oldView === 'payments' || oldView === 'stock' ? oldView : 'attention');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description={`Welcome${profile?.full_name ? `, ${profile.full_name}` : user?.email ? `, ${user.email}` : ''}.`}
        actions={
          <div className="flex gap-1" role="group" aria-label="Period">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d} className={`px-3 py-1.5 text-[13px] border ${days === d ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#C4C1B9] text-[#454545] hover:border-tk-ink'}`}>
                {d} days
              </button>
            ))}
          </div>
        }
      />
      {error && <p className="text-[14px] text-rose-600">{toFriendlyError(error)}</p>}

      {(data?.warnings ?? []).map((w) => (
        <Link key={w.text} to={w.link} className={`flex items-center gap-2 px-3 py-2 border text-[13.5px] ${w.level === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <AlertTriangle size={14} aria-hidden /> <span className="font-medium">{w.level === 'critical' ? 'Critical' : 'Attention'}:</span> {w.text}
        </Link>
      ))}


      {insights.error && <p className="text-[14px] text-rose-600">{toFriendlyError(insights.error)}</p>}

      <PartsLayout parts={parts} current={part} onSelect={setPart}>
      <Part id="attention">
      {ins && <TodayView d={ins.today} />}
      {/* Today's tiles cover orders, returns and refunds; these two add what else is waiting. */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <Kpi label="Reviews waiting" value={k ? String(k.reviews_waiting) : '—'} hint="Approve them before they show" to="/admin/reviews" alert={!!k && Number(k.reviews_waiting) > 0} />
        <Kpi label="Low stock" value={k ? String(k.low_stock) : '—'} hint="Perfumes and sizes running low" to="/admin/inventory" alert={!!k && Number(k.low_stock) > 0} />
      </div>
      </Part>
      <Part id="orders">{ins ? <OrdersView d={ins.pipeline} days={days} /> : !insights.error && <p className="text-[14px] text-[#4A4A4A]">Loading…</p>}</Part>
      <Part id="payments">{ins ? <PaymentsView d={ins.payments} days={days} /> : !insights.error && <p className="text-[14px] text-[#4A4A4A]">Loading…</p>}</Part>
      <Part id="stock">{ins ? <StockView d={ins.stock} days={days} /> : !insights.error && <p className="text-[14px] text-[#4A4A4A]">Loading…</p>}</Part>
      <Part id="setup">
      {setupLeft > 0 && (
        <Panel title={`Get your store ready · ${setupDone} of ${setup.length} done`} description="Each step opens the page that finishes it. This card disappears when everything is done.">
          <ul className="divide-y divide-[#E9E7E2]">
            {setup.map((s) => (
              <li key={s.key}>
                <Link to={s.link} className="py-2.5 flex gap-3 items-start hover:bg-[#FAFAF8] -mx-2 px-2">
                  {s.done ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-700" aria-label="Done" /> : <Circle size={16} className="mt-0.5 shrink-0 text-[#666666]" aria-label="To do" />}
                  <span>
                    <span className={`block text-[14px] ${s.done ? 'text-[#4F4F4F] line-through' : 'text-tk-ink'}`}>{s.label}</span>
                    {!s.done && <span className="block text-[13px] text-[#4A4A4A]">{s.hint}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      </Part>
      <Part id="sales">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Kpi label={`Revenue · ${days} days`} value={k ? formatINR(Number(k.revenue)) : '—'} hint="Excludes cancelled and unpaid online orders" />
        <Kpi label="Orders" value={k ? String(k.orders) : '—'} hint={k ? `Average ${formatINR(Number(k.aov))}` : undefined} />
        <Kpi label="Customers" value={k ? String(k.customers) : '—'} hint={k ? `${k.new_customers} new in ${days} days` : undefined} to="/admin/customers" />
      </div>

      <Panel title={`Revenue per day · last ${days} days`}>
        {isLoading ? <p className="text-[14px] text-[#4A4A4A]">Loading…</p> : hasSales ? <RevenueChart series={data!.series} /> : <p className="text-[14px] text-[#4A4A4A]">No orders in this period yet.</p>}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Top products by revenue"><RankList rows={data?.products ?? []} value="revenue" empty="No sales yet." link={(r) => `/admin/products/${r.id}`} /></Panel>
        <Panel title="Top notes by revenue"><RankList rows={data?.notes ?? []} value="revenue" empty="No sales yet." /></Panel>
        <Panel title="Top cities" description="Revenue · orders"><RankList rows={data?.cities ?? []} value="revenue" empty="No sales yet." /></Panel>
        <Panel title="Top states" description="Revenue · orders"><RankList rows={data?.states ?? []} value="revenue" empty="No sales yet." /></Panel>
      </div>
      </Part>
      </PartsLayout>

    </div>
  );
}
