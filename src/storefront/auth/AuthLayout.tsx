import type { ReactNode, InputHTMLAttributes } from 'react';
import { Link } from 'react-router';
import { useBlock } from '../../cms/useSite';

export function AuthLayout({ eyebrow, title, children, footer }: { eyebrow: string; title: string; children: ReactNode; footer?: ReactNode }) {
  const brand = useBlock<Record<string, string>>('brand') || {};
  return (
    <div className="min-h-[100svh] w-full bg-white dark:bg-tk-night text-tk-ink dark:text-white flex flex-col">
      <header className="h-16 px-4 sm:px-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[#EAEAEA] dark:border-white/10">
        <Link to="/" className="justify-self-start inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#5F5F5F] dark:text-white/60 hover:text-tk-ink dark:hover:text-white">
          <span aria-hidden>←</span>
          <span className="hidden sm:inline">Continue shopping</span>
        </Link>
        <Link to="/" aria-label={`${brand.name || 'Saudagar Perfumers'} home`}>
          {brand.logo_light_bg ? (
            <>
              <img src={brand.logo_light_bg} alt={brand.name || ''} className="h-6 sm:h-7 w-auto object-contain dark:hidden block" />
              {brand.logo_dark_bg && <img src={brand.logo_dark_bg} alt={brand.name || ''} className="h-6 sm:h-7 w-auto object-contain hidden dark:block" />}
            </>
          ) : (
            <span className="text-[15px] sm:text-[17px] tracking-[0.32em] font-medium uppercase">{brand.name || 'Saudagar'}</span>
          )}
        </Link>
        <span aria-hidden />
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[420px]">
          <p className="sf-eyebrow">{eyebrow}</p>
          <h1 className="text-[24px] sm:text-[28px] font-normal tracking-[-0.015em] mb-8">{title}</h1>
          {children}
          {footer && <div className="mt-8 pt-6 border-t border-[#EAEAEA] dark:border-white/10 text-[12px] text-[#666666] dark:text-white/60">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

export function AuthField({ label, error, hint, id, ...input }: FieldProps) {
  const fieldId = id ?? input.name;
  return (
    <div className="mb-5">
      <label htmlFor={fieldId} className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[#666666] dark:text-[#A09D96] mb-2">
        {label}
      </label>
      <input
        id={fieldId}
        {...input}
        aria-invalid={error ? true : undefined}
        className={`w-full px-3.5 py-3 border bg-white dark:bg-[#141318] text-[14px] text-tk-ink dark:text-white outline-none transition-colors rounded-none ${
          error ? 'border-rose-500' : 'border-[#D5D3CC] dark:border-white/15 focus:border-tk-ink dark:focus:border-tk-accent-night'
        }`}
      />
      {error ? (
        <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-[#666666] dark:text-white/40">{hint}</p>
      ) : null}
    </div>
  );
}

export function AuthButton({ children, busy, ...rest }: { children: ReactNode; busy?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={busy || rest.disabled}
      {...rest}
      className="w-full py-3.5 bg-tk-ink hover:bg-tk-accent dark:bg-tk-gold dark:hover:bg-tk-accent-night text-white dark:text-tk-night text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors disabled:opacity-60 disabled:cursor-wait"
    >
      {busy ? 'Please wait…' : children}
    </button>
  );
}

export function FormMessage({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`mb-5 px-3.5 py-3 text-[12px] border ${
        kind === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
      }`}
    >
      {children}
    </div>
  );
}
