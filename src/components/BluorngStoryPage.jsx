import React from 'react';
import { motion } from 'framer-motion';

export default function BluorngStoryPage({
  theme = 'light',
  onToggleTheme,
  onNavigateHome,
  onNavigateCollection
}) {
  const chapters = [
    {
      year: '1988',
      title: 'The Whisper of Old Dubai',
      subtitle: 'Genesis in Al Fahidi',
      body: 'In the wind-tower alcoves along Dubai Creek, the first Saudagar alembics were stoked with fragrant hardwood embers. The founder blended attars not for commercial shelves, but for Gulf dignitaries seeking private olfactory signatures. The name "Saudagar"—the ancient Persian-Arabian word for the noble merchant-connoisseur—honored those who braved distant silk and maritime routes to trade the Earth’s most precious resins.'
    },
    {
      year: '2004',
      title: 'The Aged Cambodi Barrel',
      subtitle: 'Uncompromising Botanical Sourcing',
      body: 'While commercial perfumery turned toward synthetic shortcuts and fast production, Saudagar committed to generational patience. We acquired a legendary reserve of 1986 harvest wild Cambodian agarwood (*Aquilaria crassna*)—dense, resinous wood aged in glass demijohns. This single barrel established our non-negotiable benchmark: zero synthetic fillers, zero water dilution, and minimum 38% to 46% pure oil concentration.'
    },
    {
      year: '2016',
      title: 'The Flagship Atelier',
      subtitle: 'From Private Salon to Architectural Maison',
      body: 'Saudagar opened its private tasting salon in Dubai, welcoming heads of state, artists, and discerning collectors. Every flacon was conceived as liquid architecture: heavyweight lead-free crystal with hand-knurled brass caps and personalized plaques engraved by master calligraphers. A bespoke commission became an enduring personal heirloom.'
    },
    {
      year: '2022',
      title: 'Global Connoisseur Dispatches',
      subtitle: 'Worldwide Cold-Chain Logistics',
      body: 'Recognizing that delicate high-concentration botanicals degrade under prolonged heat and airport transit, Saudagar instituted insured, temperature-regulated air courier shipping directly from our Dubai laboratory to collectors in London, Paris, Tokyo, Mumbai, and New York within 48 to 72 hours.'
    },
    {
      year: 'Today',
      title: 'The Modern Extraits',
      subtitle: 'Over 50,000 Flacons Hand-Crafted',
      body: 'Today, our creations—from the smoky depths of Thunderstruck Pure Oud to the mineral petrichor of Deep Canopy and the solar warmth of Amber Bark—stand as benchmarks of artisanal niche perfumery. Each flacon rests for up to 365 days of slow maceration, engineered to become your personal legend.'
    }
  ];

  const tenets = [
    {
      num: '01',
      title: 'Pure Extrait Standard',
      desc: 'Formulated at 38% to 46% pure oil concentration. We reject industrial eau de toilette dilutions. A single application radiates with room-filling presence for 14+ hours.'
    },
    {
      num: '02',
      title: 'Single-Source Wild Botanicals',
      desc: 'Wild-harvested Cambodian agarwood, dawn-picked Taif Damask roses from high Saudi plateaus, and vintage Mysore sandalwood heartwood aged for over a decade.'
    },
    {
      num: '03',
      title: '365-Day Slow Maceration',
      desc: 'Time is our primary solvent. Oils rest undisturbed in dark temperature-controlled chambers until the complex botanical esters harmonize into a seamless symphony.'
    },
    {
      num: '04',
      title: 'Heirloom Crystal & Brass',
      desc: 'Optically pure crystal flacons crowned with a 120g solid knurled brass cap.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-tk-night text-tk-ink dark:text-white transition-colors duration-300 font-sans pb-32 select-none">
      
      {/* ============================================================== */}
      {/* ================= 1. MINIMAL CLEAN HEADER ==================== */}
      {/* ============================================================== */}
      <header className="w-full border-b border-[#F0F0F0] dark:border-white/10 bg-white/90 dark:bg-tk-night/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          
          <button
            onClick={onNavigateHome}
            className="text-[11px] uppercase tracking-[0.18em] text-[#777777] hover:text-tk-ink dark:text-[#999999] dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>←</span>
            <span>Boutique</span>
          </button>

          <button onClick={onNavigateHome} className="cursor-pointer" aria-label="Saudagar Home">
            <img
              src="/images/saudagar_logo_black.png"
              alt="Saudagar Perfumers"
              className="h-6 w-auto object-contain dark:hidden block"
            />
            <img
              src="/images/saudagar_logo_gold.png"
              alt="Saudagar Perfumers"
              className="h-6 w-auto object-contain hidden dark:block"
            />
          </button>

          <div className="flex items-center gap-4">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="text-[11px] uppercase tracking-wider text-[#777777] dark:text-[#999999] hover:text-tk-ink dark:hover:text-white transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* ================= 2. EDITORIAL HERO ========================== */}
      {/* ============================================================== */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pt-16 sm:pt-24 pb-16 text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <span className="text-[10.5px] uppercase tracking-[0.28em] text-tk-accent dark:text-tk-accent-night font-medium block">
            Maison Saudagar · Established in Dubai
          </span>

          <h1 className="text-[34px] sm:text-[48px] md:text-[56px] font-normal tracking-[-0.02em] text-tk-ink dark:text-white leading-[1.08] max-w-3xl mx-auto">
            Born in the Alleys of Al Fahidi, Destined for the World.
          </h1>

          <p className="text-[13.5px] sm:text-[15px] text-[#666666] dark:text-[#AAAAAA] max-w-2xl mx-auto font-light leading-relaxed pt-2">
            The complete chronicle of an artisanal sanctuary dedicated to pure botanical extraits, ancient Cambodian agarwood reserves, and generational perfumery craft.
          </p>
        </motion.div>

        {/* Cinematic Atelier Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-14 relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-[2px] overflow-hidden bg-[#FAFAFA] dark:bg-white/5 border border-[#F0F0F0] dark:border-white/10"
        >
          <img
            src="/images/brand_story.jpg"
            alt="Saudagar Master Perfumer in Dubai Atelier"
            className="w-full h-full object-cover object-center filter brightness-[0.92] dark:brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-5 left-6 right-6 text-left text-white">
            <span className="text-[9.5px] uppercase tracking-[0.2em] text-tk-accent-night block">
              The Maceration Chambers · Dubai Atelier
            </span>
            <span className="text-[12px] text-white/80 font-light">
              Where raw resins rest for up to 365 days in darkness.
            </span>
          </div>
        </motion.div>

      </section>

      {/* ============================================================== */}
      {/* ================= 3. THE BRAND TENETS ======================== */}
      {/* ============================================================== */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 py-16 border-t border-[#F0F0F0] dark:border-white/10">
        
        <div className="mb-12">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#888888] font-medium block mb-1">
            Our Creed
          </span>
          <h2 className="text-[24px] sm:text-[30px] font-normal tracking-[-0.015em] text-tk-ink dark:text-white">
            The Pillars of Saudagar Haute Parfumerie
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
          {tenets.map((t) => (
            <div key={t.num} className="space-y-2.5">
              <span className="font-mono text-[13px] text-tk-accent dark:text-tk-accent-night block">
                {t.num}
              </span>
              <h3 className="text-[16px] font-medium text-tk-ink dark:text-white">
                {t.title}
              </h3>
              <p className="text-[13px] text-[#666666] dark:text-[#AAAAAA] leading-relaxed font-light">
                {t.desc}
              </p>
            </div>
          ))}
        </div>

      </section>

      {/* ============================================================== */}
      {/* ================= 4. THE COMPLETE JOURNEY (TIMELINE) ========= */}
      {/* ============================================================== */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 py-16 border-t border-[#F0F0F0] dark:border-white/10">
        
        <div className="mb-14">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#888888] font-medium block mb-1">
            Chronology
          </span>
          <h2 className="text-[24px] sm:text-[30px] font-normal tracking-[-0.015em] text-tk-ink dark:text-white">
            How The House Started &amp; Established
          </h2>
          <p className="text-[13px] text-[#777777] dark:text-[#999999] mt-1 font-light max-w-xl">
            A continuous arc of uncompromising patience, artisanal extraction, and international recognition.
          </p>
        </div>

        {/* Minimal Clean Timeline */}
        <div className="space-y-12 sm:space-y-16 relative before:absolute before:left-3 sm:before:left-5 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#EAEAEA] dark:before:bg-white/10">
          {chapters.map((ch, idx) => (
            <div key={idx} className="relative pl-9 sm:pl-14 space-y-2">
              
              {/* Dot marker */}
              <div className="absolute left-2 sm:left-4 top-1.5 w-2.5 h-2.5 -translate-x-1/2 rounded-full bg-tk-ink dark:bg-tk-accent-night ring-4 ring-white dark:ring-tk-night" />

              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-[14px] font-medium text-tk-accent dark:text-tk-accent-night">
                  {ch.year}
                </span>
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#888888] dark:text-[#777777]">
                  {ch.subtitle}
                </span>
              </div>

              <h3 className="text-[19px] sm:text-[22px] font-normal tracking-[-0.01em] text-tk-ink dark:text-white">
                {ch.title}
              </h3>

              <p className="text-[13.5px] text-[#555555] dark:text-[#CCCCCC] leading-relaxed font-light max-w-2xl pt-1">
                {ch.body}
              </p>
            </div>
          ))}
        </div>

      </section>

      {/* ============================================================== */}
      {/* ================= 5. BOTANICAL CRAFT VISUALS ================= */}
      {/* ============================================================== */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 py-16 border-t border-[#F0F0F0] dark:border-white/10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          <div className="relative aspect-[4/3] rounded-[2px] overflow-hidden bg-[#FAFAFA] dark:bg-white/5 border border-[#F0F0F0] dark:border-white/10">
            <img
              src="/images/ingredients.jpg"
              alt="Raw Botanical Resins and Agarwood Chips"
              className="w-full h-full object-cover filter brightness-[0.95] dark:brightness-[0.9]"
            />
            <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-wider text-white/90 bg-black/60 px-2 py-0.5 rounded-[1px] backdrop-blur-xs">
              Raw Agarwood &amp; Natural Resins
            </div>
          </div>

          <div className="space-y-4 sm:pl-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-tk-accent dark:text-tk-accent-night font-medium block">
              The Botanical Terroir
            </span>
            <h2 className="text-[22px] sm:text-[28px] font-normal tracking-[-0.015em] leading-tight">
              Sourced directly from the harvest origin.
            </h2>
            <p className="text-[13px] text-[#666666] dark:text-[#AAAAAA] leading-relaxed font-light">
              Every drop of oil is tracked to its geographical terroir. We work exclusively with certified family distillers in Assam, Cambodia, and Taif who harvest botanicals according to moon cycles and seasonal rain patterns, preserving the micro-molecular vitality of the plants.
            </p>
            <div className="pt-2">
              <span className="text-[11.5px] font-serif italic text-[#888888] dark:text-[#777777]">
                &ldquo;A fragrance is only as honest as the soil from which its resins were drawn.&rdquo;
              </span>
            </div>
          </div>

        </div>

      </section>

      {/* ============================================================== */}
      {/* ================= 6. MINIMAL CLOSING & CTA =================== */}
      {/* ============================================================== */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 pt-16 text-center space-y-6">
        
        <div className="w-8 h-[1px] bg-tk-accent dark:bg-tk-accent-night mx-auto" />

        <p className="font-serif italic text-[18px] sm:text-[22px] text-[#222222] dark:text-white/90 leading-relaxed max-w-xl mx-auto">
          &ldquo;A Saudagar creation is never worn to be noticed; it is worn to be remembered.&rdquo;
        </p>

        <span className="text-[11px] uppercase tracking-[0.22em] text-[#888888] block">
          The Master Perfumer · Dubai Atelier
        </span>

        <div className="pt-4 flex items-center justify-center gap-4">
          <button
            onClick={() => onNavigateCollection('all')}
            className="px-8 py-3.5 bg-tk-ink hover:bg-tk-accent text-white dark:bg-tk-gold dark:hover:bg-tk-accent-night dark:text-tk-night text-[11px] uppercase tracking-[0.16em] font-medium rounded-[2px] shadow-sm transition-all cursor-pointer"
          >
            Explore The Extraits
          </button>
        </div>

      </section>

    </div>
  );
}

