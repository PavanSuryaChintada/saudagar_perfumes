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

  // Deep Royal Maroon / Crimson Velvet 3D Cylindrical Pleats
  const velvetTexture = `
    radial-gradient(ellipse at 50% 45%, rgba(185, 28, 62, 0.35) 0%, transparent 75%),
    repeating-linear-gradient(
      90deg,
      #120205 0px,
      #24040B 16px,
      #440815 38px,
      #6A1024 60px,
      #440815 82px,
      #24040B 104px,
      #120205 120px
    )
  `;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none select-none overflow-hidden bg-black/60 will-change-transform">
      
      {/* ================= TOP POLISHED BRASS CURTAIN ROD & FINIALS ================= */}
      <div className="absolute top-0 left-0 right-0 h-7 sm:h-9 z-40 pointer-events-none flex items-center justify-between px-2 sm:px-6">
        {/* Left Ornate Finial */}
        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#FFE898] via-[#D4AF37] to-[#7D5E13] shadow-[0_3px_10px_rgba(0,0,0,0.9)] border border-[#FFF4CC]/80 flex-shrink-0 z-10" />
        
        {/* Polished Brass Rod with Specular Highlight */}
        <div className="flex-1 h-2 sm:h-2.5 mx-[-6px] bg-gradient-to-b from-[#FFF5D0] via-[#D4AF37] to-[#5C4208] shadow-[0_4px_12px_rgba(0,0,0,0.95)] relative">
          <div className="absolute top-[1px] left-0 right-0 h-[1px] bg-white/70" />
        </div>

        {/* Right Ornate Finial */}
        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#FFE898] via-[#D4AF37] to-[#7D5E13] shadow-[0_3px_10px_rgba(0,0,0,0.9)] border border-[#FFF4CC]/80 flex-shrink-0 z-10" />
      </div>

      {/* ================= LEFT MAROON VELVET CURTAIN ================= */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-1/2 z-20 pointer-events-auto overflow-visible"
        style={{
          transformOrigin: 'left center',
          background: velvetTexture,
          boxShadow: '25px 0 60px rgba(0,0,0,0.95)',
          willChange: 'transform',
        }}
        initial={{ x: 0, scaleX: 1, skewX: 0 }}
        animate={{
          x: isOpening ? '-102%' : '0%',
          scaleX: isOpening ? 0.72 : 1, // Realistic fabric bunching toward the wall
          skewX: isOpening ? [0, -2, 0] : 0, // Subtle organic drape sway
        }}
        transition={{
          duration: 1.45,
          ease: smoothEase,
        }}
      >
        {/* Soft Ambient Velvet Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none" />

        {/* Sliding Brass Curtain Rings along Rod */}
        <div className="absolute top-1.5 left-0 right-4 flex justify-around pointer-events-none z-30">
          {Array.from({ length: 6 }).map((_, rIdx) => (
            <div
              key={rIdx}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-[#FFE898] bg-gradient-to-b from-[#D4AF37] to-[#7D5E13] shadow-[0_2px_5px_rgba(0,0,0,0.9)]"
            />
          ))}
        </div>

        {/* Bottom Scalloped Hem with Gold Bullion Fringe */}
        <div className="absolute bottom-0 left-0 right-0 overflow-visible pointer-events-none">
          <svg viewBox="0 0 600 24" preserveAspectRatio="none" className="w-full h-5 sm:h-7 text-[#120205] fill-current">
            <path d="M0,0 Q50,24 100,0 Q150,24 200,0 Q250,24 300,0 Q350,24 400,0 Q450,24 500,0 Q550,24 600,0 L600,24 L0,24 Z" />
          </svg>
          <motion.div
            className="w-full flex justify-around pt-1"
            animate={
              isOpening
                ? {
                    rotate: [0, 14, -6, 0],
                    x: [0, -10, 3, 0],
                  }
                : {}
            }
            transition={{
              duration: 1.45,
              ease: smoothEase,
            }}
            style={{ transformOrigin: 'top center', willChange: 'transform' }}
          >
            {Array.from({ length: 24 }).map((_, fIdx) => (
              <div
                key={fIdx}
                className="w-[2px] h-5 sm:h-7 bg-gradient-to-b from-[#FFF2B2] via-[#D4AF37] to-[#6E4E0B] shadow-[0_2px_4px_rgba(0,0,0,0.8)] rounded-sm"
              />
            ))}
          </motion.div>
        </div>

        {/* Center Leading Seam: Gold Braid Cord & Baroque Embroidery Motifs */}
        <div className="absolute top-0 bottom-0 right-0 w-4 sm:w-5 flex flex-col justify-between items-end pointer-events-none z-30">
          {/* Gleaming Gold Braid Border */}
          <div className="w-[3px] h-full bg-gradient-to-b from-[#FFF0A5] via-[#D4AF37] to-[#7D5F18] shadow-[0_0_12px_rgba(212,175,55,0.8)] absolute right-0" />
          {/* Regal Diamond Embroidery Accents */}
          <div className="h-full w-full flex flex-col justify-around items-end pr-1.5 opacity-85">
            {Array.from({ length: 16 }).map((_, bIdx) => (
              <div
                key={bIdx}
                className="w-1.5 h-1.5 rotate-45 border border-[#FFE58F] bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.9)]"
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ================= RIGHT MAROON VELVET CURTAIN ================= */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-1/2 z-20 pointer-events-auto overflow-visible"
        style={{
          transformOrigin: 'right center',
          background: velvetTexture,
          boxShadow: '-25px 0 60px rgba(0,0,0,0.95)',
          willChange: 'transform',
        }}
        initial={{ x: 0, scaleX: 1, skewX: 0 }}
        animate={{
          x: isOpening ? '102%' : '0%',
          scaleX: isOpening ? 0.72 : 1, // Realistic fabric bunching toward the wall
          skewX: isOpening ? [0, 2, 0] : 0, // Subtle organic drape sway
        }}
        transition={{
          duration: 1.45,
          ease: smoothEase,
        }}
      >
        {/* Soft Ambient Velvet Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none" />

        {/* Sliding Brass Curtain Rings along Rod */}
        <div className="absolute top-1.5 left-4 right-0 flex justify-around pointer-events-none z-30">
          {Array.from({ length: 6 }).map((_, rIdx) => (
            <div
              key={rIdx}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-[#FFE898] bg-gradient-to-b from-[#D4AF37] to-[#7D5E13] shadow-[0_2px_5px_rgba(0,0,0,0.9)]"
            />
          ))}
        </div>

        {/* Bottom Scalloped Hem with Gold Bullion Fringe */}
        <div className="absolute bottom-0 left-0 right-0 overflow-visible pointer-events-none">
          <svg viewBox="0 0 600 24" preserveAspectRatio="none" className="w-full h-5 sm:h-7 text-[#120205] fill-current">
            <path d="M0,0 Q50,24 100,0 Q150,24 200,0 Q250,24 300,0 Q350,24 400,0 Q450,24 500,0 Q550,24 600,0 L600,24 L0,24 Z" />
          </svg>
          <motion.div
            className="w-full flex justify-around pt-1"
            animate={
              isOpening
                ? {
                    rotate: [0, -14, 6, 0],
                    x: [0, 10, -3, 0],
                  }
                : {}
            }
            transition={{
              duration: 1.45,
              ease: smoothEase,
            }}
            style={{ transformOrigin: 'top center', willChange: 'transform' }}
          >
            {Array.from({ length: 24 }).map((_, fIdx) => (
              <div
                key={fIdx}
                className="w-[2px] h-5 sm:h-7 bg-gradient-to-b from-[#FFF2B2] via-[#D4AF37] to-[#6E4E0B] shadow-[0_2px_4px_rgba(0,0,0,0.8)] rounded-sm"
              />
            ))}
          </motion.div>
        </div>

        {/* Center Leading Seam: Gold Braid Cord & Baroque Embroidery Motifs */}
        <div className="absolute top-0 bottom-0 left-0 w-4 sm:w-5 flex flex-col justify-between items-start pointer-events-none z-30">
          {/* Gleaming Gold Braid Border */}
          <div className="w-[3px] h-full bg-gradient-to-b from-[#FFF0A5] via-[#D4AF37] to-[#7D5F18] shadow-[0_0_12px_rgba(212,175,55,0.8)] absolute left-0" />
          {/* Regal Diamond Embroidery Accents */}
          <div className="h-full w-full flex flex-col justify-around items-start pl-1.5 opacity-85">
            {Array.from({ length: 16 }).map((_, bIdx) => (
              <div
                key={bIdx}
                className="w-1.5 h-1.5 rotate-45 border border-[#FFE58F] bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.9)]"
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ================= ROYAL VELVET SWAG VALANCE / PELMET (TOP HEADER) ================= */}
      <motion.div
        initial={{ y: 0, opacity: 1 }}
        animate={isOpening ? { y: -50, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 1.1, ease: smoothEase }}
        className="absolute top-5 sm:top-7 left-0 right-0 z-35 pointer-events-none flex justify-center items-start overflow-hidden px-2"
      >
        <div className="w-full flex justify-between items-start max-w-7xl">
          {[0, 1, 2].map((swagIdx) => (
            <div key={swagIdx} className="flex-1 relative mx-1">
              <div
                className="h-12 sm:h-16 rounded-b-[50%] relative overflow-hidden border-b-2 border-[#D4AF37] shadow-[0_8px_25px_rgba(0,0,0,0.9)]"
                style={{
                  background: 'radial-gradient(ellipse at 50% 20%, #751428 0%, #3D0813 60%, #170207 100%)',
                }}
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(0,0,0,0.45)_25px,transparent_30px)]" />
              </div>
              <div className="w-full flex justify-around mt-[-3px]">
                {Array.from({ length: 8 }).map((_, frIdx) => (
                  <div
                    key={frIdx}
                    className="w-[2px] h-3 sm:h-4 bg-gradient-to-b from-[#FFF2B0] via-[#D4AF37] to-[#785915]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ================= ROYAL GOLDEN TIEBACKS & TASSELS ================= */}
      <motion.div
        initial={{ opacity: 0.85, scale: 0.95 }}
        animate={isOpening ? { opacity: 1, scale: 1.05, x: -10 } : { opacity: 0.85, scale: 0.95 }}
        transition={{ duration: 1.1, ease: smoothEase }}
        className="absolute top-1/2 left-3 sm:left-6 -translate-y-1/2 z-40 pointer-events-none hidden sm:flex flex-col items-center"
      >
        <div className="w-6 h-6 rounded-full border-2 border-[#FFE898] bg-gradient-to-br from-[#ECC86A] via-[#D4AF37] to-[#705212] shadow-[0_4px_12px_rgba(0,0,0,0.9)]" />
        <div className="w-4 h-12 mt-1 rounded-b-md bg-gradient-to-b from-[#ECC86A] via-[#D4AF37] to-[#60440C] shadow-[0_6px_15px_rgba(0,0,0,0.85)] border-t border-[#FFF2B0]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0.85, scale: 0.95 }}
        animate={isOpening ? { opacity: 1, scale: 1.05, x: 10 } : { opacity: 0.85, scale: 0.95 }}
        transition={{ duration: 1.1, ease: smoothEase }}
        className="absolute top-1/2 right-3 sm:right-6 -translate-y-1/2 z-40 pointer-events-none hidden sm:flex flex-col items-center"
      >
        <div className="w-6 h-6 rounded-full border-2 border-[#FFE898] bg-gradient-to-br from-[#ECC86A] via-[#D4AF37] to-[#705212] shadow-[0_4px_12px_rgba(0,0,0,0.9)]" />
        <div className="w-4 h-12 mt-1 rounded-b-md bg-gradient-to-b from-[#ECC86A] via-[#D4AF37] to-[#60440C] shadow-[0_6px_15px_rgba(0,0,0,0.85)] border-t border-[#FFF2B0]" />
      </motion.div>

      {/* ================= CENTER BRAND IDENTITY ================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{
          opacity: isOpening ? 0 : 1,
          scale: isOpening ? 1.05 : 1,
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
            className="w-full h-full object-contain filter drop-shadow-[0_10px_35px_rgba(212,175,55,0.7)]"
          />
        </motion.div>

        {/* Brand Wordmark in Regal Pure Gold */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: '0.18em' }}
          animate={{ opacity: 1, letterSpacing: '0.30em' }}
          transition={{ duration: 0.9, ease: smoothEase }}
          className="font-sans font-black text-[28px] sm:text-[38px] md:text-[46px] text-[#FFFFFF] uppercase text-center leading-none tracking-[0.30em] filter drop-shadow-[0_4px_22px_rgba(0,0,0,0.9)]"
        >
          SAUDAGAR
        </motion.h1>

        {/* Lavishly Yours Script Flourish in Warm Champagne */}
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="font-script text-[#ECC86A] text-[24px] sm:text-[32px] lowercase tracking-normal mt-2 filter drop-shadow-[0_2px_15px_rgba(212,175,55,0.65)]"
        >
          haute parfumerie
        </motion.span>

        {/* Golden Symmetrical Tassel Line Accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isOpening ? 0 : 1 }}
          transition={{ duration: 0.75, delay: 0.2, ease: 'easeOut' }}
          className="w-32 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mt-4 shadow-[0_0_12px_rgba(212,175,55,0.8)]"
        />
      </motion.div>
    </div>
  );
}
