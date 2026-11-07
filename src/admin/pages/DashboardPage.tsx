import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { formatINR } from '../../lib/money';
import { toFriendlyError } from '../../lib/errors';
import { PageHeader, Panel } from '../ui/PageHeader';

interface Dashboard {
  days: number;
  kpis: { revenue: number; orders: number; aov: number; pending: number; to_ship: number; customers: number; new_customers: number; low_stock: number; returns_waiting: number; reviews_waiting: number };
  series: { day: string; revenue: number; orders: number }[];
  cities: { label: string; orders: number; revenue: number }[];
  states: { label: string; orders: number; revenue: number }[];
  products: { label: string; units: number; revenue: number; id: string }[];
  notes: { label: string; revenue: number }[];
  warnings: { level: 'critical' | 'serious' | 'warning'; text: string; link: string }[];
}

const SETUP = [
  { label: 'Razorpay keys (online payments)', detail: 'Until then the store takes cash on delivery only.' },
  { label: 'Delhivery token and pickup location', detail: 'Until then shipments are booked manually with a tracking number.' },
  { label: 'Email provider (SMTP)', detail: 'Needed before password-reset emails reach customers.' },
  { label: 'Supabase Pro plan', detail: 'Needed before launch for bandwidth and image resizing.' },
  { label: 'GSTIN, business address and policy pages', detail: 'Placeholders are in use.' },
];

const dayLabel = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const compact = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `₹${Math.round(n)}`);

