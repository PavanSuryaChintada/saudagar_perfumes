import React from 'react';
import { useBlock } from '../cms/useSite';

/** The quiet header used by account, checkout and order pages. */
export default function MinimalHeader({ backLabel = 'Boutique', onBack, onLogo, theme = 'light', onToggleTheme, right = null }) {
  const brand = useBlock('brand') || {};
  return (
    <header className="w-full border-b border-[#F0F0F0] dark:border-white/10 bg-white/90 dark:bg-tk-night/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-10 h-16 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-[11px] uppercase tracking-[0.18em] text-[#777777] hover:text-tk-ink dark:text-[#999999] dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2"
        >
          <span>←</span>
          <span className="hidden sm:inline">{backLabel}</span>
        </button>

        <button type="button" onClick={onLogo || onBack} className="cursor-pointer" aria-label={`${brand.name || 'Saudagar'} home`}>
          {brand.logo_light_bg && <img src={brand.logo_light_bg} alt={brand.name || ''} className="h-6 w-auto object-contain dark:hidden block" />}
          {brand.logo_dark_bg && <img src={brand.logo_dark_bg} alt={brand.name || ''} className="h-6 w-auto object-contain hidden dark:block" />}
        </button>

        <div className="flex items-center gap-4 min-w-[44px] justify-end">
          {right}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="text-[11px] uppercase tracking-wider text-[#777777] dark:text-[#999999] hover:text-tk-ink dark:hover:text-white transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
