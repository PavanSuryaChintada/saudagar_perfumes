import React, { useRef } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedCampaignBanner({
  onExploreCollections,
  onExploreAttars
}) {
  const headlineWords = ['The', 'Signature', 'Collection'];
  const videoRef = useRef(null);

  return (
    <section
      id="signature-collection-banner"
      className="relative w-full overflow-hidden select-none py-14 sm:py-18 lg:py-20 transition-colors duration-300 flex items-center"
    >
      {/* ================= BACKGROUND CINEMATIC VIDEO (ROYAL PALACE) ================= */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.78] dark:brightness-[0.62]"
        >
          <source
            src="/videos/Perfume_bottles_in_royal_palace_e1347222_1080p.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Cinematic Luxury Dark Scrim Only Behind Typography (Left-Weighted, No Bottom Blackout) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent pointer-events-none z-1" />

      {/* Subtle Noise Texture for Cinematic Film Grain */}
      <div className="absolute inset-0 luxury-noise pointer-events-none z-1 opacity-35" />

      {/* ================= OVERLAID TYPOGRAPHY CONTAINER ================= */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        
        {/* Left Column: Typography & CTAs */}
        <div className="max-w-2xl flex flex-col items-start text-left">
          
          {/* Branded Kicker with Warm Gold Diamond */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 mb-3.5"
          >
            <span className="text-tk-accent dark:text-tk-accent-night text-[11px]">✦</span>
            <span className="text-[11px] sm:text-[12px] font-medium uppercase tracking-[0.24em] text-white/80">
              Saudagar Perfumes
            </span>
          </motion.div>

          {/* Kinetic Animated Headline (Word-by-Word Slide Up) */}
          <div className="flex flex-wrap items-baseline gap-x-3 mb-3.5">
            {headlineWords.map((word, i) => (
              <div key={i} className="overflow-hidden inline-block">
                <motion.span
                  initial={{ y: '100%', opacity: 0 }}
                  whileInView={{ y: '0%', opacity: 1 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{
                    duration: 0.65,
                    delay: i * 0.09,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className={`inline-block font-serif text-[38px] sm:text-[52px] lg:text-[60px] font-normal leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] ${
                    word === 'Signature' ? 'italic text-white' : ''
                  }`}
                >
                  {word}
                </motion.span>
              </div>
            ))}
          </div>

          {/* Minimal Amber / Gold Accent Rule */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            style={{ originX: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-14 h-[1.5px] bg-tk-accent dark:bg-tk-gold mb-5 shadow-[0_0_10px_rgba(212,175,55,0.4)]"
          />

          {/* Editorial Manifesto & Description */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-[12px] sm:text-[13px] uppercase tracking-[0.18em] text-white/95 font-semibold mb-2.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
          >
            A curated range of exceptional fragrances.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-[13px] sm:text-[14px] text-white/80 font-light leading-relaxed max-w-xl mb-5 tracking-wide drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]"
          >
            Compounded in sacred copper alembics with rare wild Assam agarwoods, high-altitude Taif damask roses, and aged Mysore santal. Formulated for profound skin chemistry evolution.
          </motion.p>

          {/* Olfactory Scent Evolution Strip */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[10.5px] uppercase tracking-[0.16em] text-white/75 mb-7"
          >
            <span className="text-white font-medium">Top: Bergamot & Pepper</span>
            <span className="text-tk-accent dark:text-tk-accent-night">✦</span>
            <span className="text-white font-medium">Heart: Cambodi Oud & Taif Rose</span>
            <span className="text-tk-accent dark:text-tk-accent-night">✦</span>
            <span className="text-white font-medium">Base: Mysore Santal</span>
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-wrap items-center gap-4"
          >
            <button
              onClick={onExploreCollections}
              className="px-8 py-3.5 sm:py-4 bg-tk-accent hover:bg-[#B57432] dark:bg-tk-gold dark:hover:bg-tk-accent-night text-white dark:text-tk-night text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] cursor-pointer hover:shadow-xl"
            >
              Explore Collection →
            </button>

            <button
              onClick={onExploreAttars}
              className="px-7 py-3.5 sm:py-4 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/25 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
            >
              Discover Attars
            </button>
          </motion.div>

        </div>

        {/* Right Column: Floating Palace Atelier Badge Aligned With Bottom CTAs */}
        <div className="hidden lg:flex items-center gap-2.5 bg-black/45 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20 text-[10px] uppercase tracking-[0.2em] text-white/85 shadow-lg shrink-0 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-tk-accent dark:bg-tk-accent-night animate-pulse" />
          <span>Royal Palace Atelier · 35% Pure Extrait</span>
        </div>

      </div>

    </section>
  );
}
