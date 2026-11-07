import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { useBootstrap } from '../../../lib/bootstrap';
import { PageHeader, Panel } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextInput, Toggle } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { SortableList } from '../../ui/SortableList';
import { rpc, throwIf, useInvalidateCatalog } from '../../catalog/api';
import { useProductLookup } from '../../cms/lookups';

interface PoolRow {
  id: string;
  label: string;
  sku: string;
  stock: number;
  in_sample_pool: boolean;
  is_active: boolean;
  position: number;
  product: { id: string; name: string; is_active: boolean; archived_at: string | null } | null;
}

/** Admin → Free samples: the rule, the list customers pick from, and what was given. */
export default function SamplesPage() {
  const invalidate = useInvalidateCatalog();
  const { data: boot } = useBootstrap();
  const settings = (boot?.settings ?? {}) as Record<string, unknown>;
  const mlPer = Number(settings['samples.ml_per_sample'] ?? 50) || 50;
  const maxPer = Number(settings['samples.max_per_order'] ?? 4) || 0;
  const size = Number(settings['samples.sample_size_ml'] ?? 5) || 5;
  const enabled = settings['samples.enabled'] !== false;
  const [exampleMl, setExampleMl] = useState('100');
  const earned = Math.min(maxPer, Math.floor((Number(exampleMl) || 0) / mlPer));

  const { data: pool = [], refetch } = useQuery({
    queryKey: ['admin', 'sample-pool'],
    queryFn: async () =>
      (await throwIf(
        supabase
          .from('product_variants')
          .select('id, label, sku, stock, in_sample_pool, is_active, position, product:products(id, name, is_active, archived_at)')
          .eq('kind', 'sample')
          .eq('is_hidden', false)
          .order('position'),
      )) as unknown as PoolRow[],
  });

  const given = useQuery({
    queryKey: ['admin', 'samples-given'],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const rows = (await throwIf(
        supabase.from('order_items').select('product_name, qty, order:orders!inner(created_at, status)').eq('line_type', 'sample').gte('order.created_at', since),
      )) as unknown as { product_name: string; qty: number; order: { status: string } }[];
      const by = new Map<string, number>();
      for (const r of rows ?? []) if (r.order.status !== 'CANCELLED') by.set(r.product_name, (by.get(r.product_name) ?? 0) + r.qty);
      return [...by.entries()].sort((a, b) => b[1] - a[1]);
    },
  });

  const { data: products = [] } = useProductLookup();
  const withVial = useMemo(() => new Set(pool.map((p) => p.product?.id)), [pool]);
  const [adding, setAdding] = useState(false);
  const [newProduct, setNewProduct] = useState('');
  const [newStock, setNewStock] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    await refetch();
    await invalidate();
  };

  const setInPool = async (r: PoolRow, on: boolean) => {
    try {
      await throwIf(supabase.from('product_variants').update({ in_sample_pool: on }).eq('id', r.id));
      await refresh();
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  const addVial = async () => {
    if (!newProduct) return toast.error('Choose a product.');
    const stock = newStock.trim() === '' ? 0 : Number(newStock);
    if (!Number.isInteger(stock) || stock < 0) return toast.error('Opening stock must be a whole number.');
    setBusy(true);
    try {
      await rpc('create_sample_variant', { p_product: newProduct, p_size_ml: size, p_stock: stock });
      setAdding(false);
      setNewProduct('');
      setNewStock('');
      await refresh();
      toast.success('Sample vial added to the list.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const live = pool.filter((r) => r.in_sample_pool && r.is_active && r.stock > 0 && r.product?.is_active && !r.product.archived_at).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Free samples"
        description={`Customers earn one free ${size} ml sample for every ${mlPer} ml of perfume, up to ${maxPer} per order, and pick from this list. Change the rule under Settings → Free samples.`}
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={14} /> Add sample vial
          </Button>
        }
      />
      {!enabled && <p className="px-3 py-2 bg-amber-50 border border-amber-200 text-[12px] text-amber-800">The free sample programme is switched off in Settings.</p>}

      <Panel title="Try the rule">
        <div className="flex flex-wrap items-end gap-3 text-[13px]">
          <FieldShell label="Perfume in the bag (ml)" htmlFor="ex-ml">
            <TextInput id="ex-ml" inputMode="numeric" value={exampleMl} onChange={(e) => setExampleMl(e.target.value)} className="max-w-[140px]" />
          </FieldShell>
          <p className="pb-2">
            earns <strong>{earned}</strong> free sample{earned === 1 ? '' : 's'}.
          </p>
        </div>
      </Panel>

      <Panel title={`Sample list · ${live} available to pick`} description="Drag to set the order customers see. Vials at zero stock are hidden from customers automatically; 'Surprise me' picks favour scents with more stock.">
        {pool.length === 0 ? (
          <p className="text-[13px] text-[#777777]">No sample vials yet. Add one, or switch on “Offer as a free sample” in a product.</p>
        ) : (
          <SortableList
            items={pool}
            className="border border-[#EAEAEA] divide-y divide-[#F0F0F0]"
            onReorder={async (ids) => {
              try {
                await rpc('reorder_rows', { p_table: 'product_variants', p_ids: ids });
                await refresh();
              } catch (err) {
                toast.error(toFriendlyError(err));
              }
            }}
            renderItem={(r) => (
              <div className="flex items-center gap-3 pr-3 py-2 text-[13px]">
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/products/${r.product?.id}`} className="hover:underline">{r.product?.name}</Link>
                  <p className="text-[11px] text-[#888888]">{r.label} · {r.sku}{r.product && !r.product.is_active ? ' · product is a draft' : ''}</p>
                </div>
                <span className={`tabular-nums text-[12px] ${r.stock === 0 ? 'text-rose-600' : r.stock <= 5 ? 'text-amber-700' : 'text-[#555555]'}`}>{r.stock} in stock</span>
                <Toggle checked={r.in_sample_pool} onChange={(on) => setInPool(r, on)} label={`Offer ${r.product?.name ?? ''} as a free sample`} />
              </div>
            )}
          />
        )}
        <p className="mt-2 text-[11px] text-[#888888]">Add stock to vials from Inventory → Sample vials.</p>
      </Panel>

      <Panel title="Given in the last 30 days">
        {(given.data ?? []).length === 0 ? (
          <p className="text-[13px] text-[#777777]">None yet.</p>
        ) : (
          <ul className="text-[13px] divide-y divide-[#F0F0F0]">
            {(given.data ?? []).map(([name, n]) => (
              <li key={name} className="flex justify-between py-1.5">
                <span>{name}</span>
                <span className="tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal
        open={adding}
        onOpenChange={(o) => !o && !busy && setAdding(false)}
        title="Add a sample vial"
        description={`Creates a ${size} ml sample of the chosen scent and puts it on the list.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)} disabled={busy}>Cancel</Button>
            <Button onClick={addVial} busy={busy}>Add vial</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FieldShell label="Scent" htmlFor="sv-product">
            <select id="sv-product" value={newProduct} onChange={(e) => setNewProduct(e.target.value)} className="w-full border border-[#D5D3CC] px-2 py-2 text-[13px] bg-white">
              <option value="">Choose a product…</option>
              {products.filter((p) => !withVial.has(p.id)).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FieldShell>
          <FieldShell label="Opening stock (vials)" htmlFor="sv-stock">
            <TextInput id="sv-stock" inputMode="numeric" placeholder="e.g. 50" value={newStock} onChange={(e) => setNewStock(e.target.value)} />
          </FieldShell>
        </div>
      </Modal>
    </div>
  );
}
