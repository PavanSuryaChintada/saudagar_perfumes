import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedCampaignBanner({
  onExploreCollections,
  onExploreAttars
}) {
  const headlineWords = ['The', 'Signature', 'Collection'];

  return (
    <section className="relative w-full overflow-hidden select-none bg-[#F9F8F6] dark:bg-[#131217] my-12 sm:my-20 py-12 sm:py-16 lg:py-20 transition-colors duration-300">
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* ================= LEFT EDITORIAL TYPOGRAPHY COLUMN ================= */}
          <div className="lg:col-span-6 flex flex-col items-start text-left z-10">
            
            {/* Branded Kicker with Warm Gold Diamond */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <span className="text-[#C4823F] text-[10px]">✦</span>
              <span className="text-[11px] sm:text-[12px] font-medium uppercase tracking-[0.24em] text-[#777777] dark:text-[#A09D96]">
                Saudagar Perfumes
              </span>
            </motion.div>

            {/* Kinetic Animated Headline (Word-by-Word Slide Up) */}
            <div className="flex flex-wrap items-baseline gap-x-3 mb-4">
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
                    className={`inline-block font-serif text-[36px] sm:text-[50px] lg:text-[58px] font-normal leading-[1.05] tracking-tight ${
                      word === 'Signature' ? 'text-[#111111] dark:text-white italic' : 'text-[#111111] dark:text-white'
                    }`}
                  >
                    {word}
                  </motion.span>
                </div>
              ))}
            </div>

            {/* Minimal Amber Accent Rule */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              style={{ originX: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-12 h-[1.5px] bg-[#C4823F] mb-6"
            />

            {/* Editorial Manifesto & Description */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-[12px] sm:text-[12.5px] uppercase tracking-[0.16em] text-[#222222] dark:text-[#EFECE6] font-semibold mb-3"
            >
              A curated range of exceptional fragrances.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-[13px] sm:text-[14px] text-[#666666] dark:text-[#B3AFA8] font-light leading-relaxed max-w-xl mb-6 tracking-wide"
            >
              Compounded in sacred copper alembics with rare wild Assam agarwoods, high-altitude Taif damask roses, and aged Mysore santal. Formulated for profound skin chemistry evolution.
            </motion.p>

            {/* Olfactory Scent Evolution Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[10.5px] uppercase tracking-[0.16em] text-[#777777] dark:text-[#A09D96] mb-8"
            >
              <span className="text-[#111111] dark:text-[#EFECE6] font-medium">Top: Bergamot & Pepper</span>
              <span className="text-[#C4823F]">✦</span>
              <span className="text-[#111111] dark:text-[#EFECE6] font-medium">Heart: Cambodi Oud & Taif Rose</span>
              <span className="text-[#C4823F]">✦</span>
              <span className="text-[#111111] dark:text-[#EFECE6] font-medium">Base: Mysore Santal</span>
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
                className="px-8 py-3.5 sm:py-4 bg-[#111111] dark:bg-[#C4823F] text-white hover:bg-[#C4823F] dark:hover:bg-[#DE9954] text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 shadow-md cursor-pointer hover:shadow-lg"
              >
                Explore Collection →
              </button>

              <button
                onClick={onExploreAttars}
                className="px-7 py-3.5 sm:py-4 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-[#111111] dark:text-white text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-300 cursor-pointer shadow-xs hover:shadow-sm"
              >
                Discover Attars
              </button>
            </motion.div>

          </div>

          {/* ================= RIGHT FLACONS SHOWCASE COLUMN ================= */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[640px] group"
            >
              <img
                src="/images/saudagar_banner_flacons_clean.png"
                alt="Saudagar Flacons on Limestone Pedestal"
                className="w-full h-auto object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                loading="lazy"
              />

              {/* Floating Haute Parfumerie Privilege Badge */}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-[#1A1820]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm">
                <span className="text-[9.5px] uppercase tracking-[0.18em] text-[#111111] dark:text-[#EFECE6] font-medium">
                  6 Masterwork Flacons · 35% Extrait
                </span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
