// Display helpers for the gift pack builder. The server's quote is the price that counts; these only preview it
// with the same rules (see quote in 0033_gift_pack.sql).

interface PackRules {
  count: number;
  size_ml: number;
  sample_ml: number;
  discount_percent: number;
  perfumes: { product_id: string; price: number; max_picks: number }[];
}

export function packEstimate(opts: PackRules, picks: string[]) {
  const price = new Map(opts.perfumes.map((p) => [p.product_id, Number(p.price) || 0]));
  const full = picks.reduce((sum, id) => sum + (price.get(id) ?? 0), 0);
  const discounted = Math.round((full * (100 - (Number(opts.discount_percent) || 0))) / 100);
  return { full, price: discounted, saved: full - discounted };
}

/** Room in the pack, and enough of that perfume left for one more pour. */
export function canPick(opts: PackRules, picks: string[], productId: string) {
  if (picks.length >= opts.count) return false;
  const perfume = opts.perfumes.find((p) => p.product_id === productId);
  if (!perfume) return false;
  return picks.filter((x) => x === productId).length < perfume.max_picks;
}

export function groupPicks<T extends { product_id: string; name: string }>(picks: T[]) {
  const out: { product_id: string; name: string; n: number }[] = [];
  for (const p of picks) {
    const hit = out.find((x) => x.product_id === p.product_id);
    if (hit) hit.n += 1;
    else out.push({ product_id: p.product_id, name: p.name, n: 1 });
  }
  return out;
}

/** Admin words may say {count}, {size}, {sample} and {discount}; they follow the rules when those change. */
export function fillPackText(text: string | null | undefined, opts: Pick<PackRules, 'count' | 'size_ml' | 'sample_ml' | 'discount_percent'>) {
  return String(text ?? '')
    .replaceAll('{count}', String(opts.count))
    .replaceAll('{size}', String(Number(opts.size_ml)))
    .replaceAll('{sample}', String(Number(opts.sample_ml)))
    .replaceAll('{discount}', String(Number(opts.discount_percent)));
}

/** The pack's numbers as short lines, shown next to the admin's words so those never need numbers in them. */
export function packFacts(opts: Pick<PackRules, 'count' | 'size_ml' | 'sample_ml' | 'discount_percent'>) {
  const count = Number(opts.count) || 0;
  const out = [`${count} perfume${count === 1 ? '' : 's'} of your choice`, `${Number(opts.size_ml)} ml each`];
  if (Number(opts.sample_ml) > 0) out.push(`Free ${Number(opts.sample_ml)} ml sample`);
  if (Number(opts.discount_percent) > 0) out.push(`${Number(opts.discount_percent)}% off`);
  return out;
}
