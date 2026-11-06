import React, { useEffect, useRef, useState } from 'react';
import dynamicHeroVideos from '../data/heroVideos.json';

export default function BluorngHero({ onExploreClick, onShopDropClick }) {
  // Dynamic videos list (automatically synced by vite hero-videos plugin)
  const videos = dynamicHeroVideos && dynamicHeroVideos.length > 0
    ? dynamicHeroVideos
    : [];

  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoElementsRef = useRef([]);

  // Ensure activeVideoIdx stays within bounds if videos count changes dynamically
  useEffect(() => {
    if (activeVideoIdx >= videos.length && videos.length > 0) {
      setActiveVideoIdx(0);
    }
  }, [videos.length, activeVideoIdx]);

  // Video Playback Engine: guarantees each active video plays completely without background interruption
  useEffect(() => {
    // 1. Pause and reset all non-active videos so they do NOT play in background
    videoElementsRef.current.forEach((el, idx) => {
      if (el && idx !== activeVideoIdx) {
        el.pause();
        el.currentTime = 0;
      }
    });

    // 2. Play the active video from beginning (second 0.0)
    const activeVideo = videoElementsRef.current[activeVideoIdx];
    if (activeVideo) {
      activeVideo.currentTime = 0;
      activeVideo.muted = isMuted;
      const playPromise = activeVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback if browser requires user interaction for unmuted playback
          if (!activeVideo.muted) {
            activeVideo.muted = true;
            setIsMuted(true);
            activeVideo.play().catch(() => {});
          }
        });
      }
    }
    setVideoProgress(0);
  }, [activeVideoIdx]);

  // Handle video completion: guarantees ONLY the active video triggers transition after full playback
  const handleVideoEnded = (endedIdx) => {
    if (endedIdx !== activeVideoIdx) return;
    if (!videos || videos.length === 0) return;

    if (videos.length === 1) {
      const current = videoElementsRef.current[0];
      if (current) {
        current.currentTime = 0;
        current.play().catch(() => {});
      }
      return;
    }

    // Advance to next video in queue
    setActiveVideoIdx((prev) => (prev + 1) % videos.length);
  };

  // Track playback time to update progress indicator
  const handleTimeUpdate = (idx, e) => {
    if (idx !== activeVideoIdx) return;
    const v = e.target;
    if (v.duration && !isNaN(v.duration) && v.duration > 0) {
      setVideoProgress((v.currentTime / v.duration) * 100);
    }
  };

  const toggleSound = () => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      videoElementsRef.current.forEach((el) => {
        if (el) el.muted = nextMuted;
      });
      return nextMuted;
    });
  };

  return (
    <section
      id="hero-section"
      className="relative w-full h-screen min-h-[100dvh] overflow-hidden bg-[#0A0A0C] -mt-[60px] sm:-mt-[68px] select-none"
    >
      {/* Fallback Static Backdrop during initial load */}
      <picture className="absolute inset-0 w-full h-full pointer-events-none">
        <source media="(max-width: 768px)" srcSet="/images/hero_model.jpg" />
        <img
          src="/images/hero_alcove.jpg"
          alt="Saudagar Haute Parfumerie Campaign"
          className="w-full h-full object-cover object-center filter brightness-[0.70]"
        />
      </picture>

      {/* Dynamic Fullscreen Background Cinematic Campaign Videos */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {videos.map((vid, idx) => (
          <video
            key={vid.id || vid.src}
            ref={(el) => (videoElementsRef.current[idx] = el)}
            src={vid.src}
            preload="auto"
            muted={isMuted}
            playsInline
            onEnded={() => handleVideoEnded(idx)}
            onTimeUpdate={(e) => handleTimeUpdate(idx, e)}
            className={`absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.82] transition-opacity duration-1000 ease-in-out ${
              activeVideoIdx === idx ? 'opacity-100 z-1 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
          />
        ))}
      </div>

      {/* Ambient Luxury Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/45 pointer-events-none z-1" />

      {/* Main Full-Height Hero Content Container */}
      <div className="relative w-full h-full flex flex-col justify-between items-center px-4 pt-[80px] sm:pt-[100px] pb-6 sm:pb-8 z-10">

        {/* Top Spacer */}
        <div className="w-full h-4 sm:h-8 pointer-events-none" />

        {/* Center: Open & Unobstructed for Full Video Cinematography */}
        <div className="relative flex-1 w-full flex items-center justify-center pointer-events-none">
          {/* Central space remains fully open to showcase the video flacons & cinematic background */}
        </div>

        {/* Bottom Bar: Film Switcher (Left) · Shop Now (Center) · Sound Toggle (Right) */}
        <div className="w-full z-20 grid grid-cols-3 items-end gap-3 px-2 sm:px-6 pt-2 select-none">

          {/* Left: Film Switcher - glass segmented control with numbered films */}
          <div className="min-w-0 flex items-center justify-start pb-1">
            <div
              role="tablist"
              aria-label="Hero films"
              className="flex items-center gap-4 max-w-[200px] sm:max-w-none overflow-x-auto scrollbar-none"
            >
              {videos.map((vid, idx) => {
                const isActive = activeVideoIdx === idx;
                return (
                  <button
                    key={vid.id || vid.label || idx}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveVideoIdx(idx)}
                    title={vid.title}
                    aria-label={`Switch to ${vid.title}`}
                    className={`relative flex items-center gap-1.5 pb-1 text-[9px] font-normal tracking-[0.2em] uppercase whitespace-nowrap transition-colors duration-300 cursor-pointer ${
                      isActive ? 'text-white' : 'text-white/45 hover:text-white'
                    }`}
                  >
                    <span className={`tabular-nums transition-colors duration-300 ${
                      isActive ? 'text-white/70' : 'text-white/30'
                    }`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>{vid.label}</span>

                    {/* Hairline progress along the bottom of the active film */}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-0 h-px bg-white/80"
                        style={{ width: `${videoProgress}%` }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center: Minimalist "Shop now" Link */}
          <div className="flex justify-center pb-1">
            <button
              onClick={onShopDropClick}
              className="text-white text-[13px] sm:text-[14px] font-semibold tracking-[0.2em] uppercase hover:text-white/70 transition-colors pb-1 border-b border-white hover:border-white/70 cursor-pointer"
            >
              Shop now
            </button>
          </div>

          {/* Right: Sound Toggle - glass pill with animated equalizer bars */}
          <div className="flex items-center justify-end pb-1">
            <button
              onClick={toggleSound}
              aria-pressed={!isMuted}
              title={isMuted ? 'Turn Sound On' : 'Mute Sound'}
              aria-label={isMuted ? 'Turn sound on' : 'Mute sound'}
              className={`cursor-pointer whitespace-nowrap text-[9px] tracking-[0.2em] uppercase transition-colors duration-300 ${
                isMuted ? 'text-white/50 hover:text-white' : 'text-white'
              }`}
            >
              <span>
                {isMuted ? 'Sound Off' : 'Sound On'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
