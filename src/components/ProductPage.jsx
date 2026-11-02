import React, { useState, useEffect } from 'react';
import { PRODUCTS, formatPrice } from '../data/products.js';

export default function ProductPage({
  productId,
  activeCurrency = 'AED',
  onSelectProduct,
  onAddToCart,
  onNavigateHome,
  onOpenCart,
  onOpenSearch,
  cartCount = 0
}) {
  const product = PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0];

  const [selectedSizeMl, setSelectedSizeMl] = useState(50);
  const [quantity, setQuantity] = useState(1);
  const [engraving, setEngraving] = useState('');
  const [activeImage, setActiveImage] = useState(
    product.image && !product.image.includes('placeholder')
      ? product.image
      : '/images/saudagar_amber_flacon.jpg'
  );

  // Accordion states
  const [openAccordion, setOpenAccordion] = useState('ingredients');

  useEffect(() => {
    setSelectedSizeMl(50);
    setQuantity(1);
    setEngraving('');
    setActiveImage(
      product.image && !product.image.includes('placeholder')
        ? product.image
        : '/images/saudagar_amber_flacon.png'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId, product.image]);

  const sizeObj = product.sizes?.find((s) => s.ml === selectedSizeMl) || { ml: 50, priceMultiplier: 1 };
  const unitPrice = Math.round((product.prices?.[activeCurrency] || product.prices?.AED || 100) * sizeObj.priceMultiplier);
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product.id, selectedSizeMl, engraving.trim(), quantity);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    if (onOpenCart) {
      onOpenCart();
    }
  };

  const toggleAccordion = (name) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  // Recommend 4 products for "You might also like"
  const recommendedProducts = [
    {
      id: 'saudagar-pacific-chill',
      name: 'SAUDAGAR PACIFIC COAST AQUATIC',
      price: formatPrice(100, activeCurrency),
      image: '/images/saudagar_royal_sapphire.png'
    },
    {
      id: 'saudagar-guidance-46',
      name: 'SAUDAGAR GUIDANCE 46 EXTRAIT',
      price: formatPrice(140, activeCurrency),
      image: '/images/saudagar_imperial_ruby.png'
    },
    {
      id: 'saudagar-afternoon-swim',
      name: 'SAUDAGAR AFTERNOON AZURE SOL',
      price: formatPrice(120, activeCurrency),
      image: '/images/saudagar_amber_gold.png'
    },
    {
      id: 'saudagar-stellar-times',
      name: 'SAUDAGAR STELLAR AMBER TIMES',
      price: formatPrice(140, activeCurrency),
      image: '/images/saudagar_crystal_diamond.png'
    }
  ];

  return (
    <div className="bg-[#ECEBE6] text-[#111111] min-h-screen font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* 1. TOP BLACK BANNER */}
      <div className="bg-[#000000] text-white text-[11px] tracking-[0.16em] uppercase py-2 px-4 text-center font-medium">
        <a
          href="#limited-edition"
          onClick={(e) => {
            e.preventDefault();
            alert('Saudagar Limited Editions:\nExclusive private batches distilled in numbered crystal flacons.');
          }}
          className="hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1.5"
        >
          <span>SHOP THE NEW LIMITED EDITION COLLECTION</span>
          <span>→</span>
        </a>
      </div>

      {/* 2. MINIMALIST LUXURY HEADER */}
      <header className="border-b border-[#111111] bg-[#ECEBE6] px-6 sm:px-10 py-4 sm:py-5 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          
          {/* Left Navigation Links */}
          <nav className="flex items-center gap-6 sm:gap-8 text-[11px] font-medium tracking-[0.2em] uppercase text-[#111111]">
            <button
              onClick={onNavigateHome}
              className="hover:opacity-60 transition-opacity"
            >
              FRAGRANCES
            </button>
            <button
              onClick={() => {
                onNavigateHome();
                setTimeout(() => {
                  const el = document.getElementById('perfumer-story-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="hover:opacity-60 transition-opacity hidden sm:inline"
            >
              OUR STORY
            </button>
            <button
              onClick={() => alert('Saudagar Concierge:\nWhatsApp: +971 54 247 7037\nEmail: boutique@saudagarperfumes.com')}
              className="hover:opacity-60 transition-opacity hidden md:inline"
            >
              CONTACT
            </button>
          </nav>

          {/* Center Brand Logo */}
          <div className="text-center cursor-pointer" onClick={onNavigateHome}>
            <span className="font-serif text-xl sm:text-2xl md:text-3xl tracking-[0.2em] uppercase text-[#111111] font-light">
              SAUDAGAR PERFUMES
            </span>
          </div>

          {/* Right Action Icons (Search, Bag) */}
          <div className="flex items-center gap-5 sm:gap-6 text-[#111111]">
            <button
              onClick={onOpenSearch}
              className="hover:opacity-60 transition-opacity p-1"
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </button>

            <button
              onClick={onOpenCart}
              className="relative hover:opacity-60 transition-opacity p-1 flex items-center"
              aria-label="Cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 8h16l-1.5 12.5a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5L4 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-[#111111] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {cartCount}
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* 3. MAIN PRODUCT SHOWCASE (2 Columns with clean hairline grid border) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="border border-[#111111] grid grid-cols-1 lg:grid-cols-2 bg-[#ECEBE6]">
          
          {/* Left Column: Main Image & Thumbnail Box */}
          <div className="flex flex-col lg:border-r border-[#111111]">
            
            {/* Primary Centered Flacon Display */}
            <div className="flex-1 flex items-center justify-center p-8 sm:p-14 min-h-[440px] sm:min-h-[540px] bg-[#ECEBE6] overflow-hidden">
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-[460px] w-auto object-contain drop-shadow-xl transition-all duration-300 hover:scale-[1.02]"
              />
            </div>

            {/* Bottom Thumbnail Gallery Row */}
            <div className="border-t border-[#111111] p-5 sm:p-6 bg-[#ECEBE6] flex items-center gap-4">
              <button
                onClick={() => setActiveImage('/images/saudagar_amber_flacon.png')}
                className={`w-20 h-20 sm:w-24 sm:h-24 border ${
                  activeImage.includes('amber_flacon') ? 'border-[#111111] ring-1 ring-[#111111]' : 'border-[#111111]/40'
                } bg-transparent p-1.5 flex items-center justify-center transition-all`}
                aria-label="View Bottle"
              >
                <img
                  src="/images/saudagar_amber_flacon.png"
                  alt="Flacon Front View"
                  className="w-full h-full object-contain"
                />
              </button>

              <button
                onClick={() => setActiveImage('/images/saudagar_flacon_box.png')}
                className={`w-20 h-20 sm:w-24 sm:h-24 border ${
                  activeImage.includes('flacon_box') ? 'border-[#111111] ring-1 ring-[#111111]' : 'border-[#111111]/40'
                } bg-transparent p-1.5 flex items-center justify-center transition-all`}
                aria-label="View Packaging Box"
              >
                <img
                  src="/images/saudagar_flacon_box.png"
                  alt="Packaging Box View"
                  className="w-full h-full object-contain"
                />
              </button>
            </div>

          </div>

          {/* Right Column: Product Details & Purchase Form */}
          <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-between bg-[#ECEBE6]">
            <div>
              {/* Highlighting Script Accent */}
              <span className="font-script text-2xl sm:text-3xl text-[#C4823F] font-normal tracking-wide capitalize block mb-1 select-none">
                Artisanal Haute Parfumerie
              </span>

              {/* Product Title (Serif) */}
              <h1 className="font-serif text-3xl sm:text-4xl md:text-[42px] font-normal tracking-tight text-[#111111] leading-tight">
                {product.name}
              </h1>

              {/* Price & Currency */}
              <div className="text-sm sm:text-base font-semibold tracking-wide text-[#111111] mt-3">
                {formatPrice(unitPrice, activeCurrency)}
              </div>

              {/* Tax Included Note */}
              <p className="text-[11px] text-[#666666] mt-0.5 mb-6">
                Tax included.
              </p>

              {/* Description */}
              <p className="text-xs sm:text-[13px] text-[#333333] leading-relaxed mb-8 max-w-lg font-light">
                {product.description ||
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'}
              </p>

              {/* Size Selector */}
              <div className="mb-6">
                <label className="block text-[11px] text-[#222222] font-medium tracking-wide mb-2.5">
                  Size
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedSizeMl(50)}
                    className={`rounded-full px-5 py-1.5 text-xs font-normal transition-all ${
                      selectedSizeMl === 50
                        ? 'bg-[#111111] text-white shadow-sm'
                        : 'border border-[#999999] text-[#111111] hover:border-[#111111]'
                    }`}
                  >
                    50ml
                  </button>

                  <button
                    onClick={() => setSelectedSizeMl(100)}
                    className={`rounded-full px-5 py-1.5 text-xs font-normal transition-all ${
                      selectedSizeMl === 100
                        ? 'bg-[#111111] text-white shadow-sm'
                        : 'border border-[#999999] text-[#111111] hover:border-[#111111]'
                    }`}
                  >
                    100ml
                  </button>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="mb-8">
                <label className="block text-[11px] text-[#222222] font-medium tracking-wide mb-2.5">
                  Quantity
                </label>
                <div className="inline-flex items-center border border-[#999999] bg-transparent text-xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-1.5 text-[#555555] hover:text-[#111111] transition-colors"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="px-4 py-1.5 text-xs font-normal text-[#111111] min-w-[32px] text-center select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3.5 py-1.5 text-[#555555] hover:text-[#111111] transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-10">
                {/* ADD TO CART */}
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-[#EFECE6] hover:bg-[#E2DDD3] border border-[#111111] text-[#111111] text-xs font-medium tracking-[0.2em] uppercase py-3.5 transition-all text-center"
                >
                  ADD TO CART
                </button>

                {/* BUY IT NOW */}
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-[#111111] hover:bg-[#2B2B2B] text-white text-xs font-medium tracking-[0.2em] uppercase py-3.5 transition-all text-center shadow-md"
                >
                  BUY IT NOW
                </button>
              </div>

              {/* Accordions (INGREDIENTS & USE & STORAGE) */}
              <div className="border-t border-[#111111] divide-y divide-[#111111]">
                
                {/* Accordion 1: INGREDIENTS */}
                <div className="py-3.5">
                  <button
                    onClick={() => toggleAccordion('ingredients')}
                    className="w-full flex items-center justify-between text-left text-xs font-bold tracking-[0.16em] uppercase text-[#111111]"
                  >
                    <span>INGREDIENTS</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform duration-200 ${
                        openAccordion === 'ingredients' ? 'rotate-180' : ''
                      }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {openAccordion === 'ingredients' && (
                    <div className="mt-3 text-xs text-[#444444] font-light leading-relaxed">
                      Alcohol Denat., Parfum (Fragrance), Aqua (Water), Limonene, Linalool, Citronellol, Geraniol, Coumarin, Citral, Benzyl Benzoate, Eugenol, Farnesol. Distilled with pure 35%+ fragrance concentration in Dubai.
                    </div>
                  )}
                </div>

                {/* Accordion 2: USE & STORAGE */}
                <div className="py-3.5">
                  <button
                    onClick={() => toggleAccordion('storage')}
                    className="w-full flex items-center justify-between text-left text-xs font-bold tracking-[0.16em] uppercase text-[#111111]"
                  >
                    <span>USE &amp; STORAGE</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform duration-200 ${
                        openAccordion === 'storage' ? 'rotate-180' : ''
                      }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {openAccordion === 'storage' && (
                    <div className="mt-3 text-xs text-[#444444] font-light leading-relaxed">
                      Apply onto pulse points: wrists, inner elbows, and base of neck. Store flacon upright in a dry, cool atmosphere away from direct sunlight to preserve rare botanical essences.
                    </div>
                  )}
                </div>

                {/* Accordion 3: 24K GOLD FLACON ENGRAVING */}
                <div className="py-3.5">
                  <button
                    onClick={() => toggleAccordion('engraving')}
                    className="w-full flex items-center justify-between text-left text-xs font-bold tracking-[0.16em] uppercase text-[#111111]"
                  >
                    <span>24K GOLD FLACON ENGRAVING</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform duration-200 ${
                        openAccordion === 'engraving' ? 'rotate-180' : ''
                      }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {openAccordion === 'engraving' && (
                    <div className="mt-3 text-xs text-[#444444] space-y-2">
                      <p className="font-light">
                        Complimentary bespoke initials or date laser-etched in gold leaf foil:
                      </p>
                      <input
                        type="text"
                        maxLength={20}
                        value={engraving}
                        onChange={(e) => setEngraving(e.target.value)}
                        placeholder="ENTER INITIALS (E.G. S.P)"
                        className="w-full bg-white border border-[#999999] px-3 py-2 text-xs text-[#111111] uppercase tracking-wider focus:outline-none focus:border-black"
                      />
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. TWO-COLUMN FEATURE STRIP (REMINDS US OF | DERMATOLOGIST APPROVED) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 pb-12">
        <div className="border border-[#111111] grid grid-cols-1 md:grid-cols-2 bg-[#ECEBE6]">
          
          {/* Left Column: REMINDS US OF */}
          <div className="p-8 sm:p-12 md:border-r border-[#111111]">
            <h3 className="font-bold text-xs uppercase tracking-[0.16em] text-[#111111] mb-3">
              REMINDS US OF
            </h3>
            <p className="text-xs sm:text-[13px] text-[#444444] font-light leading-relaxed">
              Fusce est purus, pellentesque vel tortor ac, lobortis suscipit massa. Sed vulputate pretium turpis, ac fringilla diam hendrerit eget. In vulputate tortor vel orci faucibus, in pretium nisl sollicitudin. Duis varius et eros non condimentum.
            </p>
          </div>

          {/* Right Column: DERMATOLOGIST APPROVED */}
          <div className="p-8 sm:p-12">
            <h3 className="font-bold text-xs uppercase tracking-[0.16em] text-[#111111] mb-3">
              DERMATOLOGIST APPROVED
            </h3>
            <p className="text-xs sm:text-[13px] text-[#444444] font-light leading-relaxed">
              Nam laoreet commodo lacinia. Sed tempor sollicitudin lectus sed mattis. Mauris eu erat non lorem mollis iaculis. Nullam pellentesque diam at feugiat varius. Aenean lectus velit, porta ullamcorper molestie tristique, cursus a dolor.
            </p>
          </div>

        </div>
      </section>

      {/* 5. "You might also like" SECTION (4-Column Grid with Amber/Gold Bottom Banner) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10">
        <h2 className="font-serif text-2xl sm:text-3xl text-center text-[#111111] mb-8 font-light">
          You might also like
        </h2>

        <div className="border border-[#111111] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#ECEBE6]">
          {recommendedProducts.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onSelectProduct(item.id)}
              className={`flex flex-col justify-between cursor-pointer group transition-all ${
                idx < 3 ? 'lg:border-r border-[#111111]' : ''
              } ${idx % 2 === 0 ? 'sm:border-r border-[#111111] lg:border-r' : ''}`}
            >
              {/* Product Bottle Image Area */}
              <div className="p-8 sm:p-10 flex items-center justify-center min-h-[280px] bg-[#ECEBE6] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="max-h-[220px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Bottom Amber/Gold Banner Tab */}
              <div className="bg-[#C4823F] px-4 py-3 text-white transition-colors group-hover:bg-[#B57432]">
                <div className="font-bold text-[11px] sm:text-xs tracking-[0.14em] uppercase text-white truncate">
                  {item.name}
                </div>
                <div className="text-[10px] tracking-wider text-white/95 mt-0.5">
                  FROM {item.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. EDITORIAL LIFESTYLE BANNER ("More than fragrance") */}
      <section className="relative w-full min-h-[480px] sm:min-h-[560px] flex items-center justify-center overflow-hidden border-t border-b border-[#111111] my-10">
        <img
          src="/images/saudagar_more_than_fragrance.jpg"
          alt="Saudagar Perfume Ritual"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#F4F3EE]/40 backdrop-blur-[1px]" />

        {/* Content Box */}
        <div className="relative z-10 text-center max-w-2xl px-6 py-12">
          <span className="font-script text-3xl sm:text-4xl text-[#C4823F] font-normal tracking-wide capitalize block mb-1 select-none">
            The Living Essence
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-[#111111] mb-3">
            More than fragrance
          </h2>
          <p className="text-xs sm:text-sm text-[#222222] font-light leading-relaxed mb-6 max-w-lg mx-auto">
            Aenean auctor metus non ante ullamcorper rutrum. Morbi porttitor lorem sit amet urna fermentum lobortis.
          </p>
          <button
            onClick={() => {
              onNavigateHome();
              setTimeout(() => {
                const el = document.getElementById('perfumer-story-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="inline-block bg-[#C4823F] hover:bg-[#B57432] text-white text-xs font-semibold tracking-[0.2em] uppercase px-8 py-3 transition-all shadow-md"
          >
            OUR STORY
          </button>
        </div>
      </section>

      {/* 7. EDITORIAL GRID FOOTER */}
      <footer className="border-t border-[#111111] bg-[#ECEBE6] pt-14 pb-10 px-6 sm:px-10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">
          
          {/* Column 1: Brand Title & Socials (md:col-span-4) */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="font-serif text-2xl sm:text-3xl tracking-[0.16em] uppercase text-[#111111] font-light">
              SAUDAGAR &amp;<br />PERFUMES
            </h3>
            
            {/* Social Icons */}
            <div className="flex items-center gap-4 text-[#111111] pt-2">
              {/* Pinterest */}
              <a
                href="#pinterest"
                onClick={(e) => { e.preventDefault(); alert('Pinterest: @saudagarperfumes'); }}
                className="hover:opacity-60 transition-opacity"
                aria-label="Pinterest"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.373-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="#instagram"
                onClick={(e) => { e.preventDefault(); alert('Instagram: @saudagarperfumes'); }}
                className="hover:opacity-60 transition-opacity"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="#tiktok"
                onClick={(e) => { e.preventDefault(); alert('TikTok: @saudagarperfumes'); }}
                className="hover:opacity-60 transition-opacity"
                aria-label="TikTok"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: OUR FRAGRANCES (md:col-span-3) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold tracking-[0.16em] uppercase text-[#111111]">
              OUR FRAGRANCES
            </h4>
            <p className="text-xs text-[#555555] font-light leading-relaxed">
              Signature scents to take you from day to night.
            </p>
          </div>

          {/* Column 3: EXPLORE (md:col-span-2) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold tracking-[0.16em] uppercase text-[#111111]">
              EXPLORE
            </h4>
            <ul className="space-y-2 text-xs text-[#555555] uppercase tracking-wider font-light">
              <li>
                <button onClick={onNavigateHome} className="hover:text-black transition-colors">
                  SHOP ALL
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigateHome();
                    setTimeout(() => {
                      const el = document.getElementById('perfumer-story-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="hover:text-black transition-colors"
                >
                  ABOUT
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Contact: concierge@saudagarperfumes.com')}
                  className="hover:text-black transition-colors"
                >
                  CONTACT US
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Sustainability: 100% recyclable crystal flacons and wild sustainably harvested botanicals.')}
                  className="hover:text-black transition-colors"
                >
                  SUSTAINABILITY
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: INFORMATION (md:col-span-3) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold tracking-[0.16em] uppercase text-[#111111]">
              INFORMATION
            </h4>
            <ul className="space-y-2 text-xs text-[#555555] uppercase tracking-wider font-light">
              <li>
                <button
                  onClick={() => alert('FAQs:\n• Concentrated extraits with 35%+ pure botanical oil.\n• 14-16 hours longevity.')}
                  className="hover:text-black transition-colors"
                >
                  FAQS
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Privacy Policy: All customer and payment details are strictly encrypted.')}
                  className="hover:text-black transition-colors"
                >
                  PRIVACY POLICY
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Returns Policy: 30-day unopened exchange guarantee.')}
                  className="hover:text-black transition-colors"
                >
                  RETURNS POLICY
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Terms of Service: Handcrafted in Dubai under UAE luxury cosmetic regulations.')}
                  className="hover:text-black transition-colors"
                >
                  TERMS OF SERVICE
                </button>
              </li>
            </ul>
          </div>

        </div>
      </footer>

      {/* 8. BOTTOM BLACK BAR */}
      <div className="bg-[#111111] text-white/60 text-[10px] tracking-[0.18em] py-3 text-center uppercase">
        © 2026, Saudagar Perfumes.
      </div>

    </div>
  );
}
