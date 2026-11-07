import React, { useState, useRef } from 'react';
import { formatPrice } from '../data/bluorngSaudagarData.js';
import { useReels } from '../cms/useContent';
import { useGo } from '../cms/useSite';
import { useProductsBySlugs } from '../storefront/catalog/hooks';
import ScrollReveal from './motion/ScrollReveal.jsx';



// Duplicated sequence ensures 100% mathematically seamless infinite continuous loop at -50%
/** Section "instagram_reels": reels from Admin → Reels; heading, tags and buttons from the section settings. */
export default function BluorngInstagramReels({
  config = {},
  onSelectProduct,
  onOpenStory
}) {
  const go = useGo();
  const { data: reels = [] } = useReels();
  const { bySlug } = useProductsBySlugs(reels.flatMap((r) => r.product_slugs.slice(0, 1)));
  const INSTAGRAM_REELS = reels.map((r) => {
    const product = r.product_slugs[0] ? bySlug.get(r.product_slugs[0]) : null;
    return {
      id: r.id,
      title: r.title,
      audio: r.caption,
      image: r.thumbnail_url,
      video: r.video_url,
      link: r.external_url,
      productId: product?.id || null,
      productName: product?.name || null,
      price: product?.price ?? null
    };
  });
  const REELS_SET_A = INSTAGRAM_REELS.map((r, i) => ({ ...r, uniqueKey: `setA-${r.id}-${i}` }));
  const REELS_SET_B = INSTAGRAM_REELS.map((r, i) => ({ ...r, uniqueKey: `setB-${r.id}-${i}` }));
  const [isPaused, setIsPaused] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(42); // Seconds per full cycle

  const renderReelCard = (reel) => (
    <div
      key={reel.uniqueKey}
      className="shrink-0 pr-4 sm:pr-6"
    >
      <div
        onClick={() => {
          if (reel.link) go(reel.link);
          else if (onOpenStory) onOpenStory();
        }}
        className="relative w-[240px] sm:w-[270px] md:w-[295px] aspect-[9/16] rounded-2xl overflow-hidden bg-[#18171C] group cursor-pointer shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(0,0,0,0.8)]"
      >
        {/* Flacon Visual Background */}
        {reel.video ? (
          <video
            src={reel.video}
            poster={reel.image || undefined}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            className="w-full h-full object-cover object-center filter brightness-[0.88] group-hover:brightness-100"
          />
        ) : reel.image ? (
          <img
            src={reel.image}
            alt={reel.title}
            className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out filter brightness-[0.88] group-hover:brightness-100"
            loading="lazy"
          />
        ) : null}

        {/* Scrim Lighting */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/40 pointer-events-none" />

        {/* Top Reel Header inside Card */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between text-white z-10 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[9px] uppercase tracking-wider font-medium text-white/90">
            <span className="w-1.5 h-1.5 rounded-full bg-tk-accent dark:bg-tk-accent-night animate-pulse" />
            <span>Reel</span>
          </div>

        </div>

        {/* Center Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center transform scale-90 opacity-70 group-hover:scale-100 group-hover:opacity-100 group-hover:bg-tk-accent dark:group-hover:bg-tk-gold dark:group-hover:text-tk-night transition-all duration-300 shadow-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        {/* Bottom Editorial Content Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-20 flex flex-col gap-2">
          {/* Audio track line */}
          {reel.audio && (
            <div className="flex items-center gap-1.5 text-[9.5px] text-white/60 truncate font-light">
              <span className="text-tk-accent dark:text-tk-accent-night">♫</span>
              <span className="truncate">{reel.audio}</span>
            </div>
          )}

          {/* Reel Title */}
          <p className="text-[12px] sm:text-[12.5px] font-normal text-white line-clamp-2 leading-snug group-hover:text-tk-accent-night transition-colors">
            {reel.title}
          </p>

          {/* Tagged Flacon with Direct Navigation */}
          {reel.productId && <div
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectProduct) onSelectProduct(reel.productId);
            }}
            className="mt-1 flex items-center justify-between gap-2 bg-white/12 hover:bg-white/22 backdrop-blur-md rounded-lg px-3 py-2 text-white transition-all cursor-pointer shadow-sm group/btn"
            title="View Fragrance"
          >
            <span className="text-[9.5px] sm:text-[10px] font-medium tracking-wider uppercase truncate group-hover/btn:text-tk-accent-night transition-colors">
              {reel.productName}
            </span>
            <span className="text-[10.5px] sm:text-[11px] font-semibold text-tk-accent-night whitespace-nowrap">
              {formatPrice(reel.price)}
            </span>
          </div>}
        </div>
      </div>
    </div>
  );

  return (
    <section 
      id="instagram-reels-section" 
      className="relative w-full bg-[#FAF9F6] dark:bg-[#0E0C10] py-16 sm:py-24 text-tk-ink dark:text-white select-none overflow-hidden transition-colors duration-300"
    >
      {/* ================= 1. SECTION HEADER (Contained for Editorial Balance) ================= */}
      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 max-w-[1440px] mx-auto mb-8 sm:mb-12">
        <ScrollReveal variant="fade-up" className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FD1D1D] via-[#F56040] to-[#833AB4] flex items-center justify-center text-white shadow-sm">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </span>
              <span className="text-[11px] font-normal tracking-[0.14em] uppercase text-tk-accent dark:text-tk-accent-night">
                {config.handle}
              </span>
              {config.handle_note && (
                <span className="text-[10px] text-[#888888] dark:text-white/40 font-normal tracking-wider uppercase hidden sm:inline">
                  · {config.handle_note}
                </span>
              )}
            </div>

            <h2 className="text-[24px] sm:text-[36px] font-normal uppercase tracking-[0.03em] text-tk-ink dark:text-white leading-tight font-serif">
              {config.heading}
            </h2>
            <p className="text-[12.5px] sm:text-[13.5px] text-[#666666] dark:text-white/60 tracking-wide mt-1.5 max-w-xl font-light">
              {config.text}
            </p>
          </div>

          {/* Right Action & Pause/Play Indicator */}
          <div className="flex items-center gap-4">
            
            {/* Auto-scroll Status Pill */}
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.14] text-tk-ink dark:text-white/80 text-[10.5px] uppercase tracking-wider transition-colors cursor-pointer"
              title={isPaused ? "Resume Auto-scroll" : "Pause Auto-scroll"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-tk-accent dark:bg-tk-accent-night' : 'bg-tk-accent dark:bg-tk-accent-night animate-pulse'}`} />
              <span>{isPaused ? 'Paused ⏸' : 'Auto-scrolling'}</span>
            </button>

            {/* Direct Instagram Link */}
            {config.follow_label && <a
              href={config.follow_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-tk-ink text-white hover:bg-tk-accent dark:bg-white dark:text-tk-ink dark:hover:bg-tk-gold dark:hover:text-tk-night text-[11px] font-semibold uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer shadow-md"
            >
              <span>{config.follow_label}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17l9.2-9.2M17 17V8H8" />
              </svg>
            </a>}
          </div>
        </ScrollReveal>
      </div>

      {/* ================= 2. 100% FULL-WIDTH CONTINUOUS AUTO-SCROLL CAROUSEL ================= */}
      <div 
        className="relative w-full overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left & Right Soft Ambient Vignette Masks for Cinema Fade-out */}
        <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-[#FAF9F6] via-[#FAF9F6]/80 to-transparent dark:from-[#0E0C10] dark:via-[#0E0C10]/80 dark:to-transparent z-20 pointer-events-none transition-colors duration-300" />
        <div className="absolute top-0 bottom-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-[#FAF9F6] via-[#FAF9F6]/80 to-transparent dark:from-[#0E0C10] dark:via-[#0E0C10]/80 dark:to-transparent z-20 pointer-events-none transition-colors duration-300" />

        {/* Continuous Linear Infinite Auto-Scroll Track */}
        <div 
          data-marquee="true"
          className="reels-track flex items-center whitespace-nowrap will-change-transform py-3"
          style={{
            width: 'max-content',
            animationName: 'reelsInfiniteScroll',
            animationDuration: `${scrollSpeed}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        >
          {/* Set A (First 50%) */}
          <div className="flex items-center shrink-0">
            {REELS_SET_A.map(renderReelCard)}
          </div>

          {/* Set B (Identical Second 50% for 100% Seamless Wrap) */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {REELS_SET_B.map(renderReelCard)}
          </div>
        </div>
      </div>

      {/* ================= 3. BOTTOM ATELIER SOCIAL & EPISODES STRIP ================= */}
      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 max-w-[1440px] mx-auto mt-8 sm:mt-10 flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#777777] dark:text-white/50">
        <div className="flex items-center gap-3">
          {config.tags_label && (
            <span className="text-tk-ink/80 dark:text-white/80 uppercase tracking-wider text-[10px]">{config.tags_label}</span>
          )}
          {(config.tags || []).map((tag, i) => (
            <React.Fragment key={`${tag}-${i}`}>
              {i > 0 && <span>✦</span>}
              <span className="text-tk-accent dark:text-tk-accent-night">{tag}</span>
            </React.Fragment>
          ))}
        </div>

        {config.episodes_label && (
          <button
            onClick={() => {
              if (onOpenStory) onOpenStory();
            }}
            className="text-tk-ink dark:text-white hover:text-tk-accent dark:hover:text-tk-accent-night font-medium uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{config.episodes_label}</span>
            <span>→</span>
          </button>
        )}
      </div>
    </section>
  );
}
