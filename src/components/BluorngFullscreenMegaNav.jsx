import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const FULLSCREEN_NAV_CATEGORIES = [
  {
    id: 'nav-signature',
    numeral: '01',
    title: 'The Signature Collection',
    subtitle: 'Timeless luxury · Warm champagne & amber',
    slug: 'signature',
    count: '16 Flacons',
    image: '/images/saudagar_amber_gold.png',
    concentration: 'Extraits de Parfum · 38%'
  },
  {
    id: 'nav-royal',
    numeral: '02',
    title: 'The Royal Collection',
    subtitle: 'Heritage & majesty · Taif rose & royal oud',
    slug: 'royal',
    count: '12 Flacons',
    image: '/images/saudagar_imperial_ruby.png',
    concentration: 'Imperial Extraits & Pure Attars'
  },
  {
    id: 'nav-exotic',
    numeral: '03',
    title: 'The Exotic Collection',
    subtitle: 'Untamed nature · Nocturnal forest & obsidian',
    slug: 'exotic',
    count: '10 Flacons',
    image: '/images/saudagar_noir_matte.png',
    concentration: 'Obsidian & Mineral Extraits'
  },
  {
    id: 'nav-fresh',
    numeral: '04',
    title: 'The Fresh Collection',
    subtitle: 'Oceanic & citrus · Riviera azure & saline mist',
    slug: 'fresh',
    count: '8 Flacons',
    image: '/images/saudagar_royal_sapphire.png',
    concentration: 'Solar & Saline Extraits'
  },
  {
    id: 'nav-discovery-sets',
    numeral: '05',
    title: 'Discovery Sets & Vault',
    subtitle: 'Curated 10ml vault coffrets with redeemable voucher',
    slug: 'signature',
    count: '6 Coffrets',
    image: '/images/saudagar_crystal_diamond.png',
    concentration: 'Discovery Coffrets · 6 × 10ml'
  },
  {
    id: 'nav-bespoke-atelier',
    numeral: '06',
    title: 'Bespoke Atelier',
    subtitle: 'Private flacon commissions & monogramming',
    slug: 'signature',
    count: 'Made to Order',
    image: '/images/bespoke_atelier.jpg',
    concentration: 'Sur-Mesure Formulation'
  }
];

