import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../data/bluorngSaudagarData.js';

export default function BluorngQuickBuyModal(props) {
  // Hooks must not run after an early return, so the null guard lives in this wrapper.
  if (!props.product) return null;
  return <QuickBuyModalContent {...props} />;
}

function QuickBuyModalContent({
  product,
  activeCurrency = 'INR',
  wishlist = [],
  onToggleWishlist,
  onClose,
  onAddToCart,
  onViewDetails
}) {
  const defaultSizes = [
    { ml: 50, label: '50 ml', price: product.price || 5500 },
    { ml: 100, label: '100 ml', price: Math.round((product.price || 5500) * 1.62) },
    { ml: 30, label: '30 ml', price: Math.round((product.price || 5500) * 0.76) }
  ];

  const sizes = product.sizes && product.sizes.length > 0
    ? product.sizes.map((sz, idx) => ({
        ml: sz.ml || (idx === 0 ? 50 : idx === 1 ? 100 : 30),
        label: sz.label
          ? sz.label.toLowerCase().includes('ml')
            ? sz.label.replace(/ml/i, ' ml').replace(/extrait/i, '').trim()
            : sz.label
          : `${sz.ml || 50} ml`,
        price: sz.price || product.price
      }))
    : defaultSizes;

  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const currentPrice = selectedSize?.price || product.price;
  const image = product.images?.[0] || product.image || '/images/crystal_square_flacon.png';

  // Extract key notes chord for olfactive preview
  const notesChord = product.notes
    ? [
        ...(product.notes.heart || []),
        ...(product.notes.top || []),
        ...(product.notes.base || [])
      ].slice(0, 3).join(' · ')
    : product.category || 'Pure Artisan Formulation';

  const concentrationText = product.concentration
    ? product.concentration.split('·')[0].trim()
    : 'Extrait de Parfum';

  const handleAdd = () => {
    setIsAdded(true);
    onAddToCart({
      productId: product.id,
      size: selectedSize.label,
      price: currentPrice,
      quantity
    });
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 450);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.32 }}
        className="relative w-full max-w-[420px] sm:max-w-[680px] lg:max-w-[720px] bg-[#FFFFFF] dark:bg-[#121117] rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.32)] dark:shadow-[0_0_80px_rgba(212,175,55,0.06)] border border-[#ECEAE5] dark:border-white/10 overflow-hidden text-[#111111] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal Circle Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-[#777777] hover:text-[#111111] dark:text-[#A09D96] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close Quick Add"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 2-Column Responsive Card Body (1 col on mobile, 12 cols on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 sm:gap-7 items-center p-5 sm:p-7">
          
          {/* ================= LEFT: FLACON ATELIER VITRINE (5 COLS) ================= */}
          <div className="sm:col-span-5 relative w-full h-[210px] sm:h-[320px] rounded-2xl bg-gradient-to-b from-[#F7F6F2] to-[#ECEAE3] dark:from-[#18171E] dark:to-[#121116] flex items-center justify-center p-4 overflow-hidden border border-[#ECEAE4] dark:border-white/5">
            {/* Ambient Warm Studio Light Aura */}
            <div className="absolute w-44 h-44 rounded-full bg-amber-400/15 dark:bg-[#ECC86A]/10 blur-2xl pointer-events-none" />

            {/* Optional Badge */}
            {product.badge && (
              <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-[0.16em] font-semibold bg-white/95 dark:bg-[#0B0A0D]/95 text-[#111111] dark:text-[#ECC86A] shadow-xs border border-black/5 dark:border-white/10 z-10">
                {product.badge}
              </span>
            )}

            {/* Wishlist Bookmark Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist && onToggleWishlist(product.id);
              }}
              className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer bg-white/85 dark:bg-black/60 hover:bg-white dark:hover:bg-black/90 text-[#111111] dark:text-white shadow-xs backdrop-blur-xs"
              title={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-label="Wishlist"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                className={wishlist.includes(product.id) ? 'text-[#C4823F] dark:text-[#ECC86A]' : 'text-[#888888] dark:text-white/60'}
                fill={wishlist.includes(product.id) ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            {/* Floating Flacon Artwork */}
            <motion.img
              initial={{ scale: 0.92, y: 6 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              whileHover={{ scale: 1.05, y: -4 }}
              src={image}
              alt={product.name}
              className="max-h-[175px] sm:max-h-[250px] w-auto object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.18)] z-10 cursor-pointer"
              onClick={() => onViewDetails && onViewDetails(product.id)}
              title="Click to view full monograph"
            />

            {/* Flacon Volume Watermark */}
            <span className="absolute bottom-3 left-3 text-[9.5px] uppercase font-mono tracking-wider text-[#888888] dark:text-[#88857F] z-10">
              {product.volume || '50ml / 1.7 FL. OZ.'}
            </span>
          </div>

          {/* ================= RIGHT: MONOGRAPH & PURCHASE ACTIONS (7 COLS) ================= */}
          <div className="sm:col-span-7 flex flex-col justify-between space-y-4">
            
            {/* Monograph Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9.5px] uppercase tracking-[0.22em] text-[#C4823F] dark:text-[#ECC86A] font-semibold">
                  {concentrationText}
                </span>
                <span className="text-[#CCCCCC] dark:text-white/20">·</span>
                <span className="text-[9.5px] uppercase tracking-[0.16em] text-[#888888] dark:text-[#88857F]">
                  Atelier Edition
                </span>
              </div>

              <h3 className="text-[18px] sm:text-[21px] font-normal uppercase tracking-tight text-[#111111] dark:text-white mt-1 leading-snug">
                {product.name}
              </h3>

              {/* Olfactive Notes Preview */}
              <p className="text-[12px] font-light text-[#777777] dark:text-[#A09D96] tracking-wide mt-1 line-clamp-1">
                {notesChord}
              </p>

              {/* Price & Value Badge */}
              <div className="mt-2.5 flex items-baseline gap-2.5">
                <span className="text-[20px] font-medium tracking-tight text-[#111111] dark:text-[#ECC86A] tabular-nums">
                  {formatPrice(currentPrice, activeCurrency)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                  <>
                    <span className="text-[12.5px] text-[#999999] dark:text-[#777570] line-through tabular-nums">
                      {formatPrice(product.compareAtPrice, activeCurrency)}
                    </span>
                    <span className="text-[9.5px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                      Privilege
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Size Selector Grid with Capacity and Price */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9.5px] uppercase tracking-[0.16em] font-medium text-[#888888] dark:text-[#88857F]">
                  Select Volume
                </span>
                <span className="text-[10px] text-[#C4823F] dark:text-[#ECC86A] font-mono">
                  {selectedSize.label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {sizes.map((sz) => {
                  const isSelected = selectedSize.label === sz.label;
                  return (
                    <button
                      key={sz.label}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`py-2 px-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-[#111111] bg-[#111111] text-white dark:border-[#ECC86A] dark:bg-[#D4AF37] dark:text-[#0B0A0D] shadow-sm font-medium'
                          : 'border-[#EAEAEA] dark:border-white/10 bg-[#FAF9F6] dark:bg-[#18171E] text-[#666666] dark:text-[#A09D96] hover:border-[#CCCCCC] dark:hover:border-white/20'
                      }`}
                    >
                      <div className="text-[11.5px] uppercase tracking-wider font-semibold">
                        {sz.label}
                      </div>
                      <div className={`text-[10px] tabular-nums mt-0.5 ${isSelected ? 'opacity-90' : 'text-[#888888] dark:text-[#88857F]'}`}>
                        {formatPrice(sz.price, activeCurrency)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Row: Stepper & Add to Bag CTA */}
            <div className="pt-1 flex items-center gap-3">
              {/* Refined Rounded Stepper */}
              <div className="flex items-center gap-1.5 bg-[#F4F3F0] dark:bg-[#18171E] border border-[#EAE8E0] dark:border-white/10 px-2.5 py-1.5 rounded-full text-[#111111] dark:text-white shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-6 h-6 flex items-center justify-center text-[13px] text-[#777777] hover:text-[#111111] dark:hover:text-white cursor-pointer select-none rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-5 text-center text-[12px] font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-6 h-6 flex items-center justify-center text-[13px] text-[#777777] hover:text-[#111111] dark:hover:text-white cursor-pointer select-none rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Primary Luxury CTA */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                className="flex-1 py-3 px-5 bg-[#111111] hover:bg-[#C4823F] dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] text-white dark:text-[#0B0A0D] text-[11px] font-medium uppercase tracking-[0.16em] rounded-full transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-between"
              >
                <span>{isAdded ? 'Added to Bag ✓' : 'Add to Bag'}</span>
                <span className="font-semibold tabular-nums ml-2">
                  {formatPrice(currentPrice * quantity, activeCurrency)}
                </span>
              </motion.button>
            </div>

            {/* Atelier Privilege & Monograph Navigation Footer */}
            <div className="pt-2 border-t border-[#EAEAEA] dark:border-white/10 flex items-center justify-between text-[10.5px]">
              <span className="text-[#888888] dark:text-[#88857F] flex items-center gap-1 font-light">
                <span className="text-[#C4823F] dark:text-[#ECC86A]">✦</span>
                <span>Complimentary 2ml vial included</span>
              </span>

              {onViewDetails && (
                <button
                  type="button"
                  onClick={() => onViewDetails(product.id)}
                  className="uppercase tracking-wider text-[#C4823F] dark:text-[#ECC86A] hover:underline cursor-pointer font-medium"
                >
                  View Details →
                </button>
              )}
            </div>

          </div>

        </div>

      </motion.div>
    </motion.div>
  );
}
