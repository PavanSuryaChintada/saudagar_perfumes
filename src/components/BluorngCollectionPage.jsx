import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_PRODUCTS, MEGA_MENU_COLLECTIONS } from '../data/bluorngSaudagarData.js';
import BluorngProductCard from './BluorngProductCard.jsx';
import { ScrollReveal, StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';

export default function BluorngCollectionPage({
  initialCategory = 'all',
  activeCurrency = 'INR',
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  onNavigateHome
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('featured');
  const [gridCols, setGridCols] = useState(4); // 2, 3, or 4

  // Sync state if prop changes from parent
  React.useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Filter products
  const filteredProducts = ALL_PRODUCTS.filter((p) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'new-in') return p.badge?.includes('NEW') || p.collection === 'Latest drop';
    if (selectedCategory === 'wishlist') return wishlist.includes(p.id);
    if (selectedCategory === 'oud-royale') return p.name.toLowerCase().includes('oud') || p.category.includes('Oud');
    if (selectedCategory === 'discovery-sets' || selectedCategory === 'Discovery Sets') return p.category.includes('Discovery') || p.collection.includes('Coffrets');
    if (selectedCategory === 'royal-attars') return p.category.includes('Attar');
    if (selectedCategory === 'solar-citrus') return p.category.includes('Solar') || p.notes?.top?.some(n => n.toLowerCase().includes('lemon') || n.toLowerCase().includes('orange'));
    if (selectedCategory === 'bespoke-atelier') return p.category.includes('Extrait') || p.category.includes('Accessories');
    return p.category.toLowerCase().includes(selectedCategory.toLowerCase()) || p.collection.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
    return 0; // 'featured' or default
  });

  return (
    <div className="w-full bg-[#FFFFFF] min-h-screen">
      
      {/* ================= BREADCRUMBS ================= */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 text-[11px] uppercase tracking-wider text-[#777777] border-b border-[#EEEEEE] flex items-center gap-2">
        <button onClick={onNavigateHome} className="hover:text-[#111111] transition-colors">
          Home
        </button>
        <span>/</span>
        <span className="text-[#111111] font-semibold">Collections</span>
        <span>/</span>
        <span className="text-[#C4823F] font-bold uppercase">{selectedCategory}</span>
      </div>

      {/* ================= COLLECTION HERO HEADER ================= */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-b border-[#EEEEEE]">
        <ScrollReveal direction="up" distance={20} duration={0.8}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10.5px] font-bold tracking-[0.24em] uppercase text-[#C4823F]">
                House Directory
              </span>
              <h1 className="text-[26px] sm:text-[34px] font-black uppercase tracking-[0.14em] text-[#111111] mt-1">
                {selectedCategory === 'all'
                  ? 'All Fragrances & Flacons'
                  : selectedCategory === 'new-in'
                  ? 'New Arrivals 2026'
                  : selectedCategory === 'wishlist'
                  ? 'Your Saved Wishlist'
                  : selectedCategory.toUpperCase()}
              </h1>
              <p className="text-[12px] text-[#666666] tracking-wide mt-2 max-w-xl">
                Sculptural crystal vessels containing masterwork Extraits de Parfum, aged Cambodi ouds, and rare royal attars.
              </p>
            </div>

            <span className="text-[12px] font-semibold text-[#888888] tracking-wider uppercase">
              Showing {sortedProducts.length} Fragrances
            </span>
          </div>
        </ScrollReveal>

        {/* Quick Category Filter Pills */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'bg-[#F2F2F0] text-[#444444] hover:bg-[#E5E5E2]'
            }`}
          >
            All Products
          </motion.button>
          {MEGA_MENU_COLLECTIONS.map((c) => (
            <motion.button
              key={c.id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-all whitespace-nowrap ${
                selectedCategory === c.slug
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'bg-[#F2F2F0] text-[#444444] hover:bg-[#E5E5E2]'
              }`}
            >
              {c.title}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ================= FILTER & SORT TOOLBAR ================= */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-[#EEEEEE] flex flex-wrap items-center justify-between gap-4 text-[11.5px]">
        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[#777777]">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-[#CCCCCC] rounded-xs px-2.5 py-1 text-[11px] uppercase tracking-wider bg-white font-semibold outline-none focus:border-[#111111]"
          >
            <option value="featured">Featured (Curated)</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated (5.0 ★)</option>
          </select>
        </div>

        {/* Grid column switcher (Desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[#777777]">Columns:</span>
          <div className="flex border border-[#CCCCCC] rounded-xs overflow-hidden">
            {[2, 3, 4].map((cols) => (
              <button
                key={cols}
                onClick={() => setGridCols(cols)}
                className={`px-2.5 py-1 font-bold text-xs transition-colors ${
                  gridCols === cols ? 'bg-[#111111] text-white' : 'bg-white hover:bg-[#F5F5F5] text-[#111111]'
                }`}
              >
                {cols}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= PRODUCT GRID ================= */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {sortedProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-[16px] font-bold uppercase tracking-wider text-[#111111]">
              No Products Found in This Category
            </p>
            <p className="text-[12px] text-[#777777]">
              Please select another collection or reset your filter.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedCategory('all')}
              className="mt-3 px-6 py-2.5 bg-[#111111] text-white text-[11px] font-bold uppercase tracking-widest"
            >
              Show All Fragrances
            </motion.button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <StaggerContainer
              key={`${selectedCategory}-${sortBy}-${gridCols}`}
              staggerDelay={0.04}
              className={`grid gap-3 sm:gap-5 ${
                gridCols === 2
                  ? 'grid-cols-2'
                  : gridCols === 3
                  ? 'grid-cols-2 md:grid-cols-3'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}
            >
              {sortedProducts.map((prod) => (
                <StaggerItem key={prod.id}>
                  <BluorngProductCard
                    product={prod}
                    activeCurrency={activeCurrency}
                    isWishlisted={wishlist.includes(prod.id)}
                    onToggleWishlist={onToggleWishlist}
                    onSelectProduct={onSelectProduct}
                    onQuickBuy={onQuickBuy}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </AnimatePresence>
        )}
      </div>

    </div>
  );
}
