import React, { useRef } from 'react';
import { formatPrice } from '../data/products.js';

export default function FragranceOfTheWeek({
  products = [],
  activeCurrency = 'AED',
  onSelectProduct,
  onQuickBuy
}) {
  const scrollRef = useRef(null);

  const weeklyPicks = products.filter((p) => p.isWeeklyPick);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="fragrance-week-section" className="py-16 sm:py-24 bg-[#141418] text-[#F7F5F0] border-b border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          {/* Eyebrow with gold pulse dot */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#D4AF37] text-xs uppercase tracking-[0.2em] font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37] animate-pulse" />
            <span>Weekly pick</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-[0.2em] uppercase text-white mb-3 font-sans">
            Fragrance of the week
          </h2>

          <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed tracking-[0.04em]">
            Discover this week's curated Saudagar extraits and find your next signature scent.
          </p>
        </div>

        {/* Carousel Container with Gold Arrows */}
        <div className="relative group">
          {/* Left arrow */}
          <button
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0A0A0C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-xl items-center justify-center hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-all duration-300"
            aria-label="Previous products"
          >
            <svg width="14" height="14" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 1 3 9l8 8" />
            </svg>
          </button>

          {/* Right arrow */}
          <button
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0A0A0C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-xl items-center justify-center hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-all duration-300"
            aria-label="Next products"
          >
            <svg width="14" height="14" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 17 8-8-8-8" />
            </svg>
          </button>

          {/* Product cards horizontal list in Black & Gold */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1"
          >
            {weeklyPicks.map((product) => (
              <div
                key={product.id}
                className="w-[260px] sm:w-[280px] md:w-[300px] flex-shrink-0 bg-[#1A1A20] border border-[#D4AF37]/25 shadow-lg hover:shadow-2xl hover:border-[#D4AF37]/60 transition-all duration-500 rounded-xs overflow-hidden flex flex-col justify-between group/card"
              >
                {/* Figure Image Container */}
                <div
                  className="relative aspect-square overflow-hidden bg-black/60 cursor-pointer"
                  onClick={() => onSelectProduct(product.id)}
                >
                  {/* Top Right Badges */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
                    {product.isBestseller && (
                      <span className="bg-[#0A0A0C] text-[#D4AF37] border border-[#D4AF37]/40 text-[9px] uppercase tracking-[0.16em] px-2 py-0.5 font-bold shadow-md">
                        Bestseller
                      </span>
                    )}
                    <span className="bg-[#D4AF37] text-[#0A0A0C] text-[9px] uppercase tracking-[0.16em] px-2 py-0.5 font-bold shadow-md">
                      Weekly Pick
                    </span>
                  </div>

                  {/* Product Image */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-700 brightness-95 group-hover/card:brightness-105"
                    loading="lazy"
                  />

                  {/* Quick Add "+" Button in Gold */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickBuy(product);
                    }}
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-[#D4AF37] text-[#0A0A0C] shadow-xl flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 transform group-hover/card:scale-110"
                    aria-label={`Quick buy ${product.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 0v12M0 6h12" />
                    </svg>
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4 sm:p-5 text-center flex flex-col items-center justify-between flex-grow">
                  {/* Brand inspiration */}
                  {product.inspiration && (
                    <span className="inline-block text-[10px] tracking-[0.14em] text-[#D4AF37]/80 uppercase mb-2 font-medium">
                      {product.inspiration}
                    </span>
                  )}

                  {/* Product Title */}
                  <h3
                    onClick={() => onSelectProduct(product.id)}
                    className="text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase text-white hover:text-[#D4AF37] transition-colors cursor-pointer mb-2 font-sans"
                  >
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="text-xs sm:text-sm tracking-[0.12em] text-[#D4AF37] font-medium">
                    From <span className="font-bold">{formatPrice(product.prices.AED, activeCurrency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
