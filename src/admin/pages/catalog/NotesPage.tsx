import { ListHead, RowAction, ShownPill } from '../../ui/ListHead';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { usePaged, spliceOrder } from '../../../lib/paging';
import { Pager } from '../../ui/Pager';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { useEditParam } from '../../ui/useEditParam';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextArea, TextInput, Toggle } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { MediaField } from '../../ui/MediaField';
import { SearchSelect } from '../../ui/SearchSelect';
import { SortableList } from '../../ui/SortableList';
import { slugify } from '../../catalog/productForm';
import { rpc, throwIf, useInvalidateCatalog, useNotes, useOptions, type NoteRow } from '../../catalog/api';

type Draft = { id?: string; name: string; slug: string; family_option_id: string; short_description: string; image_url: string; is_active: boolean };
const empty: Draft = { name: '', slug: '', family_option_id: '', short_description: '', image_url: '', is_active: true };

export default function NotesPage() {
  const { data: notes = [], refetch } = useNotes();
  const { data: options = [], refetch: refetchOptions } = useOptions();
  const navigate = useNavigate();
  const invalidate = useInvalidateCatalog();
  const families = options.filter((o) => o.kind === 'note_family');
  const familyName = useMemo(() => new Map(families.map((f) => [f.id, f.label])), [families]);
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<NoteRow | null>(null);
  useEditParam(notes, (n) => edit(n));

  const filtered = notes.filter(
    (n) => (!family || n.family_option_id === family) && (!search.trim() || n.name.toLowerCase().includes(search.trim().toLowerCase())),
  );
  const canReorder = !search.trim() && !family;
  const paged = usePaged(filtered, 25, `${search}|${family}`);

  const refresh = async () => {
    await refetch();
    await invalidate();
  };

  // Type a family that doesn't exist yet in the note's family picker to add it on the spot.
  const createFamily = async (label: string) => {
    const name = label.trim();
    const existing = families.find((f) => f.label.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;
    let slug = slugify(name) || 'family';
    const taken = new Set(families.map((f) => f.slug));
    for (let i = 2; taken.has(slug); i += 1) slug = `${slugify(name) || 'family'}-${i}`;
    const row = (await throwIf(
      supabase.from('attribute_options').insert({ kind: 'note_family', label: name, slug, position: families.length }).select('id').single(),
    )) as { id: string };
    await refetchOptions();
    await invalidate();
    toast.success(`Note family “${name}” added.`);
    return row.id;
  };

  const save = async () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) return setError('Enter the note name.');
    if (notes.some((n) => n.id !== draft.id && n.name.toLowerCase() === name.toLowerCase())) {
      return setError('A note with this name already exists.');
    }
    const row = {
      name,
      slug: draft.slug || slugify(name),
      family_option_id: draft.family_option_id || null,
      short_description: draft.short_description.trim() || null,
      image_url: draft.image_url || null,
      is_active: draft.is_active,
    };
    try {
      if (draft.id) await throwIf(supabase.from('notes').update(row).eq('id', draft.id));
      else await throwIf(supabase.from('notes').insert({ ...row, position: notes.length }));
      setDraft(null);
      await refresh();
      toast.success('Note saved.');
    } catch (err) {
      setError(toFriendlyError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Notes"
        description="The ingredient library. Notes build each product's pyramid, power the notes filter and get their own page at /notes/name."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/admin/scent-profile?kind=note_family')}>
              <Layers size={14} /> Note families
            </Button>
            <Button onClick={() => { setError(''); setDraft({ ...empty }); }}>
              <Plus size={14} /> Add note
            </Button>
          </>
        }
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <TextInput placeholder="Search notes" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-[280px]" aria-label="Search notes" />
        <select value={family} onChange={(e) => setFamily(e.target.value)} className="border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white sm:max-w-[240px]" aria-label="Filter by family">
          <option value="">All families</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
        <p className="text-[13px] text-[#4F4F4F] self-center">{filtered.length} notes{canReorder ? ' · drag to reorder' : ''}</p>
      </div>

      {paged.rows.length > 0 && (
        <ListHead className="border border-b-0 border-[#E2E0DB]">
          <span className={canReorder ? 'w-4' : 'w-0'} aria-hidden />
          <span className="w-8" aria-hidden />
          <span className="flex-1">Note{canReorder ? ' (drag ⋮⋮ to reorder)' : ''}</span>
          <span className="w-[160px]">Note family</span>
          <span className="w-[80px]">On the site</span>
          <span className="w-[150px] text-right pr-1">Actions</span>
        </ListHead>
      )}
      {canReorder ? (
        <SortableList
          items={paged.rows}
          className="bg-white border border-[#E2E0DB] divide-y divide-[#E9E7E2]"
          onReorder={async (ids) => {
            try {
              await rpc('reorder_rows', { p_table: 'notes', p_ids: spliceOrder(filtered.map((x) => x.id), paged.from - 1, ids) });
              await refresh();
            } catch (err) {
              toast.error(toFriendlyError(err));
            }
          }}
          renderItem={(n) => <NoteRowView n={n} family={familyName.get(n.family_option_id ?? '')} onEdit={() => edit(n)} onDelete={() => setDeleting(n)} />}
        />
      ) : (
        <div className="bg-white border border-[#E2E0DB] divide-y divide-[#E9E7E2]">
          {paged.rows.map((n) => (
            <div key={n.id} className="pl-3">
              <NoteRowView n={n} family={familyName.get(n.family_option_id ?? '')} onEdit={() => edit(n)} onDelete={() => setDeleting(n)} />
            </div>
          ))}
        </div>
      )}
      <Pager page={paged.page} pageCount={paged.pageCount} onPage={paged.setPage} from={paged.from} to={paged.to} total={paged.total} noun="notes" />

      <Modal
        open={!!draft}
        onOpenChange={(o) => !o && setDraft(null)}
        title={draft?.id ? 'Edit note' : 'New note'}
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
            <FieldShell label="Name" htmlFor="n-name">
              <TextInput id="n-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} />
            </FieldShell>
            <FieldShell label="Link (slug)" htmlFor="n-slug" help="The note page lives at /notes/slug.">
              <TextInput id="n-slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
            </FieldShell>
            <FieldShell label="Note family" htmlFor="n-fam" help="Search the families, or type a new one and choose “Add” to create it.">
              <SearchSelect
                id="n-fam"
                value={draft.family_option_id || null}
                onChange={(v) => setDraft({ ...draft, family_option_id: v ?? '' })}
                options={families.map((f) => ({ value: f.id, label: f.label, tag: f.is_active ? undefined : 'hidden' }))}
                onCreate={createFamily}
                createNoun="note family"
                placeholder="e.g. Oud & Agarwood"
                emptyText="No note families yet. Type one to add it."
                allowClear
              />
            </FieldShell>
            <FieldShell label="Short description" htmlFor="n-desc">
              <TextArea id="n-desc" rows={2} value={draft.short_description} onChange={(e) => setDraft({ ...draft, short_description: e.target.value })} />
            </FieldShell>
            <FieldShell label="Image">
              <MediaField value={draft.image_url} onChange={(url) => setDraft({ ...draft, image_url: url })} kind="image" label="Upload image" />
            </FieldShell>
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
        description="It is removed from every product pyramid that uses it. Switch it off instead to hide it but keep it on products."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await throwIf(supabase.from('notes').delete().eq('id', deleting.id));
            await refresh();
            toast.success('Note deleted.');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />
    </div>
  );

  function edit(n: NoteRow) {
    setError('');
    setDraft({
      id: n.id, name: n.name, slug: n.slug, family_option_id: n.family_option_id ?? '', short_description: n.short_description ?? '',
      image_url: n.image_url ?? '', is_active: n.is_active,
    });
  }
}

function NoteRowView({ n, family, onEdit, onDelete }: { n: NoteRow; family?: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 pr-2 py-2">
      <div className="w-8 h-8 rounded-full bg-[#F4F3EE] overflow-hidden shrink-0 flex items-center justify-center text-[12px] text-tk-accent">
        {n.image_url ? <img src={n.image_url} alt="" className="w-full h-full object-cover" /> : n.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-tk-ink truncate">{n.name}</p>
        <p className="text-[12px] text-[#4F4F4F] sm:hidden">{family ?? 'No family'}</p>
      </div>
      <span className="hidden sm:block w-[160px] text-[13px] text-[#3F3F3F] truncate">{family ?? 'No family'}</span>
      <span className="sm:w-[80px]"><ShownPill on={n.is_active} /></span>
      <span className="sm:w-[150px] flex justify-end">
        <RowAction icon={Pencil} label={`Edit ${n.name}`} onClick={onEdit}>Edit</RowAction>
        <RowAction icon={Trash2} label={`Delete ${n.name}`} danger onClick={onDelete}>Delete</RowAction>
      </span>
    </div>
  );
}
