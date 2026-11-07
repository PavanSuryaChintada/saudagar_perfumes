import { describe, expect, it } from 'vitest';
import { filtersFromSearch, filtersToSearch, toSearchPayload } from './filters';

describe('listing filters in the URL', () => {
  it('reads attribute filters, price and sort from the query string', () => {
    const f = filtersFromSearch(new URLSearchParams('occasion=evening,daily&min=3000&sort=price_asc'));
    expect(f).toEqual({ attrs: { occasion: ['evening', 'daily'] }, min: 3000, sort: 'price_asc' });
  });

  it('writes them back in a stable, readable order', () => {
    expect(filtersToSearch({ attrs: { occasion: ['evening', 'daily'] }, min: 3000, sort: 'price_asc' })).toBe(
      'sort=price_asc&occasion=evening,daily&min=3000',
    );
  });

  it('round-trips every supported key', () => {
    const qs = 'q=oud%20rose&sort=newest&page=2&notes=oud,rose&families=woody&concentration=attar&occasion=evening&min=1000&max=9000&size=50,100&stock=1';
    expect(filtersToSearch(filtersFromSearch(new URLSearchParams(qs)))).toBe(qs);
  });

  it('ignores unknown keys and junk values', () => {
    expect(filtersFromSearch(new URLSearchParams('utm_source=x&min=abc&sort=hack&page=-3'))).toEqual({ attrs: {} });
  });

  it('builds the search_products payload with the page context', () => {
    expect(toSearchPayload({ attrs: { occasion: ['evening'] }, min: 3000, inStock: true }, { collection: 'royal' })).toEqual({
      collection: 'royal', attrs: { occasion: ['evening'] }, price_min: 3000, in_stock: true, page: 1, page_size: 24, sort: 'featured',
    });
  });
});
