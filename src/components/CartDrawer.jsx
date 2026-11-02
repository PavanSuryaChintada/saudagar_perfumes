import React from 'react';
import { PRODUCTS, formatPrice } from '../data/products.js';

export default function CartDrawer({
  isOpen,
  onClose,
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  activeCurrency = 'AED'
}) {
  if (!isOpen) return null;

  // Calculate items and prices
  let subtotalAed = 0;

  const items = cart.map((item) => {
    // If custom bespoke
    if (item.productId === 'custom-bespoke') {
      const price = item.priceAed || 190;
      subtotalAed += price * item.quantity;
      return {
        ...item,
        name: item.customName || 'Saudagar Bespoke Fragrance',
        image: item.image || '/images/saudagar_amber_flacon.jpg',
        unitPriceAed: price,
        totalPriceAed: price * item.quantity
      };
    }

    const prod = PRODUCTS.find((p) => p.id === item.productId);
    const sizeMultiplier = item.sizeMl === 100 ? 1.6 : 1;
    const baseAed = prod ? (prod.prices?.[activeCurrency] || prod.prices?.AED || 80) : 80;
    const unitPrice = Math.round(baseAed * sizeMultiplier);
    subtotalAed += unitPrice * item.quantity;

    return {
      ...item,
      name: prod ? prod.name : 'Perfume',
      inspiration: prod?.inspiration,
      image: prod?.image || '/images/saudagar_amber_flacon.jpg',
      unitPriceAed: unitPrice,
      totalPriceAed: unitPrice * item.quantity
    };
  });

  // Free shipping threshold in UAE is AED 250
  const freeShippingThreshold = 250;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotalAed);
  const shippingProgress = Math.min(100, Math.round((subtotalAed / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer in Product Page Palette (#ECEBE6, #111111, #C4823F) */}
      <div className="relative w-full max-w-md bg-[#ECEBE6] text-[#111111] h-full shadow-2xl flex flex-col justify-between border-l border-[#111111] z-10">
        
        {/* Drawer Header */}
        <div>
          <div className="flex items-center justify-between p-5 border-b border-[#111111]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-[0.22em] uppercase text-[#111111]">
                Shopping Bag
              </h2>
              <span className="text-xs text-[#C4823F] font-bold">
                ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-[#111111] hover:opacity-60 transition-opacity"
              aria-label="Close Shopping Bag"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Free Shipping Progress Indicator in Amber Gold */}
          <div className="bg-[#F4F3EE] p-4 border-b border-[#111111] text-xs">
            {remainingForFreeShipping > 0 ? (
              <p className="text-[11px] text-[#111111] tracking-[0.06em] mb-2 font-medium">
                Add <span className="font-bold underline text-[#C4823F]">{formatPrice(remainingForFreeShipping, activeCurrency)}</span> more for Free Delivery in UAE!
              </p>
            ) : (
              <p className="text-[11px] text-[#C4823F] tracking-[0.06em] mb-2 font-bold flex items-center gap-1.5">
                <span>✓</span> You have unlocked Complimentary Express Delivery in UAE!
              </p>
            )}

            <div className="w-full h-1.5 bg-[#D8D6CE] rounded-full overflow-hidden border border-[#111111]/30">
              <div
                className="h-full bg-[#C4823F] transition-all duration-500 rounded-full"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Drawer Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {items.length === 0 ? (
            <div className="text-center py-16 text-[#666666] space-y-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto text-[#C4823F]">
                <path d="M4.75 8.25A.75.75 0 0 0 4 9L3 19.125c0 1.418 1.207 2.625 2.625 2.625h12.75c1.418 0 2.625-1.149 2.625-2.566L20 9a.75.75 0 0 0-.75-.75H4.75Zm2.75 0v-1.5a4.5 4.5 0 0 1 4.5-4.5v0a4.5 4.5 0 0 1 4.5 4.5v1.5" />
              </svg>
              <p className="text-xs tracking-[0.16em] uppercase font-light text-[#555555]">
                Your shopping bag is currently empty.
              </p>
              <button
                onClick={onClose}
                className="inline-block bg-[#111111] text-white text-[11px] tracking-[0.2em] uppercase font-bold px-6 py-2.5 shadow-md hover:bg-[#2A2A2A] transition-all"
              >
                Explore Fragrances
              </button>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-3.5 bg-[#F4F3EE] border border-[#111111] relative group"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 flex-shrink-0 bg-white p-1 overflow-hidden border border-[#111111]/40 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between text-xs">
                  <div>
                    {item.inspiration && (
                      <span className="text-[9px] tracking-[0.14em] text-[#C4823F] uppercase block font-semibold">
                        {item.inspiration}
                      </span>
                    )}
                    <h4 className="font-bold tracking-[0.14em] uppercase text-[#111111] font-sans">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-[#666666] tracking-wider">
                      {item.sizeMl}ml Flacon · Extrait
                    </p>
                    {item.engraving && (
                      <p className="text-[9px] text-[#C4823F] font-mono tracking-wider mt-0.5">
                        24K Engraved: "{item.engraving}"
                      </p>
                    )}
                  </div>

                  {/* Quantity & Price */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#111111]/15 mt-2">
                    <div className="flex items-center border border-[#111111] bg-white text-xs">
                      <button
                        onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 1))}
                        className="px-2 py-0.5 text-[#555555] hover:text-[#111111]"
                      >
                        −
                      </button>
                      <span className="px-2.5 py-0.5 font-medium text-[#111111]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                        className="px-2 py-0.5 text-[#555555] hover:text-[#111111]"
                      >
                        +
                      </button>
                    </div>

                    <div className="font-mono text-xs font-semibold text-[#111111]">
                      {formatPrice(item.totalPriceAed, activeCurrency)}
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onRemoveItem(idx)}
                  className="absolute top-2 right-2 text-[#888888] hover:text-[#111111] p-1"
                  aria-label="Remove item"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer with Checkout */}
        {items.length > 0 && (
          <div className="p-5 bg-[#F4F3EE] border-t border-[#111111] space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[#111111]">
              <span className="font-light">Estimated Subtotal</span>
              <span className="font-mono font-bold text-sm">
                {formatPrice(subtotalAed, activeCurrency)}
              </span>
            </div>

            <p className="text-[10px] text-[#666666] tracking-wider font-light">
              Taxes &amp; international DHL insured shipping calculated at checkout.
            </p>

            <button
              onClick={() => alert(`Proceeding to Secure Checkout:\nTotal: ${formatPrice(subtotalAed, activeCurrency)}\nThank you for choosing Saudagar Perfumes.`)}
              className="w-full bg-[#111111] hover:bg-[#2B2B2B] text-white text-xs font-medium tracking-[0.2em] uppercase py-3.5 transition-all text-center shadow-md"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
