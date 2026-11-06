import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_PRODUCTS, formatPrice } from '../data/bluorngSaudagarData.js';
import { resolveCollectionTheme, filterProductsByTheme } from '../data/collectionThemes.js';
import { FILTER_SECTIONS, matchesFilters, computeFilterCounts } from '../data/fragranceFilters.js';
import BluorngCollectionHero from './BluorngCollectionHero.jsx';
import BluorngFilterSidebar from './BluorngFilterSidebar.jsx';

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
  const [subFilter, setSubFilter] = useState('all');
  const [hoveredCardId, setHoveredCardId] = useState(null);

  // Advanced filters state: Notes, Occasion, Smell Intensity, Concentration, Price
  const [activeFilters, setActiveFilters] = useState({
    intensity: [],
    notes: [],
    occasion: [],
    concentration: [],
    price: []
  });

  // Desktop sidebar visibility toggle (defaults to open as a sleek left filter bar)
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(true);

  // Mobile / tablet filter slide-over drawer state
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false);

  // Grid Density state: 2 products (large editorial) vs 4 products (compact catalog)
  const [gridCols, setGridCols] = useState(() => {
    try {
      const saved = localStorage.getItem('saudagar_grid_cols');
      return saved ? parseInt(saved, 10) : 4;
    } catch {
      return 4;
    }
  });

  const handleSwitchGrid = (cols) => {
    setGridCols(cols);
    try {
      localStorage.setItem('saudagar_grid_cols', String(cols));
    } catch {}
  };

  // Sync state if initialCategory prop changes from parent
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

  // Base products for this collection (or all products if 'all' is selected)
  const baseProducts = useMemo(() => {
    if (selectedCategory === 'all') return ALL_PRODUCTS;
    return filterProductsByTheme(theme.id, ALL_PRODUCTS, wishlist);
  }, [selectedCategory, theme.id, wishlist]);

  // Compute live option counts within base products
  const filterCounts = useMemo(() => {
    return computeFilterCounts(baseProducts, activeFilters);
  }, [baseProducts, activeFilters]);

  // Toggle filter option
  const handleToggleFilter = (sectionId, optionId) => {
    setActiveFilters((prev) => {
      const current = prev[sectionId] || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return {
        ...prev,
        [sectionId]: updated
      };
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveFilters({
      intensity: [],
      notes: [],
      occasion: [],
      concentration: [],
      price: []
    });
    setSubFilter('all');
  };

  // Calculate total number of active filters
  const totalActiveFilters = useMemo(() => {
    return Object.values(activeFilters).reduce(
      (acc, val) => acc + (Array.isArray(val) ? val.length : 0),
      0
    );
  }, [activeFilters]);

  // Apply sub-filters and advanced filters
  const filteredProducts = useMemo(() => {
    return baseProducts.filter((p) => {
      // Legacy pill sub-filter
      if (subFilter === 'wishlist' && !wishlist.includes(p.id)) return false;
      if (subFilter === 'sale' && !(p.compareAtPrice && p.compareAtPrice > p.price)) return false;
      if (subFilter === 'extrait' && !p.category?.toLowerCase().includes('extrait')) return false;
      if (subFilter === 'attar' && !p.category?.toLowerCase().includes('attar')) return false;

      // Advanced filters (Notes, Occasion, Smell Intensity, Concentration, Price)
      return matchesFilters(p, activeFilters);
    });
  }, [baseProducts, subFilter, wishlist, activeFilters]);

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      return 0; // 'default'
    });
  }, [filteredProducts, sortBy]);

  return (
    <div className="w-full min-h-screen font-sans select-none pb-28 bg-[#FFFFFF] dark:bg-[#0B0A0D] text-[#111111] dark:text-white transition-colors duration-300">
      
      {/* ================= 1. CINEMATIC HERO (Video & Collection Identity) ================= */}
      <BluorngCollectionHero
        activeCollectionId={theme.id}
        onSwitchCollection={handleSwitchCollection}
      />

      {/* ================= 2. CLEAN MINIMAL TOOLBAR ================= */}
      <div id="catalog-section" className="w-full px-4 sm:px-8 lg:px-12 pt-10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[12px] pb-3 border-b border-[#EAEAEA] dark:border-white/10">
          
          {/* Left: Product Count & Filter Sidebar Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Desktop Left Sidebar Toggle */}
            <button
              type="button"
              onClick={() => setIsDesktopFilterOpen(!isDesktopFilterOpen)}
              className="hidden lg:flex items-center gap-2 font-medium text-[11.5px] uppercase tracking-[0.14em] text-[#111111] dark:text-white hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors cursor-pointer py-1"
              title={isDesktopFilterOpen ? 'Hide Filter Sidebar' : 'Show Filter Sidebar'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              <span>{isDesktopFilterOpen ? 'Hide Filters' : 'Show Filters'}</span>
              <AnimatePresence>
                {totalActiveFilters > 0 && (
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [1.25, 1], opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4 rounded-full bg-[#111111] dark:bg-[#D4AF37] text-white dark:text-[#0B0A0D] text-[9.5px] font-bold flex items-center justify-center"
                  >
                    {totalActiveFilters}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile / Tablet Filter Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setIsMobileFilterDrawerOpen(true)}
              className="flex lg:hidden items-center gap-2 font-medium text-[11.5px] uppercase tracking-[0.12em] text-[#111111] dark:text-white hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors cursor-pointer px-3 py-1.5 rounded-sm bg-black/5 dark:bg-white/10"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filter & Refine</span>
              <AnimatePresence>
                {totalActiveFilters > 0 && (
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [1.25, 1], opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4 rounded-full bg-[#111111] dark:bg-[#D4AF37] text-white dark:text-[#0B0A0D] text-[9.5px] font-bold flex items-center justify-center"
                  >
                    {totalActiveFilters}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <span className="hidden sm:inline opacity-30 text-[#888888]">|</span>

            {/* Animated Product Counter & Live Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center font-medium text-[#111111] dark:text-white">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={sortedProducts.length}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block tabular-nums font-semibold"
                  >
                    {sortedProducts.length}
                  </motion.span>
                </AnimatePresence>
                <span className="ml-1">Fragrance{sortedProducts.length === 1 ? '' : 's'} Found</span>
              </div>
              {selectedCategory !== 'all' && (
                <span className="text-[11px] text-[#888888] dark:text-[#88857F] hidden md:inline">
                  in {theme.name}
                </span>
              )}
              {totalActiveFilters > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-1.5 h-1.5 rounded-full bg-[#C4823F] dark:bg-[#ECC86A] animate-pulse"
                  title="Filtered results active"
                />
              )}
            </div>
          </div>

          {/* Right: Quick Scope & Sort */}
          <div className="flex items-center gap-5">
            {/* Switch to All Collections Shortcut if currently narrowed */}
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => handleSwitchCollection('all')}
                className="hidden md:inline-block text-[11.5px] font-normal text-[#C4823F] dark:text-[#ECC86A] hover:underline cursor-pointer"
              >
                Browse All 16 Creations →
              </button>
            )}

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-[12px] text-[#666666] dark:text-[#A09D96]">
              <span className="text-[11px] uppercase tracking-wider text-[#888888] dark:text-[#88857F]">
                Sort:
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent dark:bg-[#0B0A0D] font-medium pr-4 outline-none cursor-pointer appearance-none text-[12px] text-[#111111] dark:text-white"
                >
                  <option value="default" className="dark:bg-[#141318]">Featured Atelier</option>
                  <option value="price-low" className="dark:bg-[#141318]">Price: Low to High</option>
                  <option value="price-high" className="dark:bg-[#141318]">Price: High to Low</option>
                  <option value="rating" className="dark:bg-[#141318]">Highest Rated</option>
                </select>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] opacity-60">
                  ⌄
                </span>
              </div>
            </div>

            {/* Subtle Divider */}
            <span className="inline-block w-[1px] h-4 bg-[#E0DDD5] dark:bg-white/15" />

            {/* Grid Density Switcher (2, 3, or 4 Products per row) */}
            <div className="flex items-center gap-1 bg-[#F5F4F0] dark:bg-[#1A1820] p-0.5 sm:p-1 rounded-md border border-[#E0DDD5] dark:border-white/10 select-none">
              <button
                type="button"
                onClick={() => handleSwitchGrid(2)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  gridCols === 2
                    ? 'bg-white dark:bg-[#25222E] text-[#111111] dark:text-[#ECC86A] shadow-xs'
                    : 'text-[#888888] dark:text-[#88857F] hover:text-[#111111] dark:hover:text-white'
                }`}
                title="Two products per row (Large Editorial View)"
                aria-label="2 Columns"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="2" width="5" height="12" rx="0.5" fill={gridCols === 2 ? 'currentColor' : 'none'} />
                  <rect x="9" y="2" width="5" height="12" rx="0.5" fill={gridCols === 2 ? 'currentColor' : 'none'} />
                </svg>
                <span className="font-mono text-[10.5px]">2</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchGrid(3)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  gridCols === 3
                    ? 'bg-white dark:bg-[#25222E] text-[#111111] dark:text-[#ECC86A] shadow-xs'
                    : 'text-[#888888] dark:text-[#88857F] hover:text-[#111111] dark:hover:text-white'
                }`}
                title="Three products per row (Balanced Gallery View)"
                aria-label="3 Columns"
              >
                <svg width="13" height="12" viewBox="0 0 17 16" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="1.5" y="2" width="3.5" height="12" rx="0.4" fill={gridCols === 3 ? 'currentColor' : 'none'} />
                  <rect x="6.75" y="2" width="3.5" height="12" rx="0.4" fill={gridCols === 3 ? 'currentColor' : 'none'} />
                  <rect x="12" y="2" width="3.5" height="12" rx="0.4" fill={gridCols === 3 ? 'currentColor' : 'none'} />
                </svg>
                <span className="font-mono text-[10.5px]">3</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchGrid(4)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  gridCols === 4
                    ? 'bg-white dark:bg-[#25222E] text-[#111111] dark:text-[#ECC86A] shadow-xs'
                    : 'text-[#888888] dark:text-[#88857F] hover:text-[#111111] dark:hover:text-white'
                }`}
                title="Four products per row (Compact Catalog View)"
                aria-label="4 Columns"
              >
                <svg width="14" height="12" viewBox="0 0 18 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="1" y="2" width="2.8" height="12" rx="0.4" fill={gridCols === 4 ? 'currentColor' : 'none'} />
                  <rect x="5.4" y="2" width="2.8" height="12" rx="0.4" fill={gridCols === 4 ? 'currentColor' : 'none'} />
                  <rect x="9.8" y="2" width="2.8" height="12" rx="0.4" fill={gridCols === 4 ? 'currentColor' : 'none'} />
                  <rect x="14.2" y="2" width="2.8" height="12" rx="0.4" fill={gridCols === 4 ? 'currentColor' : 'none'} />
                </svg>
                <span className="font-mono text-[10.5px]">4</span>
              </button>
            </div>
          </div>

        </div>

        {/* ================= ACTIVE FILTER TAGS PILL ROW (ANIMATED) ================= */}
        <AnimatePresence>
          {totalActiveFilters > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-2 pt-3 pb-1 overflow-hidden"
            >
              <span className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-[#888888] dark:text-[#88857F] mr-1">
                Active Filters:
              </span>
              <AnimatePresence mode="popLayout">
                {Object.entries(activeFilters).flatMap(([sectionId, optionIds]) =>
                  optionIds.map((optId) => {
                    const section = FILTER_SECTIONS.find((s) => s.id === sectionId);
                    const option = section?.options.find((o) => o.id === optId);
                    return (
                      <motion.button
                        key={`${sectionId}-${optId}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.75, transition: { duration: 0.16 } }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => handleToggleFilter(sectionId, optId)}
                        className="group inline-flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-full bg-[#F5F4F0] dark:bg-[#1A1820] hover:bg-[#EAE8E2] dark:hover:bg-[#25222E] text-[#111111] dark:text-white border border-[#E0DDD5] dark:border-white/10 transition-colors cursor-pointer shadow-xs"
                        title={`Remove ${option?.label || optId}`}
                      >
                        <span>{option?.label || optId}</span>
                        <span className="text-[12px] font-bold text-[#888888] group-hover:text-[#111111] dark:group-hover:text-white leading-none transition-transform group-hover:rotate-90 duration-200">
                          ×
                        </span>
                      </motion.button>
                    );
                  })
                )}
              </AnimatePresence>

              <motion.button
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] font-medium tracking-wide uppercase text-[#C4823F] dark:text-[#ECC86A] underline underline-offset-4 hover:opacity-80 transition-opacity ml-2 cursor-pointer"
              >
                Clear All
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ================= 4. MAIN BODY: LEFT MINIMAL FILTER BAR + PRODUCT GRID ================= */}
      <div className="w-full px-4 sm:px-8 lg:px-12 mt-4">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12 items-start">
          
          {/* ================= DESKTOP MINIMAL LEFT FILTER BAR ================= */}
          {isDesktopFilterOpen && (
            <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-3 scrollbar-none">
              <BluorngFilterSidebar
                activeFilters={activeFilters}
                filterCounts={filterCounts}
                onToggleFilter={handleToggleFilter}
                onClearFilters={handleClearFilters}
                totalMatching={sortedProducts.length}
              />
            </aside>
          )}

          {/* ================= PRODUCT GRID AREA ================= */}
          <main className="flex-1 min-w-0 w-full">
            <AnimatePresence mode="wait">
              {sortedProducts.length === 0 ? (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="py-24 text-center border border-dashed border-[#E5E5E5] dark:border-white/15 rounded-lg p-8"
                >
                  <p className="font-serif text-[19px] sm:text-[22px] text-[#111111] dark:text-white">
                    No flacons match your refined filter combination.
                  </p>
                  <p className="text-[12.5px] text-[#777777] dark:text-[#A09D96] mt-2 max-w-md mx-auto font-light leading-relaxed">
                    Try unchecking specific olfactory notes, intensity levels, or occasion tags to rediscover the full Saudi & French atelier catalog.
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-sm bg-[#111111] dark:bg-[#D4AF37] text-white dark:text-[#0B0A0D] hover:bg-[#C4823F] dark:hover:bg-[#ECC86A] transition-colors cursor-pointer shadow-sm"
                    >
                      Reset All Filters
                    </button>
                    {selectedCategory !== 'all' && (
                      <button
                        type="button"
                        onClick={() => handleSwitchCollection('all')}
                        className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-sm border border-[#CCCCCC] dark:border-white/20 text-[#111111] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Search All Collections
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  layout
                  key={`product-grid-${gridCols}`}
                  className={`grid gap-4 sm:gap-6 lg:gap-7 transition-all duration-300 ${
                    gridCols === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : gridCols === 3
                      ? isDesktopFilterOpen
                        ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3'
                      : isDesktopFilterOpen
                      ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4'
                      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  }`}
                >
                  <AnimatePresence mode="popLayout">
                    {sortedProducts.map((prod, index) => {
                      const isWish = wishlist.includes(prod.id);
                      const isHovered = hoveredCardId === prod.id;
                      const hasDiscount = prod.compareAtPrice && prod.compareAtPrice > prod.price;
                      const isSale = prod.badge?.toLowerCase().includes('sale') || hasDiscount;
                      const image = prod.images?.[0] || prod.image || '/images/crystal_square_flacon.png';

                      return (
                        <motion.div
                          layout="position"
                          key={prod.id}
                          initial={{ opacity: 0, scale: 0.92, y: 14 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.88, y: -8, transition: { duration: 0.18 } }}
                          transition={{
                            duration: 0.32,
                            delay: Math.min(index * 0.02, 0.12),
                            ease: [0.16, 1, 0.3, 1]
                          }}
                          className="flex flex-col group cursor-pointer select-none"
                          onMouseEnter={() => {
                            setHoveredCardId(prod.id);
                            // Prefetch product image on hover for instant opening
                            const imgs = prod.images || (prod.image ? [prod.image] : []);
                            imgs.forEach((src) => {
                              const img = new Image();
                              img.src = src;
                            });
                          }}
                          onMouseLeave={() => setHoveredCardId(null)}
                          onClick={() => onSelectProduct(prod.id)}
                        >
                          {/* Flacon Pedestal Stage (Consistent Soft Stage #F8F7F5 / Dark #141318) */}
                          <div className={`w-full aspect-square rounded-md relative flex items-center justify-center overflow-hidden bg-[#F8F7F5] dark:bg-[#141318] group-hover:bg-[#F2EFEA] dark:group-hover:bg-[#1C1A22] transition-all duration-400 group-hover:scale-[1.01] ${
                            gridCols === 2 ? 'p-8 sm:p-14' : gridCols === 3 ? 'p-6 sm:p-10' : 'p-6 sm:p-8'
                          }`}>
                            {/* Badge */}
                            {(isSale || prod.badge) && (
                              <div className="absolute top-3 left-3 z-10">
                                <span className="text-[9px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-sm bg-white/85 dark:bg-white/10 text-[#666666] dark:text-white/80">
                                  {isSale ? 'Sale' : prod.badge}
                                </span>
                              </div>
                            )}

                            {/* Wishlist Bookmark Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleWishlist && onToggleWishlist(prod.id);
                              }}
                              className={`absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-[#111111] dark:text-white ${
                                isWish ? 'text-[#C4823F] dark:text-[#ECC86A]' : 'text-[#AAAAAA]'
                              }`}
                              title={isWish ? 'Remove from wishlist' : 'Save to wishlist'}
                              aria-label="Wishlist"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                className={isWish ? 'text-[#C4823F] dark:text-[#ECC86A]' : 'text-[#111111] dark:text-white'}
                                fill={isWish ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                            </button>

                            {/* Flacon Product Image */}
                            <img
                              src={image}
                              alt={prod.name}
                              className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform duration-500 ease-out"
                              loading="lazy"
                            />

                            {/* Effortless Floating + Quick Add Pill on Hover */}
                            <div
                              className={`absolute bottom-3 left-3 right-3 z-20 transition-all duration-300 ${
                                isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onQuickBuy(prod);
                                }}
                                className="w-full py-2.5 text-[10.5px] uppercase tracking-[0.16em] font-medium rounded-full shadow-lg transition-all duration-300 cursor-pointer bg-[#111111]/95 text-white hover:bg-[#C4823F] dark:bg-[#D4AF37] dark:text-[#0B0A0D] dark:hover:bg-[#ECC86A] backdrop-blur-md flex items-center justify-center gap-1.5"
                              >
                                <span>+ Quick Add</span>
                              </button>
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="pt-3 flex flex-col">
                            <h3 className={`font-normal leading-snug line-clamp-1 transition-colors text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] ${
                              gridCols === 2
                                ? 'text-[15px] sm:text-[17px]'
                                : gridCols === 3
                                ? 'text-[14px] sm:text-[15px]'
                                : 'text-[13px] sm:text-[13.5px]'
                            }`}>
                              {prod.name}
                            </h3>

                            <p className={`mt-0.5 line-clamp-1 font-normal text-[#888888] dark:text-[#A09D96] ${
                              gridCols === 2 ? 'text-[12px] sm:text-[12.5px]' : gridCols === 3 ? 'text-[11.5px]' : 'text-[11px]'
                            }`}>
                              {gridCols === 2 && prod.notes
                                ? [ ...(prod.notes?.heart || []), ...(prod.notes?.top || []) ].slice(0, 3).join(' · ') || (prod.category || 'Extrait de Parfum')
                                : gridCols === 3 && prod.notes
                                ? [ ...(prod.notes?.heart || []), ...(prod.notes?.top || []) ].slice(0, 2).join(' · ') || (prod.category || 'Extrait de Parfum')
                                : prod.notes?.heart?.[0] || prod.notes?.top?.[0] || prod.concentration?.split('·')[0] || 'Extrait de Parfum'
                              }
                            </p>

                            <div className="flex items-center gap-2 mt-1 text-[12.5px]">
                              <span className={`font-normal text-[#111111] dark:text-white ${
                                gridCols === 2
                                  ? 'text-[14px] sm:text-[15.5px] font-medium'
                                  : gridCols === 3
                                  ? 'text-[13px] sm:text-[14px] font-medium'
                                  : 'text-[12.5px]'
                              }`}>
                                {formatPrice(prod.price, activeCurrency)}
                              </span>
                              {hasDiscount && (
                                <span className={`line-through text-[#AAAAAA] dark:text-white/40 ${
                                  gridCols === 2 ? 'text-[12px]' : gridCols === 3 ? 'text-[11.5px]' : 'text-[11px]'
                                }`}>
                                  {formatPrice(prod.compareAtPrice, activeCurrency)}
                                </span>
                              )}
                            </div>
                          </div>

                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

        </div>
      </div>

      {/* ================= 5. MOBILE / TABLET FILTER OVERLAY DRAWER ================= */}
      <AnimatePresence>
        {isMobileFilterDrawerOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setIsMobileFilterDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-[85%] max-w-sm h-full bg-white dark:bg-[#0B0A0D] z-10 shadow-2xl flex flex-col overflow-hidden"
            >
              <BluorngFilterSidebar
                activeFilters={activeFilters}
                filterCounts={filterCounts}
                onToggleFilter={handleToggleFilter}
                onClearFilters={handleClearFilters}
                totalMatching={sortedProducts.length}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setIsMobileFilterDrawerOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
