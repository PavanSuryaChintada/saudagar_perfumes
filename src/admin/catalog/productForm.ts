// Product editor form model: plain strings in the form, typed payload for the save_product RPC.
import type { Database } from '../../lib/database.types';

type Tables = Database['public']['Tables'];
export type ProductRow = Tables['products']['Row'];
export type VariantRow = Tables['product_variants']['Row'];
export type MediaRow = Tables['product_media']['Row'];

export interface VariantForm {
  id?: string;
  kind: 'retail' | 'sample';
  sku: string;
  size_ml: string;
  label: string;
  price: string;
  compare_at_price: string;
  weight_g: string;
  length_mm: string;
  width_mm: string;
  height_mm: string;
  is_active: boolean;
  is_hidden: boolean;
  in_sample_pool: boolean;
  initial_stock: string;
  /** Current stock, read-only in the form (changed through Add/Remove stock). */
  stock?: number;
  units_sold?: number;
}

export interface MediaForm {
  kind: 'image' | 'video';
  url: string;
  alt: string;
  variant_sku: string;
}

export interface NoteLink {
  note_id: string;
  tier: 'top' | 'heart' | 'base';
  position: number;
}

export interface AttributeLink {
  option_id: string;
  kind: string;
  strength: number | null;
  is_primary: boolean;
}

export const COMPLIANCE_FIELDS = [
  ['country_of_origin', 'Country of origin'],
  ['manufacturer_name', 'Manufacturer name'],
  ['manufacturer_address', 'Manufacturer address'],
  ['packer_name', 'Packer name'],
  ['packer_address', 'Packer address'],
  ['importer_name', 'Importer name'],
  ['importer_address', 'Importer address'],
  ['consumer_care', 'Consumer care (phone / email / address)'],
  ['shelf_life', 'Best before / shelf life'],
  ['ingredients', 'Ingredients'],
  ['allergens', 'Allergens'],
  ['caution_text', 'Caution text'],
  ['hsn_code', 'HSN code'],
  ['gst_rate', 'GST rate (%)'],
] as const;
type ComplianceKey = (typeof COMPLIANCE_FIELDS)[number][0];

const TEXT_FIELDS = [
  'slug', 'name', 'short_description', 'description', 'primary_category_id', 'badge', 'concentration_note', 'perfumer',
  'inspiration', 'how_to_wear', 'seo_title', 'seo_description', 'admin_note',
] as const;
type TextKey = (typeof TEXT_FIELDS)[number];

export type ProductForm = { id?: string } & Record<TextKey, string> & Record<ComplianceKey, string> & {
  /** 'ml' = perfume kept as liquid; 'piece' = counted per size. Changes later through set_stock_mode. */
  stock_unit: 'ml' | 'piece';
  /** Liquid left (read-only, existing products). */
  stock_ml: number;
  /** New perfumes: the liquid they start with, in the unit chosen. */
  liquid_amount: string;
  liquid_unit: 'ml' | 'L' | 'tola';
  base_price: string;
  compare_at_price: string;
  launch_year: string;
  is_featured: boolean;
  is_active: boolean;
  counts_toward_samples: boolean;
  ships_surface_only: boolean;
  /** Shown as "Vegan" / "Cruelty free" on the product page. */
  is_vegan: boolean;
  is_cruelty_free: boolean;
  category_ids: string[];
  collection_ids: string[];
  /** Hand-picked “You may also appreciate” products, in order. Empty = automatic. */
  related_product_ids: string[];
  notes: NoteLink[];
  attributes: AttributeLink[];
  media: MediaForm[];
  variants: VariantForm[];
  /** Extra product-page sections (accordions) for this product only. */
  page_sections: PageSectionForm[];
  /** Also show the store-wide sections from Site content → Product page. */
  use_default_sections: boolean;
};

export interface PageSectionForm {
  title: string;
  body: string;
}

/** Groups of details that can be copied from another product in the editor. */
export const COPY_GROUPS = [
  { key: 'text', label: 'Short and full description' },
  { key: 'scent', label: 'Scent type (family, accords, concentration…)' },
  { key: 'notes', label: 'Notes pyramid' },
  { key: 'story', label: 'Story (perfumer, inspiration, how to wear)' },
  { key: 'compliance', label: 'Details & compliance' },
  { key: 'sections', label: 'Product page sections' },
  { key: 'organisation', label: 'Categories and collections' },
  { key: 'sizes', label: 'Sizes and prices (new SKUs are made for this product)' },
] as const;
export type CopyGroup = (typeof COPY_GROUPS)[number]['key'];

