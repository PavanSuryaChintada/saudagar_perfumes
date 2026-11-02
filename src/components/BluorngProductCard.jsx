import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../data/bluorngSaudagarData.js';

// Helper to determine 3 luxury olfactory note tags based on product characteristics
function getProductAccents(product) {
  const name = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();

  if (name.includes('aquatic') || name.includes('pacific') || name.includes('chill') || name.includes('marine')) {
    return [
      { type: 'wave', label: 'AQUATIC' },
      { type: 'leaf', label: 'FRESH' },
      { type: 'wind', label: 'CLEAN' }
    ];
  }

  if (name.includes('oud') || name.includes('thunderstruck') || desc.includes('oud') || desc.includes('agarwood')) {
    return [
      { type: 'sparkle', label: 'OUD' },
      { type: 'flame', label: 'SMOKY' },
      { type: 'crown', label: 'ROYAL' }
    ];
  }

  if (name.includes('rose') || desc.includes('rose') || name.includes('ruby')) {
    return [
      { type: 'flower', label: 'ROSE' },
      { type: 'leaf', label: 'FLORAL' },
      { type: 'sparkle', label: 'VELVET' }
    ];
  }

  if (name.includes('amber') || name.includes('bark') || desc.includes('amber') || desc.includes('resin')) {
    return [
      { type: 'sun', label: 'AMBER' },
      { type: 'leaf', label: 'RESIN' },
      { type: 'sparkle', label: 'WARM' }
    ];
  }

  if (name.includes('canopy') || name.includes('noir') || desc.includes('cypress') || desc.includes('pine')) {
    return [
      { type: 'leaf', label: 'CYPRESS' },
      { type: 'sparkle', label: 'MINERAL' },
      { type: 'wind', label: 'CRISP' }
    ];
  }

  // Fallback signature luxury triad
  return [
    { type: 'sparkle', label: 'NOBLE' },
    { type: 'leaf', label: 'BOTANICAL' },
    { type: 'wind', label: 'CLEAN' }
  ];
}

