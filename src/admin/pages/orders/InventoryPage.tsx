import { useMemo, useState } from 'react';
import { usePaged } from '../../../lib/paging';
import { Pager } from '../../ui/Pager';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { useSetting } from '../../../lib/bootstrap';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextInput } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { rpc, throwIf, useInvalidateCatalog } from '../../catalog/api';
import { formatOrderDateTime } from '../../../storefront/orders/useOrders';

export const STOCK_REASONS: [string, string][] = [
  ['restock', 'Restock (new stock arrived)'],
  ['correction', 'Correction (count was wrong)'],
  ['damaged', 'Damaged'],
  ['tester_sample_use', 'Used as a tester'],
  ['write_off', 'Write-off'],
];
const REASON_LABEL: Record<string, string> = {
  order: 'Order',
  cancel_restock: 'Order cancelled',
  return_restock: 'Return restocked',
  initial: 'Opening stock',
  ...Object.fromEntries(STOCK_REASONS.map(([v, l]) => [v, l.split(' (')[0]])),
};

interface VariantRow {
  id: string;
  sku: string;
  label: string;
  kind: 'retail' | 'sample';
  stock: number;
  is_active: boolean;
  is_hidden: boolean;
  in_sample_pool: boolean;
  product: { id: string; name: string; archived_at: string | null } | null;
}

interface Movement {
  id: number;
  delta: number;
  stock_after: number;
  reason: string;
  note: string | null;
  order_id: string | null;
  created_at: string;
}

