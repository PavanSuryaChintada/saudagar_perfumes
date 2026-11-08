import { describe, expect, it } from 'vitest';
import { IMPORT_TEMPLATE, diffPriceStock, planImport, priceStockSheet, resolveIds, type VariantRow } from './sheets';

const current: VariantRow[] = [
  { sku: 'OUD-50', product: 'Oud', label: '50 ml', kind: 'retail', base_price: 4900, price: null, compare_at_price: null, stock: 10 },
  { sku: 'OUD-100', product: 'Oud', label: '100 ml', kind: 'retail', base_price: 4900, price: 7900, compare_at_price: null, stock: 4 },
];

describe('diffPriceStock', () => {
  it('round-trips: the downloaded sheet changes nothing', () => {
    expect(diffPriceStock(priceStockSheet(current), current).changes).toEqual([]);
  });
  it('lists only what changes, and what is wrong', () => {
    const sheet = 'SKU,Price (₹),Stock\nOUD-50,"5,200",12\noud-100,,4\nNOPE,1,1\nOUD-50,1,1\nOUD-100,abc,1';
    const { changes, problems } = diffPriceStock(sheet, current);
    expect(changes.map((c) => [c.sku, c.payload])).toEqual([
      ['OUD-50', { sku: 'OUD-50', price: 5200, stock: 12 }],
      ['OUD-100', { sku: 'OUD-100', price: null }],
    ]);
    expect(changes[1].price).toEqual({ from: '₹7,900', to: 'base price' });
    expect(problems.map((p) => p.sku)).toEqual(['NOPE', 'OUD-50', 'OUD-100']);
  });
  it('leaves columns that are not in the sheet alone', () => {
    const { changes } = diffPriceStock('SKU,Stock\nOUD-100,9', current);
    expect(changes[0].payload).toEqual({ sku: 'OUD-100', stock: 9 });
  });
  it('asks for a SKU column', () => {
    expect(diffPriceStock('Product,Stock\nOud,1', current).problems[0].message).toMatch(/SKU column/);
  });
});

describe('planImport', () => {
  const ctx = {
    categories: [{ id: 'c1', name: 'Perfumes', slug: 'perfumes' }],
    collections: [],
    notes: [{ id: 'n1', name: 'Rose' }],
    existingSlugs: new Set<string>(),
    existingSkus: new Set<string>(),
  };
  it('reads the template as one product with two sizes and lists what will be created', () => {
    const { products, problems } = planImport(IMPORT_TEMPLATE, ctx);
    expect(problems).toEqual([]);
    expect(products).toHaveLength(1);
    const p = products[0];
    expect(p.errors).toEqual([]);
    expect(p.sizes).toBe(2);
    expect(p.form.variants.map((v) => v.sku)).toEqual(['AMBER-NOIR-50', 'AMBER-NOIR-100']);
    expect(p.create.categories).toEqual(['Gift sets']);
    expect(p.create.collections).toEqual(['The Oud Edit']);
    expect(p.create.notes).toEqual(['Saffron', 'Pink pepper', 'Amber', 'Oud']);
    const form = resolveIds(p, { ...ctx, categories: [...ctx.categories, { id: 'c2', name: 'Gift sets' }], notes: [...ctx.notes, { id: 'n2', name: 'Oud' }] });
    expect(form.primary_category_id).toBe('c1');
    expect(form.category_ids).toEqual(['c2']);
    expect(form.notes.map((n) => [n.note_id, n.tier])).toEqual([['n1', 'heart'], ['n2', 'base']]);
  });
  it('refuses handles and SKUs that already exist', () => {
    const { products } = planImport(IMPORT_TEMPLATE, { ...ctx, existingSlugs: new Set(['amber-noir']), existingSkus: new Set(['AMBER-NOIR-50']) });
    expect(products[0].errors.join(' ')).toMatch(/already exists/);
    expect(products[0].errors.join(' ')).toMatch(/AMBER-NOIR-50 is already used/);
  });
  it('needs a main category and a price', () => {
    const { products } = planImport('handle,name,sku,size_label\nx,X,X-1,50 ml', ctx);
    expect(products[0].errors).toEqual(expect.arrayContaining(['Add a main_category.', 'Enter the price in rupees.']));
  });
});
