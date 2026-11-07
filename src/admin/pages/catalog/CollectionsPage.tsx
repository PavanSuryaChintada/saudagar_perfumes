import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextArea, TextInput, Toggle } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { MediaField } from '../../ui/MediaField';
import { SortableList } from '../../ui/SortableList';
import { slugify } from '../../catalog/productForm';
import { rpc, throwIf, useAdminProducts, useCollectionsAdmin, useInvalidateCatalog, type CollectionRow } from '../../catalog/api';

const TEXT_KEYS = [
  'name', 'slug', 'short_name', 'headline', 'tagline', 'descriptor', 'notes_subtitle', 'image_url', 'hero_video_url', 'hero_poster_url',
  'hero_badge', 'hero_title', 'hero_tagline', 'hero_subtext', 'hero_accent_tag', 'seo_title', 'seo_description',
] as const;
type Draft = Record<(typeof TEXT_KEYS)[number], string> & { id?: string; aliases: string; is_active: boolean };

const toDraft = (c?: CollectionRow): Draft => {
  const d = Object.fromEntries(TEXT_KEYS.map((k) => [k, c ? String((c as unknown as Record<string, unknown>)[k] ?? '') : ''])) as unknown as Draft;
  return { ...d, id: c?.id, aliases: (c?.aliases ?? []).join(', '), is_active: c?.is_active ?? true };
};

