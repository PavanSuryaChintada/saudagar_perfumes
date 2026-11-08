import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlock, useGo } from '../cms/useSite';

export default function BluorngNavDrawer({
  isOpen,
  onClose,
  theme = 'dark',
  onToggleTheme,
  onNavigateHome,
  onNavigateCollection,
  onScrollToStores,
  onOpenStory,
  onOpenAccount
}) {
  // Edited in Admin → Site content → Menus (mobile drawer) and Brand.
  const drawer = useBlock('mobile_drawer') || {};
  const brand = useBlock('brand') || {};
  const go = useGo();
  const follow = (link) => {
    onClose();
    go(link);
  };
  const runAction = (item) => {
    onClose();
    if (item.action === 'wishlist') onNavigateCollection('wishlist');
    else if (item.action === 'stores') onScrollToStores();
    else if (item.action === 'stories') onOpenStory();
    else if (item.action === 'account') onOpenAccount();
    else go(item.link);
  };
  const logo = theme === 'dark' ? brand.logo_dark_bg : brand.logo_light_bg;

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (window.__lenis) {
      window.__lenis.stop();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      if (window.__lenis) {
        window.__lenis.start();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 overflow-hidden select-none"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              data-lenis-prevent="true"
              className="w-screen max-w-sm sm:max-w-md h-full max-h-screen overflow-y-auto overscroll-contain bg-[#FFFFFF] dark:bg-[#0E0C10] text-tk-ink dark:text-white flex flex-col justify-between shadow-2xl p-6 sm:p-8"
            >
          
          {/* Top Bar: Brand Logo & Close */}
          <div>
            <div className="flex items-center justify-between pb-4">
              {logo ? (
                <img
                  src={logo}
                  alt={brand.name || ''}
                  onClick={() => {
                    onClose();
                    onNavigateHome();
                  }}
                  className="h-7 sm:h-8 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                />
              ) : (
                <span />
              )}

              <button
                onClick={onClose}
                className="p-1.5 text-tk-ink dark:text-white hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Navigation Links Hierarchy */}
            <nav className="mt-6 space-y-4 text-[13px] font-bold tracking-[0.04em] uppercase">
              {drawer.highlight?.label && (
                <div>
                  <button
                    onClick={() => follow(drawer.highlight.link)}
                    className="w-full text-left py-1 hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors flex items-center justify-between group"
                  >
                    <span className="text-emerald-700 dark:text-emerald-400">{drawer.highlight.label}</span>
                    {drawer.highlight.badge && (
                      <span className="text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-xs font-bold tracking-wider">
                        {drawer.highlight.badge}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {drawer.all_link?.label && (
                <div>
                  <button
                    onClick={() => follow(drawer.all_link.link)}
                    className="w-full text-left py-1 hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors flex items-center justify-between"
                  >
                    <span>{drawer.all_link.label}</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              {/* Sub-Collections List */}
              {(drawer.collections || []).length > 0 && (
                <div className="pl-2 pt-2 pb-2 border-l-2 border-[#EEEEEE] dark:border-white/10 space-y-2.5 text-[11.5px] font-medium text-[#555555] dark:text-white/70">
                  {drawer.collections.map((c, i) => (
                    <button
                      key={`${c.label}-${i}`}
                      onClick={() => follow(c.link)}
                      className="w-full text-left hover:text-tk-accent dark:hover:text-tk-accent-night hover:translate-x-1 transition-all flex items-center justify-between"
                    >
                      <span>{c.label}</span>
                      {c.count_label && <span className="text-[11px] text-[#6B6B6B] dark:text-white/40">({c.count_label})</span>}
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-[#F0F0F0] dark:border-white/10 space-y-3">
                {(drawer.utility_links || []).map((item, i) => (
                  <button
                    key={`${item.label}-${i}`}
                    onClick={() => runAction(item)}
                    className="w-full text-left py-1 hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {item.icon && <span className="text-tk-accent dark:text-tk-accent-night">{item.icon}</span>}
                      <span>{item.label}</span>
                    </div>
                    {item.action === 'wishlist' && <span>→</span>}
                  </button>
                ))}

                {/* Luxury Theme Toggle in Drawer */}
                {onToggleTheme && (
                  <div className="pt-3 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#5F5F5F] dark:text-white/60">
                      {drawer.theme_label}
                    </span>
                    <div className="inline-flex items-center p-0.5 rounded-full bg-black/[0.06] dark:bg-white/10 transition-colors">
                      <button
                        type="button"
                        onClick={() => {
                          if (theme !== 'light') onToggleTheme();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-[11px] font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          theme === 'light'
                            ? 'bg-tk-accent text-white shadow-xs font-semibold'
                            : 'text-tk-ink/70 dark:text-white/70 hover:text-tk-ink dark:hover:text-white'
                        }`}
                      >
                        <span>☀</span>
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (theme !== 'dark') onToggleTheme();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-[11px] font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-tk-gold text-tk-night shadow-xs font-semibold'
                            : 'text-tk-ink/70 dark:text-white/70 hover:text-tk-ink dark:hover:text-white'
                        }`}
                      >
                        <span>☾</span>
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Bottom Drawer Actions: Support */}
          <div className="pt-6 space-y-4">
            <div className="text-[11.5px] text-[#5F5F5F] dark:text-white/50 leading-relaxed">
              {(drawer.footer_lines || []).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>

            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
