import React from 'react';
import { useBlock } from '../cms/useSite';

/** The quiet header used at checkout: a way back, the logo, and a reminder that payment is secure. */
export default function MinimalHeader({ backLabel = 'Continue shopping', onBack, onLogo }) {
  const brand = useBlock('brand') || {};
  return (
    <header className="w-full border-b border-[#F0F0F0] dark:border-white/10 bg-white/95 dark:bg-tk-night/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="justify-self-start h-10 min-w-10 -ml-2 px-2 text-[12px] uppercase tracking-[0.18em] text-[#5F5F5F] hover:text-tk-ink dark:text-[#999999] dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2"
          aria-label={backLabel}
        >
          <span aria-hidden>←</span>
          <span className="hidden sm:inline">{backLabel}</span>
        </button>

        <button type="button" onClick={onLogo || onBack} className="cursor-pointer" aria-label={`${brand.name || 'Saudagar'} home`}>
          {brand.logo_light_bg && <img src={brand.logo_light_bg} alt={brand.name || ''} className="h-6 sm:h-7 w-auto object-contain dark:hidden block" />}
          {brand.logo_dark_bg && <img src={brand.logo_dark_bg} alt={brand.name || ''} className="h-6 sm:h-7 w-auto object-contain hidden dark:block" />}
        </button>

        <span className="justify-self-end inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.16em] text-[#5F5F5F] dark:text-[#999999]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="4" y="11" width="16" height="10" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span className="hidden sm:inline">Secure checkout</span>
        </span>
      </div>
    </header>
  );
}
