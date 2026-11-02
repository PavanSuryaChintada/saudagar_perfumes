import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LuxuryPreloader({ onComplete }) {
  const [isOpening, setIsOpening] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // 1. Initial brand showcase duration (1.4s) - provides clear, unhurried brand presence
    const openTimer = setTimeout(() => {
      setIsOpening(true);
    }, 1400);

    // 2. Complete transition after boutique doors fully clear viewport (1400ms + 1200ms = 2.6s)
    const doneTimer = setTimeout(() => {
      setIsDone(true);
      if (onComplete) onComplete();
    }, 2650);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (isDone) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none select-none overflow-hidden">
      {/* Left Boutique Door Panel */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isOpening ? '-100%' : 0 }}
        transition={{
          duration: 1.2,
          ease: [0.76, 0, 0.24, 1] // Majestic luxury architectural door easing
        }}
        className="absolute top-0 bottom-0 left-0 w-1/2 bg-[#0A0A0C] border-r border-[#C4823F]/35 shadow-[25px_0_60px_rgba(0,0,0,0.95)] z-20 pointer-events-auto"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-[#121216]" />
      </motion.div>

      {/* Right Boutique Door Panel */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isOpening ? '100%' : 0 }}
        transition={{
          duration: 1.2,
          ease: [0.76, 0, 0.24, 1] // Majestic luxury architectural door easing
        }}
        className="absolute top-0 bottom-0 right-0 w-1/2 bg-[#0A0A0C] border-l border-[#C4823F]/35 shadow-[-25px_0_60px_rgba(0,0,0,0.95)] z-20 pointer-events-auto"
      >
        <div className="absolute inset-0 bg-gradient-to-l from-black/95 via-black/85 to-[#121216]" />
      </motion.div>

      {/* Center Brand Identity (Illuminated, dissolves softly as doors split open) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{
          opacity: isOpening ? 0 : 1,
          scale: isOpening ? 1.08 : 1
        }}
        transition={{
          duration: isOpening ? 0.65 : 0.8,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4"
      >
        {/* Shimmering Gold Flacon Crest */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 sm:w-20 md:w-24 aspect-square mb-4 flex items-center justify-center"
        >
          <img
            src="/images/perfume_logo_crest_transparent.png"
            alt="Saudagar Emblem"
            className="w-full h-full object-contain filter drop-shadow-[0_8px_30px_rgba(196,130,63,0.55)]"
          />
        </motion.div>

        {/* Brand Wordmark with Tracking Expand */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: '0.18em' }}
          animate={{ opacity: 1, letterSpacing: '0.30em' }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans font-black text-[26px] sm:text-[34px] md:text-[42px] text-white uppercase text-center leading-none tracking-[0.30em]"
        >
          SAUDAGAR
        </motion.h1>

        {/* Lavishly Yours Script Flourish */}
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2 }}
          className="font-script text-[#ECC86A] text-[22px] sm:text-[28px] lowercase tracking-normal mt-2 filter drop-shadow-[0_2px_12px_rgba(196,130,63,0.45)]"
        >
          haute parfumerie
        </motion.span>

        {/* Center Gold Hairline Seam Accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isOpening ? 0 : 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="w-28 h-[1.5px] bg-gradient-to-r from-transparent via-[#C4823F] to-transparent mt-4 opacity-90"
        />
      </motion.div>
    </div>
  );
}
