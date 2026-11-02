import React, { useState, useEffect } from 'react';

export default function Hero({ onExploreClick, onCreateClick }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      tagline: 'OFFICIAL ONLINE STORE · DUBAI',
      title: 'CRAFTED FOR YOUR STORY',
      description: 'SAUDAGAR PERFUMES is a luxury artisanal fragrance house offering bespoke custom perfumes, rare oriental extraits & personalized scents crafted to match your style, story & inspiration.',
      bgImage: '/images/hero_gold_flacons.jpg',
      primaryBtn: 'EXPLORE PERFUMES',
      primaryAction: () => {
        const el = document.getElementById('fragrance-week-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      secondaryBtn: 'CREATE YOUR OWN',
      secondaryAction: () => {
        const el = document.getElementById('create-fragrance-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      id: 2,
      tagline: 'NEW LAUNCH 2026',
      title: 'SIP AND SCENT',
      description: 'An artisanal cocktail quartet: Pina Colada, Coco Freeze, Blood Orange Spritz, and Chocolate Martini in black lacquer and cut crystal flacons.',
      bgImage: '/images/sip_and_scent_banner.jpg',
      primaryBtn: 'DISCOVER SIP & SCENT',
      primaryAction: () => {
        const el = document.getElementById('sip-scent-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      secondaryBtn: 'VIEW INSPIRATIONS',
      secondaryAction: () => {
        const el = document.getElementById('perfumes-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      id: 3,
      tagline: 'EXCLUSIVE NOBLE ATELIER',
      title: 'THE NOBLE COLLECTION',
      description: 'Passio, Pragma, Devoir Elixir & Ardor. Handcrafted with rare botanical absolutes, aged sandalwood, and wild Arabian agarwood resins.',
      bgImage: '/images/noble_collection_hotspots.jpg',
      primaryBtn: 'EXPLORE NOBLE',
      primaryAction: () => {
        const el = document.getElementById('noble-collection-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      secondaryBtn: 'BESPOKE ATELIER',
      secondaryAction: () => {
        const el = document.getElementById('perfumer-story-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  ];

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <section className="relative w-full h-[85vh] sm:h-[90vh] min-h-[580px] max-h-[920px] overflow-hidden bg-[#0A0A0C] text-white select-none border-b border-[#D4AF37]/25">
      {/* Background Image Slides with Smooth Crossfade */}
      {slides.map((s, idx) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          } transform transition-transform duration-[7000ms]`}
        >
          <img
            src={s.bgImage}
            alt={s.title}
            className="w-full h-full object-cover object-center"
          />
          {/* Obsidian dark vignette with gold ambient gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-black/55 to-black/35" />
        </div>
      ))}

      {/* Hero Content Overlay */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-16 sm:pb-24">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-[#D4AF37] font-semibold mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            {slide.tagline}
          </p>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-light tracking-[0.18em] uppercase text-white leading-[1.1] mb-4 font-sans">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-white/80 tracking-[0.04em] font-light leading-relaxed mb-8 max-w-xl">
            {slide.description}
          </p>

          {/* Action Buttons in Black & Gold */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={slide.primaryAction}
              className="bg-[#D4AF37] text-[#0A0A0C] hover:bg-[#ECC86A] text-xs font-bold uppercase tracking-[0.2em] px-8 py-3.5 transition-all duration-300 shadow-xl hover:-translate-y-0.5"
            >
              {slide.primaryBtn}
            </button>

            <button
              onClick={slide.secondaryAction}
              className="bg-transparent text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0C] border border-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] px-8 py-3.5 transition-all duration-300"
            >
              {slide.secondaryBtn}
            </button>
          </div>
        </div>

        {/* Slide Indicators & Navigation Arrows */}
        <div className="flex items-center justify-between pt-10 border-t border-[#D4AF37]/20 mt-8">
          {/* Slide Indicator Bars */}
          <div className="flex items-center gap-2.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1 transition-all duration-500 rounded-full ${
                  idx === currentSlide ? 'w-10 bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]' : 'w-4 bg-white/20 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Arrow navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length)}
              className="w-10 h-10 border border-[#D4AF37]/40 hover:border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center justify-center transition-colors rounded-xs"
              aria-label="Previous slide"
            >
              <svg width="14" height="14" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11 1 3 9l8 8" />
              </svg>
            </button>

            <button
              onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)}
              className="w-10 h-10 border border-[#D4AF37]/40 hover:border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center justify-center transition-colors rounded-xs"
              aria-label="Next slide"
            >
              <svg width="14" height="14" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="m5 17 8-8-8-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
