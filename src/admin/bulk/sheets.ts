// Spreadsheet round-trips: prices and stock for every size, and new products from a sheet. Pure functions so the
// preview the admin sees is exactly what gets saved.
import { csvObjects } from '../../lib/csvParse';
import { toCsv } from '../export/csv';
import { emptyProductForm, emptyVariant, slugify, validateProductForm, type NoteLink, type ProductForm } from '../catalog/productForm';

// ============================================================ prices and stock
export interface VariantRow {
  sku: string;
  product: string;
  label: string;
  kind: string;
  base_price: number;
  price: number | null;
  compare_at_price: number | null;
  stock: number;
}

export const PRICE_STOCK_COLUMNS = ['SKU', 'Product', 'Size', 'Type', 'Base price (₹)', 'Price (₹)', 'Compare-at price (₹)', 'Stock'];

export function priceStockSheet(rows: VariantRow[]): string {
  return toCsv(
    rows.map((r) => ({
      SKU: r.sku,
      Product: r.product,
      Size: r.label,
      Type: r.kind === 'sample' ? 'sample vial' : 'bottle',
      'Base price (₹)': r.base_price,
      'Price (₹)': r.price ?? '',
      'Compare-at price (₹)': r.compare_at_price ?? '',
      Stock: r.stock,
    })),
    PRICE_STOCK_COLUMNS,
  );
}

export interface FieldChange {
  from: string;
  to: string;
}
export interface SizeChange {
  sku: string;
  product: string;
  label: string;
  price?: FieldChange;
  compare_at_price?: FieldChange;
  stock?: FieldChange;
  /** What bulk_update_variants receives (only the fields that change). */
  payload: Record<string, unknown>;
}
export interface SheetProblem {
  line: number;
  sku: string;
  message: string;
}

