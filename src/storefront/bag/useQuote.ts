import { useEffect, useRef } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import type { Json } from '../../lib/database.types';
import { fromSavedItems, mergeBags, toQuoteItems, toSavedItems, type BagLine } from './bagLines';

export type { BagLine } from './bagLines';
export { toQuoteItems } from './bagLines';

export interface PackPick {
  product_id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
}

export interface QuoteLine {
  variant_id: string;
  product_id: string;
  name: string;
  slug: string;
  label: string;
  sku: string;
  size_ml: number | null;
  image: string | null;
  qty: number;
  stock: number;
  unit_price: number;
  compare_at_price: number | null;
  line_total: number;
  /** Set on gift pack lines. */
  kind?: 'gift_pack';
  key?: string;
  picks?: PackPick[];
  sample_ml?: number;
}

export interface QuoteProblem {
  variant_id: string | null;
  /** Set when the problem is with a gift pack. */
  key?: string;
  reason: 'UNAVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  name: string | null;
  label: string | null;
  available: number;
  requested: number;
  message: string;
}

export interface Quote {
  lines: QuoteLine[];
  problems: QuoteProblem[];
  item_count: number;
  subtotal: number;
  coupon: { ok: boolean; code: string; reason: string; message: string; discount: number } | null;
  discount: number;
  shipping: number;
  total: number;
  free_shipping: { threshold: number | null; remaining: number | null };
  cod: { allowed: boolean; reason: string | null; min_order: number; message: string | null };
  online: { allowed: boolean };
  samples: {
    enabled: boolean;
    entitlement: number;
    accepted: (string | null)[];
    rejected: { variant_id: string; reason: string }[];
    eligible_ml: number;
    next_threshold_ml: number | null;
    ml_per_sample: number;
    sample_size_ml: number;
    max_per_order: number;
    allow_duplicates: boolean;
  };
}

/** The server's price for the bag. Every total shown to the customer comes from here. */
export function useQuote(cart: BagLine[], samples: (string | null)[], couponCode?: string | null, enabled = true) {
  const items = toQuoteItems(cart);
  return useQuery({
    queryKey: ['quote', items, samples, couponCode ?? null],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('quote_order', {
        p_items: items as unknown as Json,
        p_coupon_code: couponCode || undefined,
        p_payment_method: 'COD',
        p_samples: samples,
      });
      if (error) throw error;
      return data as unknown as Quote;
    },
  });
}

export interface PoolScent {
  variant_id: string;
  product_id: string;
  name: string;
  slug: string;
  label: string;
  image: string | null;
  family: string | null;
}

export function useSamplePool(enabled = true) {
  return useQuery({
    queryKey: ['sample-pool'],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('sample_pool');
      if (error) throw error;
      return (data ?? []) as PoolScent[];
    },
  });
}

/** Keeps sample picks within what the bag has earned (the server's numbers win). */
export function trimSamples(picks: (string | null)[], entitlement: number): (string | null)[] {
  return picks.slice(0, Math.max(0, entitlement));
}

/**
 * Mirrors the bag to the account for signed-in customers. On sign-in the saved bag and the
 * device bag are merged (largest quantity per size wins).
 */
export function useCartSync(
  cart: BagLine[],
  setCart: (next: BagLine[]) => void,
  samples: (string | null)[],
  setSamples: (next: (string | null)[]) => void,
) {
  const { user } = useAuth();
  const uid = user?.id;
  const loadedFor = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!uid) {
      loadedFor.current = null;
      return;
    }
    if (loadedFor.current === uid) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('carts').select('items, samples').eq('user_id', uid).maybeSingle();
      if (cancelled) return;
      loadedFor.current = uid;
      const saved = fromSavedItems(data?.items);
      if (saved.length) setCart(mergeBags(saved, cart));
      if (!samples.length && Array.isArray(data?.samples) && data.samples.length) setSamples(data.samples as (string | null)[]);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    if (!uid || loadedFor.current !== uid) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const items = toSavedItems(cart);
      void supabase.from('carts').upsert({ user_id: uid, items: items as unknown as Json, samples: samples as unknown as Json });
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [uid, cart, samples]);
}

export interface AvailableCoupon {
  id: string;
  code: string;
  kind: 'general' | 'welcome' | 'birthday';
  description: string | null;
  expires_at: string | null;
  ok: boolean;
  reason: string | null;
  message: string;
  discount: number;
}

/** Listed codes plus the shopper's personal codes, each priced against the bag. */
export function useAvailableCoupons(cart: BagLine[], enabled = true) {
  const items = toQuoteItems(cart);
  return useQuery({
    queryKey: ['available-coupons', items],
    enabled,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('available_coupons', { p_items: items as unknown as Json });
      if (error) throw error;
      return (data ?? []) as unknown as AvailableCoupon[];
    },
  });
}

// ---------------------------------------------------------------- gift pack
export interface GiftPackPerfume {
  product_id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  /** Its price at the base size, before the pack percentage. */
  base_price?: number;
  /** How many times it can still go in a pack, from the liquid left. */
  max_picks: number;
}

export interface GiftPackOptions {
  enabled: boolean;
  count: number;
  size_ml: number;
  price_base_ml: number;
  price_percent: number;
  discount_percent: number;
  sample_ml: number;
  perfumes: GiftPackPerfume[];
}

/** The gift pack rules and every perfume that can go in one (Admin → Gift pack). */
export function useGiftPackOptions(enabled = true) {
  return useQuery({
    queryKey: ['gift-pack-options'],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('gift_pack_options');
      if (error) throw error;
      return data as unknown as GiftPackOptions;
    },
  });
}

/** Free-sample suggestions, chosen like "Surprise me" and avoiding what is in the bag. */
export async function suggestSamples(count: number, avoidProducts: string[]): Promise<string[]> {
  if (count <= 0) return [];
  const { data, error } = await supabase.rpc('suggest_samples', { p_count: count, p_avoid: avoidProducts });
  if (error) throw error;
  return Array.isArray(data) ? (data as unknown[]).filter((x): x is string => typeof x === 'string') : [];
}
