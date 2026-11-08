import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmoothScroll } from './motion/SmoothScrollProvider.jsx';
import { useBlock, useGo } from '../cms/useSite';
import { supabase } from '../lib/supabase';

export default function BluorngFooter({
  theme = 'dark',
  onToggleTheme,
  onNavigateHome,
  onNavigateCollection,
  onScrollToStores,
  onOpenStory
}) {
  const { scrollTo } = useSmoothScroll();
  // Everything below is edited in Admin → Site content → Footer and Brand.
  const footer = useBlock('footer') || {};
  const brand = useBlock('brand') || {};
  const go = useGo();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');

  const runLink = (item) => {
    if (item.action === 'stores') onScrollToStores && onScrollToStores();
    else if (item.action === 'stories') onOpenStory && onOpenStory();
    else go(item.link);
  };

  const handleBackToTop = () => {
    scrollTo(0, { duration: 1.2 });
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubscribeError('');
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setSubscribeError('Enter a valid email address.');
      return;
    }
    const { error } = await supabase.rpc('subscribe_newsletter', { p_email: value, p_source: 'footer' });
    if (error) {
      setSubscribeError('Please try again in a moment.');
      return;
    }
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 4500);
  };

  return (
    <footer className="relative w-full bg-white dark:bg-tk-night border-t border-[#EEEEEE] dark:border-white/10 text-tk-ink dark:text-white select-none overflow-hidden pt-12 sm:pt-16 pb-24 lg:pb-14 transition-colors duration-300">
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* ================= 1. VIP INNER CIRCLE NEWSLETTER & CONCIERGE CARD ================= */}
        <div className="bg-[#F8F7F4] dark:bg-white/[0.035] border border-[#ECE9E2] dark:border-white/10 rounded-[2px] p-7 sm:p-10 lg:p-12 mb-14 sm:mb-16 transition-colors duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: Headline & Manifesto */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {footer.newsletter_eyebrow && <span className="sf-eyebrow">{footer.newsletter_eyebrow}</span>}
              <h3 className="sf-title">{footer.newsletter_heading}</h3>
              <p className="sf-lead">{footer.newsletter_text}</p>
            </div>

            {/* Right: Newsletter Input & Theme Switcher */}
            <div className="lg:col-span-5 flex flex-col gap-5 w-full">
              <form onSubmit={handleSubscribe} className="relative flex items-center w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={subscribed ? footer.newsletter_success || '' : footer.newsletter_placeholder}
                  aria-label="Email address"
                  disabled={subscribed}
                  required
                  className="w-full h-14 bg-white border border-[#DEDAD2] focus:border-tk-ink dark:border-white/15 dark:focus:border-white/50 dark:bg-white/[0.07] dark:hover:bg-white/[0.10] dark:focus:bg-white/[0.12] text-tk-ink dark:text-white placeholder:text-[#888888] dark:placeholder:text-white/40 text-[13px] tracking-[0.02em] px-5 rounded-[2px] outline-none transition-all duration-300 pr-36"
                />
                <button
                  type="submit"
                  disabled={subscribed}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-6 bg-tk-ink hover:bg-tk-accent dark:bg-tk-gold dark:hover:bg-tk-accent-night text-white dark:text-tk-night text-[12px] font-semibold uppercase tracking-[0.18em] rounded-[2px] transition-colors duration-300 cursor-pointer shrink-0 flex items-center justify-center"
                >
                  {subscribed ? '✓' : footer.newsletter_button}
                </button>
              </form>
              {subscribeError && <p className="-mt-3 text-[12px] text-rose-600 dark:text-rose-400" role="alert">{subscribeError}</p>}

              {/* Atelier Theme Switcher Pills */}
              {onToggleTheme && (
                <div className="flex items-center gap-3 text-[12px] text-[#5F5F5F] dark:text-white/60">
                  <span className="text-[12px] uppercase tracking-[0.18em] text-[#666666] dark:text-white/50">Theme</span>
                  <div className="inline-flex items-center p-0.5 rounded-[2px] border border-[#DEDAD2] dark:border-white/15 bg-white dark:bg-white/[0.04] transition-colors">
                    <button
                      type="button"
                      onClick={() => {
                        if (theme !== 'light') onToggleTheme();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-[12px] font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        theme === 'light'
                          ? 'bg-tk-ink text-white font-semibold'
                          : 'text-[#666666] dark:text-white/70 hover:text-tk-ink dark:hover:text-white'
                      }`}
                    >
                      <span>☀</span>
                      <span>{footer.theme_light_label}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (theme !== 'dark') onToggleTheme();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-[12px] font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-tk-gold text-tk-night shadow-xs font-semibold'
                          : 'text-[#666666] dark:text-white/70 hover:text-tk-ink dark:hover:text-white'
                      }`}
                    >
                      <span>☾</span>
                      <span>{footer.theme_dark_label}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ================= 2. LINK COLUMNS ================= */}
        {(footer.columns || []).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-16 sm:mb-20 text-left">
            {footer.columns.map((col, ci) => (
              <div key={`${col.heading}-${ci}`} className="flex flex-col space-y-3">
                <h4 className="text-[12px] font-semibold tracking-[0.22em] uppercase text-tk-accent-ink dark:text-tk-accent-night mb-2">
                  {col.heading}
                </h4>
                <ul className="space-y-1 sm:space-y-2.5 text-[13.5px] sm:text-[13px] text-[#4A4A4A] dark:text-white/70 font-normal">
                  {(col.links || []).map((item, li) => (
                    <li key={`${item.label}-${li}`}>
                      <button onClick={() => runLink(item)} className="py-1 sm:py-0 hover:text-tk-ink dark:hover:text-white transition-colors cursor-pointer text-left">
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* ================= 3. CENTERPIECE OFFICIAL BRAND IDENTITY ================= */}
        <div className="flex flex-col items-center justify-center text-center py-8 sm:py-12">
          
          {/* Official Brandmark: Black in Light theme, Gold in Dark theme */}
          <div
            onClick={onNavigateHome}
            className="cursor-pointer group flex flex-col items-center max-w-lg px-4 mb-4"
          >
            {brand.logo_light_bg && (
              <img
                src={brand.logo_light_bg}
                alt={brand.name || ''}
                className="w-full max-w-[420px] sm:max-w-[480px] h-auto object-contain opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700 ease-out dark:hidden block"
              />
            )}
            {brand.logo_dark_bg && <img
              src={brand.logo_dark_bg}
              alt={brand.name || ''}
              className="w-full max-w-[420px] sm:max-w-[480px] h-auto object-contain opacity-95 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700 ease-out filter drop-shadow-[0_10px_35px_rgba(212,175,55,0.45)] hidden dark:block"
            />}
          </div>

          {/* Atelier Creed */}
          <p className="text-[12px] sm:text-[12px] uppercase tracking-[0.22em] text-[#5F5F5F] dark:text-white/60 font-normal mt-1 mb-6">
            {footer.creed}
          </p>

          {/* Floating Minimal Back to Top Pill */}
          <button
            onClick={handleBackToTop}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[2px] bg-black/[0.05] hover:bg-black/[0.1] text-[#555555] hover:text-tk-ink dark:bg-white/[0.05] dark:hover:bg-white/[0.12] dark:text-white/70 dark:hover:text-white text-[12px] uppercase tracking-[0.18em] transition-all duration-300 cursor-pointer"
          >
            <span>{footer.back_to_top}</span>
            <span className="text-[12px] text-tk-accent-ink dark:text-tk-accent-night">↑</span>
          </button>
        </div>

        {/* ================= 4. BOTTOM COPYRIGHT & PRIVILEGE ASSURANCE ================= */}
        <div className="pt-8 border-t border-[#EEEEEE] dark:border-white/10 flex flex-col md:flex-row items-center md:items-start justify-between gap-4 text-[12px] text-[#5F5F5F] dark:text-white/60 tracking-wider uppercase">
          <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
            <p>{String(footer.copyright || '').replace('{year}', String(new Date().getFullYear()))}</p>
            {(footer.legal_links || []).length > 0 && (
              <nav className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1" aria-label="Policies">
                {footer.legal_links.map((l, i) => (
                  <button key={`${l.label}-${i}`} onClick={() => go(l.link)} className="py-1 hover:text-tk-ink dark:hover:text-white transition-colors cursor-pointer">
                    {l.label}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* Reassurance Badges */}
          <ul className="flex items-center gap-x-4 sm:gap-x-5 gap-y-1.5 flex-wrap justify-center md:justify-end text-[#666666] dark:text-white/60">
            {(footer.badges || []).map((badge, i) => (
              <li key={`${badge}-${i}`} className="flex items-center gap-x-4 sm:gap-x-5">
                {i > 0 && <span className="hidden md:inline" aria-hidden>✦</span>}
                <span>{badge}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </footer>
  );
}
