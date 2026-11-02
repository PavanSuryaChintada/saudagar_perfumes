import React, { useState } from 'react';
import { BOUTIQUE_STORES } from '../data/bluorngSaudagarData.js';

export default function BluorngStores() {
  const [activeStoreIdx, setActiveStoreIdx] = useState(0);

  return (
    <section id="stores-section" className="w-full bg-[#FAF9F6] py-12 sm:py-16 border-b border-[#EEEEEE]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header / Globe Indicator (as in Bluorng store-earth) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-3 border-b border-[#111111]/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10.5px] font-bold tracking-[0.24em] uppercase text-[#C4823F]">
                Walk-in Ateliers
              </span>
            </div>
            <h2 className="text-[22px] sm:text-[28px] font-black uppercase tracking-[0.14em] text-[#111111]">
              Boutiques across India & Middle East
            </h2>
          </div>

          <p className="text-[12px] text-[#666666] tracking-wide max-w-md">
            Experience our private olfactory tasting salons. Master perfumers on site for bespoke consultations and personalized crystal flacon engraving.
          </p>
        </div>

        {/* Store Navigation Cards Grid (Matching Bluorng store-cards structure) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {BOUTIQUE_STORES.map((store, idx) => (
            <div
              key={store.id}
              className="bg-[#FFFFFF] border border-[#E5E5E5] hover:border-[#111111] transition-all duration-300 overflow-hidden flex flex-col justify-between group shadow-xs hover:shadow-md"
            >
              {/* Boutique Image with "Open now" Tag */}
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#ECEBE6]">
                <img
                  src={store.image}
                  alt={store.city}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[10px] font-bold tracking-wider text-emerald-700 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{store.status}</span>
                </div>
              </div>

              {/* Store Details Box (as in Bluorng card-details) */}
              <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-[15px] sm:text-[16px] font-bold uppercase tracking-wider text-[#111111] group-hover:text-[#C4823F] transition-colors">
                    {store.city}
                  </h3>
                  <p className="text-[11.5px] text-[#666666] leading-relaxed mt-2 min-h-[36px]">
                    {store.address}
                  </p>
                </div>

                {/* Bottom Row: Directions & Phone */}
                <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex items-center justify-between text-[11px]">
                  <a
                    href={store.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold tracking-wider uppercase text-[#111111] hover:text-[#C4823F] flex items-center gap-1.5 transition-colors"
                  >
                    <span>Get Direction</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 13L13 3M13 3H5M13 3V11" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>

                  <a
                    href={`tel:${store.phone}`}
                    className="text-[#666666] hover:text-[#111111] tracking-wider transition-colors"
                  >
                    {store.phone}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
