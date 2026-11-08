import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Copy, Archive, ArchiveRestore, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { toFriendlyError } from '../../../lib/errors';
import { formatINR } from '../../../lib/money';
import { PageHeader } from '../../ui/PageHeader';
import { useGuideStatus } from '../../guide/useGuideStatus';
import { Button } from '../../ui/Button';
import { TextInput } from '../../ui/Field';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { rpc, useAdminProducts, useInvalidateCatalog, type ProductListRow } from '../../catalog/api';

type Status = 'all' | 'active' | 'draft' | 'archived';
const statusOf = (p: ProductListRow): Exclude<Status, 'all'> => (p.archived_at ? 'archived' : p.is_active ? 'active' : 'draft');
const STATUS_STYLE = { active: 'bg-emerald-50 text-emerald-700', draft: 'bg-amber-50 text-amber-700', archived: 'bg-[#F0F0F0] text-[#777777]' };

export default function ProductsPage() {
  const navigate = useNavigate();
  const invalidate = useInvalidateCatalog();
  const { data = [], isLoading, error } = useAdminProducts();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [confirm, setConfirm] = useState<{ kind: 'delete' | 'archive'; product: ProductListRow } | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((p) => (status === 'all' || statusOf(p) === status) && (!q || p.name.toLowerCase().includes(q) || p.slug.includes(q)));
  }, [data, search, status]);
  const counts = useMemo(() => {
    const c = { all: data.length, active: 0, draft: 0, archived: 0 };
    data.forEach((p) => (c[statusOf(p)] += 1));
    return c;
  }, [data]);

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
          <Button onClick={() => navigate('/admin/products/new')}>
            <Plus size={14} /> Add product
          </Button>
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
              className={`px-3 py-1.5 text-[12px] border ${status === s ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#D5D3CC] text-[#555555] hover:border-tk-ink'}`}
            >
              {s[0].toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          ))}
        </div>
        <TextInput placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-[280px]" aria-label="Search products" />
      </div>

      {isLoading && <p className="text-[13px] text-[#777777]">Loading…</p>}
      {error && <p className="text-[13px] text-rose-600">{toFriendlyError(error)}</p>}

      <div className="bg-white border border-[#EAEAEA] divide-y divide-[#F0F0F0]">
        {rows.map((p) => {
          const st = statusOf(p);
          const price = p.min_price !== null && p.max_price !== null && p.min_price !== p.max_price
            ? `${formatINR(p.min_price)} – ${formatINR(p.max_price)}`
            : formatINR(p.min_price ?? p.base_price);
          return (
            <div key={p.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 px-3 sm:px-4 py-3">
              <div className="w-12 h-12 bg-[#F4F3EE] shrink-0 overflow-hidden">
                {p.image && <img src={p.image} alt="" className="w-full h-full object-contain" loading="lazy" />}
              </div>
              <Link to={`/admin/products/${p.id}`} className="min-w-0 flex-1 basis-[180px] group">
                <p className="text-[13px] text-tk-ink group-hover:text-tk-accent truncate">{p.name}</p>
                <p className="text-[11px] text-[#888888] truncate">
                  /{p.slug}
                  {p.admin_note?.startsWith('SAMPLE') && <span className="ml-2 text-amber-700">· sample content</span>}
                </p>
              </Link>
              <span className={`px-2 py-0.5 text-[11px] ${STATUS_STYLE[st]}`}>{st}</span>
              <span className="w-[140px] text-[12px] text-[#555555] tabular-nums">{price}</span>
              <span className={`w-[80px] text-[12px] tabular-nums ${p.total_stock <= 5 ? 'text-rose-600' : 'text-[#555555]'}`}>{p.total_stock} in stock</span>
              <div className="flex gap-1 ml-auto">
                <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" className="p-2 text-[#777777] hover:text-tk-ink" title="View on site" aria-label="View on site">
                  <ExternalLink size={14} />
                </a>
                <button
                  type="button"
                  title="Duplicate"
                  aria-label="Duplicate"
                  className="p-2 text-[#777777] hover:text-tk-ink"
                  onClick={() =>
                    run(async () => {
                      const id = await rpc<string>('duplicate_product', { p_id: p.id });
                      navigate(`/admin/products/${id}`);
                    }, 'Copy created as a draft.')
                  }
                >
                  <Copy size={14} />
                </button>
                {p.archived_at ? (
                  <button
                    type="button"
                    title="Restore from archive"
                    aria-label="Restore from archive"
                    className="p-2 text-[#777777] hover:text-tk-ink"
                    onClick={() => run(() => rpc('archive_product', { p_id: p.id, p_archived: false }), 'Restored as a draft.')}
                  >
                    <ArchiveRestore size={14} />
                  </button>
                ) : (
                  <button type="button" title="Archive" aria-label="Archive" className="p-2 text-[#777777] hover:text-tk-ink" onClick={() => setConfirm({ kind: 'archive', product: p })}>
                    <Archive size={14} />
                  </button>
                )}
                <button
                  type="button"
                  title={p.units_sold > 0 ? 'Sold before: archive instead' : 'Delete'}
                  aria-label="Delete"
                  disabled={p.units_sold > 0}
                  className="p-2 text-[#777777] hover:text-rose-600 disabled:opacity-30"
                  onClick={() => setConfirm({ kind: 'delete', product: p })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {!isLoading && rows.length === 0 && (
          <p className="p-8 text-center text-[13px] text-[#777777]">
            {data.length === 0 ? 'No products yet. Press “Add product” to create the first one.' : 'No products match. Clear the search or pick another tab.'}
          </p>
        )}
      </div>

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
      <p className="px-4 py-2.5 border-b border-amber-200 bg-amber-50 text-[13px] text-amber-900">
        Before your first product, set these up. You can also create categories and notes while adding a product.
      </p>
      <ul className="divide-y divide-[#F0F0F0]">
        {items.map((i) => (
          <li key={i.key}>
            <Link to={i.to} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] hover:bg-[#FAFAF8]">
              <span>
                <span className={status[i.key].done ? 'text-[#888888] line-through' : 'text-tk-ink'}>{i.label}</span>
                <span className="text-[#888888]"> · {i.hint}</span>
              </span>
              <span className="text-[12px] text-[#777777]">{status[i.key].done ? `✓ ${status[i.key].text}` : 'Set up →'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
