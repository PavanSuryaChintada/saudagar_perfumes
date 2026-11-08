import { describe, expect, it } from 'vitest';
import { SECTION_PRESETS, SECTION_TYPES, sectionTypesFor } from './registry';

describe('sections per page', () => {
  const types = (slug: string) => sectionTypesFor(slug).map(([t]) => t);

  it('offers product sections only on the product page, and the banner and grid only on category pages', () => {
    expect(types('home')).not.toContain('product_reviews');
    expect(types('home')).not.toContain('listing_grid');
    expect(types('product-page')).toEqual(expect.arrayContaining(['product_composition', 'product_reviews', 'product_similar', 'product_recent', 'product_carousel']));
    expect(types('listing-page')).toEqual(expect.arrayContaining(['listing_header', 'listing_grid', 'promo_banner']));
    expect(SECTION_TYPES.listing_grid.required).toBe(true);
  });

  it('ready-made sections are product rows that start with hand-picked products', () => {
    expect(SECTION_PRESETS.map((p) => p.label)).toEqual(expect.arrayContaining(['Best sellers', 'New arrivals']));
    for (const p of SECTION_PRESETS) {
      expect(SECTION_TYPES[p.type]).toBeDefined();
      expect((p.config.source as { mode: string }).mode).toBe('manual');
    }
  });
});
