import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_IMAGE, toLegacyProduct } from './adapter';
import type { ProductCard } from './types';

const card: ProductCard = {
  id: 'p1', slug: 'deep-canopy', name: 'Deep Canopy', short_description: 'Mineral woods.', badge: 'BESTSELLER',
  base_price: 6600, min_price: 4900, max_price: 10500, compare_at: 8000, images: ['/a.png', '/b.png'], video: null,
  sizes: [
    { variant_id: 'v30', sku: 'S-30', ml: 30, label: '30 ml · Extrait', price: 4900, compare_at: null, stock: 3 },
    { variant_id: 'v50', sku: 'S-50', ml: 50, label: '50 ml', price: 6600, compare_at: 8000, stock: 0 },
  ],
  notes: { top: ['Pine'], heart: ['Lichen'], base: ['Cedar'] }, concentration: 'Extrait de Parfum',
  concentration_note: 'Extrait de Parfum · 42% Pure Fragrance Oil', family: 'Woody', category: 'Extrait de Parfum',
  category_slug: 'extrait-de-parfum', collections: [{ slug: 'signature', name: 'The Signature Collection' }],
  rating_avg: 0, rating_count: 0, total_stock: 3, is_featured: true, counts_toward_samples: true, created_at: '2026-11-07',
};

describe('toLegacyProduct', () => {
  it('maps a card onto the shape the storefront components render', () => {
    const p = toLegacyProduct(card);
    expect(p.id).toBe('deep-canopy');
    expect(p.price).toBe(4900);
    expect(p.compareAtPrice).toBe(8000);
    expect(p.sizes).toEqual([
      { ml: 30, label: '30 ml · Extrait', price: 4900, compareAt: null, variantId: 'v30', stock: 3 },
      { ml: 50, label: '50 ml', price: 6600, compareAt: 8000, variantId: 'v50', stock: 0 },
    ]);
    expect(p.notes).toEqual({ top: ['Pine'], heart: ['Lichen'], base: ['Cedar'] });
    expect(p.concentration).toBe('Extrait de Parfum · 42% Pure Fragrance Oil');
    expect(p.category).toBe('Extrait de Parfum');
    expect(p.inStock).toBe(true);
  });

  it('falls back to a placeholder image when a product has none', () => {
    const p = toLegacyProduct({ ...card, images: [] });
    expect(p.images).toEqual([PLACEHOLDER_IMAGE]);
    expect(p.image).toBe(PLACEHOLDER_IMAGE);
  });

  it('treats a product with no sizes as out of stock', () => {
    const p = toLegacyProduct({ ...card, sizes: [], total_stock: 0 });
    expect(p.sizes).toEqual([]);
    expect(p.inStock).toBe(false);
  });

  it('never invents ratings', () => {
    const p = toLegacyProduct(card);
    expect(p.rating).toBe(0);
    expect(p.reviewsCount).toBe(0);
  });

  it('reads note names from a detail payload where notes are objects', () => {
    const p = toLegacyProduct({ ...card, notes: { top: [{ name: 'Pine', slug: 'pine' }], heart: [], base: [] } } as never);
    expect(p.notes.top).toEqual(['Pine']);
  });
});
