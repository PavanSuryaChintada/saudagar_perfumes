import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../data/bluorngSaudagarData.js';

export default function BluorngProductCard({
  product,
  activeCurrency = 'INR',
  isWishlisted = false,
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy
}) {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image || '/images/crystal_square_flacon.png'];

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

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col cursor-pointer transition-all duration-300 select-none"
    >
      {/* ================= SOFT PEDESTAL FLACON STAGE (No harsh borders) ================= */}
      <div className="relative w-full aspect-[4/5] rounded-md flex items-center justify-center p-4 sm:p-5 overflow-hidden transition-all duration-500 select-none bg-[#F8F7F5] dark:bg-[#141318] group-hover:bg-[#F2EFEA] dark:group-hover:bg-[#1C1A22]">
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
          <span className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 text-[9px] uppercase tracking-wider font-medium rounded-sm bg-black/5 dark:bg-white/10 text-[#666666] dark:text-white/90">
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
          className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-[#111111] dark:text-white"
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label="Wishlist"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill={isWishlisted ? '#C4823F' : 'none'}
            stroke={isWishlisted ? '#C4823F' : 'currentColor'}
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
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/90 dark:bg-black/75 text-[#111111] dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-xs cursor-pointer"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/90 dark:bg-black/75 text-[#111111] dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-xs cursor-pointer"
              aria-label="Next"
            >
              ›
            </button>
          </>
        )}

        {/* Effortless Floating + Quick Add Pill on Hover */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickBuy && onQuickBuy(product);
            }}
            className="w-full py-2 text-[10.5px] uppercase tracking-[0.14em] font-medium rounded-sm shadow-md transition-colors cursor-pointer bg-[#111111] text-white hover:bg-[#C4823F] dark:bg-[#C4823F] dark:text-white dark:hover:bg-[#DE9954]"
          >
            + Quick Add
          </button>
        </div>
      </div>

      {/* ================= MINIMAL INFORMATION (Clean Typography, No Lines) ================= */}
      <div className="pt-3 pb-1 flex flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[12.5px] sm:text-[13px] font-normal uppercase tracking-[0.04em] transition-colors truncate text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A]">
            {product.name}
          </h3>
          <span className="text-[12px] sm:text-[12.5px] font-medium shrink-0 text-[#111111] dark:text-white/95">
            {formatPrice(product.price, activeCurrency)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[10px] sm:text-[10.5px] font-normal tracking-wide truncate text-[#888888] dark:text-white/50">
            {product.category || 'Extrait de Parfum'}
          </p>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-[10.5px] line-through font-normal shrink-0 text-[#AAAAAA] dark:text-white/30">
              {formatPrice(product.compareAtPrice, activeCurrency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
