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
    onSelectProduct(product.id);
  };

  return (
    <motion.div
      onClick={handleCardClick}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col bg-[#FFFFFF] border border-[#EEEEEE] hover:border-[#111111]/35 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer overflow-hidden will-change-transform"
    >
      {/* ================= CARD IMAGE GALLERY CONTAINER ================= */}
      <div className="relative w-full aspect-[4/5] bg-[#F7F7F6] flex items-center justify-center overflow-hidden select-none p-3 sm:p-5">
        
        {/* Main Display Image with Smooth Crossfade */}
        <AnimatePresence mode="wait">
          <motion.img
            key={images[currentImgIdx]}
            src={images[currentImgIdx]}
            alt={product.name}
            initial={{ opacity: 0.85, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.85 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-full object-contain object-center group-hover:scale-[1.07] transition-transform duration-700 ease-out filter drop-shadow-[0_10px_24px_rgba(0,0,0,0.15)] group-hover:drop-shadow-[0_16px_32px_rgba(0,0,0,0.22)]"
            loading="lazy"
          />
        </AnimatePresence>

        {/* Badge (Top-Left) */}
        {product.badge && (
          <div className="absolute top-2.5 left-2.5 z-20">
            <span className="px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] uppercase bg-[#111111] text-white rounded-xs shadow-xs">
              {product.badge}
            </span>
          </div>
        )}

        {/* Wishlist Bookmark Button (Top-Right) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.82 }}
          whileHover={{ scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-xs bg-white/90 hover:bg-white text-[#111111] flex items-center justify-center transition-colors shadow-sm"
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label="Wishlist"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={isWishlisted ? '#C4823F' : 'none'}
            stroke={isWishlisted ? '#C4823F' : '#111111'}
            strokeWidth="1.8"
            className="transition-colors duration-200"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </motion.button>

        {/* Gallery Slider Prev/Next Controls (visible on hover if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-[#111111] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-105"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-[#111111] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-105"
              aria-label="Next image"
            >
              ›
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {images.map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  className={`block rounded-full transition-all duration-300 ${
                    dotIdx === currentImgIdx
                      ? 'w-3 h-1 bg-[#111111]'
                      : 'w-1 h-1 bg-black/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ================= CARD INFORMATION FOOTER ================= */}
      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 bg-[#FFFFFF]">
        {/* Title */}
        <div>
          <h3 className="text-[12.5px] sm:text-[13.5px] font-semibold uppercase tracking-[0.08em] text-[#111111] line-clamp-1 group-hover:text-[#C4823F] transition-colors duration-200">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[10px] text-[#777777] uppercase tracking-wider">
              {product.category || 'Extrait de Parfum'}
            </p>
            <span className="font-script text-[#C4823F] text-[14px] normal-case tracking-normal opacity-90">
              pure extrait
            </span>
          </div>
        </div>

        {/* Price & Quick Add Button Row (Exact Bluorng layout with c-plus-svg) */}
        <div className="mt-3 pt-2.5 border-t border-[#F0F0F0] flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] sm:text-[14px] font-bold text-[#111111] tracking-wide">
              {formatPrice(product.price, activeCurrency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[11px] text-[#999999] line-through font-normal">
                {formatPrice(product.compareAtPrice, activeCurrency)}
              </span>
            )}
          </div>

          {/* Quick Add Plus Button with Tactile Feedback */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.12, backgroundColor: '#111111', color: '#FFFFFF' }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={(e) => {
              e.stopPropagation();
              onQuickBuy(product);
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xs border border-[#111111]/20 hover:border-[#111111] text-[#111111] flex items-center justify-center transition-colors"
            title="Quick Select Size & Add"
            aria-label={`Quick add ${product.name}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M12 5V19" strokeLinecap="round" />
              <path d="M5 12H19" strokeLinecap="round" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
