// Pure shipping logic shared by the courier adapters. No network, no Deno APIs: unit-tested with Vitest.

export type OurStatus = 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RTO';

export interface ParcelLine {
  qty: number;
  weight_g: number | null;
  length_mm?: number | null;
  width_mm?: number | null;
  height_mm?: number | null;
}

export interface BoxDefaults {
  packaging_g: number;
  default_item_g: number;
  length_mm: number;
  width_mm: number;
  height_mm: number;
}

/** Parcel weight = items (their own weight, or the default) + packaging. Box = largest item box, else the default. */
export function parcel(lines: ParcelLine[], d: BoxDefaults): { weight_g: number; length_mm: number; width_mm: number; height_mm: number } {
  const items = lines.reduce((s, l) => s + Math.max(0, l.qty) * (l.weight_g && l.weight_g > 0 ? l.weight_g : d.default_item_g), 0);
  const boxes = lines.filter((l) => l.length_mm && l.width_mm && l.height_mm);
  const biggest = boxes.sort((a, b) => b.length_mm! * b.width_mm! * b.height_mm! - a.length_mm! * a.width_mm! * a.height_mm!)[0];
  return {
    weight_g: Math.round(items + Math.max(0, d.packaging_g)),
    length_mm: biggest?.length_mm ?? d.length_mm,
    width_mm: biggest?.width_mm ?? d.width_mm,
    height_mm: biggest?.height_mm ?? d.height_mm,
  };
}

/** Cash the courier collects: the order total for unpaid COD, otherwise nothing. */
export function codCollectable(order: { payment_method: string; payment_status: string; total: number }): number {
  return order.payment_method === 'COD' && order.payment_status !== 'PAID' ? Math.round(Number(order.total) * 100) / 100 : 0;
}

export function trackingUrl(template: string | null | undefined, awb: string): string | null {
  const t = (template ?? '').trim();
  if (!t || !/^https?:\/\//i.test(t)) return null;
  return t.includes('{awb}') ? t.split('{awb}').join(encodeURIComponent(awb.trim())) : t;
}

export const isPincode = (pin: string) => /^[1-9][0-9]{5}$/.test((pin ?? '').trim());

/**
 * Delhivery status → ours. Delhivery sends Status (e.g. "In Transit", "Dispatched", "Delivered", "RTO")
 * and StatusType (UD = undelivered/forward, DL = delivered, RT = returning, PP = pickup pending).
 * UNVERIFIED against the owner's account: confirm the values with Delhivery before go-live.
 */
export function mapDelhiveryStatus(status: string, statusType?: string): OurStatus | null {
  const s = (status ?? '').trim().toLowerCase();
  const t = (statusType ?? '').trim().toUpperCase();
  if (t === 'DL' && !s.includes('rto')) return 'DELIVERED';
  if (t === 'RT' || s.startsWith('rto') || s.includes('returned')) return 'RTO';
  if (s.includes('out for delivery') || s === 'dispatched') return 'OUT_FOR_DELIVERY';
  if (s === 'delivered') return 'DELIVERED';
  if (s.includes('in transit') || s.includes('picked up') || s === 'pending' || s.includes('reached')) return 'SHIPPED';
  if (s.includes('manifested') || s.includes('not picked')) return 'PACKED';
  return null;
}

/** The order of our statuses, so updates never move an order backwards. */
const RANK: Record<string, number> = { PENDING: 0, PACKED: 1, SHIPPED: 2, OUT_FOR_DELIVERY: 3, DELIVERED: 4, RTO: 4, CANCELLED: 5 };
export function isForward(current: string, next: OurStatus): boolean {
  return (RANK[next] ?? 0) > (RANK[current] ?? 0);
}
