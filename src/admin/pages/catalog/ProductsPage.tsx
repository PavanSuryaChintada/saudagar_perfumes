import { ListHead, StockText } from '../../ui/ListHead';
import { useMemo, useState } from 'react';
import { usePaged } from '../../../lib/paging';
import { Pager } from '../../ui/Pager';
import { Link, useNavigate } from 'react-router';
import { Copy, Archive, ArchiveRestore, FileSpreadsheet, Pencil, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { toFriendlyError } from '../../../lib/errors';
import { formatRupees as formatINR } from '../../../lib/money';
import { PageHeader } from '../../ui/PageHeader';
import { useGuideStatus } from '../../guide/useGuideStatus';
import { Button } from '../../ui/Button';
import { TextInput } from '../../ui/Field';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Modal } from '../../ui/Modal';
import { BulkBar, BulkButton, RowCheck } from '../../ui/BulkBar';
import { SearchSelect, categoryOptions } from '../../ui/SearchSelect';
import { rpc, useAdminProducts, useCategories, useCollectionsAdmin, useInvalidateCatalog, type ProductListRow } from '../../catalog/api';

type Status = 'all' | 'active' | 'draft' | 'archived';
const statusOf = (p: ProductListRow): Exclude<Status, 'all'> => (p.archived_at ? 'archived' : p.is_active ? 'active' : 'draft');
const ACTION =
  'inline-flex items-center gap-1 px-2 py-1.5 text-[12.5px] text-[#3F3F3F] border border-transparent hover:border-[#C4C1B9] hover:text-tk-ink';
const STATUS_STYLE = { active: 'bg-emerald-50 text-emerald-700', draft: 'bg-amber-50 text-amber-700', archived: 'bg-[#E9E7E2] text-[#4A4A4A]' };

