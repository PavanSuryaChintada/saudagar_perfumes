import React, { useState, useEffect, useMemo } from 'react';
import { suggestListing } from '../lib/searchListing';
import { useBlock } from '../cms/useSite';
import PageNav from '../storefront/PageNav.jsx';
import { useSEO } from '../lib/seo';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { formatINR as formatPrice } from '../lib/money';
import BluorngCollectionHero from './BluorngCollectionHero.jsx';
import BluorngFilterSidebar from './BluorngFilterSidebar.jsx';
import { useCategory, useCollection, useNote } from '../storefront/catalog/hooks';
import { useListing } from '../storefront/catalog/useListing';
import { optionLabel } from '../storefront/catalog/listing';
import { PLACEHOLDER_IMAGE } from '../storefront/catalog/adapter';
import ListingBanner from '../storefront/ListingBanner.jsx';
import SortMenu from '../storefront/catalog/SortMenu.jsx';
import { CmsSections } from '../cms/SectionRenderer';
import { SectionContext } from '../cms/SectionContext';
import ServiceDown from './ServiceDown';

const LISTING_PAGE_DEFAULT = [
  { id: 'd1', type: 'listing_header', config: {} },
  { id: 'd2', type: 'listing_grid', config: {} },
];
const LISTING_REQUIRED = ['listing_header', 'listing_grid'];
import ListingHeader from '../storefront/ListingHeader.jsx';
import NotFoundPage from '../storefront/NotFoundPage';


/**
 * One listing for every catalogue view: a collection (with its hero film), the whole shop, a category,
 * a note, or search results. Products, filters and counts come from the database; filters live in the URL.
 */
