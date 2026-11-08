import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-tk-ink text-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] hover:bg-tk-accent disabled:hover:bg-tk-ink',
  secondary: 'border border-[#BDB8AD] text-tk-ink bg-white hover:border-tk-ink hover:bg-[#FAF8F4]',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-[#454545] hover:text-tk-ink hover:bg-[#F4F3EE]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  busy,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; busy?: boolean; children: ReactNode }) {
  const sizing = size === 'sm' ? 'px-3 py-1.5 text-[12.5px]' : 'px-4 py-2.5 text-[13.5px]';
  return (
    <button
      type={type}
      disabled={busy || rest.disabled}
      {...rest}
      className={`inline-flex items-center justify-center gap-2 font-medium tracking-[0.02em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizing} ${VARIANTS[variant]} ${className}`}
    >
      {busy ? 'Working…' : children}
    </button>
  );
}