export default function ProductsPage() {
  const navigate = useNavigate();
  const invalidate = useInvalidateCatalog();
  const { data = [], isLoading, error } = useAdminProducts();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [confirm, setConfirm] = useState<{ kind: 'delete' | 'archive'; product: ProductListRow } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<null | 'add_category' | 'remove_category' | 'add_collection' | 'remove_collection' | 'set_badge'>(null);
  const [bulkValue, setBulkValue] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const { data: categories = [] } = useCategories();
  const { data: collections = [] } = useCollectionsAdmin();

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((p) => (status === 'all' || statusOf(p) === status) && (!q || p.name.toLowerCase().includes(q) || p.slug.includes(q)));
  }, [data, search, status]);
  const paged = usePaged(rows, 25, `${search}|${status}`);
  const counts = useMemo(() => {
    const c = { all: data.length, active: 0, draft: 0, archived: 0 };
    data.forEach((p) => (c[statusOf(p)] += 1));
    return c;
  }, [data]);

  const toggle = (id: string, on: boolean) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const allShown = paged.rows.length > 0 && paged.rows.every((r) => selected.has(r.id));
  const bulkRun = async (action: string, value: string | null, ok: (n: number) => string) => {
    setBulkBusy(true);
    try {
      const n = await rpc<number>('bulk_product_action', { p_ids: [...selected], p_action: action, p_value: value });
      await invalidate();
      toast.success(ok(n));
      setSelected(new Set());
      setBulk(null);
      setBulkValue(null);
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setBulkBusy(false);
    }
  };

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      await invalidate();
      toast.success(ok);
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Every fragrance, set and accessory. Prices, sizes, notes and scent profile are edited per product."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/admin/spreadsheets')}>
              <FileSpreadsheet size={14} /> Import or update by spreadsheet
            </Button>
            <Button onClick={() => navigate('/admin/products/new')}>
              <Plus size={14} /> Add product
            </Button>
          </>
        }
      />
      <BeforeProducts />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'active', 'draft', 'archived'] as Status[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-[13px] border ${status === s ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#C4C1B9] text-[#454545] hover:border-tk-ink'}`}
            >
              {s[0].toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          ))}
        </div>
        <TextInput placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-[280px]" aria-label="Search products" />
      </div>

      {isLoading && <p className="text-[14px] text-[#4A4A4A]">Loading…</p>}
      {error && <p className="text-[14px] text-rose-600">{toFriendlyError(error)}</p>}

      <div className="bg-white border border-[#E2E0DB] divide-y divide-[#E9E7E2]">
        {paged.rows.length > 0 && (
          <>
            <label className="sm:hidden flex items-center gap-3 px-3 py-2.5 bg-[#ECE8DF] text-[13px] font-medium text-[#222222] cursor-pointer">
              <RowCheck
                checked={allShown}
                onChange={(on) => setSelected(on ? new Set(paged.rows.map((r) => r.id)) : new Set())}
                label="Select every product shown"
              />
              {allShown ? `All ${paged.rows.length} on this page are selected` : `Select all ${paged.rows.length} on this page`}
            </label>
            <ListHead>
              <RowCheck
                checked={allShown}
                onChange={(on) => setSelected(on ? new Set(paged.rows.map((r) => r.id)) : new Set())}
                label="Select every product shown"
              />
              <span className="w-12 shrink-0" aria-hidden />
              <span className="flex-1 basis-[160px] min-w-0">Product</span>
              <span className="w-[72px]">Status</span>
              <span className="w-[140px]">Price</span>
              <span className="w-[120px]">Stock left</span>
              <span className="w-[350px] text-right pr-2">Actions</span>
            </ListHead>
          </>
        )}
        {paged.rows.map((p) => {
          const st = statusOf(p);
          const price = p.min_price !== null && p.max_price !== null && p.min_price !== p.max_price
            ? `${formatINR(p.min_price)} – ${formatINR(p.max_price)}`
            : formatINR(p.min_price ?? p.base_price);
          return (
            <div key={p.id} className={`flex flex-wrap sm:flex-nowrap items-center gap-3 px-3 sm:px-4 py-3 ${selected.has(p.id) ? 'bg-[#FBF8F1]' : ''}`}>
              <RowCheck checked={selected.has(p.id)} onChange={(on) => toggle(p.id, on)} label={`Select ${p.name}`} />
              <div className="w-12 h-12 bg-[#F4F3EE] shrink-0 overflow-hidden">
                {p.image && <img src={p.image} alt="" className="w-full h-full object-contain" loading="lazy" />}
              </div>
              <Link to={`/admin/products/${p.id}`} className="min-w-0 flex-1 basis-[160px] group">
                <p className="text-[14px] font-medium text-tk-ink group-hover:text-tk-accent group-hover:underline underline-offset-4 line-clamp-2 sm:line-clamp-1">{p.name}</p>
                <p className="text-[12px] text-[#4F4F4F] truncate">
                  /{p.slug}
                  {p.admin_note?.startsWith('SAMPLE') && <span className="ml-2 text-amber-700">· sample content</span>}
                </p>
              </Link>
              <span className="sm:w-[72px]">
                <span className={`inline-block px-2 py-0.5 text-[12px] font-medium capitalize ${STATUS_STYLE[st]}`}>{st}</span>
              </span>
              <span className="sm:w-[140px] text-[13.5px] font-medium text-[#1F1F1F] tabular-nums">{price}</span>
              <span className="sm:w-[120px] shrink-0 overflow-hidden text-[13px] tabular-nums">
                <StockText level={p.total_stock <= 0 ? 'out' : p.stock_unit === 'piece' && p.total_stock <= 5 ? 'low' : 'ok'}>
                  {p.stock_unit === 'ml' ? (
                    // Litres on one line, the exact ml under it, so it never runs into the buttons.
                    Number(p.stock_ml) >= 1000 ? (
                      <>
                        {(Number(p.stock_ml) / 1000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L
                        <span className="block text-[11.5px] text-[#5F5F5F]">{Number(p.stock_ml).toLocaleString('en-IN')} ml</span>
                      </>
                    ) : (
                      `${Number(p.stock_ml).toLocaleString('en-IN')} ml`
                    )
                  ) : (
                    `${p.total_stock} pieces`
                  )}
                </StockText>
              </span>
              <div className="flex flex-wrap sm:flex-nowrap justify-end gap-0.5 ml-auto sm:ml-0 sm:w-[350px]">
                <Link to={`/admin/products/${p.id}`} className={ACTION}>
                  <Pencil size={13} aria-hidden /> Edit
                </Link>
                <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" className={ACTION}>
                  <ExternalLink size={13} aria-hidden /> View
                </a>
                <button
                  type="button"
                  className={ACTION}
                  onClick={() =>
                    run(async () => {
                      const id = await rpc<string>('duplicate_product', { p_id: p.id });
                      navigate(`/admin/products/${id}`);
                    }, 'Copy created as a draft.')
                  }
                >
                  <Copy size={13} aria-hidden /> Duplicate
                </button>
                {p.archived_at ? (
                  <button type="button" className={ACTION} onClick={() => run(() => rpc('archive_product', { p_id: p.id, p_archived: false }), 'Restored as a draft.')}>
                    <ArchiveRestore size={13} aria-hidden /> Restore
                  </button>
                ) : (
                  <button type="button" className={ACTION} onClick={() => setConfirm({ kind: 'archive', product: p })}>
                    <Archive size={13} aria-hidden /> Archive
                  </button>
                )}
                {p.units_sold === 0 && (
                  <button type="button" className={`${ACTION} hover:!text-rose-700 hover:!border-rose-300`} onClick={() => setConfirm({ kind: 'delete', product: p })}>
                    <Trash2 size={13} aria-hidden /> Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!isLoading && rows.length === 0 && (
          <p className="p-8 text-center text-[14px] text-[#4A4A4A]">
            {data.length === 0 ? 'No products yet. Press “Add product” to create the first one.' : 'No products match. Clear the search or pick another tab.'}
          </p>
        )}
      </div>
      <Pager page={paged.page} pageCount={paged.pageCount} onPage={paged.setPage} from={paged.from} to={paged.to} total={paged.total} noun="products" />

      {selected.size > 0 && <div className="h-24" aria-hidden />}
      <BulkBar count={selected.size} noun={['product', 'products']} onClear={() => setSelected(new Set())}>
        <BulkButton disabled={bulkBusy} onClick={() => bulkRun('activate', null, (n) => `${n} made live.`)}>Make live</BulkButton>
        <BulkButton disabled={bulkBusy} onClick={() => bulkRun('deactivate', null, (n) => `${n} hidden from the store.`)}>Hide</BulkButton>
        <BulkButton disabled={bulkBusy} onClick={() => setBulk('add_category')}>Add to category</BulkButton>
        <BulkButton disabled={bulkBusy} onClick={() => setBulk('add_collection')}>Add to collection</BulkButton>
        <BulkButton disabled={bulkBusy} onClick={() => setBulk('remove_category')}>Remove from category</BulkButton>
        <BulkButton disabled={bulkBusy} onClick={() => setBulk('set_badge')}>Set badge</BulkButton>
        <BulkButton disabled={bulkBusy} onClick={() => bulkRun('archive', null, (n) => `${n} archived.`)}>Archive</BulkButton>
      </BulkBar>

      <Modal
        open={!!bulk}
        onOpenChange={(o) => {
          if (!o && !bulkBusy) {
            setBulk(null);
            setBulkValue(null);
          }
        }}
        title={
          bulk === 'set_badge'
            ? `Badge for ${selected.size} products`
            : `${bulk?.startsWith('remove') ? 'Remove' : 'Add'} ${selected.size} products ${bulk?.startsWith('remove') ? 'from' : 'to'} a ${bulk?.includes('collection') ? 'collection' : 'category'}`
        }
        description={bulk === 'set_badge' ? 'Shown on the product card, e.g. New, Bestseller, Limited. Leave empty to remove the badge.' : undefined}
        footer={
          <>
            <Button variant="secondary" disabled={bulkBusy} onClick={() => { setBulk(null); setBulkValue(null); }}>Cancel</Button>
            <Button
              busy={bulkBusy}
              disabled={bulk !== 'set_badge' && !bulkValue}
              onClick={() =>
                bulk &&
                bulkRun(bulk, bulk === 'set_badge' ? bulkValue ?? '' : bulkValue, (n) =>
                  bulk === 'set_badge' ? `Badge updated on ${n} products.` : `${n} ${bulk.startsWith('remove') ? 'removed' : 'added'}.`,
                )
              }
            >
              Apply
            </Button>
          </>
        }
      >
        {bulk === 'set_badge' ? (
          <TextInput value={bulkValue ?? ''} onChange={(e) => setBulkValue(e.target.value)} placeholder="e.g. Bestseller" aria-label="Badge" />
        ) : bulk?.includes('collection') ? (
          <SearchSelect options={collections.map((c) => ({ value: c.id, label: c.name }))} value={bulkValue} onChange={setBulkValue} placeholder="Search collections" ariaLabel="Collection" />
        ) : (
          <SearchSelect options={categoryOptions(categories)} value={bulkValue} onChange={setBulkValue} placeholder="Search categories" ariaLabel="Category" />
        )}
        {bulk === 'add_category' && <p className="mt-2 text-[13px] text-[#4A4A4A]">Products keep their main category; this adds an extra one.</p>}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.kind === 'delete' ? `Delete ${confirm.product.name}?` : `Archive ${confirm?.product.name}?`}
        description={
          confirm?.kind === 'delete'
            ? 'It is removed permanently with its sizes and photos. This cannot be undone.'
            : 'It disappears from the store but stays in order history. You can restore it later.'
        }
        confirmLabel={confirm?.kind === 'delete' ? 'Delete' : 'Archive'}
        danger={confirm?.kind === 'delete'}
        onConfirm={() =>
          confirm
            ? run(
                () => (confirm.kind === 'delete' ? rpc('delete_product', { p_id: confirm.product.id }) : rpc('archive_product', { p_id: confirm.product.id, p_archived: true })),
                confirm.kind === 'delete' ? 'Product deleted.' : 'Product archived.',
              )
            : undefined
        }
      />
    </div>
  );
}

/** Shown until categories, the scent profile and notes exist: the things a product is built from. */
function BeforeProducts() {
  const { data: status } = useGuideStatus();
  if (!status) return null;
  const items = [
    { key: 'categories', label: 'Categories', hint: 'where products are listed', to: '/admin/categories' },
    { key: 'scent', label: 'Scent profile', hint: 'family, accords and the other filters', to: '/admin/scent-profile' },
    { key: 'notes', label: 'Notes library', hint: 'ingredients for the note pyramid', to: '/admin/notes' },
  ] as const;
  if (items.every((i) => status[i.key].done)) return null;
  return (
    <div className="mb-5 bg-white border border-amber-200">
      <p className="px-4 py-2.5 border-b border-amber-200 bg-amber-50 text-[14px] text-amber-900">
        Before your first product, set these up. You can also create categories and notes while adding a product.
      </p>
      <ul className="divide-y divide-[#E9E7E2]">
        {items.map((i) => (
          <li key={i.key}>
            <Link to={i.to} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px] hover:bg-[#FAFAF8]">
              <span>
                <span className={status[i.key].done ? 'text-[#4F4F4F] line-through' : 'text-tk-ink'}>{i.label}</span>
                <span className="text-[#4F4F4F]"> · {i.hint}</span>
              </span>
              <span className="text-[13px] text-[#4A4A4A]">{status[i.key].done ? `✓ ${status[i.key].text}` : 'Set up →'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
