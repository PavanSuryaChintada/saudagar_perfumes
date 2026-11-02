import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LuxuryPreloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [subtitleIdx, setSubtitleIdx] = useState(0);

  const notes = [
    'Artisanal Extraction',
    'Oak Barrel Maturation',
    'Haute Parfumerie Flaconnage'
  ];

  useEffect(() => {
    // Check if user already saw the intro in this session
    const hasSeenIntro = sessionStorage.getItem('saudagar_intro_seen');
    if (hasSeenIntro) {
      // Immediate quick reveal for returning navigations
      setIsDone(true);
      if (onComplete) onComplete();
      return;
    }

    // Fast, elegant luxury progress accumulation (total time ~1.3s)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Organic deceleration towards 100%
        const remaining = 100 - prev;
        const jump = Math.max(2, Math.floor(remaining * 0.18 + Math.random() * 4));
        const next = Math.min(100, prev + jump);

        if (next > 35 && next < 70) setSubtitleIdx(1);
        if (next >= 70) setSubtitleIdx(2);

        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (progress === 100 && !isDone) {
      const timer = setTimeout(() => {
        setIsDone(true);
        sessionStorage.setItem('saudagar_intro_seen', 'true');
        if (onComplete) onComplete();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [progress, isDone, onComplete]);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          key="luxury-preloader"
          initial={{ opacity: 1 }}
          exit={{
            y: '-100%',
            transition: {
              duration: 0.85,
              ease: [0.76, 0, 0.24, 1] // Luxury curtain wipe
            }
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0A0A0C] text-white select-none px-6 py-12 overflow-hidden pointer-events-auto"
        >
          {/* Subtle Golden Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(196,130,63,0.12)_0%,_transparent_70%)] pointer-events-none" />

          {/* Top Line Brand Monogram */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="font-script text-[22px] sm:text-[26px] text-[#ECC86A] lowercase tracking-normal block leading-tight">
              haute parfumerie
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-semibold tracking-[0.35em] text-[#C4823F] uppercase block">
              EST. 2026 · PRIVATE ATELIER
            </span>
          </motion.div>

          {/* Center Brand Identity & Emblem */}
          <div className="relative flex flex-col items-center justify-center my-auto">
            {/* Shimmering Gold Flacon Crest */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-16 sm:w-20 aspect-square mb-5 flex items-center justify-center"
            >
              <img
                src="/images/perfume_logo_crest_transparent.png"
                alt="Saudagar Emblem"
                className="w-full h-full object-contain filter drop-shadow-[0_8px_25px_rgba(196,130,63,0.45)]"
              />
            </motion.div>

            {/* Main Wordmark */}
            <motion.h1
              initial={{ opacity: 0, letterSpacing: '0.2em' }}
              animate={{ opacity: 1, letterSpacing: '0.36em' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-[22px] sm:text-[28px] md:text-[34px] font-black uppercase tracking-[0.36em] text-white text-center ml-2"
            >
              SAUDAGAR
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.65, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-white/70 mt-2 text-center"
            >
              PERFUMES
            </motion.p>

            {/* Elegant Subtitle / Olfactory Notes Reveal */}
            <motion.div
              key={subtitleIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 0.75, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35 }}
              className="text-[10.5px] tracking-[0.24em] uppercase text-[#C4823F] mt-6 font-medium text-center"
            >
              {notes[subtitleIdx]}
            </motion.div>
          </div>

          {/* Bottom Luxury Hairline Progress Indicator */}
          <div className="w-full max-w-xs flex flex-col items-center gap-3">
            <div className="w-full h-[1.5px] bg-white/10 relative overflow-hidden rounded-full">
              <motion.div
                className="absolute top-0 left-0 bottom-0 bg-[#C4823F]"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
            <div className="w-full flex justify-between text-[9px] tracking-[0.2em] uppercase text-white/40 font-mono">
              <span>Entering Boutique</span>
              <span className="text-[#C4823F] font-bold">{progress}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
