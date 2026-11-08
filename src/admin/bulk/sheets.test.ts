import { describe, expect, it } from 'vitest';
import { IMPORT_TEMPLATE, diffPriceStock, planImport, priceStockSheet, resolveIds, type VariantRow } from './sheets';

const current: VariantRow[] = [
  { sku: 'OUD-50', product_id: 'p1', product: 'Oud', stock_unit: 'piece', liquid_ml: 0, label: '50 ml', kind: 'retail', base_price: 4900, price: null, compare_at_price: null, stock: 10 },
  { sku: 'OUD-100', product_id: 'p1', product: 'Oud', stock_unit: 'piece', liquid_ml: 0, label: '100 ml', kind: 'retail', base_price: 4900, price: 7900, compare_at_price: null, stock: 4 },
  { sku: 'ROSE-30', product_id: 'p2', product: 'Rose', stock_unit: 'ml', liquid_ml: 900, label: '30 ml', kind: 'retail', base_price: 2000, price: null, compare_at_price: null, stock: 30 },
  { sku: 'ROSE-50', product_id: 'p2', product: 'Rose', stock_unit: 'ml', liquid_ml: 900, label: '50 ml', kind: 'retail', base_price: 2000, price: 3000, compare_at_price: null, stock: 18 },
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
  it('changes a perfume\'s liquid once, and refuses a per-size count for it', () => {
    const { changes, problems } = diffPriceStock('SKU,Liquid left (ml),Stock\nROSE-30,1200,\nROSE-50,5,99', current);
    expect(changes.map((c) => c.payload)).toEqual([{ sku: 'ROSE-30', liquid_ml: 1200 }]);
    expect(changes[0].liquid).toEqual({ from: '900 ml', to: '1,200 ml' });
    expect(problems.map((p) => p.message).join(' ')).toMatch(/different Liquid left/);
    expect(problems.map((p) => p.message).join(' ')).toMatch(/kept as liquid/);
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
  it('reads the template: a perfume kept in ml and a gift box counted in pieces', () => {
    const { products, problems } = planImport(IMPORT_TEMPLATE, ctx);
    expect(problems).toEqual([]);
    expect(products).toHaveLength(2);
    const p = products[0];
    expect(p.errors).toEqual([]);
    expect(p.sizes).toBe(3);
    expect(p.form.variants.map((v) => v.sku)).toEqual(['AMBER-NOIR-30', 'AMBER-NOIR-50', 'AMBER-NOIR-100']);
    expect([p.form.stock_unit, p.form.liquid_amount, p.form.liquid_unit]).toEqual(['ml', '1', 'L']);
    expect(products[1].form.stock_unit).toBe('piece');
    expect(products[1].form.variants[0].initial_stock).toBe('25');
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
