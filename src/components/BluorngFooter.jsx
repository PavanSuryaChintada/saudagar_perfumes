import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CURRENCIES } from '../data/bluorngSaudagarData.js';
import { useSmoothScroll } from './motion/SmoothScrollProvider.jsx';

export default function BluorngFooter({
  activeCurrency,
  onCurrencyChange,
  theme = 'dark',
  onToggleTheme,
  onNavigateHome,
  onNavigateCollection,
  onScrollToStores,
  onOpenStory
}) {
  const { scrollTo } = useSmoothScroll();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleBackToTop = () => {
    scrollTo(0, { duration: 1.2 });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 4500);
  };

  return (
    <footer className="relative w-full bg-white dark:bg-[#0B0A0D] border-t border-[#EEEEEE] dark:border-white/10 text-[#111111] dark:text-white select-none overflow-hidden pt-16 sm:pt-24 pb-12 sm:pb-16 transition-colors duration-300">
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* ================= 1. VIP INNER CIRCLE NEWSLETTER & CONCIERGE CARD ================= */}
        <div className="bg-white/90 dark:bg-white/[0.035] shadow-xs backdrop-blur-xl rounded-2xl p-8 sm:p-12 lg:p-14 mb-16 sm:mb-20 transition-colors duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: Headline & Manifesto */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="text-[#C4823F] dark:text-[#ECC86A] text-[10px]">✦</span>
                <span className="text-[10.5px] uppercase tracking-[0.24em] text-[#C4823F] dark:text-[#ECC86A] font-medium">
                  Atelier Private Client Concierge
                </span>
              </div>
              <h3 className="font-serif text-[26px] sm:text-[34px] lg:text-[40px] font-normal leading-tight text-[#111111] dark:text-white mb-3">
                Join the Saudagar Inner Circle
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#666666] dark:text-white/65 font-light leading-relaxed max-w-xl">
                Receive confidential extrait allocation notices, rare wild vintage oud releases, and private invitations to boutique olfactory tastings.
              </p>
            </div>

            {/* Right: Newsletter Input & Currency Switcher */}
            <div className="lg:col-span-5 flex flex-col gap-5 w-full">
              <form onSubmit={handleSubscribe} className="relative flex items-center w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={subscribed ? "WELCOME TO THE INNER CIRCLE" : "ENTER YOUR EMAIL ADDRESS"}
                  disabled={subscribed}
                  required
                  className="w-full bg-black/[0.05] hover:bg-black/[0.08] focus:bg-black/[0.1] dark:bg-white/[0.07] dark:hover:bg-white/[0.10] dark:focus:bg-white/[0.12] text-[#111111] dark:text-white placeholder:text-[#888888] dark:placeholder:text-white/40 text-[11.5px] tracking-[0.14em] uppercase px-5 py-4 rounded-full outline-none transition-all duration-300 pr-32"
                />
                <button
                  type="submit"
                  disabled={subscribed}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-6 bg-[#C4823F] hover:bg-[#B57432] dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] text-white dark:text-[#0B0A0D] text-[10.5px] font-semibold uppercase tracking-[0.18em] rounded-full transition-all duration-300 cursor-pointer shadow-md shrink-0 flex items-center justify-center"
                >
                  {subscribed ? 'Confirmed ✓' : 'Subscribe'}
                </button>
              </form>

              {/* Currency Selector Pills */}
              <div className="flex items-center gap-3 text-[11px] text-[#777777] dark:text-white/60">
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#888888] dark:text-white/50">Regional Atelier:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Object.keys(CURRENCIES).map((code) => (
                    <button
                      key={code}
                      onClick={() => onCurrencyChange(code)}
                      className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        activeCurrency === code
                          ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] shadow-xs font-semibold'
                          : 'bg-black/[0.05] hover:bg-black/[0.09] text-[#666666] dark:bg-white/[0.05] dark:hover:bg-white/[0.12] dark:text-white/70'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

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
                          ? 'bg-[#C4823F] text-white shadow-xs font-semibold'
                          : 'text-[#666666] dark:text-white/70 hover:text-[#111111] dark:hover:text-white'
                      }`}
                    >
                      <span>☀</span>
                      <span>Editorial Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (theme !== 'dark') onToggleTheme();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-[#D4AF37] text-[#0B0A0D] shadow-xs font-semibold'
                          : 'text-[#666666] dark:text-white/70 hover:text-[#111111] dark:hover:text-white'
                      }`}
                    >
                      <span>☾</span>
                      <span>Noir Obsidian</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ================= 2. FOUR LUXURY EDITORIAL PILLARS (Borderless) ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-16 sm:mb-20 text-left">
          
          {/* Pillar 1: Olfactive Collections */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#C4823F] dark:text-[#ECC86A] mb-2">
              Collections
            </h4>
            <ul className="space-y-2.5 text-[12.5px] text-[#555555] dark:text-white/65 font-light">
              <li>
                <button onClick={() => onNavigateCollection('signature')} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  Signature Extraits (35%)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCollection('royal')} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  Royal Oud & Taif Rose
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCollection('exotic')} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  Untamed Exotic Obsidian
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCollection('fresh')} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  Riviera Citrus & Azure Blues
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCollection('discovery-sets')} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  Discovery Coffrets (6 × 10ml)
                </button>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Sur-Mesure Atelier */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#C4823F] dark:text-[#ECC86A] mb-2">
              Bespoke Atelier
            </h4>
            <ul className="space-y-2.5 text-[12.5px] text-[#555555] dark:text-white/65 font-light">
              <li>
                <button onClick={() => onNavigateCollection('bespoke')} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  Private Perfume Commissions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCollection('all')} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  Diamond-Tip Bottle Engraving
                </button>
              </li>
              <li>
                <button onClick={onScrollToStores} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  Flagship Boutiques & Salons
                </button>
              </li>
              <li>
                <button onClick={onOpenStory} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  The Scent Screening Lounge
                </button>
              </li>
              <li>
                <a href="https://wa.me/918448441388" target="_blank" rel="noopener noreferrer" className="hover:text-[#111111] dark:hover:text-white transition-colors">
                  VIP Wedding & Corporate Coffrets
                </a>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Maison Heritage */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#C4823F] dark:text-[#ECC86A] mb-2">
              Maison Heritage
            </h4>
            <ul className="space-y-2.5 text-[12.5px] text-[#555555] dark:text-white/65 font-light">
              <li>
                <button onClick={() => onNavigateCollection('all')} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  Sacred Copper Alembic Distillation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCollection('royal')} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  Wild 40-Year Assam Agarwood
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCollection('signature')} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  Mysore Aged Sandalwood Terroir
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCollection('royal')} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  High-Altitude Taif Damask Roses
                </button>
              </li>
              <li>
                <button onClick={onNavigateHome} className="hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left">
                  The Royal Perfumer's Lineage
                </button>
              </li>
            </ul>
          </div>

          {/* Pillar 4: Client Privileges & Concierge */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#C4823F] dark:text-[#ECC86A] mb-2">
              Concierge
            </h4>
            <ul className="space-y-2.5 text-[12.5px] text-[#555555] dark:text-white/65 font-light">
              <li>
                <a href="tel:+918448441388" className="hover:text-[#111111] dark:hover:text-white transition-colors">
                  Concierge: +91 84484 41388
                </a>
              </li>
              <li>
                <a href="https://wa.me/918448441388" target="_blank" rel="noopener noreferrer" className="hover:text-[#111111] dark:hover:text-white transition-colors">
                  WhatsApp Private Client
                </a>
              </li>
              <li>
                <button onClick={() => alert('Complimentary insured white-glove express shipping across 120+ countries.')} className="hover:text-[#111111] dark:hover:text-white transition-colors text-left cursor-pointer">
                  Complimentary Express Shipping
                </button>
              </li>
              <li>
                <button onClick={() => alert('Sample-First Guarantee: Every full flacon comes with a 2ml matching sample. Test first on skin before breaking the royal seal.')} className="hover:text-[#111111] dark:hover:text-white transition-colors text-left cursor-pointer">
                  Sample-First Exchange Privilege
                </button>
              </li>
              <li>
                <button onClick={() => alert('Authenticity Guarantee: Poured and sealed in our private atelier with holographic certificate.')} className="hover:text-[#111111] dark:hover:text-white transition-colors text-left cursor-pointer">
                  Authenticity Verification
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* ================= 3. CENTERPIECE OFFICIAL BRAND IDENTITY ================= */}
        <div className="flex flex-col items-center justify-center text-center py-8 sm:py-12">
          
          {/* Official Brandmark: Black in Light theme, Gold in Dark theme */}
          <div
            onClick={onNavigateHome}
            className="cursor-pointer group flex flex-col items-center max-w-lg px-4 mb-4"
          >
            <img
              src="/images/saudagar_logo_black.png"
              alt="Saudagar Perfumers"
              className="w-full max-w-[420px] sm:max-w-[480px] h-auto object-contain opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700 ease-out dark:hidden block"
            />
            <img
              src="/images/saudagar_logo_gold.png"
              alt="Saudagar Perfumers"
              className="w-full max-w-[420px] sm:max-w-[480px] h-auto object-contain opacity-95 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700 ease-out filter drop-shadow-[0_10px_35px_rgba(212,175,55,0.45)] hidden dark:block"
            />
          </div>

          {/* Atelier Creed */}
          <p className="text-[11px] sm:text-[11.5px] uppercase tracking-[0.22em] text-[#777777] dark:text-white/40 font-light mt-1 mb-6">
            Compounded in Sacred Copper Alembics · Poured into Hand-Cut Flacons
          </p>

          {/* Floating Minimal Back to Top Pill */}
          <button
            onClick={handleBackToTop}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/[0.05] hover:bg-black/[0.1] text-[#555555] hover:text-[#111111] dark:bg-white/[0.05] dark:hover:bg-white/[0.12] dark:text-white/70 dark:hover:text-white text-[10.5px] uppercase tracking-[0.18em] transition-all duration-300 cursor-pointer"
          >
            <span>Back to top</span>
            <span className="text-[10px] text-[#C4823F] dark:text-[#ECC86A]">↑</span>
          </button>
        </div>

        {/* ================= 4. BOTTOM COPYRIGHT & PRIVILEGE ASSURANCE ================= */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10.5px] text-[#777777] dark:text-white/45 tracking-wider uppercase">
          <p>© 2026 SAUDAGAR PERFUMERS RETAIL PRIVATE LIMITED. ALL RIGHTS RESERVED.</p>

          {/* Luxury Reassurance Badges */}
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center text-[#888888] dark:text-white/40">
            <span>35% Pure Extrait</span>
            <span>✦</span>
            <span>Insured White-Glove Dispatch</span>
            <span>✦</span>
            <span>Secured Checkout</span>
            <span>✦</span>
            <span>Cruelty Free</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
