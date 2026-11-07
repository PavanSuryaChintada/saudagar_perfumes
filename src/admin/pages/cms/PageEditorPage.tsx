import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { PageHeader, Panel } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { SortableList } from '../../ui/SortableList';
import { FieldShell, TextArea, TextInput, Toggle } from '../../ui/Field';
import { MediaField } from '../../ui/MediaField';
import { RichText } from '../../ui/RichText';
import { rpc, throwIf } from '../../catalog/api';
import { slugify } from '../../catalog/productForm';
import { SchemaForm } from '../../cms/SchemaForm';
import { SECTION_TYPES } from '../../../cms/registry';
import { emptyItem } from '../../../cms/schema';
import { pageHref, type PageRow } from './PagesPage';

interface SectionRow {
  id: string;
  page_id: string;
  section_type: string;
  label: string | null;
  position: number;
  is_visible: boolean;
  config: Record<string, unknown>;
}

export default function PageEditorPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const pageQuery = useQuery({
    queryKey: ['admin', 'page', id],
    queryFn: async () => (await throwIf(supabase.from('pages').select('*').eq('id', id).maybeSingle())) as PageRow | null,
  });
  const sectionsQuery = useQuery({
    queryKey: ['admin', 'page', id, 'sections'],
    queryFn: async () => (await throwIf(supabase.from('website_sections').select('*').eq('page_id', id).order('position'))) as SectionRow[],
  });
  const page = pageQuery.data;
  const sections = sectionsQuery.data ?? [];

  const [form, setForm] = useState<PageRow | null>(null);
  const [savingPage, setSavingPage] = useState(false);
  const [pageError, setPageError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<SectionRow | null>(null);
  const [savingSection, setSavingSection] = useState(false);
  const [removing, setRemoving] = useState<SectionRow | null>(null);
  const [deletingPage, setDeletingPage] = useState(false);

  useEffect(() => {
    if (page) setForm(page);
  }, [page]);

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['admin', 'page', id] }),
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] }),
      qc.invalidateQueries({ queryKey: ['cms', 'page'] }),
      qc.invalidateQueries({ queryKey: ['admin', 'lookup', 'pages'] }),
    ]);
  };

  if (pageQuery.isLoading) return <p className="text-[13px] text-[#777777]">Loading…</p>;
  if (!page || !form) return <p className="text-[13px] text-[#777777]">This page doesn't exist. <Link to="/admin/pages" className="underline">Back to pages</Link></p>;

  const savePage = async () => {
    const title = form.title.trim();
    const slug = slugify(form.slug);
    if (!title) return setPageError('Enter a page title.');
    if (!slug) return setPageError('Enter a link for the page.');
    setPageError('');
    setSavingPage(true);
    try {
      await throwIf(
        supabase
          .from('pages')
          .update({
            title,
            slug,
            is_published: form.is_published,
            body: form.layout === 'rich_text' ? form.body ?? '' : form.body,
            seo_title: form.seo_title?.trim() || null,
            seo_description: form.seo_description?.trim() || null,
            og_image: form.og_image || null,
          })
          .eq('id', page.id),
      );
      await invalidate();
      toast.success('Page saved.');
    } catch (err) {
      setPageError(toFriendlyError(err));
    } finally {
      setSavingPage(false);
    }
  };

  const addSection = async (type: string) => {
    try {
      const def = SECTION_TYPES[type];
      const row = (await throwIf(
        supabase
          .from('website_sections')
          .insert({ page_id: page.id, section_type: type, label: def.label, position: sections.length, is_visible: true, config: emptyItem(def.fields) as never })
          .select('*')
          .single(),
      )) as SectionRow;
      setAdding(false);
      await invalidate();
      setEditing(row);
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  const saveSection = async () => {
    if (!editing) return;
    setSavingSection(true);
    try {
      await throwIf(
        supabase
          .from('website_sections')
          .update({ label: editing.label?.trim() || null, config: editing.config as never, is_visible: editing.is_visible })
          .eq('id', editing.id),
      );
      setEditing(null);
      await invalidate();
      toast.success('Section saved.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setSavingSection(false);
    }
  };

  const setVisible = async (s: SectionRow, on: boolean) => {
    try {
      await throwIf(supabase.from('website_sections').update({ is_visible: on }).eq('id', s.id));
      await invalidate();
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  const dirtyPage = JSON.stringify(form) !== JSON.stringify(page);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/pages" className="inline-flex items-center gap-1 text-[12px] text-[#777777] hover:text-tk-ink mb-3">
          <ArrowLeft size={13} /> Pages
        </Link>
        <PageHeader
          title={page.title}
          description={`${pageHref(page.slug)} · ${page.layout === 'sections' ? 'Section page' : 'Text page'}${page.is_system ? ' · Built-in' : ''}`}
          actions={
            <>
              <a href={pageHref(page.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 text-[12px] border border-[#D5D3CC] bg-white hover:border-tk-ink">
                <ExternalLink size={14} /> View on site
              </a>
              {!page.is_system && (
                <Button variant="ghost" onClick={() => setDeletingPage(true)}>
                  <Trash2 size={14} /> Delete page
                </Button>
              )}
            </>
          }
        />
      </div>

      {page.layout === 'sections' && (
        <Panel title="Sections" description="Drag to reorder. Hidden sections stay here but don't show on the site.">
          {sections.length === 0 ? (
            <p className="text-[13px] text-[#777777] mb-3">No sections yet.</p>
          ) : (
            <SortableList
              items={sections}
              className="border border-[#EAEAEA] divide-y divide-[#F0F0F0] mb-3"
              onReorder={async (ids) => {
                try {
                  await rpc('reorder_rows', { p_table: 'website_sections', p_ids: ids });
                  await invalidate();
                } catch (err) {
                  toast.error(toFriendlyError(err));
                }
              }}
              renderItem={(s) => {
                const def = SECTION_TYPES[s.section_type];
                const name = s.label || def?.label || s.section_type;
                return (
                  <div className="flex items-center gap-2 pr-2 py-2">
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditing(s)}>
                      <p className={`text-[13px] truncate ${s.is_visible ? 'text-tk-ink' : 'text-[#999999]'}`}>{name}</p>
                      <p className="text-[11px] text-[#888888] truncate">{def ? def.label : `Unknown type “${s.section_type}”`}{s.is_visible ? '' : ' · Hidden'}</p>
                    </button>
                    <button type="button" aria-label={s.is_visible ? `Hide ${name}` : `Show ${name}`} className="p-1.5 text-[#777777] hover:text-tk-ink" onClick={() => setVisible(s, !s.is_visible)}>
                      {s.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button type="button" aria-label={`Edit ${name}`} className="p-1.5 text-[#777777] hover:text-tk-ink" onClick={() => setEditing(s)}>
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Duplicate ${name}`}
                      className="p-1.5 text-[#777777] hover:text-tk-ink"
                      onClick={async () => {
                        try {
                          await rpc('duplicate_section', { p_id: s.id });
                          await invalidate();
                          toast.success('Section duplicated.');
                        } catch (err) {
                          toast.error(toFriendlyError(err));
                        }
                      }}
                    >
                      <Copy size={14} />
                    </button>
                    <button type="button" aria-label={`Delete ${name}`} className="p-1.5 text-[#777777] hover:text-rose-600" onClick={() => setRemoving(s)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              }}
            />
          )}
          <Button variant="secondary" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add section
          </Button>
        </Panel>
      )}

      <Panel title="Page settings">
        <div className="space-y-4">
          {pageError && <p className="text-[12px] text-rose-600">{pageError}</p>}
          <FieldShell label="Title" htmlFor="pe-title">
            <TextInput id="pe-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </FieldShell>
          <FieldShell label="Link" htmlFor="pe-slug" help={page.is_system ? "Built-in pages keep their link." : 'Changing it breaks old links to this page.'}>
            <TextInput id="pe-slug" value={form.slug} disabled={page.is_system} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          </FieldShell>
          {!page.is_system && (
            <label className="flex items-center gap-2 text-[13px]">
              <Toggle checked={form.is_published} onChange={(on) => setForm({ ...form, is_published: on })} label="Published" /> Published
              <span className="text-[11px] text-[#888888]">— drafts are only visible to admins.</span>
            </label>
          )}
          {page.layout === 'rich_text' && (
            <FieldShell label="Page text">
              <RichText value={form.body ?? ''} onChange={(html) => setForm({ ...form, body: html })} minHeight={320} />
            </FieldShell>
          )}
          <FieldShell label="Search title" htmlFor="pe-seo-title" help="Leave empty to use the page title.">
            <TextInput id="pe-seo-title" value={form.seo_title ?? ''} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
          </FieldShell>
          <FieldShell label="Search description" htmlFor="pe-seo-desc" help="About 150 characters.">
            <TextArea id="pe-seo-desc" rows={2} value={form.seo_description ?? ''} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
          </FieldShell>
          <FieldShell label="Share image">
            <MediaField value={form.og_image ?? ''} onChange={(url) => setForm({ ...form, og_image: url })} kind="image" label="Upload image" />
          </FieldShell>
          <div className="flex items-center gap-3">
            <Button onClick={savePage} busy={savingPage} disabled={!dirtyPage}>Save page</Button>
            {dirtyPage && <Button variant="ghost" onClick={() => setForm(page)}>Discard changes</Button>}
          </div>
        </div>
      </Panel>

      <Modal open={adding} onOpenChange={setAdding} title="Add a section" wide>
        <div className="grid sm:grid-cols-2 gap-2">
          {Object.entries(SECTION_TYPES).map(([type, def]) => (
            <button key={type} type="button" onClick={() => addSection(type)} className="text-left border border-[#EAEAEA] p-3 hover:border-tk-ink">
              <p className="text-[13px] text-tk-ink">{def.label}</p>
              <p className="text-[11px] text-[#888888] mt-0.5">{def.description}</p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={!!editing}
        onOpenChange={(o) => !o && !savingSection && setEditing(null)}
        title={editing ? `Edit ${SECTION_TYPES[editing.section_type]?.label ?? 'section'}` : ''}
        description={editing ? SECTION_TYPES[editing.section_type]?.description : undefined}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={savingSection}>Cancel</Button>
            <Button onClick={saveSection} busy={savingSection}>Save section</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <FieldShell label="Name in this list" htmlFor="sec-label" help="Only admins see this.">
              <TextInput id="sec-label" value={editing.label ?? ''} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
            </FieldShell>
            <label className="flex items-center gap-2 text-[13px]">
              <Toggle checked={editing.is_visible} onChange={(on) => setEditing({ ...editing, is_visible: on })} label="Show on the site" /> Show on the site
            </label>
            {SECTION_TYPES[editing.section_type] ? (
              SECTION_TYPES[editing.section_type].fields.length ? (
                <SchemaForm fields={SECTION_TYPES[editing.section_type].fields} value={editing.config} onChange={(config) => setEditing({ ...editing, config })} />
              ) : (
                <p className="text-[12px] text-[#777777]">This section has no settings of its own.</p>
              )
            ) : (
              <p className="text-[12px] text-rose-600">This section type is no longer supported. Delete it.</p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Delete this section?"
        description="Its settings are lost. Hide it instead to keep them."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!removing) return;
          try {
            await throwIf(supabase.from('website_sections').delete().eq('id', removing.id));
            await invalidate();
            toast.success('Section deleted.');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />

      <ConfirmDialog
        open={deletingPage}
        onOpenChange={setDeletingPage}
        title={`Delete “${page.title}”?`}
        description="The page and its sections are removed. Links to it will show “page not found”."
        confirmLabel="Delete page"
        danger
        onConfirm={async () => {
          try {
            await throwIf(supabase.from('pages').delete().eq('id', page.id));
            await invalidate();
            toast.success('Page deleted.');
            navigate('/admin/pages');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />
    </div>
  );
}
