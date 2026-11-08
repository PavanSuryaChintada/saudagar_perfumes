import React from 'react';

/**
 * The top of a category (or collection) page when it has its own picture or film: full width, with the name and
 * description over it. Each category sets its own in Admin → Categories (phone picture optional).
 */
export default function ListingBanner({ eyebrow, title, description, image, video }) {
  return (
    <section className="relative w-full min-h-[46vh] sm:min-h-[56vh] flex items-end overflow-hidden bg-[#111111]">
      {video ? (
        <video className="absolute inset-0 w-full h-full object-cover" src={video} poster={image || undefined} autoPlay muted loop playsInline aria-hidden />
      ) : (
        image && <img className="absolute inset-0 w-full h-full object-cover" src={image} alt="" />
      )}
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div className="relative w-full px-4 sm:px-8 lg:px-12 pt-32 pb-10 sm:pb-14 text-white">
        {eyebrow && <p className="text-[11.5px] uppercase tracking-[0.22em] text-white/85 mb-2">{eyebrow}</p>}
        <h1 className="text-[30px] sm:text-[46px] font-normal tracking-[-0.015em] leading-tight break-words">{title || ' '}</h1>
        {description && <p className="mt-3 text-[13.5px] sm:text-[14.5px] text-white/90 max-w-2xl leading-relaxed">{description}</p>}
      </div>
    </section>
  );
}
