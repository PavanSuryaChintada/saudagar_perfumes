import type { ComponentType, ReactNode } from 'react';

/**
 * Column headings above a list of rows, so every column says what it is. Children are the heading cells and use
 * the same widths as the row cells below. Hidden on phones, where rows stack.
 */
export function ListHead({ children, className = '', from = 'sm' }: { children: ReactNode; className?: string; from?: 'sm' | 'lg' }) {
  return (
    <div
      className={`hidden ${from === 'lg' ? 'lg:flex' : 'sm:flex'} items-center gap-3 px-3 sm:px-4 py-2.5 bg-[#ECE8DF] border-b border-[#D6D1C6] text-[12.5px] font-semibold text-[#222222] ${className}`}
    >
      {children}
    </div>
  );
}

/** A small coloured dot plus text: green when fine, amber when running low, red when out. */
export function StockText({ level, children }: { level: 'ok' | 'low' | 'out'; children: ReactNode }) {
  const dot = level === 'out' ? 'bg-rose-600' : level === 'low' ? 'bg-amber-500' : 'bg-emerald-600';
  const text = level === 'out' ? 'text-rose-700' : level === 'low' ? 'text-amber-800' : 'text-[#2F2F2F]';
  return (
    <span className={`inline-flex items-start gap-1.5 ${text}`}>
      <span className={`mt-[6px] w-2 h-2 rounded-full shrink-0 ${dot}`} aria-hidden />
      <span>{children}</span>
    </span>
  );
}

/** "Shown" or "Hidden" on the site, as a coloured label instead of crossed-out text. */
export function ShownPill({ on, onText = 'Shown', offText = 'Hidden' }: { on: boolean; onText?: string; offText?: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[12px] font-medium border ${
        on ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-[#EFEDE8] text-[#4A4A4A] border-[#D6D1C6]'
      }`}
    >
      {on ? onText : offText}
    </span>
  );
}

/** A row button with an icon and a word, e.g. "Edit". */
export function RowAction({
  icon: Icon,
  children,
  onClick,
  danger,
  label,
}: {
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center gap-1 px-2 py-1.5 text-[12.5px] text-[#3F3F3F] border border-transparent hover:border-[#C4C1B9] hover:text-tk-ink ${
        danger ? 'hover:!text-rose-700 hover:!border-rose-300' : ''
      }`}
    >
      <Icon size={13} aria-hidden /> {children}
    </button>
  );
}
