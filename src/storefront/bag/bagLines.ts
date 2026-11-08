// One set of rules for what is in the bag, used by the bag, checkout, saved bags and the quote.
// A line is either a size of a product (merged by size) or a gift pack (always its own line, quantity 1,
// identified by its key and the perfumes chosen for it).

export interface BagLine {
  variantId?: string;
  quantity: number;
  packKey?: string;
  /** Product ids, one per perfume in the pack (repeats allowed). */
  packPicks?: string[];
  [key: string]: unknown;
}

export interface SizeItem {
  variant_id: string;
  qty: number;
}
export interface PackItem {
  key: string;
  picks: string[];
}
export type QuoteItem = SizeItem | PackItem;

export const isPackLine = (l: Partial<BagLine> | null | undefined): l is BagLine & { packKey: string; packPicks: string[] } =>
  !!l && typeof l.packKey === 'string' && !!l.packKey && Array.isArray(l.packPicks);

const isSizeLine = (l: Partial<BagLine> | null | undefined): l is BagLine & { variantId: string } =>
  !!l && !isPackLine(l) && typeof l.variantId === 'string' && !!l.variantId;

/** A stable identity for a line: its size, or its pack key. */
export const lineKey = (l: BagLine) => (isPackLine(l) ? `pack:${l.packKey}` : `v:${l.variantId}`);

const clampQty = (n: unknown) => Math.max(1, Math.min(99, Number(n) || 1));

export const hasPack = (bag: BagLine[]) => bag.some(isPackLine);

/** Items shown on the bag badge: each size's quantity, and 1 per pack. */
export const bagCount = (bag: BagLine[]) => bag.reduce((n, l) => n + (isPackLine(l) ? 1 : Number(l.quantity) || 0), 0);

export function newPackKey() {
  const c = globalThis.crypto as Crypto | undefined;
  return c?.randomUUID ? c.randomUUID() : `pk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Adds a line: a size already in the bag gets the extra quantity; a pack is always added as a new line. */
export function addToBag(bag: BagLine[], item: BagLine): BagLine[] {
  if (isPackLine(item)) return [...bag, { ...item, quantity: 1 }];
  const existing = isSizeLine(item) ? bag.find((l) => isSizeLine(l) && l.variantId === item.variantId) : undefined;
  if (existing) return bag.map((l) => (l === existing ? { ...l, quantity: clampQty(l.quantity + (Number(item.quantity) || 1)) } : l));
  return [...bag, { ...item, quantity: Number(item.quantity) || 1 }];
}

/** What the server prices. Lines that can't be priced (no size, empty pack) are left out. */
export function toQuoteItems(bag: BagLine[]): QuoteItem[] {
  const out: QuoteItem[] = [];
  for (const l of bag) {
    if (isPackLine(l)) {
      if (l.packPicks.length) out.push({ key: l.packKey, picks: [...l.packPicks] });
    } else if (isSizeLine(l)) {
      out.push({ variant_id: l.variantId, qty: clampQty(l.quantity) });
    }
  }
  return out;
}

interface QuoteLike {
  lines?: { variant_id?: string; key?: string | null; kind?: string }[];
  problems?: { variant_id?: string | null; key?: string | null }[];
}

export function quoteLineFor<Q extends QuoteLike>(quote: Q | null | undefined, l: BagLine): NonNullable<Q['lines']>[number] | undefined {
  const lines = quote?.lines ?? [];
  return isPackLine(l) ? lines.find((x) => x.key === l.packKey) : lines.find((x) => !x.key && x.variant_id === l.variantId);
}

export function problemForLine<Q extends QuoteLike>(quote: Q | null | undefined, l: BagLine): NonNullable<Q['problems']>[number] | undefined {
  const problems = quote?.problems ?? [];
  return isPackLine(l) ? problems.find((p) => p.key === l.packKey) : problems.find((p) => !p.key && !!p.variant_id && p.variant_id === l.variantId);
}

// ---------------------------------------------------------------- saved bag (carts.items)
type Saved = Record<string, unknown>;

export function toSavedItems(bag: BagLine[]) {
  const out: Saved[] = [];
  for (const l of bag) {
    if (isPackLine(l)) {
      out.push({ key: l.packKey, picks: [...l.packPicks], meta: { name: l.name, image: l.image, price: l.price } });
    } else if (isSizeLine(l)) {
      out.push({
        variant_id: l.variantId,
        qty: l.quantity,
        meta: { name: l.name, image: l.image, price: l.price, size: l.size, productId: l.productId, slug: l.slug },
      });
    }
  }
  return out;
}

export function fromSavedItems(saved: unknown): BagLine[] {
  if (!Array.isArray(saved)) return [];
  const out: BagLine[] = [];
  for (const s of saved as Saved[]) {
    if (!s || typeof s !== 'object') continue;
    const meta = s.meta && typeof s.meta === 'object' ? (s.meta as Saved) : {};
    if (typeof s.key === 'string' && s.key && Array.isArray(s.picks)) {
      const picks = (s.picks as unknown[]).filter((x): x is string => typeof x === 'string');
      if (picks.length) out.push({ ...meta, packKey: s.key, packPicks: picks, quantity: 1 });
    } else if (typeof s.variant_id === 'string' && s.variant_id) {
      out.push({ ...meta, variantId: s.variant_id, quantity: clampQty(s.qty) });
    }
  }
  return out;
}

/** Signing in: the saved bag and this device's bag become one (largest quantity per size; each pack once). */
export function mergeBags(saved: BagLine[], device: BagLine[]): BagLine[] {
  const merged = new Map<string, BagLine>();
  for (const l of saved) if (isPackLine(l) || isSizeLine(l)) merged.set(lineKey(l), l);
  for (const l of device) {
    if (!isPackLine(l) && !isSizeLine(l)) continue;
    const k = lineKey(l);
    const prev = merged.get(k);
    merged.set(k, prev ? { ...prev, ...l, quantity: isPackLine(l) ? 1 : Math.max(prev.quantity, l.quantity) } : l);
  }
  return [...merged.values()];
}