function CollectionProducts({ collectionId }: { collectionId: string }) {
  const { data: all = [] } = useAdminProducts();
  const invalidate = useInvalidateCatalog();
  const [ids, setIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const byId = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);

  const load = async () => {
    const rows = await throwIf(supabase.from('product_collections').select('product_id, position').eq('collection_id', collectionId).order('position'));
    setIds((rows as { product_id: string }[]).map((r) => r.product_id));
  };
  useEffect(() => {
    load().catch((e) => toast.error(toFriendlyError(e)));
  }, [collectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await load();
      await invalidate();
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };
  const q = search.trim().toLowerCase();
  const candidates = q ? all.filter((p) => !ids.includes(p.id) && p.name.toLowerCase().includes(q)).slice(0, 6) : [];

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#555555] mb-1.5">Products in this collection · drag to set the order</p>
      <SortableList
        items={ids.map((id) => ({ id }))}
        className="divide-y divide-[#F0F0F0] border border-[#EAEAEA] mb-2"
        onReorder={(next) => run(() => rpc('reorder_collection_products', { p_collection: collectionId, p_product_ids: next }))}
        renderItem={({ id }) => (
          <div className="flex items-center gap-2 pr-2 py-1.5 text-[12.5px]">
            <span className="flex-1 truncate">{byId.get(id)?.name ?? '…'}</span>
            <button
              type="button"
              aria-label="Remove from collection"
              className="p-1 text-[#999999] hover:text-rose-600"
              onClick={() => run(() => throwIf(supabase.from('product_collections').delete().eq('collection_id', collectionId).eq('product_id', id)))}
            >
              <X size={13} />
            </button>
          </div>
        )}
      />
      {ids.length === 0 && <p className="text-[12px] text-[#888888] mb-2">No products yet.</p>}
      <div className="relative">
        <TextInput placeholder="Add a product…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Add product to collection" />
        {candidates.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#D5D3CC] shadow-md">
            {candidates.map((p) => (
              <button
                key={p.id}
                type="button"
                className="block w-full text-left px-3 py-1.5 text-[12.5px] hover:bg-[#F4F3EE]"
                onClick={() => {
                  setSearch('');
                  run(() => throwIf(supabase.from('product_collections').insert({ collection_id: collectionId, product_id: p.id, position: ids.length })));
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  const { data: rows = [], refetch } = useCollectionsAdmin();
  const invalidate = useInvalidateCatalog();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<CollectionRow | null>(null);

  const refresh = async () => {
    await refetch();
    await invalidate();
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) return setError('Enter a name.');
    const row: Record<string, unknown> = Object.fromEntries(TEXT_KEYS.map((k) => [k, draft[k].trim() || null]));
    row.name = draft.name.trim();
    row.slug = draft.slug || slugify(draft.name);
    row.aliases = draft.aliases.split(',').map((a) => slugify(a)).filter(Boolean);
    row.is_active = draft.is_active;
    try {
      if (draft.id) {
        await throwIf(supabase.from('collections').update(row as never).eq('id', draft.id));
        toast.success('Collection saved.');
        await refresh();
      } else {
        const created = await throwIf(supabase.from('collections').insert({ ...row, position: rows.length } as never).select().single());
        toast.success('Collection created. Now add products.');
        await refresh();
        setDraft(toDraft(created as CollectionRow));
        return;
      }
      setDraft(null);
    } catch (err) {
      setError(toFriendlyError(err));
    }
  };

  const field = (key: (typeof TEXT_KEYS)[number], label: string, help?: string, multiline = false) =>
    draft && (
      <FieldShell label={label} htmlFor={`col-${key}`} help={help}>
        {multiline ? (
          <TextArea id={`col-${key}`} rows={2} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
        ) : (
          <TextInput id={`col-${key}`} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
        )}
      </FieldShell>
    );

  return (
    <div>
      <PageHeader
        title="Collections"
        description="Curated groups with their own page at /collections/slug. Collections with a hero film appear in the collection switcher."
        actions={
          <Button onClick={() => { setError(''); setDraft(toDraft()); }}>
            <Plus size={14} /> Add collection
          </Button>
        }
      />
      <SortableList
        items={rows}
        className="bg-white border border-[#EAEAEA] divide-y divide-[#F0F0F0]"
        onReorder={async (ids) => {
          try {
            await rpc('reorder_rows', { p_table: 'collections', p_ids: ids });
            await refresh();
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
        renderItem={(c) => (
          <div className="flex items-center gap-3 pr-2 py-2">
            <div className="w-10 h-10 bg-[#F4F3EE] overflow-hidden shrink-0">{c.image_url && <img src={c.image_url} alt="" className="w-full h-full object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <p className={`text-[13px] ${c.is_active ? '' : 'text-[#999999] line-through'}`}>{c.name}</p>
              <p className="text-[11px] text-[#888888] truncate">
                /collections/{c.slug}
                {c.aliases.length > 0 && ` · old links: ${c.aliases.join(', ')}`}
              </p>
            </div>
            <a href={`/collections/${c.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-[#777777] hover:text-[#111111]" aria-label="View on site">
              <ExternalLink size={14} />
            </a>
            <button type="button" aria-label={`Edit ${c.name}`} className="p-1.5 text-[#777777] hover:text-[#111111]" onClick={() => { setError(''); setDraft(toDraft(c)); }}>
              <Pencil size={14} />
            </button>
            <button type="button" aria-label={`Delete ${c.name}`} className="p-1.5 text-[#777777] hover:text-rose-600" onClick={() => setDeleting(c)}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      <Modal
        open={!!draft}
        onOpenChange={(o) => !o && setDraft(null)}
        title={draft?.id ? `Edit ${draft.name}` : 'New collection'}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>Close</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {error && <p className="text-[12px] text-rose-600">{error}</p>}
              <FieldShell label="Name" htmlFor="col-name">
                <TextInput id="col-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} />
              </FieldShell>
              <FieldShell label="Link (slug)" htmlFor="col-slug">
                <TextInput id="col-slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
              </FieldShell>
              <FieldShell label="Old links" htmlFor="col-aliases" help="Other slugs that should open this collection, comma separated.">
                <TextInput id="col-aliases" value={draft.aliases} onChange={(e) => setDraft({ ...draft, aliases: e.target.value })} />
              </FieldShell>
              {field('short_name', 'Short name')}
              {field('headline', 'Headline')}
              {field('tagline', 'Tagline')}
              {field('descriptor', 'Description', undefined, true)}
              {field('notes_subtitle', 'Notes line', 'e.g. Taif rose · wild Assam oud · saffron')}
              <FieldShell label="Card image">
                <MediaField value={draft.image_url} onChange={(url) => setDraft({ ...draft, image_url: url })} kind="image" label="Upload image" />
              </FieldShell>
              <label className="flex items-center gap-2 text-[13px]">
                <Toggle checked={draft.is_active} onChange={(on) => setDraft({ ...draft, is_active: on })} label="Active" /> Active
              </label>
            </div>
            <div className="space-y-4">
              <p className="text-[12px] text-[#777777]">Hero film (leave the video and poster empty for a simple page header)</p>
              <FieldShell label="Hero video">
                <MediaField value={draft.hero_video_url} onChange={(url) => setDraft({ ...draft, hero_video_url: url })} kind="video" label="Upload video" />
              </FieldShell>
              <FieldShell label="Hero poster image">
                <MediaField value={draft.hero_poster_url} onChange={(url) => setDraft({ ...draft, hero_poster_url: url })} kind="image" label="Upload image" />
              </FieldShell>
              {field('hero_title', 'Hero title')}
              {field('hero_tagline', 'Hero tagline')}
              {field('hero_badge', 'Hero badge')}
              {field('hero_subtext', 'Hero text', undefined, true)}
              {field('hero_accent_tag', 'Hero accent tag')}
              {field('seo_title', 'SEO title')}
              {field('seo_description', 'SEO description', undefined, true)}
              {draft.id ? <CollectionProducts collectionId={draft.id} /> : <p className="text-[12px] text-[#888888]">Save the collection to add products.</p>}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="The collection page disappears. Its products stay in the store."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await throwIf(supabase.from('collections').delete().eq('id', deleting.id));
            await refresh();
            toast.success('Collection deleted.');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />
    </div>
  );
}
