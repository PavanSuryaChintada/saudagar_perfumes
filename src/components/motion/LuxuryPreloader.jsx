import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Number of realistic vertical velvet drape folds per curtain side
const FOLD_COUNT = 7;

export default function LuxuryPreloader({ onComplete }) {
  const [isOpening, setIsOpening] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // 1. Initial brand & royal velvet presentation (1.6s)
    const openTimer = setTimeout(() => {
      setIsOpening(true);
    }, 1600);

    // 2. Complete transition after curtains fully gather, wave, and part (~3.3s)
    const doneTimer = setTimeout(() => {
      setIsDone(true);
      if (onComplete) onComplete();
    }, 3300);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (isDone) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none select-none overflow-hidden bg-black/60">
      
      {/* ================= TOP BRASS CURTAIN ROD & FINIALS ================= */}
      <div className="absolute top-0 left-0 right-0 h-7 sm:h-9 z-40 pointer-events-none flex items-center justify-between px-2 sm:px-6">
        {/* Left Ornate Finial */}
        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#FFE58F] via-[#D4AF37] to-[#8C6D1F] shadow-[0_2px_10px_rgba(0,0,0,0.9)] border border-[#FFF1B8]/70 flex-shrink-0 z-10" />
        
        {/* Polished Heavy Brass Rod */}
        <div className="flex-1 h-2 sm:h-2.5 mx-[-6px] bg-gradient-to-b from-[#FFF4CC] via-[#D4AF37] to-[#684E0B] shadow-[0_4px_12px_rgba(0,0,0,0.95)] relative">
          <div className="absolute top-[1px] left-0 right-0 h-[1px] bg-white/70" />
        </div>

        {/* Right Ornate Finial */}
        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#FFE58F] via-[#D4AF37] to-[#8C6D1F] shadow-[0_2px_10px_rgba(0,0,0,0.9)] border border-[#FFF1B8]/70 flex-shrink-0 z-10" />
      </div>

      {/* ================= LEFT MAROON VELVET CURTAIN ASSEMBLY ================= */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-1/2 z-20 pointer-events-auto overflow-visible flex flex-row"
        style={{ transformOrigin: 'left center' }}
        initial={{ x: 0 }}
        animate={{
          x: isOpening ? '-106%' : 0,
        }}
        transition={{
          duration: 1.55,
          ease: [0.65, 0.02, 0.18, 0.98], // Heavy royal velvet inertia curve
        }}
      >
        {Array.from({ length: FOLD_COUNT }).map((_, i) => {
          // Fold 0 is near the left wall; Fold 6 is the leading center fold
          const isCenterLead = i === FOLD_COUNT - 1;
          const foldDelay = (FOLD_COUNT - 1 - i) * 0.045; // Center moves first, drawing outer folds!
          
          return (
            <motion.div
              key={`left-fold-${i}`}
              className="relative h-full flex-1"
              style={{
                transformOrigin: 'left top',
                zIndex: FOLD_COUNT + i,
              }}
              animate={
                isOpening
                  ? {
                      // Accordion bunching & living fabric wave flutter
                      scaleX: [1, 0.75, 0.42],
                      skewY: [0, -4.5, 3, -1.5, 0],
                      y: [0, -14, 8, -3, 0],
                    }
                  : {
                      scaleX: 1,
                      skewY: 0,
                      y: 0,
                    }
              }
              transition={{
                duration: 1.45,
                delay: isOpening ? foldDelay : 0,
                ease: [0.45, 0.05, 0.2, 0.98],
              }}
            >
              {/* Sliding Brass Grommet Ring at Top of Fold */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-[#FFE58F] bg-gradient-to-b from-[#D4AF37] to-[#7D5E13] shadow-[0_2px_5px_rgba(0,0,0,0.9)] z-30 pointer-events-none" />

              {/* 3D Cylindrical Velvet Draped Column */}
              <div
                className="w-full h-full relative"
                style={{
                  background: `
                    linear-gradient(
                      90deg,
                      #150206 0%,
                      #350711 15%,
                      #5A0F1E 36%,
                      #801429 50%,
                      #5A0F1E 64%,
                      #350711 85%,
                      #150206 100%
                    )
                  `,
                  boxShadow: 'inset 0 0 35px rgba(0,0,0,0.85), 6px 0 16px rgba(0,0,0,0.65)',
                }}
              >
                {/* Velvet Micro-Sheen & Texture Highlight */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,_rgba(195,35,70,0.38)_0%,_transparent_75%)] pointer-events-none" />
                
                {/* Vertical Ambient Shadow Creases */}
                <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/85 to-transparent pointer-events-none" />
                <div className="absolute top-0 bottom-0 right-0 w-2.5 bg-gradient-to-l from-black/85 to-transparent pointer-events-none" />

                {/* Bottom Scalloped Hemline with Golden Fringe */}
                <div className="absolute bottom-0 left-0 right-0 overflow-visible">
                  {/* Scallop Arch */}
                  <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-5 sm:h-7 text-[#150206] fill-current">
                    <path d="M0,0 Q50,25 100,0 L100,25 L0,25 Z" />
                  </svg>
                  {/* Hanging Gold Bullion Fringe that swings with realistic momentum */}
                  <motion.div
                    className="w-full flex justify-around pt-1"
                    animate={
                      isOpening
                        ? {
                            rotate: [0, 24, -15, 8, -3, 0],
                            x: [0, -14, 8, -3, 0],
                          }
                        : {}
                    }
                    transition={{
                      duration: 1.5,
                      delay: isOpening ? foldDelay + 0.08 : 0,
                      ease: 'easeOut',
                    }}
                    style={{ transformOrigin: 'top center' }}
                  >
                    {Array.from({ length: 4 }).map((_, fIdx) => (
                      <div
                        key={fIdx}
                        className="w-[2.5px] h-6 sm:h-8 bg-gradient-to-b from-[#FFF2B2] via-[#D4AF37] to-[#6E4E0B] shadow-[0_2px_4px_rgba(0,0,0,0.8)] rounded-sm"
                      />
                    ))}
                  </motion.div>
                </div>

                {/* Center Leading Edge: Ornate Gold Baroque Filigree & Braid Border */}
                {isCenterLead && (
                  <div className="absolute top-0 bottom-0 right-0 w-4 sm:w-5 flex flex-col justify-between items-center pointer-events-none z-30">
                    {/* Golden Braid Border Cord */}
                    <div className="w-[3px] h-full bg-gradient-to-b from-[#FFF0A5] via-[#D4AF37] to-[#7D5F18] shadow-[0_0_12px_rgba(212,175,55,0.8)] absolute right-0" />
                    
                    {/* Subtle Baroque Gold Embroidery Motifs along seam */}
                    <div className="h-full w-full flex flex-col justify-around items-end pr-1 opacity-80">
                      {Array.from({ length: 16 }).map((_, bIdx) => (
                        <div
                          key={bIdx}
                          className="w-1.5 h-1.5 rotate-45 border border-[#FFE58F] bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.9)]"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ================= RIGHT MAROON VELVET CURTAIN ASSEMBLY ================= */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-1/2 z-20 pointer-events-auto overflow-visible flex flex-row"
        style={{ transformOrigin: 'right center' }}
        initial={{ x: 0 }}
        animate={{
          x: isOpening ? '106%' : 0,
        }}
        transition={{
          duration: 1.55,
          ease: [0.65, 0.02, 0.18, 0.98], // Heavy royal velvet inertia curve
        }}
      >
        {Array.from({ length: FOLD_COUNT }).map((_, i) => {
          // Fold 0 is the leading center fold; Fold 6 is near the right wall
          const isCenterLead = i === 0;
          const foldDelay = i * 0.045; // Center moves first, outer folds follow!
          
          return (
            <motion.div
              key={`right-fold-${i}`}
              className="relative h-full flex-1"
              style={{
                transformOrigin: 'right top',
                zIndex: FOLD_COUNT + (FOLD_COUNT - i),
              }}
              animate={
                isOpening
                  ? {
                      // Accordion bunching & living fabric wave flutter
                      scaleX: [1, 0.75, 0.42],
                      skewY: [0, 4.5, -3, 1.5, 0],
                      y: [0, -14, 8, -3, 0],
                    }
                  : {
                      scaleX: 1,
                      skewY: 0,
                      y: 0,
                    }
              }
              transition={{
                duration: 1.45,
                delay: isOpening ? foldDelay : 0,
                ease: [0.45, 0.05, 0.2, 0.98],
              }}
            >
              {/* Sliding Brass Grommet Ring at Top of Fold */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-[#FFE58F] bg-gradient-to-b from-[#D4AF37] to-[#7D5E13] shadow-[0_2px_5px_rgba(0,0,0,0.9)] z-30 pointer-events-none" />

              {/* 3D Cylindrical Velvet Draped Column */}
              <div
                className="w-full h-full relative"
                style={{
                  background: `
                    linear-gradient(
                      90deg,
                      #150206 0%,
                      #350711 15%,
                      #5A0F1E 36%,
                      #801429 50%,
                      #5A0F1E 64%,
                      #350711 85%,
                      #150206 100%
                    )
                  `,
                  boxShadow: 'inset 0 0 35px rgba(0,0,0,0.85), -6px 0 16px rgba(0,0,0,0.65)',
                }}
              >
                {/* Velvet Micro-Sheen & Texture Highlight */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,_rgba(195,35,70,0.38)_0%,_transparent_75%)] pointer-events-none" />
                
                {/* Vertical Ambient Shadow Creases */}
                <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/85 to-transparent pointer-events-none" />
                <div className="absolute top-0 bottom-0 right-0 w-2.5 bg-gradient-to-l from-black/85 to-transparent pointer-events-none" />

                {/* Bottom Scalloped Hemline with Golden Fringe */}
                <div className="absolute bottom-0 left-0 right-0 overflow-visible">
                  {/* Scallop Arch */}
                  <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-5 sm:h-7 text-[#150206] fill-current">
                    <path d="M0,0 Q50,25 100,0 L100,25 L0,25 Z" />
                  </svg>
                  {/* Hanging Gold Bullion Fringe that swings with realistic momentum */}
                  <motion.div
                    className="w-full flex justify-around pt-1"
                    animate={
                      isOpening
                        ? {
                            rotate: [0, -24, 15, -8, 3, 0],
                            x: [0, 14, -8, 3, 0],
                          }
                        : {}
                    }
                    transition={{
                      duration: 1.5,
                      delay: isOpening ? foldDelay + 0.08 : 0,
                      ease: 'easeOut',
                    }}
                    style={{ transformOrigin: 'top center' }}
                  >
                    {Array.from({ length: 4 }).map((_, fIdx) => (
                      <div
                        key={fIdx}
                        className="w-[2.5px] h-6 sm:h-8 bg-gradient-to-b from-[#FFF2B2] via-[#D4AF37] to-[#6E4E0B] shadow-[0_2px_4px_rgba(0,0,0,0.8)] rounded-sm"
                      />
                    ))}
                  </motion.div>
                </div>

                {/* Center Leading Edge: Ornate Gold Baroque Filigree & Braid Border */}
                {isCenterLead && (
                  <div className="absolute top-0 bottom-0 left-0 w-4 sm:w-5 flex flex-col justify-between items-center pointer-events-none z-30">
                    {/* Golden Braid Border Cord */}
                    <div className="w-[3px] h-full bg-gradient-to-b from-[#FFF0A5] via-[#D4AF37] to-[#7D5F18] shadow-[0_0_12px_rgba(212,175,55,0.8)] absolute left-0" />
                    
                    {/* Subtle Baroque Gold Embroidery Motifs along seam */}
                    <div className="h-full w-full flex flex-col justify-around items-start pl-1 opacity-80">
                      {Array.from({ length: 16 }).map((_, bIdx) => (
                        <div
                          key={bIdx}
                          className="w-1.5 h-1.5 rotate-45 border border-[#FFE58F] bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.9)]"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ================= ROYAL VELVET SWAG VALANCE / PELMET (TOP HEADER) ================= */}
      <motion.div
        initial={{ y: 0, opacity: 1 }}
        animate={isOpening ? { y: -55, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 1.05, ease: [0.65, 0, 0.25, 1] }}
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
        initial={{ opacity: 0.8, scale: 0.95 }}
        animate={isOpening ? { opacity: 1, scale: 1.05, x: -12 } : { opacity: 0.8, scale: 0.95 }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/2 left-3 sm:left-6 -translate-y-1/2 z-40 pointer-events-none hidden sm:flex flex-col items-center"
      >
        <div className="w-6 h-6 rounded-full border-2 border-[#FFE898] bg-gradient-to-br from-[#ECC86A] via-[#D4AF37] to-[#705212] shadow-[0_4px_12px_rgba(0,0,0,0.9)]" />
        <div className="w-4 h-12 mt-1 rounded-b-md bg-gradient-to-b from-[#ECC86A] via-[#D4AF37] to-[#60440C] shadow-[0_6px_15px_rgba(0,0,0,0.85)] border-t border-[#FFF2B0]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0.8, scale: 0.95 }}
        animate={isOpening ? { opacity: 1, scale: 1.05, x: 12 } : { opacity: 0.8, scale: 0.95 }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/2 right-3 sm:right-6 -translate-y-1/2 z-40 pointer-events-none hidden sm:flex flex-col items-center"
      >
        <div className="w-6 h-6 rounded-full border-2 border-[#FFE898] bg-gradient-to-br from-[#ECC86A] via-[#D4AF37] to-[#705212] shadow-[0_4px_12px_rgba(0,0,0,0.9)]" />
        <div className="w-4 h-12 mt-1 rounded-b-md bg-gradient-to-b from-[#ECC86A] via-[#D4AF37] to-[#60440C] shadow-[0_6px_15px_rgba(0,0,0,0.85)] border-t border-[#FFF2B0]" />
      </motion.div>

      {/* ================= CENTER BRAND IDENTITY (EMBOSSED GOLD ON MAROON VELVET) ================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{
          opacity: isOpening ? 0 : 1,
          scale: isOpening ? 1.08 : 1,
        }}
        transition={{
          duration: isOpening ? 0.6 : 0.85,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none px-4"
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
            className="w-full h-full object-contain filter drop-shadow-[0_10px_35px_rgba(212,175,55,0.7)]"
          />
        </motion.div>

        {/* Brand Wordmark in Regal Pure Gold */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: '0.18em' }}
          animate={{ opacity: 1, letterSpacing: '0.30em' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
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
