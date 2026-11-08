import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useCatalogFilters, useLegacyProducts } from './hooks';
import { filtersFromSearch, filtersToSearch, toSearchPayload, type ListingContext, type ListingFilters, type Sort } from './filters';
import { activeFromFilters, buildFilterSections, priceBands, sectionCounts, toggleFilter } from './listing';

export const PAGE_SIZE = 24;

/** Everything a listing page needs: URL-synced filters, sidebar sections, counts and the products page. */
export function useListing(ctx: ListingContext, extra: Record<string, unknown> = {}, enabled = true) {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromSearch(params), [params]);
  const { data: catalog } = useCatalogFilters();
  const sections = useMemo(() => buildFilterSections(catalog, ctx), [catalog, ctx]);
  const bands = useMemo(() => priceBands(catalog?.price?.min, catalog?.price?.max), [catalog]);
  const payload = useMemo(() => ({ ...toSearchPayload(filters, ctx, PAGE_SIZE), ...extra }), [filters, ctx, extra]);
  const result = useLegacyProducts(payload, enabled);

  const write = useCallback(
    (next: ListingFilters) => {
      const qs = filtersToSearch(next);
      setParams(new URLSearchParams(qs), { replace: false, preventScrollReset: true });
    },
    [setParams],
  );

  const activeFilters = useMemo(() => activeFromFilters(filters, bands), [filters, bands]);
  const counts = useMemo(() => sectionCounts(result.facets as Record<string, unknown>), [result.facets]);
  const totalActive = Object.values(activeFilters).reduce((n, v) => n + v.length, 0);

  return {
    filters,
    sections,
    activeFilters,
    counts,
    totalActive,
    products: result.products,
    total: result.total,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    error: result.error,
    page: filters.page ?? 1,
    pageCount: Math.max(1, Math.ceil(result.total / PAGE_SIZE)),
    sort: (filters.sort ?? 'featured') as Sort,
    toggle: (sectionId: string, optionId: string) => write(toggleFilter(filters, sectionId, optionId, bands)),
    clear: () => write({ attrs: {}, q: filters.q, sort: filters.sort }),
    setSort: (sort: Sort) => write({ ...filters, sort, page: undefined }),
    setPage: (page: number) => write({ ...filters, page }),
    setQuery: (q: string) => write({ ...filters, q: q || undefined, page: undefined }),
    /** Any price range typed by the shopper (either end may be empty). */
    setPriceRange: (min?: number, max?: number) => write({ ...filters, min, max, page: undefined }),
    priceSpan: catalog?.price ?? null,
  };
}