/** Copies the chosen groups of details from another product's form into this one. */
export function copyProductDetails(target: ProductForm, source: ProductForm, groups: CopyGroup[]): ProductForm {
  const next: ProductForm = { ...target };
  const has = (g: CopyGroup) => groups.includes(g);
  if (has('text')) {
    next.short_description = source.short_description;
    next.description = source.description;
    next.concentration_note = source.concentration_note;
  }
  if (has('scent')) next.attributes = source.attributes.map((a) => ({ ...a }));
  if (has('notes')) next.notes = source.notes.map((n) => ({ ...n }));
  if (has('story')) {
    next.perfumer = source.perfumer;
    next.inspiration = source.inspiration;
    next.how_to_wear = source.how_to_wear;
  }
  if (has('compliance')) {
    for (const [k] of COMPLIANCE_FIELDS) next[k] = source[k];
    next.is_vegan = source.is_vegan;
    next.is_cruelty_free = source.is_cruelty_free;
  }
  if (has('sections')) {
    next.page_sections = source.page_sections.map((x) => ({ ...x }));
    next.use_default_sections = source.use_default_sections;
  }
  if (has('sizes')) {
    next.base_price = source.base_price;
    next.compare_at_price = source.compare_at_price;
    next.variants = source.variants
      .filter((v) => !v.is_hidden)
      .map((v) => ({ ...v, id: undefined, sku: '', initial_stock: '', stock: undefined, units_sold: undefined }));
  }
  if (has('organisation')) {
    next.primary_category_id = source.primary_category_id;
    next.category_ids = [...source.category_ids];
    next.collection_ids = [...source.collection_ids];
  }
  return next;
}

export function emptyVariant(): VariantForm {
  return {
    kind: 'retail', sku: '', size_ml: '', label: '', price: '', compare_at_price: '', weight_g: '', length_mm: '', width_mm: '',
    height_mm: '', is_active: true, is_hidden: false, in_sample_pool: false, initial_stock: '',
  };
}

