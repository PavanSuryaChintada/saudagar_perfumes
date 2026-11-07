import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function LuxuryPreloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const hasFinishedRef = useRef(false);

  // Clear legacy blocking flags from previous buggy versions so it never gets permanently blocked
  useEffect(() => {
    try {
      localStorage.removeItem('saudagar_preloader_done');
      sessionStorage.removeItem('saudagar_preloader_done');
    } catch (e) {}
  }, []);

  // Quick skip on click or keyboard press (Space, Enter, Escape)
  const handleQuickSkip = () => {
    if (isOpening || hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsOpening(true);
    document.body.style.overflow = '';
    setTimeout(() => {
      setIsDone(true);
      if (onComplete) onComplete();
    }, 980);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleQuickSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpening]);

  // Smooth numerical progression from 0 to 100 over ~1.0s
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    let startTime = null;
    const duration = 1000; // ms to reach 100% (snappy, prestigious luxury tempo)

    let animationFrameId;

    const updateProgress = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const rawProgress = Math.max(0, Math.min(elapsed / duration, 1));

      // Silky luxury cubic ease-out
      const eased = 1 - Math.pow(1 - rawProgress, 2.2);
      const currentVal = Math.max(0, Math.min(100, Math.round(eased * 100)));
      setProgress(currentVal);

      if (rawProgress < 1) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        setProgress(100);
        setTimeout(() => {
          if (!hasFinishedRef.current) {
            setIsOpening(true);
            document.body.style.overflow = '';
          }
        }, 120);

        setTimeout(() => {
          if (!hasFinishedRef.current) {
            hasFinishedRef.current = true;
            setIsDone(true);
            document.body.style.overflow = '';
            if (onComplete) onComplete();
          }
        }, 1100);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    // Failsafe timeout: in case anything throttles, gracefully reveal after 2.8s max
    const hardTimeout = setTimeout(() => {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        setIsOpening(true);
        document.body.style.overflow = '';
        setTimeout(() => {
          setIsDone(true);
          if (onComplete) onComplete();
        }, 450);
      }
    }, 2800);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(hardTimeout);
      document.body.style.overflow = '';
    };
  }, [onComplete]);

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
      {/* ================= TOP OBSIDIAN SHUTTER PANEL ================= */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{
          y: isOpening ? '-101%' : '0%',
          boxShadow: isOpening ? '0 30px 70px rgba(0,0,0,0.98)' : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.75, delay: isOpening ? 0.22 : 0, ease: revealEase }}
        className="absolute top-0 left-0 right-0 h-1/2 z-20 bg-[#070608] overflow-hidden"
      />

      {/* ================= BOTTOM OBSIDIAN SHUTTER PANEL ================= */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{
          y: isOpening ? '101%' : '0%',
          boxShadow: isOpening ? '0 -30px 70px rgba(0,0,0,0.98)' : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.75, delay: isOpening ? 0.22 : 0, ease: revealEase }}
        className="absolute bottom-0 left-0 right-0 h-1/2 z-20 bg-[#070608] overflow-hidden"
      />

      {/* ================= CENTER LOGO HERO PRESENTATION ================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isOpening ? 0 : 1,
          scale: isOpening ? 1.03 : 1,
          y: isOpening ? -10 : 0,
          filter: isOpening ? 'blur(6px)' : 'blur(0px)',
        }}
        transition={{
          duration: isOpening ? 0.22 : 0.35,
          ease: isOpening ? 'easeIn' : 'easeOut',
        }}
        className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none px-6"
      >
        {/* Soft Ambient Royal Gold Bloom (Feathered radial halo for natural immersion) */}
        <div className="absolute w-[500px] sm:w-[680px] h-[360px] sm:h-[460px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.20)_0%,rgba(196,130,63,0.08)_40%,transparent_72%)] blur-3xl pointer-events-none" />

        {/* Floating Amber Motes (Incense & Distillation Essence) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { top: '34%', left: '26%', delay: 0, size: 2.5 },
            { top: '62%', left: '74%', delay: 0.2, size: 3 },
            { top: '40%', left: '70%', delay: 0.1, size: 2 },
            { top: '66%', left: '30%', delay: 0.35, size: 2 },
            { top: '28%', left: '50%', delay: 0.5, size: 3 },
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
              className="absolute rounded-full bg-tk-accent-night shadow-[0_0_10px_rgb(var(--c-accent-night))]"
            />
          ))}
        </div>

        {/* SAUDAGAR TYPOGRAPHIC MASTER LOGO (SEAMLESS ORGANIC GOLD RADIANCE) */}
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative w-80 sm:w-[420px] md:w-[490px] max-w-[90vw] flex items-center justify-center p-0 mb-1"
        >
          {/* Luminous Gold Master Logo with Breathing Gold Radiance - Zero Boxes, Zero Rectangular Crops */}
          <motion.img
            src="/images/saudagar_logo_gold.png"
            alt="Saudagar Perfumers"
            animate={{
              filter: [
                'drop-shadow(0 0 16px rgba(212,175,55,0.45)) drop-shadow(0 4px 18px rgba(0,0,0,0.85))',
                'drop-shadow(0 0 32px rgba(236,200,106,0.75)) drop-shadow(0 0 55px rgba(212,175,55,0.35)) drop-shadow(0 4px 18px rgba(0,0,0,0.85))',
                'drop-shadow(0 0 16px rgba(212,175,55,0.45)) drop-shadow(0 4px 18px rgba(0,0,0,0.85))',
              ],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-auto object-contain select-none pointer-events-none"
          />
        </motion.div>

        {/* 3. SYMMETRICAL GOLD HAIRLINE ACCENT & ATELIER SIGNATURE */}
        <div className="flex items-center justify-center gap-3 w-full max-w-[280px] sm:max-w-[360px] mt-4 mb-3">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="flex-1 h-[1px] origin-right bg-gradient-to-l from-tk-accent-night to-transparent shadow-[0_0_8px_rgba(212,175,55,0.6)]"
          />
          <motion.span
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 45 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="w-1.5 h-1.5 bg-tk-accent-night shadow-[0_0_8px_rgb(var(--c-accent-night))]"
          />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="flex-1 h-[1px] origin-left bg-gradient-to-r from-tk-accent-night to-transparent shadow-[0_0_8px_rgba(212,175,55,0.6)]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.36em] text-tk-accent-night/90 font-light">
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
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-7 sm:mt-8 flex flex-col items-center gap-2"
        >
          {/* 1.5px Gold Fill Track */}
          <div className="w-32 sm:w-40 h-[1.5px] bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-tk-accent via-tk-accent-night to-[#FFF2B0] shadow-[0_0_10px_rgba(236,200,106,0.9)]"
            />
          </div>

          {/* Clean Monospace Progress Readout */}
          <div className="font-mono text-[10px] tracking-[0.24em] text-tk-accent-night/80 flex items-center gap-1">
            <span className="text-white/25 text-[9px]">[</span>
            <span>{progress.toString().padStart(2, '0')}%</span>
            <span className="text-white/25 text-[9px]">]</span>
          </div>
        </motion.div>

        {/* Subtle, Polite Skip Prompt */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="absolute bottom-6 text-[8.5px] uppercase tracking-[0.24em] text-white/40 font-light"
        >
          Tap anywhere to enter
        </motion.span>
      </motion.div>
    </div>
  );
}