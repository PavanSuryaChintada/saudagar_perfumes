import { useEffect, useMemo, useState } from 'react';
import { SearchListing } from '../../ui/SearchListing';
import { suggestListing } from '../../../lib/searchListing';
import { useBlock } from '../../../cms/useSite';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { PageHeader, Panel } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextArea, TextInput, Toggle } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { RichText } from '../../ui/RichText';
import { MediaGalleryInput, MediaPreview } from '../../ui/MediaField';
import { SortableList } from '../../ui/SortableList';
import { SearchMultiSelect, SearchSelect, categoryOptions } from '../../ui/SearchSelect';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { AdjustStockModal, StockHistoryModal, UNITS, formatMl, type StockProduct, type StockVariant } from '../../inventory/stock';
import { useProductDefaults } from '../../catalog/useProductDefaults';
import {
  COMPLIANCE_FIELDS, COPY_GROUPS, autoSku, copyProductDetails, emptyProductForm, emptyVariant, fromAdminProduct, slugify, toSavePayload, validateProductForm,
  type AttributeLink, type CopyGroup, type NoteLink, type ProductForm, type VariantForm,
} from '../../catalog/productForm';
import { useSetting } from '../../../lib/bootstrap';
import { FieldInput } from '../../cms/SchemaForm';
import { loadAdminProduct, OPTION_KINDS, rpc, throwIf, useCategories, useCollectionsAdmin, useInvalidateCatalog, useNotes, useOptions, type NoteRow, type OptionRow } from '../../catalog/api';

const TIERS: { tier: NoteLink['tier']; label: string }[] = [
  { tier: 'top', label: 'Top notes' },
  { tier: 'heart', label: 'Heart notes' },
  { tier: 'base', label: 'Base notes' },
];
const STOCK_REASONS = [
  ['restock', 'Restock'],
  ['correction', 'Correction'],
  ['damaged', 'Damaged'],
  ['tester_sample_use', 'Tester / sample use'],
  ['write_off', 'Write off'],
];

