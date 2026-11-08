import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

export interface OrderItemRow {
  id: string;
  line_type: 'item' | 'sample' | 'pack_item';
  parent_item_id: string | null;
  product_name: string;
  product_slug: string | null;
  variant_label: string | null;
  image_url: string | null;
  qty: number;
  unit_price: number;
  line_total: number;
  sample_auto: boolean;
  position: number;
}

export interface OrderEventRow {
  id: number;
  kind: string;
  from_status: string | null;
  to_status: string | null;
  message: string | null;
  actor_role: string | null;
  created_at: string;
}

export interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  amount_refunded: number;
  coupon_code: string | null;
  note: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: Record<string, string | null>;
  samples_entitled: number;
  samples_short: number;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  cancel_reason: string | null;
  cancelled_by: string | null;
  created_at: string;
  packed_at: string | null;
  shipped_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  order_items: OrderItemRow[];
  order_events?: OrderEventRow[];
}

export function useMyOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['orders', 'mine', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_method, payment_status, total, created_at, order_items(id, line_type, product_name, image_url, qty)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'one', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*, order_items(*), order_events(*)').eq('id', id!).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const o = data as unknown as OrderRow;
      o.order_items = [...(o.order_items ?? [])].sort((a, b) => a.position - b.position);
      o.order_events = [...(o.order_events ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
      return o;
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { error } = await supabase.rpc('cancel_order', { p_order: id, p_reason: reason || undefined });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export const formatOrderDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '';

export const formatOrderDateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
    : '';
