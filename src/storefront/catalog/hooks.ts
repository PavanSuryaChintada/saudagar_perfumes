import { useMemo } from 'react';
import { usePickMedia } from '../../cms/mobileMedia';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toLegacyProduct } from './adapter';
import type { CatalogFilters, CollectionInfo, ProductCard, ProductDetail, SearchResult } from './types';

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  if (error) throw error;
  return data as T;
}

const FIVE_MIN = 5 * 60_000;

export function useProductDetail(slug: string | undefined) {
  return useQuery({
    queryKey: ['catalog', 'product', slug],
    enabled: !!slug,
    queryFn: () => rpc<ProductDetail | null>('product_detail', { p_slug: slug }),
  });
}

export function useProductSearch(payload: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: ['catalog', 'search', payload],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: () => rpc<SearchResult>('search_products', { p: payload }),
  });
}

/** Cards mapped to the storefront's legacy product shape. */
export function useLegacyProducts(payload: Record<string, unknown>, enabled = true) {
  const query = useProductSearch(payload, enabled);
  const products = useMemo(() => (query.data?.items ?? []).map(toLegacyProduct), [query.data]);
  return { ...query, products, total: query.data?.total ?? 0, facets: query.data?.facets ?? {} };
}

/** Look up products by slug, keeping the order of the slugs given (wishlist, bag, tagged products). */
export function useProductsBySlugs(slugs: string[]) {
  const key = [...new Set(slugs.filter(Boolean))];
  const query = useQuery({
    queryKey: ['catalog', 'by-slugs', key],
    enabled: key.length > 0,
    queryFn: () => rpc<SearchResult>('search_products', { p: { slugs: key, page_size: 48 } }),
  });
  const bySlug = useMemo(() => {
    const map = new Map<string, ReturnType<typeof toLegacyProduct>>();
    for (const c of query.data?.items ?? []) map.set(c.slug, toLegacyProduct(c));
    return map;
  }, [query.data]);
  const products = useMemo(() => key.map((s) => bySlug.get(s)).filter(Boolean) as ReturnType<typeof toLegacyProduct>[], [key.join('|'), bySlug]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...query, products, bySlug, isLoading: key.length > 0 && query.isLoading };
}

export function useCatalogFilters() {
  return useQuery({
    queryKey: ['catalog', 'filters'],
    staleTime: FIVE_MIN,
    queryFn: () => rpc<CatalogFilters>('catalog_filters'),
  });
}

export function useSearchSuggest(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: ['catalog', 'suggest', term.toLowerCase()],
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
    queryFn: () =>
      rpc<{ products: { slug: string; name: string; min_price: number; image: string | null }[]; notes: { slug: string; name: string }[]; collections: { slug: string; name: string }[] }>(
        'search_suggest',
        { q: term },
      ),
  });
}

export function useSimilarProducts(slug: string | undefined, limit = 4) {
  const query = useQuery({
    queryKey: ['catalog', 'similar', slug, limit],
    enabled: !!slug,
    queryFn: () => rpc<ProductCard[]>('similar_products', { p_slug: slug, p_limit: limit }),
  });
  const products = useMemo(() => (query.data ?? []).map(toLegacyProduct), [query.data]);
  return { ...query, products };
}

export function useCollection(slug: string | undefined) {
  const select = usePickMedia();
  return useQuery({
    select,
    queryKey: ['catalog', 'collection', slug],
    enabled: !!slug,
    staleTime: FIVE_MIN,
    queryFn: () => rpc<CollectionInfo | null>('resolve_collection', { p_slug: slug }),
  });
}

export function useCollections() {
  const select = usePickMedia();
  return useQuery({
    select,
    queryKey: ['catalog', 'collections'],
    staleTime: FIVE_MIN,
    queryFn: async () => {
      const { data, error } = await supabase.from('collections').select('*').eq('is_active', true).order('position');
      if (error) throw error;
      return (data ?? []) as unknown as CollectionInfo[];
    },
  });
}

export function useCategory(slug: string | undefined) {
  const select = usePickMedia();
  return useQuery({
    select,
    queryKey: ['catalog', 'category', slug],
    enabled: !!slug,
    staleTime: FIVE_MIN,
    queryFn: () =>
      rpc<{ slug: string; name: string; description: string | null; image_url: string | null; video_url: string | null; children: { slug: string; name: string }[] } | null>(
        'resolve_category',
        { p_slug: slug },
      ),
  });
}

export function useNote(slug: string | undefined) {
  return useQuery({
    queryKey: ['catalog', 'note', slug],
    enabled: !!slug,
    staleTime: FIVE_MIN,
    queryFn: () =>
      rpc<{ slug: string; name: string; description: string | null; image: string | null; family: string | null; family_slug: string | null } | null>(
        'resolve_note',
        { p_slug: slug },
      ),
  });
}
