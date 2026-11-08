import type { ReactNode } from 'react';
import { X } from 'lucide-react';

/** Appears at the bottom while rows are ticked: how many, what you can do with them, and a way out. */
export function BulkBar({ count, noun, onClear, children }: { count: number; noun: [string, string]; onClear: () => void; children: ReactNode }) {
  if (!count) return null;
  return (
    <div role="region" aria-label="Actions for the selected rows" className="fixed bottom-0 inset-x-0 lg:left-[240px] z-30 bg-tk-ink text-white px-4 sm:px-8 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.12)]">
      <div className="mx-auto max-w-[1200px] flex flex-wrap items-center gap-2">
        <p className="text-[14px] font-medium mr-2">
          {count} {count === 1 ? noun[0] : noun[1]} selected
        </p>
        <div className="flex flex-wrap gap-2 flex-1">{children}</div>
        <button type="button" onClick={onClear} className="inline-flex items-center gap-1 text-[13px] text-white/80 hover:text-white px-2 py-1.5">
          <X size={14} aria-hidden /> Clear
        </button>
      </div>
    </div>
  );
}

/** A button styled for the dark bulk bar. */
export function BulkButton({ onClick, children, disabled, danger }: { onClick: () => void; children: ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium border transition-colors disabled:opacity-40 ${
        danger ? 'border-rose-300 text-rose-100 hover:bg-rose-600 hover:border-rose-600' : 'border-white/40 hover:bg-white hover:text-tk-ink'
      }`}
    >
      {children}
    </button>
  );
}

/** Row checkbox with a real label for screen readers. */
export function RowCheck({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label}
      className="h-4 w-4 accent-[rgb(var(--c-accent))] cursor-pointer shrink-0"
    />
  );
}
