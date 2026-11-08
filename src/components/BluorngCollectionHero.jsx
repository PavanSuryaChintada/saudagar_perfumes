import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollections } from '../storefront/catalog/hooks';
import { posterFor } from '../lib/media';

/** Collections with a hero film, as edited in Admin → Collections. */
export function useHeroCollections() {
  const { data = [] } = useCollections();
  return data
    .filter((c) => c.hero_video_url || c.hero_poster_url)
    .map((c) => ({
      id: c.slug,
      slug: c.slug,
      name: (c.name || '').replace(/^the\s+/i, ''),
      title: c.hero_title || c.name,
      tagline: c.hero_tagline || c.tagline || '',
      video: c.hero_video_url,
      poster: c.hero_poster_url,
      accentTag: c.hero_accent_tag || c.short_name || c.name
    }));
}

export default function BluorngCollectionHero({
  activeCollectionId = 'signature',
  onSwitchCollection
}) {
  const HERO_COLLECTIONS = useHeroCollections();
  const videoRefs = useRef({});
  const [isMuted, setIsMuted] = useState(true);

  const activeHero = HERO_COLLECTIONS.find((c) => c.id === activeCollectionId) || HERO_COLLECTIONS[0] || {
    id: activeCollectionId, slug: activeCollectionId, name: '', title: '', tagline: '', video: null, poster: null, accentTag: ''
  };

  const [currentId, setCurrentId] = useState(activeHero.id);
  const [prevId, setPrevId] = useState(null);
  const prevHeroIdRef = useRef(activeHero.id);

  const tabsContainerRef = useRef(null);
  const activeTabRef = useRef(null);

  // Auto-scroll active collection tab into view on mobile/narrow screens
  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const tab = activeTabRef.current;
      const scrollTarget = tab.offsetLeft - (container.clientWidth / 2) + (tab.clientWidth / 2);
      container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
    }
  }, [activeHero.id]);

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
      className="w-full select-none transition-colors duration-500 bg-[#FFFFFF] dark:bg-tk-night"
    >
      
      {/* ================= 1. CINEMATIC CLEAN HERO BANNER ================= */}
      <div className="relative w-full h-[54vh] sm:h-[62vh] 2xl:h-[70vh] min-h-[440px] sm:min-h-[560px] max-h-[720px] 2xl:max-h-[840px] overflow-hidden bg-tk-night">
        
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
              poster={posterFor(col.video, col.poster)}
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

        {/* Cinema-Grade Luxury Gradient Scrim: Video remains vibrant while typography is 100% crystal-clear */}
        <div className="absolute inset-0 z-25 bg-black/25 pointer-events-none" />
        <div className="absolute inset-0 z-26 bg-gradient-to-t from-tk-night via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-26 hidden sm:block bg-gradient-to-r from-tk-night/85 via-black/30 to-transparent pointer-events-none" />

        {/* Subtle Sound Toggle */}
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="absolute top-5 right-5 sm:top-6 sm:right-6 z-30 w-8 h-8 rounded-[2px] bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-[11px] backdrop-blur-md border border-white/20 transition-all cursor-pointer"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Editorial Masthead Typography: Sits on the left runway on desktop and bottom on mobile */}
        <div className="absolute inset-0 z-30 flex flex-col justify-end items-center sm:items-start text-center sm:text-left px-6 sm:px-12 lg:px-16 pb-8 sm:pb-12 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHero.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md sm:max-w-lg lg:max-w-xl"
            >
              <span className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.28em] uppercase text-tk-accent-night block mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                Saudagar Haute Parfumerie · {activeHero.accentTag}
              </span>

              <h1 className="font-serif text-[26px] xs:text-[30px] sm:text-[40px] lg:text-[48px] font-normal tracking-[0.04em] uppercase text-white leading-[1.08] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                {activeHero.title}
              </h1>

              <p className="font-sans text-[11.5px] sm:text-[12.5px] font-light tracking-[0.16em] uppercase text-white/90 mt-2.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {activeHero.tagline}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* ================= 2. ULTRA-MINIMAL COLLECTION TAB SWITCHER (Borderless) ================= */}
      <div className="w-full bg-white dark:bg-tk-night border-b border-black/[0.06] dark:border-white/[0.08] transition-colors duration-300">
        <div 
          ref={tabsContainerRef}
          data-lenis-prevent="true"
          className="w-full overflow-x-auto scrollbar-none touch-pan-x overscroll-contain"
        >
          <div className="flex items-center justify-start sm:justify-center gap-6 sm:gap-10 px-6 sm:px-8 min-w-max mx-auto py-0.5">
            {HERO_COLLECTIONS.map((col) => {
              const isActive = activeHero.id === col.id;

              return (
                <button
                  key={col.id}
                  ref={isActive ? activeTabRef : null}
                  onClick={() => onSwitchCollection(col.slug)}
                  className={`py-3.5 sm:py-4 text-[11px] sm:text-[12px] uppercase tracking-[0.14em] transition-all relative cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive ? 'text-tk-ink dark:text-white font-semibold' : 'text-[#5F5F5F] dark:text-[#A09D96] hover:text-tk-ink dark:hover:text-white font-normal'
                  }`}
                >
                  <span>{col.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeCollectionUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-tk-ink dark:bg-tk-gold"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
