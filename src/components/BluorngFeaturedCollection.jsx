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
    <section className="w-full bg-[#FFFFFF] py-8 sm:py-12 border-b border-[#EEEEEE]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Left Title & Right Discover More Link */}
        <ScrollReveal variant="fade-up" className="flex items-baseline justify-between mb-6 pb-2 border-b border-[#111111]/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.24em] uppercase text-[#C4823F]">
                Edition 2026
              </span>
              <span className="font-script text-[#C4823F] text-[17px] sm:text-[20px] normal-case tracking-normal">
                haute flacons
              </span>
            </div>
            <h2 className="text-[20px] sm:text-[24px] font-black uppercase tracking-[0.14em] text-[#111111]">
              Latest drop
            </h2>
          </div>

          <button
            onClick={onDiscoverMore}
            className="text-[11px] sm:text-[12px] font-semibold tracking-[0.14em] uppercase text-[#111111] hover:text-[#C4823F] transition-colors flex items-center gap-1 group cursor-pointer"
          >
            <span>Discover more</span>
            <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
          </button>
        </ScrollReveal>

        {/* 4-Col Desktop, 2-Col Mobile Product Grid with Staggered Entrance */}
        <StaggerContainer staggerDelay={0.06} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
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
