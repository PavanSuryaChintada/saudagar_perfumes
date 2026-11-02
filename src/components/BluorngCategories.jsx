import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

// 6 Curated Categories with high-definition imagery and collection links
export const CATEGORY_ITEMS = [
  {
    id: 'cat-oud-royale',
    title: 'Oud Royale',
    frenchTitle: 'bois précieux',
    tag: 'AGED AGARWOOD',
    count: '8 Extraits',
    image: '/images/saudagar_noir_matte.png',
    slug: 'oud-royale',
    description: '18-year Cambodi & Assam agarwood'
  },
  {
    id: 'cat-royal-attars',
    title: 'Pure Attars',
    frenchTitle: 'huiles rares',
    tag: 'CONCENTRATED OILS',
    count: '9 Attars',
    image: '/images/saudagar_imperial_ruby.png',
    slug: 'royal-attars',
    description: 'Alcohol-free artisanal concentrates'
  },
  {
    id: 'cat-solar-aquatic',
    title: 'Solar & Aquatic',
    frenchTitle: 'brise marine',
    tag: 'MINERAL SALTS',
    count: '7 Fragrances',
    image: '/images/saudagar_royal_sapphire.png',
    slug: 'solar-citrus',
    description: 'Sun-drenched citrus & sea breeze'
  },
  {
    id: 'cat-amber-oriental',
    title: 'Amber & Resins',
    frenchTitle: 'ambre solaire',
    tag: 'FRANKINCENSE',
    count: '12 Creations',
    image: '/images/saudagar_amber_gold.png',
    slug: 'new-in',
    description: 'Warm frankincense & golden labdanum'
  },
  {
    id: 'cat-discovery-sets',
    title: 'Discovery Sets',
    frenchTitle: 'coffrets voyage',
    tag: 'SAMPLE VAULTS',
    count: '6 Coffrets',
    image: '/images/saudagar_crystal_diamond.png',
    slug: 'discovery-sets',
    description: 'Curated 10ml flacon collections'
  },
  {
    id: 'cat-bespoke-atelier',
    title: 'Bespoke Atelier',
    frenchTitle: 'sur-mesure',
    tag: 'PERSONALIZED',
    count: 'Artisanal Flacons',
    image: '/images/bespoke_atelier.jpg',
    slug: 'bespoke-atelier',
    description: 'Custom personalized crystal flacons'
  }
];

export default function BluorngCategories({ onSelectCategory }) {
  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full bg-[#FFFFFF] py-10 sm:py-14 border-b border-[#EEEEEE]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= SECTION HEADER ================= */}
        <ScrollReveal variant="fade-up" className="flex items-end justify-between mb-6 sm:mb-8 pb-3 border-b border-[#111111]/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] uppercase text-[#C4823F]">
                The Olfactory Vault
              </span>
              <span className="font-script text-[#C4823F] text-[18px] sm:text-[22px] normal-case tracking-normal">
                haute sélection
              </span>
            </div>
            <h2 className="text-[20px] sm:text-[26px] font-black uppercase tracking-[0.14em] text-[#111111] mt-0.5">
              Shop by Category
            </h2>
          </div>

          {/* Action Links & Mobile Slider Controls */}
          <div className="flex items-center gap-3">
            {/* View All Collections Link */}
            <button
              onClick={() => onSelectCategory && onSelectCategory('all')}
              className="text-[11px] sm:text-[12px] font-bold tracking-[0.14em] uppercase text-[#111111] hover:text-[#C4823F] transition-colors flex items-center gap-1 group cursor-pointer"
            >
              <span>View All</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>

            {/* Prev / Next Slider Arrows (visible on mobile/tablet) */}
            <div className="flex items-center gap-1.5 lg:hidden pl-2 border-l border-[#DDDDDD]">
              <button
                onClick={scrollLeft}
                aria-label="Scroll categories left"
                className="w-7 h-7 rounded-full border border-[#DDDDDD] flex items-center justify-center text-[#111111] hover:border-[#111111] transition-colors text-sm"
              >
                ‹
              </button>
              <button
                onClick={scrollRight}
                aria-label="Scroll categories right"
                className="w-7 h-7 rounded-full border border-[#DDDDDD] flex items-center justify-center text-[#111111] hover:border-[#111111] transition-colors text-sm"
              >
                ›
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* ================= CATEGORY CARDS GRID / SCROLLER ================= */}
        <div
          ref={scrollContainerRef}
          className="flex lg:grid lg:grid-cols-6 gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth snap-x snap-mandatory"
        >
          {CATEGORY_ITEMS.map((item, idx) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelectCategory && onSelectCategory(item.slug)}
              className="flex-shrink-0 w-[180px] sm:w-[210px] lg:w-auto snap-start cursor-pointer group flex flex-col bg-[#FAF9F6] hover:bg-[#FFFFFF] rounded-[18px] sm:rounded-[22px] border border-[#ECE6DD] hover:border-[#C4823F]/50 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden will-change-transform"
            >
              {/* Category Image Container */}
              <div className="relative w-full aspect-[1/1] bg-gradient-to-b from-[#F2EFE9] to-[#EAE4D9] flex items-center justify-center p-4 overflow-hidden">
                {/* Soft Ambient Radial Light */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,_rgba(255,255,255,0.7)_0%,_transparent_70%)] pointer-events-none" />

                {/* Micro Tag Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="px-2 py-0.5 text-[8.5px] font-bold tracking-[0.14em] uppercase bg-white/90 backdrop-blur-sm text-[#7D5422] rounded-full border border-[#E0D4C0] shadow-xs">
                    {item.tag}
                  </span>
                </div>

                {/* Product/Category Flacon Image */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-contain object-center z-10 group-hover:scale-108 transition-transform duration-500 ease-out filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.14)]"
                  loading="lazy"
                />

                {/* Subtle base shadow */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-black/10 rounded-full filter blur-sm pointer-events-none" />
              </div>

              {/* Category Card Information */}
              <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 bg-transparent">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-script text-[#C4823F] text-[15px] sm:text-[16px] normal-case tracking-normal">
                      {item.frenchTitle}
                    </span>
                    <span className="text-[9.5px] text-[#999999] tracking-wider uppercase">
                      {item.count}
                    </span>
                  </div>

                  <h3 className="text-[12.5px] sm:text-[13.5px] font-bold uppercase tracking-[0.08em] text-[#111111] group-hover:text-[#C4823F] transition-colors mt-0.5 line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-[10px] text-[#777777] leading-tight line-clamp-1 mt-1 font-normal">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Arrow Indicator */}
                <div className="mt-3 pt-2 border-t border-[#EBE4D8] flex items-center justify-between text-[10.5px] font-semibold tracking-wider uppercase text-[#111111] group-hover:text-[#C4823F] transition-colors">
                  <span>Explore</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