const money = (n: number | null) => (n === null ? 'base price' : `₹${n.toLocaleString('en-IN')}`);
const parseMoney = (v: string): number | null | 'bad' => {
  const t = v.replace(/[₹,\s]/g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 'bad';
};

/** Compares an uploaded sheet with the store. Columns that are missing from the sheet are left alone. */
export function diffPriceStock(text: string, current: VariantRow[]): { changes: SizeChange[]; problems: SheetProblem[]; rows: number } {
  const { headers, rows } = csvObjects(text);
  if (!headers.includes('sku')) {
    return { changes: [], problems: [{ line: 1, sku: '', message: 'The sheet needs a SKU column. Start from “Download the current sheet”.' }], rows: 0 };
  }
  const bySku = new Map(current.map((v) => [v.sku.toUpperCase(), v]));
  const hasPrice = headers.includes('price');
  const hasCompare = headers.includes('compare_at_price');
  const hasStock = headers.includes('stock');
  const seen = new Set<string>();
  const changes: SizeChange[] = [];
  const problems: SheetProblem[] = [];

  rows.forEach((r, i) => {
    const line = i + 2;
    const sku = (r.sku ?? '').trim().toUpperCase();
    if (!sku) return;
    if (seen.has(sku)) return void problems.push({ line, sku, message: 'This SKU appears twice in the sheet; only the first row is used.' });
    seen.add(sku);
    const v = bySku.get(sku);
    if (!v) return void problems.push({ line, sku, message: 'No size has this SKU. Add new sizes from the product page or the import tab.' });

    const change: SizeChange = { sku: v.sku, product: v.product, label: v.label, payload: { sku: v.sku } };
    if (hasPrice) {
      const p = parseMoney(r.price ?? '');
      if (p === 'bad') return void problems.push({ line, sku, message: `Price “${r.price}” isn't a number.` });
      if (p !== v.price) {
        change.price = { from: money(v.price), to: money(p) };
        change.payload.price = p;
      }
    }
    if (hasCompare) {
      const c = parseMoney(r.compare_at_price ?? '');
      if (c === 'bad') return void problems.push({ line, sku, message: `Compare-at price “${r.compare_at_price}” isn't a number.` });
      if (c !== v.compare_at_price) {
        change.compare_at_price = { from: v.compare_at_price === null ? 'none' : money(v.compare_at_price), to: c === null ? 'none' : money(c) };
        change.payload.compare_at_price = c;
      }
    }
    if (hasStock && (r.stock ?? '').trim() !== '') {
      const n = Number((r.stock ?? '').replace(/[,\s]/g, ''));
      if (!Number.isInteger(n) || n < 0) return void problems.push({ line, sku, message: `Stock “${r.stock}” must be a whole number, 0 or more.` });
      if (n !== v.stock) {
        change.stock = { from: String(v.stock), to: String(n) };
        change.payload.stock = n;
      }
    }
    if (change.price || change.compare_at_price || change.stock) changes.push(change);
  });
  return { changes, problems, rows: rows.length };
}

// ============================================================ new products
export const IMPORT_COLUMNS = [
  'handle', 'name', 'main_category', 'also_list_under', 'collections', 'top_notes', 'heart_notes', 'base_notes',
  'short_description', 'description', 'base_price', 'gst_rate', 'hsn_code', 'size_label', 'size_ml', 'sku', 'size_price', 'stock', 'live',
];

export const IMPORT_TEMPLATE = toCsv(
  [
    {
      handle: 'amber-noir', name: 'Amber Noir', main_category: 'Perfumes', also_list_under: 'Gift sets', collections: 'The Oud Edit',
      top_notes: 'Saffron | Pink pepper', heart_notes: 'Rose', base_notes: 'Amber | Oud', short_description: 'A warm amber for evenings.',
      description: 'Long description shown on the product page.', base_price: '4900', gst_rate: '18', hsn_code: '3303',
      size_label: '50 ml', size_ml: '50', sku: 'AMBER-NOIR-50', size_price: '', stock: '20', live: 'no',
    },
    { handle: 'amber-noir', size_label: '100 ml', size_ml: '100', sku: 'AMBER-NOIR-100', size_price: '7900', stock: '10' },
  ],
  IMPORT_COLUMNS,
);

export interface Lookup {
  id: string;
  name: string;
  slug?: string;
}

export interface ImportContext {
  categories: Lookup[];
  collections: Lookup[];
  notes: Lookup[];
  existingSlugs: Set<string>;
  existingSkus: Set<string>;
}

export interface PlannedProduct {
  handle: string;
  line: number;
  form: ProductForm;
  sizes: number;
  /** Names that don't exist yet and will be created on import. */
  create: { categories: string[]; collections: string[]; notes: string[] };
  /** Notes by tier as typed, resolved to ids at import time. */
  noteNames: { tier: NoteLink['tier']; name: string }[];
  mainCategory: string;
  extraCategories: string[];
  collectionNames: string[];
  errors: string[];
}

const list = (v: string | undefined) =>
  (v ?? '')
    .split(/[|;]/)
    .map((x) => x.trim())
    .filter(Boolean);
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const yes = (v: string | undefined) => /^(y|yes|true|1|live|on)$/i.test((v ?? '').trim());

/** Finds a category by name, slug or "Parent > Child" path. */
function findByName(items: Lookup[], name: string): Lookup | undefined {
  const last = name.split(/>|›/).pop()!.trim();
  const n = norm(last);
  return items.find((c) => norm(c.name) === n || (c.slug && c.slug === slugify(last)));
}

/** Groups sheet rows into products (one row per size; product details on the first row of each handle). */
export function planImport(text: string, ctx: ImportContext): { products: PlannedProduct[]; problems: string[] } {
  const { headers, rows } = csvObjects(text);
  const problems: string[] = [];
  if (!headers.includes('name') && !headers.includes('handle')) {
    return { products: [], problems: ['The sheet needs at least the handle and name columns. Start from “Download the template”.'] };
  }
  const byHandle = new Map<string, { line: number; rows: Record<string, string>[] }>();
  rows.forEach((r, i) => {
    const handle = slugify(r.handle || r.name || '');
    if (!handle) return void problems.push(`Row ${i + 2}: no handle or name, so it was skipped.`);
    const g = byHandle.get(handle) ?? { line: i + 2, rows: [] };
    g.rows.push(r);
    byHandle.set(handle, g);
  });

  const sheetSkus = new Set<string>();
  const products: PlannedProduct[] = [];
  for (const [handle, g] of byHandle) {
    const first = g.rows[0];
    const errors: string[] = [];
    const form = emptyProductForm({ gst_rate: first.gst_rate || '18', hsn_code: first.hsn_code || '3303' });
    form.slug = handle;
    form.name = first.name ?? '';
    form.short_description = first.short_description ?? '';
    form.description = first.description ? `<p>${escapeHtml(first.description)}</p>` : '';
    form.base_price = (first.base_price ?? '').replace(/[₹,\s]/g, '');
    form.is_active = yes(first.live);
    if (ctx.existingSlugs.has(handle)) errors.push(`A product with the handle “${handle}” already exists. Update it from its product page or the prices & stock tab.`);

    const mainCategory = (first.main_category ?? '').trim();
    const extraCategories = list(first.also_list_under);
    const collectionNames = list(first.collections);
    const noteNames = (['top', 'heart', 'base'] as const).flatMap((tier) => list(first[`${tier}_notes`]).map((name) => ({ tier, name })));
    if (!mainCategory) errors.push('Add a main_category.');
    // Placeholder id so validation passes; the real id is filled in at import time.
    form.primary_category_id = mainCategory ? 'pending' : '';

    form.variants = g.rows.map((r) => {
      const v = emptyVariant();
      v.label = r.size_label || (r.size_ml ? `${r.size_ml} ml` : '');
      v.size_ml = r.size_ml ?? '';
      v.sku = (r.sku ?? '').trim().toUpperCase();
      v.price = (r.size_price ?? '').replace(/[₹,\s]/g, '');
      v.initial_stock = (r.stock ?? '').replace(/[,\s]/g, '');
      return v;
    });
    for (const v of form.variants) {
      if (!v.sku) continue;
      if (ctx.existingSkus.has(v.sku)) errors.push(`SKU ${v.sku} is already used by another size.`);
      if (sheetSkus.has(v.sku)) errors.push(`SKU ${v.sku} appears twice in the sheet.`);
      sheetSkus.add(v.sku);
    }
    errors.push(...Object.values(validateProductForm(form)).filter((m) => m !== 'Choose a category first.'));

    const missing = (items: Lookup[], names: string[]) => names.filter((n) => !findByName(items, n));
    products.push({
      handle,
      line: g.line,
      form,
      sizes: form.variants.length,
      create: {
        categories: missing(ctx.categories, [mainCategory, ...extraCategories].filter(Boolean)),
        collections: missing(ctx.collections, collectionNames),
        notes: [...new Set(missing(ctx.notes, noteNames.map((n) => n.name)))],
      },
      noteNames,
      mainCategory,
      extraCategories,
      collectionNames,
      errors: [...new Set(errors)],
    });
  }
  return { products, problems };
}

/** Fills in the category, collection and note ids once they all exist. */
export function resolveIds(p: PlannedProduct, ctx: Pick<ImportContext, 'categories' | 'collections' | 'notes'>): ProductForm {
  const id = (items: Lookup[], name: string) => findByName(items, name)?.id;
  const form = { ...p.form };
  form.primary_category_id = id(ctx.categories, p.mainCategory) ?? '';
  form.category_ids = p.extraCategories.map((n) => id(ctx.categories, n)).filter((x): x is string => !!x && x !== form.primary_category_id);
  form.collection_ids = p.collectionNames.map((n) => id(ctx.collections, n)).filter((x): x is string => !!x);
  form.notes = p.noteNames
    .map((n, i) => ({ note_id: id(ctx.notes, n.name) ?? '', tier: n.tier, position: i }))
    .filter((n) => n.note_id);
  return form;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n+/g, '</p><p>');
}

export { findByName };
