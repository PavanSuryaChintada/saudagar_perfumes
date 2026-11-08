// Stock for the admin: perfumes are kept as ml of liquid (entered in ml, L or tola); sets and accessories are
// counted in pieces per size. One adjust dialog and one history panel serve Inventory, the product editor and Samples.
import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toFriendlyError } from '../../lib/errors';
import { Button } from '../ui/Button';
import { FieldShell, TextInput } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { rpc } from '../catalog/api';
import { formatOrderDateTime } from '../../storefront/orders/useOrders';

export const UNITS: { value: 'ml' | 'L' | 'tola'; label: string; ml: number }[] = [
  { value: 'ml', label: 'ml', ml: 1 },
  { value: 'L', label: 'L (1,000 ml)', ml: 1000 },
  { value: 'tola', label: 'tola (11.66 ml)', ml: 11.66 },
];

export const toMl = (amount: number, unit: string) => Math.round(amount * (UNITS.find((u) => u.value === unit)?.ml ?? 1) * 100) / 100;

/** 850 ml · 1.25 L (1,250 ml) */
export function formatMl(ml: number): string {
  const n = Number(ml) || 0;
  const plain = `${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ml`;
  return n >= 1000 ? `${(n / 1000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L (${plain})` : plain;
}

export const STOCK_REASONS: [string, string][] = [
  ['restock', 'Restock (new stock arrived)'],
  ['correction', 'Correction (the count was wrong)'],
  ['damaged', 'Damaged or spilled'],
  ['tester_sample_use', 'Used as a tester'],
  ['write_off', 'Write-off'],
];

const REASON_LABEL: Record<string, string> = {
  order: 'Order',
  cancel_restock: 'Order cancelled, put back',
  return_restock: 'Return put back',
  initial: 'Opening stock',
  restock: 'Restock',
  correction: 'Correction',
  damaged: 'Damaged or spilled',
  tester_sample_use: 'Used as a tester',
  write_off: 'Write-off',
};

export interface StockVariant {
  id: string;
  sku: string;
  label: string;
  kind: 'retail' | 'sample';
  size_ml: number | null;
  stock: number;
  is_active: boolean;
  is_hidden: boolean;
  in_sample_pool: boolean;
}

export interface StockProduct {
  id: string;
  name: string;
  stock_unit: 'ml' | 'piece';
  stock_ml: number;
  product_variants: StockVariant[];
}

/** "50 ml × 16 · 100 ml × 8 · samples × 160": what the liquid left is enough for. */
export function sizeSummary(p: StockProduct): { label: string; count: number; sample: boolean }[] {
  return p.product_variants
    .filter((v) => v.is_active && !v.is_hidden)
    .sort((a, b) => Number(a.kind === 'sample') - Number(b.kind === 'sample') || (a.size_ml ?? 0) - (b.size_ml ?? 0))
    .map((v) => ({ label: v.kind === 'sample' ? 'Samples' : v.label, count: v.stock, sample: v.kind === 'sample' }));
}

