import React, { useRef } from 'react';
import { formatPrice } from '../data/products.js';

export default function BrandInspirations({
  products = [],
  activeCurrency = 'AED',
  onSelectProduct,
  onQuickBuy
}) {
  const scrollRef = useRef(null);

  const perfumes = products.filter(
    (p) => p.collection === 'Brand Inspirations' && !p.isWeeklyPick
  );

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="perfumes-section" className="py-16 sm:py-24 bg-[#141418] text-[#F7F5F0] border-b border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
          <p className="text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[#D4AF37] font-semibold mb-2 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            BRAND INSPIRATIONS
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-[0.2em] uppercase text-white font-sans">
            PERFUMES
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="relative group mb-10">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0A0A0C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-xl items-center justify-center hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-all duration-300"
            aria-label="Previous inspirations"
          >
            <svg width="14" height="14" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 1 3 9l8 8" />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0A0A0C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-xl items-center justify-center hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-all duration-300"
            aria-label="Next inspirations"
          >
            <svg width="14" height="14" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 17 8-8-8-8" />
            </svg>
          </button>

          {/* Product cards row */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1"
          >
            {perfumes.map((product) => (
              <div
                key={product.id}
                className="w-[260px] sm:w-[280px] md:w-[290px] flex-shrink-0 bg-[#1A1A20] shadow-lg hover:shadow-2xl transition-all duration-500 rounded-xs overflow-hidden flex flex-col justify-between group/card border border-[#D4AF37]/25 hover:border-[#D4AF37]/60"
              >
                {/* Figure */}
                <div
                  className="relative aspect-square overflow-hidden bg-black/60 cursor-pointer"
                  onClick={() => onSelectProduct(product.id)}
                >
                  {/* Bestseller Badge */}
                  {product.isBestseller && (
                    <span className="absolute top-3 right-3 z-10 bg-[#0A0A0C] text-[#D4AF37] border border-[#D4AF37]/40 text-[9px] uppercase tracking-[0.16em] px-2 py-0.5 font-bold shadow-md">
                      Bestseller
                    </span>
                  )}

                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-700 brightness-95 group-hover/card:brightness-105"
                    loading="lazy"
                  />

                  {/* Quick Add Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickBuy(product);
                    }}
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-[#D4AF37] text-[#0A0A0C] shadow-xl flex items-center justify-center hover:bg-white hover:text-black transition-all transform group-hover/card:scale-110 font-bold"
                    aria-label={`Quick buy ${product.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 0v12M0 6h12" />
                    </svg>
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 sm:p-5 text-center flex flex-col items-center justify-between flex-grow">
                  <span className="inline-block text-[10px] tracking-[0.14em] text-[#D4AF37]/80 uppercase mb-1.5 font-medium truncate max-w-full">
                    {product.inspiration}
                  </span>

                  <h3
                    onClick={() => onSelectProduct(product.id)}
                    className="text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase text-white hover:text-[#D4AF37] transition-colors cursor-pointer mb-2 font-sans"
                  >
                    {product.name}
                  </h3>

                  <div className="text-xs sm:text-sm tracking-[0.12em] text-[#D4AF37] font-semibold">
                    From <span className="font-bold">{formatPrice(product.prices.AED, activeCurrency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center">
          <button
            onClick={() => {
              if (perfumes[0]) onSelectProduct(perfumes[0].id);
            }}
            className="inline-block bg-[#D4AF37] text-[#0A0A0C] hover:bg-[#ECC86A] text-xs font-bold uppercase tracking-[0.22em] px-10 py-3.5 transition-all duration-300 shadow-xl hover:-translate-y-0.5"
          >
            View all
          </button>
        </div>

      </div>
    </section>
  );
}
