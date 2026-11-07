import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ALL_PRODUCTS, formatPrice } from '../data/bluorngSaudagarData.js';
import BluorngProductCard from './BluorngProductCard.jsx';
import BluorngProductReviews from './BluorngProductReviews.jsx';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';
import { useSmoothScroll } from './motion/SmoothScrollProvider.jsx';

export default function BluorngPDP({
  productId,
  cartCount = 0,
  wishlist = [],
  onToggleWishlist,
  theme = 'light',
  onToggleTheme,
  onOpenCart,
  onOpenSearch,
  onOpenStory,
  onOpenNavDrawer,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onNavigateHome,
  onNavigateCollection
}) {
  const product = ALL_PRODUCTS.find((p) => p.id === productId) || ALL_PRODUCTS[0];
  const isCurrentWishlisted = wishlist.includes(product.id);

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image || '/images/saudagar_amber_gold.png'];

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [mobileImgIdx, setMobileImgIdx] = useState(0);
  const trackRef = useRef(null);
  const { scrollTo } = useSmoothScroll();

  // Ensure immediate scroll reset and state sync when PDP mounts or product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: true });
    }
    setActiveImgIdx(0);
    setMobileImgIdx(0);
  }, [productId]);

  // Track scroll progress through the pinned hero section (Desktop)
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end']
  });

  const numImgs = images.length;
  const keyframesInput = numImgs === 3
    ? [0, 0.24, 0.40, 0.64, 0.76, 1]
    : numImgs === 2
    ? [0, 0.35, 0.65, 1]
    : [0, 1];

  const keyframesOutput = numImgs === 3
    ? ['0%', '0%', '-100%', '-100%', '-200%', '-200%']
    : numImgs === 2
    ? ['0%', '0%', '-100%', '-100%']
    : ['0%', '0%'];

  const yTransform = useTransform(scrollYProgress, keyframesInput, keyframesOutput);

  // Sync the desktop active indicator dot based on scroll progress
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      let newIdx = 0;
      if (numImgs >= 3) {
        if (latest < 0.32) newIdx = 0;
        else if (latest < 0.70) newIdx = 1;
        else newIdx = 2;
      } else if (numImgs === 2) {
        newIdx = latest < 0.5 ? 0 : 1;
      } else {
        newIdx = 0;
      }
      setActiveImgIdx(newIdx);
    });
    return () => unsubscribe();
  }, [scrollYProgress, numImgs]);

  // Desktop dot click handler
  const handleDotClick = (targetIdx) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const trackTop = window.scrollY + rect.top;
    const totalScrollable = trackRef.current.offsetHeight - window.innerHeight;

    let targetRatio = 0;
    if (numImgs >= 3) {
      if (targetIdx === 0) targetRatio = 0.12;
      else if (targetIdx === 1) targetRatio = 0.52;
      else targetRatio = 0.88;
    } else if (numImgs === 2) {
      targetRatio = targetIdx === 0 ? 0.15 : 0.85;
    }

    const targetScrollY = trackTop + targetRatio * totalScrollable;
    if (scrollTo) {
      scrollTo(targetScrollY, { duration: 0.8 });
    } else {
      window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
    }
  };

  // Mobile horizontal swipe handler (Left & Right swipe)
  const handleMobileSwipe = (e, info) => {
    if (images.length <= 1) return;
    const swipeThreshold = 40;
    const velocityThreshold = 350;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      // Swiped Left -> Next image
      setMobileImgIdx((prev) => (prev + 1) % images.length);
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swiped Right -> Previous image
      setMobileImgIdx((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Available sizes
  const defaultSizes = [
    { ml: 50, label: '50 ml', price: product.price || 5500 },
    { ml: 75, label: '75 ml', price: Math.round((product.price || 5500) * 1.35) },
    { ml: 100, label: '100 ml', price: Math.round((product.price || 5500) * 1.62) }
  ];

  const sizes = product.sizes && product.sizes.length >= 2
    ? product.sizes.map((sz, idx) => ({
        ml: sz.ml || (idx === 0 ? 50 : idx === 1 ? 75 : 100),
        label: `${sz.ml || (idx === 0 ? 50 : idx === 1 ? 75 : 100)} ml`,
        price: sz.price || product.price
      }))
    : defaultSizes;

  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState(null);

  const currentPrice = selectedSize.price || product.price;

  const toggleAccordion = (tab) => {
    setOpenAccordion(openAccordion === tab ? null : tab);
  };

  const handleAddToCartClick = () => {
    if (onAddToCart) {
      onAddToCart({
        productId: product.id,
        size: selectedSize.label,
        price: currentPrice,
        quantity
      });
    }
  };

  const getDeliveryDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const day = d.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? 'st'
        : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
        ? 'rd'
        : 'th';
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    return `${weekday} ${day}${suffix} of ${month}`;
  };

  const cleanTitle = (product.name || 'Saudagar Extrait')
    .replace(/^saudagar\s+/i, '')
    .toUpperCase();

  const categoryPrefix = product.category
    ? product.category.split(' ')[0].toUpperCase()
    : 'EXTRAIT';

  const allInCat = ALL_PRODUCTS.filter((p) => p.category === product.category);
  const currentIdx = Math.max(0, allInCat.findIndex((p) => p.id === product.id));
  const num = String(currentIdx + 1).padStart(2, '0');
  const total = String(Math.max(1, allInCat.length)).padStart(2, '0');

  const relatedProducts = ALL_PRODUCTS
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  // Animations
  const flaconHeroVariants = {
    hidden: { scale: 0.92, y: 32, opacity: 0 },
    visible: {
      scale: 1,
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const auraVariants = {
    hidden: { scale: 0.6, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut'
      }
    }
  };

  const monographContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.055,
        delayChildren: 0.08
      }
    }
  };

  const monographItemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.48,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  // Render monograph details (shared between desktop right column and mobile body)
  const renderMonographDetails = (isMobile = false) => (
    <motion.div
      key={`monograph-${product.id}-${isMobile ? 'm' : 'd'}`}
      variants={monographContainerVariants}
      initial="hidden"
      animate="visible"
      className={`${isMobile ? 'w-full py-4' : 'my-auto py-8 sm:py-12 max-w-[420px] w-full mx-auto lg:mx-0'}`}
    >
      {/* 1. Sub-label with Pill Badge & Reviews Anchor */}
      <motion.div variants={monographItemVariants} className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FFF7ED] dark:bg-[#D4AF37]/15 text-[#C4823F] dark:text-[#ECC86A] text-[10.5px] font-medium tracking-wider uppercase border border-[#C4823F]/20 dark:border-[#D4AF37]/30">
            {categoryPrefix}
          </span>
          <span className="text-[12px] sm:text-[13px] text-[#777777] dark:text-[#999999] font-normal tracking-[0.02em]">
            no. {num} / {total}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('reviews-section');
            if (el) {
              if (window.__lenis) {
                window.__lenis.scrollTo(el, { offset: -20 });
              } else {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }}
          className="inline-flex items-center gap-1.5 text-[11px] text-[#C4823F] dark:text-[#ECC86A] hover:underline cursor-pointer select-none"
          title="Jump to Client Reviews"
        >
          <span className="tracking-tight text-[10.5px]">★★★★★</span>
          <span className="font-semibold text-[#111111] dark:text-white">4.9</span>
          <span className="text-[#888888] dark:text-white/40">({product.reviewsCount || 42})</span>
        </button>
      </motion.div>

      {/* 2. Product Title */}
      <motion.h1
        variants={monographItemVariants}
        className="font-sans font-normal text-[28px] sm:text-[36px] lg:text-[42px] tracking-[-0.015em] text-[#111111] dark:text-white leading-[1.14] mb-3"
      >
        {cleanTitle}
      </motion.h1>

      {/* 3. Description Paragraph */}
      <motion.p
        variants={monographItemVariants}
        className="font-sans font-light text-[13px] sm:text-[13.5px] leading-[1.68] text-[#333333] dark:text-[#CCCCCC] mb-6"
      >
        {product.description}
      </motion.p>

      {/* 4. Size / Volume Selectors */}
      <motion.div variants={monographItemVariants} className="flex items-center gap-2.5 sm:gap-3 mb-6">
        {sizes.map((sz) => {
          const isSelected = selectedSize.label === sz.label;
          return (
            <button
              key={sz.label}
              onClick={() => setSelectedSize(sz)}
              className={`min-w-[78px] sm:min-w-[84px] h-[38px] px-4 rounded-[2px] text-[12px] font-normal transition-all flex items-center justify-center cursor-pointer ${
                isSelected
                  ? 'bg-[#111111] text-white border border-[#111111] dark:bg-[#D4AF37] dark:text-[#0B0A0D] dark:border-[#D4AF37] shadow-[0_3px_12px_rgba(212,175,55,0.25)] font-medium'
                  : 'bg-white text-[#111111] border border-[#E0D4D6] hover:border-[#C4823F] hover:text-[#C4823F] dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:border-[#ECC86A] dark:hover:text-[#ECC86A]'
              }`}
            >
              {sz.label}
            </button>
          );
        })}
      </motion.div>

      {/* 5. Tenet Line + Quantity Stepper Row */}
      <motion.div variants={monographItemVariants} className="flex items-center justify-between gap-4 mb-5">
        <span className="text-[12px] sm:text-[12.5px] text-[#444444] dark:text-[#AAAAAA] font-normal tracking-wide flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C4823F] dark:bg-[#ECC86A]" />
          <span>Vegan</span>
          <span className="text-[#C4823F]/60 dark:text-[#ECC86A]/60">•</span>
          <span>Cruelty Free</span>
        </span>

        {/* Stepper Box */}
        <div className="border border-[#E0D4D6] dark:border-white/25 rounded-[2px] h-[34px] flex items-center px-1 bg-white dark:bg-transparent hover:border-[#C4823F]/40 dark:hover:border-[#ECC86A]/40 transition-colors">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-6 h-6 flex items-center justify-center text-[14px] text-[#666666] dark:text-white/60 hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors cursor-pointer"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-7 text-center font-medium text-[12px] text-[#111111] dark:text-white">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-6 h-6 flex items-center justify-center text-[14px] text-[#666666] dark:text-white/60 hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors cursor-pointer"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </motion.div>

      {/* 6. Add To Cart Button + Wishlist Save Bookmark Button */}
      <motion.div variants={monographItemVariants} className="flex items-center gap-2.5">
        <button
          onClick={handleAddToCartClick}
          className="flex-1 h-[46px] bg-[#111111] hover:bg-[#C4823F] text-white dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] dark:text-[#0B0A0D] rounded-[2px] flex items-center shadow-[0_4px_16px_rgba(0,0,0,0.18)] hover:shadow-[0_6px_20px_rgba(196,130,63,0.3)] dark:shadow-[0_4px_16px_rgba(212,175,55,0.25)] active:scale-[0.99] transition-all cursor-pointer select-none group font-medium"
        >
          <span className="flex-1 text-center text-[12.5px] font-medium tracking-[0.03em]">
            Add to cart
          </span>
          <span className="w-[1px] h-[20px] bg-white/20 dark:bg-black/20 shrink-0" />
          <span className="px-4 sm:px-5 text-center text-[12.5px] font-medium tracking-[0.02em] whitespace-nowrap text-[#FFF7ED] dark:text-[#0B0A0D]">
            {formatPrice(currentPrice * quantity)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
          className={`w-[46px] h-[46px] shrink-0 rounded-[2px] border transition-all duration-300 flex items-center justify-center cursor-pointer ${
            isCurrentWishlisted
              ? 'border-[#C4823F] bg-[#FFF7ED] text-[#C4823F] dark:border-[#ECC86A] dark:bg-[#D4AF37]/15 dark:text-[#ECC86A] shadow-xs'
              : 'border-[#E0D4D6] dark:border-white/20 bg-white dark:bg-transparent text-[#777777] dark:text-white/60 hover:border-[#C4823F] hover:text-[#C4823F] dark:hover:border-[#ECC86A] dark:hover:text-[#ECC86A]'
          }`}
          title={isCurrentWishlisted ? 'Remove from saved wishlist' : 'Save to private wishlist'}
          aria-label="Wishlist"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={isCurrentWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </motion.div>

      {/* 7. Delivery & Trust Micro-lines */}
      <motion.div
        variants={monographItemVariants}
        className="mt-5 space-y-1.5 text-[11px] text-[#777777] dark:text-[#999999] leading-relaxed"
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] leading-none text-[#C4823F] dark:text-[#ECC86A]">✓</span>
          <span>Order before 17:00 to receive {getDeliveryDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] leading-none text-[#C4823F] dark:text-[#ECC86A]">•</span>
          <span>Delivering across India</span>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="w-full bg-[#FFFFFF] dark:bg-[#0B0A0D] text-[#111111] dark:text-white transition-colors duration-300 flex flex-col font-sans select-none">
      
      {/* ============================================================== */}
      {/* ================= 1. DESKTOP VIEW (>= lg) =================== */}
      {/* ============================================================== */}
      <div
        ref={trackRef}
        className="hidden lg:block relative w-full"
        style={{ height: `${Math.max(1, images.length) * 100}vh` }}
      >
        {/* Sticky 100vh Split-Screen Viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden grid grid-cols-2 z-10">
          
          {/* Left Half: Pedestal with Parallax Vertical Images */}
          <div className="bg-[#F8F8F8] dark:bg-[#141318] border-r border-[#EEEEEE] dark:border-white/10 h-full relative overflow-hidden flex flex-col justify-between transition-colors duration-300">
            
            {/* Top-Left Pinned Brand Logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
              className="absolute top-10 left-10 lg:top-14 lg:left-14 z-30 pointer-events-auto"
            >
              <button
                onClick={onNavigateHome}
                className="flex items-center hover:opacity-80 transition-opacity cursor-pointer select-none"
                title="Return to Home"
                aria-label="Saudagar Perfumers Home"
              >
                <img
                  src="/images/saudagar_logo_black.png"
                  alt="Saudagar Perfumers"
                  className="h-7 lg:h-8 w-auto object-contain dark:hidden block"
                />
                <img
                  src="/images/saudagar_logo_gold.png"
                  alt="Saudagar Perfumers"
                  className="h-7 lg:h-8 w-auto object-contain hidden dark:block"
                />
              </button>
            </motion.div>

            {/* Vertical Animated Flacon Stack (Driven by Desktop Scroll) */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <motion.div
                style={{ y: yTransform }}
                className="w-full h-full flex flex-col will-change-transform"
              >
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full h-screen shrink-0 flex items-center justify-center p-8 sm:p-14 relative"
                  >
                    <motion.div
                      key={`${product.id}-${idx}`}
                      variants={idx === 0 ? flaconHeroVariants : undefined}
                      initial={idx === 0 ? "hidden" : undefined}
                      animate={idx === 0 ? "visible" : undefined}
                      className="relative w-full max-w-[380px] aspect-[4/5] flex items-center justify-center"
                    >
                      {idx === 0 && (
                        <motion.div
                          variants={auraVariants}
                          initial="hidden"
                          animate="visible"
                          className="absolute w-64 h-64 rounded-full bg-amber-400/15 dark:bg-[#ECC86A]/12 blur-3xl pointer-events-none"
                        />
                      )}
                      <img
                        src={img}
                        alt={`${product.name} perspective ${idx + 1}`}
                        fetchPriority={idx === 0 ? "high" : "auto"}
                        loading={idx === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className="relative z-10 max-h-[58vh] w-auto object-contain object-center filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.14)]"
                      />
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Pinned Bottom Dots Indicator */}
            {images.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 select-none pointer-events-auto"
              >
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDotClick(idx)}
                    className={`transition-all rounded-full cursor-pointer ${
                      activeImgIdx === idx
                        ? 'w-6 h-1.5 bg-[#C4823F] dark:bg-[#ECC86A] shadow-[0_0_8px_rgba(196,130,63,0.4)] dark:shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                        : 'w-1.5 h-1.5 bg-[#D8CED0] dark:bg-white/30 hover:bg-[#888888]'
                    }`}
                    aria-label={`View photo angle ${idx + 1}`}
                  />
                ))}
              </motion.div>
            )}
          </div>

          {/* Right Half: Editorial Details (Pinned with internal scroll) */}
          <div className="bg-[#FFFFFF] dark:bg-[#0B0A0D] h-full flex flex-col justify-between p-10 lg:p-14 transition-colors duration-300 overflow-y-auto">
            
            {/* Top-Right Navigation Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
              className="flex items-center justify-end gap-7 xl:gap-8 text-[11px] font-normal tracking-[0.14em] uppercase text-[#111111] dark:text-white select-none z-10 shrink-0"
            >
              <button
                onClick={onNavigateHome}
                className="hover:opacity-60 transition-opacity cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => onNavigateCollection('all')}
                className="hover:opacity-60 transition-opacity cursor-pointer"
              >
                Collections
              </button>
              <button
                onClick={() => (onOpenStory ? onOpenStory() : onNavigateHome())}
                className="hover:opacity-60 transition-opacity cursor-pointer"
              >
                About
              </button>
              
              <button
                onClick={onOpenNavDrawer}
                className="p-1 text-[#111111] dark:text-white hover:opacity-60 transition-opacity cursor-pointer"
                title="Open Navigation Menu"
                aria-label="Open Navigation Menu"
              >
                <div className="w-5 flex flex-col gap-1">
                  <span className="w-full h-[1.6px] bg-current rounded-full" />
                  <span className="w-full h-[1.6px] bg-current rounded-full" />
                </div>
              </button>

              <button
                onClick={onOpenCart}
                className="w-6 h-6 rounded-full bg-[#111111] dark:bg-[#D4AF37] text-white dark:text-[#0B0A0D] text-[11px] font-bold flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:opacity-85 transition-opacity"
                aria-label={`Cart (${cartCount || 1})`}
                title="View Cart"
              >
                {cartCount || 1}
              </button>
            </motion.div>

            {/* Desktop Monograph Form */}
            {renderMonographDetails(false)}

            <div className="h-6" />
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* ================= 2. MOBILE VIEW (< lg) ====================== */}
      {/* ============================================================== */}
      <div className="block lg:hidden w-full">
        
        {/* Mobile Header Bar */}
        <div className="w-full px-5 py-3.5 flex items-center justify-between border-b border-[#EEEEEE] dark:border-white/10 bg-white/95 dark:bg-[#0B0A0D]/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
          <button
            onClick={onNavigateHome}
            className="flex items-center cursor-pointer"
            aria-label="Saudagar Perfumers Home"
          >
            <img
              src="/images/saudagar_logo_black.png"
              alt="Saudagar Perfumers"
              className="h-[22px] w-auto object-contain dark:hidden block"
            />
            <img
              src="/images/saudagar_logo_gold.png"
              alt="Saudagar Perfumers"
              className="h-[22px] w-auto object-contain hidden dark:block"
            />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
              className="p-1.5 cursor-pointer text-[#111111] dark:text-white"
              aria-label="Wishlist"
              title={isCurrentWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                className={isCurrentWishlisted ? 'text-[#C4823F] dark:text-[#ECC86A]' : 'currentColor'}
                fill={isCurrentWishlisted ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            <button
              onClick={onOpenNavDrawer}
              className="p-1.5 text-[#111111] dark:text-white cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <div className="w-5 flex flex-col gap-1">
                <span className="w-full h-[1.6px] bg-current rounded-full" />
                <span className="w-full h-[1.6px] bg-current rounded-full" />
              </div>
            </button>
            
            <button
              onClick={onOpenCart}
              className="w-6 h-6 rounded-full bg-[#111111] dark:bg-[#D4AF37] text-white dark:text-[#0B0A0D] text-[11px] font-bold flex items-center justify-center cursor-pointer shadow-xs"
              aria-label={`Cart (${cartCount || 1})`}
            >
              {cartCount || 1}
            </button>
          </div>
        </div>

        {/* Mobile Dedicated Flacon Vitrine (NEVER CROPPED, Full Bottle Visible) */}
        <div className="relative w-full h-[46vh] min-h-[350px] max-h-[440px] bg-[#F8F8F8] dark:bg-[#141318] flex items-center justify-center overflow-hidden border-b border-[#EEEEEE] dark:border-white/10 select-none">
          {/* Ambient Warm Studio Aura */}
          <div className="absolute w-56 h-56 rounded-full bg-amber-400/15 dark:bg-[#ECC86A]/12 blur-3xl pointer-events-none" />

          {/* Swipeable Flacon Image Container with Horizontal Left/Right Drag */}
          <div className="relative w-full h-full flex items-center justify-center p-6 touch-pan-y">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={`${product.id}-${mobileImgIdx}`}
                drag={images.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.22}
                onDragEnd={handleMobileSwipe}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
              >
                <img
                  src={images[mobileImgIdx]}
                  alt={`${product.name} perspective ${mobileImgIdx + 1}`}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  className="max-h-[300px] sm:max-h-[340px] max-w-[80%] w-auto h-auto object-contain object-center filter drop-shadow-[0_16px_30px_rgba(0,0,0,0.12)] pointer-events-none"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Left & Right Subtle Chevron Controls (Tap to change) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setMobileImgIdx((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 dark:bg-black/60 text-[#111111] dark:text-white flex items-center justify-center text-xs backdrop-blur-xs shadow-xs hover:bg-white dark:hover:bg-black transition-colors cursor-pointer"
                aria-label="Previous view angle"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setMobileImgIdx((prev) => (prev + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 dark:bg-black/60 text-[#111111] dark:text-white flex items-center justify-center text-xs backdrop-blur-xs shadow-xs hover:bg-white dark:hover:bg-black transition-colors cursor-pointer"
                aria-label="Next view angle"
              >
                ›
              </button>
            </>
          )}

          {/* Swipe Helper & Angle Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 select-none pointer-events-auto">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setMobileImgIdx(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    mobileImgIdx === idx
                      ? 'w-6 bg-[#C4823F] dark:bg-[#ECC86A] shadow-[0_0_8px_rgba(196,130,63,0.4)]'
                      : 'w-1.5 bg-[#D8CED0] dark:bg-white/30'
                  }`}
                  aria-label={`View photo angle ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile Monograph Details Section */}
        <div className="w-full px-5 sm:px-8 py-6 bg-white dark:bg-[#0B0A0D] transition-colors">
          {renderMonographDetails(true)}
        </div>

      </div>

      {/* ============================================================== */}
      {/* ================= 3. SHARED ACCORDIONS & ATELIER ============= */}
      {/* ============================================================== */}
      <div className="w-full bg-[#FFFFFF] dark:bg-[#0B0A0D] border-t border-[#EAEAEA] dark:border-white/10 px-6 sm:px-10 lg:px-16 py-14 sm:py-16 transition-colors duration-300">
        <div className="max-w-2xl mx-auto">
          
          <div className="mb-6">
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#777777] dark:text-[#999999]">
              Atelier Specifications
            </span>
            <h2 className="text-[22px] sm:text-[26px] font-normal tracking-[-0.015em] text-[#111111] dark:text-white mt-1">
              Craft & Olfactory Composition
            </h2>
          </div>

          <div className="divide-y divide-[#EAEAEA] dark:divide-white/10 text-[12px]">
            
            {/* Accordion 1: Fragrance Pyramid & Notes */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleAccordion('notes')}
                className="w-full flex items-center justify-between text-[#111111] dark:text-white font-normal hover:opacity-75 transition-opacity cursor-pointer text-left"
              >
                <span className="tracking-[0.02em] text-[13px]">Fragrance Pyramid & Olfactory Notes</span>
                <span className="text-[16px] font-light">{openAccordion === 'notes' ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openAccordion === 'notes' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden pt-3 pb-1 space-y-2 text-[#555555] dark:text-[#A09D96] text-[12px]"
                  >
                    <p>
                      <strong className="text-[#C4823F] dark:text-[#ECC86A] font-medium">Top: </strong>
                      {product.notes?.top?.join(' · ') || 'Wild Bergamot, Black Pepper, Cardamom'}
                    </p>
                    <p>
                      <strong className="text-[#C4823F] dark:text-[#ECC86A] font-medium">Heart: </strong>
                      {product.notes?.heart?.join(' · ') || '18-Year Cambodi Oud, Taif Rose, Resinous Lichen'}
                    </p>
                    <p>
                      <strong className="text-[#C4823F] dark:text-[#ECC86A] font-medium">Base: </strong>
                      {product.notes?.base?.join(' · ') || 'Mysore Sandalwood, Dark Ambergris, Charred Leather'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion 3: Test-First Guarantee & Returns */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleAccordion('shipping')}
                className="w-full flex items-center justify-between text-[#111111] dark:text-white font-normal hover:opacity-75 transition-opacity cursor-pointer text-left"
              >
                <span className="tracking-[0.02em] text-[13px]">Shipping & Test-First Guarantee</span>
                <span className="text-[16px] font-light">{openAccordion === 'shipping' ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openAccordion === 'shipping' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden pt-3 pb-1 space-y-2 text-[#555555] dark:text-[#A09D96] text-[12px]"
                  >
                    <p>
                      Every full-size flacon arrives with a matching 2ml discovery vial. Enjoy the vial first. If it does not resonate with you, return the unopened flacon for a complimentary exchange or full refund.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* ================= 3b. REVIEWS & FEEDBACK SECTION ============= */}
      {/* ============================================================== */}
      <BluorngProductReviews
        productId={product.id}
        productName={product.name}
        productCategory={product.category || 'Extrait de Parfum'}
        theme={theme}
      />

      {/* ============================================================== */}
      {/* ================= 4. CURATED PAIRINGS SECTION =============== */}
      {/* ============================================================== */}
      <div className="w-full px-6 sm:px-10 lg:px-16 pt-16 pb-28 lg:pb-16 border-t border-[#EAEAEA] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0B0A0D] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#C4823F] dark:text-[#ECC86A] font-medium">
              Curated Selection
            </span>
            <h2 className="text-[22px] sm:text-[26px] font-normal tracking-[-0.015em] text-[#111111] dark:text-white mt-1">
              You May Also Appreciate
            </h2>
          </div>

          <StaggerContainer staggerDelay={0.06} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((relProd) => (
              <StaggerItem key={relProd.id}>
                <BluorngProductCard
                  product={relProd}
                  isWishlisted={wishlist.includes(relProd.id)}
                  onToggleWishlist={onToggleWishlist}
                  onSelectProduct={onSelectProduct}
                  onQuickBuy={() => {
                    if (onAddToCart) {
                      onAddToCart({
                        productId: relProd.id,
                        size: '50 ml',
                        price: relProd.price,
                        quantity: 1
                      });
                    }
                  }}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>

    </div>
  );
}
