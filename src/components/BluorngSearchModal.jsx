import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { formatPrice } from '../data/bluorngSaudagarData.js';
import { useLegacyProducts, useSearchSuggest } from '../storefront/catalog/hooks';
import { PLACEHOLDER_IMAGE } from '../storefront/catalog/adapter';

export default function BluorngSearchModal({
  isOpen,
  onClose,
  onSelectProduct,
  wishlist = [],
  onToggleWishlist
}) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Focus input automatically on open, clear on close
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
      setIsFocused(false);
    }
  }, [isOpen]);

  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search runs in the database over names, notes, families and collections.
  const navigate = useNavigate();
  const term = query.trim();
  const searching = term.length >= 2;
  const { products: found, total: foundTotal } = useLegacyProducts({ q: term, page_size: 12 }, searching);
  const searchResults = searching ? found : [];
  const resultCount = searching ? foundTotal : 0;
  const { data: suggest } = useSearchSuggest(term);
  const noteMatches = searching ? suggest?.notes ?? [] : [];
  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  const popularSearches = [
    'Oud Extrait',
    'Discovery Coffret',
    'Taif Rose',
    'Deep Canopy',
    'Bergamot',
    'Sandalwood',
    'Ambergris',
    'Solar Citrus'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="search-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          data-lenis-prevent
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex flex-col justify-start"
        >
          {/* Main Search Panel (Slides & Scales In) */}
          <motion.div
            key="search-modal-panel"
            initial={{ opacity: 0, y: -45, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -35, scale: 0.985 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-[#FFFFFF] dark:bg-[#0E0C10] shadow-[0_20px_60px_rgba(0,0,0,0.35)] border-b border-[#EAEAEA] dark:border-white/10 p-5 sm:p-8 lg:p-10 transition-colors duration-300"
          >
            <div className="max-w-[1060px] mx-auto space-y-6">
              
              {/* Header Row: Title & Close Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 90, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-tk-accent dark:text-tk-accent-night text-[10px]"
                  >
                    ✦
                  </motion.span>
                  <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-tk-accent dark:text-tk-accent-night">
                    Search Saudagar Haute Parfumerie
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-block text-[10px] text-[#888888] dark:text-[#777777] uppercase tracking-widest font-mono">
                    ESC to close
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="p-2 text-tk-ink dark:text-white hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors cursor-pointer rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Close search"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                      <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Kinetic Search Bar with Halo Glow & Animated Lens */}
              <div
                className={`relative rounded-xl px-5 py-3.5 sm:py-4 flex items-center transition-all duration-300 border ${
                  isFocused
                    ? 'border-tk-accent dark:border-tk-gold shadow-[0_0_30px_rgba(196,130,63,0.18)] dark:shadow-[0_0_35px_rgba(212,175,55,0.22)] bg-[#FFFFFF] dark:bg-[#16141C]'
                    : 'border-transparent bg-black/[0.04] dark:bg-white/[0.07]'
                }`}
              >
                {/* Animated Magnifying Glass Lens */}
                <motion.div
                  animate={{
                    scale: isFocused ? [1, 1.14, 1] : 1,
                    rotate: isFocused ? [0, -10, 0] : 0
                  }}
                  transition={{ duration: 0.45 }}
                  className={`mr-3.5 transition-colors shrink-0 ${
                    isFocused ? 'text-tk-accent dark:text-tk-accent-night' : 'text-[#888888] dark:text-[#777777]'
                  }`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </motion.div>

                {/* Input Field */}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SEARCH BY FRAGRANCE, NOTE, EXTRACT OR INGREDIENT..."
                  className="w-full bg-transparent text-[14px] sm:text-[17px] font-medium uppercase tracking-wider text-tk-ink dark:text-white outline-none placeholder:text-[#AAAAAA] dark:placeholder:text-[#666666] pr-20"
                />

                {/* Clear Button with Smooth Pop & Rotate */}
                <AnimatePresence>
                  {query && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.75, rotate: -45 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.75, rotate: 45 }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        setQuery('');
                        inputRef.current?.focus();
                      }}
                      className="absolute right-4 px-3 py-1 text-[10.5px] bg-black/[0.08] dark:bg-white/10 hover:bg-black/[0.14] dark:hover:bg-white/20 text-[#444444] dark:text-[#CCCCCC] hover:text-tk-ink dark:hover:text-white uppercase tracking-wider font-bold rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Clear</span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                        <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Cascading Popular Searches Pills */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#888888] dark:text-[#A09D96] font-semibold uppercase tracking-[0.16em]">
                    Trending Formulations & Rare Extraits:
                  </span>
                </div>
                
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.035, delayChildren: 0.08 }
                    }
                  }}
                  className="flex items-center gap-2 flex-wrap text-[11px]"
                >
                  {popularSearches.map((term) => (
                    <motion.button
                      key={term}
                      variants={{
                        hidden: { opacity: 0, y: 8, scale: 0.94 },
                        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } }
                      }}
                      whileHover={{ y: -2, scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setQuery(term);
                        inputRef.current?.focus();
                      }}
                      className={`px-3.5 py-1.5 rounded-full border transition-all duration-300 font-medium tracking-wide uppercase cursor-pointer ${
                        query.toLowerCase() === term.toLowerCase()
                          ? 'bg-tk-ink text-white border-tk-ink dark:bg-tk-gold dark:text-tk-night dark:border-tk-gold shadow-sm'
                          : 'bg-[#F5F5F3] dark:bg-[#18161E] border-transparent text-[#222222] dark:text-[#D4D2CD] hover:border-tk-accent/30 dark:hover:border-tk-gold/30 hover:bg-[#FFFFFF] dark:hover:bg-[#201D28]'
                      }`}
                    >
                      {term}
                    </motion.button>
                  ))}
                </motion.div>
              </div>

              {/* Dynamic Animated Live Search Results */}
              {query.trim() !== '' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="pt-3 border-t border-[#EEEEEE] dark:border-white/10"
                >
                  <div className="flex items-center justify-between mb-4 text-[11.5px] text-[#777777] dark:text-[#A09D96] font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      Results for <span className="text-tk-ink dark:text-white font-bold">"{query}"</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-bold text-tk-accent dark:text-tk-accent-night">
                      {resultCount} {resultCount === 1 ? 'Creation' : 'Creations'} Found
                    </span>
                  </div>

                  {(noteMatches.length > 0 || resultCount > searchResults.length) && (
                    <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px]">
                      {noteMatches.map((n) => (
                        <button
                          key={n.slug}
                          type="button"
                          onClick={() => goTo(`/notes/${n.slug}`)}
                          className="px-3 py-1 rounded-full border border-[#E0DDD5] dark:border-white/15 hover:border-tk-accent dark:hover:border-tk-accent-night text-[#444444] dark:text-[#CCCCCC]"
                        >
                          Note: {n.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => goTo(`/search?q=${encodeURIComponent(term)}`)}
                        className="ml-auto text-tk-accent dark:text-tk-accent-night hover:underline"
                      >
                        See all results →
                      </button>
                    </div>
                  )}

                  {searchResults.length === 0 ? (
                    /* Animated Empty State with Floating Motes & Quick Suggestions */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="py-12 sm:py-16 text-center text-[#777777] dark:text-[#A09D96] flex flex-col items-center justify-center space-y-3"
                    >
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-14 h-14 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-tk-accent dark:text-tk-accent-night mb-1"
                      >
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </motion.div>
                      <p className="text-[14px] font-bold text-tk-ink dark:text-white uppercase tracking-wider">
                        No matching fragrances found
                      </p>
                      <p className="text-[12px] max-w-md font-light leading-relaxed">
                        We could not find an exact match for <span className="font-medium text-tk-ink dark:text-white">"{query}"</span>. Explore our signature agarwood compositions or hydro-distilled floral extraits.
                      </p>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => setQuery('Oud')}
                          className="text-[11px] underline uppercase tracking-wider text-tk-accent dark:text-tk-accent-night font-medium hover:opacity-80 cursor-pointer"
                        >
                          Try "Oud"
                        </button>
                        <span>·</span>
                        <button
                          onClick={() => setQuery('Rose')}
                          className="text-[11px] underline uppercase tracking-wider text-tk-accent dark:text-tk-accent-night font-medium hover:opacity-80 cursor-pointer"
                        >
                          Try "Rose"
                        </button>
                        <span>·</span>
                        <button
                          onClick={() => setQuery('Extrait')}
                          className="text-[11px] underline uppercase tracking-wider text-tk-accent dark:text-tk-accent-night font-medium hover:opacity-80 cursor-pointer"
                        >
                          Try "Extrait"
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* Animated Staggered Results Grid */
                    <motion.div
                      layout
                      data-lenis-prevent
                      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-h-[50vh] overflow-y-auto overscroll-contain pr-2 pb-2 scrollbar-thin"
                    >
                      <AnimatePresence mode="popLayout">
                        {searchResults.map((product, idx) => (
                          <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.92, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            transition={{
                              duration: 0.32,
                              delay: Math.min(idx * 0.035, 0.22),
                              ease: [0.16, 1, 0.3, 1]
                            }}
                            whileHover={{ y: -4, transition: { duration: 0.22 } }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              onClose();
                              onSelectProduct(product.id);
                            }}
                            className="group cursor-pointer border border-[#EEEEEE] dark:border-white/10 p-3 rounded-lg hover:border-tk-accent dark:hover:border-tk-gold transition-all duration-300 bg-[#FFFFFF] dark:bg-[#141318] hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_12px_30px_rgba(212,175,55,0.12)] flex flex-col justify-between"
                          >
                            <div>
                              {/* Flacon Pedestal with Image Zoom */}
                              <div className="w-full aspect-[4/5] bg-[#F8F8F7] dark:bg-[#1A1822] rounded-md overflow-hidden mb-2.5 relative flex items-center justify-center p-3 transition-colors duration-300">
                                <img
                                  src={product.images?.[0] || product.image || PLACEHOLDER_IMAGE}
                                  alt={product.name}
                                  className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.10)] group-hover:scale-108 transition-transform duration-500 ease-out"
                                />

                                {product.badge && (
                                  <span className="absolute top-2 left-2 text-[8px] font-bold tracking-widest uppercase bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night px-2 py-0.5 rounded-full shadow-xs">
                                    {product.badge}
                                  </span>
                                )}

                                {/* Wishlist Bookmark Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleWishlist && onToggleWishlist(product.id);
                                  }}
                                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer bg-white/85 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-tk-ink dark:text-white shadow-xs"
                                  title={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                                  aria-label="Wishlist"
                                >
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    className={wishlist.includes(product.id) ? 'text-tk-accent dark:text-tk-accent-night' : 'text-[#888888] dark:text-white/60'}
                                    fill={wishlist.includes(product.id) ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                  >
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                  </svg>
                                </button>
                              </div>

                              {/* Title with Gold Hover Transition */}
                              <h4 className="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-wider text-tk-ink dark:text-white line-clamp-1 group-hover:text-tk-accent dark:group-hover:text-tk-accent-night transition-colors">
                                {product.name}
                              </h4>

                              {/* Category / Olfactory Family */}
                              <p className="text-[10px] text-[#777777] dark:text-[#A09D96] uppercase tracking-wide mt-0.5 line-clamp-1">
                                {product.category || 'Extrait de Parfum'}
                              </p>
                            </div>

                            {/* Price & View Arrow Row */}
                            <div className="mt-2.5 pt-2 border-t border-[#F0F0F0] dark:border-white/5 flex items-center justify-between">
                              <span className="text-[12px] sm:text-[12.5px] font-bold text-tk-ink dark:text-white">
                                {formatPrice(product.price)}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-tk-accent dark:text-tk-accent-night flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300">
                                <span>Explore</span>
                                <span>→</span>
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.div>
              )}

            </div>
          </motion.div>

          {/* Click Outside Scrim */}
          <div className="flex-1 cursor-pointer" onClick={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
