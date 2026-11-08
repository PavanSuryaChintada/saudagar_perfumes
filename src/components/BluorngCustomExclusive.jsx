import React from 'react';
import BluorngProductCard from './BluorngProductCard.jsx';
import { useSourceProducts } from '../cms/useSourceProducts';
import { useGo } from '../cms/useSite';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

export default function BluorngCustomExclusive({
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  config = {}
}) {
  const go = useGo();
  const onDiscoverMore = () => go(config.cta_link);
  // Discovery Coffrets & Exclusive sets
  // Section "product_showcase": copy and product source come from the CMS.
  const { products: exclusiveProducts } = useSourceProducts(config.source);

  return (
    <section className="relative w-full bg-[#FFFFFF] dark:bg-[#121114] py-14 sm:py-20 text-tk-ink dark:text-white overflow-hidden select-none transition-colors duration-300">
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        
        {/* ================= EDITORIAL SECTION HEADER (Borderless, Minimal) ================= */}
        <ScrollReveal variant="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <span className="text-[11px] uppercase tracking-[0.16em] text-tk-accent dark:text-tk-accent-night font-medium block mb-1">
              {config.eyebrow}
            </span>
            <h2 className="text-[22px] sm:text-[28px] font-normal uppercase tracking-[0.03em] text-tk-ink dark:text-white">
              {config.heading}
            </h2>
            <p className="text-[12px] text-[#666666] dark:text-white/60 tracking-wide mt-1.5 max-w-lg font-normal">
              {config.text}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] font-normal text-[#666666] dark:text-white/40 uppercase tracking-widest hidden md:inline">
              {config.side_label}
            </span>
            {config.cta_label && <button
              onClick={onDiscoverMore}
              className="text-[11px] sm:text-[12px] font-normal tracking-[0.08em] uppercase text-tk-ink dark:text-white hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors flex items-center gap-1.5 group cursor-pointer"
            >
              <span>{config.cta_label}</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-300 text-[13px]">→</span>
            </button>}
          </div>
        </ScrollReveal>

        {/* 4-Item Grid Showcase (Borderless) */}
        <StaggerContainer staggerDelay={0.05} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {exclusiveProducts.map((product) => (
            <StaggerItem key={product.id}>
              <BluorngProductCard
                product={product}
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
