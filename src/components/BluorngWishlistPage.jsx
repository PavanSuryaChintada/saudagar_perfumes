import React from 'react';
import { useShopWords } from '../cms/shopWords';
import { motion } from 'framer-motion';
import { useProductsBySlugs } from '../storefront/catalog/hooks';
import BluorngProductCard from './BluorngProductCard.jsx';
import ListingHeader from '../storefront/ListingHeader.jsx';

export default function BluorngWishlistPage({
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  onNavigateCollection
}) {
  const { products: savedProducts } = useProductsBySlugs(wishlist);
  const words = useShopWords();

  const count = savedProducts.length;

  return (
    <div className="w-full min-h-[70vh] bg-white dark:bg-tk-night text-tk-ink dark:text-white transition-colors duration-300">
      <ListingHeader
        eyebrow={words.wishlist_eyebrow}
        title={words.wishlist_title}
        description={count === 0 ? 'Nothing saved yet' : `${count} ${count === 1 ? 'fragrance' : 'fragrances'} saved`}
      />

      {/* ================= CONTENT ================= */}
      <section className="px-6 sm:px-12 lg:px-16 py-12 sm:py-16 max-w-[1400px] mx-auto">
        {count === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center py-12 sm:py-16"
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mb-6 text-tk-accent-ink dark:text-tk-accent-night">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-[17px] sm:text-[19px] uppercase tracking-[0.04em] text-tk-ink dark:text-white">
              {words.wishlist_empty_title}
            </p>
            <p className="mt-3 max-w-[420px] text-[13px] leading-relaxed text-[#5F5F5F] dark:text-[#A09D96]">
              {words.wishlist_empty_text}
            </p>
            <button
              type="button"
              onClick={() => onNavigateCollection('all')}
              className="mt-8 h-11 px-8 rounded-[2px] bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night text-[12px] uppercase tracking-[0.16em] font-semibold hover:bg-tk-accent dark:hover:bg-tk-accent-night transition-colors cursor-pointer"
            >
              {words.wishlist_empty_button}
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
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10"
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
              className="text-[12px] uppercase tracking-[0.16em] font-medium text-tk-ink dark:text-white border-b border-tk-ink/30 dark:border-white/30 pb-1 hover:text-tk-accent dark:hover:text-tk-accent-night hover:border-tk-accent dark:hover:border-tk-accent-night transition-colors cursor-pointer"
            >
              Continue Exploring
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
