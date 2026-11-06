import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function LuxuryPreloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isDone, setIsDone] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        // Never block direct visits to product or other interior routes
        if (window.location.pathname !== '/' && window.location.pathname !== '') {
          return true;
        }
        if (sessionStorage.getItem('saudagar_preloader_done') === 'true' || localStorage.getItem('saudagar_preloader_done') === 'true') {
          return true;
        }
      }
    } catch (e) {}
    return false;
  });
  const hasFinishedRef = useRef(isDone);

  // Smooth numerical progression from 0 to 100 over ~1.4 seconds
  useEffect(() => {
    if (isDone) {
      if (onComplete) onComplete();
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Snappy failsafe: preloader will unconditionally unmount after 650ms max
    const hardTimeout = setTimeout(() => {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        setIsOpening(true);
        document.body.style.overflow = originalOverflow;
        try {
          sessionStorage.setItem('saudagar_preloader_done', 'true');
          localStorage.setItem('saudagar_preloader_done', 'true');
        } catch (e) {}
        setTimeout(() => {
          setIsDone(true);
          if (onComplete) onComplete();
        }, 200);
      }
    }, 650);

    const startTime = performance.now();
    const duration = 500; // ms to reach 100%

    let animationFrameId;

    const updateProgress = (currentTime) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);

      // Snappy luxury ease-out
      const eased = 1 - Math.pow(1 - rawProgress, 2.2);
      const currentVal = Math.round(eased * 100);
      setProgress(currentVal);

      if (rawProgress < 1) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => {
          if (!hasFinishedRef.current) {
            setIsOpening(true);
            document.body.style.overflow = originalOverflow;
          }
        }, 50);

        setTimeout(() => {
          if (!hasFinishedRef.current) {
            hasFinishedRef.current = true;
            setIsDone(true);
            document.body.style.overflow = originalOverflow;
            try {
              sessionStorage.setItem('saudagar_preloader_done', 'true');
              localStorage.setItem('saudagar_preloader_done', 'true');
            } catch (e) {}
            if (onComplete) onComplete();
          }
        }, 280);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(hardTimeout);
      document.body.style.overflow = originalOverflow;
    };
  }, [isDone, onComplete]);

  // Click / tap to fast-forward into the boutique
  const handleQuickSkip = () => {
    if (isOpening || isDone) return;
    setIsOpening(true);
    document.body.style.overflow = '';
    try { sessionStorage.setItem('saudagar_preloader_done', 'true'); } catch (e) {}
    setTimeout(() => {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        setIsDone(true);
        if (onComplete) onComplete();
      }
    }, 350);
  };

  if (isDone) return null;

  // Cinematic fluid quartic bezier for architectural shutter opening
  const revealEase = [0.76, 0, 0.24, 1];

  return (
    <div
      onClick={handleQuickSkip}
      className={`fixed inset-0 z-[9999] select-none overflow-hidden ${
        isOpening ? 'pointer-events-none' : 'cursor-pointer'
      }`}
      title="Tap anywhere to enter"
    >
      {/* ================= TOP OBSIDIAN SHUTTER PANEL WITH GOLD DEPTH ================= */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{ y: isOpening ? '-101%' : '0%' }}
        transition={{ duration: 0.85, ease: revealEase }}
        className="absolute top-0 left-0 right-0 h-1/2 z-20 bg-[#070608] border-b border-[#D4AF37]/35 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.18)_0%,transparent_75%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.85),transparent)] pointer-events-none" />
      </motion.div>

      {/* ================= BOTTOM OBSIDIAN SHUTTER PANEL WITH GOLD DEPTH ================= */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{ y: isOpening ? '101%' : '0%' }}
        transition={{ duration: 0.85, ease: revealEase }}
        className="absolute bottom-0 left-0 right-0 h-1/2 z-20 bg-[#070608] border-t border-[#D4AF37]/35 shadow-[0_-25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.18)_0%,transparent_75%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.85),transparent)] pointer-events-none" />
      </motion.div>

      {/* ================= HORIZONTAL GOLD HAIRLINE SEAM ================= */}
      <motion.div
        initial={{ opacity: 0.85, scaleX: 1 }}
        animate={{
          opacity: isOpening ? 0 : 0.85,
          scaleX: isOpening ? 1.3 : 1,
        }}
        transition={{ duration: 0.35 }}
        className="absolute top-1/2 left-0 right-0 h-[1.5px] -translate-y-1/2 z-30 pointer-events-none bg-gradient-to-r from-transparent via-[#ECC86A] to-transparent shadow-[0_0_14px_rgba(212,175,55,0.8)]"
      />

      {/* ================= CENTER LOGO HERO PRESENTATION ================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{
          opacity: isOpening ? 0 : 1,
          scale: isOpening ? 1.05 : 1,
          y: isOpening ? -14 : 0,
        }}
        transition={{
          duration: isOpening ? 0.55 : 0.8,
          ease: revealEase,
        }}
        className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none px-6"
      >
        {/* Soft Ambient Royal Gold Bloom */}
        <div className="absolute w-[400px] sm:w-[580px] h-[400px] sm:h-[580px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.20)_0%,transparent_75%)] blur-2xl pointer-events-none" />

        {/* Floating Amber Motes (Incense & Distillation Essence) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { top: '34%', left: '26%', delay: 0, size: 2.5 },
            { top: '62%', left: '74%', delay: 0.35, size: 3 },
            { top: '40%', left: '70%', delay: 0.2, size: 2 },
            { top: '66%', left: '30%', delay: 0.55, size: 2 },
            { top: '28%', left: '50%', delay: 0.75, size: 3 },
          ].map((mote, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{
                opacity: [0, 0.75, 0.25, 0.85, 0],
                y: [-10, -50],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: mote.delay,
                ease: 'easeInOut',
              }}
              style={{
                top: mote.top,
                left: mote.left,
                width: mote.size,
                height: mote.size,
              }}
              className="absolute rounded-full bg-[#ECC86A] shadow-[0_0_10px_#ECC86A]"
            />
          ))}
        </div>

        {/* SAUDAGAR TYPOGRAPHIC LOGO WITH METALLIC LIGHT SWEEP */}
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.1, ease: revealEase }}
          className="relative w-80 sm:w-[420px] md:w-[500px] max-w-[90vw] flex items-center justify-center p-2 mb-1"
        >
          {/* Clean Caption-Free Master Gold Logo */}
          <img
            src="/images/saudagar_logo_gold.png"
            alt="Saudagar Perfumers"
            className="w-full h-auto object-contain filter drop-shadow-[0_10px_35px_rgba(212,175,55,0.55)]"
          />

          {/* Liquid Gold Shimmer Beam */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-sm">
            <motion.div
              initial={{ x: '-140%', opacity: 0 }}
              animate={{
                x: ['-140%', '160%'],
                opacity: [0, 0.85, 0.85, 0],
              }}
              transition={{
                duration: 1.45,
                delay: 0.4,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-24deg] mix-blend-overlay"
            />
          </div>
        </motion.div>

        {/* 3. SYMMETRICAL GOLD HAIRLINE ACCENT & ATELIER SIGNATURE */}
        <div className="flex items-center justify-center gap-3 w-full max-w-[280px] sm:max-w-[360px] mt-4 mb-3">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: revealEase }}
            className="flex-1 h-[1px] origin-right bg-gradient-to-l from-[#ECC86A] to-transparent shadow-[0_0_8px_rgba(212,175,55,0.6)]"
          />
          <motion.span
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 45 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-1.5 h-1.5 bg-[#ECC86A] shadow-[0_0_8px_#ECC86A]"
          />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: revealEase }}
            className="flex-1 h-[1px] origin-left bg-gradient-to-r from-[#ECC86A] to-transparent shadow-[0_0_8px_rgba(212,175,55,0.6)]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.4, ease: revealEase }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.36em] text-[#ECC86A]/90 font-light">
            Haute Parfumerie · Dubai · Paris
          </span>
          <span className="text-[8px] sm:text-[8.5px] uppercase tracking-[0.26em] text-white/40 font-extralight">
            Artisanal Niche Extraits
          </span>
        </motion.div>

        {/* 4. LUXURY MINIMAL NUMERICAL PROGRESS TRACKER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-7 sm:mt-8 flex flex-col items-center gap-2"
        >
          {/* 1.5px Gold Fill Track */}
          <div className="w-32 sm:w-40 h-[1.5px] bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-[#C4823F] via-[#ECC86A] to-[#FFF2B0] shadow-[0_0_10px_rgba(236,200,106,0.9)]"
            />
          </div>

          {/* Clean Monospace Progress Readout */}
          <div className="font-mono text-[10px] tracking-[0.24em] text-[#ECC86A]/80 flex items-center gap-1">
            <span className="text-white/25 text-[9px]">[</span>
            <span>{progress.toString().padStart(2, '0')}%</span>
            <span className="text-white/25 text-[9px]">]</span>
          </div>
        </motion.div>

        {/* Subtle, Polite Skip Prompt */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="absolute bottom-6 text-[8.5px] uppercase tracking-[0.24em] text-white/40 font-light"
        >
          Tap anywhere to enter
        </motion.span>
      </motion.div>
    </div>
  );
}