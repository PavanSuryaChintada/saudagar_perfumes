import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../data/bluorngSaudagarData.js';
import { useProductsBySlugs } from '../storefront/catalog/hooks';
import { useSetting } from '../lib/bootstrap';
import { PLACEHOLDER_IMAGE } from '../storefront/catalog/adapter';

export default function BluorngCartDrawer({
  isOpen,
  onClose,
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout
}) {
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // Lock body scroll and pause Lenis smooth scroll while cart drawer is open
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

  const FREE_SHIPPING_THRESHOLD = Number(useSetting('shipping.free_threshold', 4999)) || 0;
  const { bySlug } = useProductsBySlugs(cart.map((item) => item.productId));

  // Display subtotal (the server re-prices everything at checkout)
  const rawSubtotal = cart.reduce((acc, item) => {
    const prod = bySlug.get(item.productId);
    const itemPrice = item.price ?? prod?.price ?? 0;
    return acc + itemPrice * item.quantity;
  }, 0);

  const discountAmount = Math.round((rawSubtotal * discountPercent) / 100);
  const finalTotal = Math.max(0, rawSubtotal - discountAmount);

  // Free shipping calculation
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - rawSubtotal);
  const freeShippingProgress = FREE_SHIPPING_THRESHOLD > 0 ? Math.min(100, (rawSubtotal / FREE_SHIPPING_THRESHOLD) * 100) : 100;

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
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Backdrop Dim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
              data-lenis-prevent="true"
              className="pointer-events-auto w-screen max-w-md h-full max-h-screen bg-[#FFFFFF] dark:bg-[#0E0C10] text-tk-ink dark:text-white flex flex-col shadow-2xl transition-colors duration-300 overflow-hidden"
            >
          
          {/* ================= HEADER ================= */}
          <div className="shrink-0 p-4 sm:p-5 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] text-tk-ink dark:text-white">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold tracking-[0.04em] uppercase text-tk-ink dark:text-white">
                Your Shopping Bag
              </h2>
              <span className="text-[12px] text-[#777777] dark:text-white/60 font-medium">
                ({cart.reduce((s, i) => s + i.quantity, 0)})
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-tk-ink dark:text-white hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* ================= FREE SHIPPING PROGRESS BAR ================= */}
          <div className="shrink-0 bg-[#FAF9F6] dark:bg-[#141318] p-3.5 text-[11px] text-tk-ink dark:text-white border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
            <div className="flex items-center justify-between font-semibold tracking-wider uppercase mb-1.5">
              {amountToFreeShipping > 0 ? (
                <span>Add {formatPrice(amountToFreeShipping)} more for Free Express Courier</span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  ✓ Congratulations! You unlocked free express delivery
                </span>
              )}
            </div>
            <div className="w-full h-1.5 bg-[#E5E5E5] dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-tk-accent dark:bg-tk-gold transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* ================= CART ITEMS LIST ================= */}
          <div 
            data-lenis-prevent="true"
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#777777]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <p className="text-[13px] font-bold tracking-wider uppercase text-tk-ink">
                  Your Bag is Currently Empty
                </p>
                <p className="text-[11.5px] text-[#777777] max-w-xs">
                  Explore our royal collection of extraits, rare attars, and bespoke crystal flacons.
                </p>
                <button
                  onClick={onClose}
                  className="mt-3 px-6 py-2.5 bg-tk-ink hover:bg-tk-accent dark:hover:bg-tk-gold dark:hover:text-tk-night text-white text-[11px] font-bold uppercase tracking-wide transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
            ) : (
              cart.map((item, index) => {
                const prod = bySlug.get(item.productId);
                const itemImage = item.image || prod?.images?.[0] || PLACEHOLDER_IMAGE;
                const itemName = item.name || prod?.name || 'Fragrance';
                const itemPrice = item.price ?? prod?.price ?? 0;

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
                          <h4 className="font-bold uppercase tracking-wider text-tk-ink dark:text-white leading-tight">
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
                          Size: <span className="text-tk-ink dark:text-white font-semibold">{item.size || '50ML'}</span>
                        </p>

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
                          <span className="w-8 text-center text-xs font-bold text-tk-ink dark:text-white">
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

                        <span className="font-bold text-[12.5px] text-tk-ink dark:text-white">
                          {formatPrice(itemPrice * item.quantity)}
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
            <div className="shrink-0 p-4 sm:p-5 bg-white dark:bg-[#0E0C10] border-t border-black/[0.06] dark:border-white/[0.08] text-tk-ink dark:text-white space-y-3.5 shadow-[0_-8px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_-8px_20px_rgba(0,0,0,0.3)] transition-colors">
              
              {/* Order Note Toggle */}
              <div>
                <button
                  onClick={() => setIsNoteOpen(!isNoteOpen)}
                  className="text-[10.5px] font-semibold tracking-wider uppercase text-[#777777] dark:text-white/60 hover:text-tk-ink dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <span>{isNoteOpen ? '− Hide note' : '+ Add a note for us'}</span>
                </button>
                {isNoteOpen && (
                  <textarea
                    rows={2}
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Anything we should know about your order (optional)"
                    className="w-full mt-2 p-2.5 bg-black/[0.05] dark:bg-white/[0.07] text-tk-ink dark:text-white placeholder:text-[#888888] dark:placeholder:text-white/40 text-[11px] rounded-xs outline-none"
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
                  className="flex-1 px-3 py-2 bg-black/[0.05] dark:bg-white/[0.07] text-tk-ink dark:text-white placeholder:text-[#888888] dark:placeholder:text-white/40 rounded-xs text-[11px] tracking-wider uppercase outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-tk-ink hover:bg-tk-accent dark:bg-tk-gold dark:hover:bg-tk-accent-night text-white dark:text-tk-night text-[10.5px] font-bold uppercase tracking-wide transition-colors rounded-xs cursor-pointer"
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
                  <span>{formatPrice(rawSubtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>VIP Privilege ({discountPercent}%)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#777777] dark:text-white/60">
                  <span>Estimated Shipping</span>
                  <span>
                    {amountToFreeShipping === 0 ? 'FREE' : formatPrice(250)}
                  </span>
                </div>

                <div className="flex justify-between text-[14px] font-bold text-tk-ink dark:text-white pt-1.5">
                  <span className="uppercase tracking-wider">Total</span>
                  <span>{formatPrice(finalTotal)}</span>
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
                className="w-full py-3.5 bg-tk-ink hover:bg-tk-accent dark:bg-tk-gold dark:hover:bg-tk-accent-night text-white dark:text-tk-night text-[12px] font-bold uppercase tracking-[0.04em] rounded-xs transition-all duration-300 shadow-xl flex items-center justify-center gap-2 group cursor-pointer"
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
