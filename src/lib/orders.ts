import { formatINR } from './money';

export type OrderStatus = 'PENDING' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RTO';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Placed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RTO: 'Returned to us',
};

/** The customer-facing progress steps, in order. */
export const ORDER_STEPS: OrderStatus[] = ['PENDING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

/** Mirrors public.order_transition_allowed in the database. */
export function allowedNextStatuses(status: OrderStatus, paymentMethod: string, paymentStatus: string): OrderStatus[] {
  switch (status) {
    case 'PENDING':
      return paymentMethod === 'COD' || paymentStatus === 'PAID' ? ['PACKED', 'CANCELLED'] : ['CANCELLED'];
    case 'PACKED':
      return ['SHIPPED', 'CANCELLED'];
    case 'SHIPPED':
      return ['OUT_FOR_DELIVERY', 'DELIVERED', 'RTO'];
    case 'OUT_FOR_DELIVERY':
      return ['DELIVERED', 'RTO'];
    default:
      return [];
  }
}

export interface PaymentInfo {
  payment_method: string;
  payment_status: string;
  total: number;
  amount_refunded?: number | null;
  status?: string;
}

/** One wording for payment everywhere: customer orders, admin and invoices. */
export function paymentLabel(o: PaymentInfo): string {
  const cod = o.payment_method === 'COD';
  switch (o.payment_status) {
    case 'PAID':
      return cod ? 'Paid (cash collected)' : 'Paid';
    case 'FAILED':
      return 'Payment failed';
    case 'REFUNDED':
      return 'Refunded';
    case 'PARTIALLY_REFUNDED':
      return `Partially refunded${o.amount_refunded ? ` · ${formatINR(Number(o.amount_refunded))}` : ''}`;
    default:
      if (cod) return o.status === 'CANCELLED' || o.status === 'RTO' ? 'Cash on delivery · nothing due' : `Cash on delivery · ${formatINR(Number(o.total))} due`;
      return 'Awaiting payment';
  }
}

export function canCustomerCancel(status: string): boolean {
  return status === 'PENDING';
}

/** How many of the chosen orders can be packed, shipped or delivered next (the bulk bar shows only those). */
export function bulkOrderActions(orders: { status: string; payment_method: string; payment_status: string }[]) {
  const can = (to: OrderStatus) => orders.filter((o) => allowedNextStatuses(o.status as OrderStatus, o.payment_method, o.payment_status).includes(to)).length;
  return { pack: can('PACKED'), ship: can('SHIPPED'), deliver: can('DELIVERED') };
}
