import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_PRODUCTS, formatPrice } from '../data/bluorngSaudagarData.js';
import BluorngProductCard from './BluorngProductCard.jsx';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';
import MagneticButton from './motion/MagneticButton.jsx';

export default function BluorngPDP({
  productId,
  activeCurrency = 'INR',
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onNavigateHome,
  onNavigateCollection
}) {
  const product = ALL_PRODUCTS.find((p) => p.id === productId) || ALL_PRODUCTS[0];

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image || '/images/crystal_square_flacon.png'];

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(
    product.sizes?.[0] || { ml: 50, label: '50ML', price: product.price }
  );
  const [quantity, setQuantity] = useState(1);
  const [engraving, setEngraving] = useState('');
  const [isEngravingOpen, setIsEngravingOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('notes'); // 'notes' | 'desc' | 'shipping' | 'craft'

  const currentPrice = selectedSize.price || product.price;

  const toggleAccordion = (tab) => {
    setOpenAccordion(openAccordion === tab ? null : tab);
  };

  const handleAddToCartClick = () => {
    onAddToCart({
      productId: product.id,
      size: selectedSize.label,
      price: currentPrice,
      quantity,
      engraving
    });
  };

  const handleBuyNowClick = () => {
    onBuyNow({
      productId: product.id,
      size: selectedSize.label,
      price: currentPrice,
      quantity,
      engraving
    });
  };

  // Related products
  const relatedProducts = ALL_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="w-full bg-[#FFFFFF] text-[#111111] min-h-screen">
      
      {/* ================= BREADCRUMBS ================= */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 text-[11px] uppercase tracking-wider text-[#777777] border-b border-[#EEEEEE] flex items-center gap-2">
        <button onClick={onNavigateHome} className="hover:text-[#111111] transition-colors cursor-pointer">
          Home
        </button>
        <span>/</span>
        <button onClick={() => onNavigateCollection('all')} className="hover:text-[#111111] transition-colors cursor-pointer">
          Collections
        </button>
        <span>/</span>
        <span className="text-[#111111] font-semibold">{product.name}</span>
      </div>

      {/* ================= MAIN PDP CONTAINER ================= */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          
          {/* ================= LEFT: MULTI-IMAGE GALLERY (7 COLS) ================= */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row-reverse gap-4">
            
            {/* Primary High-Res Stage Image with Smooth Crossfade */}
            <div className="flex-1 aspect-[4/5] bg-[#F7F7F6] flex items-center justify-center p-8 sm:p-14 overflow-hidden rounded-xs border border-[#EEEEEE] relative group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={images[activeImgIdx]}
                  src={images[activeImgIdx]}
                  alt={product.name}
                  initial={{ opacity: 0.8, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.8 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-full h-full object-contain object-center group-hover:scale-106 transition-transform duration-700 ease-out filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
                />
              </AnimatePresence>
              {product.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] uppercase bg-[#111111] text-white shadow-xs">
                    {product.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Vertical Thumbnail Rail (Desktop) / Horizontal (Mobile) */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:w-20 shrink-0">
              {images.map((img, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`aspect-[4/5] w-16 sm:w-full bg-[#F7F7F6] flex items-center justify-center p-1.5 overflow-hidden rounded-xs border-2 transition-all shrink-0 cursor-pointer ${
                    activeImgIdx === idx
                      ? 'border-[#111111] opacity-100 shadow-xs'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-contain" />
                </motion.button>
              ))}
            </div>

          </div>

          {/* ================= RIGHT: STICKY PRODUCT FORM (5 COLS) ================= */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <div className="sticky top-24 space-y-5">
              
              {/* Category & Title */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-bold tracking-[0.22em] uppercase text-[#C4823F]">
                    {product.category || 'Extrait de Parfum'}
                  </span>
                  <span className="font-script text-[#C4823F] text-[18px] sm:text-[21px] normal-case tracking-normal">
                    rare extrait
                  </span>
                </div>
                <h1 className="text-[24px] sm:text-[30px] font-black uppercase tracking-[0.12em] text-[#111111] leading-tight mt-1">
                  {product.name}
                </h1>
                
                {/* Rating & Reviews */}
                <div className="flex items-center gap-2 mt-2 text-[12px] text-[#555555]">
                  <div className="flex text-[#C4823F]">
                    {'★'.repeat(Math.floor(product.rating || 5))}
                  </div>
                  <span className="font-bold text-[#111111]">{product.rating || '5.0'}</span>
                  <span>•</span>
                  <span className="underline cursor-pointer">{product.reviewsCount || 180} Connoisseur Reviews</span>
                </div>
              </div>

              {/* Pricing Row */}
              <div className="pt-2 border-t border-[#F0F0F0]">
                <div className="flex items-baseline gap-3">
                  <span className="text-[22px] sm:text-[26px] font-bold text-[#111111] tracking-wide">
                    {formatPrice(currentPrice, activeCurrency)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                    <span className="text-[14px] text-[#999999] line-through">
                      {formatPrice(product.compareAtPrice, activeCurrency)}
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-[#777777] uppercase tracking-wider mt-1">
                  Inclusive of all taxes & complimentary insured express delivery.
                </p>
              </div>

              {/* Volume / Size Selector Pills */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#111111]">
                    Flacon Size: <span className="font-normal text-[#555555]">{selectedSize.label}</span>
                  </label>
                  <span className="text-[10px] text-[#C4823F] font-semibold tracking-wider">
                    {product.concentration || 'Pure Extrait'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes?.map((sz) => (
                    <button
                      key={sz.label}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] rounded-xs transition-all border ${
                        selectedSize.label === sz.label
                          ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                          : 'border-[#CCCCCC] bg-[#FFFFFF] text-[#111111] hover:border-[#111111]'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complimentary Bottle Engraving Feature */}
              <div className="bg-[#FAF9F6] p-3.5 border border-[#EEEEEE] rounded-xs text-[11px]">
                <button
                  type="button"
                  onClick={() => setIsEngravingOpen(!isEngravingOpen)}
                  className="w-full flex items-center justify-between font-bold uppercase tracking-wider text-[#111111]"
                >
                  <span className="flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Complimentary Crystal Flacon Engraving</span>
                  </span>
                  <span>{isEngravingOpen ? '−' : '+'}</span>
                </button>
                
                {isEngravingOpen && (
                  <div className="mt-3 pt-2.5 border-t border-[#E5E5E5] space-y-2">
                    <p className="text-[10px] text-[#666666]">
                      Our master calligrapher can engrave up to 12 characters (e.g. initials or names) onto the glass flacon.
                    </p>
                    <input
                      type="text"
                      maxLength={12}
                      value={engraving}
                      onChange={(e) => setEngraving(e.target.value.toUpperCase())}
                      placeholder="ENTER INITIALS (MAX 12 CHARS)"
                      className="w-full px-3 py-2 border border-[#CCCCCC] rounded-xs text-[11px] font-bold uppercase tracking-widest outline-none focus:border-[#111111]"
                    />
                  </div>
                )}
              </div>

              {/* Quantity Stepper & CTA Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#111111]">
                    Quantity:
                  </span>
                  <div className="flex items-center border border-[#111111] rounded-xs overflow-hidden">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 flex items-center justify-center hover:bg-[#F2F2F2] font-bold cursor-pointer"
                    >
                      −
                    </motion.button>
                    <span className="w-10 text-center text-xs font-bold">
                      {quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-[#F2F2F2] font-bold cursor-pointer"
                    >
                      +
                    </motion.button>
                  </div>
                </div>

                {/* Primary: Add to Bag */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleAddToCartClick}
                  className="w-full py-4 bg-[#FFFFFF] hover:bg-[#111111] text-[#111111] hover:text-white border-2 border-[#111111] text-[12px] font-bold uppercase tracking-[0.22em] transition-colors duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer will-change-transform"
                >
                  <span>Add To Bag • {formatPrice(currentPrice * quantity, activeCurrency)}</span>
                </motion.button>

                {/* Secondary: Buy It Now */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleBuyNowClick}
                  className="w-full py-4 bg-[#111111] hover:bg-[#C4823F] text-white text-[12px] font-bold uppercase tracking-[0.22em] transition-colors duration-300 shadow-xl cursor-pointer will-change-transform"
                >
                  Buy It Now
                </motion.button>
              </div>

              {/* ================= ACCORDION SPECIFICATIONS ================= */}
              <div className="pt-4 border-t border-[#E5E5E5] divide-y divide-[#EEEEEE] text-[12px]">
                
                {/* Fragrance Notes */}
                <div className="py-3">
                  <button
                    onClick={() => toggleAccordion('notes')}
                    className="w-full flex items-center justify-between font-bold uppercase tracking-wider text-[#111111] cursor-pointer"
                  >
                    <span>Fragrance Notes & Pyramid</span>
                    <span className="text-[14px]">{openAccordion === 'notes' ? '−' : '+'}</span>
                  </button>
                  <AnimatePresence>
                    {openAccordion === 'notes' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden pt-3 pb-1 space-y-2.5 text-[#555555] text-[11.5px]"
                      >
                        <div>
                          <strong className="text-[#111111] uppercase tracking-wide text-[10.5px]">Top Notes:</strong>
                          <p>{product.notes?.top?.join(' · ') || 'Wild Bergamot, Saffron, Crushed Pepper'}</p>
                        </div>
                        <div>
                          <strong className="text-[#111111] uppercase tracking-wide text-[10.5px]">Heart Notes:</strong>
                          <p>{product.notes?.heart?.join(' · ') || '18-Year Aged Oud, Taif Rose, Resinous Lichen'}</p>
                        </div>
                        <div>
                          <strong className="text-[#111111] uppercase tracking-wide text-[10.5px]">Base Notes:</strong>
                          <p>{product.notes?.base?.join(' · ') || 'Mysore Sandalwood, Flint Mineral, Dark Ambergris'}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sillage & Longevity */}
                <div className="py-3">
                  <button
                    onClick={() => toggleAccordion('desc')}
                    className="w-full flex items-center justify-between font-bold uppercase tracking-wider text-[#111111] cursor-pointer"
                  >
                    <span>Olfactory Character & Sillage</span>
                    <span className="text-[14px]">{openAccordion === 'desc' ? '−' : '+'}</span>
                  </button>
                  <AnimatePresence>
                    {openAccordion === 'desc' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden pt-3 pb-1 text-[#555555] leading-relaxed text-[11.5px]"
                      >
                        <p>{product.description}</p>
                        <p className="mt-2 text-[10.5px] text-[#777777]">
                          Concentration: {product.concentration} · Designed for monumental 18-24 hour projection.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Shipping & Returns */}
                <div className="py-3">
                  <button
                    onClick={() => toggleAccordion('shipping')}
                    className="w-full flex items-center justify-between font-bold uppercase tracking-wider text-[#111111] cursor-pointer"
                  >
                    <span>Shipping & Test-First Guarantee</span>
                    <span className="text-[14px]">{openAccordion === 'shipping' ? '−' : '+'}</span>
                  </button>
                  <AnimatePresence>
                    {openAccordion === 'shipping' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden pt-3 pb-1 text-[#555555] leading-relaxed text-[11.5px] space-y-1.5"
                      >
                        <p>
                          📦 <strong>Complimentary 2ml Sample Included:</strong> Test the sample vial before opening the sealed crystal flacon. If not deeply captivated, return the unopened flacon for a 100% full refund.
                        </p>
                        <p>
                          ✈️ <strong>Express Courier:</strong> Dispatched within 24 hours via temperature-controlled air freight.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ================= RELATED / PAIR WITH SECTION ================= */}
        <ScrollReveal variant="fade-up" className="mt-16 pt-12 border-t border-[#E5E5E5]">
          <div className="mb-6">
            <span className="text-[10px] font-bold tracking-[0.24em] uppercase text-[#C4823F]">
              Curated Pairings
            </span>
            <h2 className="text-[20px] sm:text-[24px] font-black uppercase tracking-[0.14em] text-[#111111]">
              You May Also Appreciate
            </h2>
          </div>

          <StaggerContainer staggerDelay={0.06} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((relProd) => (
              <StaggerItem key={relProd.id}>
                <BluorngProductCard
                  product={relProd}
                  activeCurrency={activeCurrency}
                  onSelectProduct={onSelectProduct}
                  onToggleWishlist={() => {}}
                  onQuickBuy={() => {
                    onAddToCart({
                      productId: relProd.id,
                      size: '50ML',
                      price: relProd.price,
                      quantity: 1
                    });
                  }}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ScrollReveal>

      </div>
    </div>
  );
}
