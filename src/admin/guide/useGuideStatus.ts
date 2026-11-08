import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { GuideCheck } from './guide';

export interface CheckStatus {
  /** true = done, false = still to do, null = information only (e.g. orders so far). */
  done: boolean | null;
  text: string;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

async function count(table: string, filter?: (q: ReturnType<typeof base>) => ReturnType<typeof base>) {
  let q = base(table);
  if (filter) q = filter(q);
  const { count: n, error } = await q;
  if (error) throw error;
  return n ?? 0;
}
function base(table: string) {
  return supabase.from(table as never).select('id', { count: 'exact', head: true });
}

/** What's set up so far, for the guide's progress marks. */
export function useGuideStatus() {
  return useQuery({
    queryKey: ['admin', 'catalog', 'guide-status'],
    staleTime: 20_000,
    queryFn: async (): Promise<Record<GuideCheck, CheckStatus>> => {
      const [categories, options, notes, collections, products, sampleProducts, vials, coupons, orders, dash] = await Promise.all([
        count('categories'),
        count('attribute_options', (q) => q.eq('is_active' as never, true as never)),
        count('notes'),
        count('collections'),
        count('products', (q) => q.is('archived_at' as never, null)),
        count('products', (q) => q.is('archived_at' as never, null).ilike('admin_note' as never, 'SAMPLE PRODUCT%')),
        count('product_variants', (q) => q.eq('kind' as never, 'sample' as never).eq('in_sample_pool' as never, true as never).gt('stock' as never, 0)),
        count('coupons', (q) => q.eq('is_active' as never, true as never)),
        count('orders'),
        supabase.rpc('admin_dashboard', { p_days: 7 }),
      ]);
      const setup = ((dash.data as { setup?: { key: string; done: boolean }[] } | null)?.setup ?? []).reduce<Record<string, boolean>>(
        (acc, s) => ({ ...acc, [s.key]: s.done }),
        {},
      );
      const own = products - sampleProducts;
      const setupDone = ['business', 'contact', 'delivery'].filter((k) => setup[k]).length;
      return {
        setup: { done: setupDone === 3, text: setupDone === 3 ? 'Business, contact and delivery done' : `${setupDone} of 3 done` },
        categories: { done: categories > 0, text: categories ? plural(categories, 'category', 'categories') : 'None yet' },
        scent: { done: options > 0, text: options ? plural(options, 'option') : 'None yet' },
        notes: { done: notes > 0, text: notes ? plural(notes, 'note') : 'None yet' },
        collections: { done: collections > 0 ? true : null, text: collections ? plural(collections, 'collection') : 'Optional' },
        products: {
          done: own > 0 && sampleProducts === 0,
          text: own > 0 ? `${plural(own, 'product')} of your own${sampleProducts ? ` · ${sampleProducts} sample still live` : ''}` : sampleProducts ? 'Only the sample products so far' : 'None yet',
        },
        samples: { done: vials > 0, text: vials ? `${plural(vials, 'vial')} in stock` : 'No sample vials yet' },
        website: { done: !!setup.policies, text: setup.policies ? 'Policy pages written' : 'Policy pages still have placeholder text' },
        orders: { done: null, text: orders ? `${plural(orders, 'order')} so far` : 'No orders yet' },
        coupons: { done: null, text: coupons ? plural(coupons, 'active code') : 'Optional' },
      };
    },
  });
}
