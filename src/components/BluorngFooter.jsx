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
    <footer className="relative w-full bg-white dark:bg-tk-night border-t border-[#EEEEEE] dark:border-white/10 text-tk-ink dark:text-white select-none overflow-hidden pt-16 sm:pt-24 pb-12 sm:pb-16 transition-colors duration-300">
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* ================= 1. VIP INNER CIRCLE NEWSLETTER & CONCIERGE CARD ================= */}
        <div className="bg-white/90 dark:bg-white/[0.035] shadow-xs backdrop-blur-xl rounded-2xl p-8 sm:p-12 lg:p-14 mb-16 sm:mb-20 transition-colors duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: Headline & Manifesto */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="text-tk-accent dark:text-tk-accent-night text-[10px]">✦</span>
                <span className="text-[10.5px] uppercase tracking-[0.24em] text-tk-accent dark:text-tk-accent-night font-medium">
                  {footer.newsletter_eyebrow}
                </span>
              </div>
              <h3 className="font-serif text-[26px] sm:text-[34px] lg:text-[40px] font-normal leading-tight text-tk-ink dark:text-white mb-3">
                {footer.newsletter_heading}
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#666666] dark:text-white/65 font-light leading-relaxed max-w-xl">
                {footer.newsletter_text}
              </p>
            </div>

            {/* Right: Newsletter Input & Theme Switcher */}
            <div className="lg:col-span-5 flex flex-col gap-5 w-full">
              <form onSubmit={handleSubscribe} className="relative flex items-center w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={subscribed ? (footer.newsletter_success || '').toUpperCase() : footer.newsletter_placeholder}
                  aria-label="Email address"
                  disabled={subscribed}
                  required
                  className="w-full bg-black/[0.05] hover:bg-black/[0.08] focus:bg-black/[0.1] dark:bg-white/[0.07] dark:hover:bg-white/[0.10] dark:focus:bg-white/[0.12] text-tk-ink dark:text-white placeholder:text-[#888888] dark:placeholder:text-white/40 text-[11.5px] tracking-[0.14em] uppercase px-5 py-4 rounded-full outline-none transition-all duration-300 pr-32"
                />
                <button
                  type="submit"
                  disabled={subscribed}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-6 bg-tk-accent hover:bg-[#B57432] dark:bg-tk-gold dark:hover:bg-tk-accent-night text-white dark:text-tk-night text-[10.5px] font-semibold uppercase tracking-[0.18em] rounded-full transition-all duration-300 cursor-pointer shadow-md shrink-0 flex items-center justify-center"
                >
                  {subscribed ? '✓' : footer.newsletter_button}
                </button>
              </form>
              {subscribeError && <p className="-mt-3 text-[11px] text-rose-600 dark:text-rose-400" role="alert">{subscribeError}</p>}

              {/* Atelier Theme Switcher Pills */}
              {onToggleTheme && (
                <div className="flex items-center gap-3 text-[11px] text-[#777777] dark:text-white/60">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#888888] dark:text-white/50">Atelier Theme:</span>
                  <div className="inline-flex items-center p-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] transition-colors">
                    <button
                      type="button"
                      onClick={() => {
                        if (theme !== 'light') onToggleTheme();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        theme === 'light'
                          ? 'bg-tk-accent text-white shadow-xs font-semibold'
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
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
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
                <h4 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-tk-accent dark:text-tk-accent-night mb-2">
                  {col.heading}
                </h4>
                <ul className="space-y-2.5 text-[12.5px] text-[#555555] dark:text-white/65 font-light">
                  {(col.links || []).map((item, li) => (
                    <li key={`${item.label}-${li}`}>
                      <button onClick={() => runLink(item)} className="hover:text-tk-ink dark:hover:text-white transition-colors cursor-pointer text-left">
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
          <p className="text-[11px] sm:text-[11.5px] uppercase tracking-[0.22em] text-[#777777] dark:text-white/40 font-light mt-1 mb-6">
            {footer.creed}
          </p>

          {/* Floating Minimal Back to Top Pill */}
          <button
            onClick={handleBackToTop}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/[0.05] hover:bg-black/[0.1] text-[#555555] hover:text-tk-ink dark:bg-white/[0.05] dark:hover:bg-white/[0.12] dark:text-white/70 dark:hover:text-white text-[10.5px] uppercase tracking-[0.18em] transition-all duration-300 cursor-pointer"
          >
            <span>{footer.back_to_top}</span>
            <span className="text-[10px] text-tk-accent dark:text-tk-accent-night">↑</span>
          </button>
        </div>

        {/* ================= 4. BOTTOM COPYRIGHT & PRIVILEGE ASSURANCE ================= */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10.5px] text-[#777777] dark:text-white/45 tracking-wider uppercase">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p>{footer.copyright}</p>
            {(footer.legal_links || []).length > 0 && (
              <nav className="flex flex-wrap gap-4" aria-label="Policies">
                {footer.legal_links.map((l, i) => (
                  <button key={`${l.label}-${i}`} onClick={() => go(l.link)} className="hover:text-tk-ink dark:hover:text-white transition-colors cursor-pointer">
                    {l.label}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* Reassurance Badges */}
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center text-[#888888] dark:text-white/40">
            {(footer.badges || []).map((badge, i) => (
              <React.Fragment key={`${badge}-${i}`}>
                {i > 0 && <span>✦</span>}
                <span>{badge}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
