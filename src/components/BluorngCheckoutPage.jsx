import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, ALL_PRODUCTS } from '../data/bluorngSaudagarData.js';

export default function BluorngCheckoutPage({
  cart = [],
  checkoutData,
  activeCurrency = 'INR',
  theme = 'light',
  onToggleTheme,
  onNavigateHome,
  onNavigateCollection,
  onOrderSuccess,
  onClearCart
}) {
  const [step, setStep] = useState('shipping'); // 'shipping' | 'payment' | 'confirmation'

  // Form State
  const [email, setEmail] = useState('connoisseur@saudagar.com');
  const [phone, setPhone] = useState('+91 98200 44211');
  const [firstName, setFirstName] = useState('Aditya');
  const [lastName, setLastName] = useState('Verma');
  const [address, setAddress] = useState('42 Altamount Road, Malabar Hill');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pinCode, setPinCode] = useState('400026');
  const [shippingMethod, setShippingMethod] = useState('express'); // 'express' | 'priority'
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'cod'
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  // Generated Order state & persistent confirmed snapshot
  const [orderId, setOrderId] = useState('');
  const [confirmedItems, setConfirmedItems] = useState([]);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // Derive items from checkoutData or fallback directly to cart
  const items = checkoutData?.items && checkoutData.items.length > 0 ? checkoutData.items : cart;

  // Calculate pricing
  const subtotal = items.reduce((sum, item) => {
    const prod = ALL_PRODUCTS.find((p) => p.id === (item.productId || item.id));
    const price = item.price || (prod ? prod.price : 5500);
    return sum + price * (item.quantity || 1);
  }, 0);

  const shippingCost = shippingMethod === 'priority' ? 500 : 0;
  const discountAmount = appliedDiscount > 0 ? Math.round(subtotal * (appliedDiscount / 100)) : (checkoutData?.discount || 0);
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'SAUDAGAR10') {
      setAppliedDiscount(10);
    } else if (promoCode.trim().toUpperCase() === 'ROYALVIP') {
      setAppliedDiscount(15);
    } else {
      alert('Invalid promotional code. Try SAUDAGAR10 for 10% privilege.');
    }
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    const newOrderId = `SAU-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(newOrderId);
    setConfirmedItems(items.length > 0 ? [...items] : [ALL_PRODUCTS[0]]);
    setConfirmedTotal(total);
    setStep('confirmation');

    if (onOrderSuccess) {
      onOrderSuccess({
        orderId: newOrderId,
        email,
        items,
        total
      });
    }

    if (onClearCart) {
      onClearCart();
    }
  };

  const handleCopyOrderId = () => {
    navigator.clipboard?.writeText(orderId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Display items for confirmation screen (fall back gracefully if needed)
  const displayItems = confirmedItems.length > 0 ? confirmedItems : items.length > 0 ? items : [ALL_PRODUCTS[0]];
  const displayTotal = confirmedTotal > 0 ? confirmedTotal : total > 0 ? total : 5500;

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#0B0A0D] text-[#111111] dark:text-white transition-colors duration-300 select-none pb-24">
      
      {/* ================= DEDICATED DISTRACTION-FREE CHECKOUT HEADER ================= */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0B0A0D]/95 backdrop-blur-md border-b border-[#EAEAEA] dark:border-white/10 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Return to Shopping */}
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] font-medium text-[#777777] dark:text-[#A09D96] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
          >
            <span>←</span>
            <span className="hidden sm:inline">Return to Shopping</span>
            <span className="sm:hidden">Back</span>
          </button>

          {/* Center: Official Saudagar Crest Logo */}
          <div
            onClick={onNavigateHome}
            className="cursor-pointer hover:opacity-85 transition-opacity"
            title="Saudagar Perfumers Home"
          >
            <img
              src="/images/saudagar_logo_black.png"
              alt="Saudagar Perfumers"
              className="h-[21px] xs:h-[23px] sm:h-7 w-auto object-contain dark:hidden block"
            />
            <img
              src="/images/saudagar_logo_gold.png"
              alt="Saudagar Perfumers"
              className="h-[21px] xs:h-[23px] sm:h-7 w-auto object-contain hidden dark:block"
            />
          </div>

          {/* Right: Security Badge & Theme Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-[#888888] dark:text-[#A09D96]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>256-Bit SSL</span>
            </div>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#888888] dark:text-[#A09D96] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ================= MAIN CHECKOUT CONTENT ================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        
        {/* ================= STEP 3: DEDICATED FULL-PAGE CONFIRMATION DOSSIER ================= */}
        {step === 'confirmation' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mx-auto space-y-8"
          >
            {/* Header Hero Stamp */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs border border-emerald-200 dark:border-emerald-800/40"
              >
                ✓
              </motion.div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.24em] font-medium text-[#C4823F] dark:text-[#ECC86A] block">
                  Order Confirmed · Dispatched to Royal Atelier
                </span>
                <h1 className="text-[28px] sm:text-[34px] font-normal uppercase tracking-tight text-[#111111] dark:text-white mt-1">
                  Thank You, {firstName}.
                </h1>
                <p className="text-[12.5px] text-[#777777] dark:text-[#A09D96] tracking-wide mt-1.5 flex flex-wrap items-center justify-center gap-2">
                  <span>Your formulation allocation reference is</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#F4F3F0] dark:bg-[#1A1820] text-[#111111] dark:text-white font-mono font-bold text-[12px] whitespace-nowrap shrink-0 border border-[#E0DDD5] dark:border-white/10">
                    <span>{orderId}</span>
                    <button
                      type="button"
                      onClick={handleCopyOrderId}
                      className="text-[10px] uppercase font-sans text-[#C4823F] dark:text-[#ECC86A] hover:opacity-80 cursor-pointer ml-1"
                      title="Copy Order ID"
                    >
                      {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </span>
                </p>
                <p className="text-[11.5px] text-emerald-700 dark:text-emerald-400 font-medium mt-2">
                  ✓ Confirmation receipt, tax invoice, and consignment tracking link dispatched to {email}.
                </p>
              </div>
            </div>

            {/* Atelier Craftsmanship Timeline */}
            <div className="rounded-2xl bg-[#F8F7F5] dark:bg-[#141318] p-5 sm:p-6 border border-[#EAE8E2] dark:border-white/10 transition-colors">
              <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-[#888888] dark:text-[#88857F] block mb-4">
                Fulfillment Protocol · Royal Atelier
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div className="flex flex-col gap-1 border-l-2 border-[#111111] dark:border-[#D4AF37] pl-3">
                  <span className="text-[10px] uppercase font-bold text-[#111111] dark:text-[#ECC86A]">1. Order Placed</span>
                  <span className="text-[11px] text-[#777777] dark:text-[#A09D96] font-light">Payment Verified</span>
                </div>
                <div className="flex flex-col gap-1 border-l-2 border-[#111111] dark:border-[#D4AF37] pl-3">
                  <span className="text-[10px] uppercase font-bold text-[#111111] dark:text-[#ECC86A]">2. Atelier Compounding</span>
                  <span className="text-[11px] text-[#777777] dark:text-[#A09D96] font-light">Hand-Numbered Flacon</span>
                </div>
                <div className="flex flex-col gap-1 border-l-2 border-[#CCCCCC] dark:border-white/20 pl-3">
                  <span className="text-[10px] uppercase font-medium text-[#888888] dark:text-[#88857F]">3. Insured Air Dispatch</span>
                  <span className="text-[11px] text-[#888888] dark:text-[#88857F] font-light">Tamper-Proof Box</span>
                </div>
                <div className="flex flex-col gap-1 border-l-2 border-[#CCCCCC] dark:border-white/20 pl-3">
                  <span className="text-[10px] uppercase font-medium text-[#888888] dark:text-[#88857F]">4. White-Glove Handover</span>
                  <span className="text-[11px] text-[#888888] dark:text-[#88857F] font-light">Malabar Hill, Mumbai</span>
                </div>
              </div>
            </div>

            {/* Allocated Formulations Showcase */}
            <div className="rounded-2xl bg-[#F8F7F5] dark:bg-[#141318] p-5 sm:p-6 border border-[#EAE8E2] dark:border-white/10 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EAEAEA] dark:border-white/10 gap-1.5 sm:gap-0">
                <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-[#888888] dark:text-[#88857F]">
                  Allocated Flacons ({displayItems.length})
                </span>
                <span className="text-[11px] text-[#C4823F] dark:text-[#ECC86A] font-medium">
                  + Complimentary 2ml Discovery Vial Included
                </span>
              </div>

              <div className="divide-y divide-[#EAEAEA] dark:divide-white/10 my-2">
                {displayItems.map((item, idx) => {
                  const prod = ALL_PRODUCTS.find((p) => p.id === (item.productId || item.id));
                  const image = item.image || prod?.images?.[0] || prod?.image || '/images/crystal_square_flacon.png';
                  const name = item.name || prod?.name || 'Saudagar Formulation';
                  const itemPrice = item.price || (prod ? prod.price : 5500);

                  return (
                    <div key={`${item.productId || item.id}-${idx}`} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-lg bg-white dark:bg-[#1C1A22] flex items-center justify-center p-2 shrink-0 border border-[#ECEAE5] dark:border-white/10">
                          <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-contain filter drop-shadow-xs"
                          />
                        </div>
                        <div>
                          <h4 className="text-[13px] font-medium uppercase text-[#111111] dark:text-white line-clamp-1">
                            {name}
                          </h4>
                          <p className="text-[11px] text-[#888888] dark:text-[#A09D96] mt-0.5">
                            {item.size || '50 ml'} · Quantity: {item.quantity || 1}
                          </p>
                        </div>
                      </div>

                      <span className="text-[13px] font-semibold text-[#111111] dark:text-white tabular-nums">
                        {formatPrice(itemPrice * (item.quantity || 1), activeCurrency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destination & Payment Receipt Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Left Box: Destination */}
              <div className="rounded-2xl bg-[#F8F7F5] dark:bg-[#141318] p-5 sm:p-6 border border-[#EAE8E2] dark:border-white/10 text-[12px] space-y-2.5">
                <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-[#888888] dark:text-[#88857F] block mb-1">
                  Delivery Destination
                </span>
                <p className="font-semibold text-[#111111] dark:text-white text-[13px]">
                  {firstName} {lastName}
                </p>
                <p className="text-[#666666] dark:text-[#A09D96] leading-relaxed">
                  {address}, {city}, {state} - {pinCode}
                </p>
                <p className="text-[#777777] dark:text-[#88857F] pt-1">
                  Mobile: {phone}
                </p>
                <p className="text-[#777777] dark:text-[#88857F]">
                  Courier: {shippingMethod === 'priority' ? 'Priority White-Glove (Next Day AM)' : 'Standard Insured Air Courier'}
                </p>
              </div>

              {/* Right Box: Payment Summary */}
              <div className="rounded-2xl bg-[#F8F7F5] dark:bg-[#141318] p-5 sm:p-6 border border-[#EAE8E2] dark:border-white/10 text-[12px] space-y-2.5">
                <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-[#888888] dark:text-[#88857F] block mb-1">
                  Payment Dossier
                </span>
                <div className="flex justify-between text-[#666666] dark:text-[#A09D96]">
                  <span>Payment Channel:</span>
                  <span className="font-medium text-[#111111] dark:text-white">
                    {paymentMethod === 'upi' ? 'UPI Instant Payment' : paymentMethod === 'card' ? 'Credit / Debit Card' : 'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex justify-between text-[#666666] dark:text-[#A09D96]">
                  <span>Courier Transit:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">COMPLIMENTARY</span>
                </div>
                <div className="flex justify-between text-[#666666] dark:text-[#A09D96]">
                  <span>Discovery Vial Privilege:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">INCLUDED</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#EAEAEA] dark:border-white/10 text-[14px]">
                  <span className="font-medium uppercase tracking-wider text-[#111111] dark:text-white">Total Amount Paid:</span>
                  <span className="font-bold text-[#111111] dark:text-[#ECC86A] tabular-nums">
                    {formatPrice(displayTotal, activeCurrency)}
                  </span>
                </div>
              </div>

            </div>

            {/* Action CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={onNavigateHome}
                className="w-full sm:w-auto px-10 py-3.5 bg-[#111111] hover:bg-[#C4823F] dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] text-white dark:text-[#0B0A0D] text-[11px] font-medium uppercase tracking-[0.16em] rounded-full transition-colors cursor-pointer shadow-md text-center"
              >
                Return to Saudagar Home
              </button>

              <button
                type="button"
                onClick={() => onNavigateCollection && onNavigateCollection('all')}
                className="w-full sm:w-auto px-8 py-3.5 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 border border-[#CCCCCC] dark:border-white/20 text-[#111111] dark:text-white text-[11px] font-medium uppercase tracking-[0.16em] rounded-full transition-colors cursor-pointer text-center"
              >
                Explore More Fragrances →
              </button>
            </div>
          </motion.div>
        ) : items.length === 0 ? (
          /* Empty Bag State */
          <div className="py-24 text-center max-w-md mx-auto">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C4823F] dark:text-[#ECC86A] font-semibold block mb-2">
              Privilege Bag
            </span>
            <h2 className="text-[22px] font-normal uppercase tracking-tight text-[#111111] dark:text-white">
              Your bag is currently empty
            </h2>
            <p className="text-[12px] text-[#777777] dark:text-[#A09D96] mt-2 font-light leading-relaxed">
              Explore our compounded extraits, aged Assam oud, and sacred Taif damask rose attars to proceed to checkout.
            </p>
            <button
              onClick={() => onNavigateCollection && onNavigateCollection('all')}
              className="mt-6 px-8 py-3 bg-[#111111] hover:bg-[#C4823F] dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] text-white dark:text-[#0B0A0D] text-[11px] font-medium uppercase tracking-[0.16em] rounded-full transition-colors cursor-pointer shadow-md"
            >
              Explore Collections →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* ================= LEFT COLUMN: STEPPER & FORMS (7 COLS) ================= */}
            <div className="lg:col-span-7">
              
              {/* Checkout Progress Stepper */}
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] font-medium mb-8 pb-4 border-b border-[#EAEAEA] dark:border-white/10">
                <span className={step === 'shipping' ? 'text-[#111111] dark:text-white font-semibold' : 'text-[#888888] dark:text-[#A09D96]'}>
                  1. Delivery Address
                </span>
                <span className="text-[#CCCCCC] dark:text-white/20">/</span>
                <span className={step === 'payment' ? 'text-[#111111] dark:text-white font-semibold' : 'text-[#888888] dark:text-[#A09D96]'}>
                  2. Payment Method
                </span>
              </div>

              {/* ================= STEP 1: SHIPPING & ADDRESS ================= */}
              {step === 'shipping' && (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep('payment');
                  }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-[18px] sm:text-[20px] font-normal uppercase tracking-[0.02em] text-[#111111] dark:text-white">
                      Contact Information
                    </h2>
                    <p className="text-[11.5px] text-[#777777] dark:text-[#A09D96] mt-0.5 font-light">
                      Order dispatch confirmation and live courier tracking will be sent here.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#666666] dark:text-[#A09D96] mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[#111111] dark:text-white outline-none focus:border-[#C4823F] dark:focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#666666] dark:text-[#A09D96] mb-1.5">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[#111111] dark:text-white outline-none focus:border-[#C4823F] dark:focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <h2 className="text-[18px] sm:text-[20px] font-normal uppercase tracking-[0.02em] text-[#111111] dark:text-white">
                      Delivery Destination
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#666666] dark:text-[#A09D96] mb-1.5">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[#111111] dark:text-white outline-none focus:border-[#C4823F] dark:focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#666666] dark:text-[#A09D96] mb-1.5">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[#111111] dark:text-white outline-none focus:border-[#C4823F] dark:focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="text-[12px]">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#666666] dark:text-[#A09D96] mb-1.5">
                      Street Address & Residence *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House / Flat No., Building, Street Name"
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[#111111] dark:text-white outline-none focus:border-[#C4823F] dark:focus:border-[#D4AF37] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[12px]">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#666666] dark:text-[#A09D96] mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[#111111] dark:text-white outline-none focus:border-[#C4823F] dark:focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#666666] dark:text-[#A09D96] mb-1.5">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[#111111] dark:text-white outline-none focus:border-[#C4823F] dark:focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#666666] dark:text-[#A09D96] mb-1.5">
                        PIN / Postal Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[#111111] dark:text-white outline-none focus:border-[#C4823F] dark:focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Delivery Service Tier */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#666666] dark:text-[#A09D96] mb-2.5">
                      Select Courier Protocol
                    </label>
                    <div className="space-y-2.5 text-[12px]">
                      <label
                        onClick={() => setShippingMethod('express')}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                          shippingMethod === 'express'
                            ? 'border-[#111111] dark:border-[#D4AF37] bg-[#F9F8F5] dark:bg-[#17161D]'
                            : 'border-[#EAEAEA] dark:border-white/10 hover:border-[#CCCCCC]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={shippingMethod === 'express'}
                            onChange={() => setShippingMethod('express')}
                            className="accent-[#111111] dark:accent-[#D4AF37]"
                          />
                          <div>
                            <span className="font-medium text-[#111111] dark:text-white block">
                              Standard Insured Air Courier (2-3 Days)
                            </span>
                            <span className="text-[11px] text-[#777777] dark:text-[#A09D96]">
                              Dispatched in tamper-proof signature black presentation box
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                          COMPLIMENTARY
                        </span>
                      </label>

                      <label
                        onClick={() => setShippingMethod('priority')}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                          shippingMethod === 'priority'
                            ? 'border-[#111111] dark:border-[#D4AF37] bg-[#F9F8F5] dark:bg-[#17161D]'
                            : 'border-[#EAEAEA] dark:border-white/10 hover:border-[#CCCCCC]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={shippingMethod === 'priority'}
                            onChange={() => setShippingMethod('priority')}
                            className="accent-[#111111] dark:accent-[#D4AF37]"
                          />
                          <div>
                            <span className="font-medium text-[#111111] dark:text-white block">
                              Priority White-Glove Concierge (Next Day AM)
                            </span>
                            <span className="text-[11px] text-[#777777] dark:text-[#A09D96]">
                              Hand-carried air delivery with scheduled delivery window
                            </span>
                          </div>
                        </div>
                        <span className="font-medium text-[#111111] dark:text-white text-[11.5px]">
                          +{formatPrice(500, activeCurrency)}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-9 py-3.5 bg-[#111111] hover:bg-[#C4823F] dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] text-white dark:text-[#0B0A0D] text-[11px] font-medium uppercase tracking-[0.16em] rounded-full transition-colors cursor-pointer shadow-md"
                    >
                      Continue to Payment Method →
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ================= STEP 2: PAYMENT METHOD ================= */}
              {step === 'payment' && (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handlePlaceOrder}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[18px] sm:text-[20px] font-normal uppercase tracking-[0.02em] text-[#111111] dark:text-white">
                        Payment Selection
                      </h2>
                      <p className="text-[11.5px] text-[#777777] dark:text-[#A09D96] mt-0.5 font-light">
                        All transactions are encrypted with 256-bit bank-grade TLS.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('shipping')}
                      className="text-[11px] uppercase tracking-wider text-[#C4823F] dark:text-[#ECC86A] font-medium hover:underline cursor-pointer"
                    >
                      ← Edit Address
                    </button>
                  </div>

                  {/* Destination Review Box */}
                  <div className="p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#141318] border border-[#EAEAEA] dark:border-white/10 text-[11.5px] flex items-center justify-between">
                    <div>
                      <span className="text-[#888888] dark:text-[#88857F] block text-[10px] uppercase tracking-wider">
                        Delivering To:
                      </span>
                      <span className="font-medium text-[#111111] dark:text-white">
                        {firstName} {lastName} · {address}, {city} ({pinCode})
                      </span>
                    </div>
                    <span className="text-[11px] text-[#888888] dark:text-[#88857F]">
                      {shippingMethod === 'priority' ? 'Next Day AM' : '2-3 Days'}
                    </span>
                  </div>

                  {/* Payment Choices */}
                  <div className="space-y-3 text-[12px]">
                    {/* UPI Option */}
                    <label
                      onClick={() => setPaymentMethod('upi')}
                      className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-[#111111] dark:border-[#D4AF37] bg-[#F9F8F5] dark:bg-[#17161D]'
                          : 'border-[#EAEAEA] dark:border-white/10 hover:border-[#CCCCCC]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-medium text-[#111111] dark:text-white">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === 'upi'}
                            onChange={() => setPaymentMethod('upi')}
                            className="accent-[#111111] dark:accent-[#D4AF37]"
                          />
                          <span>UPI Instant Payment (GPay, PhonePe, Paytm, QR)</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-semibold">
                          RECOMMENDED
                        </span>
                      </div>
                      {paymentMethod === 'upi' && (
                        <p className="mt-2 text-[11px] text-[#777777] dark:text-[#A09D96] pl-6 font-light">
                          You will be prompted to approve the request on your UPI app or scan the QR code.
                        </p>
                      )}
                    </label>

                    {/* Credit / Debit Card */}
                    <label
                      onClick={() => setPaymentMethod('card')}
                      className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
                        paymentMethod === 'card'
                          ? 'border-[#111111] dark:border-[#D4AF37] bg-[#F9F8F5] dark:bg-[#17161D]'
                          : 'border-[#EAEAEA] dark:border-white/10 hover:border-[#CCCCCC]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-medium text-[#111111] dark:text-white">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === 'card'}
                            onChange={() => setPaymentMethod('card')}
                            className="accent-[#111111] dark:accent-[#D4AF37]"
                          />
                          <span>Credit / Debit Card (Visa, Mastercard, Amex, RuPay)</span>
                        </div>
                        <span className="text-[10px] text-[#888888] dark:text-[#A09D96]">
                          256-Bit SSL
                        </span>
                      </div>
                    </label>

                    {/* Cash on Delivery */}
                    <label
                      onClick={() => setPaymentMethod('cod')}
                      className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-[#111111] dark:border-[#D4AF37] bg-[#F9F8F5] dark:bg-[#17161D]'
                          : 'border-[#EAEAEA] dark:border-white/10 hover:border-[#CCCCCC]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-medium text-[#111111] dark:text-white">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === 'cod'}
                            onChange={() => setPaymentMethod('cod')}
                            className="accent-[#111111] dark:accent-[#D4AF37]"
                          />
                          <span>Cash on Delivery (Available for PIN: {pinCode})</span>
                        </div>
                        <span className="text-[10px] text-[#888888] dark:text-[#A09D96]">
                          India Only
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep('shipping')}
                      className="text-[11px] font-medium tracking-wider uppercase text-[#777777] dark:text-[#A09D96] hover:text-[#111111] dark:hover:text-white cursor-pointer"
                    >
                      ← Back to Address
                    </button>

                    <button
                      type="submit"
                      className="px-9 py-3.5 bg-[#111111] hover:bg-[#C4823F] dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] text-white dark:text-[#0B0A0D] text-[11px] font-medium uppercase tracking-[0.16em] rounded-full transition-colors cursor-pointer shadow-md"
                    >
                      Authorize Order · {formatPrice(total, activeCurrency)}
                    </button>
                  </div>
                </motion.form>
              )}

            </div>

            {/* ================= RIGHT COLUMN: STICKY ORDER SUMMARY (5 COLS) ================= */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 rounded-2xl bg-[#F8F7F5] dark:bg-[#141318] p-6 sm:p-7 border border-[#EAE8E2] dark:border-white/10 transition-colors">
                
                <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA] dark:border-white/10">
                  <h3 className="text-[14px] font-medium uppercase tracking-[0.08em] text-[#111111] dark:text-white">
                    Order Summary
                  </h3>
                  <span className="text-[11px] text-[#888888] dark:text-[#A09D96]">
                    {items.length} Item{items.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-[#EAEAEA] dark:divide-white/10 max-h-[280px] overflow-y-auto pr-1 scrollbar-none my-2">
                  {items.map((item, idx) => {
                    const prod = ALL_PRODUCTS.find((p) => p.id === (item.productId || item.id));
                    const image = item.image || prod?.images?.[0] || prod?.image || '/images/crystal_square_flacon.png';
                    const name = item.name || prod?.name || 'Saudagar Formulation';
                    const itemPrice = item.price || (prod ? prod.price : 5500);

                    return (
                      <div key={`${item.productId || item.id}-${idx}`} className="py-3 flex items-center gap-3">
                        <div className="w-14 h-14 rounded-md bg-white dark:bg-[#1A1820] flex items-center justify-center p-1.5 shrink-0 border border-[#ECEAE5] dark:border-white/10">
                          <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-contain filter drop-shadow-xs"
                          />
                        </div>

                        <div className="flex-1 min-w-0 text-[11.5px]">
                          <h4 className="font-normal uppercase tracking-wide text-[#111111] dark:text-white line-clamp-1">
                            {name}
                          </h4>
                          <p className="text-[10.5px] text-[#888888] dark:text-[#A09D96]">
                            {item.size || '50 ml'} · Qty: {item.quantity || 1}
                          </p>
                        </div>

                        <span className="text-[12px] font-medium text-[#111111] dark:text-white tabular-nums shrink-0">
                          {formatPrice(itemPrice * (item.quantity || 1), activeCurrency)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="pt-3 pb-2 flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="PROMO CODE (E.G. SAUDAGAR10)"
                    className="flex-1 px-3 py-2 text-[10.5px] uppercase tracking-wider rounded-md border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#1B1922] text-[#111111] dark:text-white outline-none focus:border-[#C4823F] dark:focus:border-[#D4AF37]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-wider rounded-md bg-[#111111] text-white dark:bg-white/15 dark:hover:bg-white/25 hover:bg-[#C4823F] transition-colors cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </form>

                {/* Pricing Breakdown */}
                <div className="pt-3 border-t border-[#EAEAEA] dark:border-white/10 space-y-2 text-[11.5px]">
                  <div className="flex justify-between text-[#666666] dark:text-[#A09D96]">
                    <span>Subtotal</span>
                    <span className="text-[#111111] dark:text-white font-medium">{formatPrice(subtotal, activeCurrency)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                      <span>Privilege Discount ({appliedDiscount || 10}%)</span>
                      <span>−{formatPrice(discountAmount, activeCurrency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#666666] dark:text-[#A09D96]">
                    <span>Insured Courier Delivery</span>
                    <span className={shippingCost === 0 ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-[#111111] dark:text-white'}>
                      {shippingCost === 0 ? 'COMPLIMENTARY' : `+${formatPrice(shippingCost, activeCurrency)}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#666666] dark:text-[#A09D96]">
                    <span>Luxury Discovery Sample</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">INCLUDED</span>
                  </div>

                  <div className="flex justify-between text-[14px] font-medium text-[#111111] dark:text-white pt-2 border-t border-[#EAEAEA] dark:border-white/10">
                    <span className="uppercase tracking-wider">Payable Total</span>
                    <span className="font-semibold text-[#111111] dark:text-[#ECC86A] tabular-nums">
                      {formatPrice(total, activeCurrency)}
                    </span>
                  </div>
                </div>

                {/* Trust & Guarantee Badges */}
                <div className="mt-5 pt-4 border-t border-[#EAEAEA] dark:border-white/10 space-y-2 text-[10px] text-[#777777] dark:text-[#88857F] uppercase tracking-wider font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-[#C4823F] dark:text-[#ECC86A]">✦</span>
                    <span>Complimentary 2ml Discovery Vial with every flacon</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C4823F] dark:text-[#ECC86A]">✦</span>
                    <span>Test-First Guarantee: Unopened flacon free refund</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C4823F] dark:text-[#ECC86A]">✦</span>
                    <span>100% Hand-Compounded Artisanal Formulation</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