/** Add, remove or set stock, with a reason. ml products take an amount and unit; piece products a size and count. */
export function AdjustStockModal({ product, onClose, onDone }: { product: StockProduct | null; onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<'add' | 'remove' | 'set'>('add');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'ml' | 'L' | 'tola'>('ml');
  const [variantId, setVariantId] = useState('');
  const [reason, setReason] = useState('restock');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const liquid = product?.stock_unit === 'ml';
  const sizes = product?.product_variants.filter((v) => !v.is_hidden) ?? [];
  const n = Number(amount);
  const preview = liquid && product && amount.trim() && n >= 0
    ? mode === 'add' ? Number(product.stock_ml) + toMl(n, unit) : mode === 'remove' ? Number(product.stock_ml) - toMl(n, unit) : toMl(n, unit)
    : null;

  const close = () => {
    if (busy) return;
    setAmount('');
    setNote('');
    setMode('add');
    setReason('restock');
    setVariantId('');
    onClose();
  };

  const apply = async () => {
    if (!product) return;
    if (!(n >= 0) || amount.trim() === '') return toast.error(liquid ? 'Enter an amount, e.g. 500 ml or 1 L.' : 'Enter how many pieces.');
    if (!liquid && !Number.isInteger(n)) return toast.error('Pieces are whole numbers.');
    if (preview !== null && preview < 0) return toast.error(`Only ${formatMl(product.stock_ml)} is left, so that much can't be removed.`);
    setBusy(true);
    try {
      if (liquid) {
        await rpc('adjust_liquid', { p_product: product.id, p_mode: mode, p_amount: n, p_unit: unit, p_reason: mode === 'add' ? 'restock' : reason, p_note: note || null });
      } else {
        const v = sizes.find((x) => x.id === (variantId || sizes[0]?.id));
        if (!v) throw new Error('Choose a size.');
        const delta = mode === 'add' ? n : mode === 'remove' ? -n : n - v.stock;
        if (delta === 0) {
          setBusy(false);
          return close();
        }
        await rpc('adjust_stock', { p_variant: v.id, p_delta: delta, p_reason: mode === 'add' ? 'restock' : reason, p_note: note || null });
      }
      toast.success('Stock updated and logged.');
      onDone();
      setBusy(false);
      close();
    } catch (err) {
      toast.error(toFriendlyError(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!product}
      onOpenChange={(o) => !o && close()}
      title={`Stock · ${product?.name ?? ''}`}
      description={liquid ? `Kept as liquid. ${formatMl(product?.stock_ml ?? 0)} left now.` : 'Counted in pieces for each size.'}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={apply} busy={busy}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div role="radiogroup" aria-label="What to do" className="grid grid-cols-3 gap-1">
          {([
            ['add', 'Add'],
            ['remove', 'Remove'],
            ['set', 'Set to'],
          ] as const).map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={mode === v}
              onClick={() => setMode(v)}
              className={`py-2 text-[14px] border ${mode === v ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#C4C1B9] hover:border-tk-ink'}`}
            >
              {l}
            </button>
          ))}
        </div>
        {!liquid && sizes.length > 1 && (
          <FieldShell label="Size" htmlFor="adj-size">
            <select id="adj-size" value={variantId || sizes[0]?.id} onChange={(e) => setVariantId(e.target.value)} className="w-full border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white">
              {sizes.map((v) => (
                <option key={v.id} value={v.id}>{v.label} · {v.stock} now</option>
              ))}
            </select>
          </FieldShell>
        )}
        <FieldShell label={liquid ? 'Amount' : 'Pieces'} htmlFor="adj-amount" help={liquid ? 'e.g. 1 L for a new bottle of oil, or 250 ml.' : undefined}>
          <div className="flex gap-2">
            <TextInput id="adj-amount" inputMode="decimal" placeholder={liquid ? 'e.g. 1' : 'e.g. 12'} value={amount} onChange={(e) => setAmount(e.target.value)} />
            {liquid && (
              <select aria-label="Unit" value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)} className="border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white">
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            )}
          </div>
        </FieldShell>
        {preview !== null && (
          <p className={`text-[13.5px] ${preview < 0 ? 'text-rose-700' : 'text-[#3F3F3F]'}`}>
            After this: <strong>{preview < 0 ? 'not enough left' : formatMl(preview)}</strong>
          </p>
        )}
        {mode !== 'add' && (
          <FieldShell label="Reason" htmlFor="adj-reason">
            <select id="adj-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white">
              {STOCK_REASONS.filter(([v]) => v !== 'restock').map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </FieldShell>
        )}
        <FieldShell label="Note (optional)" htmlFor="adj-note" help="Only staff see this, e.g. supplier invoice number.">
          <TextInput id="adj-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </FieldShell>
      </div>
    </Modal>
  );
}

