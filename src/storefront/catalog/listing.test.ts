import { describe, expect, it } from 'vitest';
import { activeFromFilters, buildFilterSections, priceBands, sectionCounts, toggleFilter } from './listing';
import type { CatalogFilters } from './types';

const catalog: CatalogFilters = {
  categories: [],
  collections: [],
  notes: [],
  options: {
    note_family: [{ slug: 'oud', label: 'Oud & Rare Agarwood', description: null, badge: null }],
    intensity: [{ slug: 'beastmode', label: 'Extrait / Beastmode', description: 'Room-filling', badge: '38–46%' }],
    occasion: [{ slug: 'evening', label: 'Evening', description: null, badge: null }],
    gender: [],
  },
  price: { min: 2400, max: 8900 },
  sizes: [30, 50, 100],
};

describe('buildFilterSections', () => {
  it('builds sections in the storefront order and skips empty ones', () => {
    const ids = buildFilterSections(catalog).map((s) => s.id);
    expect(ids).toEqual(['intensity', 'families', 'occasion', 'size', 'price', 'availability']);
  });
  it('carries option descriptions and badges', () => {
    const intensity = buildFilterSections(catalog).find((s) => s.id === 'intensity')!;
    expect(intensity.options[0]).toEqual({ id: 'beastmode', label: 'Extrait / Beastmode', desc: 'Room-filling', badge: '38–46%' });
  });
});

describe('priceBands', () => {
  it('splits the catalogue range into three rounded bands', () => {
    expect(priceBands(2400, 8900)).toEqual([
      { id: 'under-4500', label: 'Under ₹4,500', min: undefined, max: 4499 },
      { id: '4500-6500', label: '₹4,500 – ₹6,500', min: 4500, max: 6500 },
      { id: 'above-6500', label: 'Above ₹6,500', min: 6501, max: undefined },
    ]);
  });
  it('returns nothing for an empty catalogue', () => expect(priceBands(null, null)).toEqual([]));
});

describe('toggleFilter / activeFromFilters', () => {
  const bands = priceBands(2400, 8900);
  it('toggles attribute options on and off', () => {
    const on = toggleFilter({ attrs: {} }, 'occasion', 'evening', bands);
    expect(on.attrs.occasion).toEqual(['evening']);
    expect(toggleFilter(on, 'occasion', 'evening', bands).attrs.occasion).toBeUndefined();
  });
  it('maps note families, sizes, availability and price bands', () => {
    let f = toggleFilter({ attrs: {} }, 'families', 'oud', bands);
    f = toggleFilter(f, 'size', '50', bands);
    f = toggleFilter(f, 'availability', 'in-stock', bands);
    f = toggleFilter(f, 'price', '4500-6500', bands);
    expect(f).toEqual({ attrs: {}, families: ['oud'], sizes: [50], inStock: true, min: 4500, max: 6500 });
    expect(activeFromFilters(f, bands)).toEqual({ families: ['oud'], size: ['50'], availability: ['in-stock'], price: ['4500-6500'] });
  });
  it('resets to page 1 whenever a filter changes', () => {
    expect(toggleFilter({ attrs: {}, page: 3 }, 'occasion', 'evening', bands).page).toBeUndefined();
  });
});

describe('sectionCounts', () => {
  it('reads attribute and note-family counts from search facets', () => {
    expect(sectionCounts({ occasion: { evening: 4 }, note_family: { oud: 2 } })).toEqual({ occasion: { evening: 4 }, families: { oud: 2 } });
  });
});
