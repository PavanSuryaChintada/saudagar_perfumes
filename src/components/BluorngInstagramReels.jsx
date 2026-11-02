import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../data/bluorngSaudagarData.js';
import ScrollReveal from './motion/ScrollReveal.jsx';

export const INSTAGRAM_REELS = [
  {
    id: 'reel-1',
    storyIdx: 0,
    title: 'The Unboxing Ritual: Thunderstruck Oud Extrait',
    views: '148K',
    likes: '14.2K',
    audio: 'Original Audio · Saudagar Soundscape',
    image: '/images/saudagar_amber_gold.png',
    productId: 'saudagar-thunderstruck-oud',
    productName: 'Thunderstruck Pure Oud',
    price: 5500,
    tag: '#HauteParfumerie'
  },
  {
    id: 'reel-2',
    storyIdx: 1,
    title: 'Harvesting Rare Taif Roses at Dawn in Saudi Arabia',
    views: '92K',
    likes: '9.8K',
    audio: 'Acoustic Oud & Ambient Sillage',
    image: '/images/saudagar_imperial_ruby.png',
    productId: 'saudagar-oud-roses',
    productName: 'Oud & Taif Roses Extrait',
    price: 6800,
    tag: '#BotanicalAlchemy'
  },
  {
    id: 'reel-3',
    storyIdx: 2,
    title: '18-Year Aged Cambodi Oud Oil Distillation in Assam',
    views: '215K',
    likes: '22.4K',
    audio: 'Atelier Artisan Notes',
    image: '/images/saudagar_noir_matte.png',
    productId: 'saudagar-deep-canopy',
    productName: '001 Deep Canopy Extrait',
    price: 6600,
    tag: '#RoyalOud'
  },
  {
    id: 'reel-4',
    storyIdx: 3,
    title: 'The 6-Flacon Discovery Coffret: Six Iconic Extraits',
    views: '310K',
    likes: '31.1K',
    audio: 'Saudagar Masterwork Discovery',
    image: '/images/saudagar_crystal_diamond.png',
    productId: 'saudagar-masterpiece-coffret',
    productName: 'Discovery Coffret Set',
    price: 4500,
    tag: '#GiftingSeason'
  },
  {
    id: 'reel-5',
    storyIdx: 4,
    title: 'How to Layer Pure Royal Attars for 24-Hour Projection',
    views: '176K',
    likes: '18.5K',
    audio: 'Pure Sandalwood Alchemy',
    image: '/images/saudagar_royal_sapphire.png',
    productId: 'saudagar-pacific-chill',
    productName: 'Pacific Coast Aquatic',
    price: 4999,
    tag: '#ArtisanalAttar'
  },
  {
    id: 'reel-6',
    storyIdx: 0,
    title: 'Heavy Crystal Flacons Hand-Cut in Val-de-Sambre',
    views: '124K',
    likes: '11.7K',
    audio: 'Couture Crystal Craftsmanship',
    image: '/images/saudagar_noir_matte.png',
    productId: 'saudagar-obsidian-root',
    productName: 'Obsidian Root Agarwood',
    price: 6600,
    tag: '#CrystalFlacon'
  }
];

