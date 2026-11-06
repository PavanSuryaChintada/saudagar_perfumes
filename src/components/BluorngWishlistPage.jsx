import React from 'react';
import { motion } from 'framer-motion';
import { ALL_PRODUCTS } from '../data/bluorngSaudagarData.js';
import BluorngProductCard from './BluorngProductCard.jsx';

export default function BluorngWishlistPage({
  wishlist = [],
  activeCurrency = 'INR',
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  onNavigateCollection
}) {
  const savedProducts = wishlist
    .map((id) => ALL_PRODUCTS.find((p) => p.id === id))
    .filter(Boolean);

  const count = savedProducts.length;

  return (
    <div className="w-full min-h-[70vh] bg-white dark:bg-[#0B0A0D] text-[#111111] dark:text-white transition-colors duration-300">
      {/* ================= HEADER ================= */}
      <section className="px-6 sm:px-12 lg:px-16 pt-14 sm:pt-20 pb-10 sm:pb-14 text-center border-b border-black/[0.06] dark:border-white/[0.08]">
        <motion.span
          initial={{ opacity: 0, letterSpacing: '0.08em' }}
          animate={{ opacity: 1, letterSpacing: '0.24em' }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="block text-[10.5px] uppercase font-medium text-[#C4823F] dark:text-[#ECC86A]"
        >
          Your Private Selection
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 font-serif italic text-[40px] sm:text-[60px] leading-[1.05]"
        >
          Saved Fragrances
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-5 text-[11px] uppercase tracking-[0.16em] text-[#888888] dark:text-[#A09D96]"
        >
          {count === 0 ? 'Nothing saved yet' : `${count} ${count === 1 ? 'fragrance' : 'fragrances'} saved`}
        </motion.p>
      </section>

      {/* ================= CONTENT ================= */}
      <section className="px-6 sm:px-12 lg:px-16 py-12 sm:py-16 max-w-[1400px] mx-auto">
        {count === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center py-16 sm:py-24"
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mb-6 text-[#C4823F] dark:text-[#ECC86A]">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <p className="font-serif italic text-[22px] sm:text-[26px] text-[#111111] dark:text-white">
              Your wishlist is waiting for its first scent.
            </p>
            <p className="mt-3 max-w-[420px] text-[13px] leading-relaxed text-[#777777] dark:text-[#A09D96]">
              Tap the bookmark on any fragrance to save it here, and return whenever you are ready to choose.
            </p>
            <button
              type="button"
              onClick={() => onNavigateCollection('all')}
              className="mt-10 px-8 py-3 rounded-sm bg-[#111111] dark:bg-[#D4AF37] text-white dark:text-[#0B0A0D] text-[11px] uppercase tracking-[0.14em] font-medium hover:bg-[#C4823F] dark:hover:bg-[#ECC86A] transition-colors cursor-pointer shadow-md"
            >
              Explore Collections
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } }
            }}
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-12"
          >
            {savedProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 26 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                }}
              >
                <BluorngProductCard
                  product={product}
                  activeCurrency={activeCurrency}
                  isWishlisted
                  onToggleWishlist={onToggleWishlist}
                  onSelectProduct={onSelectProduct}
                  onQuickBuy={onQuickBuy}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {count > 0 && (
          <div className="mt-16 flex justify-center">
            <button
              type="button"
              onClick={() => onNavigateCollection('all')}
              className="text-[11px] uppercase tracking-[0.16em] font-medium text-[#111111] dark:text-white border-b border-[#111111]/30 dark:border-white/30 pb-1 hover:text-[#C4823F] dark:hover:text-[#ECC86A] hover:border-[#C4823F] dark:hover:border-[#ECC86A] transition-colors cursor-pointer"
            >
              Continue Exploring
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