export default function BluorngCollectionPage({
  initialCategory = 'signature',
  listing = null,
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  onNavigateHome,
  onNavigateCollection
}) {
  const navigate = useNavigate();
  const isCollection = !listing;
  const isAll = isCollection && initialCategory === 'all';
  const collectionQuery = useCollection(isCollection ? (isAll ? 'signature' : initialCategory) : undefined);
  const collection = collectionQuery.data;
  const categoryQuery = useCategory(listing?.kind === 'category' ? listing.slug : undefined);
  const noteQuery = useNote(listing?.kind === 'note' ? listing.slug : undefined);

  const ctx = useMemo(() => {
    if (listing?.kind === 'category') return { category: listing.slug };
    if (listing?.kind === 'note') return { note: listing.slug };
    if (isCollection && !isAll) return { collection: initialCategory };
    return {};
  }, [listing?.kind, listing?.slug, isCollection, isAll, initialCategory]);

  const {
    filters, sections, activeFilters, counts, totalActive, products, total, isLoading, error: listError,
    toggle, clear, sort, setSort, page, pageCount, setPage, setQuery, setPriceRange, priceSpan
  } = useListing(ctx);
  // A price range typed by the shopper that isn't one of the ready-made bands also shows as a chip.
  const customPrice = (filters.min !== undefined || filters.max !== undefined) && !(activeFilters.price?.length)
    ? `${filters.min !== undefined ? `₹${filters.min.toLocaleString('en-IN')}` : 'Any'} – ${filters.max !== undefined ? `₹${filters.max.toLocaleString('en-IN')}` : 'any'}`
    : null;
  const filterCount = totalActive + (customPrice ? 1 : 0);

  const narrowed = isCollection ? !isAll : listing.kind !== 'shop';
  const scopeName = isCollection
    ? isAll ? 'All Fragrances' : collection?.name || ''
    : listing.kind === 'category' ? categoryQuery.data?.name || ''
    : listing.kind === 'note' ? noteQuery.data?.name || ''
    : listing.kind === 'search' ? (filters.q ? `“${filters.q}”` : 'Search') : 'All Fragrances';

  // Words on Google: the admin's own for this category or collection, else the same automatic words the admin previews.
  const brandBlock = useBlock('brand');
  const siteName = brandBlock?.name || 'Saudagar Perfumers';
  const own = isCollection ? collection : listing.kind === 'category' ? categoryQuery.data : null;
  const auto = isCollection && !isAll && collection
    ? suggestListing({ kind: 'collection', name: collection.name, summary: collection.tagline, body: collection.descriptor, siteName })
    : listing?.kind === 'category' && categoryQuery.data
      ? suggestListing({ kind: 'category', name: categoryQuery.data.name, body: categoryQuery.data.description, siteName })
      : listing?.kind === 'note' && noteQuery.data
        ? suggestListing({ kind: 'note', name: noteQuery.data.name, body: noteQuery.data.description, siteName })
        : null;
  useSEO({
    title: own?.seo_title || auto?.title || (scopeName ? scopeName.replace(/[“”]/g, '') : null),
    description: own?.seo_description || auto?.description || null,
    noindex: listing?.kind === 'search',
  });

  const [hoveredCardId, setHoveredCardId] = useState(null);

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
    } catch {
      // storage unavailable; the choice just isn't remembered
    }
  };

  const handleSwitchCollection = (slug) => {
    if (onNavigateCollection) onNavigateCollection(slug);
  };

  const browseAll = () => (onNavigateCollection ? onNavigateCollection('all') : navigate('/shop'));

  const missing =
    (isCollection && !isAll && collectionQuery.isSuccess && !collection) ||
    (listing?.kind === 'category' && categoryQuery.isSuccess && !categoryQuery.data) ||
    (listing?.kind === 'note' && noteQuery.isSuccess && !noteQuery.data);
  if (missing) {
    return <NotFoundPage onNavigateHome={onNavigateHome} onNavigateCollection={onNavigateCollection} />;
  }

  const showFilmHero = isCollection && (isAll || collection?.hero_video_url || collection?.hero_poster_url);
  const header = showFilmHero ? (
    <BluorngCollectionHero activeCollectionId={isAll ? 'signature' : collection?.slug || initialCategory} onSwitchCollection={handleSwitchCollection} />
  ) : isCollection ? (
    collection?.image_url ? (
      <ListingBanner eyebrow="Collection" title={collection?.headline || collection?.name} description={collection?.descriptor || collection?.tagline} image={collection.image_url} />
    ) : (
      <ListingHeader eyebrow="Collection" title={collection?.headline || collection?.name} description={collection?.descriptor || collection?.tagline} />
    )
  ) : listing.kind === 'category' ? (
    categoryQuery.data?.image_url || categoryQuery.data?.video_url ? (
      <ListingBanner
        eyebrow="Category"
        title={categoryQuery.data.name}
        description={categoryQuery.data.description}
        image={categoryQuery.data.image_url}
        video={categoryQuery.data.video_url}
      />
    ) : (
      <ListingHeader eyebrow="Category" title={categoryQuery.data?.name} description={categoryQuery.data?.description} />
    )
  ) : listing.kind === 'note' ? (
    <ListingHeader
      eyebrow={noteQuery.data?.family ? `Note · ${noteQuery.data.family}` : 'Note'}
      title={noteQuery.data?.name}
      description={noteQuery.data?.description || `Every Saudagar fragrance with ${noteQuery.data?.name || 'this note'}.`}
      image={noteQuery.data?.image}
    />
  ) : listing.kind === 'search' ? (
    <ListingHeader eyebrow="Search" title={filters.q ? `Results for “${filters.q}”` : 'Search the collection'} search={filters.q || ''} onSearch={setQuery} />
  ) : (
    <ListingHeader eyebrow="The Collection" title="All Fragrances" description="Every Saudagar creation in one place." />
  );

  return (
    <div className="w-full min-h-screen font-sans select-none pb-12 bg-[#FFFFFF] dark:bg-tk-night text-tk-ink dark:text-white transition-colors duration-300">
      
      {/* ================= 1. CINEMATIC HERO (Video & Collection Identity) ================= */}
      <SectionContext.Provider
        value={{
          listing: {
            header,
            grid: (
              <>

      {/* ================= 2. CLEAN MINIMAL TOOLBAR ================= */}
      <div id="catalog-section" className="w-full px-4 sm:px-8 lg:px-12 pt-10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[12.5px] pb-3 border-b border-[#EAEAEA] dark:border-white/10">
          
          {/* Left: Product Count & Filter Sidebar Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Desktop Left Sidebar Toggle */}
            <button
              type="button"
              onClick={() => setIsDesktopFilterOpen(!isDesktopFilterOpen)}
              className="hidden lg:inline-flex items-center gap-2 h-10 px-3.5 border border-[#D5D2CA] dark:border-white/20 bg-white dark:bg-[#141318] text-[13px] font-semibold text-tk-ink dark:text-white hover:border-tk-ink dark:hover:border-white rounded-[2px] transition-colors cursor-pointer"
              title={isDesktopFilterOpen ? 'Hide filters' : 'Show filters'}
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
              <span>{isDesktopFilterOpen ? 'Hide filters' : 'Show filters'}</span>
              <AnimatePresence>
                {filterCount > 0 && (
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [1.25, 1], opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="min-w-[20px] h-5 px-1 rounded-[2px] bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night text-[12px] font-bold flex items-center justify-center"
                  >
                    {filterCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile / Tablet Filter Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setIsMobileFilterDrawerOpen(true)}
              className="flex lg:hidden items-center gap-2 h-10 px-3.5 border border-[#D5D2CA] dark:border-white/20 bg-white dark:bg-[#141318] text-[13px] font-semibold text-tk-ink dark:text-white rounded-[2px] cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filters</span>
              <AnimatePresence>
                {filterCount > 0 && (
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [1.25, 1], opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="min-w-[20px] h-5 px-1 rounded-[2px] bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night text-[12px] font-bold flex items-center justify-center"
                  >
                    {filterCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <span className="hidden sm:inline opacity-30 text-[#666666]">|</span>

            {/* Animated Product Counter & Live Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center text-[14px] font-medium text-tk-ink dark:text-white">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={total}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block tabular-nums font-semibold"
                  >
                    {total}
                  </motion.span>
                </AnimatePresence>
                <span className="ml-1">perfume{total === 1 ? '' : 's'}</span>
              </div>
              {narrowed && scopeName && (
                <span className="text-[13px] text-[#5F5F5F] dark:text-[#A09D96] hidden md:inline">
                  in {scopeName}
                </span>
              )}
              {totalActive > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-1.5 h-1.5 rounded-full bg-tk-accent dark:bg-tk-accent-night animate-pulse"
                  title="Filtered results active"
                />
              )}
            </div>
          </div>

          {/* Right: Quick Scope & Sort */}
          <div className="flex items-center gap-5">
            {/* Switch to All Collections Shortcut if currently narrowed */}
            {narrowed && (
              <button
                type="button"
                onClick={browseAll}
                className="hidden md:inline-block text-[13px] font-medium text-tk-accent-ink dark:text-tk-accent-night hover:underline underline-offset-4 cursor-pointer"
              >
                See all perfumes →
              </button>
            )}

            {/* Sort */}
            <SortMenu value={sort} onChange={setSort} />

            {/* Subtle Divider */}
            <span className="hidden md:inline-block w-[1px] h-4 bg-[#E0DDD5] dark:bg-white/15" />

            {/* Grid Density Switcher (2, 3, or 4 Products per row); phones always show two per row */}
            <div className="hidden md:flex items-center gap-1 bg-[#F5F4F0] dark:bg-[#1A1820] p-0.5 sm:p-1 rounded-md border border-[#E0DDD5] dark:border-white/10 select-none">
              <button
                type="button"
                onClick={() => handleSwitchGrid(2)}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-[2px] text-[12px] font-medium transition-all cursor-pointer ${
                  gridCols === 2
                    ? 'bg-white dark:bg-[#25222E] text-tk-ink dark:text-tk-accent-night shadow-xs'
                    : 'text-[#666666] dark:text-[#88857F] hover:text-tk-ink dark:hover:text-white'
                }`}
                title="Two products per row (Large Editorial View)"
                aria-label="2 Columns"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="2" width="5" height="12" rx="0.5" fill={gridCols === 2 ? 'currentColor' : 'none'} />
                  <rect x="9" y="2" width="5" height="12" rx="0.5" fill={gridCols === 2 ? 'currentColor' : 'none'} />
                </svg>
                <span className="font-mono text-[12px]">2</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchGrid(3)}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-[2px] text-[12px] font-medium transition-all cursor-pointer ${
                  gridCols === 3
                    ? 'bg-white dark:bg-[#25222E] text-tk-ink dark:text-tk-accent-night shadow-xs'
                    : 'text-[#666666] dark:text-[#88857F] hover:text-tk-ink dark:hover:text-white'
                }`}
                title="Three products per row (Balanced Gallery View)"
                aria-label="3 Columns"
              >
                <svg width="13" height="12" viewBox="0 0 17 16" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="1.5" y="2" width="3.5" height="12" rx="0.4" fill={gridCols === 3 ? 'currentColor' : 'none'} />
                  <rect x="6.75" y="2" width="3.5" height="12" rx="0.4" fill={gridCols === 3 ? 'currentColor' : 'none'} />
                  <rect x="12" y="2" width="3.5" height="12" rx="0.4" fill={gridCols === 3 ? 'currentColor' : 'none'} />
                </svg>
                <span className="font-mono text-[12px]">3</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchGrid(4)}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-[2px] text-[12px] font-medium transition-all cursor-pointer ${
                  gridCols === 4
                    ? 'bg-white dark:bg-[#25222E] text-tk-ink dark:text-tk-accent-night shadow-xs'
                    : 'text-[#666666] dark:text-[#88857F] hover:text-tk-ink dark:hover:text-white'
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
                <span className="font-mono text-[12px]">4</span>
              </button>
            </div>
          </div>

        </div>

        {/* ================= ACTIVE FILTER TAGS PILL ROW (ANIMATED) ================= */}
        <AnimatePresence>
          {filterCount > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-2 pt-3 pb-1 overflow-hidden"
            >
              <span className="text-[12.5px] font-semibold text-[#3F3F3F] dark:text-white/70 mr-1">
                Filtered by:
              </span>
              {customPrice && (
                <button
                  type="button"
                  onClick={() => setPriceRange(undefined, undefined)}
                  className="group inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] rounded-[2px] bg-[#F5F3EE] dark:bg-[#1A1820] hover:bg-[#ECE9E1] dark:hover:bg-[#25222E] text-tk-ink dark:text-white border border-[#D5D2CA] dark:border-white/15 cursor-pointer"
                  title="Remove price range"
                >
                  {customPrice}
                  <span aria-hidden className="text-[14px] leading-none">×</span>
                </button>
              )}
              <AnimatePresence mode="popLayout">
                {Object.entries(activeFilters).flatMap(([sectionId, optionIds]) =>
                  optionIds.map((optId) => {
                    const label = optionLabel(sections, sectionId, optId);
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
                        onClick={() => toggle(sectionId, optId)}
                        className="group inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] rounded-[2px] bg-[#F5F3EE] dark:bg-[#1A1820] hover:bg-[#ECE9E1] dark:hover:bg-[#25222E] text-tk-ink dark:text-white border border-[#D5D2CA] dark:border-white/15 transition-colors cursor-pointer"
                        title={`Remove ${label}`}
                      >
                        <span>{label}</span>
                        <span className="text-[12.5px] font-bold text-[#666666] group-hover:text-tk-ink dark:group-hover:text-white leading-none transition-transform group-hover:rotate-90 duration-200">
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
                onClick={clear}
                className="text-[12.5px] font-semibold text-tk-accent-ink dark:text-tk-accent-night underline underline-offset-4 hover:opacity-80 transition-opacity ml-2 cursor-pointer"
              >
                Clear all
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
                sections={sections}
                activeFilters={activeFilters}
                filterCounts={counts}
                onToggleFilter={toggle}
                onClearFilters={clear}
                onSetPriceRange={setPriceRange}
                priceMin={filters.min}
                priceMax={filters.max}
                priceSpan={priceSpan}
                totalMatching={total}
              />
            </aside>
          )}

          {/* ================= PRODUCT GRID AREA ================= */}
          <main className="flex-1 min-w-0 w-full">
            <AnimatePresence mode="wait">
              {listError && products.length === 0 ? (
                <ServiceDown key="down" inline />
              ) : isLoading && products.length === 0 ? (
                <div key="loading" className="py-24 text-center text-[12.5px] text-[#666666]" aria-busy="true">Loading fragrances…</div>
              ) : products.length === 0 ? (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="py-24 text-center border border-dashed border-[#E5E5E5] dark:border-white/15 rounded-lg p-8"
                >
                  <p className="font-serif text-[19px] sm:text-[22px] text-tk-ink dark:text-white">
                    {totalActive > 0 ? 'No flacons match your refined filter combination.' : 'Nothing here yet.'}
                  </p>
                  <p className="text-[12.5px] text-[#5F5F5F] dark:text-[#A09D96] mt-2 max-w-md mx-auto font-normal leading-relaxed">
                    {totalActive > 0
                      ? 'Try unchecking some notes, intensity levels or occasions to see more of the collection.'
                      : 'New fragrances are added here regularly. Explore the full collection in the meantime.'}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      type="button"
                      onClick={clear}
                      className="px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] rounded-sm bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night hover:bg-tk-accent dark:hover:bg-tk-accent-night transition-colors cursor-pointer shadow-sm"
                    >
                      Reset All Filters
                    </button>
                    {narrowed && (
                      <button
                        type="button"
                        onClick={browseAll}
                        className="px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] rounded-sm border border-[#CCCCCC] dark:border-white/20 text-tk-ink dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
                      ? 'grid-cols-2'
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
                    {products.map((prod, index) => {
                      const isWish = wishlist.includes(prod.id);
                      const isHovered = hoveredCardId === prod.id;
                      const hasDiscount = prod.compareAtPrice && prod.compareAtPrice > prod.price;
                      const isSale = prod.badge?.toLowerCase().includes('sale') || hasDiscount;
                      const image = prod.images?.[0] || prod.image || PLACEHOLDER_IMAGE;

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
                          <div className={`w-full aspect-square rounded-[2px] relative flex items-center justify-center overflow-hidden bg-[#F8F7F5] dark:bg-[#141318] group-hover:bg-[#F2EFEA] dark:group-hover:bg-[#1C1A22] transition-all duration-400 group-hover:scale-[1.01] ${
                            gridCols === 2 ? 'p-5 sm:p-14' : gridCols === 3 ? 'p-6 sm:p-10' : 'p-6 sm:p-8'
                          }`}>
                            {/* Badge */}
                            {(isSale || prod.badge) && (
                              <div className="absolute top-3 left-3 z-10">
                                <span className="text-[11.5px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-[2px] bg-white/85 dark:bg-white/10 text-[#666666] dark:text-white/80">
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
                              className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-[2px] flex items-center justify-center transition-all duration-200 cursor-pointer bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-tk-ink dark:text-white ${
                                isWish ? 'text-tk-accent-ink dark:text-tk-accent-night' : 'text-[#707070]'
                              }`}
                              title={isWish ? 'Remove from wishlist' : 'Save to wishlist'}
                              aria-label="Wishlist"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                className={isWish ? 'text-tk-accent-ink dark:text-tk-accent-night' : 'text-tk-ink dark:text-white'}
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
                                className="w-full py-2.5 text-[12px] uppercase tracking-[0.16em] font-medium rounded-[2px] shadow-lg transition-all duration-300 cursor-pointer bg-tk-ink/95 text-white hover:bg-tk-accent dark:bg-tk-gold dark:text-tk-night dark:hover:bg-tk-accent-night backdrop-blur-md flex items-center justify-center gap-1.5"
                              >
                                <span>+ Quick Add</span>
                              </button>
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="pt-3 flex flex-col">
                            <h3 className={`font-normal leading-[1.4] min-h-[2.8em] line-clamp-2 transition-colors text-tk-ink dark:text-white group-hover:text-tk-accent dark:group-hover:text-tk-accent-night ${
                              gridCols === 2
                                ? 'text-[15px] sm:text-[17px]'
                                : gridCols === 3
                                ? 'text-[14px] sm:text-[15px]'
                                : 'text-[13px] sm:text-[13.5px]'
                            }`}>
                              {prod.name}
                            </h3>

                            <p className={`mt-0.5 line-clamp-1 font-normal text-[#666666] dark:text-[#A09D96] ${
                              gridCols === 2 ? 'text-[12.5px] sm:text-[12.5px]' : gridCols === 3 ? 'text-[12px]' : 'text-[12px]'
                            }`}>
                              {gridCols === 2 && prod.notes
                                ? [ ...(prod.notes?.heart || []), ...(prod.notes?.top || []) ].slice(0, 3).join(' · ') || (prod.category || 'Extrait de Parfum')
                                : gridCols === 3 && prod.notes
                                ? [ ...(prod.notes?.heart || []), ...(prod.notes?.top || []) ].slice(0, 2).join(' · ') || (prod.category || 'Extrait de Parfum')
                                : prod.notes?.heart?.[0] || prod.notes?.top?.[0] || prod.concentration?.split('·')[0] || 'Extrait de Parfum'
                              }
                            </p>

                            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 mt-1.5 text-[12.5px]">
                              <span className={`font-normal text-tk-ink dark:text-white ${
                                gridCols === 2
                                  ? 'text-[14px] sm:text-[15.5px] font-medium'
                                  : gridCols === 3
                                  ? 'text-[13px] sm:text-[14px] font-medium'
                                  : 'text-[12.5px]'
                              }`}>
                                {formatPrice(prod.price)}
                              </span>
                              {hasDiscount && (
                                <span className={`line-through text-[#707070] dark:text-white/60 ${
                                  gridCols === 2 ? 'text-[12.5px]' : gridCols === 3 ? 'text-[12px]' : 'text-[12px]'
                                }`}>
                                  {formatPrice(prod.compareAtPrice)}
                                </span>
                              )}
                              {hasDiscount && (
                                <span className="text-[12px] font-medium text-tk-accent-ink dark:text-tk-accent-night">
                                  {Math.round((1 - prod.price / prod.compareAtPrice) * 100)}% off
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

            <PageNav page={page} pageCount={pageCount} label="Product pages" onPage={setPage} />
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
              className="relative w-[85%] max-w-sm h-full bg-white dark:bg-tk-night z-10 shadow-2xl flex flex-col overflow-hidden"
            >
              <BluorngFilterSidebar
                sections={sections}
                activeFilters={activeFilters}
                filterCounts={counts}
                onToggleFilter={toggle}
                onClearFilters={clear}
                onSetPriceRange={setPriceRange}
                priceMin={filters.min}
                priceMax={filters.max}
                priceSpan={priceSpan}
                totalMatching={total}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setIsMobileFilterDrawerOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

              </>
            ),
          },
        }}
      >
        {/* Admin → Pages → Category & collection pages decides what sits above and below these two. */}
        <CmsSections slug="listing-page" fallback={LISTING_PAGE_DEFAULT} ensure={LISTING_REQUIRED} />
      </SectionContext.Provider>
    </div>
  );
}