export default function BluorngInstagramReels({
  activeCurrency = 'INR',
  onSelectProduct,
  onQuickBuy,
  onOpenStory
}) {
  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  return (
    <section id="instagram-reels-section" className="w-full bg-[#FFFFFF] py-14 sm:py-20 border-b border-[#EEEEEE] select-none">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10">
        
        {/* ================= HEADER ZONE ================= */}
        {/* ================= SECTION HEADER ================= */}
        <ScrollReveal variant="fade-up" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            {/* Instagram Eyebrow Pill */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#FD1D1D] via-[#F56040] to-[#833AB4] flex items-center justify-center text-white shadow-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </span>
              <span className="text-[11px] font-bold tracking-[0.24em] uppercase text-[#111111]">
                @SAUDAGARPERFUMES
              </span>
              <span className="text-[10px] text-[#888888] font-medium tracking-wider uppercase hidden sm:inline">
                · 142K COMMUNITY
              </span>
            </div>

            <h2 className="text-[22px] sm:text-[30px] font-black uppercase tracking-[0.12em] text-[#111111] leading-tight">
              COMMUNITY & ATELIER REELS
            </h2>
            <p className="text-[12px] text-[#666666] tracking-wide mt-1 max-w-xl font-normal">
              Go behind the velvet curtain. Rare harvest distillations, crystal flacon unboxings, and bespoke layering rituals.
            </p>
          </div>

          {/* Right Action & Controls */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#C4823F] text-white text-[11px] font-bold uppercase tracking-wider rounded-xs transition-colors shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Follow on Instagram</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17l9.2-9.2M17 17V8H8" />
              </svg>
            </a>

            {/* Slider Navigation Buttons */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={scrollLeft}
                className="w-9 h-9 rounded-xs border border-black/15 hover:border-black flex items-center justify-center text-[#111111] hover:bg-black/5 transition-all cursor-pointer active:scale-95"
                aria-label="Scroll reels left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={scrollRight}
                className="w-9 h-9 rounded-xs border border-black/15 hover:border-black flex items-center justify-center text-[#111111] hover:bg-black/5 transition-all cursor-pointer active:scale-95"
                aria-label="Scroll reels right"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* ================= REELS CAROUSEL ================= */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
        >
          {INSTAGRAM_REELS.map((reel) => (
            <motion.div
              key={reel.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex-none w-[260px] sm:w-[290px] aspect-[9/16] rounded-sm overflow-hidden bg-[#0F0F12] group snap-start cursor-pointer border border-black/5 shadow-md hover:shadow-2xl transition-shadow duration-300 will-change-transform"
              onClick={() => {
                if (onOpenStory) onOpenStory();
              }}
            >
              {/* Reel Image Background */}
              <img
                src={reel.image}
                alt={reel.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-[0.92]"
                loading="lazy"
              />

              {/* Gradient Scrim Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/40 pointer-events-none" />

              {/* Top Bar inside Reel */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between text-white z-10 pointer-events-none">
                {/* Reels Icon & Tag */}
                <div className="flex items-center gap-1.5 text-white/95 text-[10px] font-bold tracking-wider uppercase drop-shadow">
                  {/* Instagram Reels Slate Icon */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="2" y="2" width="20" height="20" rx="2"></rect>
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon>
                  </svg>
                  <span>Reel</span>
                </div>

                {/* View Count */}
                <div className="flex items-center gap-1 text-[10.5px] font-medium text-white/90 drop-shadow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>{reel.views}</span>
                </div>
              </div>

              {/* Center Play Button on Hover */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-12 h-12 rounded-xs bg-black/60 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-2xl transform scale-90 opacity-80 group-hover:scale-105 group-hover:opacity-100 group-hover:bg-[#C4823F] group-hover:border-[#C4823F] transition-all duration-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="8 5 19 12 8 19 8 5" />
                  </svg>
                </div>
              </div>

              {/* Bottom Content Area */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex flex-col gap-2">
                
                {/* Audio snippet */}
                <div className="flex items-center gap-1.5 text-[9.5px] text-white/75 truncate font-light">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  <span className="truncate">{reel.audio}</span>
                </div>

                {/* Caption / Title */}
                <p className="text-[12px] font-medium text-white line-clamp-2 leading-snug drop-shadow-sm group-hover:text-white/95">
                  {reel.title}
                </p>

                {/* Tagged Product (Direct e-commerce integration) */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectProduct) onSelectProduct(reel.productId);
                  }}
                  className="mt-1 flex items-center justify-between gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border-l-2 border-[#C4823F] px-2.5 py-1.5 text-white transition-all cursor-pointer"
                  title="View Fragrance"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                    </svg>
                    <span className="text-[10px] font-bold tracking-wider uppercase truncate">
                      {reel.productName}
                    </span>
                  </div>

                  <span className="text-[10px] font-black text-[#FFD188] whitespace-nowrap">
                    {formatPrice(reel.price, activeCurrency)}
                  </span>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Social Banner Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-black/5 text-[11px] text-[#777777]">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#111111] uppercase tracking-wider">
              Trending Fragrance Tags:
            </span>
            <span className="text-[#C4823F] font-medium">#SaudagarOud</span>
            <span>·</span>
            <span className="text-[#C4823F] font-medium">#HauteParfumerie</span>
            <span>·</span>
            <span className="text-[#C4823F] font-medium">#ExtraitDeParfum</span>
            <span>·</span>
            <span className="text-[#C4823F] font-medium">#CambodiOud</span>
          </div>

          <button
            onClick={() => {
              if (onOpenStory) onOpenStory();
            }}
            className="text-[#111111] hover:text-[#C4823F] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Watch All Stories</span>
            <span>→</span>
          </button>
        </div>

      </div>
    </section>
  );
}
