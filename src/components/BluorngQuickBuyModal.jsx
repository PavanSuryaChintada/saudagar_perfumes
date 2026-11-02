import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../data/bluorngSaudagarData.js';

export default function BluorngQuickBuyModal({
  product,
  activeCurrency = 'INR',
  onClose,
  onAddToCart
}) {
  const [selectedSize, setSelectedSize] = useState(
    product.sizes?.[0] || { ml: 50, label: '50ML', price: product.price }
  );
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const currentPrice = selectedSize.price || product.price;

  const handleAdd = () => {
    onAddToCart({
      productId: product.id,
      size: selectedSize.label,
      price: currentPrice,
      quantity
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
        className="relative w-full max-w-lg bg-[#FFFFFF] rounded-xs shadow-2xl border border-[#E5E5E5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-xs bg-white/80 hover:bg-black hover:text-white text-[#111111] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Product Image */}
          <div className="w-full sm:w-1/2 aspect-[4/5] bg-[#F7F7F6] flex items-center justify-center p-4">
            <img
              src={product.images?.[0] || product.image}
              alt={product.name}
              className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)]"
            />
          </div>

          {/* Product Details & Size Options */}
          <div className="w-full sm:w-1/2 p-5 flex flex-col justify-between text-[#111111]">
            <div>
              <span className="text-[9.5px] font-bold tracking-[0.2em] uppercase text-[#C4823F]">
                Quick Select
              </span>
              <h3 className="text-[15px] font-bold uppercase tracking-wider text-[#111111] mt-0.5 leading-snug">
                {product.name}
              </h3>
              <p className="text-[11px] text-[#777777] uppercase mt-0.5">
                {product.concentration || product.category}
              </p>

              {/* Price */}
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-[17px] font-bold text-[#111111]">
                  {formatPrice(currentPrice, activeCurrency)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                  <span className="text-[12px] text-[#999999] line-through">
                    {formatPrice(product.compareAtPrice, activeCurrency)}
                  </span>
                )}
              </div>

              {/* Size Selector Pills */}
              <div className="mt-4">
                <label className="text-[10.5px] font-bold tracking-wider uppercase text-[#555555] block mb-1.5">
                  Select Volume Size:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes?.map((sz) => (
                    <button
                      key={sz.label}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wider rounded-xs transition-all border ${
                        selectedSize.label === sz.label
                          ? 'border-[#111111] bg-[#111111] text-white'
                          : 'border-[#CCCCCC] bg-[#FFFFFF] text-[#333333] hover:border-[#111111]'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[10.5px] font-bold tracking-wider uppercase text-[#555555]">
                  Quantity:
                </span>
                <div className="flex items-center border border-[#CCCCCC] rounded-xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 flex items-center justify-center text-xs hover:bg-[#F2F2F2]"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-xs font-bold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-7 h-7 flex items-center justify-center text-xs hover:bg-[#F2F2F2]"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Add to Bag Action */}
            <div className="mt-6 pt-3 border-t border-[#F0F0F0]">
              <button
                onClick={handleAdd}
                className="w-full py-3 bg-[#111111] hover:bg-[#C4823F] text-white text-[11.5px] font-bold uppercase tracking-[0.2em] rounded-xs transition-all shadow-md"
              >
                Add To Bag • {formatPrice(currentPrice * quantity, activeCurrency)}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
