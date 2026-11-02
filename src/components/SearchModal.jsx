import React, { useState } from 'react';
import { PRODUCTS, formatPrice } from '../data/products.js';

export default function SearchModal({
  isOpen,
  onClose,
  onSelectProduct,
  activeCurrency = 'AED'
}) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const trendingTags = [
    'Deep Canopy',
    'Amber Bark',
    'Obsidian Root',
    'Pacific Chill',
    'Guidance 46',
    'Assam Oud',
    'Bespoke Flacon'
  ];

  const results = query.trim() === ''
    ? []
    : PRODUCTS.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.subheading?.toLowerCase().includes(q) ||
          p.family?.toLowerCase().includes(q) ||
          (p.inspiration && p.inspiration.toLowerCase().includes(q)) ||
          p.collection?.toLowerCase().includes(q)
        );
      });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content in Product Page Palette */}
      <div className="relative w-full max-w-2xl bg-[#ECEBE6] text-[#111111] border border-[#111111] shadow-2xl p-6 sm:p-8 z-10">
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-4 border-b border-[#111111] mb-6">
          <span className="text-[11px] tracking-[0.24em] uppercase text-[#111111] font-bold">
            Saudagar Fragrance Archive
          </span>
          <button
            onClick={onClose}
            className="p-1 text-[#111111] hover:opacity-60 transition-opacity"
            aria-label="Close search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by essence, accords, or notes..."
            className="w-full bg-[#F4F3EE] border border-[#111111] text-[#111111] placeholder-[#777777] px-4 py-3.5 pr-10 text-xs tracking-[0.14em] uppercase focus:outline-none focus:ring-1 focus:ring-[#111111]"
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="absolute right-3.5 top-3.5 text-[#555555]"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Trending Tags */}
        <div className="mb-6">
          <div className="text-[10px] tracking-[0.2em] uppercase text-[#555555] mb-2 font-medium">
            Trending Searches:
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="bg-[#F4F3EE] hover:bg-[#111111] hover:text-white border border-[#111111]/30 hover:border-[#111111] text-[#111111] text-[10px] tracking-[0.14em] uppercase px-3 py-1 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto space-y-3 no-scrollbar divide-y divide-[#111111]/15">
          {query.trim() !== '' && results.length === 0 && (
            <div className="text-center py-8 text-xs text-[#777777] tracking-wider uppercase">
              No matching fragrances found for "{query}".
            </div>
          )}

          {results.map((prod) => (
            <div
              key={prod.id}
              onClick={() => {
                onSelectProduct(prod.id);
                onClose();
              }}
              className="pt-3 flex items-center justify-between cursor-pointer group hover:bg-[#F4F3EE] p-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white border border-[#111111]/30 p-1 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-[0.14em] uppercase text-[#111111] group-hover:text-[#C4823F] transition-colors">
                    {prod.name}
                  </h4>
                  <p className="text-[10px] text-[#666666] tracking-wider">
                    {prod.concentration || prod.family}
                  </p>
                </div>
              </div>

              <div className="text-xs font-mono font-medium text-[#111111]">
                {formatPrice(prod.prices?.[activeCurrency] || prod.prices?.AED || 80, activeCurrency)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
