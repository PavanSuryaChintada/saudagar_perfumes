import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MEGA_MENU_COLLECTIONS } from '../data/bluorngSaudagarData.js';

export default function BluorngHeader({
  cartCount = 0,
  wishlistCount = 0,
  onOpenCart,
  onOpenSearch,
  onOpenStory,
  onOpenNavDrawer,
  onNavigateHome,
  onNavigateCollection,
  onScrollToStores,
  onOpenAccount,
  isHomePage = true
}) {
  const [isPastHero, setIsPastHero] = useState(false);
  const [isCollectionsHovered, setIsCollectionsHovered] = useState(false);

  // Monitor scroll position relative to the hero section on the homepage
  useEffect(() => {
    if (!isHomePage) {
      setIsPastHero(true);
      return;
    }

    const checkScroll = () => {
      const heroEl = document.getElementById('hero-section');
      if (!heroEl) {
        setIsPastHero(window.scrollY > 200);
        return;
      }
      const rect = heroEl.getBoundingClientRect();
      // When hero bottom reaches or scrolls above the header height (68px)
      setIsPastHero(rect.bottom <= 70);
    };

    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [isHomePage]);

  // When inside hero and not hovering the mega menu, keep navbar transparent with white text
  const isTransparent = isHomePage && !isPastHero && !isCollectionsHovered;

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseLeave={() => setIsCollectionsHovered(false)}
      style={{
        backgroundColor: isTransparent ? 'transparent' : '#ffffff',
      }}
      className={`sticky top-0 z-50 w-full select-none transition-colors duration-300 relative ${
        isTransparent
          ? 'text-white'
          : 'bg-white text-[#111111] shadow-xs border-b border-black/5'
      }`}
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 h-[60px] sm:h-[68px] relative flex items-stretch justify-between">
        
        {/* ================= LEFT ZONE (Mobile Hamburger / Desktop Nav Links) ================= */}
        <div className="flex items-stretch z-10 h-full self-stretch">
          {/* Mobile Hamburger Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={onOpenNavDrawer}
              className={`p-2 -ml-2 transition-colors ${
                isTransparent ? 'text-white hover:text-[#C4823F]' : 'text-[#111111] hover:text-[#C4823F]'
              }`}
              aria-label="Open Navigation Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
                <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
                <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-stretch gap-7 text-[12px] font-semibold tracking-[0.14em] uppercase h-full self-stretch">
            {/* New In */}
            <button
              onClick={() => onNavigateCollection('new-in')}
              className={`transition-colors h-full flex items-center px-1 relative group ${
                isTransparent ? 'text-white hover:text-[#C4823F]' : 'text-[#111111] hover:text-[#C4823F]'
              }`}
            >
              <span>New in</span>
              <span
                className={`absolute bottom-0 left-0 w-0 h-[2.5px] transition-all duration-300 group-hover:w-full ${
                  isTransparent ? 'bg-white' : 'bg-[#111111]'
                }`}
              ></span>
            </button>

            {/* Collections Trigger */}
            <div
              className="h-full flex items-stretch relative"
              onMouseEnter={() => setIsCollectionsHovered(true)}
            >
              <button
                onClick={() => onNavigateCollection('all')}
                className={`transition-colors h-full flex items-center gap-1.5 px-1 relative group ${
                  isCollectionsHovered
                    ? 'text-[#C4823F]'
                    : isTransparent
                    ? 'text-white hover:text-[#C4823F]'
                    : 'text-[#111111] hover:text-[#C4823F]'
                }`}
              >
                <span>Collections</span>
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className={`transition-transform duration-200 ${isCollectionsHovered ? 'rotate-180' : ''}`}
                >
                  <path d="M1 1L5 5L9 1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {/* Active Underline sitting flush at the bottom edge of the header */}
                <span
                  className={`absolute bottom-0 left-0 right-0 h-[2.5px] z-20 transition-all duration-200 ${
                    isTransparent ? 'bg-white' : 'bg-[#111111]'
                  } ${
                    isCollectionsHovered ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                  }`}
                ></span>

                {/* Downward connecting caret pointing into mega menu */}
                {isCollectionsHovered && (
                  <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#111111] rotate-45 z-30 pointer-events-none"></div>
                )}
              </button>
            </div>
          </nav>
        </div>

        {/* ================= CENTER ZONE: MATHEMATICALLY PERFECTLY CENTERED ================= */}
        <div
          onClick={onNavigateHome}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center cursor-pointer select-none"
        >
          <span
            className={`font-sans font-black tracking-[0.24em] text-[20px] sm:text-[24px] uppercase transition-colors duration-300 block leading-none ${
              isTransparent ? 'text-white hover:text-white/85' : 'text-[#111111] hover:opacity-85'
            }`}
          >
            SAUDAGAR
          </span>
          <span
            className={`hidden sm:block font-script text-[14px] sm:text-[16px] lowercase tracking-normal -mt-0.5 transition-colors duration-300 ${
              isTransparent ? 'text-[#ECC86A]' : 'text-[#C4823F]'
            }`}
          >
            haute parfumerie
          </span>
        </div>

        {/* ================= RIGHT ZONE: ACTION ICONS ================= */}
        <div className="flex items-center gap-3 sm:gap-5 z-10">
          
          {/* Stories Reel Icon Button */}
          <button
            onClick={onOpenStory}
            className={`hidden sm:flex items-center justify-center p-2 rounded-xs transition-all relative group ${
              isTransparent
                ? 'text-white hover:text-[#C4823F] hover:bg-white/10'
                : 'text-[#111111] hover:text-[#C4823F] hover:bg-black/5'
            }`}
            title="Watch Fragrance Stories"
            aria-label="Watch Fragrance Stories"
          >
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#C4823F] animate-ping"></span>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
            </svg>
          </button>

          {/* Stores Pin Icon Button */}
          <button
            onClick={onScrollToStores}
            className={`hidden sm:flex items-center justify-center p-2 rounded-xs transition-all ${
              isTransparent
                ? 'text-white hover:text-[#C4823F] hover:bg-white/10'
                : 'text-[#111111] hover:text-[#C4823F] hover:bg-black/5'
            }`}
            title="Walk-in Boutiques"
            aria-label="Walk-in Boutiques"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </button>

          {/* Search Icon Button */}
          <button
            onClick={onOpenSearch}
            className={`p-2 rounded-xs transition-all ${
              isTransparent
                ? 'text-white hover:text-[#C4823F] hover:bg-white/10'
                : 'text-[#111111] hover:text-[#C4823F] hover:bg-black/5'
            }`}
            title="Search Fragrances"
            aria-label="Search Fragrances"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
            </svg>
          </button>

          {/* Account Profile Button */}
          <button
            onClick={onOpenAccount}
            className={`hidden sm:flex p-2 rounded-xs transition-all ${
              isTransparent
                ? 'text-white hover:text-[#C4823F] hover:bg-white/10'
                : 'text-[#111111] hover:text-[#C4823F] hover:bg-black/5'
            }`}
            title="Customer Account"
            aria-label="Customer Account"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>

          {/* Wishlist Bookmark Button with Badge */}
          <button
            onClick={() => onNavigateCollection('wishlist')}
            className={`relative p-2 rounded-xs transition-all ${
              isTransparent
                ? 'text-white hover:text-[#C4823F] hover:bg-white/10'
                : 'text-[#111111] hover:text-[#C4823F] hover:bg-black/5'
            }`}
            title="Wishlist"
            aria-label="Wishlist"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#C4823F] text-white text-[9px] font-bold rounded-xs flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon / Cart (N) link */}
          <button
            onClick={onOpenCart}
            className={`flex items-center gap-1.5 p-2 rounded-xs transition-all ${
              isTransparent
                ? 'text-white hover:text-[#C4823F] hover:bg-white/10'
                : 'text-[#111111] hover:text-[#C4823F] hover:bg-black/5'
            }`}
            aria-label={`Shopping Cart (${cartCount})`}
          >
            <span className="text-[11.5px] font-bold tracking-wider uppercase hidden md:inline">
              Cart ({cartCount})
            </span>
            <div className="relative">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 1.45 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="md:hidden absolute -top-1 -right-1 w-4 h-4 bg-[#C4823F] text-white text-[9px] font-bold rounded-xs flex items-center justify-center shadow-xs"
                >
                  {cartCount}
                </motion.span>
              )}
            </div>
          </button>

          {/* 2-Bar Side Navigation Drawer Toggle */}
          <button
            onClick={onOpenNavDrawer}
            className={`hidden lg:flex flex-col justify-center items-center gap-1.5 w-8 h-8 rounded transition-colors p-1 ${
              isTransparent ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
            title="Menu Drawer"
            aria-label="Menu Drawer"
          >
            <span
              className={`w-5 h-[1.8px] rounded-full transition-colors ${
                isTransparent ? 'bg-white' : 'bg-[#111111]'
              }`}
            ></span>
            <span
              className={`w-5 h-[1.8px] rounded-full transition-colors ${
                isTransparent ? 'bg-white' : 'bg-[#111111]'
              }`}
            ></span>
          </button>
        </div>

      </div>

      {/* ================= MEGA MENU WITH LUXURY FADE & SLIDE ================= */}
      <AnimatePresence>
        {isCollectionsHovered && (
          <>
            {/* Dark Dim Backdrop Over the Rest of the Page to Eliminate Clashing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsCollectionsHovered(false)}
              className="fixed inset-0 top-[60px] sm:top-[68px] bg-black/45 backdrop-blur-xs z-40 pointer-events-auto"
            />

            {/* Solid Pure White Mega Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => setIsCollectionsHovered(true)}
              onMouseLeave={() => setIsCollectionsHovered(false)}
              style={{ backgroundColor: '#ffffff' }}
              className="absolute left-0 right-0 top-full -mt-[1px] w-full bg-white border-b border-[#E5E5E5] text-[#111111] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] pt-5 pb-7 px-4 sm:px-6 md:px-8 lg:px-10 z-50 pointer-events-auto"
            >
            <div className="w-full">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/5 text-[11px] tracking-widest text-[#777777]">
                <span>EXPLORE CURATED COLLECTIONS</span>
                <button
                  onClick={() => {
                    setIsCollectionsHovered(false);
                    onNavigateCollection('all');
                  }}
                  className="text-[#111111] font-bold hover:text-[#C4823F] transition-colors cursor-pointer"
                >
                  VIEW ALL COLLECTIONS →
                </button>
              </div>
              
              <div className="grid grid-cols-6 gap-5">
                {MEGA_MENU_COLLECTIONS.map((col) => (
                  <div
                    key={col.id}
                    onClick={() => {
                      setIsCollectionsHovered(false);
                      onNavigateCollection(col.slug);
                    }}
                    className="group cursor-pointer flex flex-col"
                  >
                    <div className="w-full aspect-[4/5] bg-[#F5F5F3] overflow-hidden rounded-xs border border-black/5 mb-2.5">
                      <img
                        src={col.image}
                        alt={col.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-[11.5px] font-semibold tracking-wider text-[#111111] uppercase group-hover:text-[#C4823F] transition-colors leading-tight">
                      {col.title}
                    </p>
                    <span className="text-[10px] text-[#888888] font-normal tracking-wide mt-0.5">
                      {col.count} Fragrances
                    </span>
                  </div>
                ))}
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
