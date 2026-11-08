import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SearchListing } from '../../ui/SearchListing';
import { suggestListing } from '../../../lib/searchListing';
import { useBlock } from '../../../cms/useSite';
import { Link, useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Copy, ExternalLink, Eye, EyeOff, Plus, Settings2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { FieldShell, TextInput, Toggle } from '../../ui/Field';
import { MediaField } from '../../ui/MediaField';
import { RichText } from '../../ui/RichText';
import { rpc, throwIf } from '../../catalog/api';
import { slugify } from '../../catalog/productForm';
import { SchemaForm } from '../../cms/SchemaForm';
import { BLOCK_SCHEMAS } from '../../cms/blocks';
import { CONTENT_TYPES, type ContentType } from '../../cms/contentTypes';
import { SECTION_PRESETS, SECTION_TYPES, sectionTypesFor } from '../../../cms/registry';
import { emptyItem } from '../../../cms/schema';
import { pageHref, TEMPLATE_PAGES, usePages, type PageRow } from './PagesPage';
import { toForm, toRow, type Row } from './ContentListPage';
import { BlockEditor } from './SiteContentPage';
import MediaLibraryPage from '../MediaLibraryPage';

// Admin → Website: one screen for everything a visitor sees. Pick a page (or a content list, or a site setting) on
// the left, click an item, edit it on the right. The eye shows or hides it; the arrows move it.

type Tab = 'pages' | 'content' | 'site' | 'media';
const TABS: { key: Tab; label: string }[] = [
  { key: 'pages', label: 'Pages' },
  { key: 'content', label: 'Content' },
  { key: 'site', label: 'Site settings' },
  { key: 'media', label: 'Media' },
];

interface SectionRow {
  id: string;
  page_id: string;
  section_type: string;
  label: string | null;
  position: number;
  is_visible: boolean;
  config: Record<string, unknown>;
}

/** Unsaved changes: switching item or tab asks before throwing them away. */
const Unsaved = createContext<{ setDirty: (d: boolean) => void; guard: (fn: () => void) => void }>({ setDirty: () => {}, guard: (fn) => fn() });

type SetParams = (patch: Record<string, string | null>) => void;

export default function CmsWorkspace() {
  const [params, setSearch] = useSearchParams();
  const tab = (TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'pages') as Tab;
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<null | (() => void)>(null);
  const guard = useCallback((fn: () => void) => (dirty ? setPending(() => fn) : fn()), [dirty]);
  const setParams: SetParams = useCallback(
    (patch) =>
      setSearch((cur) => {
        const next = new URLSearchParams(cur);
        for (const [k, v] of Object.entries(patch)) {
          if (v === null) next.delete(k);
          else next.set(k, v);
        }
        return next;
      }),
    [setSearch],
  );

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <Unsaved.Provider value={{ setDirty, guard }}>
      <div className="pb-10">
        <PageHeader
          title="Website"
          description="Change every part of the shop without code. Pick a page, click a section, and edit it on the right."
          actions={
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 text-[13.5px] border border-[#BDB8AD] bg-white hover:border-tk-ink">
              <ExternalLink size={14} aria-hidden /> Preview site
            </a>
          }
        />
        <div role="tablist" aria-label="Website" className="inline-flex flex-wrap gap-1 p-1 bg-[#E6E1D6] mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => guard(() => setSearch({ tab: t.key }))}
              className={`px-4 py-2 text-[14px] ${tab === t.key ? 'bg-white text-tk-ink font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-[#3F3F3F] hover:text-tk-ink'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'pages' && <PagesTab params={params} setParams={setParams} />}
        {tab === 'content' && <ContentTab params={params} setParams={setParams} />}
        {tab === 'site' && <SiteTab params={params} setParams={setParams} />}
        {tab === 'media' && <MediaLibraryPage embedded />}
      </div>
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title="Leave without saving?"
        description="You have changes here that aren’t saved yet."
        confirmLabel="Discard changes"
        danger
        onConfirm={() => {
          const fn = pending;
          setPending(null);
          setDirty(false);
          fn?.();
        }}
      />
    </Unsaved.Provider>
  );
}

// ---------------------------------------------------------------- shared layout

function TwoPane({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] items-start">
      <div className="min-w-0 lg:sticky lg:top-20 bg-white border border-[#E0DBD1] shadow-[0_1px_2px_rgba(20,20,20,0.05)] flex flex-col lg:max-h-[calc(100vh-104px)]">{left}</div>
      <div className="min-w-0 bg-white border border-[#E0DBD1] shadow-[0_1px_2px_rgba(20,20,20,0.05)]">{right}</div>
    </div>
  );
}

const pickerCls = 'w-full min-w-0 border border-[#BDB8AD] bg-white px-3 py-2 text-[14px] text-tk-ink focus:outline-none focus:border-tk-ink';

function PaneRow({
  n,
  title,
  sub,
  selected,
  visible,
  onSelect,
  onToggle,
  onUp,
  onDown,
  icon,
}: {
  n?: number;
  title: string;
  sub?: string;
  selected: boolean;
  visible?: boolean;
  onSelect: () => void;
  onToggle?: () => void;
  onUp?: (() => void) | null;
  onDown?: (() => void) | null;
  icon?: ReactNode;
}) {
  const btn = `p-1.5 disabled:opacity-25 ${selected ? 'text-white/85 hover:text-white' : 'text-[#4A4A4A] hover:text-tk-ink'}`;
  return (
    <div className={`flex items-center gap-1 pl-3 pr-2 py-2.5 border-b border-[#ECE8DF] ${selected ? 'bg-[#17161B] text-white' : 'hover:bg-[#FAF8F4]'}`}>
      <button type="button" onClick={onSelect} aria-current={selected || undefined} className="flex-1 min-w-0 flex items-center gap-3 text-left">
        {icon ?? (n !== undefined && <span className={`w-5 shrink-0 text-[12px] tabular-nums ${selected ? 'text-white/70' : 'text-[#6B6B6B]'}`}>{n}</span>)}
        <span className="min-w-0">
          <span className={`block text-[14px] truncate ${visible === false ? (selected ? 'text-white/70' : 'text-[#7A7A7A]') : ''}`}>{title}</span>
          {sub && <span className={`block text-[10.5px] uppercase tracking-[0.12em] truncate ${selected ? 'text-white/65' : 'text-[#6B6B6B]'}`}>{sub}</span>}
        </span>
      </button>
      {onToggle && (
        <button type="button" className={btn} onClick={onToggle} aria-label={visible ? `Hide ${title}` : `Show ${title}`} title={visible ? 'Shown on site. Click to hide.' : 'Hidden. Click to show.'}>
          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      )}
      {onUp !== undefined && (
        <button type="button" className={btn} disabled={!onUp} onClick={onUp ?? undefined} aria-label={`Move ${title} up`} title="Move up">
          <ChevronUp size={16} />
        </button>
      )}
      {onDown !== undefined && (
        <button type="button" className={btn} disabled={!onDown} onClick={onDown ?? undefined} aria-label={`Move ${title} down`} title="Move down">
          <ChevronDown size={16} />
        </button>
      )}
    </div>
  );
}

function EditorHeader({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-[#E0DBD1] flex flex-wrap items-start gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#6B6B6B]">{kicker}</p>
        <h2 className="text-[20px] font-semibold text-[#141414] break-words">{title}</h2>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

function SaveBar({ dirty, busy, onSave, onDiscard, label }: { dirty: boolean; busy: boolean; onSave: () => void; onDiscard: () => void; label: string }) {
  return (
    <div className="sticky bottom-0 z-10 px-5 py-3 bg-white border-t border-[#E0DBD1] flex items-center gap-3">
      <Button onClick={onSave} busy={busy} disabled={!dirty}>{label}</Button>
      {dirty ? <Button variant="ghost" onClick={onDiscard}>Discard changes</Button> : <span className="text-[13px] text-[#4F4F4F]">All changes saved.</span>}
    </div>
  );
}

const headerBtn = 'inline-flex items-center gap-1.5 border border-[#C4C1B9] bg-white px-3 py-2 text-[13px] text-[#3F3F3F] hover:border-tk-ink hover:text-tk-ink';
const iconOnly = 'p-2 border border-transparent text-[#4A4A4A] hover:border-[#C4C1B9] hover:text-tk-ink';

function swap<T>(arr: T[], i: number, j: number): T[] {
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// ---------------------------------------------------------------- Pages tab

function PagesTab({ params, setParams }: { params: URLSearchParams; setParams: SetParams }) {
  const qc = useQueryClient();
  const { guard } = useContext(Unsaved);
  const { data: pages = [], isLoading } = usePages();
  const slug = params.get('page') ?? 'home';
  const page = pages.find((p) => p.slug === slug) ?? pages.find((p) => p.slug === 'home') ?? pages[0];
  const sectionsQuery = useQuery({
    queryKey: ['admin', 'page', page?.id, 'sections'],
    enabled: !!page,
    queryFn: async () => (await throwIf(supabase.from('website_sections').select('*').eq('page_id', page!.id).order('position'))) as SectionRow[],
  });
  const sections = useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data]);
  const [adding, setAdding] = useState(false);
  const [newPage, setNewPage] = useState(false);

  const invalidate = useCallback(
    () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'page'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'pages'] }),
        qc.invalidateQueries({ queryKey: ['cms', 'page'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'lookup', 'pages'] }),
      ]),
    [qc],
  );

  if (isLoading) return <p className="text-[14px] text-[#4A4A4A]">Loading…</p>;
  if (!page) return <p className="text-[14px] text-[#4A4A4A]">No pages yet.</p>;

  const isSections = page.layout === 'sections';
  const requested = params.get('section');
  const selected = requested === 'settings' || !isSections ? 'settings' : sections.find((s) => s.id === requested)?.id ?? sections[0]?.id ?? 'settings';
  const current = sections.find((s) => s.id === selected);

  const select = (id: string) => guard(() => setParams({ section: id }));
  const move = async (i: number, j: number) => {
    try {
      await rpc('reorder_rows', { p_table: 'website_sections', p_ids: swap(sections, i, j).map((s) => s.id) });
      await invalidate();
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };
  const setVisible = async (s: SectionRow, on: boolean) => {
    try {
      await throwIf(supabase.from('website_sections').update({ is_visible: on }).eq('id', s.id));
      await invalidate();
      toast.success(on ? 'Shown on the site.' : 'Hidden from the site.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };
  const addSection = async (type: string, preset?: { label: string; config: Record<string, unknown> }) => {
    try {
      const def = SECTION_TYPES[type];
      // Start from a ready-made section, or from an existing section of this type, so there is something to edit.
      const { data: sample } = preset
        ? { data: null }
        : await supabase.from('website_sections').select('config').eq('section_type', type).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      const config = preset
        ? structuredClone(preset.config)
        : sample?.config && typeof sample.config === 'object' && Object.keys(sample.config).length ? structuredClone(sample.config) : emptyItem(def.fields);
      const row = (await throwIf(
        supabase
          .from('website_sections')
          .insert({ page_id: page.id, section_type: type, label: preset?.label ?? def.label, position: sections.length, is_visible: true, config: config as never })
          .select('id')
          .single(),
      )) as { id: string };
      setAdding(false);
      await invalidate();
      setParams({ section: row.id });
      toast.success('Section added at the bottom. Edit it on the right, then move it with the arrows.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  const ordinary = pages.filter((p) => !TEMPLATE_PAGES[p.slug]);
  const templates = pages.filter((p) => TEMPLATE_PAGES[p.slug]);

  const left = (
    <>
      <div className="p-3 border-b border-[#E0DBD1] space-y-2">
        <label htmlFor="cms-page" className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#555555]">Page</label>
        <div className="flex gap-2">
          <select id="cms-page" className={pickerCls} value={page.slug} onChange={(e) => { const v = e.target.value; guard(() => setParams({ page: v, section: null })); }}>
            <optgroup label="Pages">
              {ordinary.map((p) => (
                <option key={p.id} value={p.slug}>{p.title}{p.is_published ? '' : ' (draft)'}</option>
              ))}
            </optgroup>
            {templates.length > 0 && (
              <optgroup label="Used by many pages">
                {templates.map((p) => (
                  <option key={p.id} value={p.slug}>{p.title}</option>
                ))}
              </optgroup>
            )}
          </select>
          <Button variant="secondary" onClick={() => guard(() => setNewPage(true))} aria-label="New page">
            <Plus size={14} /> New
          </Button>
        </div>
        {TEMPLATE_PAGES[page.slug] && <p className="text-[12.5px] text-[#4A4A4A]">{TEMPLATE_PAGES[page.slug]}</p>}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {!TEMPLATE_PAGES[page.slug] && (
          <PaneRow
            title="Page settings"
            sub={isSections ? 'Name, link, search text' : 'Text of the page, link, search text'}
            selected={selected === 'settings'}
            onSelect={() => select('settings')}
            icon={<Settings2 size={16} className={selected === 'settings' ? 'text-white/80' : 'text-[#6B6B6B]'} aria-hidden />}
          />
        )}
        {isSections && sections.length === 0 && <p className="px-4 py-4 text-[13.5px] text-[#4A4A4A]">No sections yet. Add the first one below.</p>}
        {isSections &&
          sections.map((s, i) => {
            const def = SECTION_TYPES[s.section_type];
            const name = s.label || def?.label || s.section_type;
            return (
              <PaneRow
                key={s.id}
                n={i + 1}
                title={name}
                sub={def?.label ?? 'Unknown section'}
                selected={selected === s.id}
                visible={s.is_visible}
                onSelect={() => select(s.id)}
                onToggle={def?.required ? undefined : () => setVisible(s, !s.is_visible)}
                onUp={i > 0 ? () => move(i, i - 1) : null}
                onDown={i < sections.length - 1 ? () => move(i, i + 1) : null}
              />
            );
          })}
      </div>
      {isSections && (
        <div className="p-3 border-t border-[#E0DBD1]">
          <Button variant="secondary" className="w-full" onClick={() => guard(() => setAdding(true))}>
            <Plus size={14} /> Add section
          </Button>
        </div>
      )}
    </>
  );

  const right =
    selected === 'settings' || !current ? (
      <PageSettings key={page.id} page={page} invalidate={invalidate} onDeleted={() => setParams({ page: 'home', section: null })} />
    ) : (
      <SectionEditor key={current.id} section={current} page={page} invalidate={invalidate} onSelect={(id) => setParams({ section: id })} />
    );

  return (
    <>
      <TwoPane left={left} right={right} />
      <Modal open={adding} onOpenChange={setAdding} title="Add a section" description="Pick a ready-made section or any section type. It is added at the bottom; move it with the arrows." wide>
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
      <NewPageDialog
        open={newPage}
        onOpenChange={setNewPage}
        pages={pages}
        onCreated={async (s) => {
          await invalidate();
          setParams({ page: s, section: 'settings' });
        }}
      />
    </>
  );
}

function SectionEditor({ section, page, invalidate, onSelect }: { section: SectionRow; page: PageRow; invalidate: () => Promise<unknown>; onSelect: (id: string) => void }) {
  const { setDirty } = useContext(Unsaved);
  const def = SECTION_TYPES[section.section_type];
  const [label, setLabel] = useState(section.label ?? '');
  const [config, setConfig] = useState<Record<string, unknown>>(section.config ?? {});
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const dirty = label !== (section.label ?? '') || JSON.stringify(config) !== JSON.stringify(section.config ?? {});
  useEffect(() => setDirty(dirty), [dirty, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);

  const name = label || def?.label || section.section_type;
  const href = pageHref(page.slug);
  const src = (config as { source?: { mode?: string; products?: string[] } }).source;
  const nothingPicked = src?.mode === 'manual' && !(src.products ?? []).length;

  const save = async () => {
    setBusy(true);
    try {
      await throwIf(supabase.from('website_sections').update({ label: label.trim() || null, config: config as never }).eq('id', section.id));
      await invalidate();
      toast.success('Section saved. The site shows it straight away.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };
  const setVisible = async (on: boolean) => {
    try {
      await throwIf(supabase.from('website_sections').update({ is_visible: on }).eq('id', section.id));
      await invalidate();
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };
  const duplicate = async () => {
    try {
      const id = await rpc<string>('duplicate_section', { p_id: section.id });
      await invalidate();
      if (id) onSelect(id);
      toast.success('Section copied. The copy is selected.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  return (
    <div>
      <EditorHeader kicker={def?.label ?? 'Section'} title={name}>
        {!def?.required && (
          <label className="inline-flex items-center gap-2 text-[13.5px] text-[#2F2F2F]">
            <Toggle checked={section.is_visible} onChange={setVisible} label="Shown on site" /> {section.is_visible ? 'Shown on site' : 'Hidden'}
          </label>
        )}
        {href && (
          <a href={href} target="_blank" rel="noreferrer" className={headerBtn}>
            <ExternalLink size={14} aria-hidden /> View on site
          </a>
        )}
        {!def?.required && (
          <>
            <button type="button" className={iconOnly} onClick={duplicate} aria-label={`Copy ${name}`} title="Make a copy">
              <Copy size={16} />
            </button>
            <button type="button" className={`${iconOnly} hover:!text-rose-700 hover:!border-rose-300`} onClick={() => setRemoving(true)} aria-label={`Delete ${name}`} title="Delete">
              <Trash2 size={16} />
            </button>
          </>
        )}
      </EditorHeader>
      <div className="p-5 space-y-5">
        {def?.description && <p className="text-[13.5px] text-[#3F3F3F]">{def.description}</p>}
        {def?.required && <p className="text-[13px] text-[#3F3F3F] bg-[#F6F3EC] border border-[#E6DFD0] px-3 py-2">This section is needed on this page. You can move it, but not hide or delete it.</p>}
        {nothingPicked && (
          <p className="text-[13px] text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2">No products picked yet, so this section doesn’t show on the site. Pick products below.</p>
        )}
        <FieldShell label="Name in this list" htmlFor="sec-label" help="Only you see this name; it helps you find the section.">
          <TextInput id="sec-label" value={label} onChange={(e) => setLabel(e.target.value)} />
        </FieldShell>
        {def ? (
          def.fields.length ? (
            <SchemaForm fields={def.fields} value={config} onChange={setConfig} />
          ) : (
            <p className="text-[13.5px] text-[#4A4A4A]">This section has no settings of its own. It shows the page’s own content.</p>
          )
        ) : (
          <p className="text-[13.5px] text-rose-700">This section type is no longer supported. Delete it.</p>
        )}
      </div>
      <SaveBar dirty={dirty} busy={busy} onSave={save} onDiscard={() => { setLabel(section.label ?? ''); setConfig(section.config ?? {}); }} label="Save section" />
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={`Delete “${name}”?`}
        description="The section is removed from this page. To keep it for later, hide it instead."
        confirmLabel="Delete section"
        danger
        onConfirm={async () => {
          try {
            await throwIf(supabase.from('website_sections').delete().eq('id', section.id));
            setDirty(false);
            await invalidate();
            onSelect('');
            toast.success('Section deleted.');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />
    </div>
  );
}

function PageSettings({ page, invalidate, onDeleted }: { page: PageRow; invalidate: () => Promise<unknown>; onDeleted: () => void }) {
  const { setDirty } = useContext(Unsaved);
  const [form, setForm] = useState<PageRow>(page);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const brandName = useBlock<Record<string, string>>('brand')?.name || 'Saudagar Perfumers';
  useEffect(() => setForm(page), [page]);
  const dirty = JSON.stringify(form) !== JSON.stringify(page);
  useEffect(() => setDirty(dirty), [dirty, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);
  const href = pageHref(page.slug);

  const save = async () => {
    const title = form.title.trim();
    const slug = slugify(form.slug);
    if (!title) return setError('Enter a page title.');
    if (!slug) return setError('Enter a link for the page.');
    setError('');
    setBusy(true);
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
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <EditorHeader kicker={page.layout === 'sections' ? 'Section page' : 'Text page'} title={page.title}>
        {href && (
          <a href={href} target="_blank" rel="noreferrer" className={headerBtn}>
            <ExternalLink size={14} aria-hidden /> View on site
          </a>
        )}
        {!page.is_system && (
          <button type="button" className={`${iconOnly} hover:!text-rose-700 hover:!border-rose-300`} onClick={() => setDeleting(true)} aria-label={`Delete ${page.title}`} title="Delete page">
            <Trash2 size={16} />
          </button>
        )}
      </EditorHeader>
      <div className="p-5 space-y-4">
        {error && <p className="text-[13px] text-rose-600">{error}</p>}
        <FieldShell label="Title" htmlFor="pe-title">
          <TextInput id="pe-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </FieldShell>
        <FieldShell label="Link" htmlFor="pe-slug" help={page.is_system ? 'Built-in pages keep their link.' : 'Changing it breaks old links to this page.'}>
          <TextInput id="pe-slug" value={form.slug} disabled={page.is_system} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
        </FieldShell>
        {!page.is_system && (
          <label className="flex items-center gap-2 text-[14px]">
            <Toggle checked={form.is_published} onChange={(on) => setForm({ ...form, is_published: on })} label="Published" /> Published
            <span className="text-[12.5px] text-[#4F4F4F]">Drafts are only visible to admins.</span>
          </label>
        )}
        {page.layout === 'rich_text' && (
          <FieldShell label="Page text">
            <RichText value={form.body ?? ''} onChange={(html) => setForm({ ...form, body: html })} minHeight={320} />
          </FieldShell>
        )}
        <div className="pt-2 border-t border-[#E9E5DC]">
          <p className="text-[14px] font-semibold text-tk-ink mb-2">How it shows on Google</p>
          <SearchListing
            path={pageHref(page.slug) || `/pages/${page.slug}`}
            value={{ title: form.seo_title ?? '', description: form.seo_description ?? '' }}
            onChange={(v) => setForm({ ...form, seo_title: v.title, seo_description: v.description })}
            suggestion={suggestListing({ kind: 'page', name: form.title || 'Page', body: form.layout === 'rich_text' ? form.body : null, siteName: brandName })}
          />
        </div>
        <FieldShell label="Picture when the page is shared" help="Shown when the link is shared on WhatsApp, Instagram or Facebook. 1200 × 630 works best.">
          <MediaField value={form.og_image ?? ''} onChange={(url) => setForm({ ...form, og_image: url })} kind="image" label="Upload image" />
        </FieldShell>
      </div>
      <SaveBar dirty={dirty} busy={busy} onSave={save} onDiscard={() => setForm(page)} label="Save page" />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete “${page.title}”?`}
        description="The page and its sections are removed. Links to it will show “page not found”."
        confirmLabel="Delete page"
        danger
        onConfirm={async () => {
          try {
            await throwIf(supabase.from('pages').delete().eq('id', page.id));
            setDirty(false);
            await invalidate();
            toast.success('Page deleted.');
            onDeleted();
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />
    </div>
  );
}

function NewPageDialog({ open, onOpenChange, pages, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; pages: PageRow[]; onCreated: (slug: string) => void }) {
  const [draft, setDraft] = useState<{ title: string; slug: string; layout: 'sections' | 'rich_text' }>({ title: '', slug: '', layout: 'rich_text' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setDraft({ title: '', slug: '', layout: 'rich_text' });
      setError('');
    }
  }, [open]);
  const create = async () => {
    const title = draft.title.trim();
    const slug = slugify(draft.slug || title);
    if (!title) return setError('Enter a page title.');
    if (!slug) return setError('Enter a link for the page.');
    if (pages.some((p) => p.slug === slug)) return setError('Another page already uses this link.');
    setBusy(true);
    try {
      await throwIf(
        supabase.from('pages').insert({ title, slug, layout: draft.layout, is_published: false, position: pages.length, body: draft.layout === 'rich_text' ? '' : null }),
      );
      onOpenChange(false);
      onCreated(slug);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title="New page"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={create} busy={busy}>Create page</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="text-[13px] text-rose-600">{error}</p>}
        <FieldShell label="Title" htmlFor="pg-title">
          <TextInput id="pg-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: slugify(e.target.value) })} />
        </FieldShell>
        <FieldShell label="Link" htmlFor="pg-slug" help={`The page will live at /pages/${draft.slug || 'link'}.`}>
          <TextInput id="pg-slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
        </FieldShell>
        <fieldset className="space-y-2">
          <legend className="text-[12.5px] font-medium text-[#454545]">Kind of page</legend>
          <label className="flex items-start gap-2 text-[14px]">
            <input type="radio" name="pg-layout" checked={draft.layout === 'rich_text'} onChange={() => setDraft({ ...draft, layout: 'rich_text' })} />
            <span>Text page<span className="block text-[12.5px] text-[#4F4F4F]">One formatted document: policies, about, contact.</span></span>
          </label>
          <label className="flex items-start gap-2 text-[14px]">
            <input type="radio" name="pg-layout" checked={draft.layout === 'sections'} onChange={() => setDraft({ ...draft, layout: 'sections' })} />
            <span>Section page<span className="block text-[12.5px] text-[#4F4F4F]">Built from the same sections as the home page.</span></span>
          </label>
        </fieldset>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- Content tab

const KINDS = Object.keys(CONTENT_TYPES);

function ContentTab({ params, setParams }: { params: URLSearchParams; setParams: SetParams }) {
  const qc = useQueryClient();
  const { guard } = useContext(Unsaved);
  const kind = KINDS.includes(params.get('kind') ?? '') ? (params.get('kind') as string) : KINDS[0];
  const type = CONTENT_TYPES[kind];
  const select = type.linksProducts ? '*, reel_products(product_id, position)' : '*';
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'content', type.table],
    queryFn: async () => (await throwIf(supabase.from(type.table).select(select).order('position').order('created_at'))) as unknown as Row[],
  });
  const refresh = useCallback(
    () => Promise.all([qc.invalidateQueries({ queryKey: ['admin', 'content', type.table] }), ...type.invalidates.map((queryKey) => qc.invalidateQueries({ queryKey }))]),
    [qc, type],
  );
  const requested = params.get('item');
  const selected = requested === 'new' ? 'new' : rows.find((r) => r.id === requested)?.id ?? rows[0]?.id ?? 'new';
  const current = rows.find((r) => r.id === selected);
  const title = (r: Row) => String(r[type.titleField] ?? '').trim() || `Untitled ${type.singular}`;

  const move = async (i: number, j: number) => {
    try {
      await rpc('reorder_rows', { p_table: type.table, p_ids: swap(rows, i, j).map((r) => r.id) });
      await refresh();
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };
  const setActive = async (r: Row, on: boolean) => {
    try {
      await throwIf(supabase.from(type.table).update({ is_active: on } as never).eq('id', r.id));
      await refresh();
      toast.success(on ? 'Shown on the site.' : 'Hidden from the site.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  const left = (
    <>
      <div className="p-3 border-b border-[#E0DBD1] space-y-2">
        <label htmlFor="cms-kind" className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#555555]">Content</label>
        <select id="cms-kind" className={pickerCls} value={kind} onChange={(e) => { const v = e.target.value; guard(() => setParams({ kind: v, item: null })); }}>
          {KINDS.map((k) => (
            <option key={k} value={k}>{CONTENT_TYPES[k].label}</option>
          ))}
        </select>
        <p className="text-[12.5px] text-[#4A4A4A]">{type.description}</p>
        <Button variant="secondary" className="w-full" onClick={() => guard(() => setParams({ item: 'new' }))}>
          <Plus size={14} /> Add {type.singular}
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {isLoading && <p className="px-4 py-4 text-[13.5px] text-[#4A4A4A]">Loading…</p>}
        {!isLoading && rows.length === 0 && <p className="px-4 py-4 text-[13.5px] text-[#4A4A4A]">No {type.label.toLowerCase()} yet. Add the first one.</p>}
        {selected === 'new' && <PaneRow title={`New ${type.singular}`} sub="Not saved yet" selected onSelect={() => {}} icon={<Plus size={16} className="text-white/80" aria-hidden />} />}
        {rows.map((r, i) => (
          <PaneRow
            key={r.id}
            n={i + 1}
            title={title(r)}
            sub={type.subtitle?.(r) || type.singular}
            selected={selected === r.id}
            visible={!!r.is_active}
            onSelect={() => guard(() => setParams({ item: r.id }))}
            onToggle={() => setActive(r, !r.is_active)}
            onUp={i > 0 ? () => move(i, i - 1) : null}
            onDown={i < rows.length - 1 ? () => move(i, i + 1) : null}
          />
        ))}
      </div>
    </>
  );

  return (
    <TwoPane
      left={left}
      right={
        <ContentEditor
          key={`${kind}:${current?.id ?? 'new'}`}
          type={type}
          row={current ?? null}
          count={rows.length}
          refresh={refresh}
          onSaved={(id) => setParams({ item: id })}
          onActive={(on) => current && setActive(current, on)}
          title={current ? title(current) : `New ${type.singular}`}
        />
      }
    />
  );
}

function ContentEditor({
  type,
  row,
  count,
  refresh,
  onSaved,
  onActive,
  title,
}: {
  type: ContentType;
  row: Row | null;
  count: number;
  refresh: () => Promise<unknown>;
  onSaved: (id: string | null) => void;
  onActive: (on: boolean) => void;
  title: string;
}) {
  const { setDirty } = useContext(Unsaved);
  const initial = useMemo(() => (row ? toForm(type, row) : { ...emptyItem(type.fields), is_active: true }), [row, type]);
  const [form, setForm] = useState<Record<string, unknown>>(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => setDirty(dirty), [dirty, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);
  // On a saved item the switch sits in the header; a new item keeps it in the form.
  const fields = row ? type.fields.filter((f) => f.key !== 'is_active') : type.fields;
  const noun = type.singular[0].toUpperCase() + type.singular.slice(1);

  const save = async () => {
    const values = toRow(type, form);
    const missing = type.fields.find(
      (f) => (f.key === type.titleField || (type.table === 'testimonials' && f.key === 'quote') || (type.table === 'faqs' && f.key === 'answer')) && !values[f.key],
    );
    if (missing) return setError(`Fill in “${missing.label}”.`);
    setError('');
    setBusy(true);
    try {
      let id = row?.id;
      if (id) await throwIf(supabase.from(type.table).update(values as never).eq('id', id));
      else {
        const created = (await throwIf(supabase.from(type.table).insert({ ...values, position: count } as never).select('id').single())) as { id: string };
        id = created.id;
      }
      if (type.linksProducts && id) {
        const ids = (form.product_ids as string[] | undefined) ?? [];
        await throwIf(supabase.from('reel_products').delete().eq('reel_id', id));
        if (ids.length) await throwIf(supabase.from('reel_products').insert(ids.map((product_id, position) => ({ reel_id: id!, product_id, position }))));
      }
      setDirty(false);
      await refresh();
      if (!row) onSaved(id ?? null);
      toast.success(`${noun} saved.`);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <EditorHeader kicker={type.label} title={title}>
        {row && (
          <label className="inline-flex items-center gap-2 text-[13.5px] text-[#2F2F2F]">
            <Toggle checked={!!row.is_active} onChange={onActive} label="Shown on site" /> {row.is_active ? 'Shown on site' : 'Hidden'}
          </label>
        )}
        {row && (
          <button type="button" className={`${iconOnly} hover:!text-rose-700 hover:!border-rose-300`} onClick={() => setDeleting(true)} aria-label={`Delete ${title}`} title="Delete">
            <Trash2 size={16} />
          </button>
        )}
      </EditorHeader>
      <div className="p-5 space-y-4">
        {error && <p className="text-[13px] text-rose-600">{error}</p>}
        <SchemaForm fields={fields} value={form} onChange={setForm} />
      </div>
      <SaveBar dirty={dirty || !row} busy={busy} onSave={save} onDiscard={() => setForm(initial)} label={`Save ${type.singular}`} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete this ${type.singular}?`}
        description="This can’t be undone. Hide it instead to keep it for later."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!row) return;
          try {
            await throwIf(supabase.from(type.table).delete().eq('id', row.id));
            setDirty(false);
            await refresh();
            onSaved(null);
            toast.success('Deleted.');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- Site settings tab

const BLOCKS = Object.keys(BLOCK_SCHEMAS);

function SiteTab({ params, setParams }: { params: URLSearchParams; setParams: SetParams }) {
  const { guard, setDirty } = useContext(Unsaved);
  const block = BLOCKS.includes(params.get('block') ?? '') ? (params.get('block') as string) : BLOCKS[0];
  const left = (
    <>
      <div className="p-3 border-b border-[#E0DBD1]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#555555]">Site settings</p>
        <p className="text-[12.5px] text-[#4A4A4A] mt-1">Parts that appear on every page: colours, logo, menus, footer, wording and search text.</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {BLOCKS.map((k, i) => (
          <PaneRow key={k} n={i + 1} title={BLOCK_SCHEMAS[k].label} selected={k === block} onSelect={() => guard(() => setParams({ block: k }))} />
        ))}
      </div>
      <div className="p-3 border-t border-[#E0DBD1] text-[13px] text-[#3F3F3F] space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#555555]">Also</p>
        <Link to="/admin/gift-pack" className="block underline underline-offset-2 hover:text-tk-ink">Gift pack words and picture</Link>
        <Link to="/admin/invoice" className="block underline underline-offset-2 hover:text-tk-ink">Invoice wording</Link>
        <Link to="/admin/settings" className="block underline underline-offset-2 hover:text-tk-ink">Store settings (delivery, COD, samples)</Link>
      </div>
    </>
  );
  return <TwoPane left={left} right={<BlockEditor key={block} blockKey={block} embedded onDirty={setDirty} />} />;
}