export function emptyProductForm(defaults: Partial<Record<ComplianceKey, string>> = {}): ProductForm {
  const text = Object.fromEntries(TEXT_FIELDS.map((k) => [k, ''])) as Record<TextKey, string>;
  const compliance = Object.fromEntries(COMPLIANCE_FIELDS.map(([k]) => [k, ''])) as Record<ComplianceKey, string>;
  return {
    ...text,
    ...compliance,
    country_of_origin: 'India',
    hsn_code: '3303',
    gst_rate: '18',
    caution_text: 'For external use only. Flammable: keep away from heat and open flame.',
    ...defaults,
    stock_unit: 'ml',
    stock_ml: 0,
    liquid_amount: '',
    liquid_unit: 'ml',
    base_price: '',
    compare_at_price: '',
    launch_year: '',
    is_featured: false,
    is_active: false,
    counts_toward_samples: true,
    ships_surface_only: true,
    is_vegan: false,
    is_cruelty_free: false,
    category_ids: [],
    collection_ids: [],
    related_product_ids: [],
    notes: [],
    attributes: [],
    media: [],
    variants: [],
    page_sections: [],
    use_default_sections: true,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const isMoney = (v: string) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;
const optionalMoney = (v: string) => v.trim() === '' || isMoney(v);
const toNum = (v: string) => (v.trim() === '' ? null : Number(v));
const toInt = (v: string) => (v.trim() === '' ? null : Math.round(Number(v)));
const blankToNull = (v: string) => (v.trim() === '' ? null : v.trim());

export function validateProductForm(f: ProductForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.primary_category_id) e.primary_category_id = 'Choose a category first.';
  if (!f.name.trim()) e.name = 'Enter the product name.';
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) e.slug = 'Use lowercase letters, numbers and dashes only.';
  if (!isMoney(f.base_price)) e.base_price = 'Enter the price in rupees.';
  if (!optionalMoney(f.compare_at_price)) e.compare_at_price = 'Enter a valid MRP or leave it empty.';
  if (f.launch_year.trim() && !(Number(f.launch_year) >= 1900 && Number(f.launch_year) <= 2100)) e.launch_year = 'Enter a year from 1900.';
  if (f.gst_rate.trim() && !(Number(f.gst_rate) >= 0 && Number(f.gst_rate) <= 100)) e.gst_rate = 'GST must be between 0 and 100.';

  if (!f.id && f.stock_unit === 'ml' && f.liquid_amount.trim() && !(Number(f.liquid_amount) >= 0)) {
    e.liquid_amount = 'Enter how much you have, e.g. 1 (L) or 500 (ml).';
  }
  const live = f.variants.filter((v) => v.kind === 'retail' && !v.is_hidden);
  if (live.length === 0) e.variants = 'Add at least one bottle size.';
  const seen = new Set<string>();
  f.variants.forEach((v, i) => {
    const sku = v.sku.trim().toUpperCase();
    const finalSku = sku || autoSku(f.slug, v).toUpperCase();
    if (!finalSku) e[`variants.${i}.sku`] = 'Enter a SKU.';
    else if (seen.has(finalSku)) e[`variants.${i}.sku`] = 'This SKU is already used above. Change one of them.';
    seen.add(finalSku);
    if (f.stock_unit === 'ml' && v.kind === 'retail' && !v.is_hidden && !(Number(v.size_ml) > 0)) {
      e[`variants.${i}.size_ml`] = 'Enter the size in ml; this perfume is kept as liquid.';
    }
    if (!v.label.trim()) e[`variants.${i}.label`] = 'Enter a label, e.g. 50 ml.';
    if (v.size_ml.trim() && !(Number(v.size_ml) > 0)) e[`variants.${i}.size_ml`] = 'Size must be above 0.';
    if (!optionalMoney(v.price)) e[`variants.${i}.price`] = 'Enter a valid price or leave empty to use the base price.';
    if (!optionalMoney(v.compare_at_price)) e[`variants.${i}.compare_at_price`] = 'Enter a valid MRP.';
    if (v.initial_stock.trim() && !(Number.isInteger(Number(v.initial_stock)) && Number(v.initial_stock) >= 0)) {
      e[`variants.${i}.initial_stock`] = 'Opening stock must be a whole number.';
    }
  });
  if (f.attributes.some((a) => a.kind === 'accord' && a.strength !== null && !(a.strength >= 1 && a.strength <= 100))) {
    e.attributes = 'Accord strength must be between 1 and 100.';
  }
  return e;
}

export function toSavePayload(f: ProductForm): Record<string, unknown> {
  const text = Object.fromEntries(TEXT_FIELDS.map((k) => [k, blankToNull(f[k])]));
  const compliance = Object.fromEntries(COMPLIANCE_FIELDS.map(([k]) => [k, k === 'gst_rate' ? toNum(f.gst_rate) : blankToNull(f[k])]));
  return {
    ...(f.id ? { id: f.id } : {}),
    ...text,
    ...compliance,
    slug: f.slug.trim(),
    name: f.name.trim(),
    base_price: Number(f.base_price),
    compare_at_price: toNum(f.compare_at_price),
    launch_year: toInt(f.launch_year),
    is_featured: f.is_featured,
    is_active: f.is_active,
    counts_toward_samples: f.counts_toward_samples,
    ships_surface_only: f.ships_surface_only,
    is_vegan: f.is_vegan,
    is_cruelty_free: f.is_cruelty_free,
    stock_unit: f.stock_unit,
    liquid_ml: !f.id && f.stock_unit === 'ml' && f.liquid_amount.trim() ? liquidMl(f.liquid_amount, f.liquid_unit) : null,
    category_ids: f.category_ids,
    collection_ids: f.collection_ids,
    related_product_ids: f.related_product_ids,
    notes: f.notes.map((n, i) => ({ note_id: n.note_id, tier: n.tier, position: n.position ?? i })),
    attributes: f.attributes.map((a) => ({ option_id: a.option_id, strength: a.strength, is_primary: a.is_primary })),
    media: f.media.map((m) => ({ kind: m.kind, url: m.url, alt: blankToNull(m.alt), variant_sku: blankToNull(m.variant_sku) })),
    variants: f.variants.map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      kind: v.kind,
      sku: (v.sku.trim() || autoSku(f.slug, v)).toUpperCase(),
      size_ml: toNum(v.size_ml),
      label: v.label.trim(),
      price: toNum(v.price),
      compare_at_price: toNum(v.compare_at_price),
      weight_g: toInt(v.weight_g),
      length_mm: toInt(v.length_mm),
      width_mm: toInt(v.width_mm),
      height_mm: toInt(v.height_mm),
      is_active: v.is_active,
      is_hidden: v.is_hidden,
      in_sample_pool: v.in_sample_pool,
      initial_stock: v.id || f.stock_unit === 'ml' ? null : toInt(v.initial_stock),
    })),
  };
}

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export interface AdminProductBundle {
  product: ProductRow;
  variants: VariantRow[];
  media: MediaRow[];
  categoryIds: string[];
  collectionIds: string[];
  notes: NoteLink[];
  attributes: AttributeLink[];
}

