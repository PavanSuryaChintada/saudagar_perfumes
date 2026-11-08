import React, { useState, useEffect } from 'react';
import { useStories } from '../cms/useContent';
import { useBlock } from '../cms/useSite';
import { posterFor } from '../lib/media';

export default function BluorngStoryViewer({
  isOpen,
  onClose,
  onSelectProduct
}) {
  // Stories are edited in Admin → Stories; button text in Site content → Stories.
  const { data: stories = [] } = useStories();
  const copy = useBlock('stories_viewer') || {};
  const STORY_REELS = stories.map((st) => ({
    id: st.id,
    title: st.title,
    subtitle: st.subtitle,
    tag: st.tag,
    image: st.image_url,
    video: st.video_url,
    duration: st.duration_ms,
    productId: st.product_slug
  }));
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = STORY_REELS[activeStoryIdx] || STORY_REELS[0];

  // Auto progression with timer
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const intervalTime = 50; // ms
    const totalDuration = currentStory?.duration || 5000;
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, activeStoryIdx, currentStory?.duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextStory = () => {
    setProgress(0);
    setActiveStoryIdx((prev) => {
      if (prev >= STORY_REELS.length - 1) {
        onClose();
        return 0;
      }
      return prev + 1;
    });
  };

  const handlePrevStory = () => {
    setProgress(0);
    setActiveStoryIdx((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // Keyboard navigation & Esc key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNextStory();
      if (e.key === 'ArrowLeft') handlePrevStory();
      if (e.key === ' ') setIsPaused((p) => !p);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !currentStory) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Story Viewer Modal Card (aspect-ratio: 3 / 5) */}
      <div
        className="relative w-[92vw] max-w-[430px] h-[85svh] max-h-[720px] aspect-[3/5] bg-tk-ink rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Full-bleed media visual */}
        {currentStory.video ? (
          <video
            key={currentStory.id}
            src={currentStory.video}
            poster={posterFor(currentStory.video, currentStory.image)}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover select-none"
          />
        ) : currentStory.image ? (
          <img
            src={currentStory.image}
            alt={currentStory.title}
            className="absolute inset-0 w-full h-full object-cover select-none"
          />
        ) : null}

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* ================= TOP HEADER BARS ================= */}
        <div className="relative z-20 p-4 space-y-3">
          {/* Progress Indicators Bar */}
          <div className="flex items-center gap-1.5 w-full">
            {STORY_REELS.map((reel, idx) => (
              <div
                key={reel.id}
                className="flex-1 h-[2.5px] bg-white/30 rounded-full overflow-hidden cursor-pointer"
                onClick={() => {
                  setActiveStoryIdx(idx);
                  setProgress(0);
                }}
              >
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{
                    width:
                      idx < activeStoryIdx
                        ? '100%'
                        : idx === activeStoryIdx
                        ? `${progress}%`
                        : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* User profile / Tag & Close button */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-tk-accent dark:bg-tk-gold text-white dark:text-tk-night p-0.5 border border-white/40 overflow-hidden flex items-center justify-center text-[11px] font-bold text-white">
                S
              </div>
              <div>
                <p className="text-[12px] font-bold tracking-wider uppercase leading-none">
                  Saudagar Parfumerie
                </p>
                <span className="text-[11px] text-white/70 tracking-widest uppercase">
                  {currentStory.tag}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-7 h-7 flex items-center justify-center rounded-[2px] bg-black/40 text-white/80 hover:text-white"
                aria-label={isPaused ? 'Play story' : 'Pause story'}
              >
                {isPaused ? '▶' : '⏸'}
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-[2px] bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-all font-bold"
                aria-label="Close story"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* ================= TAP ZONES (PREV & NEXT) ================= */}
        <div className="absolute inset-0 z-10 flex">
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={handlePrevStory}
            title="Previous Story"
          />
          <div
            className="w-2/3 h-full cursor-pointer"
            onClick={handleNextStory}
            title="Next Story"
          />
        </div>

        {/* ================= BOTTOM METADATA & CTA ================= */}
        <div className="relative z-20 p-5 space-y-3 pointer-events-auto">
          <div>
            <h3 className="text-white text-[18px] sm:text-[20px] font-bold uppercase tracking-[0.02em] leading-tight drop-shadow-md">
              {currentStory.title}
            </h3>
            <p className="text-white/80 text-[12px] tracking-wide mt-1">
              {currentStory.subtitle}
            </p>
          </div>

          {/* Action button */}
          {currentStory.productId && (
          <button
            onClick={() => {
              onClose();
              if (currentStory.productId) {
                onSelectProduct(currentStory.productId);
              }
            }}
            className="w-full py-3 bg-[#FFFFFF] hover:bg-tk-accent dark:hover:bg-tk-gold dark:hover:text-tk-night hover:text-white text-tk-ink text-[11.5px] font-bold uppercase tracking-[0.04em] rounded-sm transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
          >
            <span>{copy.cta_label || 'Shop This Fragrance'}</span>
            <span>→</span>
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
