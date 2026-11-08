import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTestimonials } from '../cms/useContent';

const AUTOPLAY_MS = 7000;

function Stars({ count }) {
  return (
    <div className="flex items-center justify-center gap-1 text-tk-accent-ink dark:text-tk-accent-night" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i < count ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/** Section "testimonials": quotes come from Admin → Testimonials (only active ones show). */
export default function BluorngTestimonials() {
  const { data = [] } = useTestimonials();
  const items = data.map((t) => ({ id: t.id, quote: t.quote, name: t.name, location: t.location, product: t.product_name, rating: t.rating }));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;
  const current = items[index];

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, count]);

  if (!count) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-[#F7F5F1] dark:bg-[#0E0C10] py-20 sm:py-28 px-6 transition-colors duration-300"
      aria-label="Customer testimonials"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-[880px] mx-auto text-center">
        <span className="block text-[12px] uppercase tracking-[0.22em] font-medium text-tk-accent-ink dark:text-tk-accent-night mb-8">
          Words from the Atelier
        </span>

        <div className="relative min-h-[260px] sm:min-h-[220px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.figure
              key={current.id}
              initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] } }}
              className="w-full"
            >
              {current.rating ? <Stars count={current.rating} /> : null}

              <blockquote className="mt-6 font-serif italic text-[22px] sm:text-[30px] leading-[1.35] text-tk-ink dark:text-white">
                &ldquo;{current.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-8 flex flex-col items-center gap-1">
                <span className="text-[12.5px] uppercase tracking-[0.16em] font-semibold text-tk-ink dark:text-white">
                  {current.name}
                </span>
                <span className="text-[12px] uppercase tracking-[0.12em] text-[#666666] dark:text-[#A09D96]">
                  {current.location}
                  {current.product ? ` · ${current.product}` : ''}
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {count > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show testimonial ${i + 1}`}
                aria-current={i === index}
                className={`h-[3px] rounded-full transition-all duration-500 cursor-pointer ${
                  i === index
                    ? 'w-8 bg-tk-accent dark:bg-tk-accent-night'
                    : 'w-3 bg-tk-ink/20 dark:bg-white/25 hover:bg-tk-ink/40 dark:hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
