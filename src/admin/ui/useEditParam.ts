import { useEffect } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Opens the editor for `?edit=<id>` once the rows have loaded (used by the admin search and the guide), then
 * removes the parameter so closing the editor doesn't reopen it.
 */
export function useEditParam<T extends { id: string }>(rows: T[] | undefined, open: (row: T) => void) {
  const [params, setParams] = useSearchParams();
  const wanted = params.get('edit');
  useEffect(() => {
    if (!wanted || !rows?.length) return;
    const row = rows.find((r) => r.id === wanted);
    if (row) open(row);
    const next = new URLSearchParams(params);
    next.delete('edit');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, rows]);
}
