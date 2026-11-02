import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MEGA_MENU_COLLECTIONS, CURRENCIES } from '../data/bluorngSaudagarData.js';

export default function BluorngNavDrawer({
  isOpen,
  onClose,
  activeCurrency,
  onCurrencyChange,
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
              className="w-screen max-w-sm sm:max-w-md bg-[#FFFFFF] text-[#111111] flex flex-col justify-between shadow-2xl border-r border-[#E5E5E5] p-6 sm:p-8"
            >
          
          {/* Top Bar: Brand Logo & Close */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
              <span
                onClick={() => {
                  onClose();
                  onNavigateHome();
                }}
                className="font-sans font-black tracking-[0.2em] text-[18px] uppercase text-[#111111] cursor-pointer"
              >
                SAUDAGAR
              </span>

              <button
                onClick={onClose}
                className="p-1.5 text-[#111111] hover:text-[#C4823F] transition-colors"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Navigation Links Hierarchy */}
            <nav className="mt-6 space-y-4 text-[13px] font-bold tracking-[0.16em] uppercase">
              <div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateCollection('new-in');
                  }}
                  className="w-full text-left py-1 hover:text-[#C4823F] transition-colors flex items-center justify-between group"
                >
                  <span className="text-emerald-700">New Arrivals 2026</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-xs font-bold tracking-wider">
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
                  className="w-full text-left py-1 hover:text-[#C4823F] transition-colors flex items-center justify-between"
                >
                  <span>All Fragrances</span>
                  <span>→</span>
                </button>
              </div>

              {/* Sub-Collections Accordion / List */}
              <div className="pl-2 pt-2 pb-2 border-l-2 border-[#EEEEEE] space-y-2.5 text-[11.5px] font-medium text-[#555555]">
                {MEGA_MENU_COLLECTIONS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onClose();
                      onNavigateCollection(c.slug);
                    }}
                    className="w-full text-left hover:text-[#C4823F] hover:translate-x-1 transition-all flex items-center justify-between"
                  >
                    <span>{c.title}</span>
                    <span className="text-[10px] text-[#999999]">({c.count})</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#F0F0F0] space-y-3">
                <button
                  onClick={() => {
                    onClose();
                    onScrollToStores();
                  }}
                  className="w-full text-left py-1 hover:text-[#C4823F] transition-colors flex items-center gap-2"
                >
                  <span className="text-[#C4823F]">📍</span>
                  <span>Walk-in Boutiques & Stores</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenStory();
                  }}
                  className="w-full text-left py-1 hover:text-[#C4823F] transition-colors flex items-center gap-2"
                >
                  <span className="text-[#C4823F]">🎬</span>
                  <span>Behind the Bottle Stories</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenAccount();
                  }}
                  className="w-full text-left py-1 hover:text-[#C4823F] transition-colors flex items-center gap-2"
                >
                  <span className="text-[#C4823F]">👤</span>
                  <span>Customer Account & Orders</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Bottom Drawer Actions: Currency Switcher & Support */}
          <div className="pt-6 border-t border-[#E5E5E5] space-y-4">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#888888] block mb-2">
                Select Currency
              </span>
              <div className="grid grid-cols-5 gap-1.5 text-[10.5px]">
                {Object.keys(CURRENCIES).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => onCurrencyChange(curr)}
                    className={`py-1.5 font-bold uppercase rounded-xs transition-all border text-center ${
                      activeCurrency === curr
                        ? 'border-[#111111] bg-[#111111] text-white'
                        : 'border-[#CCCCCC] bg-[#FFFFFF] text-[#444444] hover:border-[#111111]'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10.5px] text-[#777777] leading-relaxed">
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
