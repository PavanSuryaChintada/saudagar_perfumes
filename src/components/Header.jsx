import React, { useState, useEffect } from 'react';
import { CURRENCIES } from '../data/products.js';

export default function Header({
  cartCount = 0,
  onOpenCart,
  onOpenSearch,
  activeCurrency,
  onCurrencyChange,
  onNavigateHome,
  onSelectCategory,
  onOpenCustomStudio
}) {
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  const announcements = [
    'Complimentary delivery in UAE for orders over AED 250',
    'Worldwide Express Insured Shipping · Dubai Haute Parfumerie',
    'Bespoke Fragrance Atelier · Handcrafted in Dubai'
  ];

  // Rotate announcement bar every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const toggleAccordion = (name) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  return (
    <>
      {/* 1. TOP ANNOUNCEMENT BAR (Black with Gold border & Gold text) */}
      <div className="bg-[#0A0A0C] text-[#D4AF37] border-b border-[#D4AF37]/25 text-[11px] tracking-[0.16em] uppercase py-2 px-4 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Arrow navigation for announcement */}
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <button
              onClick={() => setAnnouncementIndex((announcementIndex - 1 + announcements.length) % announcements.length)}
              className="text-[#D4AF37]/60 hover:text-[#D4AF37] p-1 transition-colors"
              aria-label="Previous announcement"
            >
              <svg width="10" height="10" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 1 3 9l8 8" />
              </svg>
            </button>

            <span className="font-medium tracking-[0.12em] text-center min-w-[260px] sm:min-w-[340px] transition-opacity duration-300">
              {announcements[announcementIndex]}
            </span>

            <button
              onClick={() => setAnnouncementIndex((announcementIndex + 1) % announcements.length)}
              className="text-[#D4AF37]/60 hover:text-[#D4AF37] p-1 transition-colors"
              aria-label="Next announcement"
            >
              <svg width="10" height="10" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m5 17 8-8-8-8" />
              </svg>
            </button>
          </div>

          {/* Right actions: Store locator & currency */}
          <div className="hidden sm:flex items-center gap-5 text-[10px] tracking-[0.14em]">
            <a
              href="#store-locator"
              onClick={(e) => {
                e.preventDefault();
                alert('Saudagar Perfumes Boutiques:\n1. Al Fahidi Historical Neighbourhood, Bur Dubai\n2. Gold Souk Grand Atrium, Deira Dubai\nWhatsApp Concierge: +971 54 247 7037');
              }}
              className="flex items-center gap-1.5 opacity-85 hover:opacity-100 hover:text-white transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
                <path d="M12 .75a7.5 7.5 0 0 1 7.5 7.5c0 3.407-5.074 11.95-6.875 14.665a.75.75 0 0 1-1.25 0C9.574 20.2 4.5 11.657 4.5 8.25A7.5 7.5 0 0 1 12 .75Z" />
              </svg>
              <span>Store Locator</span>
            </a>

            {/* Currency selector pill */}
            <div className="relative">
              <button
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                className="flex items-center gap-1 bg-[#141418] px-2.5 py-0.5 rounded border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all text-[#D4AF37]"
              >
                <span>{activeCurrency}</span>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isCurrencyDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-28 bg-[#0F0F12] border border-[#D4AF37]/40 shadow-2xl py-1 z-50 rounded-xs">
                  {Object.values(CURRENCIES).map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => {
                        onCurrencyChange(curr.code);
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-colors ${
                        activeCurrency === curr.code ? 'text-[#ECC86A] font-bold bg-[#D4AF37]/15' : 'text-[#D4AF37]/80'
                      }`}
                    >
                      {curr.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Black Obsidian with Metallic Gold Accents) */}
      <header className="sticky top-0 z-40 bg-[#0A0A0C] text-[#D4AF37] shadow-xl border-b border-[#D4AF37]/25 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Top Bar: Hamburger, Centered Logo, Icons */}
          <div className="flex items-center justify-between py-4 sm:py-5 border-b border-[#D4AF37]/15">
            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1 text-[#D4AF37] hover:text-white transition-colors"
                aria-label="Open Navigation Menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 19h20M2 12h20M2 5h20" strokeLinecap="square" />
                </svg>
              </button>

              <button
                onClick={() => alert('Saudagar VIP Account:\nTrack your bespoke orders and private fragrance formulations.')}
                className="p-1 text-[#D4AF37] sm:hidden"
                aria-label="Account"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              </button>
            </div>

            {/* Left Desktop Sub-links / Tagline */}
            <div className="hidden lg:flex items-center text-[10px] tracking-[0.24em] uppercase text-[#D4AF37]/70">
              <span>Haute Parfumerie · Dubai</span>
            </div>

            {/* Centered Brand Logo: SAUDAGAR PERFUMES */}
            <div className="text-center cursor-pointer group" onClick={onNavigateHome}>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-light tracking-[0.26em] uppercase font-sans text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F6E6B4] to-[#D4AF37] group-hover:brightness-110 transition-all leading-tight">
                SAUDAGAR PERFUMES
              </h1>
              <p className="text-[9px] sm:text-[10px] tracking-[0.36em] uppercase text-[#D4AF37]/75 mt-0.5">
                Haute Parfumerie &amp; Bespoke Scents
              </p>
            </div>

            {/* Right Action Icons (Account, Search, Cart) */}
            <div className="flex items-center gap-4 sm:gap-6 text-[#D4AF37]">
              {/* Desktop Account */}
              <button
                onClick={() => alert('Saudagar VIP Portal: Manage your private collection and formula archives.')}
                className="hidden sm:flex items-center gap-1.5 text-xs tracking-[0.16em] uppercase opacity-85 hover:opacity-100 hover:text-[#ECC86A] transition-all"
                aria-label="Account"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16.125 8.75c-.184 2.478-2.063 4.5-4.125 4.5s-3.944-2.021-4.125-4.5c-.187-2.578 1.64-4.5 4.125-4.5 2.484 0 4.313 1.969 4.125 4.5Z" />
                  <path d="M3.017 20.747C3.783 16.5 7.922 14.25 12 14.25s8.217 2.25 8.984 6.497" />
                </svg>
                <span className="hidden xl:inline">Account</span>
              </button>

              {/* Search Modal Trigger */}
              <button
                onClick={onOpenSearch}
                className="p-1 hover:text-[#ECC86A] transition-colors"
                aria-label="Search Fragrances"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10.364 3a7.364 7.364 0 1 0 0 14.727 7.364 7.364 0 0 0 0-14.727Z" />
                  <path d="m15.857 15.858 5.143 5.143" strokeLinecap="round" />
                </svg>
              </button>

              {/* Cart Drawer Trigger */}
              <button
                onClick={onOpenCart}
                className="relative p-1 hover:text-[#ECC86A] transition-colors"
                aria-label={`Shopping Bag with ${cartCount} items`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4.75 8.25A.75.75 0 0 0 4 9L3 19.125c0 1.418 1.207 2.625 2.625 2.625h12.75c1.418 0 2.625-1.149 2.625-2.566L20 9a.75.75 0 0 0-.75-.75H4.75Zm2.75 0v-1.5a4.5 4.5 0 0 1 4.5-4.5v0a4.5 4.5 0 0 1 4.5 4.5v1.5" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#D4AF37] text-[#0A0A0C] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Primary Navigation Menu */}
          <nav className="hidden lg:flex items-center justify-center gap-7 py-3 text-[11px] tracking-[0.2em] font-medium uppercase text-[#D4AF37]/90">
            <button onClick={onNavigateHome} className="hover:text-white transition-colors py-1">
              Home
            </button>

            {/* Collections Mega Menu */}
            <div className="relative group py-1">
              <button className="flex items-center gap-1 hover:text-white transition-colors">
                <span>Collections</span>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-[#121215] border border-[#D4AF37]/35 shadow-2xl py-3 px-2 hidden group-hover:block z-50">
                <div className="grid grid-cols-1 gap-1 text-[11px] tracking-[0.14em]">
                  {['Sip & Scent', 'Noble Collection', 'Poem Collection', 'Deja Vu', 'Teeb', 'Pour Homme', 'Pour Femme', 'The High Notes', 'Tar'].map((col) => (
                    <a
                      key={col}
                      href={`#${col.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectCategory && onSelectCategory(col);
                      }}
                      className="px-3 py-2 text-[#D4AF37]/80 hover:text-[#0A0A0C] hover:bg-[#D4AF37] transition-all font-medium"
                    >
                      {col}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Brand Inspirations Dropdown */}
            <div className="relative group py-1">
              <button className="flex items-center gap-1 hover:text-white transition-colors">
                <span>Brand Inspirations</span>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-[#121215] border border-[#D4AF37]/35 shadow-2xl py-2 hidden group-hover:block z-50">
                <a
                  href="#perfumes"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('perfumes-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="block px-4 py-2 hover:bg-[#D4AF37] hover:text-[#0A0A0C] text-[#D4AF37] transition-colors"
                >
                  Perfumes
                </a>
                <a
                  href="#perfume-oils"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Saudagar Pure Concentrated Attars: 100% oil macerations in cut crystal flacons.');
                  }}
                  className="block px-4 py-2 hover:bg-[#D4AF37] hover:text-[#0A0A0C] text-[#D4AF37] transition-colors"
                >
                  Perfume Oils
                </a>
              </div>
            </div>

            {/* Gifts */}
            <div className="relative group py-1">
              <button className="flex items-center gap-1 hover:text-white transition-colors">
                <span>Gifts</span>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-[#121215] border border-[#D4AF37]/35 shadow-2xl py-2 hidden group-hover:block z-50">
                <a
                  href="#discovery-set"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Saudagar Discovery Coffret: 5 x 10ml flacons in a black lacquer box with 24K gold foil trim.');
                  }}
                  className="block px-4 py-2 hover:bg-[#D4AF37] hover:text-[#0A0A0C] text-[#D4AF37] transition-colors"
                >
                  Discovery Set
                </a>
                <a
                  href="#e-gift-card"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Saudagar Digital Gift Card: Delivered instantly with a personalized gold message.');
                  }}
                  className="block px-4 py-2 hover:bg-[#D4AF37] hover:text-[#0A0A0C] text-[#D4AF37] transition-colors"
                >
                  E-Gift Card
                </a>
              </div>
            </div>

            <a
              href="#bakhoor"
              onClick={(e) => {
                e.preventDefault();
                alert('Saudagar Royal Bakhoor: Pure Cambodi & Assam agarwood chips infused with amber resin.');
              }}
              className="hover:text-white transition-colors py-1"
            >
              Bakhoor
            </a>

            <a
              href="#candle"
              onClick={(e) => {
                e.preventDefault();
                alert('Artisanal Scented Candles: Hand-poured black soy wax infused with 15% pure fragrance oils.');
              }}
              className="hover:text-white transition-colors py-1"
            >
              Candle
            </a>

            <a
              href="#new-in"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('sip-scent-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors py-1"
            >
              New In
            </a>

            {/* CREATE (Create Your Fragrance) */}
            <button
              onClick={() => {
                const el = document.getElementById('create-fragrance-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else onOpenCustomStudio && onOpenCustomStudio();
              }}
              className="text-[#D4AF37] font-bold border-b border-[#D4AF37] pb-0.5 hover:text-white hover:border-white transition-colors"
            >
              CREATE
            </button>

            {/* About Us */}
            <div className="relative group py-1">
              <button className="flex items-center gap-1 hover:text-white transition-colors">
                <span>About Us</span>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-52 bg-[#121215] border border-[#D4AF37]/35 shadow-2xl py-2 hidden group-hover:block z-50">
                <a
                  href="#our-story"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('perfumer-story-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="block px-4 py-2 hover:bg-[#D4AF37] hover:text-[#0A0A0C] text-[#D4AF37] transition-colors"
                >
                  Our Story
                </a>
                <a
                  href="#services"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Saudagar Services:\n• Bespoke Perfume Creation\n• International Franchise\n• Private Label Formulations\n• Masterclass Olfactory Workshops');
                  }}
                  className="block px-4 py-2 hover:bg-[#D4AF37] hover:text-[#0A0A0C] text-[#D4AF37] transition-colors"
                >
                  Our Services
                </a>
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('footer-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="block px-4 py-2 hover:bg-[#D4AF37] hover:text-[#0A0A0C] text-[#D4AF37] transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </div>

            {/* Make a Bundle button (Black & Gold Pill) */}
            <button
              onClick={() => {
                alert('Saudagar Fragrance Bundle: Pick any 3 signature perfumes for AED 280 with complimentary gold presentation box.');
              }}
              className="bg-[#D4AF37] text-[#0A0A0C] px-3.5 py-1 text-[10px] font-bold tracking-[0.18em] hover:bg-white transition-all shadow-md"
            >
              Make a Bundle
            </button>
          </nav>

        </div>
      </header>

      {/* 3. MOBILE SLIDE-OUT DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-[#0A0A0C] text-[#D4AF37] h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-r border-[#D4AF37]/30">
            <div>
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/20">
                <div>
                  <h2 className="text-lg font-bold tracking-[0.22em] text-[#D4AF37]">SAUDAGAR PERFUMES</h2>
                  <p className="text-[10px] tracking-[0.24em] text-white/70">HAUTE PARFUMERIE</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation links */}
              <div className="py-4 space-y-1 text-xs tracking-[0.18em] uppercase font-medium">
                <button
                  onClick={() => {
                    onNavigateHome();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 border-b border-white/10 hover:text-white"
                >
                  Home
                </button>

                {/* Collections Accordion */}
                <div className="border-b border-white/10">
                  <button
                    onClick={() => toggleAccordion('collections')}
                    className="w-full flex items-center justify-between py-2.5 hover:text-white"
                  >
                    <span>Collections</span>
                    <span>{openAccordion === 'collections' ? '−' : '+'}</span>
                  </button>
                  {openAccordion === 'collections' && (
                    <div className="pl-4 pb-2 space-y-2 text-[11px] text-[#D4AF37]/80">
                      {['Sip & Scent', 'Noble Collection', 'Poem Collection', 'Deja Vu', 'Teeb', 'The High Notes'].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            onSelectCategory && onSelectCategory(c);
                            setIsMobileMenuOpen(false);
                          }}
                          className="block text-left hover:text-white py-1"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Brand Inspirations Accordion */}
                <div className="border-b border-white/10">
                  <button
                    onClick={() => toggleAccordion('inspirations')}
                    className="w-full flex items-center justify-between py-2.5 hover:text-white"
                  >
                    <span>Brand Inspirations</span>
                    <span>{openAccordion === 'inspirations' ? '−' : '+'}</span>
                  </button>
                  {openAccordion === 'inspirations' && (
                    <div className="pl-4 pb-2 space-y-2 text-[11px] text-[#D4AF37]/80">
                      <button
                        onClick={() => {
                          const el = document.getElementById('perfumes-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                          setIsMobileMenuOpen(false);
                        }}
                        className="block text-left hover:text-white py-1"
                      >
                        Perfumes
                      </button>
                      <button
                        onClick={() => {
                          alert('Saudagar Perfume Oils Collection');
                          setIsMobileMenuOpen(false);
                        }}
                        className="block text-left hover:text-white py-1"
                      >
                        Perfume Oils
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    const el = document.getElementById('create-fragrance-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 border-b border-white/10 text-[#ECC86A] font-bold"
                >
                  Create Your Fragrance
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('sip-scent-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 border-b border-white/10 hover:text-white"
                >
                  New In: Sip &amp; Scent
                </button>

                <button
                  onClick={() => {
                    alert('Make a Bundle promo: 3 bespoke perfumes for AED 280');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 border-b border-white/10 text-[#D4AF37] font-bold"
                >
                  Make a Bundle
                </button>
              </div>
            </div>

            {/* Bottom drawer footer */}
            <div className="pt-6 border-t border-[#D4AF37]/25 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span>Select Currency:</span>
                <select
                  value={activeCurrency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                  className="bg-[#141418] text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-1 text-xs"
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[10px] tracking-[0.16em] text-white/50 text-center uppercase">
                Saudagar Perfumes · Dubai · Al Fahidi
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
