import { useEffect, useMemo, useState } from 'react';

/** Page numbers to show: always the first and last, the current one and its neighbours, gaps as null. */
export function pageWindow(page: number, pageCount: number, around = 1): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const out: (number | null)[] = [1];
  const start = Math.max(2, page - around);
  const end = Math.min(pageCount - 1, page + around);
  if (start > 2) out.push(null);
  for (let p = start; p <= end; p += 1) out.push(p);
  if (end < pageCount - 1) out.push(null);
  out.push(pageCount);
  return out;
}

export interface Paged<T> {
  page: number;
  setPage: (p: number) => void;
  pageCount: number;
  rows: T[];
  /** 1-based positions of the first and last row shown, for "Showing 26–50 of 140". */
  from: number;
  to: number;
  total: number;
  pageSize: number;
}

/** Splits a list into pages. Goes back to page 1 when `resetKey` changes (a new search or filter). */
export function usePaged<T>(items: T[], pageSize = 25, resetKey: unknown = null): Paged<T> {
  const [page, setPageRaw] = useState(1);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => setPageRaw(1), [resetKey]);
  const current = Math.min(page, pageCount);
  const rows = useMemo(() => items.slice((current - 1) * pageSize, current * pageSize), [items, current, pageSize]);
  return {
    page: current,
    setPage: (p) => setPageRaw(Math.min(Math.max(1, p), pageCount)),
    pageCount,
    rows,
    from: total ? (current - 1) * pageSize + 1 : 0,
    to: Math.min(total, current * pageSize),
    total,
    pageSize,
  };
}

/** After reordering one page, the full order: the page's new order replaces its slot in the whole list. */
export function spliceOrder(allIds: string[], start: number, pageIds: string[]): string[] {
  const out = [...allIds];
  out.splice(start, pageIds.length, ...pageIds);
  return out;
}
