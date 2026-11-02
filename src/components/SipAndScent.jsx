import React from 'react';
import { formatPrice } from '../data/products.js';

export default function SipAndScent({
  products = [],
  activeCurrency = 'AED',
  onSelectProduct,
  onQuickBuy
}) {
  const sipProducts = products.filter((p) => p.collection === 'Sip and Scent');

  return (
    <section id="sip-scent-section" className="py-16 sm:py-24 bg-[#0A0A0C] text-[#F7F5F0] border-b border-[#D4AF37]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <p className="text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[#D4AF37] font-semibold mb-2 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            NEW LAUNCH 2026
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-[0.2em] uppercase text-white font-sans">
            Sip and Scent
          </h2>
          <p className="text-xs sm:text-sm text-white/70 font-light mt-3 tracking-wide">
            An artisanal fusion of refreshing tropical libations and haute perfumery.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {sipProducts.map((product) => (
            <div
              key={product.id}
              className="bg-[#141418] border border-[#D4AF37]/25 rounded-xs overflow-hidden flex flex-col justify-between group hover:border-[#D4AF37] transition-all duration-500 shadow-xl"
            >
              {/* Product Image */}
              <div
                className="relative aspect-square overflow-hidden bg-black/60 cursor-pointer"
                onClick={() => onSelectProduct(product.id)}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />

                {/* Quick Add "+" Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickBuy(product);
                  }}
                  className="absolute bottom-3 right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#D4AF37] text-[#0A0A0C] shadow-xl flex items-center justify-center hover:bg-white hover:text-black transition-all transform group-hover:scale-110 font-bold"
                  aria-label={`Add ${product.name} to cart`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 0v12M0 6h12" />
                  </svg>
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 sm:p-5 text-center flex flex-col items-center justify-between flex-grow">
                <h3
                  onClick={() => onSelectProduct(product.id)}
                  className="text-xs sm:text-sm font-semibold tracking-[0.16em] uppercase text-white hover:text-[#D4AF37] transition-colors cursor-pointer mb-2 font-sans"
                >
                  {product.name}
                </h3>
                <div className="text-xs sm:text-sm tracking-[0.12em] text-[#D4AF37] font-semibold">
                  {formatPrice(product.prices.AED, activeCurrency)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Centered Explore Button */}
        <div className="text-center">
          <button
            onClick={() => {
              if (sipProducts[0]) onSelectProduct(sipProducts[0].id);
            }}
            className="inline-block bg-[#D4AF37] text-[#0A0A0C] hover:bg-[#ECC86A] text-xs font-bold uppercase tracking-[0.22em] px-10 py-3.5 transition-all duration-300 shadow-xl hover:-translate-y-0.5"
          >
            Explore Collection
          </button>
        </div>

      </div>
    </section>
  );
}
