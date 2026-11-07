import React, { useState, useEffect, useRef } from 'react';
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
    video: '/videos/meganavbar/Perfume_bottle_on_marble_pedestal_cc9e5900_1080p_gwr_video_mvp.mp4',
    concentration: 'Extraits de Parfum · 38%',
    sideBento: [
      {
        id: 'sig-side-1',
        title: 'The Royal Court',
        subtitle: 'Taif rose & palace agarwood',
        badge: 'Palace 4K',
        video: '/videos/Perfume_bottles_in_royal_palace_e1347222_1080p.mp4',
        slug: 'royal'
      },
      {
        id: 'sig-side-2',
        title: 'The Desert Dunes',
        subtitle: 'Nocturnal sands & solar resins',
        badge: 'Oasis 4K',
        video: '/videos/Perfume_bottle_in_desert_92b81cd7_1080p_gwr_video_mvp.mp4',
        slug: 'exotic'
      }
    ]
  },
  {
    id: 'nav-royal',
    numeral: '02',
    title: 'The Royal Collection',
    subtitle: 'Heritage & majesty · Taif rose & royal oud',
    slug: 'royal',
    count: '12 Flacons',
    image: '/images/saudagar_imperial_ruby.png',
    video: '/videos/Perfume_bottles_in_royal_palace_e1347222_1080p.mp4',
    concentration: 'Imperial Extraits & Pure Attars',
    sideBento: [
      {
        id: 'royal-side-1',
        title: 'Signature Pedestal',
        subtitle: 'Warm champagne & amber on marble',
        badge: 'Signature 4K',
        video: '/videos/meganavbar/Perfume_bottle_on_marble_pedestal_cc9e5900_1080p_gwr_video_mvp.mp4',
        slug: 'signature'
      },
      {
        id: 'royal-side-2',
        title: 'Prestige Noir Flacon',
        subtitle: 'Rain reflections & obsidian extrait',
        badge: 'Prestige 4K',
        video: '/videos/Perfume_bottle_in_luxury_setting_e094f368_1080p.mp4',
        slug: 'exotic'
      }
    ]
  },
  {
    id: 'nav-exotic',
    numeral: '03',
    title: 'The Exotic Collection',
    subtitle: 'Untamed nature · Nocturnal forest & obsidian',
    slug: 'exotic',
    count: '10 Flacons',
    image: '/images/saudagar_noir_matte.png',
    video: '/videos/Perfume_bottle_in_desert_92b81cd7_1080p_gwr_video_mvp.mp4',
    concentration: 'Obsidian & Mineral Extraits',
    sideBento: [
      {
        id: 'exotic-side-1',
        title: 'Midnight Noir Extrait',
        subtitle: 'Prestige luxury edition',
        badge: 'Noir 4K',
        video: '/videos/Perfume_bottle_in_luxury_setting_e094f368_1080p.mp4',
        slug: 'exotic'
      },
      {
        id: 'exotic-side-2',
        title: 'Signature Pedestal',
        subtitle: 'Warm champagne & amber on marble',
        badge: 'Signature 4K',
        video: '/videos/meganavbar/Perfume_bottle_on_marble_pedestal_cc9e5900_1080p_gwr_video_mvp.mp4',
        slug: 'signature'
      }
    ]
  },
  {
    id: 'nav-fresh',
    numeral: '04',
    title: 'The Fresh Collection',
    subtitle: 'Oceanic & citrus · Riviera azure & saline mist',
    slug: 'fresh',
    count: '8 Flacons',
    image: '/images/saudagar_royal_sapphire.png',
    video: '/videos/Perfume_bottle_on_coastal_landscape_76c07432_1080p.mp4',
    concentration: 'Solar & Saline Extraits',
    sideBento: [
      {
        id: 'fresh-side-1',
        title: 'Signature Pedestal',
        subtitle: 'Warm champagne & amber on marble',
        badge: 'Signature 4K',
        video: '/videos/meganavbar/Perfume_bottle_on_marble_pedestal_cc9e5900_1080p_gwr_video_mvp.mp4',
        slug: 'signature'
      },
      {
        id: 'fresh-side-2',
        title: 'The Royal Court',
        subtitle: 'Taif rose & palace agarwood',
        badge: 'Palace 4K',
        video: '/videos/Perfume_bottles_in_royal_palace_e1347222_1080p.mp4',
        slug: 'royal'
      }
    ]
  },
  {
    id: 'nav-discovery-sets',
    numeral: '05',
    title: 'Discovery Sets & Vault',
    subtitle: 'Curated 10ml vault coffrets with redeemable voucher',
    slug: 'signature',
    count: '6 Coffrets',
    image: '/images/saudagar_crystal_diamond.png',
    concentration: 'Discovery Coffrets · 6 × 10ml',
    sideBento: [
      {
        id: 'discovery-side-1',
        title: 'Signature Pedestal',
        subtitle: 'Warm champagne & amber on marble',
        badge: 'Signature 4K',
        video: '/videos/meganavbar/Perfume_bottle_on_marble_pedestal_cc9e5900_1080p_gwr_video_mvp.mp4',
        slug: 'signature'
      },
      {
        id: 'discovery-side-2',
        title: 'The Royal Court',
        subtitle: 'Taif rose & palace agarwood',
        badge: 'Palace 4K',
        video: '/videos/Perfume_bottles_in_royal_palace_e1347222_1080p.mp4',
        slug: 'royal'
      }
    ]
  },
  {
    id: 'nav-bespoke-atelier',
    numeral: '06',
    title: 'Bespoke Atelier',
    subtitle: 'Private flacon commissions & monogramming',
    slug: 'signature',
    count: 'Made to Order',
    image: '/images/bespoke_atelier.jpg',
    concentration: 'Sur-Mesure Formulation',
    sideBento: [
      {
        id: 'bespoke-side-1',
        title: 'Signature Pedestal',
        subtitle: 'Warm champagne & amber on marble',
        badge: 'Signature 4K',
        video: '/videos/meganavbar/Perfume_bottle_on_marble_pedestal_cc9e5900_1080p_gwr_video_mvp.mp4',
        slug: 'signature'
      },
      {
        id: 'bespoke-side-2',
        title: 'Midnight Noir Extrait',
        subtitle: 'Obsidian extrait & night florals',
        badge: 'Noir 4K',
        video: '/videos/Perfume_bottle_in_luxury_setting_e094f368_1080p.mp4',
        slug: 'bespoke-atelier'
      }
    ]
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
      const vid = videoRefs.current[initialCat.id];
      if (vid && vid.paused) {
        vid.muted = true;
        vid.play().catch(() => {});
      }
    }
  }, [isOpen, activeIdx]);

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
                        ? 'bg-[#D4AF37] text-[#0B0A0D] font-medium shadow-xs'
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
                        onMouseEnter={() => handleHover(idx)}
                        onClick={() => handleSelect(cat.slug)}
                        className="group flex items-baseline justify-between py-1.5 cursor-pointer transition-all"
                      >
                        <div className="flex items-baseline gap-3 sm:gap-5">
                          {/* Numeral */}
                          <span
                            className={`text-[11.5px] sm:text-[12px] font-mono tracking-widest transition-colors duration-200 ${
                              isHovered ? 'text-[#C4823F] dark:text-[#ECC86A]' : 'text-[#AAAAAA] dark:text-white/40'
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

                {/* ================= OLFACTORY NOTES DIRECT ACCESS ================= */}
                <div className="mt-5 pt-4 border-t border-black/[0.08] dark:border-white/[0.08]">
                  <p className="text-[9.5px] uppercase tracking-[0.2em] font-medium text-[#C4823F] dark:text-[#ECC86A] mb-2.5">
                    Direct Olfactory Accords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Rare Oud & Agarwood', slug: 'royal' },
                      { label: 'Taif Rose & Florals', slug: 'royal' },
                      { label: 'Warm Amber & Resins', slug: 'signature' },
                      { label: 'Riviera Marine Citrus', slug: 'fresh' },
                      { label: 'Smoked Incense & Woods', slug: 'exotic' }
                    ].map((note) => (
                      <button
                        key={note.label}
                        onClick={() => handleSelect(note.slug)}
                        className="px-2.5 py-1 rounded-md bg-black/[0.04] hover:bg-[#C4823F] dark:bg-white/[0.06] dark:hover:bg-[#ECC86A] text-[10.5px] text-[#444444] hover:text-white dark:text-white/80 dark:hover:text-[#0B0A0D] transition-all cursor-pointer border border-black/[0.04] dark:border-white/[0.06]"
                      >
                        {note.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ================= ATELIER QUICK CONVERSION CTAS ================= */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div
                    onClick={() => handleSelect('signature')}
                    className="p-2.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between text-[#C4823F] dark:text-[#ECC86A] text-[9.5px] font-mono">
                      <span>01 DISCOVERY</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                    <p className="text-[11.5px] font-medium text-[#111111] dark:text-white mt-0.5">
                      Sample Vault (AED 280)
                    </p>
                    <p className="text-[9.5px] text-[#777777] dark:text-white/50">
                      6 × 10ml with flacon voucher
                    </p>
                  </div>

                  <div
                    onClick={() => handleSelect('signature')}
                    className="p-2.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between text-[#C4823F] dark:text-[#ECC86A] text-[9.5px] font-mono">
                      <span>02 SUR-MESURE</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                    <p className="text-[11.5px] font-medium text-[#111111] dark:text-white mt-0.5">
                      Monogram Atelier
                    </p>
                    <p className="text-[9.5px] text-[#777777] dark:text-white/50">
                      Signature monogram flacons
                    </p>
                  </div>
                </div>

                {/* Secondary Editorial Links */}
                <div className="mt-4 pt-3 flex flex-wrap items-center gap-5 text-[10.5px] uppercase tracking-[0.14em] text-[#777777] dark:text-white/60">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenStory) onOpenStory();
                    }}
                    className="hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>The Stories</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => handleSelect('signature')}
                    className="hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>All 18 Formulations</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => handleSelect('signature')}
                    className="hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Complimentary Shipping</span>
                  </button>
                </div>
              </div>

              {/* RIGHT: BENTO GRID WITH ZERO-GLITCH CROSSFADE VIDEOS (7 COLS) */}
              <div className="hidden lg:grid lg:col-span-7 grid-cols-12 gap-3.5 h-[530px]">
                
                {/* PRIMARY BENTO: ZERO-GLITCH CROSSFADE VIDEO STAGE (7 COLS) */}
                <div
                  onClick={() => handleSelect(activeItem.slug)}
                  className="col-span-7 h-[530px] rounded-md overflow-hidden relative group cursor-pointer shadow-[0_15px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-black/[0.08] dark:border-white/10 bg-[#0B0A0D]"
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
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ECC86A] animate-pulse" />
                      <span>{activeItem.video ? '4K Atelier' : 'Editorial'}</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-white/85 bg-black/55 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/10">
                      {activeItem.count}
                    </span>
                  </div>

                  {/* Translucent bottom gradient with title, details and direct CTAs */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-black/95 via-black/55 to-transparent z-30 flex flex-col justify-end pointer-events-auto">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#ECC86A] font-semibold">
                          {activeItem.count}
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
                          handleSelect(activeItem.slug);
                        }}
                        className="flex-1 py-2 px-3 rounded-md bg-[#C4823F] hover:bg-[#ECC86A] text-[#0B0A0D] font-medium text-[10px] uppercase tracking-[0.16em] transition-all duration-200 text-center shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        Shop {activeItem.title.replace('The ', '')} →
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect('discovery-sets');
                        }}
                        className="py-2 px-2.5 rounded-md bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-[9.5px] uppercase tracking-[0.14em] transition-all cursor-pointer whitespace-nowrap"
                      >
                        Sample Vault
                      </button>
                    </div>
                  </div>
                </div>

                {/* BESIDE THE VIDEO: TWO PERMANENT STABLE BENTO CELLS (RIGHT COLUMN, 5 COLS) */}
                <div className="col-span-5 flex flex-col gap-3.5 h-[530px]">
                  {/* Top Cell: Royal Palace 4K Video */}
                  <div
                    onClick={() => handleSelect('royal')}
                    className="h-[256.5px] rounded-md overflow-hidden relative group cursor-pointer shadow-[0_12px_28px_rgba(0,0,0,0.16)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.65)] border border-black/[0.08] dark:border-white/10 bg-[#0B0A0D]"
                  >
                    <video
                      src="/videos/Perfume_bottles_in_royal_palace_e1347222_1080p.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      disablePictureInPicture
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                    />

                    {/* Minimal Floating Badge */}
                    <div className="absolute top-3 left-3 pointer-events-none z-10">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[8.5px] uppercase tracking-[0.14em] text-white/90 border border-white/15 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ECC86A]" />
                        <span>Palace 4K</span>
                      </span>
                    </div>

                    {/* Bottom subtle title gradient with Direct CTA button */}
                    <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/90 via-black/45 to-transparent z-10 flex items-end justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h5 className="text-[13.5px] font-normal tracking-wide text-white group-hover:text-[#ECC86A] transition-colors truncate">
                          The Royal Court
                        </h5>
                        <p className="text-[10px] text-white/75 mt-0.5 line-clamp-1">
                          Taif rose & palace agarwood
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect('royal');
                        }}
                        className="px-2.5 py-1.5 rounded-md bg-white/20 hover:bg-[#C4823F] text-white text-[9.5px] uppercase tracking-[0.14em] font-medium transition-all shrink-0 cursor-pointer backdrop-blur-xs whitespace-nowrap"
                      >
                        Explore →
                      </button>
                    </div>
                  </div>

                  {/* Bottom Cell: Desert Dunes 4K Video */}
                  <div
                    onClick={() => handleSelect('exotic')}
                    className="h-[256.5px] rounded-md overflow-hidden relative group cursor-pointer shadow-[0_12px_28px_rgba(0,0,0,0.16)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.65)] border border-black/[0.08] dark:border-white/10 bg-[#0B0A0D]"
                  >
                    <video
                      src="/videos/Perfume_bottle_in_desert_92b81cd7_1080p_gwr_video_mvp.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      disablePictureInPicture
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                    />

                    {/* Minimal Floating Badge */}
                    <div className="absolute top-3 left-3 pointer-events-none z-10">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[8.5px] uppercase tracking-[0.14em] text-white/90 border border-white/15 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ECC86A]" />
                        <span>Oasis 4K</span>
                      </span>
                    </div>

                    {/* Bottom subtle title gradient with Direct CTA button */}
                    <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/90 via-black/45 to-transparent z-10 flex items-end justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h5 className="text-[13.5px] font-normal tracking-wide text-white group-hover:text-[#ECC86A] transition-colors truncate">
                          The Desert Dunes
                        </h5>
                        <p className="text-[10px] text-white/75 mt-0.5 line-clamp-1">
                          Nocturnal sands & solar resins
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect('exotic');
                        }}
                        className="px-2.5 py-1.5 rounded-md bg-white/20 hover:bg-[#C4823F] text-white text-[9.5px] uppercase tracking-[0.14em] font-medium transition-all shrink-0 cursor-pointer backdrop-blur-xs whitespace-nowrap"
                      >
                        Explore →
                      </button>
                    </div>
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
