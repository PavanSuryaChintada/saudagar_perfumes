import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import ScrollReveal from './motion/ScrollReveal.jsx';

// 6 Curated Categories - Pure, Minimal Luxury
export const CATEGORY_ITEMS = [
  {
    id: 'cat-oud-royale',
    title: 'Oud Royale',
    count: '8 Products',
    image: '/images/saudagar_noir_matte.png',
    slug: 'oud-royale'
  },
  {
    id: 'cat-royal-attars',
    title: 'Pure Attars',
    count: '9 Products',
    image: '/images/saudagar_imperial_ruby.png',
    slug: 'royal-attars'
  },
  {
    id: 'cat-solar-aquatic',
    title: 'Solar & Aquatic',
    count: '7 Products',
    image: '/images/saudagar_royal_sapphire.png',
    slug: 'solar-citrus'
  },
  {
    id: 'cat-amber-oriental',
    title: 'Amber & Resins',
    count: '12 Products',
    image: '/images/saudagar_amber_gold.png',
    slug: 'new-in'
  },
  {
    id: 'cat-discovery-sets',
    title: 'Discovery Sets',
    count: '6 Products',
    image: '/images/saudagar_crystal_diamond.png',
    slug: 'discovery-sets'
  },
  {
    id: 'cat-bespoke-atelier',
    title: 'Bespoke Atelier',
    count: 'Custom Flacons',
    image: '/images/bespoke_atelier.jpg',
    slug: 'bespoke-atelier'
  }
];

export default function BluorngCategories({ onSelectCategory }) {
  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full bg-[#FFFFFF] py-8 sm:py-12 border-b border-[#F0F0F0]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= MINIMAL EDITORIAL HEADER ================= */}
        <ScrollReveal variant="fade-up" className="flex items-end justify-between mb-6 pb-2.5 border-b border-[#111111]/10">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] uppercase text-[#C4823F] block">
              Curated Collections
            </span>
            <h2 className="text-[18px] sm:text-[22px] font-black uppercase tracking-[0.14em] text-[#111111] mt-0.5">
              Shop by Category
            </h2>
          </div>

          {/* Right Action Link & Mobile Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectCategory && onSelectCategory('all')}
              className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#111111] hover:text-[#C4823F] transition-colors flex items-center gap-1 group cursor-pointer"
            >
              <span>View All</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>

            {/* Mobile Scroll Arrows */}
            <div className="flex items-center gap-1 md:hidden pl-2 border-l border-[#E5E5E5]">
              <button
                onClick={scrollLeft}
                aria-label="Previous categories"
                className="w-6 h-6 rounded-xs border border-[#E5E5E5] flex items-center justify-center text-xs text-[#111111]"
              >
                ‹
              </button>
              <button
                onClick={scrollRight}
                aria-label="Next categories"
                className="w-6 h-6 rounded-xs border border-[#E5E5E5] flex items-center justify-center text-xs text-[#111111]"
              >
                ›
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* ================= MINIMAL CATEGORY TILES ================= */}
        <div
          ref={scrollContainerRef}
          className="flex md:grid md:grid-cols-6 gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {CATEGORY_ITEMS.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => onSelectCategory && onSelectCategory(item.slug)}
              className="flex-shrink-0 w-[150px] sm:w-[170px] md:w-auto snap-start cursor-pointer group flex flex-col"
            >
              {/* Image Frame - Minimal, Clean Studio Surface */}
              <div className="relative w-full aspect-square bg-[#F8F7F5] border border-[#EFECE6] group-hover:border-[#111111]/30 transition-colors duration-300 flex items-center justify-center p-4 sm:p-5 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500 ease-out filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.1)]"
                  loading="lazy"
                />
              </div>

              {/* Minimal Text Presentation */}
              <div className="pt-2.5 pb-1 flex flex-col items-center text-center">
                <h3 className="text-[11.5px] sm:text-[12.5px] font-bold uppercase tracking-[0.12em] text-[#111111] group-hover:text-[#C4823F] transition-colors duration-200 line-clamp-1">
                  {item.title}
                </h3>
                <span className="text-[10px] font-normal tracking-[0.14em] uppercase text-[#888888] mt-0.5">
                  {item.count}
                </span>

                {/* Subtle Hover Underline Accent */}
                <div className="h-[1.5px] bg-[#111111] group-hover:bg-[#C4823F] w-0 group-hover:w-8 transition-all duration-300 mt-1.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
