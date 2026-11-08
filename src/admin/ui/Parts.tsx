import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// Long admin pages split into parts: the parts are listed on the left, the chosen one shows on the right.
// Every part stays mounted (hidden when not chosen), so nothing typed is lost when switching.

export interface PartDef {
  id: string;
  label: string;
  /** Short state shown under the label, e.g. "3 sizes" or "automatic". */
  hint?: string;
  status?: 'done' | 'error' | null;
  /** Shown but not selectable yet, with the reason as its hint. */
  locked?: boolean;
}

const Current = createContext<string>('');

/** The chosen part lives in the address (?part=…), so refresh and back keep the place. */
export function usePart(parts: PartDef[], fallback?: string) {
  const [params, setParams] = useSearchParams();
  const wanted = params.get('part');
  const usable = parts.filter((p) => !p.locked);
  const current = usable.some((p) => p.id === wanted) ? (wanted as string) : fallback ?? usable[0]?.id ?? '';
  const select = (id: string) =>
    setParams(
      (cur) => {
        const next = new URLSearchParams(cur);
        next.set('part', id);
        return next;
      },
      { replace: true },
    );
  return [current, select] as const;
}

export function PartsLayout({ parts, current, onSelect, children, aside }: { parts: PartDef[]; current: string; onSelect: (id: string) => void; children: ReactNode; aside?: ReactNode }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [current]);
  return (
    <Current.Provider value={current}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[250px_minmax(0,1fr)] items-start">
        <nav aria-label="Parts of this page" className="min-w-0 lg:sticky lg:top-20 space-y-4">
          {/* Phones: the parts as a row of tabs */}
          <div className="lg:hidden flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {parts.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={p.locked}
                onClick={() => onSelect(p.id)}
                aria-current={p.id === current ? 'step' : undefined}
                className={`shrink-0 px-3 py-2 text-[13px] border whitespace-nowrap disabled:opacity-40 ${
                  p.id === current ? 'bg-[#17161B] text-white border-[#17161B]' : p.status === 'error' ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-white border-[#D6D1C6] text-[#2F2F2F]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Computers: a list on the left */}
          <ol className="hidden lg:block bg-white border border-[#E0DBD1] shadow-[0_1px_2px_rgba(20,20,20,0.05)]">
            {parts.map((p, i) => {
              const on = p.id === current;
              return (
                <li key={p.id} className="border-b border-[#ECE8DF] last:border-b-0">
                  <button
                    type="button"
                    disabled={p.locked}
                    onClick={() => onSelect(p.id)}
                    aria-current={on ? 'step' : undefined}
                    className={`w-full flex items-start gap-3 px-3.5 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                      on ? 'bg-[#17161B] text-white' : p.locked ? 'text-[#8A8A8A]' : 'hover:bg-[#FAF8F4] text-tk-ink'
                    }`}
                  >
                    <span className={`mt-[1px] w-5 shrink-0 text-[12px] tabular-nums ${on ? 'text-white/65' : 'text-[#6B6B6B]'}`}>{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[14px] leading-snug ${on ? 'font-semibold' : 'font-medium'}`}>{p.label}</span>
                      {p.hint && <span className={`block text-[12px] truncate ${on ? 'text-white/70' : p.status === 'error' ? 'text-rose-700' : 'text-[#5F5F5F]'}`}>{p.hint}</span>}
                    </span>
                    {p.status === 'done' && <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${on ? 'text-emerald-300' : 'text-emerald-700'}`} aria-label="Filled in" />}
                    {p.status === 'error' && <AlertCircle size={16} className={`mt-0.5 shrink-0 ${on ? 'text-rose-300' : 'text-rose-600'}`} aria-label="Needs fixing" />}
                  </button>
                </li>
              );
            })}
          </ol>
          {aside}
        </nav>
        <div className="min-w-0 space-y-5">
          {children}
          <StepButtons parts={parts} current={current} onSelect={onSelect} />
        </div>
      </div>
    </Current.Provider>
  );
}

/** "← Back" and "Next →" under each part, so a new item can be filled in from top to bottom. */
function StepButtons({ parts, current, onSelect }: { parts: PartDef[]; current: string; onSelect: (id: string) => void }) {
  const open = parts.filter((p) => !p.locked);
  const at = open.findIndex((p) => p.id === current);
  const prev = at > 0 ? open[at - 1] : null;
  const next = at >= 0 && at < open.length - 1 ? open[at + 1] : null;
  if (!prev && !next) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      {prev ? (
        <button type="button" onClick={() => onSelect(prev.id)} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[13.5px] text-[#3F3F3F] border border-[#C4C1B9] bg-white hover:border-tk-ink hover:text-tk-ink">
          ← Back: {prev.label}
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button type="button" onClick={() => onSelect(next.id)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13.5px] font-semibold text-white bg-tk-ink hover:bg-tk-accent">
          Next: {next.label} →
        </button>
      )}
    </div>
  );
}

/** One part of the page. Kept in the page while hidden, so its form state survives switching parts. */
export function Part({ id, children }: { id: string | string[]; children: ReactNode }) {
  const current = useContext(Current);
  const ids = Array.isArray(id) ? id : [id];
  return (
    <div hidden={!ids.includes(current)} className="space-y-5">
      {children}
    </div>
  );
}