export default function InventoryPage() {
  const low = Number(useSetting('inventory.low_stock_threshold', 5)) || 0;
  const invalidate = useInvalidateCatalog();
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'samples'>('all');
  const [search, setSearch] = useState('');
  const [adjusting, setAdjusting] = useState<VariantRow | null>(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('restock');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [historyFor, setHistoryFor] = useState<VariantRow | null>(null);

  const { data: rows = [], refetch, isLoading } = useQuery({
    queryKey: ['admin', 'inventory'],
    queryFn: async () =>
      (await throwIf(
        supabase.from('product_variants').select('id, sku, label, kind, stock, is_active, is_hidden, in_sample_pool, product:products(id, name, archived_at)').order('stock'),
      )) as unknown as VariantRow[],
  });

  const history = useQuery({
    queryKey: ['admin', 'inventory', 'history', historyFor?.id],
    enabled: !!historyFor,
    queryFn: async () =>
      (await throwIf(
        supabase.from('inventory_movements').select('id, delta, stock_after, reason, note, order_id, created_at').eq('variant_id', historyFor!.id).order('created_at', { ascending: false }).limit(100),
      )) as Movement[],
  });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter((r) => r.product && !r.product.archived_at && !r.is_hidden)
      .filter((r) => (filter === 'low' ? r.stock > 0 && r.stock <= low : filter === 'out' ? r.stock === 0 : filter === 'samples' ? r.kind === 'sample' : true))
      .filter((r) => !term || r.product!.name.toLowerCase().includes(term) || r.sku.toLowerCase().includes(term));
  }, [rows, filter, search, low]);
  const paged = usePaged(visible, 25, visible.length);

  const counts = useMemo(() => {
    const live = rows.filter((r) => r.product && !r.product.archived_at && !r.is_hidden);
    return { low: live.filter((r) => r.stock > 0 && r.stock <= low).length, out: live.filter((r) => r.stock === 0).length };
  }, [rows, low]);

  const apply = async () => {
    if (!adjusting) return;
    const d = Number(delta);
    if (!Number.isInteger(d) || d === 0) {
      toast.error('Enter a whole number, e.g. 12 to add or -2 to remove.');
      return;
    }
    setBusy(true);
    try {
      await rpc('adjust_stock', { p_variant: adjusting.id, p_delta: d, p_reason: reason, p_note: note || null });
      toast.success('Stock updated and logged.');
      setAdjusting(null);
      await refetch();
      await invalidate();
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Every bottle size and sample vial. Each change is logged with its reason; orders and cancellations move stock automatically."
        actions={
          <Link to="/admin/spreadsheets" className="inline-flex items-center gap-2 border border-[#C4C1B9] bg-white px-4 py-2.5 text-[14px] font-medium hover:border-tk-ink">
            Update many by spreadsheet
          </Link>
        }
      />
      <div className="flex flex-wrap gap-1 mb-3">
        {([
          ['all', 'All'],
          ['low', `Low stock (${counts.low})`],
          ['out', `Out of stock (${counts.out})`],
          ['samples', 'Sample vials'],
        ] as const).map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 text-[13px] border ${filter === v ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#C4C1B9] text-[#454545] hover:border-tk-ink'}`}
          >
            {l}
          </button>
        ))}
      </div>
      <TextInput placeholder="Search by product or SKU" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[320px] mb-4" aria-label="Search inventory" />

      <div className="bg-white border border-[#E2E0DB] overflow-x-auto">
        <table className="w-full text-[14px] min-w-[640px]">
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-[0.06em] text-[#5A5A5A] border-b border-[#E2E0DB]">
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Size</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium text-right">Stock</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E7E2]">
            {isLoading && <tr><td colSpan={5} className="px-3 py-6 text-[#5A5A5A]">Loading…</td></tr>}
            {!isLoading && visible.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-[#5A5A5A]">Nothing here.</td></tr>}
            {paged.rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2">
                  <Link to={`/admin/products/${r.product!.id}`} className="hover:underline">{r.product!.name}</Link>
                </td>
                <td className="px-3 py-2">
                  {r.label}
                  {r.kind === 'sample' && <span className="ml-2 text-[11px] uppercase tracking-wider text-tk-accent">{r.in_sample_pool ? 'Free sample' : 'Sample (off)'}</span>}
                  {!r.is_active && <span className="ml-2 text-[11px] uppercase tracking-wider text-[#6B6B6B]">Unavailable</span>}
                </td>
                <td className="px-3 py-2 font-mono text-[13px] text-[#454545]">{r.sku}</td>
                <td className={`px-3 py-2 text-right tabular-nums font-medium ${r.stock === 0 ? 'text-rose-600' : r.stock <= low ? 'text-amber-700' : ''}`}>{r.stock}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Button size="sm" variant="secondary" onClick={() => { setDelta(''); setNote(''); setReason('restock'); setAdjusting(r); }}>Adjust</Button>
                  <button type="button" aria-label={`Stock history for ${r.product!.name} ${r.label}`} className="ml-1 inline-flex items-center gap-1 px-2 py-1.5 text-[12.5px] text-[#3F3F3F] border border-transparent hover:border-[#C4C1B9] hover:text-tk-ink align-middle" onClick={() => setHistoryFor(r)}>
                    <History size={13} aria-hidden /> History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={paged.page} pageCount={paged.pageCount} onPage={paged.setPage} from={paged.from} to={paged.to} total={paged.total} noun="sizes" />

      <Modal
        open={!!adjusting}
        onOpenChange={(o) => !o && !busy && setAdjusting(null)}
        title={`Adjust stock · ${adjusting?.product?.name ?? ''} ${adjusting?.label ?? ''}`}
        description={`Current stock: ${adjusting?.stock ?? 0}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjusting(null)} disabled={busy}>Cancel</Button>
            <Button onClick={apply} busy={busy}>Apply</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FieldShell label="Change" htmlFor="inv-delta" help="Positive adds stock (e.g. 12), negative removes it (e.g. -2).">
            <TextInput id="inv-delta" inputMode="numeric" placeholder="e.g. 12" value={delta} onChange={(e) => setDelta(e.target.value)} />
          </FieldShell>
          <FieldShell label="Reason" htmlFor="inv-reason">
            <select id="inv-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white">
              {STOCK_REASONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </FieldShell>
          <FieldShell label="Note (optional)" htmlFor="inv-note">
            <TextInput id="inv-note" placeholder="e.g. Invoice #4512 from supplier" value={note} onChange={(e) => setNote(e.target.value)} />
          </FieldShell>
        </div>
      </Modal>

      <Modal open={!!historyFor} onOpenChange={(o) => !o && setHistoryFor(null)} title={`Stock history · ${historyFor?.product?.name ?? ''} ${historyFor?.label ?? ''}`} wide>
        {history.isLoading ? (
          <p className="text-[14px] text-[#5A5A5A]">Loading…</p>
        ) : (history.data ?? []).length === 0 ? (
          <p className="text-[14px] text-[#5A5A5A]">No stock changes yet.</p>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-[12px] uppercase tracking-[0.06em] text-[#5A5A5A] border-b border-[#E2E0DB]">
                <th className="py-1.5 font-medium">When</th>
                <th className="py-1.5 font-medium">Reason</th>
                <th className="py-1.5 font-medium text-right">Change</th>
                <th className="py-1.5 font-medium text-right">After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E7E2]">
              {(history.data ?? []).map((m) => (
                <tr key={m.id}>
                  <td className="py-1.5 text-[#525252] whitespace-nowrap">{formatOrderDateTime(m.created_at)}</td>
                  <td className="py-1.5">
                    {REASON_LABEL[m.reason] ?? m.reason}
                    {m.order_id && <Link to={`/admin/orders/${m.order_id}`} className="ml-1 underline text-[12px]">order</Link>}
                    {m.note && <span className="block text-[12px] text-[#626262]">{m.note}</span>}
                  </td>
                  <td className={`py-1.5 text-right tabular-nums ${m.delta < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                  <td className="py-1.5 text-right tabular-nums">{m.stock_after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
