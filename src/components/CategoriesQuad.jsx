import React from 'react';
import { motion } from 'framer-motion';

export default function CategoriesQuad({ onSelectProduct, onAddToCart }) {
  return (
    <section id="collections" className="py-24 bg-obsidian border-b border-white/5">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs tracking-[0.28em] uppercase text-gold-light mb-3">
            <span className="text-gold">♦</span>
            <span>Fragrance Categories</span>
            <span className="text-gold">♦</span>
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-ivory tracking-tight mb-4">
            Curated by Olfactory Character
          </h2>
          <p className="text-xs md:text-sm text-sand/80 max-w-lg mx-auto leading-relaxed">
            From bright nocturnal florals to rich woods and cooling rain-washed earth.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Cell 1: Women's / Modern */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-carbon via-[#0d0d10] to-obsidian p-8 flex flex-col justify-between min-h-[350px] relative overflow-hidden group shadow-2xl hover:border-gold/35 transition-all duration-300"
          >
            {/* Hairline shimmer */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full border border-gold/40 text-gold flex items-center justify-center text-sm mb-6 bg-black/40 shadow-inner">
                ♦
              </div>
              <span className="text-[10px] tracking-[0.22em] uppercase text-gold-muted block mb-1.5 font-medium">
                Modern Collection
              </span>
              <h3 className="font-serif text-2xl text-ivory group-hover:text-gold-light transition-colors mb-3">
                Women's Scents
              </h3>
              <p className="text-xs text-sand/75 leading-relaxed">
                Bright Kashmiri saffron, wild citrus peels, and smooth Mysore sandalwood heartwood.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectProduct('rooh-mysore')}
              className="relative z-10 mt-6 inline-flex self-start py-2.5 px-6 text-xs tracking-[0.16em] uppercase border border-white/20 text-white hover:border-gold hover:text-gold-light transition-all rounded-full cursor-pointer"
            >
              Explore Scent
            </button>
          </motion.div>

          {/* Cell 2: Exclusive / Evening Oud */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-carbon via-[#0d0d10] to-obsidian p-8 flex flex-col justify-between min-h-[350px] relative overflow-hidden group shadow-2xl hover:border-gold/35 transition-all duration-300"
          >
            {/* Hairline shimmer */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full border border-gold/40 text-gold flex items-center justify-center text-sm mb-6 bg-black/40 shadow-inner">
                ♦
              </div>
              <span className="text-[10px] tracking-[0.22em] uppercase text-gold-muted block mb-1.5 font-medium">
                Exclusive Reserve
              </span>
              <h3 className="font-serif text-2xl text-ivory group-hover:text-gold-light transition-colors mb-3">
                Evening Oud
              </h3>
              <p className="text-xs text-sand/75 leading-relaxed">
                Deep centenary Assamese agarwood with dark leather and warm birch smoke.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectProduct('dahn-assam')}
              className="relative z-10 mt-6 inline-flex self-start py-2.5 px-6 text-xs tracking-[0.16em] uppercase border border-white/20 text-white hover:border-gold hover:text-gold-light transition-all rounded-full cursor-pointer"
            >
              Explore Scent
            </button>
          </motion.div>

          {/* Cell 3: Unisex / Genderless */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-carbon via-[#0d0d10] to-obsidian p-8 flex flex-col justify-between min-h-[350px] relative overflow-hidden group shadow-2xl hover:border-gold/35 transition-all duration-300"
          >
            {/* Hairline shimmer */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full border border-gold/40 text-gold flex items-center justify-center text-sm mb-6 bg-black/40 shadow-inner">
                ♛
              </div>
              <span className="text-[10px] tracking-[0.22em] uppercase text-gold-muted block mb-1.5 font-medium">
                Genderless
              </span>
              <h3 className="font-serif text-2xl text-ivory group-hover:text-gold-light transition-colors mb-3">
                Unisex Earth
              </h3>
              <p className="text-xs text-sand/75 leading-relaxed">
                Cool Kannauj vetiver roots distilled over wood fire, balanced with golden amber.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onAddToCart('khus-amber', 50)}
              className="relative z-10 mt-6 inline-flex self-start py-2.5 px-6 text-xs tracking-[0.16em] uppercase bg-gold text-obsidian font-semibold hover:bg-gold-light transition-all rounded-full shadow-lg shadow-gold/15 cursor-pointer"
            >
              Add to Bag
            </button>
          </motion.div>

          {/* Cell 4: Amber Crystal Flacon Image Card */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-white/10 overflow-hidden relative min-h-[350px] group shadow-2xl hover:border-gold/35 transition-all duration-300"
          >
            <img
              src="/images/olfactory_universe.jpg"
              alt="Amber crystal perfume bottle on black silk velvet"
              className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent flex flex-col justify-end p-7">
              <span className="text-[10px] tracking-[0.22em] uppercase text-gold-light mb-1">
                Pure Essence
              </span>
              <div className="font-serif text-2xl text-ivory leading-tight">
                Hand-Poured Extracts
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
