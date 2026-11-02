import React, { useState } from 'react';
import { formatPrice } from '../data/products.js';

export default function CreateFragrance({ onAddCustomToCart, activeCurrency = 'AED' }) {
  const [scentProfile, setScentProfile] = useState('oud-amber');
  const [bottleSize, setBottleSize] = useState(50);
  const [concentration, setConcentration] = useState('extrait');
  const [engravingText, setEngravingText] = useState('');

  const profiles = [
    {
      id: 'oud-amber',
      name: 'Wild Oud & Golden Amber',
      desc: 'Assam agarwood, dry cedar, Kashmiri saffron & golden labdanum resin.',
      color: 'from-amber-900 to-amber-700'
    },
    {
      id: 'fresh-citrus',
      name: 'Mediterranean Citrus & Tea',
      desc: 'Calabrian bergamot, green mint, Sicilian blood orange & black tea.',
      color: 'from-emerald-900 to-teal-700'
    },
    {
      id: 'velvet-rose',
      name: 'Taif Rose & Royal Jasmine',
      desc: 'Fresh damask rosebuds, white jasmine sambac, orris root & solar musk.',
      color: 'from-rose-950 to-pink-900'
    },
    {
      id: 'dark-gourmand',
      name: 'Smoked Vanilla & Roasted Cocoa',
      desc: 'Belgian dark chocolate, Madagascar vanilla bourbon, roasted coffee & tonka.',
      color: 'from-amber-950 to-stone-900'
    }
  ];

  // Base pricing
  const basePrice = bottleSize === 50 ? 160 : 240;
  const concentrationExtra = concentration === 'extrait' ? 30 : concentration === 'attar' ? 60 : 0;
  const totalPrice = basePrice + concentrationExtra;

  const handleCreateAndAdd = () => {
    const selectedProfile = profiles.find((p) => p.id === scentProfile);
    const customItem = {
      productId: 'custom-bespoke',
      customName: `Saudagar Bespoke: ${selectedProfile.name}`,
      sizeMl: bottleSize,
      concentrationLabel:
        concentration === 'extrait'
          ? 'Extrait de Parfum (35% Oil)'
          : concentration === 'attar'
          ? 'Pure Concentrated Attar (100% Oil)'
          : 'Eau de Parfum (25% Oil)',
      engraving: engravingText.trim(),
      priceAed: totalPrice,
      image: '/images/masterwork_bottle.jpg'
    };

    onAddCustomToCart(customItem);
  };

  return (
    <section id="create-fragrance-section" className="py-16 sm:py-24 bg-[#141418] text-white border-b border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-[#D4AF37] font-semibold mb-3 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            SAUDAGAR BESPOKE STUDIO · DUBAI
          </p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-light tracking-[0.18em] uppercase text-white font-sans mb-4">
            Create Your Fragrance
          </h2>
          <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed">
            Formulate an exclusive personalized fragrance crafted to your signature olfactory profile. Hand-blended by Saudagar master perfumers in Dubai.
          </p>
        </div>

        {/* 2-Column Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Visual Atelier Preview & Details (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-[#0A0A0C] p-6 sm:p-8 rounded-xs border border-[#D4AF37]/35 flex flex-col justify-between shadow-2xl">
            <div className="relative aspect-[4/3] rounded-xs overflow-hidden mb-6 bg-black border border-[#D4AF37]/20">
              <img
                src="/images/bespoke_atelier.jpg"
                alt="Saudagar Master Perfumer Blending Bespoke Oil"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-center">
                <span className="text-[10px] tracking-[0.24em] uppercase text-[#D4AF37] font-semibold">
                  Al Fahidi Historical Atelier · Dubai
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs tracking-wider border-t border-[#D4AF37]/20 pt-4">
              <div className="flex justify-between text-[#D4AF37]">
                <span className="text-white/60">Selected Accord:</span>
                <span className="font-semibold text-white">{profiles.find((p) => p.id === scentProfile)?.name}</span>
              </div>
              <div className="flex justify-between text-[#D4AF37]">
                <span className="text-white/60">Flacon Capacity:</span>
                <span className="font-semibold text-white">{bottleSize}ml Heavy Crystal</span>
              </div>
              <div className="flex justify-between text-[#D4AF37]">
                <span className="text-white/60">Concentration:</span>
                <span className="font-semibold uppercase text-white">{concentration}</span>
              </div>
              {engravingText && (
                <div className="flex justify-between text-[#D4AF37]">
                  <span className="text-white/60">Laser Engraving:</span>
                  <span className="font-serif italic font-bold text-[#D4AF37]">"{engravingText}"</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#D4AF37]/20">
                <span>Total Formula Price:</span>
                <span className="text-[#D4AF37]">{formatPrice(totalPrice, activeCurrency)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Step-by-Step Customizer (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-8 bg-[#0A0A0C] p-6 sm:p-8 rounded-xs border border-[#D4AF37]/35 shadow-2xl">
            
            {/* Step 1: Select Scent Profile */}
            <div>
              <label className="block text-xs font-semibold tracking-[0.2em] uppercase text-[#D4AF37] mb-3">
                1. Select Scent Harmony
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setScentProfile(p.id)}
                    className={`p-4 text-left rounded-xs border transition-all ${
                      scentProfile === p.id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white shadow-xl'
                        : 'border-white/10 bg-[#141418] hover:border-[#D4AF37]/40 text-white/80'
                    }`}
                  >
                    <div className="text-xs font-semibold tracking-[0.14em] uppercase mb-1 text-[#D4AF37]">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-white/70 font-light leading-snug">
                      {p.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Flacon Size */}
            <div>
              <label className="block text-xs font-semibold tracking-[0.2em] uppercase text-[#D4AF37] mb-3">
                2. Choose Flacon Size
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[50, 100].map((size) => (
                  <button
                    key={size}
                    onClick={() => setBottleSize(size)}
                    className={`py-3.5 px-4 text-center rounded-xs border transition-all text-xs tracking-[0.16em] uppercase font-medium ${
                      bottleSize === size
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-bold shadow-md'
                        : 'border-white/10 bg-[#141418] hover:border-[#D4AF37]/40 text-white/75'
                    }`}
                  >
                    {size}ml Flacon
                    <span className="block text-[10px] text-white/60 mt-0.5">
                      {size === 50 ? 'Standard Travel Edition' : 'Collector Signature Flacon'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Oil Concentration */}
            <div>
              <label className="block text-xs font-semibold tracking-[0.2em] uppercase text-[#D4AF37] mb-3">
                3. Oil Concentration
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'edp', label: 'Eau de Parfum', conc: '25% Pure Oil' },
                  { id: 'extrait', label: 'Extrait de Parfum', conc: '35% Pure Oil (+AED 30)' },
                  { id: 'attar', label: 'Pure Attar Oil', conc: '100% Oil (+AED 60)' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setConcentration(c.id)}
                    className={`py-3 px-2 text-center rounded-xs border transition-all text-[11px] tracking-[0.12em] uppercase ${
                      concentration === c.id
                        ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0C] font-bold'
                        : 'border-white/10 bg-[#141418] hover:border-[#D4AF37]/40 text-white/75'
                    }`}
                  >
                    <span className="block">{c.label}</span>
                    <span className="block text-[9px] mt-1 font-normal opacity-80">
                      {c.conc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Custom 24K Gold Laser Engraving */}
            <div>
              <label className="block text-xs font-semibold tracking-[0.2em] uppercase text-[#D4AF37] mb-2">
                4. Custom Bottle Engraving (Optional · Complimentary)
              </label>
              <input
                type="text"
                maxLength={24}
                value={engravingText}
                onChange={(e) => setEngravingText(e.target.value)}
                placeholder="Enter name, initials or date (e.g. SAUDAGAR · 2026)"
                className="w-full bg-[#141418] border border-white/20 text-white placeholder-white/40 px-4 py-3 text-xs tracking-[0.16em] uppercase focus:outline-none focus:border-[#D4AF37]"
              />
              <p className="text-[10px] text-white/50 mt-1">
                24K gold foil precision laser etched directly onto the crystal flacon. Max 24 characters.
              </p>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                onClick={handleCreateAndAdd}
                className="w-full bg-[#D4AF37] hover:bg-[#ECC86A] text-[#0A0A0C] font-bold text-xs tracking-[0.24em] uppercase py-4 transition-all shadow-2xl hover:-translate-y-0.5"
              >
                Blend &amp; Add to Bag · {formatPrice(totalPrice, activeCurrency)}
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