export function fromAdminProduct(b: AdminProductBundle): ProductForm {
  const p = b.product as unknown as Record<string, unknown>;
  const base = emptyProductForm();
  const text = Object.fromEntries(TEXT_FIELDS.map((k) => [k, str(p[k])])) as Record<TextKey, string>;
  const compliance = Object.fromEntries(COMPLIANCE_FIELDS.map(([k]) => [k, str(p[k])])) as Record<ComplianceKey, string>;
  const skuById = new Map(b.variants.map((v) => [v.id, v.sku]));
  return {
    ...base,
    ...text,
    ...compliance,
    id: b.product.id,
    stock_unit: (p.stock_unit === 'piece' ? 'piece' : 'ml') as 'ml' | 'piece',
    stock_ml: Number(p.stock_ml ?? 0),
    base_price: str(b.product.base_price),
    compare_at_price: str(b.product.compare_at_price),
    launch_year: str(b.product.launch_year),
    is_featured: !!b.product.is_featured,
    is_active: !!b.product.is_active,
    counts_toward_samples: b.product.counts_toward_samples ?? true,
    ships_surface_only: !!b.product.ships_surface_only,
    is_vegan: !!b.product.is_vegan,
    is_cruelty_free: !!b.product.is_cruelty_free,
    category_ids: b.categoryIds,
    collection_ids: b.collectionIds,
    related_product_ids: Array.isArray(p.related_product_ids) ? (p.related_product_ids as string[]) : [],
    page_sections: Array.isArray(p.page_sections)
      ? (p.page_sections as { title?: unknown; body?: unknown }[]).map((x) => ({ title: str(x?.title), body: str(x?.body) }))
      : [],
    use_default_sections: p.use_default_sections !== false,
    notes: [...b.notes].sort((x, y) => x.position - y.position),
    attributes: b.attributes,
    media: [...b.media]
      .sort((x, y) => x.position - y.position)
      .map((m) => ({ kind: m.kind as 'image' | 'video', url: m.url, alt: str(m.alt), variant_sku: m.variant_id ? str(skuById.get(m.variant_id)) : '' })),
    variants: [...b.variants]
      .sort((x, y) => (x.position ?? 0) - (y.position ?? 0))
      .map((v) => ({
        id: v.id,
        kind: v.kind as 'retail' | 'sample',
        sku: v.sku,
        size_ml: str(v.size_ml),
        label: v.label,
        price: str(v.price),
        compare_at_price: str(v.compare_at_price),
        weight_g: str(v.weight_g),
        length_mm: str(v.length_mm),
        width_mm: str(v.width_mm),
        height_mm: str(v.height_mm),
        is_active: v.is_active ?? true,
        is_hidden: !!v.is_hidden,
        in_sample_pool: !!v.in_sample_pool,
        initial_stock: '',
        stock: v.stock,
        units_sold: v.units_sold,
      })),
  };
}

const UNIT_ML: Record<string, number> = { ml: 1, L: 1000, tola: 11.66 };
/** Amount in the chosen unit → ml. */
export function liquidMl(amount: string, unit: string): number {
  return Math.round(Number(amount) * (UNIT_ML[unit] ?? 1) * 100) / 100;
}

/** SKU from the web address and size: amber-noir + 50 ml → AMBER-NOIR-50 (sample vials get -S5). */
export function autoSku(slug: string, v: Pick<VariantForm, 'kind' | 'size_ml' | 'label'>): string {
  const base = (slug || 'ITEM').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const size = v.size_ml.trim() || v.label.replace(/[^0-9.]+/g, '') || '';
  return `${base}-${v.kind === 'sample' ? 'S' : ''}${size || '1'}`.slice(0, 60);
}
