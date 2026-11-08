import { pageWindow } from '../lib/paging';

/** Storefront pagination: previous, numbered pages with gaps, next. Hidden when one page is enough. */
export default function PageNav({ page, pageCount, onPage, label = 'Pages' }) {
  if (pageCount <= 1) return null;
  const cell =
    'min-w-[40px] h-10 px-3 inline-flex items-center justify-center border text-[12.5px] tabular-nums transition-colors';
  const idle =
    'border-[#D3D0C8] dark:border-white/20 hover:border-tk-ink dark:hover:border-white text-tk-ink dark:text-white';
  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-12" aria-label={label}>
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${cell} ${idle} disabled:opacity-40`}>
        ← Previous
      </button>
      {pageWindow(page, pageCount).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-1 text-[#6B6B6B] dark:text-[#A09D96]" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Page ${p}`}
            className={`${cell} ${p === page ? 'bg-tk-ink text-white border-tk-ink dark:bg-white dark:text-tk-night dark:border-white' : idle}`}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" disabled={page >= pageCount} onClick={() => onPage(page + 1)} className={`${cell} ${idle} disabled:opacity-40`}>
        Next →
      </button>
    </nav>
  );
}
