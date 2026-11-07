import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import ScrollReveal from './motion/ScrollReveal.jsx';
import { sanitizeHtml, hasText } from '../lib/richText';

/** Section "seo_accordion": brand story text (with read-more) and popular-search tabs, all edited in the CMS. */
export default function BluorngFooterAccordions({ config = {} }) {
  const navigate = useNavigate();
  const [isReadMoreOpen, setIsReadMoreOpen] = useState(false);
  const tabs = (config.search_tabs || []).filter((t) => t && t.label);
  const [activeTab, setActiveTab] = useState(0);
  const current = tabs[Math.min(activeTab, Math.max(0, tabs.length - 1))];
  const search = (query) => {
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    window.scrollTo(0, 0);
  };

  return (
    <section className="relative w-full bg-[#FFFFFF] dark:bg-tk-night py-14 sm:py-20 text-tk-ink dark:text-white overflow-hidden transition-colors duration-300">
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <ScrollReveal variant="fade-up" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ================= LEFT: EXPANDABLE BRAND ACCORDION (7 COLS) ================= */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            {config.eyebrow && (
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#888888] dark:text-[#A09D96] font-medium block mb-1">
                {config.eyebrow}
              </span>
            )}
            {config.heading && (
              <h2 className="text-[18px] sm:text-[22px] font-normal uppercase tracking-[0.02em] text-tk-ink dark:text-white leading-snug">
                {config.heading}
              </h2>
            )}

            <div className="mt-4 text-[13px] text-[#555555] dark:text-[#B3AFA8] leading-relaxed space-y-3 font-normal [&_strong]:text-tk-ink dark:[&_strong]:text-white [&_h3]:text-[13px] [&_h3]:font-medium [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-tk-ink dark:[&_h3]:text-white [&_p]:mt-1">
              {hasText(config.intro) && <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(config.intro) }} />}

              <AnimatePresence>
                {isReadMoreOpen && hasText(config.more) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden space-y-4 pt-4 text-[12.5px] text-[#555555] dark:text-[#B3AFA8]"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(config.more) }}
                  />
                )}
              </AnimatePresence>
            </div>

            {hasText(config.more) && (
              <div className="mt-4">
                <button
                  onClick={() => setIsReadMoreOpen(!isReadMoreOpen)}
                  className="text-[11.5px] font-normal tracking-[0.08em] uppercase text-tk-ink dark:text-[#EFECE6] hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isReadMoreOpen ? config.read_less_label : config.read_more_label}</span>
                  <span>{isReadMoreOpen ? '↑' : '↓'}</span>
                </button>
              </div>
            )}
          </div>

          {/* ================= RIGHT: TABBED POPULAR SEARCHES (5 COLS) ================= */}
          {tabs.length > 0 && (
            <div className="lg:col-span-5 bg-[#F8F7F4] dark:bg-[#141318] p-6 sm:p-7 rounded-xl transition-colors duration-300">
              {config.searches_heading && (
                <h3 className="text-[12.5px] font-medium tracking-[0.06em] uppercase text-tk-ink dark:text-white mb-3">{config.searches_heading}</h3>
              )}

              <div className="flex flex-wrap items-center gap-3 pb-2 mb-4">
                {tabs.map((tab, i) => (
                  <React.Fragment key={`${tab.label}-${i}`}>
                    {i > 0 && <span className="text-[#CCCCCC] dark:text-white/20">/</span>}
                    <button
                      onClick={() => setActiveTab(i)}
                      className={`text-[11px] font-normal tracking-wider uppercase pb-1 transition-colors relative cursor-pointer ${
                        activeTab === i ? 'text-tk-ink dark:text-white' : 'text-[#888888] dark:text-[#A09D96] hover:text-tk-ink dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                      {activeTab === i && (
                        <motion.span layoutId="tab-underline-footer" className="absolute bottom-[-2px] left-0 right-0 h-[1.5px] bg-tk-accent dark:bg-tk-gold" />
                      )}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.ul
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px]"
                >
                  {(current?.terms || []).map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => search(item.query || item.label)}
                        className="text-left text-[#555555] dark:text-[#B3AFA8] hover:text-tk-accent dark:hover:text-tk-accent-night hover:translate-x-1 transition-all flex items-center gap-1.5 py-0.5 cursor-pointer duration-200"
                      >
                        <span className="text-tk-accent dark:text-tk-accent-night font-normal text-[10px]">›</span>
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
}