interface HistoryRow {
  id: number;
  created_at: string;
  reason: string;
  note: string | null;
  delta: number;
  ml_delta: number | null;
  ml_after: number | null;
  stock_after: number;
  size: string | null;
  kind: 'retail' | 'sample' | null;
  order_id: string | null;
  order_number: string | null;
}
interface History {
  totals: { orders_ml: number; samples_ml: number; returned_ml: number; added_ml: number; removed_ml: number; orders_units: number; samples_units: number };
  rows: HistoryRow[];
}

/** Where the stock went: totals for orders and samples, then every change. */
export function StockHistoryModal({ product, onClose }: { product: StockProduct | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stock-history', product?.id],
    enabled: !!product,
    queryFn: () => rpc<History>('product_stock_history', { p_product: product!.id, p_limit: 200 }),
  });
  const liquid = product?.stock_unit === 'ml';
  const t = data?.totals;
  const what = (r: HistoryRow) => {
    if (r.reason === 'order') return r.kind === 'sample' ? 'Free sample' : `Order${r.size ? ` · ${r.size}${Math.abs(r.delta) > 1 ? ` × ${Math.abs(r.delta)}` : ''}` : ''}`;
    return REASON_LABEL[r.reason] ?? r.reason;
  };
  return (
    <Modal open={!!product} onOpenChange={(o) => !o && onClose()} wide title={`Stock history · ${product?.name ?? ''}`} description="Every change, newest first.">
      {isLoading || !data ? (
        <p className="text-[14px] text-[#4A4A4A]">Loading…</p>
      ) : (
        <div className="space-y-4">
          {liquid && t && (
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
              {[
                ['Used by orders', `${formatMl(t.orders_ml)}`, `${t.orders_units} bottle${t.orders_units === 1 ? '' : 's'}`],
                ['Used by free samples', `${formatMl(t.samples_ml)}`, `${t.samples_units} sample${t.samples_units === 1 ? '' : 's'}`],
                ['Added', formatMl(t.added_ml), `${formatMl(t.returned_ml)} came back from cancels and returns`],
                ['Removed by hand', formatMl(t.removed_ml), 'Damaged, testers, corrections'],
              ].map(([label, value, hint]) => (
                <div key={label} className="border border-[#E2E0DB] px-3 py-2">
                  <p className="text-[12.5px] text-[#454545]">{label}</p>
                  <p className="text-[16px] text-tk-ink tabular-nums">{value}</p>
                  <p className="text-[12px] text-[#4A4A4A]">{hint}</p>
                </div>
              ))}
            </div>
          )}
          {data.rows.length === 0 ? (
            <p className="text-[14px] text-[#4A4A4A]">No changes yet.</p>
          ) : (
            <div className="overflow-x-auto max-h-[50vh] border border-[#E2E0DB]">
              <table className="w-full text-[13.5px] min-w-[560px]">
                <thead className="sticky top-0 bg-[#F8F7F5]">
                  <tr className="text-left text-[12px] border-b border-[#E2E0DB] font-medium">
                    <th className="px-3 py-2 font-medium">When</th>
                    <th className="px-3 py-2 font-medium">What</th>
                    <th className="px-3 py-2 font-medium text-right">Change</th>
                    <th className="px-3 py-2 font-medium text-right">Left after</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E7E2]">
                  {data.rows.map((r) => {
                    const change = liquid && r.ml_delta !== null ? Number(r.ml_delta) : r.delta;
                    return (
                      <tr key={r.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-[#454545]">{formatOrderDateTime(r.created_at)}</td>
                        <td className="px-3 py-2">
                          {what(r)}
                          {r.order_number && r.order_id && (
                            <Link to={`/admin/orders/${r.order_id}`} className="ml-2 underline underline-offset-4">{r.order_number}</Link>
                          )}
                          {r.note && <span className="block text-[12px] text-[#4A4A4A]">{r.note}</span>}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${change < 0 ? 'text-rose-700' : 'text-emerald-800'}`}>
                          {change > 0 ? '+' : ''}
                          {liquid ? `${Number(change).toLocaleString('en-IN', { maximumFractionDigits: 2 })} ml` : change}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{liquid && r.ml_after !== null ? formatMl(Number(r.ml_after)) : r.stock_after}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
