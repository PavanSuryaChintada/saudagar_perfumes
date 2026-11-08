import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useGo } from '../cms/useSite';

/** Section "campaign_banner_animated": film, headline, copy, note strip, buttons and badge come from the CMS. */
export default function AnimatedCampaignBanner({ config = {} }) {
  const go = useGo();
  const headlineWords = (config.headline || '').split(/\s+/).filter(Boolean);
  const italicWord = (config.italic_word || '').trim();
  const notes = (config.notes || []).filter(Boolean);
  const videoRef = useRef(null);

  return (
    <section
      id="signature-collection-banner"
      className="relative w-full overflow-hidden select-none py-14 sm:py-18 lg:py-20 transition-colors duration-300 flex items-center"
    >
      {/* ================= BACKGROUND CINEMATIC VIDEO (ROYAL PALACE) ================= */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {config.video ? (
          <video
            ref={videoRef}
            key={config.video}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={config.image || undefined}
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.78] dark:brightness-[0.62]"
          >
            <source src={config.video} type="video/mp4" />
          </video>
        ) : config.image ? (
          <img src={config.image} alt="" className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.78] dark:brightness-[0.62]" />
        ) : null}
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
              {config.kicker}
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
                    italicWord && word === italicWord ? 'italic text-white' : ''
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
            {config.subheading}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-[13px] sm:text-[14px] text-white/80 font-light leading-relaxed max-w-xl mb-5 tracking-wide drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]"
          >
            {config.text}
          </motion.p>

          {/* Olfactory Scent Evolution Strip */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-[11.5px] uppercase tracking-[0.16em] text-white/75 mb-7"
          >
            {notes.map((n, i) => (
              <React.Fragment key={`${n}-${i}`}>
                {i > 0 && <span className="text-tk-accent dark:text-tk-accent-night">✦</span>}
                <span className="text-white font-medium">{n}</span>
              </React.Fragment>
            ))}
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-wrap items-center gap-4"
          >
            {config.primary_cta?.label && <button
              onClick={() => go(config.primary_cta.link)}
              className="px-8 py-3.5 sm:py-4 bg-tk-accent hover:bg-[#B57432] dark:bg-tk-gold dark:hover:bg-tk-accent-night text-white dark:text-tk-night text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] cursor-pointer hover:shadow-xl"
            >
              {config.primary_cta.label}
            </button>}

            {config.secondary_cta?.label && <button
              onClick={() => go(config.secondary_cta.link)}
              className="px-7 py-3.5 sm:py-4 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/25 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
            >
              {config.secondary_cta.label}
            </button>}
          </motion.div>

        </div>

        {/* Right Column: Floating Palace Atelier Badge Aligned With Bottom CTAs */}
        {config.badge && (
          <div className="hidden lg:flex items-center gap-2.5 bg-black/45 backdrop-blur-md px-4 py-2.5 rounded-[2px] border border-white/20 text-[11px] uppercase tracking-[0.2em] text-white/85 shadow-lg shrink-0 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tk-accent dark:bg-tk-accent-night animate-pulse" />
            <span>{config.badge}</span>
          </div>
        )}

      </div>

    </section>
  );
}
