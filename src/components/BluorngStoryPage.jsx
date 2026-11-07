import React from 'react';
import { useBlock } from '../cms/useSite';
import { CmsSections } from '../cms/SectionRenderer';

export default function BluorngStoryPage({
  theme = 'light',
  onToggleTheme,
  onNavigateHome
}) {
  const brand = useBlock('brand') || {};
  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-tk-night text-tk-ink dark:text-white transition-colors duration-300 font-sans pb-32 select-none">
      
      {/* ============================================================== */}
      {/* ================= 1. MINIMAL CLEAN HEADER ==================== */}
      {/* ============================================================== */}
      <header className="w-full border-b border-[#F0F0F0] dark:border-white/10 bg-white/90 dark:bg-tk-night/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          
          <button
            onClick={onNavigateHome}
            className="text-[11px] uppercase tracking-[0.18em] text-[#777777] hover:text-tk-ink dark:text-[#999999] dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>←</span>
            <span>Boutique</span>
          </button>

          <button onClick={onNavigateHome} className="cursor-pointer" aria-label="Saudagar Home">
            {brand.logo_light_bg && <img src={brand.logo_light_bg} alt={brand.name || ''} className="h-6 w-auto object-contain dark:hidden block" />}
            {brand.logo_dark_bg && <img src={brand.logo_dark_bg} alt={brand.name || ''} className="h-6 w-auto object-contain hidden dark:block" />}
          </button>

          <div className="flex items-center gap-4">
            {onToggleTheme && (
              <button
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

      {/* Everything below the header is edited in Admin → Pages → Story. */}
      <CmsSections slug="story" />

    </div>
  );
}

