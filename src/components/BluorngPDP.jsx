import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../data/bluorngSaudagarData.js';
import BluorngProductCard from './BluorngProductCard.jsx';
import BluorngProductReviews from './BluorngProductReviews.jsx';
import { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';
import { useSmoothScroll } from './motion/SmoothScrollProvider.jsx';
import { useProductDetail, useProductsBySlugs, useSimilarProducts } from '../storefront/catalog/hooks';
import { toLegacyProduct } from '../storefront/catalog/adapter';
import { recordView } from '../storefront/catalog/recentlyViewed';
import { useSetting } from '../lib/bootstrap';
import { NotePyramid, AccordBars, ProductAccordions } from '../storefront/product/ProductSections.jsx';
import NotFoundPage from '../storefront/NotFoundPage';

export default function BluorngPDP(props) {
  const { data: detail, isLoading, error } = useProductDetail(props.productId);
  const product = useMemo(() => (detail ? toLegacyProduct(detail) : null), [detail]);

  useEffect(() => {
    if (product) document.title = `${product.name} | SAUDAGAR PERFUMES · Haute Parfumerie`;
  }, [product]);

  if (isLoading) {
    return <div className="min-h-screen bg-white dark:bg-[#0B0A0D]" aria-busy="true" />;
  }
  if (error || !detail || !product) {
    return <NotFoundPage onNavigateHome={props.onNavigateHome} onNavigateCollection={props.onNavigateCollection} />;
  }
  return <PDPView key={product.id} {...props} product={product} detail={detail} />;
}

function PDPView({
  product,
  detail,
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
  onNavigateCollection,
  onQuickBuy
}) {
  const isCurrentWishlisted = wishlist.includes(product.id);
  const images = product.images;

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
  }, [product.id]);

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

  // Bottle sizes come straight from the database; sold-out sizes stay visible but cannot be added.
  const sizes = product.sizes;
  const [selectedSize, setSelectedSize] = useState(() => sizes.find((sz) => sz.stock > 0) || sizes[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState(null);
  const maxQty = Math.max(1, Math.min(99, selectedSize?.stock ?? 0));
  const canBuy = !!selectedSize && selectedSize.stock > 0;
  const currentPrice = selectedSize?.price ?? product.price;
  const currentCompare = selectedSize?.compareAt ?? null;

  const etaRange = useSetting('shipping.default_eta', { min: 3, max: 7 });
  const samplesOn = useSetting('samples.enabled', true);
  const mlPerSample = useSetting('samples.ml_per_sample', 50);
  const sampleSize = useSetting('samples.sample_size_ml', 5);
  const etaText = `Delivered across India in ${etaRange.min}–${etaRange.max} days.`;
  const sampleCopy = samplesOn && detail.counts_toward_samples
    ? `Every ${mlPerSample} ml of perfume in your order earns a free ${sampleSize} ml sample of your choice.`
    : null;

  const { products: similarProducts } = useSimilarProducts(product.slug, 4);
  const [recentSlugs, setRecentSlugs] = useState([]);
  useEffect(() => setRecentSlugs(recordView(product.slug).slice(0, 4)), [product.slug]);
  const { products: recentProducts } = useProductsBySlugs(recentSlugs);

  // Sticky mobile add-to-bag bar appears once the main button scrolls away.
  const mobileBuyRef = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const el = mobileBuyRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggleAccordion = (tab) => {
    setOpenAccordion(openAccordion === tab ? null : tab);
  };

  const handleAddToCartClick = () => {
    if (!canBuy || !onAddToCart) return;
    onAddToCart({
      productId: product.id,
      variantId: selectedSize.variantId,
      size: selectedSize.label,
      name: product.name,
      image: images[0],
      price: currentPrice,
      quantity: Math.min(quantity, maxQty)
    });
  };

  const cleanTitle = (product.name || 'Saudagar Extrait')
    .replace(/^saudagar\s+/i, '')
    .toUpperCase();

  const categoryPrefix = (product.category || product.concentration || 'Parfum').split(' ')[0].toUpperCase();
  const familyLine = product.family || product.collection || '';
  const accords = detail.attributes?.accord ?? [];

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
          {familyLine && (
            <span className="text-[12px] sm:text-[13px] text-[#777777] dark:text-[#999999] font-normal tracking-[0.02em]">
              {familyLine}
            </span>
          )}
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
          {product.reviewsCount > 0 ? (
            <>
              <span className="tracking-tight text-[10.5px]">★★★★★</span>
              <span className="font-semibold text-[#111111] dark:text-white">{product.rating.toFixed(1)}</span>
              <span className="text-[#888888] dark:text-white/40">({product.reviewsCount})</span>
            </>
          ) : (
            <span className="text-[#888888] dark:text-white/50">No reviews yet</span>
          )}
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
      {sizes.length > 0 ? (
        <motion.div variants={monographItemVariants} className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-4">
          {sizes.map((sz) => {
            const isSelected = selectedSize?.variantId === sz.variantId;
            const soldOut = sz.stock <= 0;
            return (
              <button
                key={sz.variantId}
                onClick={() => {
                  setSelectedSize(sz);
                  setQuantity(1);
                }}
                aria-pressed={isSelected}
                title={soldOut ? 'Sold out' : undefined}
                className={`min-w-[78px] sm:min-w-[84px] h-[38px] px-4 rounded-[2px] text-[12px] font-normal transition-all flex items-center justify-center cursor-pointer ${
                  soldOut ? 'line-through opacity-50 ' : ''
                }${
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
      ) : null}

      {/* 4b. Price with MRP strike-through and stock state */}
      <motion.div variants={monographItemVariants} className="flex items-baseline gap-3 mb-5 text-[13px]">
        <span className="font-medium text-[#111111] dark:text-white">{formatPrice(currentPrice)}</span>
        {currentCompare && currentCompare > currentPrice && (
          <>
            <span className="line-through text-[#999999] dark:text-white/40">{formatPrice(currentCompare)}</span>
            <span className="text-[11px] text-[#C4823F] dark:text-[#ECC86A] font-medium">{Math.round((1 - currentPrice / currentCompare) * 100)}% off</span>
          </>
        )}
        <span className="ml-auto text-[11px] text-[#777777] dark:text-[#999999]">
          {!selectedSize ? 'Currently unavailable' : selectedSize.stock <= 0 ? 'Sold out' : selectedSize.stock <= 5 ? `Only ${selectedSize.stock} left` : 'In stock'}
        </span>
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
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            className="w-6 h-6 flex items-center justify-center text-[14px] text-[#666666] dark:text-white/60 hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors cursor-pointer"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </motion.div>

      {/* 6. Add To Cart Button + Wishlist Save Bookmark Button */}
      <motion.div ref={isMobile ? mobileBuyRef : undefined} variants={monographItemVariants} className="flex items-center gap-2.5">
        <button
          onClick={handleAddToCartClick}
          disabled={!canBuy}
          className="disabled:opacity-50 disabled:cursor-not-allowed flex-1 h-[46px] bg-[#111111] hover:bg-[#C4823F] text-white dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] dark:text-[#0B0A0D] rounded-[2px] flex items-center shadow-[0_4px_16px_rgba(0,0,0,0.18)] hover:shadow-[0_6px_20px_rgba(196,130,63,0.3)] dark:shadow-[0_4px_16px_rgba(212,175,55,0.25)] active:scale-[0.99] transition-all cursor-pointer select-none group font-medium"
        >
          <span className="flex-1 text-center text-[12.5px] font-medium tracking-[0.03em]">
            {canBuy ? 'Add to cart' : 'Sold out'}
          </span>
          <span className="w-[1px] h-[20px] bg-white/20 dark:bg-black/20 shrink-0" />
          <span className="px-4 sm:px-5 text-center text-[12.5px] font-medium tracking-[0.02em] whitespace-nowrap text-[#FFF7ED] dark:text-[#0B0A0D]">
            {formatPrice(currentPrice * Math.min(quantity, maxQty))}
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
          <span>{etaText}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] leading-none text-[#C4823F] dark:text-[#ECC86A]">•</span>
          <span>Delivering across India</span>
        </div>
        {sampleCopy && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] leading-none text-[#C4823F] dark:text-[#ECC86A]">•</span>
            <span>{sampleCopy}</span>
          </div>
        )}
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
                aria-label={`Cart (${cartCount})`}
                title="View Cart"
              >
                {cartCount}
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
              aria-label={`Cart (${cartCount})`}
            >
              {cartCount}
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

          <NotePyramid notes={detail.notes} />
          <AccordBars accords={accords} />
          <ProductAccordions
            detail={detail}
            selectedSize={selectedSize}
            openAccordion={openAccordion}
            onToggle={toggleAccordion}
            sampleCopy={sampleCopy}
            etaText={etaText}
          />

        </div>
      </div>

      {/* ============================================================== */}
      {/* ================= 3b. REVIEWS & FEEDBACK SECTION ============= */}
      {/* ============================================================== */}
      <BluorngProductReviews
        productName={product.name}
        ratingAvg={product.rating}
        ratingCount={product.reviewsCount}
      />

      {/* ================= 4. SIMILAR SCENTS & RECENTLY VIEWED ========== */}
      {[
        { key: 'similar', eyebrow: 'Similar Scents', title: 'You May Also Appreciate', items: similarProducts },
        { key: 'recent', eyebrow: 'Your Journey', title: 'Recently Viewed', items: recentProducts },
      ]
        .filter((block) => block.items.length > 0)
        .map((block) => (
          <div key={block.key} className="w-full px-6 sm:px-10 lg:px-16 pt-16 pb-16 last:pb-28 lg:last:pb-16 border-t border-[#EAEAEA] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0B0A0D] transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[#C4823F] dark:text-[#ECC86A] font-medium">{block.eyebrow}</span>
                <h2 className="text-[22px] sm:text-[26px] font-normal tracking-[-0.015em] text-[#111111] dark:text-white mt-1">{block.title}</h2>
              </div>
              <StaggerContainer staggerDelay={0.06} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {block.items.map((relProd) => (
                  <StaggerItem key={relProd.id}>
                    <BluorngProductCard
                      product={relProd}
                      isWishlisted={wishlist.includes(relProd.id)}
                      onToggleWishlist={onToggleWishlist}
                      onSelectProduct={onSelectProduct}
                      onQuickBuy={() => onQuickBuy && onQuickBuy(relProd)}
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        ))}

      {/* Sticky mobile add-to-bag bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden fixed left-0 right-0 bottom-[64px] z-30 px-4 py-2.5 bg-white/95 dark:bg-[#0E0C10]/95 backdrop-blur-md border-t border-[#EEEEEE] dark:border-white/10 flex items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-[#111111] dark:text-white truncate">{cleanTitle}</p>
              <p className="text-[11px] text-[#777777] dark:text-[#999999]">{selectedSize?.label} · {formatPrice(currentPrice)}</p>
            </div>
            <button
              type="button"
              onClick={handleAddToCartClick}
              disabled={!canBuy}
              className="shrink-0 h-10 px-5 bg-[#111111] hover:bg-[#C4823F] text-white dark:bg-[#D4AF37] dark:text-[#0B0A0D] text-[12px] font-medium rounded-[2px] disabled:opacity-50"
            >
              {canBuy ? 'Add to bag' : 'Sold out'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
