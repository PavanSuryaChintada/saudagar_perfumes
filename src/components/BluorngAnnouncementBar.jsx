import React, { useState, useEffect } from 'react';
import { useAnnouncements, useBlock, CmsLink } from '../cms/useSite';

/**
 * Rotating announcement bar. Messages come from Admin → Announcements (each with optional dates and link);
 * the bulletins dropdown and side tags come from Admin → Site content → Announcement bar.
 * Renders nothing when no announcement is live, so the header looks exactly as before.
 */
export default function BluorngAnnouncementBar() {
  const items = useAnnouncements();
  const bar = useBlock('announcement_bar') || {};
  const bulletins = (bar.bulletins || []).filter((b) => b && b.text);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  useEffect(() => {
    if (items.length < 2) return undefined;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;
  const current = items[currentIdx % items.length];

  return (
    <div className="relative z-50 bg-[#000000] text-[#FFFFFF] text-[11px] font-sans border-b border-white/10 select-none">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-2.5 flex items-center justify-between relative min-h-[38px]">
        {/* Left: notification pill */}
        {bulletins.length > 0 ? (
          <div className="relative z-20 flex-shrink-0">
            <button
              onClick={() => setIsNotiOpen(!isNotiOpen)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded text-[11px] tracking-wider uppercase font-medium transition-all"
              aria-label="View notifications"
              aria-expanded={isNotiOpen}
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center text-white font-bold">+</span>
              <span>
                {bulletins.length} {bulletins.length === 1 ? 'Notification' : 'Notifications'}
              </span>
            </button>

            {isNotiOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-[#121212] border border-white/15 p-3 rounded shadow-2xl z-50 text-[11px] text-white/90 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between pb-1 border-b border-white/10 font-bold uppercase tracking-widest text-[10.5px] text-tk-accent dark:text-tk-accent-night">
                  <span>{bar.bulletins_heading}</span>
                  <button onClick={() => setIsNotiOpen(false)} className="text-white/50 hover:text-white" aria-label="Close notifications">
                    ✕
                  </button>
                </div>
                {bulletins.map((b, i) => (
                  <p key={i} className="leading-relaxed">
                    <CmsLink link={b.link}>{b.text}</CmsLink>
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span />
        )}

        {/* Center: rotating announcement */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-auto max-w-[65%] sm:max-w-none overflow-hidden">
          <CmsLink link={current.link} className="inline-flex items-center gap-2 tracking-[0.04em] uppercase font-semibold text-[11.5px] sm:text-[11px] text-white/95 truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-tk-accent dark:bg-tk-accent-night animate-pulse shrink-0"></span>
            <span className="transition-all duration-500 ease-in-out truncate">{current.text}</span>
          </CmsLink>
        </div>

        {/* Right: tags */}
        <div className="hidden md:flex items-center gap-4 text-[11px] tracking-[0.04em] uppercase text-white/70 z-20 flex-shrink-0">
          {(bar.tags || []).map((tag, i) => (
            <React.Fragment key={`${tag}-${i}`}>
              {i > 0 && <span className="text-white/30">•</span>}
              <span className={i === (bar.tags || []).length - 1 ? 'text-tk-accent dark:text-tk-accent-night font-semibold' : ''}>{tag}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
