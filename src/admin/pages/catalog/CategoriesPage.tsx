import { ListHead, RowAction, ShownPill } from '../../ui/ListHead';
import { SearchListing } from '../../ui/SearchListing';
import { suggestListing } from '../../../lib/searchListing';
import { useBlock } from '../../../cms/useSite';
import { useMemo, useState } from 'react';
import { usePaged } from '../../../lib/paging';
import { Pager } from '../../ui/Pager';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { useEditParam } from '../../ui/useEditParam';
import { SearchSelect, categoryOptions } from '../../ui/SearchSelect';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextArea, TextInput, Toggle } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { MediaField } from '../../ui/MediaField';
import { slugify } from '../../catalog/productForm';
import { rpc, throwIf, useCategories, useInvalidateCatalog, type CategoryRow } from '../../catalog/api';

type Draft = {
  id?: string; name: string; slug: string; parent_id: string; description: string; image_url: string; video_url: string; mobile: Record<string, string>;
  is_active: boolean; seo_title: string; seo_description: string;
};
const empty: Draft = { name: '', slug: '', parent_id: '', description: '', image_url: '', video_url: '', mobile: {}, is_active: true, seo_title: '', seo_description: '' };

/** Flattens the tree into display order with depth. */
export function flattenTree(rows: CategoryRow[]): { row: CategoryRow; depth: number }[] {
  const byParent = new Map<string | null, CategoryRow[]>();
  for (const r of rows) {
    const k = r.parent_id ?? null;
    byParent.set(k, [...(byParent.get(k) ?? []), r]);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  const out: { row: CategoryRow; depth: number }[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const r of byParent.get(parent) ?? []) {
      out.push({ row: r, depth });
      walk(r.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export default function CategoriesPage() {
  const { data: rows = [], refetch } = useCategories();
  const brandName = useBlock<Record<string, string>>('brand')?.name || 'Saudagar Perfumers';
  const invalidate = useInvalidateCatalog();
  const tree = useMemo(() => flattenTree(rows), [rows]);
  const paged = usePaged(tree, 25);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const edit = (row: CategoryRow) => {
    setError('');
    setDraft({
      id: row.id, name: row.name, slug: row.slug, parent_id: row.parent_id ?? '', description: row.description ?? '',
      image_url: row.image_url ?? '', video_url: row.video_url ?? '', mobile: { ...((row as { mobile_media?: Record<string, string> }).mobile_media ?? {}) },
      is_active: row.is_active, seo_title: row.seo_title ?? '',
      seo_description: row.seo_description ?? '',
    });
  };
  useEditParam(rows, edit);

  const refresh = async () => {
    await refetch();
    await invalidate();
  };

  const move = async (row: CategoryRow, dir: -1 | 1) => {
    const siblings = rows.filter((r) => (r.parent_id ?? null) === (row.parent_id ?? null)).sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    const i = siblings.findIndex((s) => s.id === row.id);
    const j = i + dir;
    if (j < 0 || j >= siblings.length) return;
    const ids = siblings.map((s) => s.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try {
      await rpc('reorder_rows', { p_table: 'categories', p_ids: ids });
      await refresh();
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) return setError('Enter a name.');
    const row = {
      name: draft.name.trim(),
      slug: draft.slug || slugify(draft.name),
      parent_id: draft.parent_id || null,
      description: draft.description.trim() || null,
      image_url: draft.image_url || null,
      video_url: draft.video_url || null,
      mobile_media: Object.fromEntries(Object.entries(draft.mobile).filter(([, v]) => v)),
      is_active: draft.is_active,
      seo_title: draft.seo_title.trim() || null,
      seo_description: draft.seo_description.trim() || null,
    };
    try {
      if (draft.id) await throwIf(supabase.from('categories').update(row).eq('id', draft.id));
      else await throwIf(supabase.from('categories').insert({ ...row, position: rows.length }));
      setDraft(null);
      await refresh();
      toast.success('Category saved.');
    } catch (err) {
      setError(toFriendlyError(err));
    }
  };

  // A category can't move under itself or its own children.
  const descendants = (id: string): Set<string> => {
    const out = new Set<string>([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const r of rows) if (r.parent_id && out.has(r.parent_id) && !out.has(r.id)) { out.add(r.id); grew = true; }
    }
    return out;
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="The category tree. Products have one main category and can be in others too. Each category has a page at /categories/slug."
        actions={
          <Button onClick={() => { setError(''); setDraft({ ...empty }); }}>
            <Plus size={14} /> Add category
          </Button>
        }
      />
      <div className="bg-white border border-[#E2E0DB] divide-y divide-[#E9E7E2]">
        {paged.rows.length > 0 && (
          <ListHead className="!px-3">
            <span className="flex-1">Category (sub-categories are indented)</span>
            <span className="w-[80px]">On the site</span>
            <span className="w-[76px]">Order</span>
            <span className="w-[150px] text-right pr-1">Actions</span>
          </ListHead>
        )}
        {paged.rows.map(({ row, depth }) => (
          <div key={row.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 py-2 hover:bg-[#FAF8F4]" style={{ paddingLeft: 12 + depth * 22 }}>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-tk-ink">{depth > 0 && <span className="text-[#8A8A8A] mr-1">↳</span>}{row.name}</p>
              <p className="text-[12px] text-[#4F4F4F]">/categories/{row.slug}</p>
            </div>
            <span className="sm:w-[80px]"><ShownPill on={row.is_active} /></span>
            <span className="sm:w-[76px] flex">
              <button type="button" aria-label="Move up" title="Move up" className="p-1.5 border border-transparent text-[#4A4A4A] hover:text-tk-ink hover:border-[#C4C1B9]" onClick={() => move(row, -1)}><ArrowUp size={14} /></button>
              <button type="button" aria-label="Move down" title="Move down" className="p-1.5 border border-transparent text-[#4A4A4A] hover:text-tk-ink hover:border-[#C4C1B9]" onClick={() => move(row, 1)}><ArrowDown size={14} /></button>
            </span>
            <span className="sm:w-[150px] flex justify-end">
              <RowAction icon={Pencil} label={`Edit ${row.name}`} onClick={() => edit(row)}>Edit</RowAction>
              <RowAction icon={Trash2} label={`Delete ${row.name}`} danger onClick={() => setDeleting(row)}>Delete</RowAction>
            </span>
          </div>
        ))}
        {tree.length === 0 && <p className="p-8 text-center text-[14px] text-[#4A4A4A]">No categories yet.</p>}
      </div>
      <Pager page={paged.page} pageCount={paged.pageCount} onPage={paged.setPage} from={paged.from} to={paged.to} total={paged.total} noun="categories" />

      <Modal
        open={!!draft}
        onOpenChange={(o) => !o && setDraft(null)}
        title={draft?.id ? 'Edit category' : 'New category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            {error && <p className="text-[13px] text-rose-600">{error}</p>}
            <FieldShell label="Name" htmlFor="c-name">
              <TextInput id="c-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} />
            </FieldShell>
            <FieldShell label="Link (slug)" htmlFor="c-slug">
              <TextInput id="c-slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
            </FieldShell>
            <FieldShell label="Inside" htmlFor="c-parent" help="Leave empty for a top-level category.">
              <SearchSelect
                id="c-parent"
                options={categoryOptions(rows.filter((r) => !draft.id || !descendants(draft.id).has(r.id)))}
                value={draft.parent_id || null}
                onChange={(v) => setDraft({ ...draft, parent_id: v ?? '' })}
                allowClear
                placeholder="Top level (no parent). Search to choose one"
              />
            </FieldShell>
            <FieldShell label="Description" htmlFor="c-desc">
              <TextArea id="c-desc" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </FieldShell>
            <FieldShell label="Top picture of the category page" help="Shown full width at the top of this category’s page, with its name over it. Use a wide photo, e.g. 2400 × 1000. Without one, the page starts with a plain heading.">
              <MediaField value={draft.image_url} onChange={(url) => setDraft({ ...draft, image_url: url })} kind="image" label="Upload picture" />
            </FieldShell>
            <FieldShell label="Top picture on phones (optional)" help="A taller photo for phones, e.g. 1080 × 1350. Leave empty to use the picture above on phones too.">
              <MediaField value={draft.mobile.image_url ?? ''} onChange={(url) => setDraft({ ...draft, mobile: { ...draft.mobile, image_url: url } })} kind="image" label="Upload phone picture" />
            </FieldShell>
            <FieldShell label="Top film (optional)" help="Plays at the top instead of the picture. Keep it short and silent; the picture shows while it loads.">
              <MediaField value={draft.video_url} onChange={(url) => setDraft({ ...draft, video_url: url })} kind="video" label="Upload film" />
            </FieldShell>
            <div className="pt-2 border-t border-[#E9E5DC]">
              <p className="text-[14px] font-semibold text-tk-ink mb-2">How it shows on Google</p>
              <SearchListing
                path={`/categories/${draft.slug || 'new'}`}
                value={{ title: draft.seo_title, description: draft.seo_description }}
                onChange={(v) => setDraft({ ...draft, seo_title: v.title, seo_description: v.description })}
                suggestion={suggestListing({ kind: 'category', name: draft.name || 'New category', body: draft.description, siteName: brandName })}
              />
            </div>
            <label className="flex items-center gap-2 text-[14px]">
              <Toggle checked={draft.is_active} onChange={(on) => setDraft({ ...draft, is_active: on })} label="Active" /> Active
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="Products keep existing but lose this category. A category that still has sub-categories can't be deleted: move or delete those first."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await throwIf(supabase.from('categories').delete().eq('id', deleting.id));
            await refresh();
            toast.success('Category deleted.');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />
    </div>
  );
}
