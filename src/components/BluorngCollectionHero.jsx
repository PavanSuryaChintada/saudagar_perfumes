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
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const activeHero = HERO_COLLECTIONS.find((c) => c.id === activeCollectionId) || HERO_COLLECTIONS[0];
  const activeTheme = COLLECTION_THEMES[activeHero.id] || COLLECTION_THEMES.signature;

  useEffect(() => {
    setIsVideoLoaded(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [activeHero.id]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div 
      className="w-full select-none transition-colors duration-500 bg-[#FFFFFF] dark:bg-[#0B0A0D]"
    >
      
      {/* ================= 1. CINEMATIC CLEAN HERO BANNER ================= */}
      <div className="relative w-full h-[52vh] min-h-[380px] max-h-[560px] overflow-hidden bg-[#111111]">
        
        {/* Full-Bleed Video Element */}
        <video
          ref={videoRef}
          key={activeHero.video}
          src={activeHero.video}
          poster={activeHero.poster}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          className={`w-full h-full object-cover object-center transition-opacity duration-700 ${
            isVideoLoaded ? 'opacity-90' : 'opacity-70'
          }`}
        />

        {/* Soft, Natural Dark Vignette for Crisp Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/30 pointer-events-none" />

        {/* Subtle Sound Toggle */}
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="absolute top-6 right-6 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-[11px] backdrop-blur-md border border-white/20 transition-all cursor-pointer"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Centered Minimal Typography Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHero.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45 }}
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
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#111111] dark:bg-[#C4823F]"
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
