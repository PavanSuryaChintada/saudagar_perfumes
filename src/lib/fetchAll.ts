// Reads every row of a query, page by page. Works whatever the Supabase "Max rows" setting is: the first page asks
// for an exact count and the loop keeps going until it has that many rows (or a page comes back empty).

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown; count?: number | null }>;

/**
 * `page(from, to)` must build the query with `.select(cols, { count: 'exact' })`, a stable `.order(...)`, and
 * `.range(from, to)`.
 */
export async function fetchAll<T>(page: (from: number, to: number) => Page<T>, chunk = 1000): Promise<T[]> {
  const rows: T[] = [];
  let total: number | null = null;
  for (;;) {
    const { data, error, count } = await page(rows.length, rows.length + chunk - 1);
    if (error) throw error;
    if (typeof count === 'number') total = count;
    const got = data ?? [];
    rows.push(...got);
    if (got.length === 0) break;
    if (total !== null ? rows.length >= total : got.length < chunk) break;
  }
  return rows;
}
