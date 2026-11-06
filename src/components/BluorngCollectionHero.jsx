import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLLECTION_THEMES } from '../data/collectionThemes.js';

export const HERO_COLLECTIONS = [
  {
    id: 'signature',
    slug: 'signature',
    name: 'Signature Collection',
    title: 'THE SIGNATURE COLLECTION',
    tagline: 'A DISTINCTIVE EXPRESSION OF PERSONALITY.',
    video: '/videos/Perfume_bottle_in_luxury_setting_e094f368_1080p.mp4',
    poster: '/images/saudagar_signature_collection_banner_4k.png'
  },
  {
    id: 'royal',
    slug: 'royal',
    name: 'Royal Collection',
    title: 'THE ROYAL COLLECTION',
    tagline: 'INSPIRED BY HERITAGE. CREATED FOR THE EXTRAORDINARY.',
    video: '/videos/Ruby_red_perfume_bottle_displayed_4a5d2be2_1080p.mp4',
    poster: '/images/saudagar_imperial_ruby.png'
  },
  {
    id: 'exotic',
    slug: 'exotic',
    name: 'Exotic Collection',
    title: 'THE EXOTIC COLLECTION',
    tagline: 'DISCOVER THE EXTRAORDINARY. EMBRACE THE UNTAMED.',
    video: '/videos/Perfume_bottle_in_desert_92b81cd7_1080p_gwr_video_mvp.mp4',
    poster: '/images/saudagar_noir_matte.png'
  },
  {
    id: 'fresh',
    slug: 'fresh',
    name: 'Fresh Collection',
    title: 'THE FRESH COLLECTION',
    tagline: 'CRISP OCEAN AIR. RADIANT SUNLIT CITRUS.',
    video: '/videos/Perfume_bottle_on_coastal_landscape_76c07432_1080p.mp4',
    poster: '/images/saudagar_royal_sapphire.png'
  }
];

export default function BluorngCollectionHero({
  activeCollectionId = 'signature',
  onSwitchCollection
}) {
  const videoRefs = useRef({});
  const [isMuted, setIsMuted] = useState(true);

  const activeHero = HERO_COLLECTIONS.find((c) => c.id === activeCollectionId) || HERO_COLLECTIONS[0];
  const activeTheme = COLLECTION_THEMES[activeHero.id] || COLLECTION_THEMES.signature;

  const [currentId, setCurrentId] = useState(activeHero.id);
  const [prevId, setPrevId] = useState(null);
  const prevHeroIdRef = useRef(activeHero.id);

  // Seamless film-style video dissolve:
  // Target video fades in at solid opacity-100 on z-20 while previous video stays at z-10.
  // After crossfade completes (550ms), previous video is retired & paused so zero overlapping can ever happen.
  useEffect(() => {
    if (activeHero.id !== prevHeroIdRef.current) {
      const oldId = prevHeroIdRef.current;
      prevHeroIdRef.current = activeHero.id;

      setPrevId(oldId);
      setCurrentId(activeHero.id);

      const targetVid = videoRefs.current[activeHero.id];
      if (targetVid) {
        targetVid.muted = isMuted;
        targetVid.play().catch(() => {});
      }

      const timer = setTimeout(() => {
        setPrevId(null);
        Object.entries(videoRefs.current).forEach(([id, vid]) => {
          if (id !== activeHero.id && vid && !vid.paused) {
            vid.pause();
          }
        });
      }, 550);

      return () => clearTimeout(timer);
    } else {
      // Ensure initial active video is playing
      const currentVid = videoRefs.current[activeHero.id];
      if (currentVid && currentVid.paused) {
        currentVid.muted = isMuted;
        currentVid.play().catch(() => {});
      }
    }
  }, [activeHero.id, isMuted]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    Object.values(videoRefs.current).forEach((vid) => {
      if (vid) vid.muted = nextMuted;
    });
  };

  return (
    <div 
      className="w-full select-none transition-colors duration-500 bg-[#FFFFFF] dark:bg-[#0B0A0D]"
    >
      
      {/* ================= 1. CINEMATIC CLEAN HERO BANNER ================= */}
      <div className="relative w-full h-[52vh] min-h-[380px] max-h-[560px] overflow-hidden bg-[#0B0A0D]">
        
        {/* Multi-Video Crossfade Stage: Guaranteed Zero Black Flash / Glitch */}
        {HERO_COLLECTIONS.map((col) => {
          const isCurrent = col.id === currentId;
          const isPrev = col.id === prevId;

          return (
            <video
              key={col.id}
              ref={(el) => {
                if (el) videoRefs.current[col.id] = el;
              }}
              src={col.video}
              poster={col.poster}
              autoPlay={isCurrent}
              loop
              muted={isMuted}
              playsInline
              preload="auto"
              className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-500 ease-in-out will-change-opacity ${
                isCurrent
                  ? 'opacity-100 z-20'
                  : isPrev
                  ? 'opacity-100 z-10'
                  : 'opacity-0 z-0 pointer-events-none'
              }`}
            />
          );
        })}

        {/* Soft, Natural Dark Vignette for Crisp Legibility */}
        <div className="absolute inset-0 z-25 bg-gradient-to-t from-black/80 via-black/35 to-black/30 pointer-events-none" />

        {/* Subtle Sound Toggle */}
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="absolute top-6 right-6 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-[11px] backdrop-blur-md border border-white/20 transition-all cursor-pointer"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Centered Minimal Typography Overlay */}
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHero.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl"
            >
              <span className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/75 block mb-2">
                Saudagar Haute Parfumerie · {activeTheme.hero.accentTag || activeTheme.shortName}
              </span>

              <h1 className="font-serif text-[28px] sm:text-[42px] font-normal tracking-[0.04em] uppercase text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                {activeHero.title}
              </h1>

              <p className="font-sans text-[11px] sm:text-[13px] font-normal tracking-[0.14em] uppercase text-white/85 mt-2.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                {activeHero.tagline}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* ================= 2. ULTRA-MINIMAL COLLECTION TAB SWITCHER (Borderless) ================= */}
      <div className="w-full bg-white dark:bg-[#0B0A0D] transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-6 sm:gap-10 overflow-x-auto scrollbar-none">
          {HERO_COLLECTIONS.map((col) => {
            const isActive = activeHero.id === col.id;

            return (
              <button
                key={col.id}
                onClick={() => onSwitchCollection(col.slug)}
                className={`py-4 text-[11px] sm:text-[12px] uppercase tracking-[0.14em] transition-all relative cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-[#111111] dark:text-white font-semibold' : 'text-[#888888] dark:text-[#A09D96] hover:text-[#111111] dark:hover:text-white font-normal'
                }`}
              >
                <span>{col.name}</span>
                {isActive && (
                  <motion.span
                    layoutId="activeCollectionUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#111111] dark:bg-[#D4AF37]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
