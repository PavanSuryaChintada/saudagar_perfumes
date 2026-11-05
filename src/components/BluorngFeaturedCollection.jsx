import React from 'react';
import BluorngProductCard from './BluorngProductCard.jsx';
import { ALL_PRODUCTS } from '../data/bluorngSaudagarData.js';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

export default function BluorngFeaturedCollection({
  activeCurrency,
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  onDiscoverMore
}) {
  // First 8 products for Latest Drop
  const latestProducts = ALL_PRODUCTS.slice(0, 8);

  return (
    <section className="relative w-full bg-[#FFFFFF] dark:bg-[#0B0A0D] py-14 sm:py-20 overflow-hidden select-none transition-colors duration-300">
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        
        {/* ================= EDITORIAL SECTION HEADER (Borderless, Minimal) ================= */}
        <ScrollReveal variant="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#888888] dark:text-white/50 font-medium block mb-1">
              Edition 2026 · Latest Drop
            </span>
            <h2 className="text-[22px] sm:text-[28px] font-normal uppercase tracking-[0.03em] text-[#111111] dark:text-white leading-tight">
              Featured Flacons
            </h2>
            <p className="text-[12px] text-[#777777] dark:text-white/60 tracking-wide mt-1.5 font-normal max-w-lg">
              Freshly compounded artisanal extraits with rare distillations from Assam, Taif, and Grasse.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] font-normal text-[#999999] dark:text-white/40 uppercase tracking-wider hidden md:inline">
              08 Formulations
            </span>
            <button
              onClick={onDiscoverMore}
              className="text-[11px] sm:text-[12px] font-normal tracking-[0.08em] uppercase text-[#111111] dark:text-white hover:text-[#B8860B] dark:hover:text-[#ECC86A] transition-colors flex items-center gap-1.5 group cursor-pointer"
            >
              <span>Discover all drops</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-300 text-[13px]">→</span>
            </button>
          </div>
        </ScrollReveal>

        {/* 4-Col Desktop, 2-Col Mobile Product Grid (Borderless & Lineless) */}
        <StaggerContainer staggerDelay={0.05} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {latestProducts.map((product) => (
            <StaggerItem key={product.id}>
              <BluorngProductCard
                product={product}
                activeCurrency={activeCurrency}
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onSelectProduct={onSelectProduct}
                onQuickBuy={onQuickBuy}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
