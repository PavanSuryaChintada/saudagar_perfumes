import React, { useState, useEffect, useRef } from 'react';
import { ALL_PRODUCTS, formatPrice } from '../data/bluorngSaudagarData.js';

export default function BluorngSearchModal({
  isOpen,
  onClose,
  onSelectProduct,
  activeCurrency = 'INR'
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Filter products by query
  const searchResults = query.trim() === ''
    ? []
    : ALL_PRODUCTS.filter((p) => {
        const q = query.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCat = p.category?.toLowerCase().includes(q);
        const matchesNotes =
          p.notes?.top?.some((n) => n.toLowerCase().includes(q)) ||
          p.notes?.heart?.some((n) => n.toLowerCase().includes(q)) ||
          p.notes?.base?.some((n) => n.toLowerCase().includes(q));
        return matchesName || matchesCat || matchesNotes;
      });

  const popularSearches = [
    'Oud Extrait',
    'Discovery Coffret',
    'Taif Rose',
    'Deep Canopy',
    'Bergamot',
    'Sandalwood'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm animate-fadeIn flex flex-col justify-start">
      <div className="w-full bg-[#FFFFFF] border-b border-[#E5E5E5] shadow-2xl p-4 sm:p-8">
        <div className="max-w-[1000px] mx-auto space-y-6">
          
          {/* Header Row: Title & Close */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.24em] uppercase text-[#C4823F]">
              Search Saudagar Haute Parfumerie
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-[#111111] hover:text-[#C4823F] transition-colors"
              aria-label="Close search"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative border-b-2 border-[#111111] pb-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH BY FRAGRANCE, NOTE, EXTRACT OR INGREDIENT..."
              className="w-full bg-transparent text-[16px] sm:text-[22px] font-bold uppercase tracking-wider text-[#111111] outline-none placeholder:text-[#AAAAAA]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-0 top-1 text-xs text-[#777777] hover:text-[#111111] uppercase tracking-wider font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Popular Searches Pills */}
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="text-[#888888] font-semibold uppercase tracking-wider mr-1">
              Popular Searches:
            </span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="px-3 py-1 rounded-full bg-[#F5F5F3] hover:bg-[#111111] hover:text-white text-[#111111] font-medium tracking-wide uppercase transition-colors"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Search Results Grid */}
          {query.trim() !== '' && (
            <div className="pt-4 border-t border-[#F0F0F0]">
              <div className="flex items-center justify-between mb-4 text-[12px] text-[#777777] font-semibold uppercase tracking-wider">
                <span>Results for "{query}"</span>
                <span>{searchResults.length} Products Found</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-[#777777]">
                  <p className="text-[14px] font-bold text-[#111111] uppercase">No matching fragrances found</p>
                  <p className="text-[12px] mt-1">Try searching for ingredients like "Oud", "Cypress", "Amber", or "Rose".</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        onClose();
                        onSelectProduct(product.id);
                      }}
                      className="group cursor-pointer border border-[#EEEEEE] p-2 rounded-xs hover:border-[#111111] transition-all bg-[#FFFFFF]"
                    >
                      <div className="w-full aspect-[4/5] bg-[#F7F7F6] overflow-hidden mb-2">
                        <img
                          src={product.images?.[0] || product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-[#111111] line-clamp-1 group-hover:text-[#C4823F]">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-[#777777] uppercase mt-0.5">
                        {product.category}
                      </p>
                      <p className="text-[12px] font-bold text-[#111111] mt-1">
                        {formatPrice(product.price, activeCurrency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
}
