import React from 'react';
import BluorngProductCard from './BluorngProductCard.jsx';
import { ALL_PRODUCTS } from '../data/bluorngSaudagarData.js';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

export default function BluorngCustomExclusive({
  activeCurrency,
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  onDiscoverMore
}) {
  // Discovery Coffrets & Exclusive sets
  const exclusiveProducts = ALL_PRODUCTS.filter(
    (p) => p.collection === 'Exclusive Coffrets'
  );

  return (
    <section className="relative w-full bg-[#FFFFFF] dark:bg-[#121114] py-16 sm:py-24 text-[#111111] dark:text-white overflow-hidden select-none transition-colors duration-300">
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        
        {/* ================= EDITORIAL SECTION HEADER (Borderless, Minimal) ================= */}
        <ScrollReveal variant="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#C4823F] dark:text-[#ECC86A] font-medium block mb-1">
              Collector Series · Private Vault
            </span>
            <h2 className="text-[22px] sm:text-[28px] font-normal uppercase tracking-[0.03em] text-[#111111] dark:text-white">
              Discovery Coffrets
            </h2>
            <p className="text-[12px] text-[#666666] dark:text-white/60 tracking-wide mt-1.5 max-w-lg font-normal">
              Hand-assembled presentation cases lined in crushed obsidian velvet. Houses 6 travel flacons with a full flacon voucher.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] font-normal text-[#888888] dark:text-white/40 uppercase tracking-widest hidden md:inline">
              Private Allocation
            </span>
            <button
              onClick={onDiscoverMore}
              className="text-[11px] sm:text-[12px] font-normal tracking-[0.08em] uppercase text-[#111111] dark:text-white hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors flex items-center gap-1.5 group cursor-pointer"
            >
              <span>Explore All Coffrets</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-300 text-[13px]">→</span>
            </button>
          </div>
        </ScrollReveal>

        {/* 4-Item Grid Showcase (Borderless) */}
        <StaggerContainer staggerDelay={0.05} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {exclusiveProducts.map((product) => (
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
