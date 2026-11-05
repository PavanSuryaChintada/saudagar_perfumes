import React from 'react';

export default function BluorngMobileBottomNav({
  cartCount = 0,
  theme = 'dark',
  onToggleTheme,
  onNavigateHome,
  onNavigateCollection,
  onScrollToStores,
  onOpenStory,
  onOpenCart,
  onOpenAccount
}) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0E0C10]/95 backdrop-blur-xl px-4 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-colors duration-300">
      <ul className="flex items-center justify-around text-[#777777] dark:text-[#A09D96]">
        
        {/* Explore Compass */}
        <li>
          <button
            onClick={() => onNavigateCollection('all')}
            className="flex flex-col items-center justify-center gap-1 hover:text-[#111111] dark:hover:text-white transition-colors p-1 cursor-pointer"
            aria-label="Explore Collections"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider uppercase">Explore</span>
          </button>
        </li>

        {/* Stories Reels */}
        <li>
          <button
            onClick={onOpenStory}
            className="flex flex-col items-center justify-center gap-1 hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors p-1 relative cursor-pointer"
            aria-label="Fragrance Stories"
          >
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-[#C4823F] animate-ping" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="#C4823F" stroke="#C4823F" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#C4823F] dark:text-[#ECC86A]">Stories</span>
          </button>
        </li>

        {/* Mobile Theme Toggle Button */}
        {onToggleTheme && (
          <li>
            <button
              onClick={onToggleTheme}
              className="flex flex-col items-center justify-center gap-1 text-[#C4823F] hover:text-[#ECC86A] transition-colors p-1 cursor-pointer"
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            >
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
              <span className="text-[9px] font-bold tracking-wider uppercase">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </li>
        )}

        {/* Boutiques Location */}
        <li>
          <button
            onClick={onScrollToStores}
            className="flex flex-col items-center justify-center gap-1 hover:text-[#111111] dark:hover:text-white transition-colors p-1 cursor-pointer"
            aria-label="Walk-in Stores"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider uppercase">Boutiques</span>
          </button>
        </li>

        {/* Cart Bag */}
        <li>
          <button
            onClick={onOpenCart}
            className="flex flex-col items-center justify-center gap-1 hover:text-[#111111] dark:hover:text-white transition-colors p-1 relative cursor-pointer"
            aria-label={`Cart (${cartCount})`}
          >
            {cartCount > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 rounded-xs bg-[#111111] dark:bg-[#C4823F] text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider uppercase">Bag</span>
          </button>
        </li>

      </ul>
    </nav>
  );
}
