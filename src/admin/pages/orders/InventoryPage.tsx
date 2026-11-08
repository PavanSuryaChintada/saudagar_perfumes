import { ListHead } from '../../ui/ListHead';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { History, PackagePlus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { useSetting } from '../../../lib/bootstrap';
import { usePaged } from '../../../lib/paging';
import { PageHeader } from '../../ui/PageHeader';
import { Pager } from '../../ui/Pager';
import { TextInput } from '../../ui/Field';
import { throwIf, useInvalidateCatalog } from '../../catalog/api';
import { AdjustStockModal, StockHistoryModal, formatMl, sizeSummary, type StockProduct } from '../../inventory/stock';

type Filter = 'all' | 'low' | 'out';

const ACTION =
  'inline-flex items-center gap-1 px-2.5 py-1.5 text-[13px] text-[#3F3F3F] border border-[#C4C1B9] bg-white hover:border-tk-ink hover:text-tk-ink';

export default function InventoryPage() {
  const lowCount = Number(useSetting('inventory.low_stock_threshold', 5)) || 0;
  const lowMl = Number(useSetting('inventory.low_stock_ml', 100)) || 0;
  const invalidate = useInvalidateCatalog();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [adjusting, setAdjusting] = useState<StockProduct | null>(null);
  const [historyFor, setHistoryFor] = useState<StockProduct | null>(null);

  const { data: products = [], refetch, isLoading, error } = useQuery({
    queryKey: ['admin', 'catalog', 'inventory'],
    queryFn: async () =>
      (await throwIf(
        supabase
          .from('products')
          .select('id, name, stock_unit, stock_ml, product_variants(id, sku, label, kind, size_ml, stock, is_active, is_hidden, in_sample_pool)')
          .is('archived_at', null)
          .eq('is_gift_pack', false)
          .order('name'),
      )) as unknown as StockProduct[],
  });

  /** ok / low / out for one product. */
  const stateOf = (p: StockProduct): 'ok' | 'low' | 'out' => {
    const retail = p.product_variants.filter((v) => v.kind === 'retail' && v.is_active && !v.is_hidden);
    if (p.stock_unit === 'ml') {
      if (!retail.some((v) => v.stock > 0)) return 'out';
      return Number(p.stock_ml) <= lowMl ? 'low' : 'ok';
    }
    if (retail.length && retail.every((v) => v.stock <= 0)) return 'out';
    return retail.some((v) => v.stock <= lowCount) ? 'low' : 'ok';
  };

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((p) => filter === 'all' || stateOf(p) === filter)
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.product_variants.some((v) => v.sku.toLowerCase().includes(term)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, filter, search, lowMl, lowCount]);
  const paged = usePaged(visible, 25, `${filter}|${search}`);
  const counts = useMemo(() => ({ low: products.filter((p) => stateOf(p) === 'low').length, out: products.filter((p) => stateOf(p) === 'out').length }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, lowMl, lowCount]);
  const refresh = async () => {
    await Promise.all([refetch(), invalidate()]);
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Perfumes are kept as liquid: enter what you have in ml, L or tola, and every bottle and free sample sold takes its ml. Sets and accessories are counted in pieces."
        actions={
          <Link to="/admin/spreadsheets" className="inline-flex items-center gap-2 border border-[#C4C1B9] bg-white px-4 py-2.5 text-[14px] font-medium hover:border-tk-ink">
            Update many by spreadsheet
          </Link>
        }
      />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <div className="flex flex-wrap gap-1.5">
          {([
            ['all', `All (${products.length})`],
            ['low', `Running low (${counts.low})`],
            ['out', `Sold out (${counts.out})`],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 text-[13.5px] border ${filter === k ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#C4C1B9] text-[#3F3F3F] hover:border-tk-ink'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <TextInput placeholder="Search by product or SKU" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-[300px]" aria-label="Search stock" />
      </div>

      {isLoading && <p className="text-[14px] text-[#4A4A4A]">Loading…</p>}
      {error && <p className="text-[14px] text-rose-600">{toFriendlyError(error)}</p>}

      <div className="bg-white border border-[#E2E0DB]">
      <ListHead from="lg">
        <span className="w-[30%]">Product</span>
        <span className="w-[22%]">Stock left</span>
        <span className="flex-1">Bottles you can still sell, per size</span>
        <span className="pr-1">Status and actions</span>
      </ListHead>
      <ul className="divide-y divide-[#E9E7E2]">
        {paged.rows.map((p) => {
          const st = stateOf(p);
          const liquid = p.stock_unit === 'ml';
          return (
            <li key={p.id} className="px-3 sm:px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="min-w-0 lg:w-[30%]">
                <Link to={`/admin/products/${p.id}`} className="text-[14.5px] font-medium text-tk-ink hover:underline underline-offset-4">{p.name}</Link>
                <p className="text-[12.5px] text-[#4A4A4A]">{liquid ? 'Kept as liquid' : 'Counted in pieces'}</p>
              </div>
              <div className="lg:w-[22%]">
                {liquid ? (
                  <>
                    <p className="text-[17px] font-medium tabular-nums text-tk-ink">{formatMl(Number(p.stock_ml))}</p>
                    <p className="text-[12.5px] text-[#4A4A4A] lg:hidden">left</p>
                  </>
                ) : (
                  <p className="text-[14px] text-[#3F3F3F]">Each size has its own count</p>
                )}
              </div>
              <ul className="flex flex-wrap gap-1.5 lg:flex-1" aria-label="Enough for">
                {sizeSummary(p).map((s) => (
                  <li
                    key={s.label}
                    className={`px-2 py-0.5 border text-[12.5px] tabular-nums ${s.count === 0 ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-[#D3D0C8] text-[#3F3F3F]'}`}
                  >
                    {s.label} × {s.count}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-[12px] font-medium border ${
                    st === 'out' ? 'bg-rose-50 text-rose-800 border-rose-200' : st === 'low' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {st === 'out' ? 'Sold out' : st === 'low' ? 'Running low' : 'In stock'}
                </span>
                <button type="button" className={ACTION} onClick={() => setAdjusting(p)}>
                  <PackagePlus size={14} aria-hidden /> Adjust
                </button>
                <button type="button" className={ACTION} onClick={() => setHistoryFor(p)}>
                  <History size={14} aria-hidden /> History
                </button>
              </div>
            </li>
          );
        })}
        {!isLoading && paged.rows.length === 0 && <li className="px-4 py-8 text-center text-[14px] text-[#4A4A4A]">Nothing matches.</li>}
      </ul>
      </div>
      <Pager page={paged.page} pageCount={paged.pageCount} onPage={paged.setPage} from={paged.from} to={paged.to} total={paged.total} noun="products" />

      <AdjustStockModal product={adjusting} onClose={() => setAdjusting(null)} onDone={refresh} />
      <StockHistoryModal product={historyFor} onClose={() => setHistoryFor(null)} />
    </div>
  );
}
