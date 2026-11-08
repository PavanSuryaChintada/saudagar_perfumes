import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pageWindow } from '../../lib/paging';

/** Admin pagination: "Showing 26–50 of 140" with previous / numbered pages / next. Hidden when one page is enough. */
export function Pager({
  page,
  pageCount,
  onPage,
  from,
  to,
  total,
  noun = 'items',
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
  from: number;
  to: number;
  total: number;
  noun?: string;
}) {
  if (pageCount <= 1) {
    return total > 0 ? <p className="mt-3 text-[13px] text-[#4A4A4A]">{total} {noun}</p> : null;
  }
  const btn = 'min-w-[36px] h-9 px-2 inline-flex items-center justify-center border text-[13.5px] tabular-nums';
  return (
    <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[13px] text-[#454545]">
        Showing {from}–{to} of {total} {noun}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} className={`${btn} border-[#C4C1B9] bg-white hover:border-tk-ink disabled:opacity-40`} aria-label="Previous page">
          <ChevronLeft size={15} />
        </button>
        {pageWindow(page, pageCount).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="px-1 text-[#575757]" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${btn} ${p === page ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#C4C1B9] hover:border-tk-ink'}`}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pageCount} className={`${btn} border-[#C4C1B9] bg-white hover:border-tk-ink disabled:opacity-40`} aria-label="Next page">
          <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  );
}