export default function BluorngFullscreenMegaNav({
  isOpen,
  onClose,
  cartCount = 0,
  theme = 'dark',
  onToggleTheme,
  onOpenCart,
  onOpenSearch,
  onOpenStory,
  onNavigateHome,
  onNavigateCollection
}) {
  const [hoveredIdx, setHoveredIdx] = useState(0);

  // Lock body scroll and listen for ESC key while open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const activeItem = FULLSCREEN_NAV_CATEGORIES[hoveredIdx] || FULLSCREEN_NAV_CATEGORIES[0];

  const handleSelect = (slug) => {
    onClose();
    onNavigateCollection(slug);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] w-screen h-screen bg-[#FFFFFF] dark:bg-[#0B0A0D] text-[#111111] dark:text-white overflow-y-auto flex flex-col justify-between select-none transition-colors duration-300"
        >
          {/* ================= 1. MINIMAL TOP BAR ================= */}
          <header className="relative z-10 w-full px-6 sm:px-12 lg:px-16 py-6 flex items-center justify-between">
            {/* Brand Title */}
            <div
              onClick={() => {
                onClose();
                onNavigateHome();
              }}
              className="flex items-center cursor-pointer group"
            >
              <img
                src="/images/saudagar_logo_black.png"
                alt="Saudagar Perfumers"
                className="h-8 sm:h-9 w-auto object-contain group-hover:opacity-80 transition-opacity dark:hidden"
              />
              <img
                src="/images/saudagar_logo_gold.png"
                alt="Saudagar Perfumers"
                className="h-8 sm:h-9 w-auto object-contain group-hover:opacity-80 transition-opacity hidden dark:block"
              />
            </div>

            {/* Right: Minimal Actions + Theme Toggle + Close */}
            <div className="flex items-center gap-4 sm:gap-6 text-[11.5px] uppercase tracking-[0.12em]">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenSearch) onOpenSearch();
                }}
                className="text-[#666666] hover:text-[#111111] dark:text-white/60 dark:hover:text-white transition-colors cursor-pointer hidden sm:block"
              >
                Search
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenCart) onOpenCart();
                }}
                className="text-[#666666] hover:text-[#111111] dark:text-white/60 dark:hover:text-white transition-colors cursor-pointer"
              >
                Bag ({cartCount})
              </button>

              {/* Theme Switcher Pill in Mega Nav */}
              {onToggleTheme && (
                <div
                  className="inline-flex items-center p-0.5 rounded-full bg-black/[0.06] dark:bg-white/10 transition-colors select-none"
                  role="radiogroup"
                  aria-label="Theme Selector"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (theme !== 'light') onToggleTheme();
                    }}
                    className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 cursor-pointer ${
                      theme === 'light'
                        ? 'bg-[#C4823F] text-white shadow-xs'
                        : 'text-[#111111]/50 dark:text-white/50 hover:text-[#111111] dark:hover:text-white'
                    }`}
                    title="Light Theme"
                    aria-label="Light Theme"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (theme !== 'dark') onToggleTheme();
                    }}
                    className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-[#C4823F] text-white shadow-xs'
                        : 'text-[#111111]/50 dark:text-white/50 hover:text-[#111111] dark:hover:text-white'
                    }`}
                    title="Noir Dark Theme"
                    aria-label="Noir Dark Theme"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Minimal Close Button */}
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-[#111111] hover:text-[#C4823F] dark:text-white dark:hover:text-[#ECC86A] transition-colors font-medium cursor-pointer"
                aria-label="Close menu"
              >
                <span>Close</span>
                <span className="text-[13px] leading-none">✕</span>
              </button>
            </div>
          </header>

          {/* ================= 2. MAIN CONTENT (Categories + Bento Grid) ================= */}
          <main className="relative z-10 flex-1 w-full px-6 sm:px-12 lg:px-16 py-6 sm:py-10 flex items-center">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              
              {/* LEFT: EDITORIAL CATEGORIES LIST (5 COLS) */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                <nav className="space-y-1.5 sm:space-y-2">
                  {FULLSCREEN_NAV_CATEGORIES.map((cat, idx) => {
                    const isHovered = hoveredIdx === idx;

                    return (
                      <div
                        key={cat.id}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onClick={() => handleSelect(cat.slug)}
                        className="group flex items-baseline justify-between py-1.5 cursor-pointer transition-all"
                      >
                        <div className="flex items-baseline gap-3 sm:gap-5">
                          {/* Numeral */}
                          <span
                            className={`text-[11.5px] sm:text-[12px] font-mono tracking-widest transition-colors duration-200 ${
                              isHovered ? 'text-[#C4823F]' : 'text-[#AAAAAA] dark:text-white/40'
                            }`}
                          >
                            {cat.numeral}
                          </span>

                          {/* Category Title */}
                          <span
                            className={`text-[20px] sm:text-[28px] lg:text-[32px] font-normal tracking-[-0.01em] transition-all duration-200 ${
                              isHovered
                                ? 'text-[#111111] dark:text-white translate-x-1.5 font-medium'
                                : 'text-[#777777] dark:text-white/60 hover:text-[#111111] dark:hover:text-white'
                            }`}
                          >
                            {cat.title}
                          </span>
                        </div>

                        {/* Minimal count indicator on hover */}
                        <span
                          className={`text-[11px] tracking-wider text-[#C4823F] dark:text-[#ECC86A] transition-opacity duration-200 hidden sm:inline ${
                            isHovered ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          Explore →
                        </span>
                      </div>
                    );
                  })}
                </nav>

                {/* Secondary Editorial Links */}
                <div className="mt-8 pt-4 flex flex-wrap items-center gap-6 sm:gap-8 text-[11px] uppercase tracking-[0.14em] text-[#777777] dark:text-white/60">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenStory) onOpenStory();
                    }}
                    className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    The Stories
                  </button>
                  <button
                    onClick={() => handleSelect('new-in')}
                    className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    New Arrivals 2026
                  </button>
                  <button
                    onClick={() => handleSelect('bespoke-atelier')}
                    className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Private Atelier
                  </button>
                </div>
              </div>

              {/* RIGHT: INTERACTIVE LUXURY BENTO GRID (7 COLS) */}
              <div className="hidden lg:grid lg:col-span-7 grid-cols-2 gap-3.5">
                
                {/* BENTO 1: DYNAMIC HERO COLLECTION SHOWCASE (Spans 2 Rows Left) */}
                <motion.div
                  key={activeItem.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleSelect(activeItem.slug)}
                  className="row-span-2 rounded-2xl bg-[#F8F7F5] dark:bg-[#141318] hover:bg-[#F2EFEA] dark:hover:bg-[#1C1A22] p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] uppercase tracking-[0.2em] font-medium text-[#C4823F]">
                      Featured Atmosphere
                    </span>
                    <span className="text-[9.5px] uppercase tracking-wider text-[#777777] dark:text-white/70 bg-white dark:bg-white/10 px-2.5 py-0.5 rounded-full">
                      {activeItem.count}
                    </span>
                  </div>

                  <div className="my-4 aspect-[4/5] flex items-center justify-center p-4">
                    <img
                      src={activeItem.image}
                      alt={activeItem.title}
                      className="max-h-[220px] object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>

                  <div>
                    <h3 className="text-[17px] font-normal uppercase tracking-wide text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] transition-colors">
                      {activeItem.title}
                    </h3>
                    <p className="text-[11.5px] text-[#777777] dark:text-white/60 mt-1 line-clamp-2 font-normal">
                      {activeItem.subtitle}
                    </p>
                    <div className="mt-3 flex items-center justify-between pt-2">
                      <span className="text-[10px] uppercase tracking-widest text-[#999999] dark:text-white/40">
                        {activeItem.concentration}
                      </span>
                      <span className="text-[11px] uppercase tracking-widest font-medium text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] flex items-center gap-1">
                        Enter World →
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* BENTO 2: DISCOVERY PRIVILEGE BOX */}
                <div
                  onClick={() => handleSelect('discovery-sets')}
                  className="rounded-2xl bg-[#F8F7F5] dark:bg-[#141318] hover:bg-[#F2EFEA] dark:hover:bg-[#1C1A22] p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] uppercase tracking-[0.2em] font-medium text-[#888888] dark:text-white/50">
                      Discovery Privilege
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#111111] dark:text-white bg-white dark:bg-white/10 px-2 py-0.5 rounded-full">
                      6 × 10ML
                    </span>
                  </div>

                  <div className="h-20 my-2 flex items-center justify-center">
                    <img
                      src="/images/saudagar_crystal_diamond.png"
                      alt="Discovery Sets"
                      className="h-full object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.08)] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div>
                    <h4 className="text-[13px] font-normal uppercase tracking-wider text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] transition-colors">
                      Complimentary Coffret
                    </h4>
                    <p className="text-[10.5px] text-[#777777] dark:text-white/60 mt-0.5 line-clamp-1">
                      Includes full bottle voucher with every purchase.
                    </p>
                  </div>
                </div>

                {/* BENTO 3: BESPOKE MONOGRAM ATELIER */}
                <div
                  onClick={() => handleSelect('bespoke-atelier')}
                  className="rounded-2xl bg-[#F8F7F5] dark:bg-[#141318] hover:bg-[#F2EFEA] dark:hover:bg-[#1C1A22] p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] uppercase tracking-[0.2em] font-medium text-[#888888] dark:text-white/50">
                      Sur-Mesure
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#C4823F] dark:text-[#ECC86A] bg-white dark:bg-white/10 px-2 py-0.5 rounded-full">
                      Atelier
                    </span>
                  </div>

                  <div className="h-20 my-2 flex items-center justify-center">
                    <img
                      src="/images/bespoke_atelier.jpg"
                      alt="Bespoke Monogram"
                      className="h-full w-full object-cover rounded-lg opacity-85 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div>
                    <h4 className="text-[13px] font-normal uppercase tracking-wider text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] transition-colors">
                      Diamond Crystal Engraving
                    </h4>
                    <p className="text-[10.5px] text-[#777777] dark:text-white/60 mt-0.5 line-clamp-1">
                      Personalized monogramming in Paris and Mumbai.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </main>

          {/* ================= 3. MINIMAL FOOTER ================= */}
          <footer className="relative z-10 w-full px-6 sm:px-12 lg:px-16 py-5 flex items-center justify-between text-[10.5px] text-[#888888] dark:text-white/50 uppercase tracking-[0.14em]">
            <span>Saudagar Haute Parfumerie · Paris · Dubai · Mumbai</span>
            <span className="hidden sm:inline text-[#AAAAAA] dark:text-white/40">Esc to close</span>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
