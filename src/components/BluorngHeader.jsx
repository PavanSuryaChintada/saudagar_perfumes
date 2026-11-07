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
  const isTransparent = isHomePage && !isScrolled && !isMegaNavOpen;

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 w-full select-none transition-all duration-300 relative ${
        isTransparent
          ? 'bg-transparent text-white'
          : 'bg-white/95 dark:bg-tk-night/95 backdrop-blur-md shadow-xs text-tk-ink dark:text-white'
      }`}
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 h-[60px] sm:h-[68px] relative flex items-stretch justify-between">
        
        {/* ================= LEFT ZONE (Menu Button -> Fullscreen Mega Nav) ================= */}
        <div className="flex items-center z-10 h-full self-stretch">
          {/* Two-Bar Menu Button -> Fullscreen Mega Nav */}
          <button
            onClick={() => setIsMegaNavOpen(true)}
            className={`flex flex-col justify-center items-center gap-1.5 w-8 h-8 -ml-1 rounded transition-colors p-1 cursor-pointer ${
              isTransparent ? 'hover:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title="Explore Saudagar Directory"
            aria-label="Open Navigation Menu"
          >
            <span className={`w-5 h-[1.8px] rounded-full transition-colors ${
              isTransparent ? 'bg-white' : 'bg-tk-ink dark:bg-white'
            }`} />
            <span className={`w-5 h-[1.8px] rounded-full transition-colors ${
              isTransparent ? 'bg-white' : 'bg-tk-ink dark:bg-white'
            }`} />
          </button>
        </div>

        {/* ================= CENTER ZONE: MATHEMATICALLY PERFECTLY CENTERED ================= */}
        <div
          onClick={onNavigateHome}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center cursor-pointer select-none py-1 flex items-center justify-center max-w-[42%] sm:max-w-none pointer-events-auto"
        >
          {isTransparent ? (
            <img
              src="/images/saudagar_logo_white.png"
              alt="Saudagar Perfumers"
              className="h-[21px] xs:h-[23px] sm:h-7 md:h-8 lg:h-9 w-auto max-w-full object-contain transition-all duration-300 hover:opacity-85"
            />
          ) : (
            <>
              <img
                src="/images/saudagar_logo_black.png"
                alt="Saudagar Perfumers"
                className="h-[21px] xs:h-[23px] sm:h-7 md:h-8 lg:h-9 w-auto max-w-full object-contain transition-all duration-300 hover:opacity-85 block dark:hidden"
              />
              <img
                src="/images/saudagar_logo_gold.png"
                alt="Saudagar Perfumers"
                className="h-[21px] xs:h-[23px] sm:h-7 md:h-8 lg:h-9 w-auto max-w-full object-contain transition-all duration-300 hover:opacity-85 hidden dark:block"
              />
            </>
          )}
        </div>

        {/* ================= RIGHT ZONE: ACTION ICONS ================= */}
        <div className={`flex items-center gap-1.5 sm:gap-3 md:gap-4 z-10 transition-colors duration-300 ${
          isTransparent ? 'text-white' : 'text-tk-ink dark:text-white'
        }`}>
          
          {/* Search Icon Button with Luxury Micro-Animation */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenSearch}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              isTransparent || theme === 'dark' ? 'hover:text-tk-accent-night' : 'hover:text-tk-accent'
            }`}
            title="Search Fragrances (⌘K)"
            aria-label="Search Fragrances"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
            </svg>
            <span className="hidden xl:inline-block text-[9px] uppercase tracking-wider font-mono opacity-60 border border-current px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </motion.button>

          {/* Luxury Dual-Segmented Capsule Theme Toggle (Light / Dark) - Desktop & Tablet */}
          {onToggleTheme && (
            <div
              onClick={onToggleTheme}
              className={`hidden sm:inline-flex items-center p-0.5 rounded-full transition-all duration-300 select-none cursor-pointer ${
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
              {/* Light Option (Sun) - Orange in Light Theme */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (theme !== 'light') onToggleTheme();
                }}
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-tk-accent text-white shadow-xs'
                    : isTransparent || theme === 'dark'
                      ? 'text-white/60 hover:text-white'
                      : 'text-tk-ink/60 hover:text-tk-ink'
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

              {/* Dark Option (Moon) - Gold in Dark Theme */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (theme !== 'dark') onToggleTheme();
                }}
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-tk-gold text-tk-night shadow-xs'
                    : isTransparent || theme === 'dark'
                      ? 'text-white/60 hover:text-white'
                      : 'text-tk-ink/60 hover:text-tk-ink'
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
              isTransparent || theme === 'dark' ? 'hover:text-tk-accent-night' : 'hover:text-tk-accent'
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
            className={`relative p-1.5 sm:p-2 rounded-xs transition-all cursor-pointer ${
              isTransparent || theme === 'dark' ? 'hover:text-tk-accent-night' : 'hover:text-tk-accent'
            }`}
            title="Wishlist"
            aria-label="Wishlist"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-tk-accent dark:bg-tk-gold text-white dark:text-tk-night text-[8.5px] sm:text-[9px] font-bold rounded-xs flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon / Cart (N) link */}
          <button
            data-cart-target
            onClick={onOpenCart}
            className={`flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xs transition-all cursor-pointer ${
              isTransparent || theme === 'dark' ? 'hover:text-tk-accent-night' : 'hover:text-tk-accent'
            }`}
            aria-label={`Shopping Cart (${cartCount})`}
          >
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
                  className="absolute -top-1 -right-1 w-4 h-4 bg-tk-accent dark:bg-tk-gold text-white dark:text-tk-night text-[9px] font-bold rounded-xs flex items-center justify-center shadow-xs"
                >
                  {cartCount}
                </motion.span>
              )}
            </div>
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
