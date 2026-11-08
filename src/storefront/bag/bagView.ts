import { problemForLine, type BagLine } from './bagLines';

interface QuoteLike {
  lines?: { product_id?: string; kind?: string; key?: string | null; variant_id?: string; picks?: { product_id: string }[] }[];
  problems?: { variant_id?: string | null; key?: string | null; message: string }[];
}

/** Problems not shown on any line (e.g. two sizes needing more liquid than is left). */
export function looseProblems<Q extends QuoteLike>(quote: Q | null | undefined, bag: BagLine[]) {
  const problems = quote?.problems ?? [];
  const shown = new Set(bag.map((l) => problemForLine(quote, l)).filter(Boolean));
  return problems.filter((p) => !shown.has(p));
}

/** Every perfume in the bag, gift pack contents included (free samples steer away from these). */
export function bagProductIds(quote: QuoteLike | null | undefined): string[] {
  const ids = new Set<string>();
  for (const l of quote?.lines ?? []) {
    if (l.kind === 'gift_pack') for (const p of l.picks ?? []) ids.add(p.product_id);
    else if (l.product_id) ids.add(l.product_id);
  }
  return [...ids];
}
