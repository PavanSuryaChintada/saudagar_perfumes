import React from 'react';
import BluorngProductCard from './BluorngProductCard.jsx';
import { useSourceProducts } from '../cms/useSourceProducts';
import { useGo } from '../cms/useSite';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

export default function BluorngFeaturedCollection({
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  config = {}
}) {
  const go = useGo();
  const onDiscoverMore = () => go(config.cta_link);
  // The "Latest Drop" collection, in the order set in the admin
  // Section "product_carousel": copy and product source come from the CMS.
  const { products: latestProducts } = useSourceProducts(config.source);

  return (
    <section className="relative w-full bg-[#FFFFFF] dark:bg-tk-night py-12 sm:py-16 overflow-hidden select-none transition-colors duration-300">
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        
        {/* ================= EDITORIAL SECTION HEADER (Borderless, Minimal) ================= */}
        <ScrollReveal variant="fade-up" className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8 mb-8 sm:mb-12">
          <div>
            <span className="sf-eyebrow">
              {config.eyebrow}
            </span>
            <h2 className="sf-title">
              {config.heading}
            </h2>
            <p className="sf-lead">
              {config.text}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 whitespace-nowrap">
            <span className="text-[12px] font-normal text-[#6B6B6B] dark:text-white/60 uppercase tracking-wider hidden md:inline">
              {config.side_label}
            </span>
            {config.cta_label && <button
              onClick={onDiscoverMore}
              className="text-[12px] sm:text-[12.5px] font-normal tracking-[0.08em] uppercase text-tk-ink dark:text-white hover:text-[#B8860B] dark:hover:text-tk-accent-night transition-colors flex items-center gap-1.5 group cursor-pointer"
            >
              <span>{config.cta_label}</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-300 text-[13px]">→</span>
            </button>}
          </div>
        </ScrollReveal>

        {/* 4-Col Desktop, 2-Col Mobile Product Grid (Borderless & Lineless) */}
        <StaggerContainer staggerDelay={0.05} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {latestProducts.map((product) => (
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
