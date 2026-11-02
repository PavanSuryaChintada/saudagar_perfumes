import React from 'react';

export default function PerfumerStory({ onExploreEditions }) {
  return (
    <section id="perfumer-story-section" className="py-20 sm:py-28 bg-[#0A0A0C] text-white border-b border-[#D4AF37]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Image (lg:col-span-6) */}
          <div className="lg:col-span-6 relative aspect-[4/5] rounded-xs overflow-hidden shadow-2xl bg-black border border-[#D4AF37]/30">
            <img
              src="/images/brand_story.jpg"
              alt="Saudagar Master Perfumer at Work"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-[10px] tracking-[0.26em] uppercase text-[#D4AF37] mb-1 font-semibold">
                THE CRAFT &amp; PHILOSOPHY
              </p>
              <h4 className="text-xl sm:text-2xl font-light tracking-[0.16em] uppercase text-white font-sans">
                Over 50,000 Bespoke Scents Crafted
              </h4>
            </div>
          </div>

          {/* Right Column: Editorial Copy (lg:col-span-6) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-block border-b border-[#D4AF37] pb-1">
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#D4AF37] font-semibold">
                OUR STORY &amp; HERITAGE
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-light tracking-[0.18em] uppercase text-white leading-tight font-sans">
              Saudagar Perfumes of Dubai
            </h2>

            <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed tracking-[0.04em]">
              Nestled within the timeless alleys of Al Fahidi and the historic trading harbors of Dubai, Saudagar Perfumes has stood as an esteemed sanctuary for connoisseurs of rare scents.
            </p>

            <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed tracking-[0.04em]">
              Each bottle represents generations of artisanal perfumery: aging pure Mysore sandalwood for twelve years, distilling wild Assam agarwood, and harmonizing precious French Grasse botanicals. We believe true luxury lies in authentic rarity—a perfume hand-formulated to become your personal legend.
            </p>

            {/* Credibility highlights in Gold */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#D4AF37]/20">
              <div>
                <div className="text-2xl sm:text-3xl font-light text-[#D4AF37] tracking-widest font-sans">
                  35%+
                </div>
                <div className="text-[11px] tracking-[0.16em] uppercase text-white/60 mt-1">
                  Pure Oil Concentration
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-light text-[#D4AF37] tracking-widest font-sans">
                  100%
                </div>
                <div className="text-[11px] tracking-[0.16em] uppercase text-white/60 mt-1">
                  Artisanal Hand Blended
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  const el = document.getElementById('perfumes-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#D4AF37] text-[#0A0A0C] hover:bg-[#ECC86A] text-xs font-bold uppercase tracking-[0.22em] px-8 py-3.5 transition-all shadow-xl hover:-translate-y-0.5"
              >
                Discover The Creations
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
