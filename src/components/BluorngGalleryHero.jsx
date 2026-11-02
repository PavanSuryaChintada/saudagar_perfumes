import React from 'react';
import { motion } from 'framer-motion';
import { DISCOVER_GALLERY_TILES } from '../data/bluorngSaudagarData.js';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

export default function BluorngGalleryHero({ onSelectCategory }) {
  return (
    <section className="w-full bg-[#FFFFFF] py-10 sm:py-14 border-b border-[#EEEEEE]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Gallery Title */}
        <ScrollReveal variant="fade-up" className="mb-6 pb-2 border-b border-[#111111]/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.24em] uppercase text-[#C4823F]">
              The Olfactory Vault
            </span>
            <span className="font-script text-[#C4823F] text-[17px] sm:text-[20px] normal-case tracking-normal">
              rare extraits
            </span>
          </div>
          <h2 className="text-[20px] sm:text-[24px] font-black uppercase tracking-[0.14em] text-[#111111]">
            discover collection
          </h2>
        </ScrollReveal>

        {/* Gallery Container of 3 Large Editorial Tiles */}
        <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {DISCOVER_GALLERY_TILES.map((tile) => (
            <StaggerItem key={tile.id}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => onSelectCategory(tile.linkCategory)}
                className="group relative cursor-pointer flex flex-col overflow-hidden bg-[#111111] rounded-xs shadow-xs hover:shadow-xl transition-shadow duration-500 will-change-transform"
              >
                {/* Title Above Image (Desktop) */}
                <div className="p-3 sm:p-4 bg-[#FFFFFF] border-b border-[#EEEEEE] flex items-center justify-between">
                  <h3 className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-[#111111] group-hover:text-[#C4823F] transition-colors duration-200">
                    {tile.title}
                  </h3>
                  <span className="text-[12px] text-[#111111] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300">
                    ↗
                  </span>
                </div>

                {/* Tile Image with Responsive Picture */}
                <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] overflow-hidden">
                  <img
                    src={tile.imageDesktop}
                    alt={tile.title}
                    className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out filter brightness-[0.92]"
                    loading="lazy"
                  />

                  {/* Subtle vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Overlay CTA Button with Smooth Hover */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-center">
                    <button className="w-full sm:w-auto px-6 py-2.5 bg-[#FFFFFF]/90 hover:bg-[#FFFFFF] text-[#111111] text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm shadow-lg transition-all duration-300 group-hover:bg-[#C4823F] group-hover:text-white">
                      {tile.buttonLabel}
                    </button>
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
