import React from 'react';

export default function ScentedDelights({ onSelectCategory }) {
  const categories = [
    {
      id: 'perfumes',
      title: 'Perfumes',
      subtitle: 'Extraits & Bespoke Blends',
      image: '/images/saudagar_amber_gold.png',
      linkTarget: 'perfumes-section'
    },
    {
      id: 'candles',
      title: 'Candles',
      subtitle: 'Hand-Poured Soy Wax',
      image: '/images/ingredients.jpg',
      linkTarget: 'candle'
    },
    {
      id: 'bakhoor',
      title: 'Bakhoor',
      subtitle: 'Rare Matured Agarwood',
      image: '/images/brand_story.jpg',
      linkTarget: 'bakhoor'
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-[#0A0A0C] text-[#F7F5F0] border-b border-[#D4AF37]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-[0.2em] uppercase text-white font-sans mb-3">
            Scented Delights
          </h2>
          <h3 className="text-xs sm:text-sm font-normal tracking-[0.22em] uppercase text-[#D4AF37]">
            A Trio of Luxurious Fragrances
          </h3>
        </div>

        {/* 3 Large Photographic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                if (cat.linkTarget === 'perfumes-section') {
                  const el = document.getElementById('perfumes-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  alert(`Saudagar ${cat.title}: Handcrafted artisanal formulations available in our Dubai boutique and worldwide delivery.`);
                }
              }}
              className="group cursor-pointer flex flex-col items-center"
            >
              <div className="relative w-full aspect-[4/3] sm:aspect-[3/2] overflow-hidden bg-[#141418] mb-5 shadow-2xl rounded-xs border border-[#D4AF37]/30 group-hover:border-[#D4AF37] transition-all duration-500">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
              </div>

              <h4 className="text-base sm:text-lg font-medium tracking-[0.22em] uppercase text-white group-hover:text-[#D4AF37] transition-colors">
                {cat.title}
              </h4>
              <p className="text-[11px] tracking-[0.16em] text-[#D4AF37]/80 uppercase mt-1">
                {cat.subtitle}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
