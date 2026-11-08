import React from 'react';
import { motion } from 'framer-motion';
import { useGo } from '../../cms/useSite';

// Sections used on the brand story page (and available on any section page). Same design as the original page;
// every word and image comes from the section's settings.

export function StoryHero({ config = {} }) {
  return (
    <section className="max-w-5xl mx-auto px-6 sm:px-10 pt-16 sm:pt-24 pb-16 text-center">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-4">
        {config.eyebrow && (
          <span className="text-[12px] uppercase tracking-[0.28em] text-tk-accent-ink dark:text-tk-accent-night font-medium block">{config.eyebrow}</span>
        )}
        {config.heading && (
          <h1 className="text-[34px] sm:text-[48px] md:text-[56px] font-normal tracking-[-0.02em] text-tk-ink dark:text-white leading-[1.08] max-w-3xl mx-auto">
            {config.heading}
          </h1>
        )}
        {config.text && (
          <p className="text-[13.5px] sm:text-[15px] text-[#666666] dark:text-[#AAAAAA] max-w-2xl mx-auto font-normal leading-relaxed pt-2">{config.text}</p>
        )}
      </motion.div>

      {config.image && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-14 relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-[2px] overflow-hidden bg-[#FAFAFA] dark:bg-white/5 border border-[#F0F0F0] dark:border-white/10"
        >
          <img src={config.image} alt={config.image_kicker || ''} className="w-full h-full object-cover object-center filter brightness-[0.92] dark:brightness-[0.85]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-5 left-6 right-6 text-left text-white">
            {config.image_kicker && <span className="text-[11.5px] uppercase tracking-[0.2em] text-tk-accent-night block">{config.image_kicker}</span>}
            {config.image_caption && <span className="text-[12.5px] text-white/80 font-normal">{config.image_caption}</span>}
          </div>
        </motion.div>
      )}
    </section>
  );
}

export function StoryTenets({ config = {} }) {
  const items = config.items || [];
  return (
    <section className="max-w-5xl mx-auto px-6 sm:px-10 py-16 border-t border-[#F0F0F0] dark:border-white/10">
      <div className="mb-12">
        {config.eyebrow && <span className="sf-eyebrow">{config.eyebrow}</span>}
        {config.heading && <h2 className="sf-title">{config.heading}</h2>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
        {items.map((t, i) => (
          <div key={`${t.title}-${i}`} className="space-y-2.5">
            <span className="font-mono text-[13px] text-tk-accent-ink dark:text-tk-accent-night block">{t.num}</span>
            <h3 className="text-[16px] font-medium text-tk-ink dark:text-white">{t.title}</h3>
            <p className="text-[13px] text-[#666666] dark:text-[#AAAAAA] leading-relaxed font-normal">{t.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StoryTimeline({ config = {} }) {
  const chapters = config.chapters || [];
  return (
    <section className="max-w-5xl mx-auto px-6 sm:px-10 py-16 border-t border-[#F0F0F0] dark:border-white/10">
      <div className="mb-14">
        {config.eyebrow && <span className="sf-eyebrow">{config.eyebrow}</span>}
        {config.heading && <h2 className="sf-title">{config.heading}</h2>}
        {config.text && <p className="text-[13px] text-[#5F5F5F] dark:text-[#999999] mt-1 font-normal max-w-xl">{config.text}</p>}
      </div>
      <div className="space-y-12 sm:space-y-16 relative before:absolute before:left-3 sm:before:left-5 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#EAEAEA] dark:before:bg-white/10">
        {chapters.map((ch, idx) => (
          <div key={idx} className="relative pl-9 sm:pl-14 space-y-2">
            <div className="absolute left-2 sm:left-4 top-1.5 w-2.5 h-2.5 -translate-x-1/2 rounded-full bg-tk-ink dark:bg-tk-accent-night ring-4 ring-white dark:ring-tk-night" />
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[14px] font-medium text-tk-accent-ink dark:text-tk-accent-night">{ch.year}</span>
              <span className="text-[12px] uppercase tracking-[0.16em] text-[#666666] dark:text-[#9A9A9A]">{ch.subtitle}</span>
            </div>
            <h3 className="text-[19px] sm:text-[22px] font-normal tracking-[-0.01em] text-tk-ink dark:text-white">{ch.title}</h3>
            <p className="text-[13.5px] text-[#555555] dark:text-[#CCCCCC] leading-relaxed font-normal max-w-2xl pt-1">{ch.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StorySplit({ config = {} }) {
  return (
    <section className="max-w-5xl mx-auto px-6 sm:px-10 py-16 border-t border-[#F0F0F0] dark:border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {config.image && (
          <div className="relative aspect-[4/3] rounded-[2px] overflow-hidden bg-[#FAFAFA] dark:bg-white/5 border border-[#F0F0F0] dark:border-white/10">
            <img src={config.image} alt={config.image_caption || ''} className="w-full h-full object-cover filter brightness-[0.95] dark:brightness-[0.9]" />
            {config.image_caption && (
              <div className="absolute bottom-3 left-3 text-[12px] uppercase tracking-wider text-white/90 bg-black/60 px-2 py-0.5 rounded-[1px] backdrop-blur-xs">
                {config.image_caption}
              </div>
            )}
          </div>
        )}
        <div className="space-y-4 sm:pl-4">
          {config.eyebrow && <span className="text-[12px] uppercase tracking-[0.2em] text-tk-accent-ink dark:text-tk-accent-night font-medium block">{config.eyebrow}</span>}
          {config.heading && <h2 className="text-[22px] sm:text-[28px] font-normal tracking-[-0.015em] leading-tight">{config.heading}</h2>}
          {config.text && <p className="text-[13px] text-[#666666] dark:text-[#AAAAAA] leading-relaxed font-normal">{config.text}</p>}
          {config.quote && (
            <div className="pt-2">
              <span className="text-[12px] font-serif italic text-[#666666] dark:text-[#9A9A9A]">&ldquo;{config.quote}&rdquo;</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function StoryClosing({ config = {} }) {
  const go = useGo();
  return (
    <section className="max-w-3xl mx-auto px-6 sm:px-10 pt-16 pb-8 text-center space-y-6">
      <div className="w-8 h-[1px] bg-tk-accent dark:bg-tk-accent-night mx-auto" />
      {config.quote && (
        <p className="font-serif italic text-[18px] sm:text-[22px] text-[#222222] dark:text-white/90 leading-relaxed max-w-xl mx-auto">&ldquo;{config.quote}&rdquo;</p>
      )}
      {config.attribution && <span className="text-[12px] uppercase tracking-[0.22em] text-[#666666] block">{config.attribution}</span>}
      {config.cta?.label && (
        <div className="pt-4 flex items-center justify-center gap-4">
          <button
            onClick={() => go(config.cta.link)}
            className="px-8 py-3.5 bg-tk-ink hover:bg-tk-accent text-white dark:bg-tk-gold dark:hover:bg-tk-accent-night dark:text-tk-night text-[12px] uppercase tracking-[0.16em] font-medium rounded-[2px] shadow-sm transition-all cursor-pointer"
          >
            {config.cta.label}
          </button>
        </div>
      )}
    </section>
  );
}
