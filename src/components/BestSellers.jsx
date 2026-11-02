import React from 'react';
import { motion } from 'framer-motion';
import { PRODUCTS, formatPrice } from '../data/products.js';

export default function BestSellers({ activeCurrency, onSelectProduct, onAddToCart }) {
  const bestSellers = PRODUCTS.slice(0, 3);

  return (
    <section id="editions" className="py-24 bg-obsidian border-b border-white/5 relative overflow-hidden">
      
      {/* Ambient background lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-gold/5 via-gold/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header with Warm Gold Accents */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs tracking-[0.28em] uppercase text-gold-light mb-3">
            <span className="text-gold">♦</span>
            <span>Curated Collection</span>
            <span className="text-gold">♦</span>
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-ivory tracking-tight mb-4">
            Most Loved Formulations
          </h2>
          <p className="text-xs md:text-sm text-sand/80 max-w-lg mx-auto leading-relaxed">
            Handcrafted with aged botanicals and pure perfume oils. Made in limited numbered batches.
          </p>
        </div>

        {/* 3-Column Luxury Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {bestSellers.map((product, idx) => {
            const isCenterpiece = idx === 1; // Center card has distinct highlight (R-14)
            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                whileHover={{ y: -8 }}
                className={`rounded-2xl border p-7 sm:p-8 flex flex-col justify-between relative group transition-all duration-500 shadow-2xl overflow-hidden backdrop-blur-md ${
                  isCenterpiece
                    ? 'border-gold/50 bg-gradient-to-b from-charcoal via-carbon to-obsidian shadow-gold/10'
                    : 'border-white/10 bg-gradient-to-b from-carbon via-[#0d0d10] to-obsidian hover:border-gold/35'
                }`}
              >
                {/* Hairline Golden Edge Shimmer */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />

                {/* Subtle Inner Spotlight Glow behind Flacon */}
                <div className={`absolute top-20 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700 ${
                  isCenterpiece ? 'bg-radial from-gold/20 to-transparent' : 'bg-radial from-gold/10 to-transparent'
                }`} />

                {/* Top Card Header: Edition Tag & Note Family Pill */}
                <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full border border-gold/40 flex items-center justify-center font-serif text-xs text-gold-light bg-black/40">
                      {product.roman}
                    </span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white/70 font-medium">
                      Edition {product.roman}
                    </span>
                  </div>

                  {isCenterpiece ? (
                    <span className="text-[9px] tracking-[0.18em] uppercase px-3 py-1 rounded-full bg-gold text-obsidian font-bold shadow-md shadow-gold/20">
                      Flagship
                    </span>
                  ) : (
                    <span className="text-[9px] tracking-[0.16em] uppercase px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gold-light">
                      {product.family}
                    </span>
                  )}
                </div>

                {/* Flacon Showcase Frame */}
                <div 
                  className="w-full h-64 flex items-center justify-center relative mb-6 z-10 cursor-pointer"
                  onClick={() => onSelectProduct(product.id)}
                >
                  <motion.img
                    src={product.image}
                    alt={product.name}
                    className="max-h-56 w-auto object-contain filter drop-shadow-[0_22px_32px_rgba(0,0,0,0.9)] group-hover:scale-108 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                {/* Key Fragrance Notes Pill Bar */}
                <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                  {product.notes.top.slice(0, 2).concat(product.notes.heart.slice(0, 1)).map((note, nIdx) => (
                    <span
                      key={nIdx}
                      className="text-[10px] bg-black/40 border border-white/10 text-sand/90 px-2.5 py-0.5 rounded-full"
                    >
                      {note}
                    </span>
                  ))}
                </div>

                {/* Product Name & Subheading */}
                <div className="mb-6 relative z-10 cursor-pointer" onClick={() => onSelectProduct(product.id)}>
                  <h3 className="font-serif text-2xl text-white group-hover:text-gold-light transition-colors mb-1.5">
                    {product.name}
                  </h3>
                  <p className="text-xs text-sand/75 leading-relaxed line-clamp-2">
                    {product.subheading}
                  </p>
                </div>

                {/* Footer Bar: Price & Action Buttons */}
                <div className="pt-5 border-t border-white/10 flex items-center justify-between gap-4 relative z-10 mt-auto">
                  <div>
                    <div className="text-[10px] tracking-[0.14em] uppercase text-ash">
                      50ml Extrait
                    </div>
                    <div className="font-serif text-2xl text-gold-light font-medium">
                      {formatPrice(product.prices.INR, activeCurrency)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product.id)}
                      className="py-2.5 px-4 text-xs tracking-wider uppercase border border-white/20 text-white hover:border-gold hover:text-gold-light transition-all rounded-full cursor-pointer"
                    >
                      Details
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => onAddToCart(product.id, 50)}
                      className="py-2.5 px-5 text-xs tracking-wider uppercase bg-gold text-obsidian font-semibold hover:bg-gold-light transition-all rounded-full shadow-lg shadow-gold/15 cursor-pointer whitespace-nowrap"
                    >
                      Add to Bag
                    </motion.button>
                  </div>
                </div>

              </motion.article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
