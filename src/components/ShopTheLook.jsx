import React, { useState } from 'react';
import { formatPrice } from '../data/products.js';

export default function ShopTheLook({
  products = [],
  activeCurrency = 'AED',
  onSelectProduct,
  onQuickBuy
}) {
  const nobleProducts = products.filter((p) => p.collection === 'Noble Collection');
  const [activeBottleIndex, setActiveBottleIndex] = useState(0);

  // Hotspot coordinates matching our generated Noble Collection photograph
  const hotspots = [
    { top: '38%', left: '20%', index: 0, title: 'Passio' },
    { top: '48%', left: '42%', index: 1, title: 'Pragma' },
    { top: '46%', left: '62%', index: 2, title: 'Devoir Elixir' },
    { top: '56%', left: '82%', index: 3, title: 'Ardor' }
  ];

  const activeProduct = nobleProducts[activeBottleIndex] || nobleProducts[0];

  return (
    <section id="noble-collection-section" className="py-16 sm:py-24 bg-[#0A0A0C] text-[#F7F5F0] border-b border-[#D4AF37]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
          <p className="text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[#D4AF37] font-semibold mb-2 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            CURATED ATELIER
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-[0.2em] uppercase text-white font-sans mb-3">
            Noble Collection
          </h2>
          <p className="text-xs sm:text-sm text-white/70 font-light tracking-wide">
            Elevating elegance through every bespoke flacon.
          </p>
        </div>

        {/* 2-Column Desktop Grid / Stack Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Photograph with Interactive Gold Hotspots (lg:col-span-8) */}
          <div className="lg:col-span-8 relative aspect-[16/10] sm:aspect-[16/9] rounded-xs overflow-hidden shadow-2xl bg-black border border-[#D4AF37]/30">
            <img
              src="/images/noble_collection_hotspots.jpg"
              alt="Noble Collection Flacons"
              className="w-full h-full object-cover object-center brightness-95"
            />

            {/* Hotspot buttons positioned across the bottles */}
            {hotspots.map((spot) => (
              <button
                key={spot.title}
                onClick={() => setActiveBottleIndex(spot.index)}
                style={{ top: spot.top, left: spot.left }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeBottleIndex === spot.index
                    ? 'bg-[#D4AF37] text-[#0A0A0C] ring-4 ring-[#D4AF37]/50 scale-125 z-20 shadow-[0_0_15px_#D4AF37]'
                    : 'bg-[#0A0A0C]/80 text-[#D4AF37] border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0C] shadow-lg z-10'
                }`}
                aria-label={`Select ${spot.title}`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-current" />
              </button>
            ))}

            {/* Hint overlay */}
            <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] tracking-[0.18em] uppercase px-3 py-1.5 rounded-xs">
              Click any flacon to explore
            </div>
          </div>

          {/* Right Column: Active Selected Product Card in Black & Gold (lg:col-span-4) */}
          <div className="lg:col-span-4">
            {activeProduct && (
              <div className="bg-[#141418] p-6 sm:p-8 rounded-xs shadow-2xl border border-[#D4AF37]/35 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-[#D4AF37] text-[#0A0A0C] text-[9px] uppercase tracking-[0.16em] px-2.5 py-1 font-bold">
                      NOBLE COLLECTION
                    </span>
                    <span className="text-[10px] tracking-[0.14em] text-[#D4AF37]/80 font-medium">
                      Flacon {activeBottleIndex + 1} of 4
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-light tracking-[0.18em] uppercase text-white mb-2 font-sans">
                    {activeProduct.name}
                  </h3>

                  <p className="text-xs text-white/70 font-light leading-relaxed mb-4">
                    {activeProduct.subheading}
                  </p>

                  <div className="text-sm font-bold tracking-[0.12em] text-[#D4AF37] mb-6">
                    {formatPrice(activeProduct.prices.AED, activeCurrency)}
                  </div>

                  {/* Notes preview */}
                  <div className="bg-[#0A0A0C] p-3.5 rounded text-[11px] space-y-1.5 mb-6 text-white/80 border border-[#D4AF37]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[#D4AF37] uppercase tracking-wider text-[10px]">Family:</span>
                      <span className="font-medium text-white">{activeProduct.family}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#D4AF37] uppercase tracking-wider text-[10px]">Concentration:</span>
                      <span className="font-medium text-white">32% Pure Extrait</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => onQuickBuy(activeProduct)}
                    className="w-full bg-[#D4AF37] hover:bg-[#ECC86A] text-[#0A0A0C] text-xs font-bold uppercase tracking-[0.2em] py-3.5 transition-all shadow-xl"
                  >
                    Add to Cart
                  </button>

                  <button
                    onClick={() => onSelectProduct(activeProduct.id)}
                    className="w-full bg-transparent border border-[#D4AF37]/40 hover:border-[#D4AF37] text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] py-3 transition-colors"
                  >
                    View Product Details
                  </button>
                </div>
              </div>
            )}

            {/* Quick selector dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {nobleProducts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBottleIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    activeBottleIndex === i ? 'w-6 bg-[#D4AF37]' : 'bg-white/20 hover:bg-[#D4AF37]/50'
                  }`}
                  aria-label={`Noble fragrance ${i + 1}`}
                />
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
