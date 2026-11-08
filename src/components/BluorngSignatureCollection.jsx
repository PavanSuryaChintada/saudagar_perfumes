import React, { useState } from 'react';
import BluorngProductCard from './BluorngProductCard.jsx';
import { useSourceProducts } from '../cms/useSourceProducts';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

export default function BluorngSignatureCollection({
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  config = {}
}) {
  const [selectedFilter, setSelectedFilter] = useState('0');

  // Section "product_grid_tabs": each tab is a label plus a product source, all edited in the CMS.
  const filters = (config.tabs || []).map((t, i) => ({ label: t.label, value: String(i), source: t.source }));
  const activeTab = filters.find((f) => f.value === selectedFilter) || filters[0];
  const { products: signatureProducts } = useSourceProducts(activeTab?.source);

  return (
    <section className="relative w-full bg-[#FFFFFF] dark:bg-tk-night py-12 sm:py-16 overflow-hidden select-none transition-colors duration-300">
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        
        {/* ================= EDITORIAL SECTION HEADER (Borderless, Minimal) ================= */}
        <ScrollReveal variant="fade-up" className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-12">
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

          {/* Category filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none bg-[#F7F6F3] dark:bg-[#141318] p-1 rounded-[2px]">
            {filters.map((f) => {
              const isActive = selectedFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setSelectedFilter(f.value)}
                  className={`px-4 py-1.5 text-[11.5px] font-normal uppercase tracking-wider transition-all duration-300 rounded-[2px] whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night shadow-sm font-medium'
                      : 'text-[#666666] dark:text-[#A09D96] hover:text-tk-ink dark:hover:text-tk-accent-night'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* 4-Col Product Grid (Borderless & Lineless) */}
        <StaggerContainer key={selectedFilter} staggerDelay={0.05} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {signatureProducts.map((product) => (
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
