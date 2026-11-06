import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../data/bluorngSaudagarData.js';

export default function CollectionBentoSection({
  theme,
  featuredProduct,
  activeCurrency = 'INR',
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy
}) {
  if (!featuredProduct) return null;

  const [isHovered, setIsHovered] = useState(false);
  const isWish = wishlist.includes(featuredProduct.id);
  const image = featuredProduct.images?.[0] || featuredProduct.image || '/images/crystal_square_flacon.png';

  // Editorial monographs tailored by collection
  const monographs = {
    signature: {
      quote: '“True authority speaks in whispers. Formulated with 40-year Mysore santal and aged champagne amber resins.”',
      terroir: 'ATELIER SAUDAGAR · MYSORE & GRASSE',
      terroirImage: '/images/ingredients.jpg'
    },
    royal: {
      quote: '“Sacred damask roses harvested at dawn in high Taif, macerated with 40-year wild Assam agarwood for royal courts.”',
      terroir: 'ROYAL ALEMBICS · TAIF & ASSAM',
      terroirImage: '/images/saudagar_imperial_ruby.png'
    },
    exotic: {
      quote: '“Primal volcanic flint, crushed needles of mountain cypress, and cold rain accords captured in midnight extraits.”',
      terroir: 'WILD SANCTUARIES · VOLCANIC FRONTIERS',
      terroirImage: '/images/saudagar_noir_matte.png'
    },
    fresh: {
      quote: '“Sun-bleached coastal cedar, oceanic saline spray, and radiant Calabrian bergamot infused with sea breezes.”',
      terroir: 'MEDITERRANEAN COAST · CALABRIA & RIVIERA',
      terroirImage: '/images/saudagar_royal_sapphire.png'
    }
  };

  const activeMonograph = monographs[theme.id] || monographs.signature;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 my-8 sm:my-12 select-none">
      
      {/* Editorial Bento Header */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#888888] dark:text-[#A09D96] font-medium block mb-1">
          02 / Editorial Archive & Monograph
        </span>
        <h2 className="text-[20px] sm:text-[24px] font-normal uppercase tracking-[0.02em] text-[#111111] dark:text-white">
          {theme.shortName} Curated Spotlight
        </h2>
      </div>

      {/* 4-Tile Bento Grid (Completely Borderless & Lineless) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* ================= BENTO 1: CROWN FLACON SPOTLIGHT (Spans 2 Cols) ================= */}
        <div
          onClick={() => onSelectProduct(featuredProduct.id)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="md:col-span-2 rounded-2xl bg-[#F8F7F5] dark:bg-[#141318] hover:bg-[#F2EFEA] dark:hover:bg-[#1C1A22] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
        >
          {/* Flacon Stage */}
          <div className="w-full sm:w-1/2 aspect-square flex items-center justify-center relative">
            <div className="absolute top-0 left-0">
              <span className="text-[9.5px] uppercase tracking-[0.18em] font-medium text-[#C4823F] dark:text-[#ECC86A]">
                Crown Flacon
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(featuredProduct.id);
              }}
              className="absolute top-0 right-0 w-7 h-7 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-[#111111] dark:text-white flex items-center justify-center transition-colors"
              aria-label="Wishlist"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                className={isWish ? 'text-[#C4823F] dark:text-[#ECC86A]' : 'text-[#111111] dark:text-white'}
                fill={isWish ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>

            <img
              src={image}
              alt={featuredProduct.name}
              className="max-h-[220px] object-contain filter drop-shadow-[0_14px_24px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          </div>

          {/* Typography & Actions */}
          <div className="w-full sm:w-1/2 flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] uppercase tracking-widest text-[#888888] dark:text-[#A09D96] font-normal block mb-1">
                {featuredProduct.concentration || 'Extrait de Parfum · 38%'}
              </span>
              <h3 className="text-[18px] sm:text-[22px] font-normal uppercase tracking-[0.02em] text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] transition-colors leading-snug">
                {featuredProduct.name}
              </h3>
              <p className="text-[11.5px] text-[#666666] dark:text-[#B3AFA8] font-light leading-relaxed mt-2 line-clamp-3">
                {featuredProduct.description}
              </p>
              <div className="mt-3">
                <span className="text-[10px] uppercase tracking-widest text-[#999999] dark:text-[#A09D96] block mb-0.5">Key Accords</span>
                <span className="text-[11.5px] italic font-serif text-[#333333] dark:text-[#EFECE6]">
                  {featuredProduct.notes?.heart?.slice(0, 3).join(' · ') || 'Cambodi Oud · Taif Damask Rose'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-6 pt-4">
              <div>
                <span className="text-[9.5px] text-[#888888] dark:text-[#A09D96] uppercase tracking-wider block">Atelier Flacon</span>
                <span className="text-[18px] font-medium text-[#111111] dark:text-white">
                  {formatPrice(featuredProduct.price, activeCurrency)}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickBuy(featuredProduct);
                }}
                className="px-5 py-2 rounded-full bg-[#111111] hover:bg-[#C4823F] dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] text-white dark:text-[#0B0A0D] text-[10.5px] uppercase tracking-wider font-medium transition-all duration-300 cursor-pointer shadow-sm"
              >
                + Quick Buy
              </button>
            </div>
          </div>
        </div>

        {/* ================= BENTO 2: BOTANICAL TERROIR & MONOGRAPH (1 Col) ================= */}
        <div className="rounded-2xl bg-[#141312] text-white p-6 sm:p-7 flex flex-col justify-between overflow-hidden relative group min-h-[320px] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="absolute inset-0 z-0">
            <img
              src={activeMonograph.terroirImage}
              alt=""
              className="w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-1000 ease-out filter brightness-90"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141312] via-[#141312]/70 to-transparent" />
          </div>

          <div className="relative z-10">
            <span className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-[#C4823F] dark:text-[#ECC86A]">
              Botanical Terroir
            </span>
          </div>

          <div className="relative z-10 space-y-3">
            <blockquote className="text-[14.5px] sm:text-[16px] font-serif italic text-white/95 leading-relaxed">
              {activeMonograph.quote}
            </blockquote>
            <span className="text-[9px] uppercase tracking-[0.18em] text-[#999080] block font-mono">
              {activeMonograph.terroir}
            </span>
          </div>
        </div>

        {/* ================= BENTO 3: DISCOVERY SET PRIVILEGE (1 Col) ================= */}
        <div
          onClick={() => onSelectProduct('saudagar-masterpiece-coffret')}
          className="rounded-2xl bg-[#F8F7F5] dark:bg-[#141318] hover:bg-[#F2EFEA] dark:hover:bg-[#1C1A22] p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] min-h-[320px]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9.5px] uppercase tracking-[0.2em] font-medium text-[#C4823F] dark:text-[#ECC86A]">
                Privilege
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#111111] dark:text-white bg-white dark:bg-white/10 px-2 py-0.5 rounded-full">
                6 × 10ML
              </span>
            </div>

            <h4 className="text-[16px] font-normal uppercase tracking-wide text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] transition-colors leading-snug">
              Discovery Coffret Privilege
            </h4>
            <p className="text-[11px] text-[#666666] dark:text-[#B3AFA8] font-light mt-1.5 leading-relaxed">
              Every full flacon purchase includes our curated coffret and a redeemable voucher.
            </p>
          </div>

          <div className="my-3 aspect-[4/3] flex items-center justify-center overflow-hidden">
            <img
              src="/images/saudagar_crystal_diamond.png"
              alt="Discovery Coffret"
              className="max-h-[110px] object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)] group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>

          <div>
            <span className="text-[10.5px] uppercase tracking-wider font-medium text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] transition-colors flex items-center gap-1.5">
              <span>View Discovery Sets</span>
              <span>→</span>
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
