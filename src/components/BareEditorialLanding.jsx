import React from 'react';
import { formatPrice } from '../data/products.js';

export default function BareEditorialLanding({
  onSelectProduct,
  onOpenCart,
  onOpenSearch,
  activeCurrency = 'AED',
  cartCount = 0,
  onExploreClick,
  onOpenCustomStudio
}) {
  const seriesProducts = [
    {
      id: 'saudagar-deep-canopy',
      num: '001',
      name: 'DEEP CANOPY',
      description: 'Mineral density meets structured wood in a composition designed for grounded presence and quiet longevity.',
      priceNumber: 80,
      image: '/images/saudagar_noir_matte.png'
    },
    {
      id: 'saudagar-amber-bark',
      num: '002',
      name: 'AMBER BARK',
      description: 'Mineral density meets structured wood in a composition designed for grounded presence and quiet longevity.',
      priceNumber: 80,
      image: '/images/saudagar_amber_gold.png'
    },
    {
      id: 'saudagar-obsidian-root',
      num: '003',
      name: 'OBSIDIAN ROOT',
      description: 'Mineral density meets structured wood in a composition designed for grounded presence and quiet longevity.',
      priceNumber: 80,
      image: '/images/saudagar_crystal_diamond.png'
    }
  ];

  return (
    <div className="bg-[#ECEBE6] text-[#111111] font-sans selection:bg-[#C4823F] selection:text-white">
      
      {/* =========================================================================
          1. HERO EDITORIAL SECTION (Model in Tall Grasses + Overlaid Nav)
          ========================================================================= */}
      <section className="relative w-full h-[90vh] sm:h-[95vh] min-h-[640px] flex flex-col justify-between overflow-hidden bg-[#1A1A1E]">
        
        {/* Background Editorial Campaign Image */}
        <img
          src="/images/saudagar_hero_bare.jpg"
          alt="Saudagar Haute Parfumerie Campaign"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.92]"
        />

        {/* Subtle Vignette for Typography Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/55" />

        {/* 1A. OVERLAID HERO HEADER BAR */}
        <header className="relative z-20 w-full px-6 sm:px-12 py-7 flex items-center justify-between text-white">
          
          {/* Left: Bold Modern Brand Wordmark */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="cursor-pointer"
          >
            <span className="font-sans font-extrabold tracking-[0.24em] text-xl sm:text-2xl uppercase select-none">
              SAUDAGAR
            </span>
          </div>

          {/* Center: Minimalist Pipe-Delimited Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-[11px] font-medium tracking-[0.24em] uppercase text-white/90">
            <span className="text-white/40">|</span>
            <a
              href="#essences"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('essences-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors"
            >
              ESSENCES
            </a>
            <span className="text-white/40">|</span>
            <a
              href="#ritual"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('manifesto-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors"
            >
              RITUAL
            </a>
            <span className="text-white/40">|</span>
            <a
              href="#origin"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('perfumer-story-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors"
            >
              ORIGIN
            </a>
            <span className="text-white/40">|</span>
            <a
              href="#atelier"
              onClick={(e) => {
                e.preventDefault();
                if (onOpenCustomStudio) onOpenCustomStudio();
              }}
              className="hover:text-white transition-colors"
            >
              ATELIER
            </a>
            <span className="text-white/40">|</span>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('perfumer-story-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors"
            >
              ABOUT
            </a>
            <span className="text-white/40">|</span>
            <a
              href="#shop"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('essences-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors"
            >
              SHOP
            </a>
            <span className="text-white/40">|</span>
          </nav>

          {/* Right: Sub-mark + Actions (Search & Bag) */}
          <div className="flex items-center gap-5 sm:gap-7">
            <span className="font-sans font-bold tracking-[0.2em] text-sm sm:text-base uppercase text-white/90 hidden sm:inline select-none">
              SAUDAGAR©
            </span>

            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="text-white/80 hover:text-white transition-colors p-1"
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* Bag Trigger */}
            <button
              onClick={onOpenCart}
              className="relative text-white/90 hover:text-white transition-colors p-1"
              aria-label="Bag"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 8h16l-1.5 12.5a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5L4 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-white text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </header>

        {/* 1B. HERO BOTTOM-RIGHT CAPTION */}
        <div className="relative z-20 w-full px-6 sm:px-12 pb-8 sm:pb-12 flex justify-end">
          <div className="max-w-sm text-right select-none">
            <span className="font-script text-2xl sm:text-3xl text-[#ECC86A] block normal-case font-normal mb-1">
              An Intimate Gesture
            </span>
            <p className="text-[10px] sm:text-[11px] font-medium tracking-[0.22em] uppercase text-white/90 leading-relaxed">
              BRINGING CLARITY AND CONNECTION BACK TO<br />
              YOUR EVERYDAY &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; RITUAL.
            </p>
          </div>
        </div>

      </section>

      {/* =========================================================================
          2. THE THREE SIGNATURE BOTTLES (001, 002, 003 TRIO SHOWCASE)
          ========================================================================= */}
      <section id="essences-section" className="w-full bg-[#ECEBE6] border-b border-[#111111]">
        <div className="max-w-[1520px] mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#111111]">
          
          {seriesProducts.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectProduct(item.id)}
              className="flex flex-col justify-between p-7 sm:p-10 cursor-pointer group bg-[#ECEBE6] hover:bg-[#F4F3EE] transition-colors"
            >
              {/* Sequence Monospace Tag (001, 002, 003) & Script Highlight */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs tracking-[0.2em] font-mono font-bold text-[#111111]">
                  {item.num}
                </span>
                <span className="font-script text-lg text-[#C4823F] normal-case opacity-0 group-hover:opacity-100 transition-opacity">
                  Pur Extrait
                </span>
              </div>

              {/* Centered Sculptural Bottle Display */}
              <div className="py-10 sm:py-14 flex items-center justify-center min-h-[380px] sm:min-h-[440px] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="max-h-[320px] sm:max-h-[360px] w-auto object-contain transition-transform duration-500 group-hover:scale-[1.04] drop-shadow-md"
                />
              </div>

              {/* Card Bottom Meta (Title, Notes, Price) */}
              <div className="pt-4 flex items-start justify-between gap-4 border-t border-[#111111]/15">
                <div className="space-y-1.5 max-w-[280px]">
                  <h3 className="text-xs sm:text-[13px] font-extrabold tracking-[0.16em] uppercase text-[#111111] group-hover:text-[#C4823F] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-[#555555] leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-xs sm:text-[13px] font-mono font-bold tracking-wider text-[#111111] whitespace-nowrap">
                  {formatPrice(item.priceNumber, activeCurrency)}
                </div>
              </div>

            </div>
          ))}

        </div>
      </section>

      {/* =========================================================================
          3. EDITORIAL MANIFESTO SPLIT SECTION (Macro Still Life + Manifesto Block)
          ========================================================================= */}
      <section id="manifesto-section" className="w-full bg-[#ECEBE6] border-b border-[#111111] overflow-hidden">
        <div className="max-w-[1520px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
          
          {/* Left Column (lg:col-span-8): Macro Botanical Still Life */}
          <div className="lg:col-span-8 relative min-h-[460px] lg:min-h-full bg-[#111111] overflow-hidden">
            <img
              src="/images/saudagar_botanical_macro.jpg"
              alt="Saudagar Botanical Essence Ritual"
              className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.98]"
            />
          </div>

          {/* Right Column (lg:col-span-4): Manifesto & Vertical Typography */}
          <div className="lg:col-span-4 lg:border-l border-[#111111] p-8 sm:p-12 lg:p-14 flex flex-col justify-between bg-[#ECEBE6] relative">
            
            {/* Top Manifesto Statement */}
            <div className="space-y-6">
              <span className="font-script text-2xl sm:text-3xl text-[#C4823F] font-normal tracking-wide capitalize block">
                The Sacred Scent Ritual
              </span>

              <p className="text-[11px] sm:text-[11.5px] font-extrabold tracking-[0.05em] uppercase text-[#111111] leading-[1.65] text-justify select-none">
                WE BELIEVE SCENT IS NOT AN ACCESSORY BUT A PRESENCE THAT LIVES WITH YOU LONG AFTER THE MOMENT HAS PASSED. EACH ESSENCE IS EXTRACTED SLOWLY FROM ROOTS, BARK, LEAVES AND RESINS CHOSEN AT THEIR MOST EXPRESSIVE STAGE, DISTILLED WITH PRECISION AND PATIENCE TO PRESERVE THEIR NATURAL COMPLEXITY. OUR COMPOSITIONS ARE BUILT AROUND CONTRAST AND DEPTH, WHERE MINERAL DARKNESS MEETS GREEN LUMINOSITY AND WARM AMBER NOTES DISSOLVE INTO THE QUIET CLARITY OF WOOD. THIS IS NOT AN OIL AS DECORATION, BUT OIL AS ATMOSPHERE, AS MEMORY, AS RITUAL. A DAILY GESTURE THAT RECONNECTS THE BODY WITH THE LANDSCAPE IT ONCE BELONGED TO.
              </p>

              {/* SERIES Sub-heading */}
              <div className="pt-1">
                <span className="text-[10px] tracking-[0.24em] font-mono font-bold uppercase text-[#C4823F]">
                  SERIES I
                </span>
              </div>
            </div>

            {/* Middle: Giant Vertical Stylized Brand Typography */}
            <div className="my-8 hidden sm:flex items-center">
              <span className="font-sans font-black tracking-[0.28em] text-4xl sm:text-5xl uppercase text-[#111111] transform -rotate-90 origin-left translate-y-32 translate-x-4 select-none opacity-90">
                SAUDAGAR©
              </span>
            </div>

            {/* Bottom Right: Sleek Button */}
            <div className="pt-6 flex justify-end">
              <button
                onClick={() => {
                  const el = document.getElementById('essences-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else if (onExploreClick) onExploreClick();
                }}
                className="inline-flex items-center gap-3 bg-[#111111] hover:bg-[#C4823F] text-white text-[11px] font-bold tracking-[0.2em] uppercase px-7 py-3 transition-all shadow-md"
              >
                <span>EXPLORE</span>
                <span className="text-sm">→</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          4. THE OLFACTORY PYRAMID & SUSTAINED PURITY STRIP
          ========================================================================= */}
      <section className="w-full bg-[#F4F3EE] border-b border-[#111111] py-16 px-6 sm:px-12">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          
          <div className="space-y-3">
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#C4823F]">
              [01 / EXTRACTION]
            </span>
            <h4 className="text-sm font-bold tracking-[0.16em] uppercase text-[#111111]">
              Wild High-Altitude Botanicals
            </h4>
            <p className="text-xs text-[#555555] font-light leading-relaxed">
              Distilled in small batches in Al Fahidi, Dubai. Hand-picked resins and rare woods aged in glass demijohns for twelve moons to develop rich crystalline depth.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#C4823F]">
              [02 / CONCENTRATION]
            </span>
            <h4 className="text-sm font-bold tracking-[0.16em] uppercase text-[#111111]">
              38%–42% Pure Extrait
            </h4>
            <p className="text-xs text-[#555555] font-light leading-relaxed">
              Monumental longevity designed to intimately merge with individual skin chemistry, radiating 16+ hours of evocative warmth and mineral clarity.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#C4823F]">
              [03 / PACKAGING]
            </span>
            <h4 className="text-sm font-bold tracking-[0.16em] uppercase text-[#111111]">
              Sculptural Basalt Sphere
            </h4>
            <p className="text-xs text-[#555555] font-light leading-relaxed">
              Each flacon is topped with a hand-turned volcanic basalt stone orb, resting on thick architectural glass embossed with the Saudagar hallmark.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          5. MINIMALIST HIGH-FASHION FOOTER
          ========================================================================= */}
      <footer className="bg-[#111111] text-white pt-16 pb-12 px-6 sm:px-12">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-14 border-b border-white/15">
          
          <div className="md:col-span-5 space-y-4">
            <h3 className="font-extrabold tracking-[0.24em] text-xl sm:text-2xl uppercase">
              SAUDAGAR
            </h3>
            <p className="text-xs text-white/60 font-light max-w-sm leading-relaxed">
              Artisanal Haute Parfumerie from Dubai. Exploring the intersection of raw botanical nature, quiet luxury, and sacred daily ritual.
            </p>
            <div className="pt-2 text-[11px] font-mono tracking-widest text-[#D4AF37]">
              DUBAI · AL FAHIDI HISTORIC ATELIER
            </div>
          </div>

          <div className="md:col-span-3 space-y-3 text-xs tracking-wider uppercase font-medium">
            <h5 className="text-[10px] font-mono text-white/40 tracking-[0.2em]">COLLECTIONS</h5>
            <ul className="space-y-2 text-white/70">
              <li><button onClick={() => onSelectProduct('saudagar-deep-canopy')} className="hover:text-white">001 DEEP CANOPY</button></li>
              <li><button onClick={() => onSelectProduct('saudagar-amber-bark')} className="hover:text-white">002 AMBER BARK</button></li>
              <li><button onClick={() => onSelectProduct('saudagar-obsidian-root')} className="hover:text-white">003 OBSIDIAN ROOT</button></li>
              <li><button onClick={() => onSelectProduct('saudagar-pacific-chill')} className="hover:text-white">NOBLE COLLECTION</button></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3 text-xs tracking-wider uppercase font-medium">
            <h5 className="text-[10px] font-mono text-white/40 tracking-[0.2em]">CLIENT CONCIERGE</h5>
            <div className="space-y-2 text-white/70 text-[11px] normal-case font-light leading-relaxed">
              <p>Private consultations and custom flacon engraving:</p>
              <p className="font-mono text-white">concierge@saudagarperfumes.com</p>
              <p className="font-mono text-white">WhatsApp: +971 54 247 7037</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="max-w-[1400px] mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono tracking-widest text-white/40">
          <div>© 2026 SAUDAGAR PERFUMES. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <span>TERMS</span>
            <span>PRIVACY</span>
            <span>SUSTAINABILITY</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
