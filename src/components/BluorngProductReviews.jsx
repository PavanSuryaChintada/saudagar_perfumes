import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductReviews, saveProductReviews } from '../data/productReviewsData.js';

// Visual Star Rating Display
function StarRow({ rating, size = 14, interactive = false, onHover, onClick, hoveredRating = 0 }) {
  return (
    <div className="flex items-center gap-1 select-none">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = (hoveredRating || rating) >= star;
        return (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && onClick && onClick(star)}
            onMouseEnter={() => interactive && onHover && onHover(star)}
            onMouseLeave={() => interactive && onHover && onHover(0)}
            className={`${interactive ? 'cursor-pointer p-0.5 hover:scale-110 transition-transform' : 'cursor-default pointer-events-none'}`}
            aria-label={`${star} star`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={active ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.6"
              className={active ? 'text-[#C4823F] dark:text-[#ECC86A] filter drop-shadow-[0_1px_4px_rgba(236,200,106,0.35)]' : 'text-[#D0C7BC] dark:text-white/20'}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default function BluorngProductReviews({
  productId,
  productName = 'Saudagar Creation',
  productCategory = 'Extrait de Parfum',
  theme = 'light'
}) {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'with-photos', '5', '4', '3'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'highest', 'helpful'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Form Fields
  const [formRating, setFormRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formAuthor, setFormAuthor] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formLongevity, setFormLongevity] = useState('14+ Hours');
  const [formSillage, setFormSillage] = useState('Beastmode Royal');
  const [formImages, setFormImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef(null);

  // Load reviews on mount and when productId changes
  useEffect(() => {
    const loaded = getProductReviews(productId);
    setReviews(loaded);
    setFilter('all');
    setSortBy('recent');
    setIsFormOpen(false);
    setSubmitSuccess(false);
  }, [productId]);

  // Handle Image Upload from disk
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormImages((prev) => [...prev, uploadEvent.target.result]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  // Add demo sample image for quick testing
  const handleAddSampleImage = (imgSrc) => {
    if (!formImages.includes(imgSrc)) {
      setFormImages((prev) => [...prev, imgSrc]);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Helpful vote toggle
  const handleHelpfulClick = (reviewId) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const wasClicked = r.isHelpfulClicked;
          return {
            ...r,
            helpfulCount: wasClicked ? r.helpfulCount - 1 : r.helpfulCount + 1,
            isHelpfulClicked: !wasClicked
          };
        }
        return r;
      })
    );
  };

  // Submit Critique Form
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!formAuthor.trim()) {
      setFormError('Please provide your name or initials.');
      return;
    }
    if (!formComment.trim()) {
      setFormError('Please enter your review feedback or thoughts.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    setTimeout(() => {
      const newReview = {
        id: `rev-${Date.now()}`,
        author: formAuthor.trim(),
        location: formLocation.trim() || 'Verified Patron',
        isVerified: true,
        rating: formRating,
        date: 'Just now',
        title: formTitle.trim() || (formRating >= 5 ? 'Exceptional Olfactory Creation' : 'Impressive Formulation'),
        comment: formComment.trim(),
        images: formImages,
        longevity: formLongevity,
        sillage: formSillage,
        helpfulCount: 1,
        isHelpfulClicked: true
      };

      const updated = [newReview, ...reviews];
      setReviews(updated);
      saveProductReviews(productId, updated);

      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Reset form fields
      setFormAuthor('');
      setFormLocation('');
      setFormTitle('');
      setFormComment('');
      setFormImages([]);
      setFormRating(5);

      setTimeout(() => {
        setIsFormOpen(false);
        setSubmitSuccess(false);
      }, 2000);
    }, 600);
  };

  // Calculations
  const totalCount = reviews.length;
  const avgRating = totalCount > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalCount).toFixed(1)
    : '5.0';

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
    starCounts[star] = (starCounts[star] || 0) + 1;
  });

  // Extract all customer photos for the visual UGC strip
  const allCustomerPhotos = [];
  reviews.forEach((r) => {
    if (r.images && r.images.length > 0) {
      r.images.forEach((img) => {
        allCustomerPhotos.push({
          src: img,
          author: r.author,
          rating: r.rating,
          title: r.title,
          reviewId: r.id
        });
      });
    }
  });

  // Filter & Sort
  let displayedReviews = reviews.filter((r) => {
    if (filter === 'with-photos') return r.images && r.images.length > 0;
    if (filter === '5') return r.rating === 5;
    if (filter === '4') return r.rating === 4;
    if (filter === '3') return r.rating === 3;
    return true;
  });

  displayedReviews.sort((a, b) => {
    if (sortBy === 'highest') return (b.rating || 5) - (a.rating || 5);
    if (sortBy === 'helpful') return (b.helpfulCount || 0) - (a.helpfulCount || 0);
    return 0; // default recent
  });

  return (
    <section
      id="reviews-section"
      className="w-full bg-[#FFFFFF] dark:bg-[#0B0A0D] border-t border-[#EAEAEA] dark:border-white/10 px-5 sm:px-10 lg:px-16 py-16 sm:py-20 transition-colors duration-300"
      aria-label="Client Critiques and Customer Reviews"
    >
      <div className="max-w-6xl mx-auto">
        
        {/* ============================================================== */}
        {/* ================= 1. HEADER & OVERVIEW CARD ================== */}
        {/* ============================================================== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#EAEAEA] dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#C4823F] dark:bg-[#ECC86A]" />
              <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#C4823F] dark:text-[#ECC86A]">
                Connoisseur Critiques & Feedback
              </span>
            </div>
            <h2 className="text-[26px] sm:text-[34px] font-normal tracking-[-0.015em] text-[#111111] dark:text-white">
              Client Experiences & Ratings
            </h2>
            <p className="text-[13px] text-[#666666] dark:text-[#999999] mt-1 max-w-xl">
              Authentic sensory impressions, longevity feedback, and uncensored patron critiques of {productName}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsFormOpen(true);
                setSubmitSuccess(false);
                setFormError('');
              }}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#111111] hover:bg-[#C4823F] text-white dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] dark:text-[#0B0A0D] text-[12px] font-medium tracking-[0.04em] uppercase rounded-[2px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_18px_rgba(212,175,55,0.25)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Write A Review</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ================= 2. SCORE & SILLAGE BREAKDOWN =============== */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-10 border-b border-[#EAEAEA] dark:border-white/10">
          
          {/* Left: Overall Score Card */}
          <div className="lg:col-span-4 flex flex-col justify-center items-start lg:pr-8 lg:border-r border-[#EAEAEA] dark:border-white/10">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-[52px] sm:text-[60px] font-light leading-none tracking-tight text-[#111111] dark:text-white font-sans">
                {avgRating}
              </span>
              <span className="text-[18px] text-[#888888] dark:text-white/40 font-light">/ 5.0</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <StarRow rating={Math.round(parseFloat(avgRating))} size={18} />
              <span className="text-[13px] font-medium text-[#111111] dark:text-white ml-1">
                {totalCount} Verified {totalCount === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>

            <p className="text-[11.5px] text-[#777777] dark:text-[#8E8B85] leading-relaxed mt-1">
              98% of surveyed connoisseurs recommend this extrait to lovers of rare botanical agarwood and resinous accords.
            </p>
          </div>

          {/* Middle: Interactive Star Distribution Bars */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = starCounts[star] || 0;
              const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              const isSelected = filter === String(star);

              return (
                <button
                  key={star}
                  onClick={() => setFilter(isSelected ? 'all' : String(star))}
                  className={`w-full flex items-center gap-3 text-left group cursor-pointer transition-opacity ${
                    filter !== 'all' && !isSelected ? 'opacity-40' : 'opacity-100'
                  }`}
                  title={`Filter by ${star} stars`}
                >
                  <span className="w-12 text-[11px] font-medium text-[#333333] dark:text-white/80 group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] transition-colors flex items-center gap-1">
                    {star} <span className="text-[#C4823F] dark:text-[#ECC86A]">★</span>
                  </span>

                  <div className="flex-1 h-2 rounded-full bg-[#EAE6DF] dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#C4823F] dark:bg-[#ECC86A] transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span className="w-10 text-right text-[11px] text-[#777777] dark:text-white/50 font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Key Performance Metrics */}
          <div className="lg:col-span-3 flex flex-col justify-center gap-3 bg-[#FAF8F5] dark:bg-[#141318] p-5 rounded-[3px] border border-[#EAEAEA] dark:border-white/5">
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#888888] dark:text-[#A09D96]">
              Patron Consensus
            </span>

            <div className="space-y-2 text-[12px]">
              <div>
                <div className="flex justify-between text-[#222222] dark:text-white/90 font-medium mb-0.5">
                  <span>Longevity</span>
                  <span className="text-[#C4823F] dark:text-[#ECC86A]">14+ Hours</span>
                </div>
                <span className="text-[11px] text-[#777777] dark:text-white/50">96% agree beastmode</span>
              </div>

              <div className="pt-2 border-t border-[#EAEAEA] dark:border-white/10">
                <div className="flex justify-between text-[#222222] dark:text-white/90 font-medium mb-0.5">
                  <span>Sillage & Trail</span>
                  <span className="text-[#C4823F] dark:text-[#ECC86A]">Room-Filling</span>
                </div>
                <span className="text-[11px] text-[#777777] dark:text-white/50">Commanding royal presence</span>
              </div>

              <div className="pt-2 border-t border-[#EAEAEA] dark:border-white/10">
                <div className="flex justify-between text-[#222222] dark:text-white/90 font-medium mb-0.5">
                  <span>Flacon & Atomizer</span>
                  <span className="text-[#C4823F] dark:text-[#ECC86A]">5.0 / 5.0</span>
                </div>
                <span className="text-[11px] text-[#777777] dark:text-white/50">Weighty crystal & micro-mist</span>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* ================= 3. CUSTOMER PHOTO GALLERY ================== */}
        {/* ============================================================== */}
        {allCustomerPhotos.length > 0 && (
          <div className="py-8 border-b border-[#EAEAEA] dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-[0.16em] font-medium text-[#111111] dark:text-white flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Customer Flacons & In-Hand Captures ({allCustomerPhotos.length})
              </span>
              <button
                onClick={() => setFilter(filter === 'with-photos' ? 'all' : 'with-photos')}
                className={`text-[11px] tracking-wider uppercase transition-colors cursor-pointer ${
                  filter === 'with-photos'
                    ? 'text-[#C4823F] dark:text-[#ECC86A] font-semibold underline'
                    : 'text-[#666666] dark:text-[#AAAAAA] hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                {filter === 'with-photos' ? 'Showing Photos Only' : 'View Reviews With Photos'}
              </button>
            </div>

            <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-thin">
              {allCustomerPhotos.map((photo, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => setLightboxImg(photo)}
                  className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-[3px] overflow-hidden border border-[#EAEAEA] dark:border-white/10 group cursor-pointer bg-[#F5F5F5] dark:bg-[#141318]"
                  title={`View photo by ${photo.author}`}
                >
                  <img
                    src={photo.src}
                    alt={`Customer submission by ${photo.author}`}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ================= 4. WRITE A REVIEW MODAL / FORM ============= */}
        {/* ============================================================== */}
        <AnimatePresence>
          {isFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-2xl bg-white dark:bg-[#141318] text-[#111111] dark:text-white rounded-[3px] border border-[#EAEAEA] dark:border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.35)] overflow-hidden max-h-[92vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-[#EAEAEA] dark:border-white/10 flex items-center justify-between shrink-0 bg-[#FAF8F5] dark:bg-[#0E0C10]">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C4823F] dark:text-[#ECC86A]">
                      Share Your Experience
                    </span>
                    <h3 className="text-[18px] sm:text-[20px] font-normal tracking-[-0.01em] mt-0.5">
                      Critique for {productName}
                    </h3>
                  </div>

                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#888888] hover:text-[#111111] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <form
                  id="review-critique-form"
                  noValidate
                  onSubmit={handleSubmitReview}
                  className="p-6 overflow-y-auto space-y-5 flex-1"
                >
                  
                  {/* Success State Notification */}
                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-[#FFF7ED] dark:bg-[#D4AF37]/15 border border-[#C4823F]/30 dark:border-[#ECC86A]/40 rounded-[2px] text-[#C4823F] dark:text-[#ECC86A] flex items-center gap-3 text-[13px]"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <div>
                        <strong>Your critique has been published!</strong>
                        <p className="text-[11px] opacity-85">Thank you for sharing your olfactory journey with the Saudagar atelier.</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Form Error Banner */}
                  {formError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-[2px] text-[12px]">
                      {formError}
                    </div>
                  )}

                  {/* 1. Star Rating Selector */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.14em] font-medium text-[#555555] dark:text-[#AAAAAA] mb-2">
                      Overall Olfactory Rating *
                    </label>
                    <div className="flex items-center gap-3">
                      <StarRow
                        rating={formRating}
                        hoveredRating={hoveredRating}
                        size={26}
                        interactive={true}
                        onHover={setHoveredRating}
                        onClick={setFormRating}
                      />
                      <span className="text-[12px] font-medium text-[#C4823F] dark:text-[#ECC86A]">
                        {formRating === 5 && '5/5 — Masterpiece / Royal Standard'}
                        {formRating === 4 && '4/5 — Very Pleasing Extrait'}
                        {formRating === 3 && '3/5 — Good Experience'}
                        {formRating === 2 && '2/5 — Below Expectations'}
                        {formRating === 1 && '1/5 — Not For Me'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Reviewer Name & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.14em] font-medium text-[#555555] dark:text-[#AAAAAA] mb-1.5">
                        Your Name / Connoisseur Alias *
                      </label>
                      <input
                        type="text"
                        required
                        value={formAuthor}
                        onChange={(e) => setFormAuthor(e.target.value)}
                        placeholder="e.g. Aditya Verma"
                        className="w-full px-3.5 py-2.5 rounded-[2px] border border-[#CCCCCC] dark:border-white/20 bg-white dark:bg-[#0B0A0D] text-[12.5px] outline-none focus:border-[#C4823F] dark:focus:border-[#ECC86A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.14em] font-medium text-[#555555] dark:text-[#AAAAAA] mb-1.5">
                        Location / City
                      </label>
                      <input
                        type="text"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        placeholder="e.g. Mumbai, India"
                        className="w-full px-3.5 py-2.5 rounded-[2px] border border-[#CCCCCC] dark:border-white/20 bg-white dark:bg-[#0B0A0D] text-[12.5px] outline-none focus:border-[#C4823F] dark:focus:border-[#ECC86A]"
                      />
                    </div>
                  </div>

                  {/* 3. Review Headline */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.14em] font-medium text-[#555555] dark:text-[#AAAAAA] mb-1.5">
                      Review Headline / Key Summary
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. The drydown is simply hypnotic"
                      className="w-full px-3.5 py-2.5 rounded-[2px] border border-[#CCCCCC] dark:border-white/20 bg-white dark:bg-[#0B0A0D] text-[12.5px] outline-none focus:border-[#C4823F] dark:focus:border-[#ECC86A]"
                    />
                  </div>

                  {/* 4. Scent Attributes (Longevity & Sillage) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.14em] font-medium text-[#555555] dark:text-[#AAAAAA] mb-1.5">
                        Longevity
                      </label>
                      <select
                        value={formLongevity}
                        onChange={(e) => setFormLongevity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-[2px] border border-[#CCCCCC] dark:border-white/20 bg-white dark:bg-[#0B0A0D] text-[12.5px] outline-none focus:border-[#C4823F] dark:focus:border-[#ECC86A] cursor-pointer"
                      >
                        <option value="6-8 Hours">6-8 Hours (Moderate)</option>
                        <option value="10-12 Hours">10-12 Hours (Long-lasting)</option>
                        <option value="14+ Hours">14+ Hours (Beastmode Royal)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.14em] font-medium text-[#555555] dark:text-[#AAAAAA] mb-1.5">
                        Sillage & Projection
                      </label>
                      <select
                        value={formSillage}
                        onChange={(e) => setFormSillage(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-[2px] border border-[#CCCCCC] dark:border-white/20 bg-white dark:bg-[#0B0A0D] text-[12.5px] outline-none focus:border-[#C4823F] dark:focus:border-[#ECC86A] cursor-pointer"
                      >
                        <option value="Intimate Whisper">Intimate Whisper (Close to skin)</option>
                        <option value="Radiant Aura">Radiant Aura (Arm’s length)</option>
                        <option value="Beastmode Royal">Beastmode Royal (Room-filling)</option>
                      </select>
                    </div>
                  </div>

                  {/* 5. Detailed Comments */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.14em] font-medium text-[#555555] dark:text-[#AAAAAA] mb-1.5">
                      Your Detailed Feedback & Impression *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      placeholder="Describe the opening, the evolution of the notes, presentation, compliment factor, and overall experience..."
                      className="w-full px-3.5 py-2.5 rounded-[2px] border border-[#CCCCCC] dark:border-white/20 bg-white dark:bg-[#0B0A0D] text-[12.5px] outline-none focus:border-[#C4823F] dark:focus:border-[#ECC86A] leading-relaxed resize-y"
                    />
                  </div>

                  {/* 6. Photo Upload Section with Live Previews */}
                  <div className="pt-2 border-t border-[#EAEAEA] dark:border-white/10">
                    <label className="block text-[11px] uppercase tracking-[0.14em] font-medium text-[#555555] dark:text-[#AAAAAA] mb-1.5">
                      Add Flacon Photos or Unboxing Moments
                    </label>
                    <p className="text-[11px] text-[#777777] dark:text-[#8E8B85] mb-3">
                      Share your bottle in hand, cap details, or presentation box (PNG, JPG, WEBP).
                    </p>

                    {/* Hidden input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Upload Drop Area */}
                    <div
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="border-2 border-dashed border-[#CCCCCC] dark:border-white/20 hover:border-[#C4823F] dark:hover:border-[#ECC86A] rounded-[3px] p-5 text-center cursor-pointer transition-colors bg-[#FAF8F5] dark:bg-[#0B0A0D]/50 group"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mx-auto mb-2 text-[#888888] group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] transition-colors">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[12px] font-medium text-[#111111] dark:text-white block">
                        Click to upload photos from your device
                      </span>
                      <span className="text-[10.5px] text-[#888888] dark:text-[#888888]">
                        or choose quick sample flacons below
                      </span>
                    </div>

                    {/* Quick Demo Presets */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-[#888888]">Quick samples:</span>
                      <button
                        type="button"
                        onClick={() => handleAddSampleImage('/images/saudagar_flacon_box.png')}
                        className="text-[10.5px] px-2 py-0.5 rounded-[2px] bg-[#EAE6DF] dark:bg-white/10 hover:bg-[#C4823F] hover:text-white dark:hover:bg-[#ECC86A] dark:hover:text-black transition-colors cursor-pointer"
                      >
                        + Unboxing Box
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSampleImage('/images/macro_bottle_cap.jpg')}
                        className="text-[10.5px] px-2 py-0.5 rounded-[2px] bg-[#EAE6DF] dark:bg-white/10 hover:bg-[#C4823F] hover:text-white dark:hover:bg-[#ECC86A] dark:hover:text-black transition-colors cursor-pointer"
                      >
                        + Brass Cap Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSampleImage('/images/crystal_square_flacon.png')}
                        className="text-[10.5px] px-2 py-0.5 rounded-[2px] bg-[#EAE6DF] dark:bg-white/10 hover:bg-[#C4823F] hover:text-white dark:hover:bg-[#ECC86A] dark:hover:text-black transition-colors cursor-pointer"
                      >
                        + Flacon on Pedestal
                      </button>
                    </div>

                    {/* Uploaded Thumbnails Preview */}
                    {formImages.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {formImages.map((img, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-[3px] overflow-hidden border border-[#C4823F] dark:border-[#ECC86A] group">
                            <img src={img} alt="Uploaded thumbnail" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(i)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 text-white flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors cursor-pointer"
                              title="Remove photo"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </form>

                {/* Sticky Pinned Modal Footer */}
                <div className="px-6 py-4 border-t border-[#EAEAEA] dark:border-white/10 flex items-center justify-between shrink-0 bg-[#FAF8F5] dark:bg-[#0E0C10]">
                  <span className="text-[11px] text-[#888888] dark:text-[#8E8B85]">
                    {formImages.length > 0
                      ? `${formImages.length} ${formImages.length === 1 ? 'photo' : 'photos'} attached`
                      : 'Optional photos'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 text-[12px] uppercase tracking-wider text-[#666666] dark:text-[#AAAAAA] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="review-critique-form"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-[#111111] hover:bg-[#C4823F] text-white dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] dark:text-[#0B0A0D] text-[12px] font-medium tracking-[0.05em] uppercase rounded-[2px] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Publishing...' : 'Publish Critique'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ============================================================== */}
        {/* ================= 5. FILTER & SORT CONTROLS ================== */}
        {/* ============================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `All Reviews (${totalCount})` },
              { id: 'with-photos', label: `With Photos (${allCustomerPhotos.length})` },
              { id: '5', label: `5 Stars (${starCounts[5] || 0})` },
              { id: '4', label: `4 Stars (${starCounts[4] || 0})` }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-[2px] text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                  filter === f.id
                    ? 'bg-[#111111] text-white dark:bg-[#D4AF37] dark:text-[#0B0A0D] font-medium shadow-xs'
                    : 'bg-[#F5F3EF] dark:bg-white/5 text-[#555555] dark:text-white/70 hover:bg-[#EAE6DF] dark:hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[#888888] dark:text-white/50">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border border-[#CCCCCC] dark:border-white/20 rounded-[2px] px-2.5 py-1 text-[11.5px] text-[#111111] dark:text-white outline-none cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ================= 6. REVIEWS LIST ============================ */}
        {/* ============================================================== */}
        {displayedReviews.length === 0 ? (
          <div className="py-16 text-center border-t border-[#EAEAEA] dark:border-white/10">
            <p className="text-[13px] text-[#777777] dark:text-[#AAAAAA] mb-3">
              No reviews match the selected filter.
            </p>
            <button
              onClick={() => setFilter('all')}
              className="text-[11px] uppercase tracking-widest text-[#C4823F] dark:text-[#ECC86A] underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#EAEAEA] dark:divide-white/10 border-t border-[#EAEAEA] dark:border-white/10">
            {displayedReviews.map((rev) => (
              <article key={rev.id} className="py-8 space-y-4">
                
                {/* Reviewer Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* Initials Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#C4823F]/20 to-[#ECC86A]/40 dark:from-[#D4AF37]/30 dark:to-[#ECC86A]/20 border border-[#C4823F]/30 dark:border-[#ECC86A]/40 flex items-center justify-center text-[12px] font-semibold text-[#C4823F] dark:text-[#ECC86A]">
                      {rev.author.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[#111111] dark:text-white">
                          {rev.author}
                        </span>
                        {rev.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#C4823F] dark:text-[#ECC86A] bg-[#FFF7ED] dark:bg-[#D4AF37]/15 px-2 py-0.5 rounded-full border border-[#C4823F]/20 dark:border-[#ECC86A]/25">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Verified Patron
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#888888] dark:text-[#8E8B85]">
                        {rev.location} · {rev.date}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div>
                    <StarRow rating={rev.rating || 5} size={13} />
                  </div>
                </div>

                {/* Scent Attribute Badges */}
                {(rev.longevity || rev.sillage) && (
                  <div className="flex flex-wrap items-center gap-2 text-[10.5px]">
                    {rev.longevity && (
                      <span className="px-2.5 py-0.5 bg-[#FAF8F5] dark:bg-white/5 border border-[#EAE6DF] dark:border-white/10 rounded-[2px] text-[#666666] dark:text-white/70">
                        Longevity: <strong className="text-[#111111] dark:text-white">{rev.longevity}</strong>
                      </span>
                    )}
                    {rev.sillage && (
                      <span className="px-2.5 py-0.5 bg-[#FAF8F5] dark:bg-white/5 border border-[#EAE6DF] dark:border-white/10 rounded-[2px] text-[#666666] dark:text-white/70">
                        Sillage: <strong className="text-[#111111] dark:text-white">{rev.sillage}</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Review Headline & Body */}
                <div className="space-y-1.5">
                  {rev.title && (
                    <h4 className="text-[14.5px] font-medium text-[#111111] dark:text-white">
                      {rev.title}
                    </h4>
                  )}
                  <p className="text-[13px] text-[#444444] dark:text-[#CCCCCC] leading-relaxed">
                    {rev.comment}
                  </p>
                </div>

                {/* Uploaded Photos Grid */}
                {rev.images && rev.images.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {rev.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setLightboxImg({
                            src: img,
                            author: rev.author,
                            rating: rev.rating,
                            title: rev.title
                          })
                        }
                        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[3px] overflow-hidden border border-[#EAEAEA] dark:border-white/10 group cursor-pointer bg-[#F5F5F5] dark:bg-[#141318]"
                      >
                        <img
                          src={img}
                          alt="Customer review photo"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Helpful Count Button */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-[#888888] dark:text-white/50">
                  <button
                    onClick={() => handleHelpfulClick(rev.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] border transition-colors cursor-pointer ${
                      rev.isHelpfulClicked
                        ? 'border-[#C4823F] dark:border-[#ECC86A] text-[#C4823F] dark:text-[#ECC86A] bg-[#FFF7ED] dark:bg-[#D4AF37]/15'
                        : 'border-[#EAEAEA] dark:border-white/10 hover:border-[#CCCCCC] dark:hover:border-white/20'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    <span>Was this critique helpful? ({rev.helpfulCount || 0})</span>
                  </button>
                </div>

              </article>
            ))}
          </div>
        )}

        {/* ============================================================== */}
        {/* ================= 7. LIGHTBOX MODAL ========================== */}
        {/* ============================================================== */}
        <AnimatePresence>
          {lightboxImg && (
            <div
              onClick={() => setLightboxImg(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-zoom-out"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-2xl max-h-[90vh] bg-white dark:bg-[#141318] rounded-[3px] overflow-hidden shadow-2xl cursor-default flex flex-col"
              >
                <div className="relative bg-black flex items-center justify-center max-h-[65vh] overflow-hidden">
                  <img
                    src={lightboxImg.src}
                    alt="Customer uploaded bottle"
                    className="max-h-[65vh] w-auto object-contain"
                  />
                  <button
                    onClick={() => setLightboxImg(null)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center text-sm hover:bg-black transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-white dark:bg-[#141318] text-[#111111] dark:text-white">
                  <div>
                    <span className="text-[12px] font-medium block">{lightboxImg.author}</span>
                    {lightboxImg.title && (
                      <span className="text-[11px] text-[#777777] dark:text-white/60">{lightboxImg.title}</span>
                    )}
                  </div>
                  <StarRow rating={lightboxImg.rating || 5} size={14} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
