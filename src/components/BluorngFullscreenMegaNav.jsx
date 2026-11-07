import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlock, useGo } from '../cms/useSite';

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
  // Everything in this menu is edited in Admin → Site content → Menus.
  const nav = useBlock('mega_nav') || {};
  const brand = useBlock('brand') || {};
  const go = useGo();
  const FULLSCREEN_NAV_CATEGORIES = (nav.items || []).map((it, i) => ({ ...it, id: `nav-${i}` }));
  const [hoveredIdx, setHoveredIdx] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const videoRefs = useRef({});
  const hoverTimerRef = useRef(null);

  // Debounced hover handler prevents glitching when cursor sweeps past items
  const handleHover = (idx) => {
    setHoveredIdx(idx);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      if (idx !== activeIdx) {
        setPrevIdx(activeIdx);
        setActiveIdx(idx);

        const targetCat = FULLSCREEN_NAV_CATEGORIES[idx];
        if (targetCat) {
          const targetVid = videoRefs.current[targetCat.id];
          if (targetVid) {
            targetVid.muted = true;
            targetVid.play().catch(() => {});
          }
        }
      }
    }, 60);
  };

  // Clean up previous video after crossfade completes
  useEffect(() => {
    if (prevIdx !== null) {
      const timer = setTimeout(() => {
        setPrevIdx(null);
        Object.entries(videoRefs.current).forEach(([id, vid]) => {
          const currentCat = FULLSCREEN_NAV_CATEGORIES[activeIdx];
          if (currentCat && id !== currentCat.id && vid && !vid.paused) {
            vid.pause();
          }
        });
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [prevIdx, activeIdx]);

  // Ensure active video is playing when menu opens
  useEffect(() => {
    if (isOpen) {
      const initialCat = FULLSCREEN_NAV_CATEGORIES[activeIdx] || FULLSCREEN_NAV_CATEGORIES[0];
      const vid = initialCat ? videoRefs.current[initialCat.id] : null;
      if (vid && vid.paused) {
        vid.muted = true;
        vid.play().catch(() => {});
      }
    }
  }, [isOpen, activeIdx]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const activeItem = FULLSCREEN_NAV_CATEGORIES[activeIdx] || FULLSCREEN_NAV_CATEGORIES[0];
  const sideCells = (nav.side_cells || []).slice(0, 2);

  const handleSelect = (link) => {
    onClose();
    go(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] w-screen h-screen bg-[#FFFFFF] dark:bg-tk-night text-tk-ink dark:text-white overflow-y-auto flex flex-col justify-between select-none transition-colors duration-300"
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
              {brand.logo_light_bg && (
                <img
                  src={brand.logo_light_bg}
                  alt={brand.name || ''}
                  className="h-8 sm:h-9 w-auto object-contain group-hover:opacity-80 transition-opacity dark:hidden"
                />
              )}
              {brand.logo_dark_bg && (
                <img
                  src={brand.logo_dark_bg}
                  alt={brand.name || ''}
                  className="h-8 sm:h-9 w-auto object-contain group-hover:opacity-80 transition-opacity hidden dark:block"
                />
              )}
            </div>

            {/* Right: Minimal Actions + Theme Toggle + Close */}
            <div className="flex items-center gap-4 sm:gap-6 text-[11.5px] uppercase tracking-[0.12em]">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenSearch) onOpenSearch();
                }}
                className="text-[#666666] hover:text-tk-ink dark:text-white/60 dark:hover:text-white transition-colors cursor-pointer hidden sm:block"
              >
                Search
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenCart) onOpenCart();
                }}
                className="text-[#666666] hover:text-tk-ink dark:text-white/60 dark:hover:text-white transition-colors cursor-pointer"
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
                        ? 'bg-tk-accent text-white shadow-xs'
                        : 'text-tk-ink/50 dark:text-white/50 hover:text-tk-ink dark:hover:text-white'
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
                        ? 'bg-tk-gold text-tk-night font-medium shadow-xs'
                        : 'text-tk-ink/50 dark:text-white/50 hover:text-tk-ink dark:hover:text-white'
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
                className="flex items-center gap-2 text-tk-ink hover:text-tk-accent dark:text-white dark:hover:text-tk-accent-night transition-colors font-medium cursor-pointer"
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
                        onMouseEnter={() => handleHover(idx)}
                        onClick={() => handleSelect(cat.link)}
                        className="group flex items-baseline justify-between py-1.5 cursor-pointer transition-all"
                      >
                        <div className="flex items-baseline gap-3 sm:gap-5">
                          {/* Numeral */}
                          <span
                            className={`text-[11.5px] sm:text-[12px] font-mono tracking-widest transition-colors duration-200 ${
                              isHovered ? 'text-tk-accent dark:text-tk-accent-night' : 'text-[#AAAAAA] dark:text-white/40'
                            }`}
                          >
                            {cat.numeral}
                          </span>

                          {/* Category Title */}
                          <span
                            className={`text-[20px] sm:text-[28px] lg:text-[32px] font-normal tracking-[-0.01em] transition-all duration-200 ${
                              isHovered
                                ? 'text-tk-ink dark:text-white translate-x-1.5 font-medium'
                                : 'text-[#777777] dark:text-white/60 hover:text-tk-ink dark:hover:text-white'
                            }`}
                          >
                            {cat.title}
                          </span>
                        </div>

                        {/* Minimal count indicator on hover */}
                        <span
                          className={`text-[11px] tracking-wider text-tk-accent dark:text-tk-accent-night transition-opacity duration-200 hidden sm:inline ${
                            isHovered ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          {cat.count_label || 'Explore →'}
                        </span>
                      </div>
                    );
                  })}
                </nav>

                {/* ================= OLFACTORY NOTES DIRECT ACCESS ================= */}
                {(nav.accords || []).length > 0 && (
                  <div className="mt-5 pt-4 border-t border-black/[0.08] dark:border-white/[0.08]">
                    {nav.accords_heading && (
                      <p className="text-[9.5px] uppercase tracking-[0.2em] font-medium text-tk-accent dark:text-tk-accent-night mb-2.5">
                        {nav.accords_heading}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {nav.accords.map((note, i) => (
                        <button
                          key={`${note.label}-${i}`}
                          onClick={() => handleSelect(note.link)}
                          className="px-2.5 py-1 rounded-md bg-black/[0.04] hover:bg-tk-accent dark:bg-white/[0.06] dark:hover:bg-tk-accent-night text-[10.5px] text-[#444444] hover:text-white dark:text-white/80 dark:hover:text-tk-night transition-all cursor-pointer border border-black/[0.04] dark:border-white/[0.06]"
                        >
                          {note.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ================= ATELIER QUICK CONVERSION CTAS ================= */}
                {(nav.quick_cards || []).length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {nav.quick_cards.slice(0, 2).map((card, i) => (
                      <div
                        key={`${card.title}-${i}`}
                        onClick={() => handleSelect(card.link)}
                        className="p-2.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between text-tk-accent dark:text-tk-accent-night text-[9.5px] font-mono uppercase">
                          <span>{card.kicker}</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                        <p className="text-[11.5px] font-medium text-tk-ink dark:text-white mt-0.5">{card.title}</p>
                        {card.subtitle && <p className="text-[9.5px] text-[#777777] dark:text-white/50">{card.subtitle}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Secondary Editorial Links */}
                {(nav.secondary_links || []).length > 0 && (
                  <div className="mt-4 pt-3 flex flex-wrap items-center gap-5 text-[10.5px] uppercase tracking-[0.14em] text-[#777777] dark:text-white/60">
                    {nav.secondary_links.map((l, i) => (
                      <button
                        key={`${l.label}-${i}`}
                        onClick={() => {
                          if (l.action === 'stories') {
                            onClose();
                            if (onOpenStory) onOpenStory();
                          } else handleSelect(l.link);
                        }}
                        className="hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>{l.label}</span>
                        <span>→</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: BENTO GRID WITH ZERO-GLITCH CROSSFADE VIDEOS (7 COLS) */}
              {activeItem && (
              <div className="hidden lg:grid lg:col-span-7 grid-cols-12 gap-3.5 h-[530px]">
                
                {/* PRIMARY BENTO: ZERO-GLITCH CROSSFADE VIDEO STAGE (7 COLS) */}
                <div
                  onClick={() => handleSelect(activeItem.link)}
                  className="col-span-7 h-[530px] rounded-md overflow-hidden relative group cursor-pointer shadow-[0_15px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-black/[0.08] dark:border-white/10 bg-tk-night"
                >
                  {/* Persistent video layers: never unmount, never black-flash, butter-smooth crossfade */}
                  {FULLSCREEN_NAV_CATEGORIES.map((cat, idx) => {
                    const isCurrent = idx === activeIdx;
                    const isPrev = idx === prevIdx;

                    return (
                      <div
                        key={cat.id}
                        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 ease-in-out will-change-opacity ${
                          isCurrent ? 'opacity-100 z-20' : isPrev ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                      >
                        {cat.video ? (
                          <video
                            ref={(el) => {
                              if (el) videoRefs.current[cat.id] = el;
                            }}
                            src={cat.video}
                            poster={cat.image}
                            autoPlay={idx === 0}
                            loop
                            muted
                            playsInline
                            preload="auto"
                            disablePictureInPicture
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={cat.image}
                            alt={cat.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Minimal Floating Top Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none z-30">
                    <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[9px] uppercase tracking-[0.16em] text-white/90 flex items-center gap-1.5 border border-white/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-tk-accent-night animate-pulse" />
                      <span>{activeItem.video ? nav.feature_badge_video : nav.feature_badge_image}</span>
                    </div>
                    {activeItem.count_label && (
                      <span className="text-[9px] uppercase tracking-wider text-white/85 bg-black/55 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/10">
                        {activeItem.count_label}
                      </span>
                    )}
                  </div>

                  {/* Translucent bottom gradient with title, details and direct CTAs */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-black/95 via-black/55 to-transparent z-30 flex flex-col justify-end pointer-events-auto">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9.5px] uppercase tracking-[0.2em] text-tk-accent-night font-semibold">
                          {activeItem.count_label}
                        </span>
                        <span className="text-white/40 text-[9px]">•</span>
                        <span className="text-[9.5px] uppercase tracking-wider text-white/70">
                          {activeItem.concentration}
                        </span>
                      </div>
                      <h4 className="text-[18px] font-normal tracking-wide text-white">
                        {activeItem.title}
                      </h4>
                      <p className="text-[11px] text-white/75 mt-0.5 line-clamp-1">
                        {activeItem.subtitle}
                      </p>
                    </div>

                    {/* Direct Action CTAs on the video */}
                    <div className="mt-3.5 pt-3 border-t border-white/15 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(activeItem.link);
                        }}
                        className="flex-1 py-2 px-3 rounded-md bg-tk-accent hover:bg-tk-accent-night text-tk-night font-medium text-[10px] uppercase tracking-[0.16em] transition-all duration-200 text-center shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        {[nav.feature_cta_prefix, (activeItem.title || '').replace(/^the\s+/i, '')].filter(Boolean).join(' ')} →
                      </button>
                      {nav.feature_secondary_cta?.label && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(nav.feature_secondary_cta.link);
                          }}
                          className="py-2 px-2.5 rounded-md bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-[9.5px] uppercase tracking-[0.14em] transition-all cursor-pointer whitespace-nowrap"
                        >
                          {nav.feature_secondary_cta.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* BESIDE THE VIDEO: TWO STABLE BENTO CELLS (RIGHT COLUMN, 5 COLS) */}
                <div className="col-span-5 flex flex-col gap-3.5 h-[530px]">
                  {sideCells.map((cell, i) => (
                    <div
                      key={`${cell.title}-${i}`}
                      onClick={() => handleSelect(cell.link)}
                      className="h-[256.5px] rounded-md overflow-hidden relative group cursor-pointer shadow-[0_12px_28px_rgba(0,0,0,0.16)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.65)] border border-black/[0.08] dark:border-white/10 bg-tk-night"
                    >
                      {cell.video ? (
                        <video
                          src={cell.video}
                          poster={cell.image || undefined}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="auto"
                          disablePictureInPicture
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                        />
                      ) : cell.image ? (
                        <img src={cell.image} alt="" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out" />
                      ) : null}

                      {cell.badge && (
                        <div className="absolute top-3 left-3 pointer-events-none z-10">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[8.5px] uppercase tracking-[0.14em] text-white/90 border border-white/15 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-tk-accent-night" />
                            <span>{cell.badge}</span>
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/90 via-black/45 to-transparent z-10 flex items-end justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h5 className="text-[13.5px] font-normal tracking-wide text-white group-hover:text-tk-accent-night transition-colors truncate">
                            {cell.title}
                          </h5>
                          {cell.subtitle && <p className="text-[10px] text-white/75 mt-0.5 line-clamp-1">{cell.subtitle}</p>}
                        </div>
                        {cell.cta_label && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(cell.link);
                            }}
                            className="px-2.5 py-1.5 rounded-md bg-white/20 hover:bg-tk-accent text-white text-[9.5px] uppercase tracking-[0.14em] font-medium transition-all shrink-0 cursor-pointer backdrop-blur-xs whitespace-nowrap"
                          >
                            {cell.cta_label}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
              )}

            </div>
          </main>

          {/* ================= 3. MINIMAL FOOTER ================= */}
          <footer className="relative z-10 w-full px-6 sm:px-12 lg:px-16 py-5 flex items-center justify-between text-[10.5px] text-[#888888] dark:text-white/50 uppercase tracking-[0.14em]">
            <span>{nav.footer_text}</span>
            <span className="hidden sm:inline text-[#AAAAAA] dark:text-white/40">Esc to close</span>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
