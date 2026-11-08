// One way to read an order's lines everywhere (customer order page, invoice, packing slip, admin order):
// the things bought, each gift pack with its perfumes and free sample under it, and the free samples.

export interface OrderLineLike {
  id: string;
  line_type: string;
  parent_item_id?: string | null;
  product_name: string;
  qty: number;
  position: number;
}

export type OrderItemWithContents<T extends OrderLineLike> = T & { contents: T[]; packSample: T | null };

export function splitOrderLines<T extends OrderLineLike>(lines: T[] | null | undefined) {
  const sorted = [...(lines ?? [])].sort((a, b) => a.position - b.position);
  const items: OrderItemWithContents<T>[] = sorted
    .filter((l) => l.line_type === 'item')
    .map((l) => ({
      ...l,
      contents: sorted.filter((c) => c.line_type === 'pack_item' && c.parent_item_id === l.id),
      packSample: sorted.find((c) => c.line_type === 'sample' && c.parent_item_id === l.id) ?? null,
    }));
  const samples = sorted.filter((l) => l.line_type === 'sample' && !l.parent_item_id);
  return { items, samples };
}

/** "Oud × 3, Musk × 2" for a gift pack; empty for anything else. */
export function packContentsText(item: { contents?: { product_name: string; qty: number }[] }) {
  return (item.contents ?? []).map((c) => (c.qty > 1 ? `${c.product_name} × ${c.qty}` : c.product_name)).join(', ');
}
