import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export interface Bootstrap {
  settings: Record<string, unknown>;
  blocks?: Record<string, unknown>;
  announcements?: unknown[];
  [key: string]: unknown;
}

/** Public store settings and site-wide content in one round trip (site_bootstrap RPC). */
export function useBootstrap() {
  return useQuery({
    queryKey: ['bootstrap'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('site_bootstrap');
      if (error) throw error;
      return (data ?? { settings: {} }) as Bootstrap;
    },
  });
}

export function useSetting<T>(key: string, fallback: T): T {
  const { data } = useBootstrap();
  const value = data?.settings?.[key];
  return (value === undefined || value === null ? fallback : value) as T;
}
