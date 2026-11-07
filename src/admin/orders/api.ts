import { useEffect, useId } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { throwIf } from '../catalog/api';
import type { OrderRow } from '../../storefront/orders/useOrders';

export type AdminOrder = OrderRow & { user_id: string | null; courier: string | null; shipping_error: string | null; shipping_status: string | null; label_url: string | null; ship_city: string | null; ship_state: string | null; admin_note: string | null; stock_restored_at: string | null; rto_at: string | null; paid_at: string | null };

export interface OrderFilters {
  status: string;
  search: string;
  page: number;
}

export const PAGE_SIZE = 25;

export function useAdminOrders(f: OrderFilters) {
  return useQuery({
    queryKey: ['admin', 'orders', f],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('id, order_number, status, payment_method, payment_status, total, created_at, customer_name, customer_phone, ship_city, ship_state, samples_short, order_items(qty, line_type)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(f.page * PAGE_SIZE, f.page * PAGE_SIZE + PAGE_SIZE - 1);
      if (f.status) q = q.eq('status', f.status);
      const term = f.search.trim().replace(/[%,()]/g, ' ').trim();
      if (term) q = q.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%,customer_email.ilike.%${term}%`);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as unknown as AdminOrder[], count: count ?? 0 };
    },
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'order', id],
    enabled: !!id,
    queryFn: async () => {
      const o = (await throwIf(supabase.from('orders').select('*, order_items(*), order_events(*)').eq('id', id!).maybeSingle())) as unknown as AdminOrder | null;
      if (!o) return null;
      o.order_items = [...(o.order_items ?? [])].sort((a, b) => a.position - b.position);
      o.order_events = [...(o.order_events ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
      return o;
    },
  });
}

/** Live updates: any order change refreshes the admin order queries. */
export function useOrdersRealtime() {
  const qc = useQueryClient();
  const channelName = `admin-orders-${useId()}`;
  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
        void qc.invalidateQueries({ queryKey: ['admin', 'order'] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, channelName]);
}

export function useBusinessSettings() {
  return useQuery({
    queryKey: ['admin', 'business-settings'],
    queryFn: async () => {
      const rows = (await throwIf(supabase.from('settings').select('key, value').like('key', 'business.%'))) as { key: string; value: unknown }[];
      const out: Record<string, string> = {};
      for (const r of rows ?? []) out[r.key.replace('business.', '')] = typeof r.value === 'string' ? r.value : '';
      return out;
    },
  });
}
