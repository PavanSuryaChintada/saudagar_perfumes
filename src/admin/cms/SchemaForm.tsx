import { useId, useState } from 'react';
import { ChevronDown, ChevronRight, ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react';
import { emptyItem, visibleFields, type FieldDef } from '../../cms/schema';
import { FONT_CHOICES } from '../../cms/theme';
import type { LinkType, LinkValue } from '../../cms/links';
import type { ProductSource, SourceMode } from '../../cms/sources';
import { FieldShell, TextArea, TextInput, Toggle } from '../ui/Field';
import { MediaField } from '../ui/MediaField';
import { SearchMultiSelect, SearchSelect } from '../ui/SearchSelect';
import { RichText } from '../ui/RichText';
import {
  useCategoryLookup,
  useCollectionLookup,
  useNoteLookup,
  useOptionLookup,
  usePageLookup,
  useProductLookup,
  type LookupItem,
} from './lookups';
import { OPTION_KINDS } from '../catalog/api';

type Obj = Record<string, unknown>;
const selectCls = 'w-full border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white';
const iconBtn = 'p-1.5 text-[#5A5A5A] hover:text-tk-ink disabled:opacity-30 disabled:hover:text-[#5A5A5A]';

/** Renders a form for any CMS field schema. The value is a plain object; onChange receives the whole new object. */
export function SchemaForm({ fields, value, onChange }: { fields: FieldDef[]; value: Obj | null | undefined; onChange: (v: Obj) => void }) {
  const v = value ?? {};
  return (
    <div className="space-y-4">
      {visibleFields(fields, v).map((f) => (
        <FieldInput key={f.key} field={f} value={v[f.key]} onChange={(next) => onChange({ ...v, [f.key]: next })} />
      ))}
    </div>
  );
}

export function FieldInput({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const id = useId();
  const str = typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);

  switch (field.type) {
    case 'text':
      return (
        <FieldShell label={field.label} htmlFor={id} help={field.help}>
          <TextInput id={id} value={str} placeholder={field.placeholder ?? exampleFrom(field.help)} onChange={(e) => onChange(e.target.value)} />
        </FieldShell>
      );
    case 'textarea':
      return (
        <FieldShell label={field.label} htmlFor={id} help={field.help}>
          <TextArea id={id} rows={field.rows ?? 3} value={str} placeholder={exampleFrom(field.help)} onChange={(e) => onChange(e.target.value)} />
        </FieldShell>
      );
    case 'richtext':
      return (
        <FieldShell label={field.label} help={field.help}>
          <RichText value={str} onChange={onChange} />
        </FieldShell>
      );
    case 'number':
      return (
        <FieldShell label={field.label} htmlFor={id} help={field.help}>
          <TextInput
            id={id}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            className="max-w-[160px]"
          />
        </FieldShell>
      );
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <Toggle id={id} checked={Boolean(value)} onChange={onChange} label={field.label} />
          <label htmlFor={id} className="text-[14px] text-tk-ink">{field.label}</label>
          {field.help && <span className="text-[12px] text-[#626262]">— {field.help}</span>}
        </div>
      );
    case 'select':
      return (
        <FieldShell label={field.label} htmlFor={id} help={field.help}>
          <select id={id} className={selectCls} value={str} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FieldShell>
      );
    case 'color':
      return (
        <FieldShell label={field.label} htmlFor={id} help={field.help}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label={`${field.label} picker`}
              value={/^#[0-9a-f]{6}$/i.test(str) ? str : '#000000'}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              className="h-9 w-12 border border-[#C4C1B9] bg-white p-0.5"
            />
            <TextInput id={id} value={str} placeholder="#C4823F" onChange={(e) => onChange(e.target.value)} className="max-w-[140px] font-mono" />
          </div>
        </FieldShell>
      );
    case 'font':
      return (
        <FieldShell label={field.label} htmlFor={id} help={field.help}>
          <select id={id} className={selectCls} value={str} onChange={(e) => onChange(e.target.value)}>
            <option value="">Default</option>
            {FONT_CHOICES.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
        </FieldShell>
      );
    case 'datetime':
      return (
        <FieldShell label={field.label} htmlFor={id} help={field.help}>
          <TextInput
            id={id}
            type="datetime-local"
            value={str ? toLocalInput(str) : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            className="max-w-[240px]"
          />
        </FieldShell>
      );
    case 'media':
      return (
        <FieldShell label={field.label} help={field.help}>
          <MediaField value={str} onChange={onChange} kind={field.accept} label={field.accept === 'video' ? 'Upload video' : 'Upload image'} />
        </FieldShell>
      );
    case 'link':
      return <LinkInput label={field.label} help={field.help} value={value as LinkValue | null} onChange={onChange} />;
    case 'product_source':
      return <SourceInput label={field.label} help={field.help} value={value as ProductSource | null} onChange={onChange} />;
    case 'product':
      return field.multiple ? (
        <MultiPick label={field.label} help={field.help} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} by={field.by ?? 'slug'} />
      ) : (
        <LookupSelect id={id} label={field.label} help={field.help} value={str} onChange={onChange} kind="product" by={field.by ?? 'slug'} />
      );
    case 'collection':
      return <LookupSelect id={id} label={field.label} help={field.help} value={str} onChange={onChange} kind="collection" by="slug" />;
    case 'category':
      return <LookupSelect id={id} label={field.label} help={field.help} value={str} onChange={onChange} kind="category" by="slug" />;
    case 'strings':
      return <StringsInput label={field.label} help={field.help} placeholder={field.placeholder} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
    case 'group':
      return (
        <fieldset className="border border-[#E2E0DB] p-3 space-y-3">
          <legend className="px-1 text-[12px] font-medium uppercase tracking-[0.08em] text-[#454545]">{field.label}</legend>
          {field.help && <p className="text-[12px] text-[#626262]">{field.help}</p>}
          <SchemaForm fields={field.fields} value={(value as Obj) ?? {}} onChange={onChange} />
        </fieldset>
      );
    case 'list':
      return <ListInput field={field} value={Array.isArray(value) ? (value as Obj[]) : []} onChange={onChange} />;
    default:
      return null;
  }
}

/** "e.g. Free delivery…" in a field's help doubles as its placeholder example. */
function exampleFrom(help?: string): string | undefined {
  const m = help?.match(/e\.g\.\s*([^.]+(?:\.\d+[^.]*)?)/i);
  return m ? `e.g. ${m[1].trim()}` : undefined;
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function itemTitle(item: Obj, fields: FieldDef[], fallback: string): string {
  for (const f of fields) {
    const v = item?.[f.key];
    if ((f.type === 'text' || f.type === 'textarea') && typeof v === 'string' && v.trim()) return v.trim().slice(0, 60);
  }
  return fallback;
}

function ListInput({ field, value, onChange }: { field: Extract<FieldDef, { type: 'list' }>; value: Obj[]; onChange: (v: unknown) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const noun = (field.itemLabel ?? 'Item').toLowerCase();
  const full = field.max !== undefined && value.length >= field.max;
  return (
    <div className="space-y-2">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#454545]">{field.label}</p>
      {field.help && <p className="text-[12px] text-[#626262]">{field.help}</p>}
      <div className="border border-[#E2E0DB] divide-y divide-[#E9E7E2] bg-white">
        {value.length === 0 && <p className="px-3 py-3 text-[13px] text-[#626262]">Nothing here yet.</p>}
        {value.map((item, i) => {
          const title = itemTitle(item, field.fields, `${field.itemLabel ?? 'Item'} ${i + 1}`);
          const isOpen = open === i;
          return (
            <div key={i}>
              <div className="flex items-center gap-1 pr-1">
                <button type="button" className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 text-left text-[14px]" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="truncate">{title}</span>
                </button>
                <button type="button" aria-label="Move up" className={iconBtn} disabled={i === 0} onClick={() => { onChange(move(value, i, i - 1)); setOpen(null); }}>
                  <ArrowUp size={14} />
                </button>
                <button type="button" aria-label="Move down" className={iconBtn} disabled={i === value.length - 1} onClick={() => { onChange(move(value, i, i + 1)); setOpen(null); }}>
                  <ArrowDown size={14} />
                </button>
                <button type="button" aria-label="Duplicate" className={iconBtn} disabled={full} onClick={() => onChange([...value.slice(0, i + 1), structuredClone(item), ...value.slice(i + 1)])}>
                  <Copy size={14} />
                </button>
                <button type="button" aria-label="Remove" className={`${iconBtn} hover:text-rose-600`} onClick={() => { onChange(value.filter((_, j) => j !== i)); setOpen(null); }}>
                  <Trash2 size={14} />
                </button>
              </div>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 bg-[#FAFAF7]">
                  <SchemaForm fields={field.fields} value={item} onChange={(next) => onChange(value.map((x, j) => (j === i ? next : x)))} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        disabled={full}
        onClick={() => {
          onChange([...value, emptyItem(field.fields)]);
          setOpen(value.length);
        }}
        className="inline-flex items-center gap-1.5 text-[13px] text-tk-ink hover:text-tk-accent disabled:opacity-40"
      >
        <Plus size={13} /> Add {noun}
      </button>
    </div>
  );
}

function StringsInput({ label, help, placeholder, value, onChange }: { label: string; help?: string; placeholder?: string; value: string[]; onChange: (v: unknown) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#454545]">{label}</p>
      {help && <p className="text-[12px] text-[#626262]">{help}</p>}
      {value.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <TextInput aria-label={`${label} ${i + 1}`} value={s} placeholder={placeholder} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" aria-label="Move up" className={iconBtn} disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))}>
            <ArrowUp size={14} />
          </button>
          <button type="button" aria-label="Remove" className={`${iconBtn} hover:text-rose-600`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, ''])} className="inline-flex items-center gap-1.5 text-[13px] text-tk-ink hover:text-tk-accent">
        <Plus size={13} /> Add
      </button>
    </div>
  );
}

type LookupKind = 'product' | 'collection' | 'category' | 'note' | 'page';

function useLookupFor(kind: LookupKind): LookupItem[] {
  const products = useProductLookup();
  const collections = useCollectionLookup();
  const categories = useCategoryLookup();
  const notes = useNoteLookup();
  const pages = usePageLookup();
  const map = { product: products, collection: collections, category: categories, note: notes, page: pages };
  return map[kind].data ?? [];
}

function LookupSelect({
  id,
  label,
  help,
  value,
  onChange,
  kind,
  by,
}: {
  id: string;
  label: string;
  help?: string;
  value: string;
  onChange: (v: unknown) => void;
  kind: LookupKind;
  by: 'slug' | 'id';
}) {
  const items = useLookupFor(kind);
  const options = items.map((x) => ({ value: x[by], label: x.name }));
  if (value && !options.some((o) => o.value === value)) options.unshift({ value, label: `${value} (missing)` });
  return (
    <FieldShell label={label} htmlFor={id} help={help}>
      <SearchSelect id={id} options={options} value={value || null} onChange={(v) => onChange(v || (by === 'id' ? null : ''))} allowClear placeholder={`Search ${LOOKUP_PLURAL[kind]}`} />
    </FieldShell>
  );
}

const LOOKUP_PLURAL: Record<LookupKind, string> = { product: 'products', collection: 'collections', category: 'categories', note: 'notes', page: 'pages' };

function MultiPick({ label, help, value, onChange, by }: { label: string; help?: string; value: string[]; onChange: (v: unknown) => void; by: 'slug' | 'id' }) {
  const items = useLookupFor('product');
  const id = useId();
  const name = (v: string) => items.find((x) => x[by] === v)?.name ?? v;
  return (
    <FieldShell label={label} htmlFor={id} help={help}>
      <div className="space-y-1">
        {value.map((v, i) => (
          <div key={v} className="flex items-center gap-1 border border-[#E2E0DB] bg-white px-2 py-1 text-[14px]">
            <span className="flex-1 truncate">{name(v)}</span>
            <button type="button" aria-label="Move up" className={iconBtn} disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))}>
              <ArrowUp size={13} />
            </button>
            <button type="button" aria-label={`Remove ${name(v)}`} className={`${iconBtn} hover:text-rose-600`} onClick={() => onChange(value.filter((x) => x !== v))}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <SearchSelect
          id={id}
          options={items.filter((x) => !value.includes(x[by])).map((x) => ({ value: x[by], label: x.name }))}
          value={null}
          onChange={(v) => v && onChange([...value, v])}
          placeholder="Search to add a product"
        />
      </div>
    </FieldShell>
  );
}

const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'collection', label: 'A collection' },
  { value: 'category', label: 'A category' },
  { value: 'product', label: 'A product' },
  { value: 'note', label: 'A note' },
  { value: 'page', label: 'A page' },
  { value: 'path', label: 'A page on this site (address)' },
  { value: 'url', label: 'Another website' },
];

export function LinkInput({ label, help, value, onChange }: { label: string; help?: string; value: LinkValue | null; onChange: (v: unknown) => void }) {
  const typeId = useId();
  const valueId = useId();
  const type = value?.type ?? '';
  const lookupKind = (['collection', 'category', 'product', 'note', 'page'] as const).find((k) => k === type);
  const set = (patch: Partial<LinkValue>) => {
    const next = { type: (value?.type ?? 'path') as LinkType, value: value?.value ?? '', ...patch };
    if (!next.new_tab) delete next.new_tab;
    onChange(next);
  };
  return (
    <fieldset className="space-y-2">
      <legend className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#454545]">{label}</legend>
      {help && <p className="text-[12px] text-[#626262]">{help}</p>}
      <div className="grid sm:grid-cols-2 gap-2">
        <select
          id={typeId}
          aria-label={`${label} — goes to`}
          className={selectCls}
          value={type}
          onChange={(e) => (e.target.value ? onChange({ type: e.target.value, value: '' }) : onChange(null))}
        >
          <option value="">No link</option>
          {LINK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {lookupKind ? (
          <LinkLookup id={valueId} label={label} kind={lookupKind} value={value?.value ?? ''} onChange={(v) => set({ value: v })} />
        ) : type ? (
          <TextInput
            id={valueId}
            aria-label={`${label} — address`}
            value={value?.value ?? ''}
            placeholder={type === 'url' ? 'https://…' : '/shop'}
            onChange={(e) => set({ value: e.target.value })}
          />
        ) : null}
      </div>
      {type === 'url' && (
        <label className="flex items-center gap-2 text-[13px] text-[#454545]">
          <input type="checkbox" checked={Boolean(value?.new_tab)} onChange={(e) => set({ new_tab: e.target.checked })} /> Open in a new tab
        </label>
      )}
    </fieldset>
  );
}

function LinkLookup({ id, label, kind, value, onChange }: { id: string; label: string; kind: LookupKind; value: string; onChange: (v: string) => void }) {
  const items = useLookupFor(kind);
  const extra = kind === 'page' ? [{ id: 'home', slug: 'home', name: 'Home' }] : [];
  const all = [...extra, ...items.filter((x) => !(kind === 'page' && x.slug === 'home'))];
  const options = all.map((x) => ({ value: x.slug, label: x.name }));
  if (value && !options.some((o) => o.value === value)) options.unshift({ value, label: `${value} (missing — choose another)` });
  return (
    <SearchSelect
      id={id}
      ariaLabel={`${label} — choose`}
      options={options}
      value={value || null}
      onChange={(v) => onChange(v ?? '')}
      placeholder={`Search ${LOOKUP_PLURAL[kind]}`}
    />
  );
}

const SOURCE_MODES: { value: SourceMode; label: string }[] = [
  { value: 'featured', label: 'Featured products' },
  { value: 'newest', label: 'Newest products' },
  { value: 'best_selling', label: 'Best sellers' },
  { value: 'collection', label: 'A collection' },
  { value: 'category', label: 'A category' },
  { value: 'filter', label: 'Products matching filters' },
  { value: 'manual', label: 'Products I pick' },
];

export function SourceInput({ label, help, value, onChange }: { label: string; help?: string; value: ProductSource | null; onChange: (v: unknown) => void }) {
  const id = useId();
  const src: ProductSource = value ?? { mode: 'featured', limit: 8 };
  const { data: options = [] } = useOptionLookup();
  const set = (patch: Partial<ProductSource>) => onChange({ ...src, ...patch });
  return (
    <fieldset className="border border-[#E2E0DB] p-3 space-y-3">
      <legend className="px-1 text-[12px] font-medium uppercase tracking-[0.08em] text-[#454545]">{label}</legend>
      {help && <p className="text-[12px] text-[#626262]">{help}</p>}
      <FieldShell label="Show" htmlFor={id}>
        <select id={id} className={selectCls} value={src.mode} onChange={(e) => onChange({ mode: e.target.value, limit: src.limit ?? 8 })}>
          {SOURCE_MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </FieldShell>
      {src.mode === 'collection' && (
        <LookupSelect id={`${id}-c`} label="Collection" value={src.collection ?? ''} onChange={(v) => set({ collection: String(v ?? '') })} kind="collection" by="slug" />
      )}
      {src.mode === 'category' && (
        <LookupSelect id={`${id}-k`} label="Category" value={src.category ?? ''} onChange={(v) => set({ category: String(v ?? '') })} kind="category" by="slug" />
      )}
      {src.mode === 'manual' && <MultiPick label="Products" value={src.products ?? []} onChange={(v) => set({ products: v as string[] })} by="slug" />}
      {src.mode === 'filter' && (
        <div className="space-y-2">
          <p className="text-[12px] text-[#626262]">Products must match one ticked option in every group you use.</p>
          {OPTION_KINDS.map((k) => {
            const opts = options.filter((o) => o.kind === k.kind);
            if (!opts.length) return null;
            const chosen = src.attrs?.[k.kind] ?? [];
            return (
              <div key={k.kind}>
                <p className="text-[13px] text-tk-ink mb-1">{k.label}</p>
                {opts.length > 12 ? (
                  <SearchMultiSelect
                    options={opts.map((o) => ({ value: o.slug, label: o.label }))}
                    values={chosen}
                    onChange={(nextVals) => {
                      const attrs = { ...(src.attrs ?? {}), [k.kind]: nextVals };
                      if (!nextVals.length) delete attrs[k.kind];
                      set({ attrs });
                    }}
                    placeholder={`Search ${k.label.toLowerCase()}`}
                  />
                ) : (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {opts.map((o) => (
                    <label key={o.id} className="flex items-center gap-1.5 text-[13px] text-[#454545]">
                      <input
                        type="checkbox"
                        checked={chosen.includes(o.slug)}
                        onChange={(e) => {
                          const nextVals = e.target.checked ? [...chosen, o.slug] : chosen.filter((s) => s !== o.slug);
                          const attrs = { ...(src.attrs ?? {}), [k.kind]: nextVals };
                          if (!nextVals.length) delete attrs[k.kind];
                          set({ attrs });
                        }}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {src.mode !== 'manual' && (
        <FieldShell label="How many" htmlFor={`${id}-n`}>
          <TextInput
            id={`${id}-n`}
            type="number"
            min={1}
            max={48}
            value={src.limit ?? 8}
            onChange={(e) => set({ limit: Math.min(48, Math.max(1, Number(e.target.value) || 8)) })}
            className="max-w-[120px]"
          />
        </FieldShell>
      )}
    </fieldset>
  );
}

