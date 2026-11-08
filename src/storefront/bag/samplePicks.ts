// Free-sample slots. Each slot holds a sample size id, SURPRISE (the customer chose "Surprise me": we pick when
// packing), or nothing yet (we suggest one). The server reads anything that isn't a size id as "Surprise me".
export const SURPRISE = 'surprise';

export type SamplePick = string | null | undefined;

/** Slots, within what the bag has earned, that have no pick yet. */
export function emptySlots(picks: SamplePick[], entitlement: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < entitlement; i += 1) if (!picks[i]) out.push(i);
  return out;
}

/** Puts suggestions into the waiting slots in order; any left over become "Surprise me". */
export function fillSlots(picks: SamplePick[], entitlement: number, suggestions: string[]): string[] {
  const next: string[] = [];
  let s = 0;
  for (let i = 0; i < entitlement; i += 1) {
    const cur = picks[i];
    if (cur) next.push(cur);
    else next.push(suggestions[s++] ?? SURPRISE);
  }
  return next;
}

export function searchPool<T extends { name: string; family?: string | null; label?: string | null }>(pool: T[], term: string): T[] {
  const q = term.trim().toLowerCase();
  if (!q) return pool;
  return pool.filter((p) => [p.name, p.family, p.label].some((x) => (x ?? '').toLowerCase().includes(q)));
}
