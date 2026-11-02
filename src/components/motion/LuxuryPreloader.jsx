import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LuxuryPreloader({ onComplete }) {
  const [isOpening, setIsOpening] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Check if user already saw the intro in this session
    const hasSeenIntro = typeof window !== 'undefined'
      ? sessionStorage.getItem('saudagar_intro_seen')
      : null;

    if (hasSeenIntro) {
      setIsDone(true);
      if (onComplete) onComplete();
      return;
    }

    // Brief initial brand presentation (850ms), then split curtains open gracefully
    const openTimer = setTimeout(() => {
      setIsOpening(true);
    }, 850);

    // Complete transition after curtains fully part and clear viewport (~1.8s total)
    const doneTimer = setTimeout(() => {
      setIsDone(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('saudagar_intro_seen', 'true');
      }
      if (onComplete) onComplete();
    }, 1850);

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
          duration: 1.0,
          ease: [0.76, 0, 0.24, 1] // Luxury architectural door easing
        }}
        className="absolute top-0 bottom-0 left-0 w-1/2 bg-[#0A0A0C] border-r border-[#C4823F]/30 shadow-[20px_0_50px_rgba(0,0,0,0.9)] z-20 pointer-events-auto"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-[#121216]" />
      </motion.div>

      {/* Right Boutique Door Panel */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isOpening ? '100%' : 0 }}
        transition={{
          duration: 1.0,
          ease: [0.76, 0, 0.24, 1] // Luxury architectural door easing
        }}
        className="absolute top-0 bottom-0 right-0 w-1/2 bg-[#0A0A0C] border-l border-[#C4823F]/30 shadow-[-20px_0_50px_rgba(0,0,0,0.9)] z-20 pointer-events-auto"
      >
        <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/80 to-[#121216]" />
      </motion.div>

      {/* Center Brand Identity (Dissolves & expands subtly as doors split open) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{
          opacity: isOpening ? 0 : 1,
          scale: isOpening ? 1.06 : 1
        }}
        transition={{
          duration: isOpening ? 0.55 : 0.65,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4"
      >
        {/* Shimmering Gold Flacon Crest */}
        <div className="w-16 sm:w-20 aspect-square mb-4 flex items-center justify-center">
          <img
            src="/images/perfume_logo_crest_transparent.png"
            alt="Saudagar Emblem"
            className="w-full h-full object-contain filter drop-shadow-[0_8px_25px_rgba(196,130,63,0.5)]"
          />
        </div>

        {/* Brand Wordmark */}
        <h1 className="font-sans font-black text-[26px] sm:text-[34px] md:text-[40px] tracking-[0.28em] text-white uppercase text-center leading-none">
          SAUDAGAR
        </h1>

        {/* Lavishly Yours Script Flourish */}
        <span className="font-script text-[#ECC86A] text-[22px] sm:text-[26px] lowercase tracking-normal mt-1.5 filter drop-shadow-[0_2px_10px_rgba(196,130,63,0.4)]">
          haute parfumerie
        </span>

        {/* Center Gold Hairline Seam Accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isOpening ? 0 : 1 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#C4823F] to-transparent mt-4 opacity-80"
        />
      </motion.div>
    </div>
  );
}
