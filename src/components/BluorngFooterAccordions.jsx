import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POPULAR_SEARCHES_TABS } from '../data/bluorngSaudagarData.js';
import ScrollReveal from './motion/ScrollReveal.jsx';

export default function BluorngFooterAccordions({ onSelectSearchTerm }) {
  const [isReadMoreOpen, setIsReadMoreOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('category'); // 'category' | 'style' | 'color'

  return (
    <section className="relative w-full bg-[#FFFFFF] dark:bg-[#0B0A0D] py-14 sm:py-20 text-[#111111] dark:text-white overflow-hidden transition-colors duration-300">
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <ScrollReveal variant="fade-up" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ================= LEFT: EXPANDABLE BRAND ACCORDION (7 COLS) ================= */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#888888] dark:text-[#A09D96] font-medium block mb-1">
              House Manifesto · Heritage
            </span>

            <h2 className="text-[18px] sm:text-[22px] font-normal uppercase tracking-[0.02em] text-[#111111] dark:text-white leading-snug">
              Experience Artisanal Haute Parfumerie with SAUDAGAR
            </h2>

            {/* Teaser content */}
            <div className="mt-4 text-[13px] text-[#555555] dark:text-[#B3AFA8] leading-relaxed space-y-3 font-normal">
              <p>
                In an era dominated by mass synthetic perfumery, <strong className="text-[#111111] dark:text-white">SAUDAGAR</strong> resurrects the ancient lineage of the royal master perfumers. From wild 40-year-old agarwood forests in Assam and Koh Kong to high-altitude dawn harvests of Taif damask rose, our creations celebrate unadulterated botanical grandeur.
              </p>
              
              {/* Collapsible deeper content with Luxury Height Animation */}
              <AnimatePresence>
                {isReadMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden space-y-4 pt-4 text-[12.5px] text-[#555555] dark:text-[#B3AFA8]"
                  >
                    <div>
                      <h3 className="text-[13px] font-medium uppercase tracking-wide text-[#111111] dark:text-white">
                        What Defines Gender-Neutral Haute Parfumerie?
                      </h3>
                      <p className="mt-1">
                        Pure aromatics know no gender. Scent is an intimate aura of personal presence and spiritual resonance. Whether indulging in dark volcanic smoke with <em>003 Obsidian Root</em> or sunlit Mediterranean citrus in <em>Pacific Coast</em>, our artisanal extraits are conceived for connoisseurs who demand longevity and singular character.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-[13px] font-medium uppercase tracking-wide text-[#111111] dark:text-white">
                        Why Saudagar Stands Unrivaled in Modern Perfumery
                      </h3>
                      <p className="mt-1">
                        Each Saudagar creation boasts an extravagant oil concentration ranging between 30% and 46% (Extrait de Parfum), compounded in small batches and aged for twelve months in dark temperature-regulated cellars before being poured into sculptural, heavy-weight crystal flacons.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-[13px] font-medium uppercase tracking-wide text-[#111111] dark:text-white">
                        Frequently Asked Questions (FAQs)
                      </h3>
                      <div className="space-y-2 mt-2">
                        <p>
                          <strong className="text-[#111111] dark:text-white">How long does an Extrait de Parfum last on skin?</strong><br />
                          Due to our 35%+ pure botanical oil formulation, Saudagar extraits exhibit remarkable longevity, projecting with sillage for 14 to 24+ hours on skin and multiple days on textiles.
                        </p>
                        <p>
                          <strong className="text-[#111111] dark:text-white">Are your products unisex?</strong><br />
                          Every Saudagar perfume is created to be genderless, adapting to the unique chemistry and warmth of the wearer’s pulse points.
                        </p>
                        <p>
                          <strong className="text-[#111111] dark:text-white">Can I experience fragrances before buying full bottles?</strong><br />
                          Yes. Our <em>Masterpiece Discovery Coffret</em> contains six 10ml travel flacons, accompanied by a redemption voucher for a full 100ml flacon.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Read More / Read Less Toggle Button */}
            <div className="mt-4">
              <button
                onClick={() => setIsReadMoreOpen(!isReadMoreOpen)}
                className="text-[11.5px] font-normal tracking-[0.08em] uppercase text-[#111111] dark:text-[#EFECE6] hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isReadMoreOpen ? 'Read less' : 'Read more about Saudagar...'}</span>
                <span>{isReadMoreOpen ? '↑' : '↓'}</span>
              </button>
            </div>
          </div>

          {/* ================= RIGHT: TABBED POPULAR SEARCHES (5 COLS) ================= */}
          <div className="lg:col-span-5 bg-[#F8F7F4] dark:bg-[#141318] p-6 sm:p-7 rounded-xl transition-colors duration-300">
            <h3 className="text-[12.5px] font-medium tracking-[0.06em] uppercase text-[#111111] dark:text-white mb-3">
              Popular Searches & Notes
            </h3>

            {/* Tab navigation pills (Category, Style, Color/Note) */}
            <div className="flex items-center gap-3 pb-2 mb-4">
              <button
                onClick={() => setActiveTab('category')}
                className={`text-[11px] font-normal tracking-wider uppercase pb-1 transition-colors relative cursor-pointer ${
                  activeTab === 'category'
                    ? 'text-[#111111] dark:text-white'
                    : 'text-[#888888] dark:text-[#A09D96] hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                By category
                {activeTab === 'category' && (
                  <motion.span layoutId="tab-underline-footer" className="absolute bottom-[-2px] left-0 right-0 h-[1.5px] bg-[#C4823F]" />
                )}
              </button>

              <span className="text-[#CCCCCC] dark:text-white/20">/</span>

              <button
                onClick={() => setActiveTab('style')}
                className={`text-[11px] font-normal tracking-wider uppercase pb-1 transition-colors relative cursor-pointer ${
                  activeTab === 'style'
                    ? 'text-[#111111] dark:text-white'
                    : 'text-[#888888] dark:text-[#A09D96] hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                By family
                {activeTab === 'style' && (
                  <motion.span layoutId="tab-underline-footer" className="absolute bottom-[-2px] left-0 right-0 h-[1.5px] bg-[#C4823F]" />
                )}
              </button>

              <span className="text-[#CCCCCC] dark:text-white/20">/</span>

              <button
                onClick={() => setActiveTab('color')}
                className={`text-[11px] font-normal tracking-wider uppercase pb-1 transition-colors relative cursor-pointer ${
                  activeTab === 'color'
                    ? 'text-[#111111] dark:text-white'
                    : 'text-[#888888] dark:text-[#A09D96] hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                By flacon
                {activeTab === 'color' && (
                  <motion.span layoutId="tab-underline-footer" className="absolute bottom-[-2px] left-0 right-0 h-[1.5px] bg-[#C4823F]" />
                )}
              </button>
            </div>

            {/* Tab Links Grid with Staggered Fade */}
            <AnimatePresence mode="wait">
              <motion.ul
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px]"
              >
                {POPULAR_SEARCHES_TABS[activeTab].map((item, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => onSelectSearchTerm(item.query)}
                      className="text-left text-[#555555] dark:text-[#B3AFA8] hover:text-[#C4823F] dark:hover:text-[#ECC86A] hover:translate-x-1 transition-all flex items-center gap-1.5 py-0.5 cursor-pointer duration-200"
                    >
                      <span className="text-[#C4823F] font-normal text-[10px]">›</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>

        </ScrollReveal>
      </div>
    </section>
  );
}
