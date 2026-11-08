// Listing filters live in the URL so a filtered page can be shared, refreshed and navigated back to.

export const ATTRIBUTE_KINDS = [
  'family', 'concentration', 'intensity', 'occasion', 'season', 'time_of_day', 'gender', 'longevity', 'sillage', 'accord',
] as const;
export type AttributeKind = (typeof ATTRIBUTE_KINDS)[number];

export const SORTS = ['featured', 'newest', 'price_asc', 'price_desc', 'best_selling'] as const;
export type Sort = (typeof SORTS)[number];

export interface ListingFilters {
  q?: string;
  sort?: Sort;
  page?: number;
  notes?: string[];
  families?: string[];
  attrs: Partial<Record<AttributeKind, string[]>>;
  min?: number;
  max?: number;
  sizes?: number[];
  inStock?: boolean;
  categories?: string[];
  collections?: string[];
  onSale?: boolean;
  isNew?: boolean;
}

export interface ListingContext {
  collection?: string;
  category?: string;
  note?: string;
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const list = (v: string | null) => (v ? v.split(',').map((s) => s.trim()).filter((s) => SLUG.test(s)) : []);
const num = (v: string | null) => {
  if (v === null || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function filtersFromSearch(sp: URLSearchParams): ListingFilters {
  const f: ListingFilters = { attrs: {} };
  const q = sp.get('q')?.trim();
  if (q) f.q = q.slice(0, 80);
  const sort = sp.get('sort');
  if (sort && (SORTS as readonly string[]).includes(sort)) f.sort = sort as Sort;
  const page = num(sp.get('page'));
  if (page && Number.isInteger(page) && page >= 1) f.page = page;
  const notes = list(sp.get('notes'));
  if (notes.length) f.notes = notes;
  const families = list(sp.get('families'));
  if (families.length) f.families = families;
  for (const kind of ATTRIBUTE_KINDS) {
    const vals = list(sp.get(kind));
    if (vals.length) f.attrs[kind] = vals;
  }
  const min = num(sp.get('min'));
  if (min !== undefined) f.min = min;
  const max = num(sp.get('max'));
  if (max !== undefined) f.max = max;
  const sizes = (sp.get('size') ?? '').split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (sizes.length) f.sizes = sizes;
  if (sp.get('stock') === '1') f.inStock = true;
  const cats = list(sp.get('cat'));
  if (cats.length) f.categories = cats;
  const cols = list(sp.get('col'));
  if (cols.length) f.collections = cols;
  if (sp.get('sale') === '1') f.onSale = true;
  if (sp.get('new') === '1') f.isNew = true;
  return f;
}

/** Stable key order, commas kept readable. */
export function filtersToSearch(f: ListingFilters): string {
  const parts: string[] = [];
  const add = (k: string, v: string) => parts.push(`${k}=${v}`);
  if (f.q) add('q', encodeURIComponent(f.q));
  if (f.sort && f.sort !== 'featured') add('sort', f.sort);
  if (f.page && f.page > 1) add('page', String(f.page));
  if (f.notes?.length) add('notes', f.notes.join(','));
  if (f.families?.length) add('families', f.families.join(','));
  for (const kind of ATTRIBUTE_KINDS) {
    const vals = f.attrs[kind];
    if (vals?.length) add(kind, vals.join(','));
  }
  if (f.min !== undefined) add('min', String(f.min));
  if (f.max !== undefined) add('max', String(f.max));
  if (f.sizes?.length) add('size', f.sizes.join(','));
  if (f.inStock) add('stock', '1');
  if (f.categories?.length) add('cat', f.categories.join(','));
  if (f.collections?.length) add('col', f.collections.join(','));
  if (f.onSale) add('sale', '1');
  if (f.isNew) add('new', '1');
  return parts.join('&');
}

export function activeFilterCount(f: ListingFilters): number {
  return (
    (f.notes?.length ?? 0) +
    (f.families?.length ?? 0) +
    Object.values(f.attrs).reduce((n, v) => n + (v?.length ?? 0), 0) +
    (f.min !== undefined ? 1 : 0) +
    (f.max !== undefined ? 1 : 0) +
    (f.sizes?.length ?? 0) +
    (f.inStock ? 1 : 0) +
    (f.categories?.length ?? 0) +
    (f.collections?.length ?? 0) +
    (f.onSale ? 1 : 0) +
    (f.isNew ? 1 : 0)
  );
}

export function toggleValue(values: string[] | undefined, value: string): string[] {
  const set = new Set(values ?? []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set];
}

/** The payload for the search_products RPC. */
export function toSearchPayload(f: ListingFilters, ctx: ListingContext, pageSize = 24): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...ctx };
  if (f.q) payload.q = f.q;
  if (f.notes?.length) payload.notes = f.notes;
  if (f.families?.length) payload.note_families = f.families;
  payload.attrs = f.attrs;
  if (f.min !== undefined) payload.price_min = f.min;
  if (f.max !== undefined) payload.price_max = f.max;
  if (f.sizes?.length) payload.sizes = f.sizes;
  if (f.inStock) payload.in_stock = true;
  if (f.categories?.length) payload.categories = f.categories;
  if (f.collections?.length) payload.collections = f.collections;
  if (f.onSale) payload.on_sale = true;
  if (f.isNew) payload.new = true;
  payload.page = f.page ?? 1;
  payload.page_size = pageSize;
  payload.sort = f.sort ?? 'featured';
  return payload;
}
