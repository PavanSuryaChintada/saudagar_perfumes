import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatINR as formatPrice } from '../lib/money';

export default function BluorngProductCard({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy
}) {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image || '/images/crystal_square_flacon.png'];

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleCardClick = () => {
    onSelectProduct && onSelectProduct(product.id);
  };

  const handleMouseEnter = () => {
    // Prefetch product images on hover for instant opening
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  };

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleCardClick();
        }
      }}
      onMouseEnter={handleMouseEnter}
      role="link"
      tabIndex={0}
      aria-label={product.name}
      className="group relative flex flex-col cursor-pointer transition-all duration-300 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tk-accent"
    >
      {/* ================= SOFT PEDESTAL FLACON STAGE (No harsh borders) ================= */}
      <div className="relative w-full aspect-[4/5] rounded-[2px] flex items-center justify-center p-4 sm:p-5 overflow-hidden transition-all duration-500 select-none bg-[#F8F7F5] dark:bg-[#141318] group-hover:bg-[#F2EFEA] dark:group-hover:bg-[#1C1A22]">
        {/* Soft Pedestal Ground Shadow */}
        <div className="absolute bottom-4 w-3/5 h-2.5 rounded-[100%] blur-[5px] transition-all duration-500 pointer-events-none z-0 bg-black/[0.06] dark:bg-black/40 group-hover:scale-110 group-hover:opacity-60" />

        {/* Flacon Image with Gentle Scale on Hover */}
        <AnimatePresence mode="wait">
          <motion.img
            key={images[currentImgIdx]}
            src={images[currentImgIdx]}
            alt={product.name}
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.9 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-700 ease-out filter drop-shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
            loading="lazy"
          />
        </AnimatePresence>

        {/* Minimal Discrete Badge (Top-Left) */}
        {product.badge && (
          <span className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 text-[10.5px] uppercase tracking-wider font-medium rounded-[2px] bg-black/5 dark:bg-white/10 text-[#555555] dark:text-white/90">
            {product.badge}
          </span>
        )}

        {/* Wishlist Button (Top-Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist && onToggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 z-20 w-8 h-8 rounded-[2px] flex items-center justify-center transition-all duration-200 cursor-pointer bg-white/85 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-tk-ink dark:text-white"
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={isWishlisted}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            className={isWishlisted ? 'text-tk-accent dark:text-tk-accent-night' : 'text-tk-ink dark:text-white'}
            fill={isWishlisted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Gallery Slider Controls (hover-only if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-[2px] bg-white/90 dark:bg-black/75 text-tk-ink dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-xs cursor-pointer"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-[2px] bg-white/90 dark:bg-black/75 text-tk-ink dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-xs cursor-pointer"
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}

        {/* Quick add, shown on hover */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickBuy && onQuickBuy(product);
            }}
            className="w-full py-2.5 text-[11.5px] uppercase tracking-[0.14em] font-medium rounded-[2px] shadow-md transition-colors cursor-pointer bg-tk-ink text-white hover:bg-tk-accent dark:bg-tk-gold dark:text-tk-night dark:hover:bg-tk-accent-night"
          >
            + Quick Add
          </button>
        </div>
      </div>

      {/* Name on up to two lines (never cut short on one line), the kind of perfume, then the price */}
      <div className="pt-3 pb-1 flex flex-col">
        <h3 className="text-[12.5px] sm:text-[13px] leading-[1.4] min-h-[2.8em] font-normal uppercase tracking-[0.04em] line-clamp-2 transition-colors text-tk-ink dark:text-white group-hover:text-tk-accent dark:group-hover:text-tk-accent-night">
          {product.name}
        </h3>
        <p className="mt-1 text-[11px] sm:text-[11.5px] font-normal tracking-wide truncate text-[#666666] dark:text-white/55">
          {product.category || 'Extrait de Parfum'}
        </p>
        <div className="mt-1.5 flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
          <span className="text-[13px] sm:text-[13.5px] font-medium text-tk-ink dark:text-white">{formatPrice(product.price)}</span>
          {hasDiscount && (
            <>
              <span className="text-[11.5px] line-through text-[#707070] dark:text-white/40">{formatPrice(product.compareAtPrice)}</span>
              <span className="text-[11px] font-medium text-tk-accent dark:text-tk-accent-night">{discountPct}% off</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
