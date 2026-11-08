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
import { SECTION_PRESETS, SECTION_TYPES, sectionTypesFor } from '../../../cms/registry';
import { emptyItem } from '../../../cms/schema';
import { pageHref, TEMPLATE_PAGES, type PageRow } from './PagesPage';
import { RowAction } from '../../ui/ListHead';

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

  if (pageQuery.isLoading) return <p className="text-[14px] text-[#4A4A4A]">Loading…</p>;
  if (!page || !form) return <p className="text-[14px] text-[#4A4A4A]">This page doesn't exist. <Link to="/admin/pages" className="underline">Back to pages</Link></p>;

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

  const addSection = async (type: string, preset?: { label: string; config: Record<string, unknown> }) => {
    try {
      const def = SECTION_TYPES[type];
      // Start from a ready-made section, or from the content of an existing section of this type, so the admin
      // edits rather than starts blank.
      const { data: sample } = preset
        ? { data: null }
        : await supabase.from('website_sections').select('config').eq('section_type', type).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      const startConfig = preset
        ? structuredClone(preset.config)
        : sample?.config && typeof sample.config === 'object' && Object.keys(sample.config).length ? structuredClone(sample.config) : emptyItem(def.fields);
      const row = (await throwIf(
        supabase
          .from('website_sections')
          .insert({ page_id: page.id, section_type: type, label: preset?.label ?? def.label, position: sections.length, is_visible: true, config: startConfig as never })
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
        <Link to="/admin/pages" className="inline-flex items-center gap-1 text-[13px] text-[#4A4A4A] hover:text-tk-ink mb-3">
          <ArrowLeft size={13} /> Pages
        </Link>
        <PageHeader
          title={page.title}
          description={TEMPLATE_PAGES[page.slug] ?? `${pageHref(page.slug)} · ${page.layout === 'sections' ? 'Section page' : 'Text page'}${page.is_system ? ' · Built-in' : ''}`}
          actions={
            <>
              {pageHref(page.slug) && (
                <a href={pageHref(page.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] border border-[#C4C1B9] bg-white hover:border-tk-ink">
                  <ExternalLink size={14} /> View on site
                </a>
              )}
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
        <Panel
          title="Sections"
          description={
            page.slug === 'listing-page'
              ? 'Drag to reorder. “Top picture and title” and “Products with filters” are needed on every category page: move them, and add sections above or below.'
              : page.slug === 'product-page'
                ? 'Drag to reorder. These show on every product page, below the photos and the buy button. Hidden sections stay here but don’t show.'
                : 'Drag to reorder. Hidden sections stay here but don’t show on the site.'
          }
        >
          {sections.length === 0 ? (
            <p className="text-[14px] text-[#4A4A4A] mb-3">No sections yet.</p>
          ) : (
            <SortableList
              items={sections}
              className="border border-[#E2E0DB] divide-y divide-[#E9E7E2] mb-3"
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
                const src = (s.config as { source?: { mode?: string; products?: string[] } }).source;
                const nothingPicked = src?.mode === 'manual' && !(src.products ?? []).length;
                return (
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pr-2 py-2">
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditing(s)}>
                      <p className="text-[14px] font-medium truncate text-tk-ink">{name}</p>
                      <p className="text-[12px] text-[#4F4F4F] truncate">
                        {def ? def.label : `Unknown type “${s.section_type}”`}
                        {def?.required ? ' · Needed: can be moved, not removed' : ''}
                      </p>
                      {nothingPicked && <p className="text-[12px] text-amber-800">No products picked yet, so it doesn’t show. Edit it to pick products.</p>}
                    </button>
                    <span className={`px-2 py-0.5 text-[12px] font-medium border ${s.is_visible ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-[#EFEDE8] text-[#4A4A4A] border-[#D6D1C6]'}`}>
                      {s.is_visible ? 'Shown' : 'Hidden'}
                    </span>
                    {!def?.required && (
                      <RowAction icon={s.is_visible ? EyeOff : Eye} label={s.is_visible ? `Hide ${name}` : `Show ${name}`} onClick={() => setVisible(s, !s.is_visible)}>
                        {s.is_visible ? 'Hide' : 'Show'}
                      </RowAction>
                    )}
                    <RowAction icon={Pencil} label={`Edit ${name}`} onClick={() => setEditing(s)}>Edit</RowAction>
                    {!def?.required && (
                      <RowAction
                        icon={Copy}
                        label={`Duplicate ${name}`}
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
                        Copy
                      </RowAction>
                    )}
                    {!def?.required && (
                      <RowAction icon={Trash2} danger label={`Delete ${name}`} onClick={() => setRemoving(s)}>Delete</RowAction>
                    )}
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

      {!TEMPLATE_PAGES[page.slug] && (
      <Panel title="Page settings">
        <div className="space-y-4">
          {pageError && <p className="text-[13px] text-rose-600">{pageError}</p>}
          <FieldShell label="Title" htmlFor="pe-title">
            <TextInput id="pe-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </FieldShell>
          <FieldShell label="Link" htmlFor="pe-slug" help={page.is_system ? "Built-in pages keep their link." : 'Changing it breaks old links to this page.'}>
            <TextInput id="pe-slug" value={form.slug} disabled={page.is_system} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          </FieldShell>
          {!page.is_system && (
            <label className="flex items-center gap-2 text-[14px]">
              <Toggle checked={form.is_published} onChange={(on) => setForm({ ...form, is_published: on })} label="Published" /> Published
              <span className="text-[12px] text-[#4F4F4F]">— drafts are only visible to admins.</span>
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
      )}

      <Modal open={adding} onOpenChange={setAdding} title="Add a section" description="Pick a ready-made section or any section type. New sections start with sample content; edit it, then save." wide>
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-tk-accent mb-2">Ready-made: pick the products</p>
        <div className="grid sm:grid-cols-2 gap-2 mb-5">
          {SECTION_PRESETS.map((p) => (
            <button key={p.key} type="button" onClick={() => addSection(p.type, p)} className="text-left border border-[#E2E0DB] bg-[#FAF8F4] p-3 hover:border-tk-ink">
              <p className="text-[14px] font-medium text-tk-ink">{p.label}</p>
              <p className="text-[12px] text-[#4F4F4F] mt-0.5">{p.description}</p>
            </button>
          ))}
        </div>
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-tk-accent mb-2">All sections</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {sectionTypesFor(page.slug)
            .filter(([, def]) => !def.required)
            .map(([type, def]) => (
              <button key={type} type="button" onClick={() => addSection(type)} className="text-left border border-[#E2E0DB] p-3 hover:border-tk-ink">
                <p className="text-[14px] font-medium text-tk-ink">{def.label}</p>
                <p className="text-[12px] text-[#4F4F4F] mt-0.5">{def.description}</p>
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
            <label className="flex items-center gap-2 text-[14px]">
              <Toggle checked={editing.is_visible} onChange={(on) => setEditing({ ...editing, is_visible: on })} label="Show on the site" /> Show on the site
            </label>
            {SECTION_TYPES[editing.section_type] ? (
              SECTION_TYPES[editing.section_type].fields.length ? (
                <SchemaForm fields={SECTION_TYPES[editing.section_type].fields} value={editing.config} onChange={(config) => setEditing({ ...editing, config })} />
              ) : (
                <p className="text-[13px] text-[#4A4A4A]">This section has no settings of its own.</p>
              )
            ) : (
              <p className="text-[13px] text-rose-600">This section type is no longer supported. Delete it.</p>
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
