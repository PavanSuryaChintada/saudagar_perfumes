import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MEGA_MENU_COLLECTIONS, CURRENCIES } from '../data/bluorngSaudagarData.js';

export default function BluorngNavDrawer({
  isOpen,
  onClose,
  activeCurrency,
  onCurrencyChange,
  theme = 'dark',
  onToggleTheme,
  onNavigateHome,
  onNavigateCollection,
  onScrollToStores,
  onOpenStory,
  onOpenAccount
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 overflow-hidden select-none"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="w-screen max-w-sm sm:max-w-md bg-[#FFFFFF] dark:bg-[#0E0C10] text-[#111111] dark:text-white flex flex-col justify-between shadow-2xl p-6 sm:p-8"
            >
          
          {/* Top Bar: Brand Logo & Close */}
          <div>
            <div className="flex items-center justify-between pb-4">
              <img
                src={theme === 'dark' ? '/images/saudagar_logo_gold.png' : '/images/saudagar_logo_black.png'}
                alt="Saudagar Perfumers"
                onClick={() => {
                  onClose();
                  onNavigateHome();
                }}
                className="h-7 sm:h-8 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
              />

              <button
                onClick={onClose}
                className="p-1.5 text-[#111111] dark:text-white hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Navigation Links Hierarchy */}
            <nav className="mt-6 space-y-4 text-[13px] font-bold tracking-[0.04em] uppercase">
              <div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateCollection('new-in');
                  }}
                  className="w-full text-left py-1 hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors flex items-center justify-between group"
                >
                  <span className="text-emerald-700 dark:text-emerald-400">New Arrivals 2026</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-xs font-bold tracking-wider">
                    LATEST
                  </span>
                </button>
              </div>

              <div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateCollection('all');
                  }}
                  className="w-full text-left py-1 hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors flex items-center justify-between"
                >
                  <span>All Fragrances</span>
                  <span>→</span>
                </button>
              </div>

              {/* Sub-Collections Accordion / List */}
              <div className="pl-2 pt-2 pb-2 border-l-2 border-[#EEEEEE] dark:border-white/10 space-y-2.5 text-[11.5px] font-medium text-[#555555] dark:text-white/70">
                {MEGA_MENU_COLLECTIONS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onClose();
                      onNavigateCollection(c.slug);
                    }}
                    className="w-full text-left hover:text-[#C4823F] dark:hover:text-[#ECC86A] hover:translate-x-1 transition-all flex items-center justify-between"
                  >
                    <span>{c.title}</span>
                    <span className="text-[10px] text-[#999999] dark:text-white/40">({c.count})</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#F0F0F0] dark:border-white/10 space-y-3">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateCollection('wishlist');
                  }}
                  className="w-full text-left py-1 hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#C4823F] dark:text-[#ECC86A]">🔖</span>
                    <span>Saved Fragrances / Wishlist</span>
                  </div>
                  <span>→</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onScrollToStores();
                  }}
                  className="w-full text-left py-1 hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors flex items-center gap-2"
                >
                  <span className="text-[#C4823F] dark:text-[#ECC86A]">📍</span>
                  <span>Walk-in Boutiques & Stores</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenStory();
                  }}
                  className="w-full text-left py-1 hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors flex items-center gap-2"
                >
                  <span className="text-[#C4823F] dark:text-[#ECC86A]">🎬</span>
                  <span>Behind the Bottle Stories</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenAccount();
                  }}
                  className="w-full text-left py-1 hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors flex items-center gap-2"
                >
                  <span className="text-[#C4823F] dark:text-[#ECC86A]">👤</span>
                  <span>Customer Account & Orders</span>
                </button>

                {/* Luxury Theme Toggle in Drawer */}
                {onToggleTheme && (
                  <div className="pt-3 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#777777] dark:text-white/60">
                      Display Theme
                    </span>
                    <div className="inline-flex items-center p-0.5 rounded-full bg-black/[0.06] dark:bg-white/10 transition-colors">
                      <button
                        type="button"
                        onClick={() => {
                          if (theme !== 'light') onToggleTheme();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          theme === 'light'
                            ? 'bg-[#C4823F] text-white shadow-xs font-semibold'
                            : 'text-[#111111]/70 dark:text-white/70 hover:text-[#111111] dark:hover:text-white'
                        }`}
                      >
                        <span>☀</span>
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (theme !== 'dark') onToggleTheme();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-[#D4AF37] text-[#0B0A0D] shadow-xs font-semibold'
                            : 'text-[#111111]/70 dark:text-white/70 hover:text-[#111111] dark:hover:text-white'
                        }`}
                      >
                        <span>☾</span>
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Bottom Drawer Actions: Currency Switcher & Support */}
          <div className="pt-6 space-y-4">
            <div>
              <span className="text-[10px] font-bold tracking-wide uppercase text-[#888888] dark:text-white/50 block mb-2">
                Select Currency
              </span>
              <div className="grid grid-cols-5 gap-1.5 text-[10.5px]">
                {Object.keys(CURRENCIES).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => onCurrencyChange(curr)}
                    className={`py-1.5 font-bold uppercase rounded-full transition-all text-center cursor-pointer ${
                      activeCurrency === curr
                        ? 'bg-[#111111] dark:bg-[#D4AF37] text-white dark:text-[#0B0A0D] font-medium shadow-xs'
                        : 'bg-black/[0.05] dark:bg-white/10 text-[#444444] dark:text-white/80 hover:bg-black/[0.1] dark:hover:bg-white/15'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10.5px] text-[#777777] dark:text-white/50 leading-relaxed">
              <p>House Concierge: +91 84484 41388</p>
              <p>Worldwide Insured Delivery • Complimentary Samples</p>
            </div>
          </div>

            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
