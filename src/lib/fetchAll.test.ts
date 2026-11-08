import { describe, expect, it } from 'vitest';
import { fetchAll } from './fetchAll';

/** A fake table of `n` rows behind a server that never returns more than `cap` rows per request. */
function table(n: number, cap: number) {
  const all = Array.from({ length: n }, (_, i) => ({ i }));
  let calls = 0;
  const page = async (from: number, to: number) => {
    calls += 1;
    return { data: all.slice(from, Math.min(to + 1, from + cap)), error: null, count: n };
  };
  return { page, calls: () => calls };
}

describe('fetchAll', () => {
  it('reads every row in pages', async () => {
    const t = table(2500, 1000);
    expect((await fetchAll(t.page)).length).toBe(2500);
    expect(t.calls()).toBe(3);
  });
  it('does not stop early when the server caps rows below the page size', async () => {
    const t = table(1200, 500);
    const rows = await fetchAll(t.page);
    expect(rows.length).toBe(1200);
    expect(rows[1199]).toEqual({ i: 1199 });
  });
  it('handles an empty table', async () => {
    expect(await fetchAll(table(0, 1000).page)).toEqual([]);
  });
  it('throws the query error', async () => {
    await expect(fetchAll(async () => ({ data: null, error: new Error('boom') }))).rejects.toThrow('boom');
  });
});
