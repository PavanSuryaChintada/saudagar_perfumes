import React, { useState } from 'react';
import BluorngProductCard from './BluorngProductCard.jsx';
import { ALL_PRODUCTS } from '../data/bluorngSaudagarData.js';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

export default function BluorngSignatureCollection({
  activeCurrency,
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  onDiscoverMore
}) {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'Oud & Woods', 'Oriental Amber', 'Solar Citrus', 'Royal Attars'];

  const signatureProducts = ALL_PRODUCTS.filter((p) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Oud & Woods') return p.notes?.base?.some(n => n.toLowerCase().includes('oud') || n.toLowerCase().includes('wood')) || p.category.includes('Oud');
    if (selectedFilter === 'Oriental Amber') return p.category.includes('Amber') || p.notes?.base?.some(n => n.toLowerCase().includes('amber'));
    if (selectedFilter === 'Solar Citrus') return p.category.includes('Solar') || p.notes?.top?.some(n => n.toLowerCase().includes('lemon') || n.toLowerCase().includes('orange'));
    if (selectedFilter === 'Royal Attars') return p.category.includes('Attar');
    return true;
  }).slice(0, 8);

  return (
    <section className="w-full bg-[#FFFFFF] py-10 sm:py-14 border-b border-[#EEEEEE]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal variant="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-2 border-b border-[#111111]/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.24em] uppercase text-[#C4823F]">
                House Signatures
              </span>
              <span className="font-script text-[#C4823F] text-[17px] sm:text-[20px] normal-case tracking-normal">
                pure attars & ouds
              </span>
            </div>
            <h2 className="text-[20px] sm:text-[24px] font-black uppercase tracking-[0.14em] text-[#111111]">
              Curated Fragrances & Attars
            </h2>
          </div>

          {/* Category Filter Pills with Smooth Active State */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider transition-all duration-200 rounded-xs whitespace-nowrap cursor-pointer ${
                  selectedFilter === f
                    ? 'bg-[#111111] text-white shadow-xs scale-[1.02]'
                    : 'bg-[#F2F2F0] text-[#555555] hover:text-[#111111] hover:bg-[#E8E8E5]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* 4-Col Product Grid with Staggered Motion */}
        <StaggerContainer key={selectedFilter} staggerDelay={0.05} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {signatureProducts.map((product) => (
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
