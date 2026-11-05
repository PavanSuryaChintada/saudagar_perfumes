import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_PRODUCTS, formatPrice } from '../data/bluorngSaudagarData.js';
import { resolveCollectionTheme, filterProductsByTheme } from '../data/collectionThemes.js';
import BluorngCollectionHero from './BluorngCollectionHero.jsx';
import CollectionBentoSection from './BluorngCollectionBento.jsx';

export default function BluorngCollectionPage({
  initialCategory = 'signature',
  activeCurrency = 'INR',
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  onNavigateHome,
  onNavigateCollection
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('default');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [subFilter, setSubFilter] = useState('all');
  const [hoveredCardId, setHoveredCardId] = useState(null);

  // Sync state if prop changes from parent
  useEffect(() => {
    setSelectedCategory(initialCategory);
    setSubFilter('all');
  }, [initialCategory]);

  const theme = resolveCollectionTheme(selectedCategory);

  const handleSwitchCollection = (slug) => {
    setSelectedCategory(slug);
    setSubFilter('all');
    if (onNavigateCollection) {
      onNavigateCollection(slug);
    }
  };

  // Base products for this collection
  const baseProducts = filterProductsByTheme(theme.id, ALL_PRODUCTS, wishlist);

  // Apply sub-filters if selected
  const filteredProducts = baseProducts.filter((p) => {
    if (subFilter === 'all') return true;
    if (subFilter === 'wishlist') return wishlist.includes(p.id);
    if (subFilter === 'sale') return p.compareAtPrice && p.compareAtPrice > p.price;
    if (subFilter === 'extrait') return p.category?.toLowerCase().includes('extrait');
    if (subFilter === 'attar') return p.category?.toLowerCase().includes('attar');
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
    return 0; // 'default'
  });

  return (
    <div className="w-full min-h-screen font-sans select-none pb-28 bg-[#FFFFFF] dark:bg-[#0B0A0D] text-[#111111] dark:text-white transition-colors duration-300">
      
      {/* ================= 1. CINEMATIC HERO (Video & Collection Identity) ================= */}
      <BluorngCollectionHero
        activeCollectionId={theme.id}
        onSwitchCollection={handleSwitchCollection}
      />

      {/* ================= 2. EDITORIAL BENTO GRID SHOWCASE ================= */}
      <CollectionBentoSection
        theme={theme}
        featuredProduct={baseProducts[0] || ALL_PRODUCTS[0]}
        activeCurrency={activeCurrency}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onSelectProduct={onSelectProduct}
        onQuickBuy={onQuickBuy}
      />

      {/* ================= 3. CLEAN MINIMAL TOOLBAR ================= */}
      <div className="w-full px-4 sm:px-8 lg:px-12 pt-8 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[12px] pb-3">
          {/* Product Count & Olfactory Notes */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-[#111111] dark:text-white">
              {sortedProducts.length} Fragrances Found
            </span>
            <span className="opacity-40 text-[#888888] dark:text-[#A09D96]">·</span>
            <span className="text-[11.5px] font-normal tracking-wide hidden sm:inline text-[#777777] dark:text-[#A09D96]">
              {theme.notesSubtitle}
            </span>
          </div>

          {/* Right: Sort & Filter */}
          <div className="flex items-center gap-6">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-[12px] text-[#666666] dark:text-[#A09D96]">
              <span>Sort:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent dark:bg-[#0B0A0D] font-medium pr-4 outline-none cursor-pointer appearance-none text-[12px] text-[#111111] dark:text-white"
                >
                  <option value="default" className="dark:bg-[#141318]">Featured</option>
                  <option value="price-low" className="dark:bg-[#141318]">Price: Low to High</option>
                  <option value="price-high" className="dark:bg-[#141318]">Price: High to Low</option>
                  <option value="rating" className="dark:bg-[#141318]">Top Rated</option>
                </select>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] opacity-60">
                  ⌄
                </span>
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="transition-colors cursor-pointer flex items-center gap-1 font-medium text-[12px] text-[#111111] dark:text-white hover:text-[#C4823F] dark:hover:text-[#ECC86A]"
            >
              <span>Filters</span>
              <span className="text-[13px] leading-none">{isFilterOpen ? '−' : '+'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Sub-filter Pills */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: 'All', val: 'all' },
                  { label: 'Extraits', val: 'extrait' },
                  { label: 'Pure Attars', val: 'attar' },
                  { label: 'Limited Drops', val: 'sale' },
                  { label: `Saved (${wishlist.length})`, val: 'wishlist' }
                ].map((pill) => {
                  const isActive = subFilter === pill.val;
                  return (
                    <button
                      key={pill.val}
                      onClick={() => setSubFilter(pill.val)}
                      className={`px-3.5 py-1 text-[11px] font-normal transition-colors cursor-pointer rounded-full ${
                        isActive
                          ? 'bg-[#111111] dark:bg-[#C4823F] text-white shadow-sm'
                          : 'bg-[#F8F7F5] dark:bg-[#141318] text-[#666666] dark:text-[#A09D96] hover:bg-[#F2EFEA] dark:hover:bg-[#1C1A22] hover:text-[#111111] dark:hover:text-white'
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ================= 3. CLEAN PRODUCT GRID (Single Luxury Palette) ================= */}
      <div className="w-full px-4 sm:px-8 lg:px-12 mt-4">
        {sortedProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[14px] text-[#777777] dark:text-[#A09D96]">No fragrances found for this filter.</p>
            <button
              onClick={() => setSubFilter('all')}
              className="mt-3 text-[12px] uppercase tracking-wider underline text-[#111111] dark:text-white hover:text-[#C4823F] dark:hover:text-[#ECC86A] cursor-pointer"
            >
              Show all {theme.shortName} fragrances
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {sortedProducts.map((prod) => {
              const isWish = wishlist.includes(prod.id);
              const isHovered = hoveredCardId === prod.id;
              const hasDiscount = prod.compareAtPrice && prod.compareAtPrice > prod.price;
              const isSale = prod.badge?.toLowerCase().includes('sale') || hasDiscount;
              const image = prod.images?.[0] || prod.image || '/images/crystal_square_flacon.png';

              return (
                <div
                  key={prod.id}
                  className="flex flex-col group cursor-pointer select-none"
                  onMouseEnter={() => setHoveredCardId(prod.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  onClick={() => onSelectProduct(prod.id)}
                >
                  {/* Flacon Pedestal Stage (Consistent Soft Stage #F8F7F5 / Dark #141318) */}
                  <div className="w-full aspect-square rounded-md relative flex items-center justify-center p-6 sm:p-8 overflow-hidden bg-[#F8F7F5] dark:bg-[#141318] group-hover:bg-[#F2EFEA] dark:group-hover:bg-[#1C1A22] transition-all duration-400 group-hover:scale-[1.01]">
                    {/* Badge */}
                    {(isSale || prod.badge) && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="text-[9px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-sm bg-white/85 dark:bg-white/10 text-[#666666] dark:text-white/80">
                          {isSale ? 'Sale' : prod.badge}
                        </span>
                      </div>
                    )}

                    {/* Wishlist Heart Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(prod.id);
                      }}
                      className="absolute top-3 right-3 z-10 transition-colors p-1 cursor-pointer bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 rounded-full flex items-center justify-center w-7 h-7"
                      style={{ color: isWish ? '#C4823F' : '#AAAAAA' }}
                      title={isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      aria-label="Wishlist"
                    >
                      {isWish ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      )}
                    </button>

                    {/* Flacon Product Image */}
                    <img
                      src={image}
                      alt={prod.name}
                      className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />

                    {/* Floating Quick Buy Pill on Hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.button
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.18 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickBuy(prod);
                          }}
                          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 text-[10.5px] uppercase tracking-wider font-medium px-4 py-1.5 rounded-full shadow-md transition-all cursor-pointer whitespace-nowrap bg-[#111111] dark:bg-[#C4823F] text-white hover:bg-[#C4823F] dark:hover:bg-[#DE9954]"
                        >
                          <span>+ Quick Add</span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Product Details (Clean typography, no box borders) */}
                  <div className="pt-3 flex flex-col">
                    <h3 className="text-[13px] sm:text-[13.5px] font-normal leading-snug line-clamp-1 transition-colors text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A]">
                      {prod.name}
                    </h3>

                    <p className="text-[11px] mt-0.5 line-clamp-1 font-normal text-[#888888] dark:text-[#A09D96]">
                      {prod.notes?.heart?.[0] || prod.notes?.top?.[0] || prod.concentration?.split('·')[0] || 'Extrait de Parfum'}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[12.5px]">
                      <span className="font-normal text-[#111111] dark:text-white">
                        {formatPrice(prod.price, activeCurrency)}
                      </span>
                      {hasDiscount && (
                        <span className="line-through text-[11px] text-[#AAAAAA] dark:text-white/40">
                          {formatPrice(prod.compareAtPrice, activeCurrency)}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
