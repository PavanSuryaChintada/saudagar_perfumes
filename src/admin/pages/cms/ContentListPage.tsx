import { useState } from 'react';
import { columnToMobile, mobileToColumn } from '../../../cms/mobileMedia';
import { wantsPhoneVersion } from '../../cms/SchemaForm';
import { useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { SortableList } from '../../ui/SortableList';
import { Toggle } from '../../ui/Field';
import { MediaPreview } from '../../ui/MediaField';
import { rpc, throwIf } from '../../catalog/api';
import { SchemaForm } from '../../cms/SchemaForm';
import { CONTENT_TYPES, type ContentType } from '../../cms/contentTypes';
import { emptyItem } from '../../../cms/schema';

type Row = Record<string, any> & { id: string };

// Form values that are stored differently in the table.
function toForm(type: ContentType, row: Row): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row, ...columnToMobile(row) };
  delete out.mobile_media;
  if (type.table === 'stories') out.duration_ms = Math.round((row.duration_ms ?? 5000) / 1000);
  if (type.linksProducts) out.product_ids = (row.reel_products ?? []).sort((a: any, b: any) => a.position - b.position).map((p: any) => p.product_id);
  delete out.reel_products;
  return out;
}

function toRow(type: ContentType, form: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const f of type.fields) {
    if (f.key === 'product_ids') continue;
    let v = form[f.key];
    if (typeof v === 'string') v = v.trim() === '' ? null : v;
    if (f.key === 'duration_ms') v = Math.min(60, Math.max(1, Number(v) || 5)) * 1000;
    if (f.key === 'link' && v && typeof v === 'object' && !(v as { value?: string }).value) v = null;
    row[f.key] = v === undefined ? null : v;
  }
  // Only tables with pictures have a mobile_media column (stories, reels, testimonials, boutiques).
  const pictures = type.fields.filter((f) => wantsPhoneVersion(f, type.fields)).map((f) => f.key);
  if (pictures.length) row.mobile_media = mobileToColumn(form, pictures);
  return row;
}

export default function ContentListPage() {
  const { kind = '' } = useParams();
  const type = CONTENT_TYPES[kind];
  if (!type) return <p className="text-[14px] text-[#4A4A4A]">Unknown content list.</p>;
  return <ContentList key={kind} type={type} />;
}

function ContentList({ type }: { type: ContentType }) {
  const qc = useQueryClient();
  const select = type.linksProducts ? '*, reel_products(product_id, position)' : '*';
  const { data: rows = [], refetch } = useQuery({
    queryKey: ['admin', 'content', type.table],
    queryFn: async () => (await throwIf(supabase.from(type.table).select(select).order('position').order('created_at'))) as unknown as Row[],
  });
  const [draft, setDraft] = useState<{ id?: string; form: Record<string, unknown> } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const refresh = async () => {
    await refetch();
    await Promise.all(type.invalidates.map((queryKey) => qc.invalidateQueries({ queryKey })));
  };

  const save = async () => {
    if (!draft) return;
    const row = toRow(type, draft.form);
    const missing = type.fields.find((f) => (f.key === type.titleField || (type.table === 'testimonials' && f.key === 'quote') || (type.table === 'faqs' && f.key === 'answer')) && !row[f.key]);
    if (missing) return setError(`Fill in “${missing.label}”.`);
    setBusy(true);
    try {
      let id = draft.id;
      if (id) await throwIf(supabase.from(type.table).update(row as never).eq('id', id));
      else {
        const created = (await throwIf(supabase.from(type.table).insert({ ...row, position: rows.length } as never).select('id').single())) as { id: string };
        id = created.id;
      }
      if (type.linksProducts && id) {
        const ids = (draft.form.product_ids as string[] | undefined) ?? [];
        await throwIf(supabase.from('reel_products').delete().eq('reel_id', id));
        if (ids.length) await throwIf(supabase.from('reel_products').insert(ids.map((product_id, position) => ({ reel_id: id!, product_id, position }))));
      }
      setDraft(null);
      await refresh();
      toast.success(`${type.singular[0].toUpperCase()}${type.singular.slice(1)} saved.`);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const setActive = async (r: Row, on: boolean) => {
    try {
      await throwIf(supabase.from(type.table).update({ is_active: on } as never).eq('id', r.id));
      await refresh();
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title={type.label}
        description={type.description}
        actions={
          <Button onClick={() => { setError(''); setDraft({ form: { ...emptyItem(type.fields), is_active: true } }); }}>
            <Plus size={14} /> Add {type.singular}
          </Button>
        }
      />
      {rows.length === 0 ? (
        <p className="bg-white border border-[#E2E0DB] px-4 py-6 text-[14px] text-[#4A4A4A]">No {type.label.toLowerCase()} yet.</p>
      ) : (
        <SortableList
          items={rows}
          className="bg-white border border-[#E2E0DB] divide-y divide-[#E9E7E2]"
          onReorder={async (ids) => {
            try {
              await rpc('reorder_rows', { p_table: type.table, p_ids: ids });
              await refresh();
            } catch (err) {
              toast.error(toFriendlyError(err));
            }
          }}
          renderItem={(r) => (
            <div className="flex items-center gap-3 pr-2 py-2">
              {type.thumbField && (
                <div className="w-10 h-10 bg-[#F4F3EE] overflow-hidden shrink-0">{r[type.thumbField] && <MediaPreview url={r[type.thumbField]} />}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] truncate ${r.is_active ? '' : 'text-[#575757]'}`}>{String(r[type.titleField] ?? '')}</p>
                {type.subtitle?.(r) && <p className="text-[12px] text-[#4F4F4F] truncate">{type.subtitle(r)}</p>}
              </div>
              <Toggle checked={Boolean(r.is_active)} onChange={(on) => setActive(r, on)} label={`Show ${String(r[type.titleField] ?? '')}`} />
              <button type="button" aria-label={`Edit ${String(r[type.titleField] ?? '')}`} className="p-1.5 text-[#4A4A4A] hover:text-tk-ink" onClick={() => { setError(''); setDraft({ id: r.id, form: toForm(type, r) }); }}>
                <Pencil size={14} />
              </button>
              <button type="button" aria-label={`Delete ${String(r[type.titleField] ?? '')}`} className="p-1.5 text-[#4A4A4A] hover:text-rose-600" onClick={() => setDeleting(r)}>
                <Trash2 size={14} />
              </button>
            </div>
          )}
        />
      )}

      <Modal
        open={!!draft}
        onOpenChange={(o) => !o && !busy && setDraft(null)}
        title={draft?.id ? `Edit ${type.singular}` : `New ${type.singular}`}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)} disabled={busy}>Cancel</Button>
            <Button onClick={save} busy={busy}>Save</Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            {error && <p className="text-[13px] text-rose-600">{error}</p>}
            <SchemaForm fields={type.fields} value={draft.form} onChange={(form) => setDraft({ ...draft, form })} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete this ${type.singular}?`}
        description="This can't be undone. Switch it off instead to hide it and keep it."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await throwIf(supabase.from(type.table).delete().eq('id', deleting.id));
            await refresh();
            toast.success('Deleted.');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />
    </div>
  );
}
