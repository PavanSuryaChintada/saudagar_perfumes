import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { throwIf } from '../catalog/api';

export interface LookupItem {
  id: string;
  slug: string;
  name: string;
}

function useLookup(key: string, load: () => Promise<LookupItem[]>) {
  return useQuery({ queryKey: ['admin', 'lookup', key], queryFn: load, staleTime: 30_000 });
}

export const useProductLookup = () =>
  useLookup('products', async () =>
    ((await throwIf(supabase.from('products').select('id, slug, name').is('archived_at', null).eq('is_gift_pack', false).order('name'))) as LookupItem[]) ?? [],
  );

export const useCollectionLookup = () =>
  useLookup('collections', async () => ((await throwIf(supabase.from('collections').select('id, slug, name').order('position'))) as LookupItem[]) ?? []);

export const useCategoryLookup = () =>
  useLookup('categories', async () => ((await throwIf(supabase.from('categories').select('id, slug, name').order('position'))) as LookupItem[]) ?? []);

export const useNoteLookup = () =>
  useLookup('notes', async () => ((await throwIf(supabase.from('notes').select('id, slug, name').order('name'))) as LookupItem[]) ?? []);

export const usePageLookup = () =>
  useLookup('pages', async () => {
    const rows = (await throwIf(supabase.from('pages').select('id, slug, title').order('position'))) as { id: string; slug: string; title: string }[];
    // The product-page and category-page layouts can't be linked to.
    return (rows ?? []).filter((r) => r.slug !== 'product-page' && r.slug !== 'listing-page').map((r) => ({ id: r.id, slug: r.slug, name: r.title }));
  });

export interface OptionLookup {
  id: string;
  kind: string;
  slug: string;
  label: string;
}
export const useOptionLookup = () =>
  useQuery({
    queryKey: ['admin', 'lookup', 'options'],
    staleTime: 30_000,
    queryFn: async () => ((await throwIf(supabase.from('attribute_options').select('id, kind, slug, label').order('position'))) as OptionLookup[]) ?? [],
  });
