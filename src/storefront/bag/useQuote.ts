import { useEffect, useRef } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import type { Json } from '../../lib/database.types';

export interface BagLine {
  variantId: string;
  quantity: number;
  [key: string]: unknown;
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
}

export interface QuoteProblem {
  variant_id: string;
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

export const toQuoteItems = (cart: BagLine[]) =>
  cart.filter((l) => typeof l.variantId === 'string' && l.variantId).map((l) => ({ variant_id: l.variantId, qty: Math.max(1, Math.min(99, Number(l.quantity) || 1)) }));

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
        p_items: items,
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
      const saved = (Array.isArray(data?.items) ? data.items : []) as { variant_id: string; qty: number; meta?: Record<string, unknown> }[];
      if (saved.length) {
        const merged = new Map<string, BagLine>();
        for (const s of saved) merged.set(s.variant_id, { ...(s.meta ?? {}), variantId: s.variant_id, quantity: s.qty });
        for (const l of cart) {
          if (!l.variantId) continue;
          const prev = merged.get(l.variantId);
          merged.set(l.variantId, prev ? { ...prev, ...l, quantity: Math.max(prev.quantity, l.quantity) } : l);
        }
        setCart([...merged.values()]);
      }
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
      const items = cart
        .filter((l) => l.variantId)
        .map((l) => ({
          variant_id: l.variantId,
          qty: l.quantity,
          meta: { name: l.name, image: l.image, price: l.price, size: l.size, productId: l.productId, slug: l.slug },
        }));
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
      const { data, error } = await supabase.rpc('available_coupons', { p_items: items });
      if (error) throw error;
      return (data ?? []) as unknown as AvailableCoupon[];
    },
  });
}
