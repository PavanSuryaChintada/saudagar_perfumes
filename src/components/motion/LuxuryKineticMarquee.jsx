import React, { useState } from 'react';

export default function LuxuryKineticMarquee({
  items = [],
  speed = 40,
  reverse = false
}) {
  const [isHovered, setIsHovered] = useState(false);
  const clean = (items || []).filter(Boolean);

  // Repeat sequence 3 times in Set A, and identically in Set B for a 100% seamless 50% infinite loop
  const unitList = [...clean, ...clean, ...clean];

  // Unique keyframe animation name per instance or shared
  const animName = reverse ? 'luxuryMarqueeReverse' : 'luxuryMarqueeForward';

  return (
    <div 
      className="w-full overflow-hidden bg-[#FFFFFF] dark:bg-tk-night py-6 sm:py-7 select-none relative group transition-colors duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle edge fades for infinite depth */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-tk-night dark:via-tk-night/80 dark:to-transparent z-10 pointer-events-none transition-colors duration-300" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-tk-night dark:via-tk-night/80 dark:to-transparent z-10 pointer-events-none transition-colors duration-300" />

      {/* Hardware-accelerated 120fps CSS Compositor Track */}
      <div
        data-marquee="true"
        className="marquee-track flex items-center whitespace-nowrap will-change-transform"
        style={{
          width: 'max-content',
          animationName: animName,
          animationDuration: `${speed}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationPlayState: isHovered ? 'paused' : 'running'
        }}
      >
        {/* Set A (First 50%) */}
        <div className="flex items-center shrink-0">
          {unitList.map((text, idx) => (
            <div key={`a-${idx}`} className="inline-flex items-center shrink-0 pr-8 sm:pr-12">
              <span className="text-[11px] sm:text-[12.5px] font-sans font-medium uppercase tracking-[0.22em] text-tk-ink dark:text-[#EFECE6] transition-colors hover:text-tk-accent dark:hover:text-tk-accent-night">
                {text}
              </span>
              <span className="pl-8 sm:pl-12 text-[9px] text-tk-accent dark:text-tk-accent-night opacity-90 select-none">
                ✦
              </span>
            </div>
          ))}
        </div>

        {/* Set B (Identical Second 50% for 100% Mathematically Seamless Wrap) */}
        <div className="flex items-center shrink-0" aria-hidden="true">
          {unitList.map((text, idx) => (
            <div key={`b-${idx}`} className="inline-flex items-center shrink-0 pr-8 sm:pr-12">
              <span className="text-[11px] sm:text-[12.5px] font-sans font-medium uppercase tracking-[0.22em] text-tk-ink dark:text-[#EFECE6] transition-colors hover:text-tk-accent dark:hover:text-tk-accent-night">
                {text}
              </span>
              <span className="pl-8 sm:pl-12 text-[9px] text-tk-accent dark:text-tk-accent-night opacity-90 select-none">
                ✦
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
