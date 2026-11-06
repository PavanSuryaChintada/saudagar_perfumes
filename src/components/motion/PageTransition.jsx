import React from 'react';
import { motion } from 'framer-motion';

/**
 * Ultra-fast luxury page transition.
 * Mounts immediately with zero exit blocking or layout thrashing.
 */
export default function PageTransition({ routeKey, children }) {
  return (
    <div className="relative w-full">
      <motion.div
        key={routeKey}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
