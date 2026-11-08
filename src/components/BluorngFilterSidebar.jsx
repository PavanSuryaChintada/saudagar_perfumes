import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Sections shown as tap-able chips (short choices); everything else is a checkbox list.
const CHIP_SECTIONS = new Set(['offers', 'size', 'price', 'gender', 'season', 'time_of_day', 'concentration']);
// Open when the page loads; the rest open with one tap (and show how many are chosen while closed).
const OPEN_BY_DEFAULT = ['offers', 'categories', 'price', 'family'];
// Long lists start short, with a search box.
const SHORT_LIST = 8;

function Chevron({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Check({ on }) {
  return (
    <span
      className={`mt-[1px] w-[18px] h-[18px] shrink-0 flex items-center justify-center border rounded-[2px] transition-colors ${
        on ? 'bg-tk-ink dark:bg-tk-gold border-tk-ink dark:border-tk-gold text-white dark:text-tk-night' : 'bg-white dark:bg-transparent border-[#A8A49B] dark:border-white/35 group-hover:border-tk-ink dark:group-hover:border-white'
      }`}
      aria-hidden
    >
      {on && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  );
}

function CountTag({ n }) {
  return <span className="shrink-0 min-w-[26px] px-1.5 py-[1px] text-center text-[12px] tabular-nums text-[#4A4A4A] dark:text-white/60 bg-[#F2F0EB] dark:bg-white/[0.08] rounded-[2px]">{n}</span>;
}

/** A custom price range: either end may be left empty. */
function PriceRange({ min, max, span, onApply }) {
  const [lo, setLo] = useState(min ?? '');
  const [hi, setHi] = useState(max ?? '');
  useEffect(() => {
    setLo(min ?? '');
    setHi(max ?? '');
  }, [min, max]);
  const apply = () => onApply(lo === '' ? undefined : Number(lo), hi === '' ? undefined : Number(hi));
  const field = 'w-full h-10 pl-6 pr-2 border border-[#D5D2CA] dark:border-white/20 bg-white dark:bg-[#141318] text-[13.5px] text-tk-ink dark:text-white rounded-[2px] outline-none focus:border-tk-ink dark:focus:border-white';
  return (
    <form
      className="mt-3 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <label className="relative flex-1">
        <span className="sr-only">Lowest price</span>
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-[#5F5F5F]">₹</span>
        <input inputMode="numeric" value={lo} onChange={(e) => setLo(e.target.value.replace(/\D/g, ''))} placeholder={span?.min ? String(Math.floor(span.min)) : 'Min'} className={field} />
      </label>
      <span className="text-[#5F5F5F]">–</span>
      <label className="relative flex-1">
        <span className="sr-only">Highest price</span>
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-[#5F5F5F]">₹</span>
        <input inputMode="numeric" value={hi} onChange={(e) => setHi(e.target.value.replace(/\D/g, ''))} placeholder={span?.max ? String(Math.ceil(span.max)) : 'Max'} className={field} />
      </label>
      <button type="submit" className="h-10 px-3 bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night text-[12.5px] font-semibold rounded-[2px] cursor-pointer hover:bg-tk-accent dark:hover:bg-tk-accent-night transition-colors">
        Go
      </button>
    </form>
  );
}

function Section({ section, chosen, counts, onToggle, startOpen, extra }) {
  const [open, setOpen] = useState(startOpen);
  const [term, setTerm] = useState('');
  const [all, setAll] = useState(false);
  const hasCounts = !!counts;
  // Choices that match nothing right now are left out (unless already chosen), so the list stays readable.
  // "In stock only" has no count of its own and always shows.
  const usable = useMemo(
    () => section.options.filter((o) => chosen.includes(o.id) || !hasCounts || (counts[o.id] ?? 0) > 0 || (section.id === 'offers' && o.id === 'in-stock')),
    [section.options, section.id, chosen, hasCounts, counts],
  );
  const chips = CHIP_SECTIONS.has(section.id);
  const long = !chips && usable.length > SHORT_LIST;
  const q = term.trim().toLowerCase();
  const matched = q ? usable.filter((o) => o.label.toLowerCase().includes(q)) : usable;
  const shown = long && !all && !q ? [...matched.slice(0, SHORT_LIST), ...matched.slice(SHORT_LIST).filter((o) => chosen.includes(o.id))] : matched;
  if (!usable.length && !extra) return null;

  return (
    <div className="py-4">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer">
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-[12.5px] font-semibold tracking-[0.1em] uppercase text-[#1A1A1A] dark:text-white group-hover:text-tk-accent dark:group-hover:text-tk-accent-night transition-colors">{section.title}</span>
            {chosen.length > 0 && <span className="px-1.5 text-[12px] font-semibold rounded-[2px] bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night">{chosen.length}</span>}
          </span>
          {section.subtitle && <span className="block text-[12.5px] text-[#5F5F5F] dark:text-white/55 mt-0.5">{section.subtitle}</span>}
        </span>
        <span className="text-[#4A4A4A] dark:text-white/60 group-hover:text-tk-ink dark:group-hover:text-white">
          <Chevron open={open} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {long && (
                <input
                  type="search"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder={`Search ${section.title.toLowerCase()}`}
                  aria-label={`Search ${section.title.toLowerCase()}`}
                  className="w-full h-9 mb-3 px-3 border border-[#D5D2CA] dark:border-white/20 bg-white dark:bg-[#141318] text-[13px] text-tk-ink dark:text-white placeholder:text-[#7A7A7A] rounded-[2px] outline-none focus:border-tk-ink dark:focus:border-white"
                />
              )}

              {chips ? (
                <div className="flex flex-wrap gap-2">
                  {shown.map((o) => {
                    const on = chosen.includes(o.id);
                    const n = counts?.[o.id];
                    return (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onToggle(section.id, o.id)}
                        className={`inline-flex items-center gap-1.5 h-9 px-3 text-[13px] border rounded-[2px] cursor-pointer transition-colors ${
                          on
                            ? 'bg-tk-ink dark:bg-tk-gold border-tk-ink dark:border-tk-gold text-white dark:text-tk-night font-medium'
                            : 'bg-white dark:bg-transparent border-[#D5D2CA] dark:border-white/20 text-[#2A2A2A] dark:text-white/85 hover:border-tk-ink dark:hover:border-white'
                        }`}
                      >
                        {o.label}
                        {typeof n === 'number' && <span className={`text-[12px] tabular-nums ${on ? 'opacity-80' : 'text-[#6B6B6B] dark:text-white/50'}`}>{n}</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <ul className="space-y-1">
                  {shown.map((o) => {
                    const on = chosen.includes(o.id);
                    const n = counts?.[o.id];
                    return (
                      <li key={o.id}>
                        <label className="group flex items-start gap-3 py-1.5 px-1 -mx-1 cursor-pointer rounded-[2px] hover:bg-[#F8F7F4] dark:hover:bg-white/[0.04]">
                          <input type="checkbox" checked={on} onChange={() => onToggle(section.id, o.id)} className="sr-only" />
                          <Check on={on} />
                          <span className="flex-1 min-w-0">
                            <span className={`block text-[13.5px] leading-snug ${on ? 'text-tk-ink dark:text-white font-semibold' : 'text-[#2A2A2A] dark:text-white/85'}`}>{o.label}</span>
                            {o.badge && <span className="inline-block mt-1 text-[12px] uppercase tracking-[0.1em] font-medium px-1.5 rounded-[2px] bg-[#F2F0EB] dark:bg-white/10 text-[#4A4A4A] dark:text-white/70">{o.badge}</span>}
                            {o.desc && <span className="block mt-0.5 text-[12.5px] leading-snug text-[#5F5F5F] dark:text-white/55">{o.desc}</span>}
                          </span>
                          {typeof n === 'number' && <CountTag n={n} />}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}

              {q && matched.length === 0 && <p className="text-[12.5px] text-[#5F5F5F] py-1">Nothing matches “{term}”.</p>}
              {long && !q && matched.length > SHORT_LIST && (
                <button type="button" onClick={() => setAll(!all)} className="mt-2 text-[12.5px] font-semibold text-tk-accent-ink dark:text-tk-accent-night underline underline-offset-4 cursor-pointer">
                  {all ? 'Show fewer' : `Show all ${matched.length}`}
                </button>
              )}
              {extra}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The filter panel beside the products (and in the phone drawer). */
export default function BluorngFilterSidebar({
  sections = [],
  activeFilters = {},
  filterCounts = {},
  onToggleFilter,
  onClearFilters,
  onSetPriceRange,
  priceMin,
  priceMax,
  priceSpan,
  totalMatching = 0,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) {
  const activeCount = Object.values(activeFilters).reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0) + (priceMin !== undefined || priceMax !== undefined ? (activeFilters.price?.length ? 0 : 1) : 0);

  return (
    <div className={`flex flex-col ${isMobileDrawer ? 'h-full bg-white dark:bg-tk-night' : 'w-full'}`}>
      <div className={`flex items-center justify-between gap-3 border-b border-[#E3E0D8] dark:border-white/10 ${isMobileDrawer ? 'px-5 py-4' : 'pb-4'}`}>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-tk-ink dark:text-white">Filters</span>
          {activeCount > 0 && <span className="min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-[12.5px] font-bold rounded-[2px] bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night">{activeCount}</span>}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button type="button" onClick={onClearFilters} className="text-[12.5px] font-semibold text-tk-accent-ink dark:text-tk-accent-night underline underline-offset-4 cursor-pointer">
              Clear all
            </button>
          )}
          {isMobileDrawer && (
            <button type="button" onClick={onCloseMobileDrawer} aria-label="Close filters" className="w-9 h-9 flex items-center justify-center text-tk-ink dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-[2px] cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={`divide-y divide-[#E3E0D8] dark:divide-white/10 ${isMobileDrawer ? 'flex-1 overflow-y-auto px-5' : ''}`}>
        {sections.map((section) => (
          <Section
            key={section.id}
            section={section}
            chosen={activeFilters[section.id] || []}
            counts={filterCounts[section.id]}
            onToggle={onToggleFilter}
            startOpen={OPEN_BY_DEFAULT.includes(section.id) || (activeFilters[section.id] || []).length > 0}
            extra={section.id === 'price' && onSetPriceRange ? <PriceRange min={priceMin} max={priceMax} span={priceSpan} onApply={onSetPriceRange} /> : null}
          />
        ))}
      </div>

      {isMobileDrawer && (
        <div className="p-4 border-t border-[#E3E0D8] dark:border-white/10 bg-white dark:bg-tk-night sticky bottom-0">
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="w-full h-12 bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night text-[13px] font-semibold uppercase tracking-[0.12em] rounded-[2px] cursor-pointer hover:bg-tk-accent dark:hover:bg-tk-accent-night transition-colors"
          >
            Show {totalMatching} perfume{totalMatching === 1 ? '' : 's'}
          </button>
        </div>
      )}
    </div>
  );
}
