import React from 'react';
import { motion } from 'framer-motion';
import { useStockists } from '../cms/useContent';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

/** Section "stockists": boutiques from Admin → Stockists; heading copy from the section settings. */
export default function BluorngStores({ config = {} }) {
  const { data: rows = [] } = useStockists();
  const BOUTIQUE_STORES = rows.map((r) => ({
    id: r.id, city: r.city || r.name, mall: r.name, status: r.hours, image: r.image_url, address: r.address, phone: r.phone, mapUrl: r.map_url
  }));
  if (BOUTIQUE_STORES.length === 0) return null;
  return (
    <section id="stores-section" className="relative w-full bg-white dark:bg-tk-night py-14 sm:py-20 border-b border-[#ECE5D8] dark:border-white/5 overflow-hidden transition-colors duration-300">
      {/* Background Layer 3: Tactile Film Grain */}
      <div className="absolute inset-0 luxury-noise pointer-events-none z-0 opacity-70" />

      {/* Background Layer 4: Architectural Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0 overflow-hidden">
        <span className="font-serif text-[11vw] tracking-[0.2em] uppercase text-tk-ink/[0.016] dark:text-white/[0.016] whitespace-nowrap leading-none block">
          {config.watermark}
        </span>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= SECTION HEADER ================= */}
        <ScrollReveal variant="fade-up" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12 pb-4 border-b border-tk-ink/12 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="px-2 py-0.5 text-[10.5px] font-bold tracking-[0.12em] uppercase bg-tk-accent/10 text-tk-accent border border-tk-accent/20 dark:bg-tk-gold/15 dark:text-tk-accent-night dark:border-tk-gold/30 rounded-xs">
                {config.badge}
              </span>
              <span className="font-script text-tk-accent dark:text-tk-accent-night text-[18px] sm:text-[22px] normal-case tracking-normal">
                {config.script_line}
              </span>
            </div>
            <h2 className="text-[22px] sm:text-[30px] font-black uppercase tracking-[0.02em] text-tk-ink dark:text-white leading-tight">
              {config.heading}
            </h2>
            <p className="text-[12px] text-[#666666] dark:text-[#A09D96] tracking-wide mt-1 max-w-xl font-normal">
              {config.text}
            </p>
          </div>

          <div className="text-[11px] font-semibold text-[#666666] dark:text-[#A09D96] tracking-widest uppercase hidden md:flex items-center gap-2">
            <span>{config.side_label}</span>
            <span className="text-tk-accent dark:text-tk-accent-night">✦</span>
          </div>
        </ScrollReveal>

        {/* Store Navigation Cards Grid */}
        <StaggerContainer staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {BOUTIQUE_STORES.map((store) => (
            <StaggerItem key={store.id}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="bg-[#FFFFFF] dark:bg-[#141318] border border-[#E3DDD1] dark:border-white/10 hover:border-tk-ink dark:hover:border-tk-gold rounded-xs transition-all duration-400 overflow-hidden flex flex-col justify-between group shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] will-change-transform h-full"
              >
                {/* Boutique Image with "Open now" Tag */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#ECEBE6] dark:bg-[#1C1A22]">
                  {store.image && <img
                    src={store.image}
                    alt={store.city}
                    className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-800 ease-out filter brightness-[0.94] group-hover:brightness-100"
                    loading="lazy"
                  />}

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Status Badge */}
                  {store.status && <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-white/95 dark:bg-tk-night/90 backdrop-blur-md text-[10.5px] font-bold tracking-wider text-emerald-800 dark:text-emerald-400 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{store.status}</span>
                  </div>}

                  {/* Mall / Location Overlay Bar */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 text-white pointer-events-none">
                    <span className="text-[11px] font-bold tracking-widest uppercase bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-xs">
                      {store.mall}
                    </span>
                  </div>
                </div>

                {/* Store Details Box */}
                <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 bg-white dark:bg-[#141318] transition-colors duration-300">
                  <div>
                    <h3 className="text-[15px] sm:text-[16px] font-bold uppercase tracking-wider text-tk-ink dark:text-white group-hover:text-tk-accent dark:group-hover:text-tk-accent-night transition-colors">
                      {store.city}
                    </h3>
                    <p className="text-[11.5px] text-[#666666] dark:text-[#A09D96] leading-relaxed mt-2 min-h-[36px]">
                      {store.address}
                    </p>
                  </div>

                  {/* Bottom Row: Directions & Phone */}
                  <div className="mt-5 pt-3.5 border-t border-[#F0ECE1] dark:border-white/10 flex items-center justify-between text-[11px]">
                    {store.mapUrl ? <a
                      href={store.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold tracking-wider uppercase text-tk-ink dark:text-white hover:text-tk-accent dark:hover:text-tk-accent-night flex items-center gap-1.5 transition-colors group/btn"
                    >
                      <span>{config.directions_label || 'Get Directions'}</span>
                      <span className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-200">↗</span>
                    </a> : <span />}

                    <a
                      href={`tel:${store.phone}`}
                      className="text-[#666666] dark:text-[#A09D96] hover:text-tk-ink dark:hover:text-white tracking-wider transition-colors font-medium"
                    >
                      {store.phone}
                    </a>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
