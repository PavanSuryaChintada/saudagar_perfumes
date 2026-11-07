import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BluorngFilterSidebar({
  sections = [],
  activeFilters = {},
  filterCounts = {},
  onToggleFilter,
  onClearFilters,
  totalMatching = 0,
  isMobileDrawer = false,
  onCloseMobileDrawer
}) {
  // Accordion state: by default, intensity, notes, and occasion are open
  const [openSections, setOpenSections] = useState({
    intensity: true,
    families: true,
    occasion: true
  });

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Calculate total number of active filters
  const activeFilterCount = Object.values(activeFilters).reduce(
    (acc, val) => acc + (Array.isArray(val) ? val.length : 0),
    0
  );

  return (
    <div className={`flex flex-col select-none ${isMobileDrawer ? 'h-full bg-white dark:bg-[#0B0A0D]' : 'w-full'}`}>
      
      {/* ================= SIDEBAR HEADER ================= */}
      <div className={`flex items-center justify-between pb-4 border-b border-[#EAEAEA] dark:border-white/10 ${isMobileDrawer ? 'p-5' : 'mb-3'}`}>
        <div className="flex items-center gap-2.5">
          <span className="font-sans font-semibold text-[11.5px] uppercase tracking-[0.14em] text-[#111111] dark:text-white">
            Filter & Refine
          </span>
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.span
                key={activeFilterCount}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1.25, 1], opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-5 h-5 rounded-full bg-[#111111] dark:bg-[#D4AF37] text-white dark:text-[#0B0A0D] text-[10px] font-bold flex items-center justify-center shadow-xs"
              >
                {activeFilterCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.2 }}
                type="button"
                onClick={onClearFilters}
                className="text-[11px] font-medium tracking-wider uppercase text-[#C4823F] dark:text-[#ECC86A] hover:underline cursor-pointer transition-opacity"
              >
                Reset All
              </motion.button>
            )}
          </AnimatePresence>

          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#111111] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Filters"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ================= ACCORDION SECTIONS ================= */}
      <div className={`divide-y divide-[#EAEAEA] dark:divide-white/10 ${isMobileDrawer ? 'flex-1 overflow-y-auto px-5 py-2' : ''}`}>
        {sections.map((section) => {
          const isOpen = !!openSections[section.id];
          const sectionActiveCount = (activeFilters[section.id] || []).length;
          const sectionCounts = filterCounts[section.id] || {};

          return (
            <div key={section.id} className="py-4">
              
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between text-left group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-[#111111] dark:text-white group-hover:text-[#C4823F] dark:group-hover:text-[#ECC86A] transition-colors">
                      {section.title}
                    </span>
                    <AnimatePresence>
                      {sectionActiveCount > 0 && (
                        <motion.span
                          key={sectionActiveCount}
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: [1.2, 1], opacity: 1 }}
                          exit={{ scale: 0.6, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[#C4823F]/15 dark:bg-[#ECC86A]/20 text-[#C4823F] dark:text-[#ECC86A]"
                        >
                          {sectionActiveCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {section.subtitle && (
                    <p className="text-[10px] text-[#888888] dark:text-[#88857F] tracking-wide mt-0.5">
                      {section.subtitle}
                    </p>
                  )}
                </div>

                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[13px] font-light text-[#888888] dark:text-[#88857F] group-hover:text-[#111111] dark:group-hover:text-white transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </motion.span>
              </button>

              {/* Accordion Content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden pt-3 space-y-2.5"
                  >
                    {section.options.map((option) => {
                      const isSelected = (activeFilters[section.id] || []).includes(option.id);
                      // Sections without live counts (size, price, availability) show no number and are never disabled.
                      const count = sectionCounts[option.id];
                      const hasCount = section.id in filterCounts;
                      const isDisabled = hasCount && !count && !isSelected;

                      return (
                        <motion.label
                          key={option.id}
                          whileTap={{ scale: isDisabled ? 1 : 0.985 }}
                          className={`flex items-start gap-2.5 group cursor-pointer transition-opacity ${
                            isDisabled ? 'opacity-35 cursor-not-allowed' : 'hover:opacity-95'
                          }`}
                        >
                          {/* Custom Minimalist Checkbox with Micro-Spring Animation */}
                          <div className="pt-0.5 relative flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => onToggleFilter(section.id, option.id)}
                              className="sr-only"
                            />
                            <motion.div
                              animate={{
                                scale: isSelected ? [0.85, 1.15, 1] : 1,
                              }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                              className={`w-3.5 h-3.5 rounded-[2px] transition-colors flex items-center justify-center border ${
                                isSelected
                                  ? 'bg-[#111111] dark:bg-[#D4AF37] border-[#111111] dark:border-[#D4AF37] text-white dark:text-[#0B0A0D] shadow-[0_0_8px_rgba(212,175,55,0.35)]'
                                  : 'border-[#BBBBBB] dark:border-white/25 bg-transparent group-hover:border-[#777777] dark:group-hover:border-white/50'
                              }`}
                            >
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.svg
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.16, ease: 'easeOut' }}
                                    className="w-2.5 h-2.5 stroke-current"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    strokeWidth="3.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <motion.polyline
                                      initial={{ pathLength: 0 }}
                                      animate={{ pathLength: 1 }}
                                      transition={{ duration: 0.2, ease: 'easeOut' }}
                                      points="20 6 9 17 4 12"
                                    />
                                  </motion.svg>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          </div>

                          {/* Label and Badge Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-[12px] font-normal tracking-[0.01em] transition-colors leading-tight ${
                                  isSelected
                                    ? 'text-[#111111] dark:text-[#ECC86A] font-medium'
                                    : 'text-[#444444] dark:text-[#CCCCCC] group-hover:text-[#111111] dark:group-hover:text-white'
                                }`}
                              >
                                {option.label}
                              </span>

                              {/* Fragrance Count */}
                              {hasCount && (
                                <span className="text-[11px] text-[#888888] dark:text-[#777570] font-light tabular-nums shrink-0">
                                  ({count ?? 0})
                                </span>
                              )}
                            </div>

                            {/* Subtitle / Badge for intensity or occasion */}
                            {option.badge && (
                              <span className="inline-block mt-0.5 text-[9px] uppercase tracking-widest font-medium px-1.5 py-0.2 rounded-sm bg-black/5 dark:bg-white/10 text-[#666666] dark:text-white/70">
                                {option.badge}
                              </span>
                            )}
                            {option.desc && (
                              <p className="text-[10px] text-[#888888] dark:text-[#777570] font-light leading-snug mt-0.5">
                                {option.desc}
                              </p>
                            )}
                          </div>
                        </motion.label>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ================= MOBILE STICKY BOTTOM ACTIONS ================= */}
      {isMobileDrawer && (
        <div className="p-4 border-t border-[#EAEAEA] dark:border-white/10 bg-white dark:bg-[#0B0A0D] sticky bottom-0">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCloseMobileDrawer}
            className="w-full py-3 bg-[#111111] dark:bg-[#D4AF37] text-white dark:text-[#0B0A0D] text-[11px] uppercase tracking-[0.16em] font-semibold rounded-sm shadow-md cursor-pointer hover:bg-[#C4823F] dark:hover:bg-[#ECC86A] transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Show</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={totalMatching}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="font-bold tabular-nums"
              >
                {totalMatching}
              </motion.span>
            </AnimatePresence>
            <span>Fragrance{totalMatching === 1 ? '' : 's'}</span>
          </motion.button>
        </div>
      )}

    </div>
  );
}