// Minimalist outline SVG icons matching the reference card design
function AccentIcon({ type }) {
  if (type === 'wave') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
        <path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7 0" />
      </svg>
    );
  }
  if (type === 'leaf') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6" />
      </svg>
    );
  }
  if (type === 'wind') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
        <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
        <path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2" />
      </svg>
    );
  }
  if (type === 'sparkle') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
      </svg>
    );
  }
  if (type === 'flower') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" />
      </svg>
    );
  }
  if (type === 'sun') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }
  // Default crown icon
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

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

  const accents = getProductAccents(product);

  // Compute discount percentage if compareAtPrice is higher than price
  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 23; // Default 23% matching reference card

  const comparePrice = product.compareAtPrice || Math.round(product.price * 1.25);

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

  const handleAddClick = (e) => {
    e.stopPropagation();
    onQuickBuy(product);
  };

  return (
    <motion.div
      onClick={handleCardClick}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col bg-[#FAF6F0] rounded-[24px] sm:rounded-[30px] border border-[#ECE4D8] shadow-[0_16px_38px_rgba(40,30,20,0.06)] hover:shadow-[0_24px_48px_rgba(40,30,20,0.12)] transition-all duration-300 cursor-pointer overflow-hidden will-change-transform"
    >
      {/* ================= CARD IMAGE GALLERY CONTAINER ================= */}
      <div className="relative w-full aspect-[4/3.8] sm:aspect-[4/3.5] bg-gradient-to-b from-[#F5EFE7] via-[#EFE8DE] to-[#E8DFD2] flex items-center justify-center overflow-hidden select-none p-4 sm:p-6">
        
        {/* Soft Organic Leaf Shadow / Ambient Lighting Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,_rgba(255,255,255,0.85)_0%,_transparent_75%)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,_rgba(60,40,20,0.04)_0%,_transparent_70%)] pointer-events-none" />

        {/* Podium Base Silhouette */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent rounded-full filter blur-md pointer-events-none" />

        {/* Bestseller Badge (Top-Left) with Laurel Wreath Icon */}
        <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-[#EFE3CF]/92 backdrop-blur-md border border-[#E3D3B8] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-1.5">
            {/* Laurel Wreath Sprig SVG */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7E5322" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M5 6c1.2 0 2 1.2 1.6 2.4S4.6 9.6 4.2 8.4 4 6 5 6ZM19 6c-1.2 0-2 1.2-1.6 2.4s2 1.2 2.4 0 .2-2.4-.8-2.4ZM4 11c1.2 0 2 1.2 1.6 2.4S3.6 14.6 3.2 13.4 3 11 4 11ZM20 11c-1.2 0-2 1.2-1.6 2.4s2 1.2 2.4 0 .2-2.4-.8-2.4ZM6 16c1.2 0 2 1.2 1.6 2.4S5.6 19.6 5.2 18.4 5 16 6 16ZM18 16c-1.2 0-2 1.2-1.6 2.4s2 1.2 2.4 0 .2-2.4-.8-2.4Z" />
              <path d="M12 21c-4.5 0-8-3.5-8-8M12 21c4.5 0 8-3.5 8-8" strokeWidth="1.4" />
            </svg>
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-[#6E4B1F]">
              {product.badge || 'BESTSELLER'}
            </span>
          </div>
        </div>

        {/* Floating Circular Wishlist Button (Top-Right) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute top-3.5 right-3.5 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-[#E8E1D5] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[#2B231E] transition-all"
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label="Wishlist"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill={isWishlisted ? '#C4823F' : 'none'}
            stroke={isWishlisted ? '#C4823F' : '#2B231E'}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-200"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </motion.button>

        {/* Main Perfume Display Image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={images[currentImgIdx]}
            src={images[currentImgIdx]}
            alt={product.name}
            initial={{ opacity: 0.88, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.88 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full h-full object-contain object-center z-10 group-hover:scale-[1.05] transition-transform duration-700 ease-out filter drop-shadow-[0_16px_22px_rgba(40,30,20,0.22)]"
            loading="lazy"
          />
        </AnimatePresence>

        {/* Gallery Slider Controls (visible on hover if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-25 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-[#2B231E] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-25 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-[#2B231E] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}

        {/* Carousel Pagination Dots (Bottom-Center of Image) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
          {images.map((_, dotIdx) => (
            <span
              key={dotIdx}
              className={`block rounded-full transition-all duration-300 ${
                dotIdx === currentImgIdx
                  ? 'w-4 h-1.5 bg-[#26201D]'
                  : 'w-1.5 h-1.5 bg-white/75'
              }`}
            />
          ))}
          {/* If only 1 image, show 3 decorative reference dots like the mockup */}
          {images.length === 1 && (
            <>
              <span className="block w-4 h-1.5 bg-[#26201D] rounded-full" />
              <span className="block w-1.5 h-1.5 bg-white/75 rounded-full" />
              <span className="block w-1.5 h-1.5 bg-white/75 rounded-full" />
            </>
          )}
        </div>
      </div>

      {/* ================= CARD BODY CONTENT ================= */}
      <div className="p-4 sm:p-6 flex flex-col gap-2.5 sm:gap-3.5 bg-transparent">
        
        {/* Product Title in Refined Italic Serif */}
        <div>
          <h3 className="font-serif italic text-[20px] sm:text-[23px] md:text-[24px] text-[#1D1815] leading-snug tracking-normal line-clamp-1 group-hover:text-[#825424] transition-colors duration-200">
            {product.name}
          </h3>
          
          {/* Subtitle / Concentration */}
          <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] uppercase text-[#8C837A] mt-1">
            {product.concentration ? 'EAU DE PARFUM' : (product.category || 'EAU DE PARFUM')}
          </p>
        </div>

        {/* Olfactory Notes Row (3 Minimalist Tags with Vertical Dividers) */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-[#3E352F] py-0.5 overflow-hidden">
          {accents.map((acc, aIdx) => (
            <React.Fragment key={acc.label}>
              <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[11px] font-bold uppercase tracking-[0.12em] whitespace-nowrap">
                <AccentIcon type={acc.type} />
                <span>{acc.label}</span>
              </div>
              {aIdx < accents.length - 1 && (
                <div className="h-3 w-[1px] bg-[#DCD4C7] flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Price & Discount Badge Row */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[19px] sm:text-[22px] font-bold text-[#1C1815] tracking-tight">
              {formatPrice(product.price, activeCurrency)}
            </span>
            <span className="text-[12.5px] sm:text-[14px] text-[#9E9389] line-through font-normal">
              {formatPrice(comparePrice, activeCurrency)}
            </span>
          </div>

          {/* Discount Pill Badge */}
          <div className="px-2.5 py-0.5 rounded-full bg-[#F5E6D3] text-[#7E5122] text-[11px] sm:text-[12px] font-bold border border-[#EBD6BE] flex-shrink-0">
            -{discountPercent}%
          </div>
        </div>

        {/* ================= FULL-WIDTH "ADD TO BAG" ACTION BUTTON ================= */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={handleAddClick}
          className="w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-[16px] sm:rounded-[18px] bg-[#241F1C] hover:bg-[#120F0D] text-white flex items-center justify-between shadow-[0_4px_14px_rgba(36,31,28,0.2)] hover:shadow-[0_8px_20px_rgba(36,31,28,0.32)] transition-all duration-300 group/btn mt-1"
          title={`Add ${product.name} to Bag`}
          aria-label={`Add ${product.name} to Bag`}
        >
          {/* Shopping Bag Outline Icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/90 flex-shrink-0"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>

          {/* Button Text */}
          <span className="font-sans font-bold text-[11.5px] sm:text-[12.5px] tracking-[0.2em] uppercase text-white">
            ADD TO BAG
          </span>

          {/* Right Arrow Icon with Hover Slide */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/90 flex-shrink-0 group-hover/btn:translate-x-1.5 transition-transform duration-200"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
}
