import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageTransition({ routeKey, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1] // Luxury ease deceleration
          }
        }}
        exit={{
          opacity: 0,
          y: -8,
          transition: {
            duration: 0.28,
            ease: 'easeIn'
          }
        }}
        className="w-full will-change-[opacity,transform]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
