import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CURRENCIES } from '../data/bluorngSaudagarData.js';
import ScrollReveal, { StaggerContainer, StaggerItem } from './motion/ScrollReveal.jsx';
import { useSmoothScroll } from './motion/SmoothScrollProvider.jsx';

export default function BluorngFooter({
  activeCurrency,
  onCurrencyChange,
  onNavigateHome,
  onNavigateCollection,
  onScrollToStores,
  onOpenStory
}) {
  const { scrollTo } = useSmoothScroll();
  const [subscribed, setSubscribed] = useState(false);

  const handleBackToTop = () => {
    scrollTo(0, { duration: 1.4 });
  };

  return (
    <footer className="relative w-full bg-[#0E0C0B] text-[#FFFFFF] border-t border-white/10 select-none overflow-hidden">
      {/* Royal Heritage Palace Panorama Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
        <img
          src="/images/footer_palace_bg.png"
          alt="Saudagar Royal Heritage Palace"
          className="w-full h-full object-cover object-center filter brightness-[0.58] contrast-[1.12] saturate-[1.15]"
        />
        {/* Luxury Vignettes & Atmospheric Lighting for seamless blending & typography legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E0C0B]/95 via-[#0E0C0B]/60 to-[#070607]/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-24 sm:pb-16">
        
        {/* Top 3-Column Navigation Grid + Newsletter */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-12 border-b border-white/10 text-[12px]">
          
          {/* Column 1: Connect with us */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/90 mb-4 pb-1 border-b border-white/10">
              Connect With Us
            </h4>
            <ul className="space-y-2.5 text-white/70">
              <li>
                <a href="tel:+918448441388" className="hover:text-[#C4823F] transition-colors flex items-center gap-1.5">
                  <span>Call Concierge: +91 84484 41388</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/918448441388" target="_blank" rel="noopener noreferrer" className="hover:text-[#C4823F] transition-colors">
                  WhatsApp Private Client
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#C4823F] transition-colors">
                  Instagram (@saudagarperfumes)
                </a>
              </li>
              <li>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#C4823F] transition-colors">
                  YouTube (Atelier Films)
                </a>
              </li>
              <li>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#C4823F] transition-colors">
                  LinkedIn (Saudagar Luxury)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Order Support */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/90 mb-4 pb-1 border-b border-white/10">
              Order Support
            </h4>
            <ul className="space-y-2.5 text-white/70">
              <li>
                <a href="#returns" onClick={(e) => { e.preventDefault(); alert('Complimentary returns & sample-first exchange guarantee on all orders.'); }} className="hover:text-[#C4823F] transition-colors">
                  Make a Return / Exchange
                </a>
              </li>
              <li>
                <a href="#policy" onClick={(e) => { e.preventDefault(); alert('Return Policy: Unopened flacons accepted within 14 days with original security seal.'); }} className="hover:text-[#C4823F] transition-colors">
                  Refund & Exchange Policy
                </a>
              </li>
              <li>
                <a href="#track" onClick={(e) => { e.preventDefault(); alert('Track Order: Enter your AWB or order number in your customer account.'); }} className="hover:text-[#C4823F] transition-colors">
                  Track Your Order
                </a>
              </li>
              <li>
                <a href="#shipping" onClick={(e) => { e.preventDefault(); alert('Shipping Policy: 2-3 day domestic express, insured worldwide courier.'); }} className="hover:text-[#C4823F] transition-colors">
                  Shipping & Courier Policy
                </a>
              </li>
              <li>
                <a href="#international" onClick={(e) => { e.preventDefault(); alert('International Orders: Shipped duties & taxes pre-paid to 120+ countries.'); }} className="hover:text-[#C4823F] transition-colors">
                  International Order Policy
                </a>
              </li>
              <li>
                <a href="#faqs" onClick={(e) => { e.preventDefault(); alert('Fragrance Concierge FAQ:\nAll our perfumes are Extrait de Parfum (30-46% oil).'); }} className="hover:text-[#C4823F] transition-colors">
                  House FAQ’s
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: The House of Saudagar */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/90 mb-4 pb-1 border-b border-white/10">
              We are SAUDAGAR
            </h4>
            <ul className="space-y-2.5 text-white/70">
              <li>
                <a href="#our-story" onClick={(e) => { e.preventDefault(); onNavigateCollection('all'); }} className="hover:text-[#C4823F] transition-colors">
                  Our Olfactory Lineage
                </a>
              </li>
              <li>
                <button onClick={onScrollToStores} className="hover:text-[#C4823F] transition-colors text-left">
                  Walk-in Boutiques & Ateliers
                </button>
              </li>
              <li>
                <button onClick={onOpenStory} className="hover:text-[#C4823F] transition-colors text-left">
                  Behind the Bottle (Reels)
                </button>
              </li>
              <li>
                <a href="#bespoke" onClick={(e) => { e.preventDefault(); alert('Bespoke Atelier: Private appointments available at our Mumbai and Dubai flagships.'); }} className="hover:text-[#C4823F] transition-colors">
                  Private Bespoke Commissions
                </a>
              </li>
              <li>
                <a href="#careers" onClick={(e) => { e.preventDefault(); alert('Careers: Send portfolios to careers@saudagarperfumes.com'); }} className="hover:text-[#C4823F] transition-colors">
                  Atelier Careers
                </a>
              </li>
              <li>
                <a href="#press" onClick={(e) => { e.preventDefault(); alert('Media inquiries: press@saudagarperfumes.com'); }} className="hover:text-[#C4823F] transition-colors">
                  Media & Press
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 & 5: Newsletter & Regional Selection */}
          <div className="col-span-2 space-y-4">
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/90 pb-1 border-b border-white/10">
              Join the Saudagar Inner Circle
            </h4>
            <p className="text-[12px] text-white/70 leading-relaxed">
              Receive private invitations to confidential flacon drops, rare vintage oud releases, and boutique olfactory tastings.
            </p>

            {/* Newsletter Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
                setTimeout(() => setSubscribed(false), 5000);
              }}
              className="flex items-center border border-white/25 bg-black/40 backdrop-blur-sm hover:border-[#C4823F]/80 focus-within:border-[#C4823F] transition-all overflow-hidden rounded-xs"
            >
              <input
                type="email"
                required
                placeholder={subscribed ? "WELCOME TO THE INNER CIRCLE" : "ENTER YOUR EMAIL"}
                disabled={subscribed}
                className="bg-transparent text-white px-3.5 py-2.5 text-[11px] tracking-wider uppercase w-full outline-none placeholder:text-white/40 disabled:text-[#C4823F]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-white text-[#111111] hover:bg-[#C4823F] hover:text-white font-bold text-[11px] uppercase tracking-widest transition-colors cursor-pointer shrink-0"
              >
                {subscribed ? 'Joined ✓' : 'Join'}
              </button>
            </form>

            {/* Currency Selector Bar */}
            <div className="pt-2 flex items-center gap-3 text-[11px] text-white/70">
              <span className="uppercase tracking-wider">Currency:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.keys(CURRENCIES).map((code) => (
                  <button
                    key={code}
                    onClick={() => onCurrencyChange(code)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activeCurrency === code
                        ? 'bg-[#C4823F] text-white shadow-xs'
                        : 'bg-black/40 backdrop-blur-xs hover:bg-white/20 text-white/80 border border-white/10'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ================= BACK TO TOP BUTTON ================= */}
        <div className="flex justify-end pt-4 pb-2">
          <button
            onClick={handleBackToTop}
            className="inline-flex items-center gap-2 text-[10.5px] font-bold tracking-[0.22em] uppercase text-white/60 hover:text-[#C4823F] transition-colors group cursor-pointer"
          >
            <span>Back to top</span>
            <span className="w-5 h-5 rounded-full border border-white/20 group-hover:border-[#C4823F] flex items-center justify-center text-[10px] group-hover:-translate-y-0.5 transition-transform">
              ↑
            </span>
          </button>
        </div>

        {/* ================= MASSIVE FOOTER WORDMARK WITH LUXURY HOVER SPREAD ================= */}
        <ScrollReveal variant="fade-up" className="pt-4 pb-4 flex flex-col items-center justify-center">
          <div
            onClick={onNavigateHome}
            className="w-full text-center cursor-pointer select-none overflow-hidden group flex flex-col items-center"
          >
            <span className="font-script text-[#ECC86A] text-[24px] sm:text-[32px] md:text-[38px] lowercase tracking-normal -mb-2 sm:-mb-3 z-10 filter drop-shadow-[0_2px_12px_rgba(196,130,63,0.5)]">
              haute parfumerie royale
            </span>
            <h1 className="font-sans font-black tracking-[0.16em] group-hover:tracking-[0.19em] uppercase text-white text-[13vw] leading-none opacity-90 group-hover:opacity-100 transition-all duration-700 ease-out filter drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
              SAUDAGAR
            </h1>
          </div>
        </ScrollReveal>

        {/* Bottom Copyright & Security Line */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10.5px] text-white/50 tracking-wider uppercase">
          <p>© 2026 SAUDAGAR PERFUMES RETAIL PRIVATE LIMITED, ALL RIGHTS RESERVED.</p>
          
          <div className="flex items-center gap-4 text-white/40">
            <span>Visa</span>
            <span>•</span>
            <span>Mastercard</span>
            <span>•</span>
            <span>UPI / GPay</span>
            <span>•</span>
            <span>Apple Pay</span>
            <span>•</span>
            <span>Cash on Delivery</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
