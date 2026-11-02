import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LuxuryPreloader({ onComplete }) {
  const [isOpening, setIsOpening] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // 1. Initial brand & velvet curtain presentation (1.5s) - unhurried royal showcase
    const openTimer = setTimeout(() => {
      setIsOpening(true);
    }, 1500);

    // 2. Complete transition after curtains fully gather and part to the sides (~2.9s)
    const doneTimer = setTimeout(() => {
      setIsDone(true);
      if (onComplete) onComplete();
    }, 2900);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (isDone) return null;

  // Realistic deep royal maroon / burgundy velvet pleats gradient
  const velvetPleatsLeft = `
    linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.7) 100%),
    repeating-linear-gradient(
      90deg,
      #1C0409 0px,
      #350912 20px,
      #520F1D 45px,
      #350912 70px,
      #1C0409 90px
    )
  `;

  const velvetPleatsRight = `
    linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.7) 100%),
    repeating-linear-gradient(
      90deg,
      #1C0409 0px,
      #350912 20px,
      #520F1D 45px,
      #350912 70px,
      #1C0409 90px
    )
  `;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none select-none overflow-hidden">
      
      {/* ================= LEFT MAROON VELVET CURTAIN ================= */}
      <motion.div
        initial={{ x: 0, scaleX: 1 }}
        animate={{
          x: isOpening ? '-102%' : 0,
          scaleX: isOpening ? 0.65 : 1
        }}
        transition={{
          duration: 1.35,
          ease: [0.65, 0, 0.15, 1] // Royal velvet gather & parting curve
        }}
        style={{
          background: velvetPleatsLeft,
          transformOrigin: 'left center'
        }}
        className="absolute top-0 bottom-0 left-0 w-1/2 z-20 pointer-events-auto border-r-2 border-[#D4AF37] shadow-[25px_0_60px_rgba(0,0,0,0.95)] overflow-hidden"
      >
        {/* Soft Ambient Velvet Lustre & Deep Shadow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,_rgba(138,26,48,0.35)_0%,_transparent_75%)] pointer-events-none" />
        
        {/* Gold Fringe Cord Along Center Seam */}
        <div className="absolute top-0 bottom-0 right-0 w-[3px] bg-gradient-to-b from-[#ECC86A] via-[#D4AF37] to-[#9E7D23] shadow-[0_0_12px_rgba(212,175,55,0.6)]" />
      </motion.div>

      {/* ================= RIGHT MAROON VELVET CURTAIN ================= */}
      <motion.div
        initial={{ x: 0, scaleX: 1 }}
        animate={{
          x: isOpening ? '102%' : 0,
          scaleX: isOpening ? 0.65 : 1
        }}
        transition={{
          duration: 1.35,
          ease: [0.65, 0, 0.15, 1] // Royal velvet gather & parting curve
        }}
        style={{
          background: velvetPleatsRight,
          transformOrigin: 'right center'
        }}
        className="absolute top-0 bottom-0 right-0 w-1/2 z-20 pointer-events-auto border-l-2 border-[#D4AF37] shadow-[-25px_0_60px_rgba(0,0,0,0.95)] overflow-hidden"
      >
        {/* Soft Ambient Velvet Lustre & Deep Shadow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,_rgba(138,26,48,0.35)_0%,_transparent_75%)] pointer-events-none" />

        {/* Gold Fringe Cord Along Center Seam */}
        <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-[#ECC86A] via-[#D4AF37] to-[#9E7D23] shadow-[0_0_12px_rgba(212,175,55,0.6)]" />
      </motion.div>

      {/* ================= TOP ROYAL VALANCE / DRAPERY SWAG ================= */}
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: isOpening ? 0 : 1, y: isOpening ? -20 : 0 }}
        transition={{ duration: 0.8, ease: 'easeIn' }}
        className="absolute top-0 left-0 right-0 h-10 sm:h-12 z-25 pointer-events-none flex items-center justify-center border-b border-[#D4AF37]/50 bg-gradient-to-b from-black/80 via-[#2A070F] to-transparent"
      >
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent absolute bottom-0 shadow-[0_0_10px_#D4AF37]" />
      </motion.div>

      {/* ================= CENTER BRAND IDENTITY (GOLD EMBOSSED ON MAROON VELVET) ================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{
          opacity: isOpening ? 0 : 1,
          scale: isOpening ? 1.08 : 1
        }}
        transition={{
          duration: isOpening ? 0.65 : 0.85,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4"
      >
        {/* Shimmering Gold Flacon Crest */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 sm:w-20 md:w-24 aspect-square mb-4 flex items-center justify-center"
        >
          <img
            src="/images/perfume_logo_crest_transparent.png"
            alt="Saudagar Royal Crest"
            className="w-full h-full object-contain filter drop-shadow-[0_10px_35px_rgba(212,175,55,0.65)]"
          />
        </motion.div>

        {/* Brand Wordmark in Regal Pure Gold */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: '0.18em' }}
          animate={{ opacity: 1, letterSpacing: '0.30em' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans font-black text-[26px] sm:text-[34px] md:text-[44px] text-[#FFFFFF] uppercase text-center leading-none tracking-[0.30em] filter drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
        >
          SAUDAGAR
        </motion.h1>

        {/* Lavishly Yours Script Flourish in Warm Champagne */}
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="font-script text-[#ECC86A] text-[24px] sm:text-[30px] lowercase tracking-normal mt-2 filter drop-shadow-[0_2px_15px_rgba(212,175,55,0.55)]"
        >
          haute parfumerie
        </motion.span>

        {/* Golden Tassel Line Accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isOpening ? 0 : 1 }}
          transition={{ duration: 0.75, delay: 0.2, ease: 'easeOut' }}
          className="w-32 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mt-4 shadow-[0_0_10px_rgba(212,175,55,0.7)]"
        />
      </motion.div>
    </div>
  );
}
