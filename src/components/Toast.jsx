import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-8 left-1/2 z-50 bg-[#121218] border border-gold text-ivory text-xs tracking-[0.14em] uppercase px-6 py-3 shadow-2xl pointer-events-none text-center"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
