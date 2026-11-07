import React, { useState } from 'react';
import BluorngProductCard from './BluorngProductCard.jsx';
import { useLegacyProducts } from '../storefront/catalog/hooks';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

export default function BluorngSignatureCollection({
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  onDiscoverMore
}) {
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Tabs map onto scent-profile filters in the database (made editable in the CMS in phase 3).
  const filters = [
    { label: 'All Formulations', value: 'All', attrs: {} },
    { label: 'Oud & Woods', value: 'Oud & Woods', attrs: { family: ['oud', 'woody'] } },
    { label: 'Oriental Amber', value: 'Oriental Amber', attrs: { family: ['amber'] } },
    { label: 'Solar Citrus', value: 'Solar Citrus', attrs: { family: ['citrus', 'aquatic'] } },
    { label: 'Royal Attars', value: 'Royal Attars', attrs: { concentration: ['attar'] } }
  ];
  const activeTab = filters.find((f) => f.value === selectedFilter) || filters[0];
  const { products: signatureProducts } = useLegacyProducts({ attrs: activeTab.attrs, page_size: 8 });

  return (
    <section className="relative w-full bg-[#FFFFFF] dark:bg-[#0B0A0D] py-14 sm:py-20 overflow-hidden select-none transition-colors duration-300">
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        
        {/* ================= EDITORIAL SECTION HEADER (Borderless, Minimal) ================= */}
        <ScrollReveal variant="fade-up" className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#888888] dark:text-[#A09D96] font-medium block mb-1">
              Curated Formulations
            </span>
            <h2 className="text-[22px] sm:text-[30px] font-normal uppercase tracking-[0.03em] text-[#111111] dark:text-white">
              Fragrances & Pure Attars
            </h2>
            <p className="text-[12px] text-[#777777] dark:text-[#A09D96] tracking-wide mt-1.5 max-w-lg font-normal">
              High-concentration extraits and hydro-distilled floral oils formulated for exceptional skin chemistry evolution.
            </p>
          </div>

          {/* Refined Category Filter Pills (Soft, rounded-full, no box borders) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none bg-[#F7F6F3] dark:bg-[#141318] p-1 rounded-full">
            {filters.map((f) => {
              const isActive = selectedFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setSelectedFilter(f.value)}
                  className={`px-4 py-1.5 text-[10.5px] font-normal uppercase tracking-wider transition-all duration-300 rounded-full whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#111111] dark:bg-[#D4AF37] text-white dark:text-[#0B0A0D] shadow-sm font-medium'
                      : 'text-[#666666] dark:text-[#A09D96] hover:text-[#111111] dark:hover:text-[#ECC86A]'
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
