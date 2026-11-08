import React, { useEffect, useRef, useState } from 'react';

export const SORT_OPTIONS = [
  ['featured', 'Featured'],
  ['newest', 'Newest'],
  ['best_selling', 'Best sellers'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
];

/** "Sort by" as a clear button with its own menu (no browser drop-down), usable by mouse, touch and keyboard. */
export default function SortMenu({ value, onChange, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const current = SORT_OPTIONS.find(([v]) => v === value)?.[1] ?? 'Featured';

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 h-10 px-3.5 whitespace-nowrap border border-[#D5D2CA] dark:border-white/20 bg-white dark:bg-[#141318] text-[13px] text-tk-ink dark:text-white hover:border-tk-ink dark:hover:border-white rounded-[2px] transition-colors cursor-pointer"
      >
        <span className="text-[#5F5F5F] dark:text-white/60">Sort by:</span>
        <span className="font-semibold">{current}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Sort by"
          className={`absolute z-40 mt-1.5 min-w-[220px] py-1.5 bg-white dark:bg-[#141318] border border-[#D5D2CA] dark:border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.12)] rounded-[2px] ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {SORT_OPTIONS.map(([v, label]) => {
            const on = v === value;
            return (
              <li key={v} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(v);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-[13.5px] cursor-pointer transition-colors ${
                    on ? 'text-tk-ink dark:text-white font-semibold bg-[#F5F3EE] dark:bg-white/[0.07]' : 'text-[#333333] dark:text-white/80 hover:bg-[#F8F7F4] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {label}
                  {on && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="text-tk-accent-ink dark:text-tk-accent-night" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
