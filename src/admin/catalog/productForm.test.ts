import { describe, expect, it } from 'vitest';
import { copyProductDetails, emptyProductForm, emptyVariant, fromAdminProduct, slugify, toSavePayload, validateProductForm, type ProductForm } from './productForm';

const valid = (): ProductForm => ({
  ...emptyProductForm(),
  name: 'Deep Canopy',
  primary_category_id: 'cat-1',
  slug: 'deep-canopy',
  base_price: '6600',
  variants: [
    { ...emptyVariant(), sku: 'DC-50', size_ml: '50', label: '50 ml', initial_stock: '10' },
    { ...emptyVariant(), sku: 'DC-100', size_ml: '100', label: '100 ml', price: '10500' },
  ],
});

describe('slugify', () => {
  it('makes a clean URL slug', () => expect(slugify('  Oud & Taif Roses — Extrait! ')).toBe('oud-taif-roses-extrait'));
});

describe('validateProductForm', () => {
  it('accepts a complete product', () => expect(validateProductForm(valid())).toEqual({}));
  it('needs a category first', () => {
    expect(validateProductForm({ ...valid(), primary_category_id: '' }).primary_category_id).toBe('Choose a category first.');
  });
  it('requires a name and a valid slug', () => {
    const e = validateProductForm({ ...valid(), name: ' ', slug: 'Bad Slug' });
    expect(e.name).toBeTruthy();
    expect(e.slug).toBe('Use lowercase letters, numbers and dashes only.');
  });
  it('rejects a negative or missing base price', () => {
    expect(validateProductForm({ ...valid(), base_price: '-1' }).base_price).toBeTruthy();
    expect(validateProductForm({ ...valid(), base_price: '' }).base_price).toBeTruthy();
  });
  it('needs at least one bottle size customers can buy', () => {
    expect(validateProductForm({ ...valid(), variants: [] }).variants).toBe('Add at least one bottle size.');
  });
  it('rejects duplicate SKUs within the product', () => {
    const f = valid();
    f.variants[1].sku = 'dc-50';
    expect(validateProductForm(f)['variants.1.sku']).toBe('This SKU is already used above.');
  });
  it('keeps accord strength between 1 and 100', () => {
    const f = { ...valid(), attributes: [{ option_id: 'a1', kind: 'accord', strength: 140, is_primary: false }] };
    expect(validateProductForm(f).attributes).toBe('Accord strength must be between 1 and 100.');
  });
  it('checks the launch year', () => {
    expect(validateProductForm({ ...valid(), launch_year: '1800' }).launch_year).toBeTruthy();
  });
});

describe('toSavePayload', () => {
  it('converts form strings to numbers and blanks to null', () => {
    const p = toSavePayload(valid()) as Record<string, any>;
    expect(p.base_price).toBe(6600);
    expect(p.compare_at_price).toBeNull();
    expect(p.variants[0]).toMatchObject({ sku: 'DC-50', size_ml: 50, price: null, initial_stock: 10 });
    expect(p.variants[1]).toMatchObject({ price: 10500, initial_stock: null });
  });
  it('links media to sizes by SKU', () => {
    const f = { ...valid(), media: [{ kind: 'image' as const, url: '/a.webp', alt: '', variant_sku: 'DC-100' }] };
    expect((toSavePayload(f) as any).media[0]).toEqual({ kind: 'image', url: '/a.webp', alt: null, variant_sku: 'DC-100' });
  });
});

describe('fromAdminProduct', () => {
  it('round-trips and keeps variant ids so carts and orders keep pointing at them', () => {
    const form = fromAdminProduct({
      product: { id: 'p1', slug: 'deep-canopy', name: 'Deep Canopy', base_price: 6600, compare_at_price: null, is_active: true, launch_year: 2024 } as any,
      variants: [{ id: 'v1', kind: 'retail', sku: 'DC-50', size_ml: 50, label: '50 ml', price: null, stock: 7, position: 0 } as any],
      media: [], categoryIds: ['c1'], collectionIds: [], notes: [{ note_id: 'n1', tier: 'top', position: 0 }], attributes: [],
    });
    expect(form.variants[0].id).toBe('v1');
    expect(form.variants[0].stock).toBe(7);
    expect(form.launch_year).toBe('2024');
    const p = toSavePayload(form) as any;
    expect(p.id).toBe('p1');
    expect(p.variants[0].id).toBe('v1');
    expect(p.variants[0].initial_stock).toBeNull();
    expect(p.category_ids).toEqual(['c1']);
    expect(p.notes).toEqual([{ note_id: 'n1', tier: 'top', position: 0 }]);
  });
});

describe('copyProductDetails', () => {
  it('copies only the chosen groups', () => {
    const source = { ...emptyProductForm(), description: '<p>Source</p>', perfumer: 'A. Nose', page_sections: [{ title: 'Care', body: '<p>x</p>' }] };
    const target = { ...emptyProductForm(), name: 'Target', description: '<p>Mine</p>', perfumer: 'Me' };
    const out = copyProductDetails(target, source, ['text', 'sections']);
    expect(out.description).toBe('<p>Source</p>');
    expect(out.page_sections).toEqual([{ title: 'Care', body: '<p>x</p>' }]);
    expect(out.perfumer).toBe('Me');
    expect(out.name).toBe('Target');
  });
});
