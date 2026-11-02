import React from 'react';
import { motion } from 'framer-motion';
import { PRODUCTS, formatPrice } from '../data/products.js';

export default function EditorialSection({ activeCurrency = 'INR', onSelectProduct, onAddToCart }) {
  const masterwork = PRODUCTS.find(p => p.id === 'masterwork-saudagar-i') || PRODUCTS[0];
  const priceStr = formatPrice(masterwork.prices.INR, activeCurrency);

  return (
    <section className="py-24 bg-obsidian border-b border-white/5 relative overflow-hidden">
      
      {/* Ambient background light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-gold/5 via-gold/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs tracking-[0.28em] uppercase text-gold-light mb-3">
            <span className="text-gold">♦</span>
            <span>Maison Masterwork</span>
            <span className="text-gold">♦</span>
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-ivory tracking-tight mb-4">
            The Crown Jewel: SAUDAGAR I
          </h2>
          <p className="text-xs md:text-sm text-sand/80 max-w-lg mx-auto leading-relaxed">
            Limited to 300 numbered bottles worldwide. Pure Extrait with 40% botanical oil concentration.
          </p>
        </div>

        {/* 2-Column Balanced Masterpiece Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* Left Column: Visual Showcase Frame */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 rounded-2xl border border-white/10 bg-gradient-to-b from-carbon via-[#0d0d10] to-obsidian p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-gold/35 transition-all duration-500 min-h-[560px]"
          >
            {/* Top Hairline Shimmer */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />

            {/* Inner Radial Spotlight Halo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-radial from-gold/15 via-gold/5 to-transparent blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />

            {/* Top Floating Badge Bar */}
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full border border-gold/40 flex items-center justify-center font-serif text-xs text-gold-light bg-black/40">
                  IV
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/70 font-medium">
                  Edition IV · Limited Reserve
                </span>
              </div>
              <span className="text-[9px] tracking-[0.18em] uppercase px-3 py-1 rounded-full bg-gold text-obsidian font-bold shadow-md shadow-gold/20">
                300 Bottles Worldwide
              </span>
            </div>

            {/* Showcase Flacon on Pedestal */}
            <div 
              className="w-full my-auto py-6 flex items-center justify-center relative z-10 cursor-pointer"
              onClick={() => onSelectProduct(masterwork.id)}
            >
              <motion.img
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.4 }}
                src="/images/bottom_black_podium.jpg"
                alt="Black luxury perfume bottle on circular podium"
                className="max-h-[380px] w-auto object-contain rounded-xl filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.9)]"
                loading="lazy"
              />
            </div>

            {/* Bottom Key Notes Bar */}
            <div className="relative z-10 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {['Aged Sandalwood', 'Wild Assam Oud', 'Night Jasmine', 'Kashmiri Saffron'].map((note, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-black/50 border border-white/10 text-sand px-3 py-1 rounded-full backdrop-blur-md"
                  >
                    {note}
                  </span>
                ))}
              </div>
              <span className="text-[10px] tracking-[0.16em] uppercase text-gold-light italic">
                Aged 8 Months
              </span>
            </div>
          </motion.div>

          {/* Right Column: Story & Craft Dossier */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-5 rounded-2xl border border-gold/40 bg-gradient-to-b from-charcoal via-carbon to-obsidian p-8 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[560px]"
          >
            {/* Top Hairline Shimmer */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent pointer-events-none" />

            {/* Subtle Golden Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-radial from-gold/15 to-transparent blur-2xl pointer-events-none" />

            {/* Top Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-full border border-gold/40 text-gold flex items-center justify-center text-xs bg-black/40">
                  ♦
                </span>
                <span className="text-[10px] tracking-[0.24em] uppercase text-gold font-semibold">
                  Private Reserve Extrait
                </span>
              </div>

              <h3 className="font-serif text-3xl sm:text-4xl text-ivory mb-2">
                SAUDAGAR I
              </h3>
              
              <p className="text-sm font-serif italic text-gold-light mb-4">
                Our most complex and concentrated formulation.
              </p>

              <p className="text-xs text-sand/85 leading-relaxed mb-6">
                Created with century-old Mysore sandalwood heartwood, dark wild Assam agarwood, and freshly harvested Madurai night jasmine. Hand-poured into heavy crystal and finished with a solid engraved cap.
              </p>

              {/* 3 Craft Highlights */}
              <div className="space-y-3 pt-4 border-t border-white/10 mb-8">
                <div className="flex items-start gap-3">
                  <span className="font-serif text-gold text-sm font-semibold mt-0.5">01</span>
                  <div>
                    <h4 className="text-xs text-ivory font-medium mb-0.5">Numbered Certificate</h4>
                    <p className="text-[11px] text-ash leading-relaxed">Each flacon is individually numbered from 01 to 300 with an official certificate.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="font-serif text-gold text-sm font-semibold mt-0.5">02</span>
                  <div>
                    <h4 className="text-xs text-ivory font-medium mb-0.5">Free Custom Engraving</h4>
                    <p className="text-[11px] text-ash leading-relaxed">Your bespoke initials engraved on the polished solid metal cap at no extra cost.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="font-serif text-gold text-sm font-semibold mt-0.5">03</span>
                  <div>
                    <h4 className="text-xs text-ivory font-medium mb-0.5">All-Day Longevity</h4>
                    <p className="text-[11px] text-ash leading-relaxed">40% pure uncut oil concentration that lasts through the day and evening.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-white/10 relative z-10 mt-auto">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-[11px] tracking-[0.14em] uppercase text-ash">
                  50ml Monumental Flacon
                </span>
                <span className="font-serif text-2xl text-gold-light font-medium">
                  {priceStr}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => onAddToCart(masterwork.id, 50)}
                  className="flex-1 py-3 px-6 text-xs font-semibold tracking-[0.18em] uppercase bg-gold text-obsidian hover:bg-gold-light transition-all rounded-full shadow-lg shadow-gold/20 text-center cursor-pointer whitespace-nowrap"
                >
                  Add to Bag
                </motion.button>
                <button
                  type="button"
                  onClick={() => onSelectProduct(masterwork.id)}
                  className="flex-1 py-3 px-6 text-xs tracking-[0.18em] uppercase border border-white/20 text-white hover:border-gold hover:text-gold-light transition-all rounded-full text-center cursor-pointer whitespace-nowrap"
                >
                  Full Dossier
                </button>
              </div>
            </div>

          </motion.div>

        </div>

      </div>
    </section>
  );
}
