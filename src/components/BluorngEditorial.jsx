import React from 'react';
import { motion } from 'framer-motion';

// Editorial story section: typography-led statement + bento grid + collection entry points.
// Copy reuses facts already stated on the site (Assam & Grasse sourcing, 40-year Cambodi oud,
// hand-cut monogrammed flacons, bespoke atelier) so no new claims are introduced.

const EASE = [0.16, 1, 0.3, 1];

const reveal = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE, delay: i * 0.08 }
  })
};

const COLLECTION_ENTRIES = [
  { slug: 'signature', title: 'Signature', note: 'Warm champagne & amber', image: '/images/saudagar_amber_gold.png' },
  { slug: 'royal', title: 'Royal', note: 'Taif rose & royal oud', image: '/images/saudagar_imperial_ruby.png' },
  { slug: 'exotic', title: 'Exotic', note: 'Nocturnal forest & obsidian', image: '/images/saudagar_noir_matte.png' }
];

export default function BluorngEditorial({ onNavigateCollection }) {
  return (
    <section className="relative w-full bg-white dark:bg-tk-night text-tk-ink dark:text-white px-6 sm:px-10 lg:px-16 py-24 sm:py-32 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto">

        {/* ============ 1. TYPOGRAPHIC STATEMENT ============ */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end"
        >
          <span className="lg:col-span-3 text-[10.5px] uppercase tracking-[0.22em] font-medium text-tk-accent dark:text-tk-accent-night">
            The House of Saudagar
          </span>

          <h2 className="lg:col-span-9 font-serif text-[40px] sm:text-[64px] lg:text-[84px] leading-[0.98] tracking-[-0.01em]">
            Fragrance is <em className="italic">patience</em>, poured one flacon at a time.
          </h2>
        </motion.div>

        <motion.p
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          custom={1}
          className="mt-10 lg:ml-[25%] max-w-[560px] text-[15px] sm:text-[17px] leading-relaxed text-[#666666] dark:text-[#A09D96]"
        >
          We source our oils from the places that shape them: Assam at dawn, Grasse in the early harvest, and
          forty-year wild Cambodi oud. Each bottle is hand-cut, monogrammed and blended for the person who will wear it.
        </motion.p>

        {/* ============ 2. BENTO GRID ============ */}
        <div className="mt-20 sm:mt-28 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-3 sm:gap-4 auto-rows-[minmax(220px,auto)] lg:auto-rows-[260px]">

          {/* Large image tile: the atelier */}
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            custom={0}
            className="group relative md:col-span-6 lg:col-span-7 lg:row-span-2 overflow-hidden rounded-sm bg-[#F3F1EC] dark:bg-[#141318] min-h-[360px]"
          >
            <img
              src="/images/bespoke_atelier.jpg"
              alt="Saudagar bespoke atelier"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8">
              <span className="block text-[10px] uppercase tracking-[0.22em] text-white/75">Made to order</span>
              <h3 className="mt-2 font-serif italic text-[28px] sm:text-[38px] leading-tight text-white">
                The Saudagar Atelier
              </h3>
            </div>
          </motion.div>

          {/* Typographic tile: the oud */}
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            custom={1}
            className="md:col-span-3 lg:col-span-5 flex flex-col justify-between rounded-sm bg-tk-ink dark:bg-[#17151B] text-white p-7 sm:p-9"
          >
            <span className="text-[10px] uppercase tracking-[0.22em] text-tk-accent-night">The heart</span>
            <div>
              <p className="font-serif text-[52px] sm:text-[72px] leading-none">40</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/60">Years of wild Cambodi oud</p>
            </div>
          </motion.div>

          {/* Sourcing tile */}
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            custom={2}
            className="md:col-span-3 lg:col-span-5 relative overflow-hidden rounded-sm bg-[#F7F5F1] dark:bg-[#141318] p-7 sm:p-9 flex items-end"
          >
            <div className="absolute right-[-8%] top-[-6%] w-[62%] aspect-square">
              <img
                src="/images/saudagar_amber_gold.png"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="w-full h-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.25)]"
              />
            </div>
            <div className="relative">
              <span className="block text-[10px] uppercase tracking-[0.22em] text-tk-accent dark:text-tk-accent-night">Sourced at dawn</span>
              <p className="mt-2 font-serif italic text-[24px] sm:text-[30px] leading-tight">Assam & Grasse</p>
            </div>
          </motion.div>

          {/* Craft tile: hand-cut flacons */}
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            custom={3}
            className="md:col-span-6 lg:col-span-5 relative overflow-hidden rounded-sm bg-[#EDE8DF] dark:bg-[#1A1820] p-7 sm:p-9 min-h-[220px] flex flex-col justify-between"
          >
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#666666] dark:text-[#A09D96]">The craft</span>
            <p className="font-serif text-[24px] sm:text-[32px] leading-[1.15] max-w-[420px]">
              Every flacon is <em className="italic">hand-cut</em> and monogrammed before it leaves the atelier.
            </p>
          </motion.div>
        </div>

        {/* ============ 3. COLLECTION ENTRY POINTS ============ */}
        <div className="mt-20 sm:mt-28">
          <div className="flex items-end justify-between gap-6 border-b border-black/10 dark:border-white/10 pb-5">
            <h3 className="font-serif italic text-[30px] sm:text-[44px] leading-none">Choose your world</h3>
            <button
              type="button"
              onClick={() => onNavigateCollection('all')}
              className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] font-medium hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {COLLECTION_ENTRIES.map((entry, i) => (
              <motion.button
                key={entry.slug}
                type="button"
                onClick={() => onNavigateCollection(entry.slug)}
                variants={reveal}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                custom={i}
                className="group relative text-left overflow-hidden rounded-sm bg-[#F7F5F1] dark:bg-[#141318] aspect-[4/5] cursor-pointer"
              >
                <img
                  src={entry.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-x-[12%] top-[10%] w-[76%] h-[62%] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.06] group-hover:-translate-y-1"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7 flex items-end justify-between">
                  <div>
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-[#888888] dark:text-[#A09D96]">{entry.note}</span>
                    <span className="mt-1 block font-serif text-[26px] sm:text-[30px] leading-none">{entry.title}</span>
                  </div>
                  <span className="text-[18px] transition-transform duration-500 group-hover:translate-x-1">→</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
