import React from 'react';
import { useBlock } from '../cms/useSite';

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
  const showBoutiques = !!useBlock('brand')?.show_boutiques;
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0E0C10]/95 backdrop-blur-xl px-4 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-colors duration-300">
      <ul className="flex items-center justify-around text-[#5F5F5F] dark:text-[#A09D96]">
        
        {/* Explore Compass */}
        <li>
          <button
            onClick={() => onNavigateCollection('all')}
            className="flex flex-col items-center justify-center gap-1 hover:text-tk-ink dark:hover:text-white transition-colors p-1 cursor-pointer"
            aria-label="Explore Collections"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
            </svg>
            <span className="text-[10.5px] font-bold tracking-wider uppercase">Explore</span>
          </button>
        </li>

        {/* Mobile Theme Toggle Button */}
        {onToggleTheme && (
          <li>
            <button
              onClick={onToggleTheme}
              className="flex flex-col items-center justify-center gap-1 text-tk-accent dark:text-tk-accent-night hover:opacity-80 transition-colors p-1 cursor-pointer"
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
              <span className="text-[10.5px] font-medium tracking-[0.08em] uppercase">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </li>
        )}

        {/* Boutiques Location (shown when Brand → "Show boutiques" is on) */}
        {showBoutiques && (
        <li>
          <button
            onClick={onScrollToStores}
            className="flex flex-col items-center justify-center gap-1 hover:text-tk-ink dark:hover:text-white transition-colors p-1 cursor-pointer"
            aria-label="Walk-in Stores"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-[10.5px] font-bold tracking-wider uppercase">Boutiques</span>
          </button>
        </li>
        )}

        {/* Patron Account */}
        <li>
          <button
            onClick={onOpenAccount}
            className="flex flex-col items-center justify-center gap-1 hover:text-tk-ink dark:hover:text-white transition-colors p-1 cursor-pointer"
            aria-label="Connoisseur Account"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-[10.5px] font-bold tracking-wider uppercase">Account</span>
          </button>
        </li>

        {/* Cart Bag */}
        <li>
          <button
            data-cart-target
            onClick={onOpenCart}
            className="flex flex-col items-center justify-center gap-1 hover:text-tk-ink dark:hover:text-white transition-colors p-1 relative cursor-pointer"
            aria-label={`Cart (${cartCount})`}
          >
            {cartCount > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 rounded-xs bg-tk-accent dark:bg-tk-gold text-white dark:text-tk-night text-[10.5px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="text-[10.5px] font-bold tracking-wider uppercase">Bag</span>
          </button>
        </li>

      </ul>
    </nav>
  );
}
