import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextArea, TextInput, Toggle } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { MediaField } from '../../ui/MediaField';
import { slugify } from '../../catalog/productForm';
import { rpc, throwIf, useCategories, useInvalidateCatalog, type CategoryRow } from '../../catalog/api';

type Draft = {
  id?: string; name: string; slug: string; parent_id: string; description: string; image_url: string; video_url: string;
  is_active: boolean; seo_title: string; seo_description: string;
};
const empty: Draft = { name: '', slug: '', parent_id: '', description: '', image_url: '', video_url: '', is_active: true, seo_title: '', seo_description: '' };

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
  const invalidate = useInvalidateCatalog();
  const tree = useMemo(() => flattenTree(rows), [rows]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);

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
      <div className="bg-white border border-[#EAEAEA] divide-y divide-[#F0F0F0]">
        {tree.map(({ row, depth }) => (
          <div key={row.id} className="flex items-center gap-2 px-3 py-2" style={{ paddingLeft: 12 + depth * 22 }}>
            <div className="min-w-0 flex-1">
              <p className={`text-[13px] ${row.is_active ? '' : 'text-[#999999] line-through'}`}>{row.name}</p>
              <p className="text-[11px] text-[#888888]">/categories/{row.slug}</p>
            </div>
            <button type="button" aria-label="Move up" className="p-1.5 text-[#777777] hover:text-tk-ink" onClick={() => move(row, -1)}><ArrowUp size={14} /></button>
            <button type="button" aria-label="Move down" className="p-1.5 text-[#777777] hover:text-tk-ink" onClick={() => move(row, 1)}><ArrowDown size={14} /></button>
            <button
              type="button"
              aria-label={`Edit ${row.name}`}
              className="p-1.5 text-[#777777] hover:text-tk-ink"
              onClick={() => {
                setError('');
                setDraft({
                  id: row.id, name: row.name, slug: row.slug, parent_id: row.parent_id ?? '', description: row.description ?? '',
                  image_url: row.image_url ?? '', video_url: row.video_url ?? '', is_active: row.is_active, seo_title: row.seo_title ?? '',
                  seo_description: row.seo_description ?? '',
                });
              }}
            >
              <Pencil size={14} />
            </button>
            <button type="button" aria-label={`Delete ${row.name}`} className="p-1.5 text-[#777777] hover:text-rose-600" onClick={() => setDeleting(row)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {tree.length === 0 && <p className="p-8 text-center text-[13px] text-[#777777]">No categories yet.</p>}
      </div>

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
            {error && <p className="text-[12px] text-rose-600">{error}</p>}
            <FieldShell label="Name" htmlFor="c-name">
              <TextInput id="c-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} />
            </FieldShell>
            <FieldShell label="Link (slug)" htmlFor="c-slug">
              <TextInput id="c-slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
            </FieldShell>
            <FieldShell label="Inside" htmlFor="c-parent" help="Leave empty for a top-level category.">
              <select id="c-parent" value={draft.parent_id} onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })} className="w-full border border-[#D5D3CC] px-2 py-2 text-[13px] bg-white">
                <option value="">Top level</option>
                {tree
                  .filter(({ row }) => !draft.id || !descendants(draft.id).has(row.id))
                  .map(({ row, depth }) => (
                    <option key={row.id} value={row.id}>{`${'— '.repeat(depth)}${row.name}`}</option>
                  ))}
              </select>
            </FieldShell>
            <FieldShell label="Description" htmlFor="c-desc">
              <TextArea id="c-desc" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </FieldShell>
            <FieldShell label="Image">
              <MediaField value={draft.image_url} onChange={(url) => setDraft({ ...draft, image_url: url })} kind="image" label="Upload image" />
            </FieldShell>
            <FieldShell label="Video (optional)">
              <MediaField value={draft.video_url} onChange={(url) => setDraft({ ...draft, video_url: url })} kind="video" label="Upload video" />
            </FieldShell>
            <FieldShell label="SEO title" htmlFor="c-seot">
              <TextInput id="c-seot" value={draft.seo_title} onChange={(e) => setDraft({ ...draft, seo_title: e.target.value })} />
            </FieldShell>
            <FieldShell label="SEO description" htmlFor="c-seod">
              <TextArea id="c-seod" rows={2} value={draft.seo_description} onChange={(e) => setDraft({ ...draft, seo_description: e.target.value })} />
            </FieldShell>
            <label className="flex items-center gap-2 text-[13px]">
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
            const msg = toFriendlyError(err);
            toast.error(/foreign key|violates/i.test(msg) ? 'Move or delete its sub-categories first.' : msg);
          }
        }}
      />
    </div>
  );
}
