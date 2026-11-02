import React from 'react';

export default function BluorngMobileBottomNav({
  cartCount = 0,
  onNavigateHome,
  onNavigateCollection,
  onScrollToStores,
  onOpenStory,
  onOpenCart,
  onOpenAccount
}) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#E5E5E5] px-4 py-2 shadow-2xl">
      <ul className="flex items-center justify-around text-[#777777]">
        
        {/* Explore Compass */}
        <li>
          <button
            onClick={() => onNavigateCollection('all')}
            className="flex flex-col items-center justify-center gap-1 hover:text-[#111111] transition-colors p-1"
            aria-label="Explore Collections"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider uppercase">Explore</span>
          </button>
        </li>

        {/* Account Person */}
        <li>
          <button
            onClick={onOpenAccount}
            className="flex flex-col items-center justify-center gap-1 hover:text-[#111111] transition-colors p-1"
            aria-label="Account"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider uppercase">Account</span>
          </button>
        </li>

        {/* Stories Reels */}
        <li>
          <button
            onClick={onOpenStory}
            className="flex flex-col items-center justify-center gap-1 hover:text-[#C4823F] transition-colors p-1 relative"
            aria-label="Fragrance Stories"
          >
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-[#C4823F] animate-ping" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="#C4823F" stroke="#C4823F" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#C4823F]">Stories</span>
          </button>
        </li>

        {/* Boutiques Location */}
        <li>
          <button
            onClick={onScrollToStores}
            className="flex flex-col items-center justify-center gap-1 hover:text-[#111111] transition-colors p-1"
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
            className="flex flex-col items-center justify-center gap-1 hover:text-[#111111] transition-colors p-1 relative"
            aria-label={`Cart (${cartCount})`}
          >
            {cartCount > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 rounded-xs bg-[#111111] text-white text-[9px] font-bold flex items-center justify-center">
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
