import React, { useState } from 'react';

export default function PoemSplitSection({ onSelectProduct, onQuickBuy }) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.max(15, Math.min(85, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  const handleTouchMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percent = Math.max(15, Math.min(85, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  return (
    <section className="py-16 sm:py-24 bg-[#141418] text-[#F7F5F0] border-b border-[#D4AF37]/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
          <p className="text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[#D4AF37] font-semibold mb-2 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            DUAL COMPOSITION
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-[0.2em] uppercase text-white font-sans">
            Poem Collection
          </h2>
          <p className="text-xs sm:text-sm text-white/70 font-light mt-2 tracking-wide">
            Slide horizontally to experience the dual masculine &amp; feminine verses.
          </p>
        </div>

        {/* Interactive Split Frame */}
        <div
          className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[520px] rounded-xs overflow-hidden select-none cursor-ew-resize shadow-2xl bg-[#0A0A0C] border border-[#D4AF37]/35"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {/* Right Image (Poem For Her) - Base Layer */}
          <div className="absolute inset-0 bg-[#0E0E12] flex items-center justify-center">
            <img
              src="/images/saudagar_imperial_ruby.png"
              alt="Poem For Her"
              className="w-full h-full object-contain object-center p-8 filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/30" />

            {/* Right Card Content */}
            <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-12 z-10 text-right text-white max-w-xs">
              <p className="text-[10px] sm:text-xs tracking-[0.24em] uppercase text-[#D4AF37] mb-1 font-semibold">
                Ethereal Floral Fruity
              </p>
              <h3 className="text-lg sm:text-2xl font-light tracking-[0.2em] uppercase mb-3">
                Poem For Her
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProduct('poem-for-her');
                }}
                className="bg-[#D4AF37] text-[#0A0A0C] hover:bg-[#ECC86A] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 shadow-xl transition-all"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* Left Image (Poem For Him) - Clipped Overlay */}
          <div
            className="absolute inset-0 overflow-hidden bg-[#0A0A0C]"
            style={{ width: `${sliderPosition}%` }}
          >
            <div className="absolute inset-0 w-[100vw] max-w-6xl flex items-center justify-start">
              <img
                src="/images/saudagar_noir_matte.png"
                alt="Poem For Him"
                className="w-full h-full object-contain object-left p-8 filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/30" />

              {/* Left Card Content */}
              <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-12 z-10 text-left text-white max-w-xs">
                <p className="text-[10px] sm:text-xs tracking-[0.24em] uppercase text-[#D4AF37] mb-1 font-semibold">
                  Aromatic Leather Woody
                </p>
                <h3 className="text-lg sm:text-2xl font-light tracking-[0.2em] uppercase mb-3">
                  Poem For Him
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProduct('poem-for-him');
                  }}
                  className="bg-[#D4AF37] text-[#0A0A0C] hover:bg-[#ECC86A] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 shadow-xl transition-all"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>

          {/* Draggable Divider Line & Gold Knob */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#D4AF37] z-30 pointer-events-none shadow-[0_0_10px_#D4AF37]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-[#0A0A0C] text-[#D4AF37] border-2 border-[#D4AF37] shadow-2xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 50 50" fill="none">
                <path
                  d="m19.25 19-6 6 6 6m11.5 0 6-6-6-6"
                  stroke="#D4AF37"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                />
              </svg>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
