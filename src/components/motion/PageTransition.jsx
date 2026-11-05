import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageTransition({ routeKey, children }) {
  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={routeKey}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: {
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1] // Haute luxury deceleration curve
            }
          }}
          exit={{
            opacity: 0,
            transition: {
              duration: 0.25,
              ease: [0.76, 0, 0.24, 1]
            }
          }}
          className="w-full"
        >
          {/* Subtle Luxury Silk Curtain Reveal Bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{
              scaleX: 0,
              transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] }
            }}
            exit={{
              scaleX: 1,
              transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] }
            }}
            style={{ originX: 0 }}
            className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#C4823F] via-[#ECC86A] to-[#C4823F] z-[999] pointer-events-none shadow-[0_0_12px_rgba(196,130,63,0.5)]"
          />

          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
