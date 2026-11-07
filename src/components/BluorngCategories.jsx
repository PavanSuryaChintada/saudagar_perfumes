import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGo } from '../cms/useSite';

// 6 Curated Categories - Pure, Minimal Haute Luxury Olfactory Families


/** Section "category_tiles": every label, tile, image and link comes from the CMS. */
export default function BluorngCategories({ config = {} }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const go = useGo();
  const CATEGORY_ITEMS = (config.items || []).map((it, i) => ({ ...it, id: `cat-${i}` }));
  const onSelectCategory = (link) => go(link);

  return (
    <section id="shop-by-category" className="relative w-full bg-[#FFFFFF] dark:bg-tk-night py-8 sm:py-14 overflow-hidden select-none transition-colors duration-300 scroll-mt-20">
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        
        {/* ================= EDITORIAL HEADER ================= */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#888888] dark:text-[#88857F] font-medium block mb-0.5">
              {config.eyebrow}
            </span>
            <h2 className="text-[19px] sm:text-[24px] font-normal uppercase tracking-[0.03em] text-tk-ink dark:text-white">
              {config.heading}
            </h2>
          </div>

          <button
            onClick={() => onSelectCategory(config.view_all_link)}
            className="text-[11px] uppercase tracking-[0.12em] text-[#888888] hover:text-tk-ink dark:text-[#88857F] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer font-normal"
          >
            <span>{config.view_all_label}</span>
            <span className="text-[13px]">→</span>
          </button>
        </div>

        {/* ================= DESKTOP: MINIMAL EXPANDING PAVILION ================= */}
        <div className="hidden md:flex h-[350px] w-full rounded-xl bg-[#F8F7F4] dark:bg-[#141318] overflow-hidden p-1.5 gap-1.5 transition-colors duration-300">
          {CATEGORY_ITEMS.map((item, idx) => {
            const isExpanded = activeIdx === idx;

            return (
              <motion.div
                key={item.id}
                layout
                onClick={() => {
                  if (isExpanded) {
                    onSelectCategory(item.link);
                  } else {
                    setActiveIdx(idx);
                  }
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                transition={{
                  layout: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                }}
                className={`relative flex flex-col justify-between overflow-hidden cursor-pointer transition-colors duration-300 rounded-lg ${
                  isExpanded ? 'flex-[3.2] bg-[#FFFFFF] dark:bg-[#1C1A22] shadow-sm' : 'flex-1 bg-transparent hover:bg-white/50 dark:hover:bg-white/5'
                }`}
              >
                {/* Numeral and count top row */}
                <div className="px-4 py-3 flex items-center justify-between text-[#888888] dark:text-white/50">
                  <span className={`text-[11px] font-mono tracking-wider transition-colors ${isExpanded ? 'text-tk-accent dark:text-tk-accent-night' : 'text-[#AAAAAA] dark:text-white/40'}`}>
                    {item.numeral}
                  </span>
                  <span className="text-[9.5px] uppercase tracking-wider text-[#999999] dark:text-white/40">
                    {(item.count_label || '').split(' ')[0]}
                  </span>
                </div>

                {/* ================= EXPANDED STATE ================= */}
                {isExpanded ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    className="relative z-10 flex-1 px-6 py-4 flex items-center justify-between gap-6"
                  >
                    {/* Left: Details */}
                    <div className="flex-1 flex flex-col justify-between h-full py-1">
                      <div>
                        <span className="text-[9.5px] uppercase tracking-[0.14em] text-tk-accent dark:text-tk-accent-night font-medium block mb-0.5">
                          {item.concentration}
                        </span>
                        <h3 className="text-[22px] sm:text-[25px] font-normal uppercase tracking-tight text-tk-ink dark:text-white leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-[#777777] dark:text-white/60 mt-0.5">
                          {item.subtitle}
                        </p>
                        <p className="text-[11.5px] text-[#555555] dark:text-white/70 leading-relaxed mt-1.5 line-clamp-2 max-w-sm font-normal">
                          {item.description}
                        </p>

                        <p className="text-[10px] uppercase tracking-wider text-[#888888] dark:text-white/50 mt-2.5">
                          {config.notes_label} <span className="text-[#333333] dark:text-white/90 font-medium">{item.notes}</span>
                        </p>
                      </div>

                      {/* Minimal CTA */}
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCategory(item.link);
                          }}
                          className="text-[10.5px] uppercase tracking-[0.12em] text-tk-ink dark:text-white hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                        >
                          <span>{config.cta_label}</span>
                          <span className="text-[12px]">→</span>
                        </button>
                        <span className="text-[9.5px] uppercase tracking-wider text-[#999999] dark:text-white/40">
                          ({item.count_label})
                        </span>
                      </div>
                    </div>

                    {/* Right: Centered Flacon Showcase */}
                    <div className="w-[170px] h-full flex items-center justify-center shrink-0">
                      <motion.img
                        src={item.image}
                        alt={item.title}
                        initial={{ scale: 0.94 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="max-h-[190px] object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)]"
                      />
                    </div>
                  </motion.div>
                ) : (
                  /* ================= COLLAPSED VERTICAL COLUMN ================= */
                  <div className="relative z-10 flex-1 flex flex-col justify-between items-center py-4 px-2">
                    {/* Small preview image */}
                    <div className="w-full flex-1 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="max-h-[95px] object-contain filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.1)]"
                      />
                    </div>

                    {/* Vertical Category Title */}
                    <div className="py-4 flex flex-col items-center justify-center gap-1">
                      <span className="text-[10.5px] font-normal uppercase tracking-[0.16em] text-[#555555] dark:text-white/60 group-hover:text-tk-ink dark:group-hover:text-white whitespace-nowrap rotate-[-90deg] block transition-colors">
                        {item.title}
                      </span>
                    </div>

                    {/* Bottom minimal dash */}
                    <div className="w-2.5 h-[1px] bg-[#CCCCCC] dark:bg-white/20" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ================= MOBILE: PURE ULTRA-MINIMAL 2-COLUMN FLACON GRID ================= */}
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 md:hidden">
          {CATEGORY_ITEMS.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectCategory(item.link)}
              className="flex flex-col group cursor-pointer select-none active:opacity-75 transition-opacity"
            >
              {/* Clean Soft Pedestal Stage (No heavy borders, no box-in-box, pure flacon) */}
              <div className="w-full aspect-square rounded-md bg-[#F8F7F5] dark:bg-[#141318] flex items-center justify-center p-4 relative overflow-hidden transition-colors">
                <img
                  src={item.image}
                  alt={item.title}
                  className="max-h-[110px] w-auto object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Minimal Clean Typography: Title & Count */}
              <div className="pt-2 text-center flex flex-col items-center">
                <h3 className="text-[12px] font-medium uppercase tracking-[0.1em] text-tk-ink dark:text-white line-clamp-1">
                  {item.title}
                </h3>
                <span className="text-[10px] tracking-wider uppercase text-[#888888] dark:text-[#88857F] mt-0.5">
                  {item.count_label}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
