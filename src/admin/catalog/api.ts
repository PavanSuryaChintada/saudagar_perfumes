import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import type { AdminProductBundle, AttributeLink, NoteLink } from './productForm';

type Tables = Database['public']['Tables'];
export type OptionRow = Tables['attribute_options']['Row'];
export type NoteRow = Tables['notes']['Row'];
export type CategoryRow = Tables['categories']['Row'];
export type CollectionRow = Tables['collections']['Row'];

export const OPTION_KINDS: { kind: string; label: string; help: string }[] = [
  { kind: 'family', label: 'Fragrance families', help: 'The main character of a scent. A product has one primary family.' },
  { kind: 'accord', label: 'Accords', help: 'Shown as strength bars on the product page.' },
  { kind: 'note_family', label: 'Note families', help: 'Groups notes (e.g. "Oud & Agarwood"). Used by the "Olfactory notes" filter.' },
  { kind: 'concentration', label: 'Concentrations', help: 'Extrait, EDP, attar…' },
  { kind: 'intensity', label: 'Intensity', help: 'How strong the scent is. The badge shows next to the filter option.' },
  { kind: 'longevity', label: 'Longevity', help: 'Shown as your own guidance.' },
  { kind: 'sillage', label: 'Sillage', help: 'How far the scent carries.' },
  { kind: 'season', label: 'Seasons', help: '' },
  { kind: 'time_of_day', label: 'Day / night', help: '' },
  { kind: 'occasion', label: 'Occasions', help: '' },
  { kind: 'gender', label: 'Wear it as', help: 'Feminine, masculine, unisex.' },
];

export async function throwIf<T>(p: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data;
}

export function useInvalidateCatalog() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['admin', 'catalog'] }),
      qc.invalidateQueries({ queryKey: ['catalog'] }),
    ]);
}

export function useOptions() {
  return useQuery({
    queryKey: ['admin', 'catalog', 'options'],
    queryFn: () => throwIf(supabase.from('attribute_options').select('*').order('kind').order('position').order('label')) as Promise<OptionRow[]>,
  });
}

export function useNotes() {
  return useQuery({
    queryKey: ['admin', 'catalog', 'notes'],
    queryFn: () => throwIf(supabase.from('notes').select('*').order('position').order('name')) as Promise<NoteRow[]>,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['admin', 'catalog', 'categories'],
    queryFn: () => throwIf(supabase.from('categories').select('*').order('position').order('name')) as Promise<CategoryRow[]>,
  });
}

export function useCollectionsAdmin() {
  return useQuery({
    queryKey: ['admin', 'catalog', 'collections'],
    queryFn: () => throwIf(supabase.from('collections').select('*').order('position').order('name')) as Promise<CollectionRow[]>,
  });
}

export interface ProductListRow {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  archived_at: string | null;
  min_price: number | null;
  max_price: number | null;
  base_price: number;
  total_stock: number;
  units_sold: number;
  badge: string | null;
  updated_at: string;
  admin_note: string | null;
  image: string | null;
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin', 'catalog', 'products'],
    queryFn: async () => {
      const rows = await throwIf(
        supabase
          .from('products')
          .select('id, slug, name, is_active, archived_at, min_price, max_price, base_price, total_stock, units_sold, badge, updated_at, admin_note, product_media(url, kind, position)')
          .order('updated_at', { ascending: false }),
      );
      return (rows as any[]).map((r) => {
        const media = [...(r.product_media ?? [])].filter((m: any) => m.kind === 'image').sort((a: any, b: any) => a.position - b.position);
        return { ...r, image: media[0]?.url ?? null } as ProductListRow;
      });
    },
  });
}

export async function loadAdminProduct(id: string): Promise<AdminProductBundle> {
  const [product, variants, media, cats, cols, notes, attrs] = await Promise.all([
    throwIf(supabase.from('products').select('*').eq('id', id).single()),
    throwIf(supabase.from('product_variants').select('*').eq('product_id', id).order('position')),
    throwIf(supabase.from('product_media').select('*').eq('product_id', id).order('position')),
    throwIf(supabase.from('product_categories').select('category_id').eq('product_id', id)),
    throwIf(supabase.from('product_collections').select('collection_id').eq('product_id', id)),
    throwIf(supabase.from('product_notes').select('note_id, tier, position').eq('product_id', id).order('position')),
    throwIf(supabase.from('product_attributes').select('option_id, strength, is_primary, attribute_options(kind)').eq('product_id', id)),
  ]);
  return {
    product: product as AdminProductBundle['product'],
    variants: variants as AdminProductBundle['variants'],
    media: media as AdminProductBundle['media'],
    categoryIds: (cats as { category_id: string }[]).map((c) => c.category_id),
    collectionIds: (cols as { collection_id: string }[]).map((c) => c.collection_id),
    notes: notes as NoteLink[],
    attributes: (attrs as any[]).map((a) => ({
      option_id: a.option_id,
      strength: a.strength,
      is_primary: a.is_primary,
      kind: a.attribute_options?.kind ?? '',
    })) as AttributeLink[],
  };
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  if (error) throw error;
  return data as T;
}
