import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[#111111] text-white hover:bg-[#C4823F] disabled:hover:bg-[#111111]',
  secondary: 'border border-[#D5D3CC] text-[#111111] bg-white hover:border-[#111111]',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-[#555555] hover:text-[#111111] hover:bg-[#F4F3EE]',
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
  const sizing = size === 'sm' ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2.5 text-[12px]';
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