function Kpi({ label, value, hint, to }: { label: string; value: string; hint?: string; to?: string }) {
  const body = (
    <div className="bg-white border border-[#EAEAEA] px-4 py-3 h-full">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#777777]">{label}</p>
      <p className="text-[22px] text-tk-ink tabular-nums mt-0.5">{value}</p>
      {hint && <p className="text-[11px] text-[#888888]">{hint}</p>}
    </div>
  );
  return to ? <Link to={to} className="block hover:opacity-90">{body}</Link> : body;
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
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#EEEEEE" strokeWidth={1} />
            <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="#888888">{compact(t)}</text>
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
                <text x={pad.l + i * step + step / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#888888">{dayLabel(d.day)}</text>
              )}
            </g>
          );
        })}
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="#CCCCCC" strokeWidth={1} />
      </svg>
      {h && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 bg-tk-ink text-white text-[11px] px-2.5 py-1.5 shadow"
          style={{ left: `${((pad.l + (hover! + 0.5) * step) / W) * 100}%`, top: 0 }}
          role="status"
        >
          <p className="font-medium">{dayLabel(h.day)}</p>
          <p className="tabular-nums">{formatINR(h.revenue)} · {h.orders} order{h.orders === 1 ? '' : 's'}</p>
        </div>
      )}
      <details className="mt-2 text-[12px]">
        <summary className="cursor-pointer text-[#777777]">Show as a table</summary>
        <table className="mt-2 w-full max-w-[420px]">
          <thead>
            <tr className="text-left text-[11px] text-[#777777]"><th className="py-1 font-medium">Day</th><th className="py-1 font-medium text-right">Revenue</th><th className="py-1 font-medium text-right">Orders</th></tr>
          </thead>
          <tbody>
            {series.filter((d) => d.orders > 0).map((d) => (
              <tr key={d.day} className="border-t border-[#F0F0F0]"><td className="py-1">{dayLabel(d.day)}</td><td className="py-1 text-right tabular-nums">{formatINR(d.revenue)}</td><td className="py-1 text-right tabular-nums">{d.orders}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function RankList({ rows, value, empty, link }: { rows: { label: string; revenue: number; orders?: number; units?: number; id?: string }[]; value: 'revenue'; empty: string; link?: (r: { id?: string }) => string }) {
  const max = Math.max(1, ...rows.map((r) => r[value]));
  if (!rows.length) return <p className="text-[12px] text-[#888888]">{empty}</p>;
  return (
    <ol className="space-y-2 text-[12.5px]">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3">
            {link && r.id ? <Link to={link(r)} className="truncate hover:underline">{r.label}</Link> : <span className="truncate">{r.label}</span>}
            <span className="tabular-nums text-[#555555] shrink-0">{formatINR(r.revenue)}{r.orders !== undefined ? ` · ${r.orders}` : r.units !== undefined ? ` · ${r.units} sold` : ''}</span>
          </div>
          <span className="block h-1 mt-1 bg-[#F0F0F0]"><span className="block h-full bg-tk-accent" style={{ width: `${(r[value] / max) * 100}%` }} /></span>
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description={`Welcome${profile?.full_name ? `, ${profile.full_name}` : user?.email ? `, ${user.email}` : ''}.`}
        actions={
          <div className="flex gap-1" role="group" aria-label="Period">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d} className={`px-3 py-1.5 text-[12px] border ${days === d ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#D5D3CC] text-[#555555] hover:border-tk-ink'}`}>
                {d} days
              </button>
            ))}
          </div>
        }
      />
      {error && <p className="text-[13px] text-rose-600">{toFriendlyError(error)}</p>}

      {(data?.warnings ?? []).map((w) => (
        <Link key={w.text} to={w.link} className={`flex items-center gap-2 px-3 py-2 border text-[12.5px] ${w.level === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <AlertTriangle size={14} aria-hidden /> <span className="font-medium">{w.level === 'critical' ? 'Critical' : 'Attention'}:</span> {w.text}
        </Link>
      ))}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Kpi label={`Revenue · ${days} days`} value={k ? formatINR(Number(k.revenue)) : '—'} hint="Excludes cancelled orders" />
        <Kpi label="Orders" value={k ? String(k.orders) : '—'} hint={k ? `Average ${formatINR(Number(k.aov))}` : undefined} />
        <Kpi label="To handle" value={k ? String(k.pending) : '—'} hint={k ? `${k.to_ship} packed, waiting to ship` : undefined} to="/admin/orders?status=PENDING" />
        <Kpi label="Customers" value={k ? String(k.customers) : '—'} hint={k ? `${k.new_customers} new in ${days} days` : undefined} to="/admin/customers" />
        <Kpi label="Low stock" value={k ? String(k.low_stock) : '—'} hint="Sizes and sample vials" to="/admin/inventory" />
        <Kpi label="Returns waiting" value={k ? String(k.returns_waiting) : '—'} to="/admin/returns" />
        <Kpi label="Reviews waiting" value={k ? String(k.reviews_waiting) : '—'} to="/admin/reviews" />
      </div>

      <Panel title={`Revenue per day · last ${days} days`}>
        {isLoading ? <p className="text-[13px] text-[#777777]">Loading…</p> : hasSales ? <RevenueChart series={data!.series} /> : <p className="text-[13px] text-[#777777]">No orders in this period yet.</p>}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Top products by revenue"><RankList rows={data?.products ?? []} value="revenue" empty="No sales yet." link={(r) => `/admin/products/${r.id}`} /></Panel>
        <Panel title="Top notes by revenue"><RankList rows={data?.notes ?? []} value="revenue" empty="No sales yet." /></Panel>
        <Panel title="Top cities" description="Revenue · orders"><RankList rows={data?.cities ?? []} value="revenue" empty="No sales yet." /></Panel>
        <Panel title="Top states" description="Revenue · orders"><RankList rows={data?.states ?? []} value="revenue" empty="No sales yet." /></Panel>
      </div>

      <Panel title="Before launch" description="Integrations are built and switched off. Each one starts working when its keys are added.">
        <ul className="divide-y divide-[#F0F0F0]">
          {SETUP.map((s) => (
            <li key={s.label} className="py-3 flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 bg-tk-accent" aria-hidden />
              <div>
                <p className="text-[13px] text-tk-ink">{s.label}</p>
                <p className="text-[12px] text-[#777777]">{s.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
