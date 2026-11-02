import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LuxuryPreloader({ onComplete }) {
  const [isOpening, setIsOpening] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // 1. Unhurried showcase of brand crest & royal velvet drapery (1.5s)
    const openTimer = setTimeout(() => {
      setIsOpening(true);
    }, 1500);

    // 2. Complete transition cleanly after curtains glide open (3.0s)
    const doneTimer = setTimeout(() => {
      setIsDone(true);
      if (onComplete) onComplete();
    }, 3000);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (isDone) return null;

  // Ultra-smooth, liquid cinema cubic-bezier (quartic glide with zero jitter)
  const smoothEase = [0.76, 0, 0.24, 1];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none select-none overflow-hidden bg-black will-change-transform">
      
      {/* ================= LEFT MAROON VELVET CURTAIN ================= */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-1/2 z-20 pointer-events-auto overflow-hidden border-r border-[#D4AF37]/50 shadow-[25px_0_60px_rgba(0,0,0,0.95)]"
        style={{
          transformOrigin: 'left center',
          willChange: 'transform',
        }}
        initial={{ x: 0, scaleX: 1 }}
        animate={{
          x: isOpening ? '-102%' : '0%',
          scaleX: isOpening ? 0.82 : 1, // Realistic fabric bunching toward the wall
        }}
        transition={{
          duration: 1.45,
          ease: smoothEase,
        }}
      >
        {/* Photorealistic Royal Velvet Curtain (Left Half) */}
        <img
          src="/images/luxury_maroon_curtains.jpg"
          alt="Royal Maroon Velvet Curtain"
          className="absolute top-0 left-0 h-full w-[200vw] max-w-none object-cover object-left pointer-events-none"
        />

        {/* Ambient Velvet Lighting & Edge Vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40 pointer-events-none" />

        {/* Gold Braid Cord along Meeting Seam */}
        <div className="absolute top-0 bottom-0 right-0 w-[2.5px] bg-gradient-to-b from-[#FFF2B0] via-[#D4AF37] to-[#785915] shadow-[0_0_12px_rgba(212,175,55,0.7)]" />
      </motion.div>

      {/* ================= RIGHT MAROON VELVET CURTAIN ================= */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-1/2 z-20 pointer-events-auto overflow-hidden border-l border-[#D4AF37]/50 shadow-[-25px_0_60px_rgba(0,0,0,0.95)]"
        style={{
          transformOrigin: 'right center',
          willChange: 'transform',
        }}
        initial={{ x: 0, scaleX: 1 }}
        animate={{
          x: isOpening ? '102%' : '0%',
          scaleX: isOpening ? 0.82 : 1, // Realistic fabric bunching toward the wall
        }}
        transition={{
          duration: 1.45,
          ease: smoothEase,
        }}
      >
        {/* Photorealistic Royal Velvet Curtain (Right Half) */}
        <img
          src="/images/luxury_maroon_curtains.jpg"
          alt="Royal Maroon Velvet Curtain"
          className="absolute top-0 right-0 h-full w-[200vw] max-w-none object-cover object-right pointer-events-none"
        />

        {/* Ambient Velvet Lighting & Edge Vignette */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/50 via-transparent to-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40 pointer-events-none" />

        {/* Gold Braid Cord along Meeting Seam */}
        <div className="absolute top-0 bottom-0 left-0 w-[2.5px] bg-gradient-to-b from-[#FFF2B0] via-[#D4AF37] to-[#785915] shadow-[0_0_12px_rgba(212,175,55,0.7)]" />
      </motion.div>

      {/* ================= TOP BRASS ACCENT ROD ================= */}
      <div className="absolute top-0 left-0 right-0 h-2 z-35 pointer-events-none bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent shadow-[0_2px_10px_rgba(212,175,55,0.4)]" />

      {/* ================= CENTER BRAND IDENTITY (GOLD EMBOSSED ON MAROON VELVET) ================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{
          opacity: isOpening ? 0 : 1,
          scale: isOpening ? 1.06 : 1,
        }}
        transition={{
          duration: isOpening ? 0.6 : 0.85,
          ease: smoothEase,
        }}
        className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none px-4"
      >
        {/* Shimmering Gold Flacon Crest */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: smoothEase }}
          className="w-16 sm:w-20 md:w-24 aspect-square mb-4 flex items-center justify-center"
        >
          <img
            src="/images/perfume_logo_crest_transparent.png"
            alt="Saudagar Royal Crest"
            className="w-full h-full object-contain filter drop-shadow-[0_10px_35px_rgba(212,175,55,0.85)]"
          />
        </motion.div>

        {/* Brand Wordmark in Regal Pure Gold */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: '0.18em' }}
          animate={{ opacity: 1, letterSpacing: '0.30em' }}
          transition={{ duration: 0.9, ease: smoothEase }}
          className="font-sans font-black text-[28px] sm:text-[38px] md:text-[48px] text-[#FFFFFF] uppercase text-center leading-none tracking-[0.30em] filter drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)]"
        >
          SAUDAGAR
        </motion.h1>

        {/* Lavishly Yours Script Flourish in Warm Champagne */}
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="font-script text-[#ECC86A] text-[24px] sm:text-[32px] lowercase tracking-normal mt-2 filter drop-shadow-[0_2px_15px_rgba(212,175,55,0.7)]"
        >
          haute parfumerie
        </motion.span>

        {/* Golden Symmetrical Tassel Line Accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isOpening ? 0 : 1 }}
          transition={{ duration: 0.75, delay: 0.2, ease: 'easeOut' }}
          className="w-32 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mt-4 shadow-[0_0_12px_rgba(212,175,55,0.9)]"
        />
      </motion.div>
    </div>
  );
}
