import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { usePaged, spliceOrder } from '../../../lib/paging';
import { Pager } from '../../ui/Pager';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { useEditParam } from '../../ui/useEditParam';
import { PageHeader, Panel } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextArea, TextInput, Toggle } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { SortableList } from '../../ui/SortableList';
import { slugify } from '../../catalog/productForm';
import { OPTION_KINDS, rpc, throwIf, useInvalidateCatalog, useOptions, type OptionRow } from '../../catalog/api';

type Draft = { id?: string; kind: string; label: string; slug: string; description: string; badge: string; is_active: boolean };

export default function ScentProfilePage() {
  const { data: options = [], refetch } = useOptions();
  const invalidate = useInvalidateCatalog();
  // ?kind=note_family (from the Notes page) opens that tab.
  const [params] = useSearchParams();
  const [kind, setKind] = useState(() => OPTION_KINDS.find((k) => k.kind === params.get('kind'))?.kind ?? OPTION_KINDS[0].kind);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<OptionRow | null>(null);
  useEditParam(options, (o) => {
    setKind(o.kind);
    setError('');
    setDraft({ id: o.id, kind: o.kind, label: o.label, slug: o.slug, description: o.description ?? '', badge: o.badge ?? '', is_active: o.is_active });
  });
  const meta = OPTION_KINDS.find((k) => k.kind === kind)!;
  const list = options.filter((o) => o.kind === kind);
  const paged = usePaged(list, 25, kind);

  const refresh = async () => {
    await refetch();
    await invalidate();
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.label.trim()) return setError('Enter a label.');
    const row = {
      kind: draft.kind,
      label: draft.label.trim(),
      slug: draft.slug || slugify(draft.label),
      description: draft.description.trim() || null,
      badge: draft.badge.trim() || null,
      is_active: draft.is_active,
    };
    try {
      if (draft.id) await throwIf(supabase.from('attribute_options').update(row).eq('id', draft.id));
      else await throwIf(supabase.from('attribute_options').insert({ ...row, position: list.length }));
      setDraft(null);
      await refresh();
      toast.success('Saved.');
    } catch (err) {
      setError(toFriendlyError(err).includes('already exists') ? 'An option with this name already exists here.' : toFriendlyError(err));
    }
  };

  const remove = async (o: OptionRow) => {
    try {
      await throwIf(supabase.from('attribute_options').delete().eq('id', o.id));
      await refresh();
      toast.success('Option deleted.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  return (
    <div>
      <PageHeader title="Scent profile" description="The options used to describe fragrances. Each one appears on product pages and as a shop filter." />
      <div className="flex flex-wrap gap-1.5 mb-4">
        {OPTION_KINDS.map((k) => (
          <button
            key={k.kind}
            type="button"
            onClick={() => setKind(k.kind)}
            className={`px-3 py-1.5 text-[13px] border ${kind === k.kind ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#C4C1B9] text-[#454545] hover:border-tk-ink'}`}
          >
            {k.label}
          </button>
        ))}
      </div>
      <Panel title={meta.label} description={meta.help || 'Drag to reorder.'}>
        <SortableList
          items={paged.rows}
          onReorder={async (ids) => {
            try {
              await rpc('reorder_rows', { p_table: 'attribute_options', p_ids: spliceOrder(list.map((x) => x.id), paged.from - 1, ids) });
              await refresh();
            } catch (err) {
              toast.error(toFriendlyError(err));
            }
          }}
          className="divide-y divide-[#E9E7E2] border border-[#E2E0DB] mb-3"
          renderItem={(o) => (
            <div className="flex items-center gap-3 pr-2 py-2">
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] ${o.is_active ? 'text-tk-ink' : 'text-[#575757] line-through'}`}>
                  {o.label} {o.badge && <span className="ml-1 text-[12px] px-1.5 py-0.5 bg-[#F4F3EE] text-[#4A4A4A]">{o.badge}</span>}
                </p>
                {o.description && <p className="text-[12px] text-[#4F4F4F] truncate">{o.description}</p>}
              </div>
              <button type="button" aria-label={`Edit ${o.label}`} className="p-1.5 text-[#4A4A4A] hover:text-tk-ink" onClick={() => { setError(''); setDraft({ id: o.id, kind: o.kind, label: o.label, slug: o.slug, description: o.description ?? '', badge: o.badge ?? '', is_active: o.is_active }); }}>
                <Pencil size={14} />
              </button>
              <button type="button" aria-label={`Delete ${o.label}`} className="p-1.5 text-[#4A4A4A] hover:text-rose-600" onClick={() => setDeleting(o)}>
                <Trash2 size={14} />
              </button>
            </div>
          )}
        />
        <Pager page={paged.page} pageCount={paged.pageCount} onPage={paged.setPage} from={paged.from} to={paged.to} total={paged.total} noun="options" />
        {list.length === 0 && <p className="text-[13px] text-[#4F4F4F] mb-3">No options yet.</p>}
        <Button size="sm" variant="secondary" onClick={() => { setError(''); setDraft({ kind, label: '', slug: '', description: '', badge: '', is_active: true }); }}>
          <Plus size={12} /> Add option
        </Button>
      </Panel>

      <Modal
        open={!!draft}
        onOpenChange={(o) => !o && setDraft(null)}
        title={draft?.id ? 'Edit option' : `New ${meta.label.toLowerCase()} option`}
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
            <FieldShell label="Label" htmlFor="o-label">
              <TextInput id="o-label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} />
            </FieldShell>
            <FieldShell label="Link name (slug)" htmlFor="o-slug" help="Used in shop filter links. Changing it breaks saved filter links.">
              <TextInput id="o-slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
            </FieldShell>
            <FieldShell label="Description (optional)" htmlFor="o-desc">
              <TextArea id="o-desc" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </FieldShell>
            <FieldShell label="Badge (optional)" htmlFor="o-badge" help="Short tag shown next to the filter option, e.g. 38–46%.">
              <TextInput id="o-badge" value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
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
        title={`Delete “${deleting?.label}”?`}
        description="It is removed from every product that uses it. To keep it on old products but hide it, switch it off instead."
        confirmLabel="Delete"
        danger
        onConfirm={() => (deleting ? remove(deleting) : undefined)}
      />
    </div>
  );
}
