import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, ALL_PRODUCTS } from '../data/bluorngSaudagarData.js';

export default function BluorngCartDrawer({
  isOpen,
  onClose,
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  activeCurrency = 'INR',
  onProceedToCheckout
}) {
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const FREE_SHIPPING_THRESHOLD = 3500; // in INR

  // Calculate Subtotal
  const rawSubtotal = cart.reduce((acc, item) => {
    const prod = ALL_PRODUCTS.find((p) => p.id === item.productId);
    const itemPrice = item.price || (prod ? prod.price : 5500);
    return acc + itemPrice * item.quantity;
  }, 0);

  const discountAmount = Math.round((rawSubtotal * discountPercent) / 100);
  const finalTotal = Math.max(0, rawSubtotal - discountAmount);

  // Free shipping calculation
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - rawSubtotal);
  const freeShippingProgress = Math.min(100, (rawSubtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setDiscountError('');
    setDiscountSuccess('');
    const code = promoCode.trim().toUpperCase();

    if (code === 'SAUDAGAR10' || code === 'BLUORNG10') {
      setDiscountPercent(10);
      setDiscountSuccess('10% VIP Atelier discount applied!');
    } else if (code === 'FIRSTORDER') {
      setDiscountPercent(15);
      setDiscountSuccess('15% First Order privilege applied!');
    } else if (code === 'ROYALOUD') {
      setDiscountPercent(20);
      setDiscountSuccess('20% Royal Oud collector discount applied!');
    } else {
      setDiscountError('Invalid promotional voucher code.');
    }
  };

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
          {/* Backdrop Dim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="w-screen max-w-md bg-[#FFFFFF] dark:bg-[#0E0C10] text-[#111111] dark:text-white flex flex-col justify-between shadow-2xl transition-colors duration-300"
            >
          
          {/* ================= HEADER ================= */}
          <div className="p-4 sm:p-5 flex items-center justify-between text-[#111111] dark:text-white">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold tracking-[0.04em] uppercase text-[#111111] dark:text-white">
                Your Shopping Bag
              </h2>
              <span className="text-[12px] text-[#777777] dark:text-white/60 font-medium">
                ({cart.reduce((s, i) => s + i.quantity, 0)})
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#111111] dark:text-white hover:text-[#C4823F] dark:hover:text-[#ECC86A] transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* ================= FREE SHIPPING PROGRESS BAR ================= */}
          <div className="bg-[#FAF9F6] dark:bg-[#141318] p-3.5 text-[11px] text-[#111111] dark:text-white transition-colors">
            <div className="flex items-center justify-between font-semibold tracking-wider uppercase mb-1.5">
              {amountToFreeShipping > 0 ? (
                <span>Add {formatPrice(amountToFreeShipping, activeCurrency)} more for Free Express Courier</span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  ✓ Congratulations! You unlocked Free Worldwide Express Shipping
                </span>
              )}
            </div>
            <div className="w-full h-1.5 bg-[#E5E5E5] dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C4823F] dark:bg-[#D4AF37] transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* ================= CART ITEMS LIST ================= */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#777777]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <p className="text-[13px] font-bold tracking-wider uppercase text-[#111111]">
                  Your Bag is Currently Empty
                </p>
                <p className="text-[11.5px] text-[#777777] max-w-xs">
                  Explore our royal collection of extraits, rare attars, and bespoke crystal flacons.
                </p>
                <button
                  onClick={onClose}
                  className="mt-3 px-6 py-2.5 bg-[#111111] hover:bg-[#C4823F] dark:hover:bg-[#D4AF37] dark:hover:text-[#0B0A0D] text-white text-[11px] font-bold uppercase tracking-wide transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
            ) : (
              cart.map((item, index) => {
                const prod = ALL_PRODUCTS.find((p) => p.id === item.productId);
                const itemImage = prod?.images?.[0] || prod?.image || '/images/crystal_square_flacon.png';
                const itemName = prod?.name || 'Saudagar Extrait';
                const itemPrice = item.price || prod?.price || 5500;

                return (
                  <div
                    key={`${item.productId}-${item.size}-${index}`}
                    className="flex gap-3.5 pb-4"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 aspect-[4/5] bg-[#F7F7F6] dark:bg-[#18171C] flex items-center justify-center p-1.5 overflow-hidden rounded-xs shrink-0 transition-colors">
                      <img
                        src={itemImage}
                        alt={itemName}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between text-[11.5px]">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold uppercase tracking-wider text-[#111111] dark:text-white leading-tight">
                            {itemName}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(index)}
                            className="text-[#999999] dark:text-white/40 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            ✕
                          </button>
                        </div>

                        <p className="text-[10px] text-[#777777] dark:text-white/60 uppercase tracking-wider mt-1">
                          Size: <span className="text-[#111111] dark:text-white font-semibold">{item.size || '50ML'}</span>
                        </p>

                        {item.engraving && (
                          <p className="text-[10px] text-[#C4823F] dark:text-[#ECC86A] font-medium tracking-wide mt-0.5">
                            Engraving: "{item.engraving}"
                          </p>
                        )}
                      </div>

                      {/* Quantity Stepper & Price Row */}
                      <div className="flex items-center justify-between mt-2 pt-1">
                        <div className="flex items-center bg-black/[0.05] dark:bg-white/10 rounded-full overflow-hidden">
                          <button
                            onClick={() => onUpdateQuantity(index, -1)}
                            className="w-6 h-6 flex items-center justify-center text-xs hover:bg-black/[0.08] dark:hover:bg-white/20 transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-[#111111] dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(index, 1)}
                            className="w-6 h-6 flex items-center justify-center text-xs hover:bg-black/[0.08] dark:hover:bg-white/20 transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold text-[12.5px] text-[#111111] dark:text-white">
                          {formatPrice(itemPrice * item.quantity, activeCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ================= FOOTER / PROMO / CHECKOUT ================= */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-white dark:bg-[#0E0C10] text-[#111111] dark:text-white space-y-3.5 transition-colors">
              
              {/* Order Note Toggle */}
              <div>
                <button
                  onClick={() => setIsNoteOpen(!isNoteOpen)}
                  className="text-[10.5px] font-semibold tracking-wider uppercase text-[#777777] dark:text-white/60 hover:text-[#111111] dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <span>{isNoteOpen ? '− Hide Gift Note' : '+ Add Complimentary Gift Note'}</span>
                </button>
                {isNoteOpen && (
                  <textarea
                    rows={2}
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Enter recipient's name or custom gift note for calligraphy card..."
                    className="w-full mt-2 p-2.5 bg-black/[0.05] dark:bg-white/[0.07] text-[#111111] dark:text-white placeholder:text-[#888888] dark:placeholder:text-white/40 text-[11px] rounded-xs outline-none"
                  />
                )}
              </div>

              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="PROMO CODE (e.g. SAUDAGAR10)"
                  className="flex-1 px-3 py-2 bg-black/[0.05] dark:bg-white/[0.07] text-[#111111] dark:text-white placeholder:text-[#888888] dark:placeholder:text-white/40 rounded-xs text-[11px] tracking-wider uppercase outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#111111] hover:bg-[#C4823F] dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] text-white dark:text-[#0B0A0D] text-[10.5px] font-bold uppercase tracking-wide transition-colors rounded-xs cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {discountSuccess && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">
                  ✓ {discountSuccess}
                </p>
              )}
              {discountError && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wide">
                  ✕ {discountError}
                </p>
              )}

              {/* Totals Summary */}
              <div className="space-y-1.5 text-[11.5px] pt-1">
                <div className="flex justify-between text-[#777777] dark:text-white/60">
                  <span>Subtotal</span>
                  <span>{formatPrice(rawSubtotal, activeCurrency)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>VIP Privilege ({discountPercent}%)</span>
                    <span>-{formatPrice(discountAmount, activeCurrency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#777777] dark:text-white/60">
                  <span>Estimated Shipping</span>
                  <span>
                    {amountToFreeShipping === 0 ? 'FREE' : formatPrice(250, activeCurrency)}
                  </span>
                </div>

                <div className="flex justify-between text-[14px] font-bold text-[#111111] dark:text-white pt-1.5">
                  <span className="uppercase tracking-wider">Total</span>
                  <span>{formatPrice(finalTotal, activeCurrency)}</span>
                </div>
                <p className="text-[9.5px] text-[#888888] dark:text-white/40">
                  Taxes and insured worldwide courier calculated at checkout.
                </p>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout({
                    items: cart,
                    subtotal: rawSubtotal,
                    discount: discountAmount,
                    total: finalTotal,
                    note: orderNote
                  });
                }}
                className="w-full py-3.5 bg-[#111111] hover:bg-[#C4823F] dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] text-white dark:text-[#0B0A0D] text-[12px] font-bold uppercase tracking-[0.04em] rounded-xs transition-all duration-300 shadow-xl flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          )}

            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
