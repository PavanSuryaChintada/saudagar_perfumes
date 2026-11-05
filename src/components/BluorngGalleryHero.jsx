import React from 'react';
import { motion } from 'framer-motion';
import { DISCOVER_GALLERY_TILES } from '../data/bluorngSaudagarData.js';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

export default function BluorngGalleryHero({ onSelectCategory }) {
  const tileCurations = [
    { ...DISCOVER_GALLERY_TILES[0], exhibitionNo: 'SALON N° 01', subtitle: 'Pure Botanical Extraits' },
    { ...DISCOVER_GALLERY_TILES[1], exhibitionNo: 'SALON N° 02', subtitle: 'The 6-Flacon Collection' },
    { ...DISCOVER_GALLERY_TILES[2], exhibitionNo: 'SALON N° 03', subtitle: 'Private VIP Olfactory Salon' }
  ];

  return (
    <section className="relative w-full bg-[#FFFFFF] dark:bg-[#0B0A0D] py-14 sm:py-20 overflow-hidden transition-colors duration-300">
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        
        {/* ================= EDITORIAL GALLERY TITLE (Borderless, Minimal) ================= */}
        <ScrollReveal variant="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#888888] dark:text-[#A09D96] font-medium block mb-1">
              The Olfactory Vault · Curations
            </span>
            <h2 className="text-[22px] sm:text-[30px] font-normal uppercase tracking-[0.03em] text-[#111111] dark:text-white">
              Discover Collections
            </h2>
            <p className="text-[12px] text-[#777777] dark:text-[#A09D96] tracking-wide mt-1.5 max-w-lg font-normal">
              Three curated pathways into the Saudagar olfactory universe. Immerse in single-flacon masterworks or private member privileges.
            </p>
          </div>

          <div className="text-[11px] font-normal text-[#888888] dark:text-[#A09D96] tracking-wider uppercase hidden md:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4823F]" />
            <span>Exhibition Trilogy</span>
          </div>
        </ScrollReveal>

        {/* Gallery Container of 3 Large Editorial Tiles */}
        <StaggerContainer staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {tileCurations.map((tile) => (
            <StaggerItem key={tile.id}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => onSelectCategory(tile.linkCategory)}
                className="group relative cursor-pointer flex flex-col overflow-hidden rounded-lg bg-[#F8F7F4] dark:bg-[#141318] transition-all duration-300"
              >
                {/* Curator Placard Above Image */}
                <div className="px-5 py-3.5 bg-transparent flex items-center justify-between">
                  <div>
                    <span className="text-[9.5px] font-normal tracking-[0.1em] text-[#C4823F] uppercase block">
                      {tile.exhibitionNo}
                    </span>
                    <h3 className="text-[13px] sm:text-[14px] font-medium tracking-[0.03em] uppercase text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] transition-colors duration-200 mt-0.5">
                      {tile.title}
                    </h3>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-white/80 dark:bg-white/10 group-hover:bg-[#111111] dark:group-hover:bg-[#C4823F] text-[#111111] dark:text-white group-hover:text-white flex items-center justify-center text-[12px] transition-all duration-200 shadow-xs">
                    ↗
                  </div>
                </div>

                {/* Tile Image with Responsive Picture */}
                <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-[#111111] m-2 mb-2 rounded-md">
                  <img
                    src={tile.imageDesktop}
                    alt={tile.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out filter brightness-[0.94] group-hover:brightness-100"
                    loading="lazy"
                  />

                  {/* Subtle Cinematic Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

                  {/* Curatorial Subtitle */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
                    <p className="text-[11px] font-normal text-white/90 uppercase tracking-widest drop-shadow-sm">
                      {tile.subtitle}
                    </p>
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
