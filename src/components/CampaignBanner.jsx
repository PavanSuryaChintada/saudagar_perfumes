import React from 'react';

export default function CampaignBanner({ onExplore }) {
  return (
    <section className="relative w-full py-28 sm:py-36 overflow-hidden bg-[#0A0A0C] text-white border-b border-tk-gold/25">
      {/* Background Image with Dark Luxury Overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/bottom_black_podium.jpg"
          alt="The High Notes"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-tk-gold font-semibold mb-3">
          HAUTE PARFUMERIE EDITORIAL
        </p>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-[0.2em] uppercase text-white mb-6 font-sans">
          The High Notes
        </h2>

        <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed max-w-xl mx-auto mb-8 tracking-[0.06em]">
          Elevated olfactory compositions where volatile top notes of Calabrian bergamot and Kashmiri saffron harmonize seamlessly with mature Assam oud.
        </p>

        <button
          onClick={onExplore}
          className="bg-tk-gold text-[#0A0A0C] hover:bg-tk-accent-night text-xs font-bold uppercase tracking-[0.22em] px-10 py-3.5 transition-all duration-300 shadow-2xl hover:-translate-y-0.5"
        >
          Explore
        </button>
      </div>
    </section>
  );
}
