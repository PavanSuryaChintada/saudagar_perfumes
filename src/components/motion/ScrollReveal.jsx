import React from 'react';
import { motion } from 'framer-motion';

export function ScrollReveal({
  children,
  variant = 'fade-up', // 'fade-up' | 'fade-in' | 'stagger' | 'mask'
  delay = 0,
  duration = 0.7,
  yOffset = 24,
  className = '',
  threshold = 0.15
}) {
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    'fade-up': {
      hidden: { opacity: 0, y: yOffset },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1] // Luxury deceleration
        }
      }
    },
    'fade-in': {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration,
          delay,
          ease: 'easeOut'
        }
      }
    },
    'mask': {
      hidden: { opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' },
      visible: {
        opacity: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        transition: {
          duration: duration + 0.2,
          delay,
          ease: [0.76, 0, 0.24, 1]
        }
      }
    },
    'scale-up': {
      hidden: { opacity: 0, scale: 0.96 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1]
        }
      }
    }
  };

  const selectedVariant = variants[variant] || variants['fade-up'];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      variants={selectedVariant}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, staggerDelay = 0.08, className = '' }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.05
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '', yOffset = 20 }) {
  const itemVariants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
