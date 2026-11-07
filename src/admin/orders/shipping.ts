import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { throwIf } from '../catalog/api';

export interface Courier {
  key: string;
  name: string;
  tracking_url: string;
  cod_allowed: boolean;
}

export function useShippingSettings() {
  return useQuery({
    queryKey: ['admin', 'shipping-settings'],
    queryFn: async () => {
      const rows = (await throwIf(supabase.from('settings').select('key, value').or('key.like.shipping.%,key.like.delhivery.%'))) as { key: string; value: unknown }[];
      return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
    },
  });
}

export function useCouriers(): Courier[] {
  const { data } = useShippingSettings();
  const list = data?.['shipping.couriers'];
  return Array.isArray(list) ? (list as Courier[]) : [];
}
