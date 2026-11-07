import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

/**
 * Signed-in customers keep their wishlist in the account. On sign-in the device list and the saved
 * list are merged; afterwards every change is saved (debounced).
 */
export function useWishlistSync(wishlist: string[], setWishlist: (next: string[]) => void) {
  const { user } = useAuth();
  const uid = user?.id;
  const loadedFor = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef<string>('');

  useEffect(() => {
    if (!uid) {
      loadedFor.current = null;
      return;
    }
    if (loadedFor.current === uid) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc('my_wishlist');
      if (cancelled) return;
      const saved = (data ?? []) as string[];
      const merged = [...new Set([...saved, ...wishlist])];
      loadedFor.current = uid;
      last.current = JSON.stringify(saved);
      if (JSON.stringify(merged) !== JSON.stringify(wishlist)) setWishlist(merged);
      if (merged.length !== saved.length) {
        const { data: stored } = await supabase.rpc('set_wishlist', { p_slugs: merged });
        last.current = JSON.stringify(stored ?? merged);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    if (!uid || loadedFor.current !== uid) return;
    const key = JSON.stringify(wishlist);
    if (key === last.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      last.current = key;
      await supabase.rpc('set_wishlist', { p_slugs: wishlist });
    }, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [uid, wishlist]);
}
