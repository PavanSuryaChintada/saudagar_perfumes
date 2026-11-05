import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BluorngFullscreenMegaNav from './BluorngFullscreenMegaNav.jsx';
import { useSmoothScroll } from './motion/SmoothScrollProvider.jsx';
import { MEGA_MENU_COLLECTIONS } from '../data/bluorngSaudagarData.js';

export default function BluorngHeader({
  cartCount = 0,
  wishlistCount = 0,
  theme = 'dark',
  onToggleTheme,
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaNavOpen, setIsMegaNavOpen] = useState(false);
  const { lenis } = useSmoothScroll();

  // Monitor scroll: transparent initially, changes color after movement (scrollY > 35)
  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      const y = window.scrollY || (lenis ? lenis.scroll : 0) || document.documentElement.scrollTop || 0;
      setIsScrolled(y > 35);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    if (lenis) {
      lenis.on('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (lenis) {
        lenis.off('scroll', handleScroll);
      }
    };
  }, [isHomePage, lenis]);

  // Transparent initially on homepage only when in dark theme; switches to crisp ivory canvas in light theme
  const isTransparent = isHomePage && !isScrolled && !isMegaNavOpen && theme === 'dark';

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 w-full select-none transition-all duration-300 relative ${
        isTransparent
          ? 'bg-transparent text-white'
          : theme === 'dark'
            ? 'bg-[#0B0A0D]/95 backdrop-blur-md shadow-xs text-white'
            : 'bg-white/95 backdrop-blur-md shadow-xs text-[#111111]'
      }`}
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 h-[60px] sm:h-[68px] relative flex items-stretch justify-between">
        
        {/* ================= LEFT ZONE (Mobile Hamburger / Desktop Nav Links) ================= */}
        <div className="flex items-stretch z-10 h-full self-stretch">
          {/* Mobile Hamburger Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMegaNavOpen(true)}
              className="p-2 -ml-2 transition-colors cursor-pointer hover:opacity-75"
              aria-label="Open Navigation Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
                <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
                <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Desktop Nav Links - Clean & Minimal */}
          <nav className="hidden lg:flex items-stretch gap-8 text-[12px] font-normal tracking-[0.06em] uppercase h-full self-stretch">
            {/* Collections Trigger -> Opens Fullscreen Mega Nav */}
            <button
              onClick={() => setIsMegaNavOpen(true)}
              className={`transition-colors h-full flex items-center gap-1.5 cursor-pointer ${
                isTransparent || theme === 'dark' ? 'hover:text-[#ECC86A]' : 'hover:text-[#C4823F]'
              }`}
            >
              <span>Collections</span>
              <svg
                width="9"
                height="5"
                viewBox="0 0 10 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`transition-transform duration-200 ${isMegaNavOpen ? 'rotate-180' : ''}`}
              >
                <path d="M1 1L5 5L9 1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Signature */}
            <button
              onClick={() => onNavigateCollection('signature')}
              className={`transition-colors h-full flex items-center cursor-pointer ${
                isTransparent || theme === 'dark' ? 'hover:text-[#ECC86A]' : 'hover:text-[#C4823F]'
              }`}
            >
              <span>Signature</span>
            </button>

            {/* Royal */}
            <button
              onClick={() => onNavigateCollection('royal')}
              className={`transition-colors h-full flex items-center cursor-pointer ${
                isTransparent || theme === 'dark' ? 'hover:text-[#ECC86A]' : 'hover:text-[#C4823F]'
              }`}
            >
              <span>Royal</span>
            </button>

            {/* Exotic */}
            <button
              onClick={() => onNavigateCollection('exotic')}
              className={`transition-colors h-full flex items-center cursor-pointer ${
                isTransparent || theme === 'dark' ? 'hover:text-[#ECC86A]' : 'hover:text-[#C4823F]'
              }`}
            >
              <span>Exotic</span>
            </button>
          </nav>
        </div>

        {/* ================= CENTER ZONE: MATHEMATICALLY PERFECTLY CENTERED ================= */}
        <div
          onClick={onNavigateHome}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center cursor-pointer select-none py-1 flex items-center justify-center"
        >
          <img
            src={
              isTransparent
                ? '/images/saudagar_logo_white.png'
                : theme === 'dark'
                  ? '/images/saudagar_logo_gold.png'
                  : '/images/saudagar_logo_black.png'
            }
            alt="Saudagar Perfumers - Premium Fragrances"
            className="h-8 sm:h-9 md:h-10 w-auto object-contain transition-all duration-300 hover:opacity-85"
          />
        </div>

        {/* ================= RIGHT ZONE: ACTION ICONS ================= */}
        <div className={`flex items-center gap-2.5 sm:gap-4 z-10 transition-colors duration-300 ${
          isTransparent || theme === 'dark' ? 'text-white' : 'text-[#111111]'
        }`}>
          
          {/* Stories Reel Icon Button */}
          <button
            onClick={onOpenStory}
            className={`hidden sm:flex items-center justify-center p-2 rounded-xs transition-all relative group cursor-pointer ${
              isTransparent || theme === 'dark' ? 'hover:text-[#ECC86A]' : 'hover:text-[#C4823F]'
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
            className={`hidden sm:flex items-center justify-center p-2 rounded-xs transition-all cursor-pointer ${
              isTransparent || theme === 'dark' ? 'hover:text-[#ECC86A]' : 'hover:text-[#C4823F]'
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
            className={`p-2 rounded-xs transition-all cursor-pointer ${
              isTransparent || theme === 'dark' ? 'hover:text-[#ECC86A]' : 'hover:text-[#C4823F]'
            }`}
            title="Search Fragrances"
            aria-label="Search Fragrances"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
            </svg>
          </button>

          {/* Luxury Dual-Segmented Capsule Theme Toggle (Light / Dark) */}
          {onToggleTheme && (
            <div
              onClick={onToggleTheme}
              className={`inline-flex items-center p-0.5 rounded-full transition-all duration-300 select-none cursor-pointer ${
                isTransparent
                  ? 'bg-white/20 backdrop-blur-md'
                  : theme === 'dark'
                    ? 'bg-white/10 backdrop-blur-md'
                    : 'bg-black/[0.06] backdrop-blur-md'
              }`}
              role="button"
              aria-label="Toggle Light and Dark Theme"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Noir Dark'} Theme`}
            >
              {/* Light Option (Sun) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (theme !== 'light') onToggleTheme();
                }}
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#C4823F] text-white shadow-xs'
                    : isTransparent || theme === 'dark'
                      ? 'text-white/60 hover:text-white'
                      : 'text-[#111111]/60 hover:text-[#111111]'
                }`}
                title="Light Theme"
                aria-label="Light Theme"
                aria-checked={theme === 'light'}
                role="radio"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </button>

              {/* Dark Option (Moon) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (theme !== 'dark') onToggleTheme();
                }}
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#C4823F] text-white shadow-xs'
                    : isTransparent || theme === 'dark'
                      ? 'text-white/60 hover:text-white'
                      : 'text-[#111111]/60 hover:text-[#111111]'
                }`}
                title="Noir Dark Theme"
                aria-label="Noir Dark Theme"
                aria-checked={theme === 'dark'}
                role="radio"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
            </div>
          )}

          {/* Account Profile Button */}
          <button
            onClick={onOpenAccount}
            className={`hidden sm:flex p-2 rounded-xs transition-all cursor-pointer ${
              isTransparent || theme === 'dark' ? 'hover:text-[#ECC86A]' : 'hover:text-[#C4823F]'
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
            className={`relative p-2 rounded-xs transition-all cursor-pointer ${
              isTransparent || theme === 'dark' ? 'hover:text-[#ECC86A]' : 'hover:text-[#C4823F]'
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
            className={`flex items-center gap-1.5 p-2 rounded-xs transition-all cursor-pointer ${
              isTransparent || theme === 'dark' ? 'hover:text-[#ECC86A]' : 'hover:text-[#C4823F]'
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

          {/* 2-Bar Fullscreen Navigation Drawer Toggle */}
          <button
            onClick={() => setIsMegaNavOpen(true)}
            className={`hidden lg:flex flex-col justify-center items-center gap-1.5 w-8 h-8 rounded transition-colors p-1 cursor-pointer ${
              isTransparent || theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
            title="Explore Saudagar Directory"
            aria-label="Explore Saudagar Directory"
          >
            <span className={`w-5 h-[1.8px] rounded-full transition-colors ${
              isTransparent || theme === 'dark' ? 'bg-white' : 'bg-[#111111]'
            }`} />
            <span className={`w-5 h-[1.8px] rounded-full transition-colors ${
              isTransparent || theme === 'dark' ? 'bg-white' : 'bg-[#111111]'
            }`} />
          </button>
        </div>

      </div>

      {/* ================= FULLSCREEN MEGA NAVBAR ================= */}
      <BluorngFullscreenMegaNav
        isOpen={isMegaNavOpen}
        onClose={() => setIsMegaNavOpen(false)}
        cartCount={cartCount}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenCart={onOpenCart}
        onOpenSearch={onOpenSearch}
        onOpenStory={onOpenStory}
        onNavigateHome={onNavigateHome}
        onNavigateCollection={onNavigateCollection}
      />
    </motion.header>
  );
}
