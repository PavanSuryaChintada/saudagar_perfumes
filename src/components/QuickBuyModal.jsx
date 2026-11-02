import React, { useState } from 'react';
import { formatPrice } from '../data/products.js';

export default function QuickBuyModal({
  product,
  onClose,
  onAddToCart,
  activeCurrency = 'AED'
}) {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0]?.ml || 50);
  const [engraving, setEngraving] = useState('');
  const [quantity, setQuantity] = useState(1);

  const activeSizeObj = product.sizes?.find((s) => s.ml === selectedSize) || { ml: 50, priceMultiplier: 1 };
  const basePrice = product.prices?.[activeCurrency] || product.prices?.AED || 80;
  const unitPrice = Math.round(basePrice * activeSizeObj.priceMultiplier);
  const totalPrice = unitPrice * quantity;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddToCart(product.id, selectedSize, engraving, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog in Product Page Palette */}
      <div className="relative w-full max-w-lg bg-[#ECEBE6] text-[#111111] border border-[#111111] shadow-2xl p-6 sm:p-8 z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[#111111] hover:opacity-60 transition-opacity"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Product Summary Header */}
        <div className="flex gap-4 sm:gap-6 items-center pb-5 border-b border-[#111111] mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-white p-1 border border-[#111111] flex items-center justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            {product.inspiration && (
              <span className="text-[10px] tracking-[0.16em] text-[#C4823F] uppercase block mb-1 font-semibold">
                {product.inspiration}
              </span>
            )}
            <h3 className="font-serif text-lg sm:text-xl font-normal tracking-[0.14em] uppercase text-[#111111]">
              {product.name}
            </h3>
            <p className="text-[11px] text-[#666666] tracking-wider mt-0.5">
              {product.concentration || 'Extrait de Parfum'}
            </p>
            <div className="font-mono text-sm font-bold text-[#111111] mt-2">
              {formatPrice(unitPrice, activeCurrency)}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Size Pills */}
          <div>
            <label className="block text-[11px] tracking-[0.18em] uppercase text-[#333333] font-medium mb-2">
              Flacon Size
            </label>
            <div className="flex items-center gap-3">
              {(product.sizes || [
                { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
                { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
              ]).map((s) => (
                <button
                  type="button"
                  key={s.ml}
                  onClick={() => setSelectedSize(s.ml)}
                  className={`rounded-full px-5 py-1.5 text-xs font-normal transition-all ${
                    selectedSize === s.ml
                      ? 'bg-[#111111] text-white shadow-sm'
                      : 'border border-[#999999] text-[#111111] hover:border-[#111111]'
                  }`}
                >
                  {s.ml}ml
                </button>
              ))}
            </div>
          </div>

          {/* Complimentary 24K Engraving */}
          <div>
            <label className="block text-[11px] tracking-[0.18em] uppercase text-[#333333] font-medium mb-1.5">
              24K Gold Flacon Engraving <span className="text-[#C4823F]">(Complimentary)</span>
            </label>
            <input
              type="text"
              maxLength={20}
              value={engraving}
              onChange={(e) => setEngraving(e.target.value)}
              placeholder="INITIALS OR NAME (E.G. S.P)"
              className="w-full bg-[#F4F3EE] border border-[#111111] text-[#111111] placeholder-[#777777] px-3.5 py-2.5 text-xs tracking-[0.14em] uppercase focus:outline-none focus:ring-1 focus:ring-[#111111]"
            />
          </div>

          {/* Quantity Stepper */}
          <div>
            <label className="block text-[11px] tracking-[0.18em] uppercase text-[#333333] font-medium mb-1.5">
              Quantity
            </label>
            <div className="inline-flex items-center border border-[#111111] bg-white text-xs">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1.5 text-[#555555] hover:text-[#111111]"
              >
                −
              </button>
              <span className="px-3.5 py-1.5 font-medium text-[#111111] min-w-[28px] text-center select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1.5 text-[#555555] hover:text-[#111111]"
              >
                +
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#111111] hover:bg-[#2A2A2A] text-white text-xs font-medium tracking-[0.2em] uppercase py-3.5 transition-all text-center shadow-md mt-4"
          >
            ADD TO BAG · {formatPrice(totalPrice, activeCurrency)}
          </button>
        </form>
      </div>
    </div>
  );
}
