import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type T = Database['public']['Tables'];
export type Story = T['stories']['Row'] & { product_slug: string | null };
export type Stockist = T['stockists']['Row'];
export type Testimonial = T['testimonials']['Row'] & { product_name: string | null };
export type Faq = T['faqs']['Row'];
export type Reel = T['reels']['Row'] & { product_slugs: string[] };

const FIVE_MIN = 5 * 60_000;

/** Active stories in order, with the tagged product's slug. */
export function useStories() {
  return useQuery({
    queryKey: ['cms', 'stories'],
    staleTime: FIVE_MIN,
    queryFn: async () => {
      const { data, error } = await supabase.from('stories').select('*, products(slug)').eq('is_active', true).order('position');
      if (error) throw error;
      return (data ?? []).map((s: any) => ({ ...s, product_slug: s.products?.slug ?? null })) as Story[];
    },
  });
}

export function useStockists() {
  return useQuery({
    queryKey: ['cms', 'stockists'],
    staleTime: FIVE_MIN,
    queryFn: async () => {
      const { data, error } = await supabase.from('stockists').select('*').eq('is_active', true).order('position');
      if (error) throw error;
      return (data ?? []) as Stockist[];
    },
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ['cms', 'testimonials'],
    staleTime: FIVE_MIN,
    queryFn: async () => {
      const { data, error } = await supabase.from('testimonials').select('*, products(name)').eq('is_active', true).order('position');
      if (error) throw error;
      return (data ?? []).map((t: any) => ({ ...t, product_name: t.products?.name ?? null })) as Testimonial[];
    },
  });
}

export function useFaqs() {
  return useQuery({
    queryKey: ['cms', 'faqs'],
    staleTime: FIVE_MIN,
    queryFn: async () => {
      const { data, error } = await supabase.from('faqs').select('*').eq('is_active', true).order('position');
      if (error) throw error;
      return (data ?? []) as Faq[];
    },
  });
}

/** Active reels with their tagged products' slugs (in tag order). */
export function useReels() {
  return useQuery({
    queryKey: ['cms', 'reels'],
    staleTime: FIVE_MIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reels')
        .select('*, reel_products(position, products(slug))')
        .eq('is_active', true)
        .order('position');
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        product_slugs: [...(r.reel_products ?? [])].sort((a: any, b: any) => a.position - b.position).map((rp: any) => rp.products?.slug).filter(Boolean),
      })) as Reel[];
    },
  });
}
