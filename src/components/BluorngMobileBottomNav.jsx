import React from 'react';
import { useBlock } from '../cms/useSite';

const SHOP_VIEWS = ['collection', 'listing', 'product', 'notes', 'giftpack'];

function Tab({ active, id, label, onClick, badge = 0, children, ...rest }) {
  return (
    <li className="flex-1">
      <button
        type="button"
        onClick={onClick}
        aria-current={active === id ? 'page' : undefined}
        className={`relative w-full flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer ${
          active === id ? 'text-tk-ink dark:text-white' : 'text-[#6B6B6B] dark:text-[#A09D96] hover:text-tk-ink dark:hover:text-white'
        }`}
        {...rest}
      >
        <span className="relative">
          {children}
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-0.5 rounded-[2px] bg-tk-accent-ink dark:bg-tk-gold text-white dark:text-tk-night text-[11px] font-bold leading-[17px] text-center">
              {badge}
            </span>
          )}
        </span>
        <span className={`text-[11.5px] tracking-[0.08em] uppercase ${active === id ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        {active === id && <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-tk-accent dark:bg-tk-accent-night" aria-hidden />}
      </button>
    </li>
  );
}

/** Phone tab bar: Home, Shop, Saved, Account and Bag, with the page you are on highlighted. */
export default function BluorngMobileBottomNav({
  view = 'home',
  cartCount = 0,
  wishlistCount = 0,
  onNavigateHome,
  onNavigateCollection,
  onScrollToStores,
  onOpenCart,
  onOpenAccount
}) {
  const showBoutiques = !!useBlock('brand')?.show_boutiques;
  const active = view === 'home' ? 'home' : SHOP_VIEWS.includes(view) ? 'shop' : view === 'wishlist' ? 'saved' : view === 'account' || view === 'order' ? 'account' : '';

  return (
    <nav
      aria-label="Shop menu"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0E0C10]/95 backdrop-blur-xl border-t border-[#ECECEC] dark:border-white/10 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors duration-300"
    >
      <ul className="flex items-stretch justify-around">
        <Tab active={active} id="home" label="Home" onClick={onNavigateHome}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" strokeLinejoin="round" />
          </svg>
        </Tab>

        <Tab active={active} id="shop" label="Shop" onClick={() => onNavigateCollection('all')}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </Tab>

        {showBoutiques && (
          <Tab active={active} id="stores" label="Stores" onClick={onScrollToStores}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </Tab>
        )}

        <Tab active={active} id="saved" label="Saved" badge={wishlistCount} onClick={() => onNavigateCollection('wishlist')}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </Tab>

        <Tab active={active} id="account" label="Account" onClick={onOpenAccount}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Tab>

        <Tab active={active} id="bag" label="Bag" badge={cartCount} onClick={onOpenCart} data-cart-target aria-label={`Bag (${cartCount})`}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </Tab>
      </ul>
    </nav>
  );
}
