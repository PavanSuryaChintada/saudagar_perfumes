import React, { useRef, useEffect, useState } from 'react';
import dynamicHeroVideos from '../data/heroVideos.json';

export default function BluorngHero({ onExploreClick, onShopDropClick }) {
  const heroRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Dynamic videos list (automatically synced by vite hero-videos plugin)
  const videos = dynamicHeroVideos && dynamicHeroVideos.length > 0
    ? dynamicHeroVideos
    : [];

  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoElementsRef = useRef([]);

  // Magnetic & 3D Tilt Physics State for the corner perfume logo emblem
  const mouseRef = useRef({ targetX: 0, targetY: 0 });
  const animFrameRef = useRef(null);
  const logoContainerRef = useRef(null);

  // Smooth luxury physics loop for subtle 3D perfume emblem
  useEffect(() => {
    let currentX = 0;
    let currentY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let currentRotZ = 0;

    const updatePhysics = () => {
      const targetX = mouseRef.current.targetX;
      const targetY = mouseRef.current.targetY;

      // Subtle restrained translation (maximum ~10px / ~8px)
      const desiredX = targetX * 10;
      const desiredY = targetY * 8;

      // Subtle luxury 3D tilt angles (maximum ~8deg / ~6deg)
      const desiredRotY = targetX * 8;
      const desiredRotX = -targetY * 6;
      const desiredRotZ = targetX * 1.5;

      const ease = 0.045;
      currentX += (desiredX - currentX) * ease;
      currentY += (desiredY - currentY) * ease;
      currentRotX += (desiredRotX - currentRotX) * ease;
      currentRotY += (desiredRotY - currentRotY) * ease;
      currentRotZ += (desiredRotZ - currentRotZ) * ease;

      if (logoContainerRef.current) {
        logoContainerRef.current.style.transform = `
          translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0px)
          rotateX(${currentRotX.toFixed(2)}deg)
          rotateY(${currentRotY.toFixed(2)}deg)
          rotateZ(${currentRotZ.toFixed(2)}deg)
        `;
      }

      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

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

  // Track mouse coordinates over the hero container
  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    mouseRef.current.targetX = Math.max(-1, Math.min(1, normX));
    mouseRef.current.targetY = Math.max(-1, Math.min(1, normY));
  };

  const handleMouseLeave = () => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
    setIsHovered(false);
  };

  return (
    <section
      ref={heroRef}
      id="hero-section"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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

        {/* Bottom Bar: Dynamic Film Switcher (Left) · Shop Now (Center) · Logo & Sound Toggle (Right) */}
        <div className="w-full z-20 flex items-end justify-between px-2 sm:px-6 pt-2 select-none">
          {/* Left: Film Switcher Pills (Dynamically scales with N videos + live playback indicator) */}
          <div className="flex items-center gap-2 pb-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/60 hidden xs:inline">
              Film
            </span>
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-xs border border-white/15 max-w-[220px] sm:max-w-none overflow-x-auto scrollbar-none">
              {videos.map((vid, idx) => (
                <button
                  key={vid.id || vid.label || idx}
                  onClick={() => setActiveVideoIdx(idx)}
                  className={`relative text-[10px] sm:text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-xs transition-all cursor-pointer whitespace-nowrap overflow-hidden ${
                    activeVideoIdx === idx
                      ? 'bg-white text-black shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                  title={vid.title}
                  aria-label={`Switch to ${vid.title}`}
                >
                  <span className="relative z-2">{vid.label}</span>
                  {/* Subtle active video progress highlight */}
                  {activeVideoIdx === idx && (
                    <span
                      className="absolute bottom-0 left-0 h-[2px] bg-[#C4823F] transition-all duration-200"
                      style={{ width: `${videoProgress}%` }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Center: Minimalist "Shop now" Link (matching exact Bluorng reference) */}
          <div className="text-center pb-1">
            <button
              onClick={onShopDropClick}
              className="text-white text-[13px] sm:text-[14px] font-semibold tracking-[0.2em] uppercase hover:text-[#C4823F] transition-colors pb-1 border-b border-white hover:border-[#C4823F] cursor-pointer"
            >
              Shop now
            </button>
          </div>

          {/* Right: Perfume Logo directly above the Sound Off Button */}
          <div className="flex flex-col items-center sm:items-end gap-2 z-30 pb-1">
            {/* Perfume Logo directly above Sound Off */}
            <div
              ref={logoContainerRef}
              onClick={onShopDropClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{ perspective: 1200 }}
              className="cursor-pointer will-change-transform group select-none flex items-center justify-center"
              title="Saudagar Haute Parfumerie — Explore Collection"
            >
              <div className="w-[52px] sm:w-[68px] md:w-[78px] aspect-square flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-[1.08]">
                <img
                  src="/images/perfume_logo_crest_transparent.png"
                  alt="Saudagar Perfume Emblem Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_18px_rgba(0,0,0,0.85)] drop-shadow-[0_2px_8px_rgba(196,130,63,0.35)] transition-all duration-300 pointer-events-none group-hover:filter group-hover:drop-shadow-[0_10px_24px_rgba(196,130,63,0.55)]"
                  draggable={false}
                />
              </div>
            </div>

            {/* Audio Soundtrack Toggle Button */}
            <button
              onClick={toggleSound}
              className="flex items-center gap-1.5 bg-black/60 hover:bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xs border border-white/20 text-white/85 hover:text-white transition-all cursor-pointer text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap shadow-lg"
              title={isMuted ? 'Turn Sound On' : 'Mute Sound'}
              aria-label={isMuted ? 'Turn sound on' : 'Mute sound'}
            >
              {isMuted ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                  </svg>
                  <span className="hidden sm:inline">Sound Off</span>
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C4823F" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                  <span className="text-[#C4823F] hidden sm:inline">Sound On</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