function NotePicker({
  tier, links, notes, onChange, onCreate,
}: {
  tier: NoteLink['tier'];
  links: NoteLink[];
  notes: NoteRow[];
  onChange: (next: NoteLink[]) => void;
  onCreate: (name: string) => Promise<NoteRow | null>;
}) {
  const [term, setTerm] = useState('');
  const byId = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);
  const mine = links.filter((l) => l.tier === tier).sort((a, b) => a.position - b.position);
  const used = new Set(links.map((l) => l.note_id));
  const q = term.trim().toLowerCase();
  const matches = q ? notes.filter((n) => !used.has(n.id) && n.name.toLowerCase().includes(q)).slice(0, 8) : [];
  const exact = notes.some((n) => n.name.toLowerCase() === q);
  const add = (id: string) => {
    onChange([...links, { note_id: id, tier, position: mine.length }]);
    setTerm('');
  };
  const reorder = (ids: string[]) =>
    onChange([...links.filter((l) => l.tier !== tier), ...ids.map((id, i) => ({ note_id: id, tier, position: i }))]);
  return (
    <div>
      <SortableList
        items={mine.map((l) => ({ id: l.note_id }))}
        onReorder={reorder}
        className="divide-y divide-[#E9E7E2] border border-[#E2E0DB] mb-2"
        renderItem={(item) => (
          <div className="flex items-center justify-between pr-2 py-1.5 text-[13.5px]">
            <span>{byId.get(item.id)?.name ?? 'Unknown note'}</span>
            <button type="button" aria-label="Remove note" className="p-1 text-[#575757] hover:text-rose-600" onClick={() => onChange(links.filter((l) => l.note_id !== item.id))}>
              <X size={13} />
            </button>
          </div>
        )}
      />
      <div className="relative">
        <TextInput placeholder="Search or add a note" value={term} onChange={(e) => setTerm(e.target.value)} aria-label={`Add ${tier} note`} />
        {q && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#C4C1B9] shadow-md max-h-56 overflow-y-auto">
            {matches.map((n) => (
              <button key={n.id} type="button" className="block w-full text-left px-3 py-1.5 text-[13.5px] hover:bg-[#F4F3EE]" onClick={() => add(n.id)}>
                {n.name}
              </button>
            ))}
            {!exact && (
              <button
                type="button"
                className="block w-full text-left px-3 py-1.5 text-[13.5px] text-tk-accent hover:bg-[#F4F3EE]"
                onClick={async () => {
                  const created = await onCreate(term.trim());
                  if (created) add(created.id);
                }}
              >
                + Add new note “{term.trim()}”
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OptionChips({
  kind, options, attributes, onChange,
}: {
  kind: string;
  options: OptionRow[];
  attributes: AttributeLink[];
  onChange: (next: AttributeLink[]) => void;
}) {
  const mine = attributes.filter((a) => a.kind === kind);
  const isAccord = kind === 'accord';
  const isFamily = kind === 'family';
  const toggle = (o: OptionRow) => {
    const has = mine.some((a) => a.option_id === o.id);
    if (has) onChange(attributes.filter((a) => a.option_id !== o.id));
    else onChange([...attributes, { option_id: o.id, kind, strength: isAccord ? 70 : null, is_primary: isFamily && mine.length === 0 }]);
  };
  // A handful of options reads best as buttons; a long list gets a search box instead.
  const many = options.length > 12;
  const pickMany = (vals: string[]) => {
    const keep = attributes.filter((a) => a.kind !== kind || vals.includes(a.option_id));
    const added = vals
      .filter((v) => !mine.some((m) => m.option_id === v))
      .map((v, i) => ({ option_id: v, kind, strength: isAccord ? 70 : null, is_primary: isFamily && i === 0 && !keep.some((a) => a.kind === kind) }));
    onChange([...keep, ...added]);
  };
  return (
    <div className="space-y-2">
      {many && (
        <SearchMultiSelect
          options={options.map((o) => ({ value: o.id, label: o.label, tag: o.is_active ? undefined : 'hidden' }))}
          values={mine.map((a) => a.option_id)}
          onChange={pickMany}
          placeholder="Search to add"
          ariaLabel={`Choose ${kind}`}
        />
      )}
      <div className={many ? 'hidden' : 'flex flex-wrap gap-1.5'}>
        {options.map((o) => {
          const on = mine.some((a) => a.option_id === o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o)}
              className={`px-2.5 py-1 text-[13px] border ${on ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white text-[#454545] border-[#C4C1B9] hover:border-tk-ink'} ${o.is_active ? '' : 'opacity-50'}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {isAccord &&
        mine.map((a) => (
          <div key={a.option_id} className="flex items-center gap-3 text-[13px]">
            <span className="w-28 truncate">{options.find((o) => o.id === a.option_id)?.label}</span>
            <input
              type="range"
              min={1}
              max={100}
              value={a.strength ?? 70}
              aria-label="Accord strength"
              onChange={(e) => onChange(attributes.map((x) => (x.option_id === a.option_id ? { ...x, strength: Number(e.target.value) } : x)))}
              className="flex-1 accent-tk-accent"
            />
            <span className="w-8 text-right tabular-nums">{a.strength}</span>
          </div>
        ))}
      {isFamily && mine.length > 1 && (
        <div className="flex flex-wrap gap-3 text-[13px] text-[#454545]">
          <span>Primary:</span>
          {mine.map((a) => (
            <label key={a.option_id} className="flex items-center gap-1">
              <input
                type="radio"
                name="primary-family"
                checked={a.is_primary}
                onChange={() => onChange(attributes.map((x) => (x.kind === 'family' ? { ...x, is_primary: x.option_id === a.option_id } : x)))}
              />
              {options.find((o) => o.id === a.option_id)?.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const invalidate = useInvalidateCatalog();
  const { data: options = [] } = useOptions();
  const brandName = useBlock<Record<string, string>>('brand')?.name || 'Saudagar Perfumers';
  const { data: notes = [], refetch: refetchNotes } = useNotes();
  const { data: categories = [], refetch: refetchCategories } = useCategories();
  const { data: collections = [], refetch: refetchCollections } = useCollectionsAdmin();
  const sampleSize = Number(useSetting('samples.sample_size_ml', 5)) || 5;

  const bundle = useQuery({
    queryKey: ['admin', 'catalog', 'product', id],
    enabled: !isNew,
    queryFn: () => loadAdminProduct(id!),
  });

  const productDefaults = useProductDefaults();
  const defaultsKey = JSON.stringify(productDefaults);
  const initial = useMemo(() => (isNew ? emptyProductForm() : bundle.data ? fromAdminProduct(bundle.data) : null), [isNew, bundle.data]);
  const [form, setForm] = useState<ProductForm | null>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [stockModal, setStockModal] = useState<VariantForm | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyFrom, setCopyFrom] = useState('');
  const [copyGroups, setCopyGroups] = useState<CopyGroup[]>(['text', 'scent', 'notes', 'story', 'compliance', 'sections']);
  const [copyBusy, setCopyBusy] = useState(false);
  const productList = useQuery({
    queryKey: ['admin', 'catalog', 'product-picker'],
    queryFn: async () =>
      (await throwIf(supabase.from('products').select('id, name, primary_category_id').is('archived_at', null).eq('is_gift_pack', false).order('name'))) as { id: string; name: string; primary_category_id: string | null }[],
    staleTime: 30_000,
  });
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [switchTo, setSwitchTo] = useState<'ml' | 'piece' | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [stockDelta, setStockDelta] = useState('');
  const [stockReason, setStockReason] = useState('restock');
  const [stockNote, setStockNote] = useState('');

  useEffect(() => setForm(initial), [initial]);
  // New products: the store's label details (Settings → Product details) fill only fields still at their starting
  // value. They may load after the admin has begun typing, so this never resets the form.
  useEffect(() => {
    if (!isNew) return;
    const blank = emptyProductForm();
    setForm((f) => {
      if (!f) return f;
      const next = { ...f };
      for (const [k] of COMPLIANCE_FIELDS) {
        const d = productDefaults[k];
        if (d && f[k] === blank[k]) next[k] = d;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, defaultsKey]);
  const dirty = !!form && !!initial && JSON.stringify(form) !== JSON.stringify(initial);
  // Closing or reloading the tab with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const categoryPicks = useMemo(() => categoryOptions(categories), [categories]);
  const collectionPicks = useMemo(() => collections.map((c) => ({ value: c.id, label: c.name, tag: c.is_active ? undefined : 'hidden' })), [collections]);

  if (!form) {
    return bundle.error ? <p className="text-[14px] text-rose-600">{toFriendlyError(bundle.error)}</p> : <p className="text-[14px] text-[#4A4A4A]">Loading…</p>;
  }

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));
  const setVariant = (i: number, patch: Partial<VariantForm>) =>
    setForm((f) => (f ? { ...f, variants: f.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) } : f));
  const optionsOf = (kind: string) => options.filter((o) => o.kind === kind);

  const freeSlug = (name: string, taken: { slug: string }[]) => {
    const base = slugify(name) || 'item';
    const used = new Set(taken.map((t) => t.slug));
    let slug = base;
    for (let i = 2; used.has(slug); i += 1) slug = `${base}-${i}`;
    return slug;
  };
  const createCategory = async (name: string) => {
    const row = (await throwIf(supabase.from('categories').insert({ name, slug: freeSlug(name, categories) }).select('id').single())) as { id: string };
    await refetchCategories();
    return row.id;
  };
  const createCollection = async (name: string) => {
    const row = (await throwIf(supabase.from('collections').insert({ name, slug: freeSlug(name, collections) }).select('id').single())) as { id: string };
    await refetchCollections();
    return row.id;
  };

  const createNote = async (name: string) => {
    try {
      const row = await throwIf(supabase.from('notes').insert({ name, slug: slugify(name) }).select().single());
      await refetchNotes();
      toast.success(`Note “${name}” added to the library.`);
      return row as NoteRow;
    } catch (err) {
      toast.error(toFriendlyError(err));
      return null;
    }
  };

  const save = async () => {
    const found = validateProductForm(form);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Please fix the highlighted fields.');
      if (found.launch_year || COMPLIANCE_FIELDS.some(([k]) => found[k])) setMoreOpen(true);
      // Take the admin to the first problem instead of leaving them to hunt for it.
      requestAnimationFrame(() => document.querySelector('main .text-rose-600')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    setSaving(true);
    try {
      const pid = await rpc<string>('save_product', { payload: toSavePayload(form) });
      await throwIf(
        supabase
          .from('products')
          .update({
            page_sections: form.page_sections.filter((x) => x.title.trim()).map((x) => ({ title: x.title.trim(), body: x.body })) as never,
            use_default_sections: form.use_default_sections,
          })
          .eq('id', pid),
      );
      await invalidate();
      toast.success('Product saved. Changes are live.');
      if (isNew) navigate(`/admin/products/${pid}`, { replace: true });
      else await bundle.refetch();
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const applyStock = async () => {
    if (!stockModal?.id) return;
    const delta = Number(stockDelta);
    if (!Number.isInteger(delta) || delta === 0) {
      toast.error('Enter a whole number, e.g. 10 to add or -2 to remove.');
      return;
    }
    try {
      await rpc('adjust_stock', { p_variant: stockModal.id, p_delta: delta, p_reason: stockReason, p_note: stockNote || null });
      toast.success('Stock updated and logged.');
      setStockModal(null);
      setStockDelta('');
      setStockNote('');
      await invalidate();
      await bundle.refetch();
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  const runCopy = async () => {
    if (!copyFrom) return toast.error('Choose a product to copy from.');
    if (!copyGroups.length) return toast.error('Tick at least one group of details.');
    setCopyBusy(true);
    try {
      const source = fromAdminProduct(await loadAdminProduct(copyFrom));
      setForm((f) => (f ? copyProductDetails(f, source, copyGroups) : f));
      setCopyOpen(false);
      toast.success('Details copied. Review them, then save.');
    } catch (e) {
      toast.error(toFriendlyError(e));
    } finally {
      setCopyBusy(false);
    }
  };
  const err = (k: string) => errors[k];
  const copyBtn = (groups: CopyGroup[]) => (
    <button
      type="button"
      onClick={() => {
        setCopyGroups(groups);
        setCopyOpen(true);
      }}
      className="inline-flex items-center gap-1 px-2 py-1 text-[12.5px] text-[#3F3F3F] border border-[#C4C1B9] bg-white hover:border-tk-ink whitespace-nowrap"
    >
      <Copy size={12} aria-hidden /> Copy from…
    </button>
  );
  const stockProduct: StockProduct | null = form.id
    ? { id: form.id, name: form.name, stock_unit: form.stock_unit, stock_ml: form.stock_ml, product_variants: (bundle.data?.variants ?? []) as unknown as StockVariant[] }
    : null;
  /** After a stock change: reload the product if nothing else changed, otherwise only its stock. */
  const refreshStock = async () => {
    await invalidate();
    if (!dirty) {
      await bundle.refetch();
      return;
    }
    const fresh = (await throwIf(supabase.from('products').select('stock_ml, product_variants(id, stock)').eq('id', form.id!).single())) as {
      stock_ml: number;
      product_variants: { id: string; stock: number }[];
    };
    const byId = new Map(fresh.product_variants.map((v) => [v.id, v.stock]));
    setForm((f) => (f ? { ...f, stock_ml: Number(fresh.stock_ml), variants: f.variants.map((v) => (v.id ? { ...v, stock: byId.get(v.id) ?? v.stock } : v)) } : f));
  };
  const sampleIdx = form.variants.findIndex((v) => v.kind === 'sample' && !v.is_hidden);
  const offersSample = sampleIdx >= 0 && form.variants[sampleIdx].in_sample_pool && form.variants[sampleIdx].is_active;
  const toggleSample = (on: boolean) => {
    if (on) {
      if (sampleIdx >= 0) setVariant(sampleIdx, { in_sample_pool: true, is_active: true });
      else {
        // Same SKU rule as every size (catalog/productForm autoSku): AMBER-NOIR-S5.
        set('variants', [
          ...form.variants,
          { ...emptyVariant(), kind: 'sample', label: `${sampleSize} ml sample`, size_ml: String(sampleSize), sku: '', in_sample_pool: true },
        ]);
      }
    } else if (sampleIdx >= 0) {
      // A saved vial keeps its stock history; an unsaved one is simply removed.
      if (form.variants[sampleIdx].id) setVariant(sampleIdx, { in_sample_pool: false });
      else set('variants', form.variants.filter((_, j) => j !== sampleIdx));
    }
  };
  const isSample = form.admin_note.startsWith('SAMPLE');

  return (
    <div className="pb-24">
      <PageHeader
        title={isNew ? 'New product' : form.name || 'Product'}
        description={isNew ? 'Category, name, sizes and stock, photos: that is all a product needs. Scent and notes help customers find it; the rest is optional.' : `/product/${form.slug}`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCopyGroups(['text', 'scent', 'notes', 'story', 'compliance', 'sections']);
                setCopyOpen(true);
              }}
            >
              <Copy size={13} /> Copy details from another product
            </Button>
            {!isNew && (
              <a href={`/product/${form.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#C4C1B9] text-[13px] hover:border-tk-ink">
                <ExternalLink size={13} /> View on site
              </a>
            )}
          </>
        }
      />
      {isSample && <p className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 text-[13px] text-amber-800">This is sample content from the original website. Replace the details before launch.</p>}

      <div className="grid gap-5 xl:grid-cols-[1fr_340px] pb-28">
        <div className="space-y-5 min-w-0">
          <Panel
            title="1 · Where it's listed"
            action={copyBtn(['organisation'])}
            description="Start here. The main category is where the product lives; add more categories if it also belongs elsewhere (e.g. an oud that is also a gift). Type to search, or type a new name to create it."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Main category" htmlFor="p-primary-category" error={err('primary_category_id')} help="Used for the breadcrumb, related products and coupons.">
                <SearchSelect
                  id="p-primary-category"
                  options={categoryPicks}
                  value={form.primary_category_id || null}
                  onChange={(v) => {
                    set('primary_category_id', v ?? '');
                    if (v) set('category_ids', form.category_ids.filter((x) => x !== v));
                  }}
                  placeholder="Search categories, e.g. Oud"
                  onCreate={createCategory}
                  createNoun="category"
                  emptyText="No categories yet. Type a name to create the first one."
                />
              </FieldShell>
              <FieldShell label="Also list under" htmlFor="p-more-categories" help="Any number of extra categories. Optional.">
                <SearchMultiSelect
                  id="p-more-categories"
                  options={categoryPicks.filter((o) => o.value !== form.primary_category_id)}
                  values={form.category_ids}
                  onChange={(v) => set('category_ids', v)}
                  placeholder="Search to add another category"
                  onCreate={createCategory}
                  createNoun="category"
                  disabled={!form.primary_category_id}
                />
              </FieldShell>
              <FieldShell label="Collections" htmlFor="p-collections" help="Curated groups such as The Oud Edit. Optional.">
                <SearchMultiSelect
                  id="p-collections"
                  options={collectionPicks}
                  values={form.collection_ids}
                  onChange={(v) => set('collection_ids', v)}
                  placeholder="Search collections"
                  onCreate={createCollection}
                  createNoun="collection"
                  emptyText="No collections yet. Type a name to create one."
                />
              </FieldShell>
              <FieldShell
                label="You may also appreciate (optional)"
                htmlFor="p-related"
                help="Search and pick the products shown under this one, in this order. Leave empty to show similar scents automatically."
              >
                <SearchMultiSelect
                  id="p-related"
                  options={(productList.data ?? []).filter((x) => x.id !== form.id).map((x) => ({ value: x.id, label: x.name }))}
                  values={form.related_product_ids}
                  onChange={(v) => set('related_product_ids', v)}
                  placeholder="Search products"
                  emptyText="No other products yet."
                />
              </FieldShell>
            </div>
          </Panel>

{form.primary_category_id ? (
<>
          <Panel title="2 · Name and description" action={copyBtn(['text'])}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Name" htmlFor="p-name" error={err('name')}>
                <TextInput
                  id="p-name"
                  value={form.name}
                  invalid={!!err('name')}
                  onChange={(e) => {
                    set('name', e.target.value);
                    if (!slugTouched) set('slug', slugify(e.target.value));
                  }}
                />
              </FieldShell>
              <FieldShell label="Link (slug)" htmlFor="p-slug" error={err('slug')} help="The address: /product/your-slug. Changing it breaks old links.">
                <TextInput id="p-slug" value={form.slug} invalid={!!err('slug')} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()); }} />
              </FieldShell>
              <FieldShell label="Badge" htmlFor="p-badge" help="Small label on cards, e.g. NEW DROP. Optional.">
                <TextInput id="p-badge" value={form.badge} onChange={(e) => set('badge', e.target.value)} />
              </FieldShell>
              <FieldShell label="Concentration line" htmlFor="p-conc" help="e.g. Extrait de Parfum · 38% pure oil">
                <TextInput id="p-conc" value={form.concentration_note} onChange={(e) => set('concentration_note', e.target.value)} />
              </FieldShell>
            </div>
            <div className="mt-4 space-y-4">
              <FieldShell label="Short description" htmlFor="p-short" help="Shown under the name on the product page.">
                <TextArea id="p-short" rows={3} value={form.short_description} onChange={(e) => set('short_description', e.target.value)} />
              </FieldShell>
              <FieldShell label="Full description">
                <RichText value={form.description} onChange={(v) => set('description', v)} placeholder="Full description" />
              </FieldShell>
            </div>
          </Panel>

          <Panel title="3 · Sizes and prices" description="One row per bottle size. An empty size price uses the base price; the SKU fills itself in." action={copyBtn(['sizes'])}>
            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <FieldShell label="Base price (₹, incl. GST)" htmlFor="p-price" error={err('base_price')}>
                <TextInput id="p-price" inputMode="decimal" value={form.base_price} invalid={!!err('base_price')} onChange={(e) => set('base_price', e.target.value)} />
              </FieldShell>
              <FieldShell label="MRP / compare-at (₹)" htmlFor="p-mrp" error={err('compare_at_price')} help="Shown struck through when higher than the price.">
                <TextInput id="p-mrp" inputMode="decimal" value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} />
              </FieldShell>
            </div>
            {err('variants') && <p className="text-[13px] text-rose-600 mb-2">{err('variants')}</p>}
            <div className="space-y-3">
              {form.variants.map((v, i) => v.kind === 'sample' ? null : (
                <div key={v.id ?? `new-${i}`} className={`border p-3 ${v.is_hidden ? 'border-dashed border-[#C4C1B9] opacity-70' : 'border-[#E2E0DB]'}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 text-[12.5px] bg-[#F4F3EE] text-[#3F3F3F]">{v.label || 'New size'}</span>
                    {v.is_hidden && <span className="text-[12px] text-[#4A4A4A]">Hidden</span>}
                    <span className="flex-1" />
                    {v.id && (
                      <span className="text-[13px] text-[#454545] tabular-nums">
                        {form.stock_unit === 'ml' ? (
                          <>Enough for <strong>{v.stock ?? 0}</strong></>
                        ) : (
                          <>Stock: <strong className={(v.stock ?? 0) <= 5 ? 'text-rose-600' : ''}>{v.stock ?? 0}</strong></>
                        )}
                      </span>
                    )}
                    {v.id && form.stock_unit === 'piece' && (
                      <Button size="sm" variant="secondary" onClick={() => setStockModal(v)}>
                        Adjust stock
                      </Button>
                    )}
                    <button
                      type="button"
                      className="p-1.5 text-[#575757] hover:text-rose-600"
                      aria-label="Remove size"
                      title={v.units_sold ? 'Sold before: it will be hidden, not deleted' : 'Remove'}
                      onClick={() => set('variants', form.variants.filter((_, j) => j !== i))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
                    <FieldShell label="Size (ml)" error={err(`variants.${i}.size_ml`)}>
                      <TextInput
                        inputMode="decimal"
                        value={v.size_ml}
                        placeholder="50"
                        onChange={(e) => {
                          const ml = e.target.value;
                          const autoLabel = !v.label || v.label === `${v.size_ml} ml`;
                          setVariant(i, { size_ml: ml, ...(autoLabel ? { label: ml ? `${ml} ml` : '' } : {}) });
                        }}
                        aria-label="Size in ml"
                      />
                    </FieldShell>
                    <FieldShell label="Label" error={err(`variants.${i}.label`)}>
                      <TextInput value={v.label} placeholder="50 ml" onChange={(e) => setVariant(i, { label: e.target.value })} aria-label="Size label" />
                    </FieldShell>
                    <FieldShell label="Price (₹)" error={err(`variants.${i}.price`)}>
                      <TextInput inputMode="decimal" value={v.price} placeholder={form.base_price ? `${form.base_price} (base)` : 'base price'} onChange={(e) => setVariant(i, { price: e.target.value })} aria-label="Size price" />
                    </FieldShell>
                    <FieldShell label="MRP (₹)" error={err(`variants.${i}.compare_at_price`)}>
                      <TextInput inputMode="decimal" value={v.compare_at_price} placeholder="optional" onChange={(e) => setVariant(i, { compare_at_price: e.target.value })} aria-label="Size MRP" />
                    </FieldShell>
                    <FieldShell label="SKU" error={err(`variants.${i}.sku`)}>
                      <TextInput value={v.sku} placeholder={autoSku(form.slug, v)} onChange={(e) => setVariant(i, { sku: e.target.value.toUpperCase() })} aria-label="SKU" />
                    </FieldShell>
                    {!v.id && form.stock_unit === 'piece' && (
                      <FieldShell label="Opening stock" error={err(`variants.${i}.initial_stock`)}>
                        <TextInput inputMode="numeric" value={v.initial_stock} placeholder="e.g. 10" onChange={(e) => setVariant(i, { initial_stock: e.target.value })} aria-label="Opening stock" />
                      </FieldShell>
                    )}
                  </div>
                  <details className="mt-2 text-[13px]">
                    <summary className="cursor-pointer text-[#4F4F4F] hover:text-tk-ink">Parcel weight and box size (optional, for couriers)</summary>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mt-2">
                      <FieldShell label="Weight (g)">
                        <TextInput inputMode="numeric" value={v.weight_g} onChange={(e) => setVariant(i, { weight_g: e.target.value })} aria-label="Weight in grams" />
                      </FieldShell>
                      <FieldShell label="Box L × W × H (mm)">
                        <div className="flex gap-1">
                          {(['length_mm', 'width_mm', 'height_mm'] as const).map((k) => (
                            <TextInput key={k} inputMode="numeric" value={v[k]} onChange={(e) => setVariant(i, { [k]: e.target.value })} aria-label={k} className="px-1.5" />
                          ))}
                        </div>
                      </FieldShell>
                    </div>
                  </details>
                  <div className="flex flex-wrap gap-5 mt-3 text-[13px]">
                    <label className="flex items-center gap-2">
                      <Toggle checked={v.is_active} onChange={(on) => setVariant(i, { is_active: on })} label="Available" /> Available
                    </label>
                    <label className="flex items-center gap-2">
                      <Toggle checked={v.is_hidden} onChange={(on) => setVariant(i, { is_hidden: on })} label="Hidden" /> Hidden
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="secondary" onClick={() => set('variants', [...form.variants, emptyVariant()])}>
                <Plus size={12} /> Add bottle size
              </Button>
              <span className="self-center text-[13px] text-[#4F4F4F] ml-2">Quick add:</span>
              {['30', '50', '100'].filter((ml) => !form.variants.some((v) => v.kind === 'retail' && v.size_ml === ml)).map((ml) => (
                <button
                  key={ml}
                  type="button"
                  onClick={() => set('variants', [...form.variants, { ...emptyVariant(), size_ml: ml, label: `${ml} ml` }])}
                  className="px-2.5 py-1 text-[13px] border border-[#C4C1B9] bg-white hover:border-tk-ink"
                >
                  {ml} ml
                </button>
              ))}
            </div>
          </Panel>

          <Panel
            title="4 · Stock"
            description={form.stock_unit === 'ml' ? 'Kept as liquid: every bottle and free sample sold takes its ml from here.' : 'Counted in pieces: each size has its own count.'}
          >
            {isNew ? (
              <div className="space-y-4">
                <div role="radiogroup" aria-label="How stock is kept" className="grid sm:grid-cols-2 gap-2">
                  {([
                    ['ml', 'Liquid (ml)', 'Perfume, attar or oil: bottles and samples are poured from one stock'],
                    ['piece', 'Pieces', 'Gift sets, discovery boxes, accessories'],
                  ] as const).map(([v, l, h]) => (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={form.stock_unit === v}
                      onClick={() => set('stock_unit', v)}
                      className={`text-left px-3 py-2.5 border ${form.stock_unit === v ? 'border-tk-ink bg-[#F4F3EE]' : 'border-[#C4C1B9] bg-white hover:border-tk-ink'}`}
                    >
                      <span className="block text-[14px] font-medium">{l}</span>
                      <span className="block text-[12.5px] text-[#4F4F4F]">{h}</span>
                    </button>
                  ))}
                </div>
                {form.stock_unit === 'ml' ? (
                  <FieldShell label="Liquid in stock" htmlFor="p-liquid" error={err('liquid_amount')} help="What you have of this perfume now, e.g. 1 L or 500 ml. Add more later in Inventory.">
                    <div className="flex gap-2 max-w-[380px]">
                      <TextInput id="p-liquid" inputMode="decimal" placeholder="e.g. 1" value={form.liquid_amount} onChange={(e) => set('liquid_amount', e.target.value)} />
                      <select
                        aria-label="Unit"
                        value={form.liquid_unit}
                        onChange={(e) => set('liquid_unit', e.target.value as ProductForm['liquid_unit'])}
                        className="border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white"
                      >
                        {UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  </FieldShell>
                ) : (
                  <p className="text-[13.5px] text-[#4F4F4F]">Enter each size's opening stock in the sizes above.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                {form.stock_unit === 'ml' ? (
                  <div className="mr-2">
                    <p className="text-[22px] leading-tight tabular-nums">{formatMl(form.stock_ml)}</p>
                    <p className="text-[13px] text-[#4F4F4F]">left</p>
                  </div>
                ) : (
                  <p className="text-[14px] text-[#3F3F3F] mr-2">Each size has its own count; use Adjust stock on a size above.</p>
                )}
                {form.stock_unit === 'ml' && (
                  <Button variant="secondary" onClick={() => setAdjustOpen(true)}>
                    Add or remove stock
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
                  History
                </Button>
                <button
                  type="button"
                  className="text-[13px] underline underline-offset-4 text-[#4F4F4F] hover:text-tk-ink"
                  onClick={() => setSwitchTo(form.stock_unit === 'ml' ? 'piece' : 'ml')}
                >
                  {form.stock_unit === 'ml' ? 'Count in pieces instead' : 'Keep as liquid (ml) instead'}
                </button>
              </div>
            )}
            <div className="flex items-start justify-between gap-3 p-3 mt-4 bg-[#FFF7ED] border border-[#F5E3CC]">
              <div>
                <p className="text-[14px] text-tk-ink">Offer as a free sample</p>
                <p className="text-[12.5px] text-[#4F4F4F]">
                  {form.stock_unit === 'ml'
                    ? `Customers can pick this scent as a free ${sampleSize} ml sample; each one takes ${sampleSize} ml from the stock above.`
                    : 'Customers can pick this as a free sample.'}
                </p>
              </div>
              <Toggle checked={offersSample} onChange={toggleSample} label="Offer as a free sample" />
            </div>
          </Panel>

          <Panel title="5 · Photos and videos" description="Drag to reorder. The first image is the main photo. Tie a photo to a size to show it when that size is picked.">
            <SortableList
              items={form.media.map((m, i) => ({ id: `${i}:${m.url}`, m, i }))}
              onReorder={(ids) => {
                const order = ids.map((x) => Number(x.split(':')[0]));
                set('media', order.map((i) => form.media[i]));
              }}
              className="divide-y divide-[#E9E7E2] border border-[#E2E0DB] mb-3"
              renderItem={({ m, i }) => (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-2">
                  <div className="w-14 h-14 bg-[#F4F3EE] shrink-0 overflow-hidden">
                    <MediaPreview url={m.url} className="w-full h-full object-contain" />
                  </div>
                  <TextInput
                    placeholder="Description (alt text)"
                    value={m.alt}
                    onChange={(e) => set('media', form.media.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                    aria-label="Alt text"
                  />
                  <select
                    value={m.variant_sku}
                    onChange={(e) => set('media', form.media.map((x, j) => (j === i ? { ...x, variant_sku: e.target.value } : x)))}
                    className="border border-[#C4C1B9] px-2 py-2 text-[13px] bg-white"
                    aria-label="Show for size"
                  >
                    <option value="">All sizes</option>
                    {form.variants.filter((v) => v.sku).map((v) => (
                      <option key={v.sku} value={v.sku.toUpperCase()}>{v.label || v.sku}</option>
                    ))}
                  </select>
                  <button type="button" className="p-2 text-[#575757] hover:text-rose-600" aria-label="Remove media" onClick={() => set('media', form.media.filter((_, j) => j !== i))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            />
            <MediaGalleryInput onAdd={(added) => set('media', [...form.media, ...added.map((a) => ({ kind: a.kind, url: a.url, alt: '', variant_sku: '' }))])} />
          </Panel>

          <Panel title="6 · Scent type" description="Tap what fits. Each choice is also a filter on the shop pages." action={copyBtn(['scent'])}>
            {errors.attributes && <p className="text-[13px] text-rose-600 mb-2">{errors.attributes}</p>}
            <div className="space-y-5">
              {OPTION_KINDS.filter((k) => k.kind !== 'note_family').map((k) => (
                <div key={k.kind}>
                  <p className="text-[12px] text-[#454545] mb-1.5 font-medium">{k.label}</p>
                  {optionsOf(k.kind).length ? (
                    <OptionChips kind={k.kind} options={optionsOf(k.kind)} attributes={form.attributes} onChange={(next) => set('attributes', next)} />
                  ) : (
                    <p className="text-[13px] text-[#575757]">No options yet.</p>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="7 · Notes" description="Search the notes library, or type a new note to add it. Drag to reorder." action={copyBtn(['notes'])}>
            <div className="grid gap-4 md:grid-cols-3">
              {TIERS.map((t) => (
                <div key={t.tier}>
                  <p className="text-[12px] text-[#454545] mb-1.5 font-medium">{t.label}</p>
                  <NotePicker tier={t.tier} links={form.notes} notes={notes} onChange={(next) => set('notes', next)} onCreate={createNote} />
                </div>
              ))}
            </div>
          </Panel>

          <details
            className="border border-[#E2E0DB] bg-white"
            open={moreOpen}
            onToggle={(e) => setMoreOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer px-4 sm:px-5 py-3.5 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[15px] font-semibold">More details (optional)</span>
              <span className="text-[13px] text-[#4F4F4F]">Story, extra page sections, label details</span>
            </summary>
            <div className="p-3 sm:p-4 space-y-5 border-t border-[#E2E0DB] bg-[#FAFAF8]">
          <Panel title="The story" action={copyBtn(['story'])}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Perfumer / nose" htmlFor="p-nose">
                <TextInput id="p-nose" value={form.perfumer} onChange={(e) => set('perfumer', e.target.value)} />
              </FieldShell>
              <FieldShell label="Launch year" htmlFor="p-year" error={err('launch_year')}>
                <TextInput id="p-year" inputMode="numeric" value={form.launch_year} onChange={(e) => set('launch_year', e.target.value)} />
              </FieldShell>
            </div>
            <div className="mt-4 space-y-4">
              <FieldShell label="Inspiration">
                <RichText value={form.inspiration} onChange={(v) => set('inspiration', v)} placeholder="Inspiration" minHeight={90} />
              </FieldShell>
              <FieldShell label="How to wear">
                <RichText value={form.how_to_wear} onChange={(v) => set('how_to_wear', v)} placeholder="How to wear" minHeight={70} />
              </FieldShell>
            </div>
          </Panel>

          <Panel title="Extra sections on the product page" description="Drop-down sections such as a ritual, gifting or care section." action={copyBtn(['sections'])}>
            <label className="flex items-center gap-2 text-[14px] mb-4">
              <Toggle checked={form.use_default_sections} onChange={(on) => set('use_default_sections', on)} label="Also show the store's default sections" />
              Also show the store's default sections
              <span className="text-[12px] text-[#4F4F4F]">— edit them in Site content → Product page</span>
            </label>
            <FieldInput
              field={{ key: 'page_sections', label: 'This product’s own sections', type: 'list', itemLabel: 'Section', fields: [
                { key: 'title', label: 'Title', type: 'text', placeholder: 'e.g. The ritual' },
                { key: 'body', label: 'Text', type: 'richtext' },
              ] }}
              value={form.page_sections}
              onChange={(v) => set('page_sections', v as ProductForm['page_sections'])}
            />
          </Panel>

          <Panel title="Label details" description="Empty fields use the store's details from Settings → Product details. Fill one only when this product is different." action={copyBtn(['compliance'])}>
            <div className="grid gap-4 sm:grid-cols-2">
              {COMPLIANCE_FIELDS.map(([key, label]) => (
                <FieldShell key={key} label={label} htmlFor={`c-${key}`} error={err(key)}>
                  {key.endsWith('address') || key === 'ingredients' || key === 'caution_text' ? (
                    <TextArea id={`c-${key}`} rows={2} value={form[key]} placeholder={productDefaults[key] || undefined} onChange={(e) => set(key, e.target.value)} />
                  ) : (
                    <TextInput id={`c-${key}`} value={form[key]} placeholder={productDefaults[key] || undefined} onChange={(e) => set(key, e.target.value)} />
                  )}
                </FieldShell>
              ))}
            </div>
          </Panel>
            </div>
          </details>
</>
) : (
          <p className="px-4 py-6 border border-dashed border-[#C4C1B9] text-[14px] text-[#4A4A4A] bg-white">Choose a category above to continue. Then pick the scent type and notes, and add the details, sizes and photos.</p>
)}






        </div>

        <aside className="space-y-5">
          <Panel title="Visibility">
            <div className="space-y-3 text-[14px]">
              {([
                ['is_active', 'Live on the store', 'Off = draft, only admins can see it.'],
                ['is_featured', 'Featured', 'Sorted first in "Featured".'],
                ['counts_toward_samples', 'Earns free samples', 'Its ml count towards free 5 ml samples.'],
                ['ships_surface_only', 'Ships by surface only', 'For alcohol-based perfume (flammable).'],
              ] as const).map(([key, label, help]) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <div>
                    <p>{label}</p>
                    <p className="text-[12px] text-[#4F4F4F]">{help}</p>
                  </div>
                  <Toggle checked={form[key]} onChange={(on) => set(key, on)} label={label} />
                </div>
              ))}
            </div>
          </Panel>


          <Panel title="How it shows on Google">
            <SearchListing
              path={`/product/${form.slug || 'new-product'}`}
              value={{ title: form.seo_title, description: form.seo_description }}
              onChange={(v) => {
                set('seo_title', v.title);
                set('seo_description', v.description);
              }}
              suggestion={suggestListing({
                kind: 'product',
                name: form.name || 'New product',
                summary: form.short_description,
                body: form.description,
                notes: (['top', 'heart', 'base'] as const).flatMap((tier) =>
                  form.notes
                    .filter((n) => n.tier === tier)
                    .sort((a, b) => a.position - b.position)
                    .map((n) => notes.find((x) => x.id === n.note_id)?.name ?? ''),
                ).filter(Boolean),
                family: options.find((o) => form.attributes.some((a) => a.kind === 'family' && a.is_primary && a.option_id === o.id))?.label ?? null,
                sizes: form.variants.filter((v) => v.kind === 'retail' && !v.is_hidden).map((v) => Number(v.size_ml)).filter((n) => n > 0),
                siteName: brandName,
              })}
            />
          </Panel>

          <Panel title="Internal note" description="Only admins see this.">
            <TextArea rows={3} value={form.admin_note} onChange={(e) => set('admin_note', e.target.value)} aria-label="Internal note" />
          </Panel>
        </aside>
      </div>

      <div className="fixed bottom-0 inset-x-0 lg:left-[240px] z-30 bg-white border-t border-[#E2E0DB] px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-end sm:justify-between gap-2 sm:gap-3">
        <p className="hidden sm:block text-[13px] text-[#454545]">{dirty ? 'Unsaved changes' : isNew ? 'New product' : 'All changes saved'}</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (dirty && !window.confirm('Leave without saving? Your changes to this product will be lost.')) return;
              navigate('/admin/products');
            }}
          >
            <span className="whitespace-nowrap">Back to products</span>
          </Button>
          <Button onClick={save} busy={saving} disabled={!dirty && !isNew}>
            <span className="whitespace-nowrap">{dirty ? 'Save product' : isNew ? 'Save product' : 'Saved'}</span>
          </Button>
        </div>
      </div>

      <Modal
        open={copyOpen}
        onOpenChange={(o) => !o && !copyBusy && setCopyOpen(false)}
        title="Copy details from another product"
        description="Fills the ticked parts of this form from the chosen product. Nothing is saved until you press Save."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCopyOpen(false)} disabled={copyBusy}>Cancel</Button>
            <Button onClick={runCopy} busy={copyBusy}>Copy</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FieldShell label="Copy from" htmlFor="copy-from" help={form.primary_category_id ? 'Products in the same category are listed first.' : undefined}>
            <SearchSelect
              id="copy-from"
              value={copyFrom || null}
              onChange={(v) => setCopyFrom(v ?? '')}
              placeholder="Search products"
              options={[...(productList.data ?? [])]
                .filter((p) => p.id !== form.id)
                .sort((x, y) => Number(y.primary_category_id === form.primary_category_id) - Number(x.primary_category_id === form.primary_category_id))
                .map((p) => ({
                  value: p.id,
                  label: p.name,
                  tag: form.primary_category_id && p.primary_category_id === form.primary_category_id ? 'same category' : undefined,
                }))}
            />
          </FieldShell>
          <fieldset className="space-y-1.5">
            <legend className="text-[12px] font-medium text-[#454545] mb-1">What to copy</legend>
            {COPY_GROUPS.map((g) => (
              <label key={g.key} className="flex items-center gap-2 text-[14px]">
                <input
                  type="checkbox"
                  checked={copyGroups.includes(g.key)}
                  onChange={(e) => setCopyGroups(e.target.checked ? [...copyGroups, g.key] : copyGroups.filter((x) => x !== g.key))}
                />
                {g.label}
              </label>
            ))}
          </fieldset>
          <p className="text-[12px] text-[#4F4F4F]">Name, link, prices, sizes, stock and photos are never copied.</p>
        </div>
      </Modal>

      <Modal
        open={!!stockModal}
        onOpenChange={(o) => !o && setStockModal(null)}
        title={`Adjust stock · ${stockModal?.label ?? ''}`}
        description={`Current stock: ${stockModal?.stock ?? 0}. Every change is logged with its reason.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStockModal(null)}>
              Cancel
            </Button>
            <Button onClick={applyStock}>Apply</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FieldShell label="Change" htmlFor="s-delta" help="Positive adds stock (e.g. 12), negative removes it (e.g. -2).">
            <TextInput id="s-delta" inputMode="numeric" value={stockDelta} onChange={(e) => setStockDelta(e.target.value)} />
          </FieldShell>
          <FieldShell label="Reason" htmlFor="s-reason">
            <select id="s-reason" value={stockReason} onChange={(e) => setStockReason(e.target.value)} className="w-full border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white">
              {STOCK_REASONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </FieldShell>
          <FieldShell label="Note (optional)" htmlFor="s-note">
            <TextInput id="s-note" value={stockNote} onChange={(e) => setStockNote(e.target.value)} />
          </FieldShell>
        </div>
      </Modal>
      <AdjustStockModal product={adjustOpen ? stockProduct : null} onClose={() => setAdjustOpen(false)} onDone={refreshStock} />
      <StockHistoryModal product={historyOpen ? stockProduct : null} onClose={() => setHistoryOpen(false)} />
      <ConfirmDialog
        open={!!switchTo}
        onOpenChange={(o) => !o && setSwitchTo(null)}
        title={switchTo === 'piece' ? 'Count this product in pieces?' : 'Keep this product as liquid (ml)?'}
        description={
          switchTo === 'piece'
            ? 'Each size keeps the count it has now and is counted on its own from then on. Use this for sets and accessories.'
            : 'The bottles in stock are added up into ml (e.g. 4 × 50 ml = 200 ml), and every size and sample is poured from that.'
        }
        confirmLabel="Switch"
        onConfirm={async () => {
          if (!form.id || !switchTo) return;
          if (dirty) {
            toast.error('Save your other changes first, then switch.');
            return;
          }
          try {
            await rpc('set_stock_mode', { p_product: form.id, p_unit: switchTo });
            await Promise.all([invalidate(), bundle.refetch()]);
            toast.success('Stock mode changed.');
          } catch (e) {
            toast.error(toFriendlyError(e));
          } finally {
            setSwitchTo(null);
          }
        }}
      />
    </div>
  );
}
