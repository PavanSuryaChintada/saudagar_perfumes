import React, { useState, useEffect } from 'react';
import { NOTIFICATIONS } from '../data/bluorngSaudagarData.js';

export default function BluorngAnnouncementBar() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % NOTIFICATIONS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative z-50 bg-[#000000] text-[#FFFFFF] text-[11px] font-sans border-b border-white/10 select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between relative min-h-[38px]">
        
        {/* Left: Interactive Notification Box Pill (as in Bluorng) */}
        <div className="relative z-20 flex-shrink-0">
          <button
            onClick={() => setIsNotiOpen(!isNotiOpen)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded text-[10px] tracking-wider uppercase font-medium transition-all"
            aria-label="View notifications"
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center text-white font-bold">
              +
            </span>
            <span>2 Notifications</span>
          </button>

          {/* Dropdown Notification Content */}
          {isNotiOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-[#121212] border border-white/15 p-3 rounded shadow-2xl z-50 text-[11px] text-white/90 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between pb-1 border-b border-white/10 font-bold uppercase tracking-widest text-[9px] text-[#C4823F]">
                <span>House Bulletins</span>
                <button
                  onClick={() => setIsNotiOpen(false)}
                  className="text-white/50 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="leading-relaxed">
                ✨ <strong>Blind Box 26:</strong> The Royal Oud Drop is now officially live across boutiques and online.
              </p>
              <p className="leading-relaxed">
                🎁 Receive a complimentary <strong>10ml Crystal Travel Atomizer</strong> with any purchase over RS. 3,500.
              </p>
            </div>
          )}
        </div>

        {/* Center: Mathematically Centered Announcement Ticker */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-auto max-w-[65%] sm:max-w-none overflow-hidden pointer-events-none">
          <div className="inline-flex items-center gap-2 tracking-[0.14em] uppercase font-semibold text-[10.5px] sm:text-[11px] text-white/95 truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C4823F] animate-pulse shrink-0"></span>
            <span className="transition-all duration-500 ease-in-out truncate">
              {NOTIFICATIONS[currentIdx]}
            </span>
          </div>
        </div>

        {/* Right: Quick Delivery & Currency Tag */}
        <div className="hidden md:flex items-center gap-4 text-[10px] tracking-[0.12em] uppercase text-white/70 z-20 flex-shrink-0">
          <span>Worldwide Express</span>
          <span className="text-white/30">•</span>
          <span className="text-[#C4823F] font-semibold">100% Artisanal</span>
        </div>
      </div>
    </div>
  );
}
