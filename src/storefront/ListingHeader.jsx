import React, { useEffect, useState } from 'react';

/** Editorial header for listings without a hero film (categories, notes, search, shop). */
export default function ListingHeader({ eyebrow, title, description, image, search, onSearch }) {
  const [term, setTerm] = useState(search ?? '');
  useEffect(() => setTerm(search ?? ''), [search]);
  return (
    <section className="w-full border-b border-[#EAEAEA] dark:border-white/10 bg-[#FAF9F6] dark:bg-[#0E0C10]">
      <div className="px-4 sm:px-8 lg:px-12 pt-28 sm:pt-32 pb-10 sm:pb-12 flex flex-col sm:flex-row sm:items-end gap-6">
        {image && (
          <img src={image} alt="" className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full bg-white dark:bg-white/5 shrink-0" loading="lazy" />
        )}
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="text-[11.5px] uppercase tracking-[0.2em] text-tk-accent dark:text-tk-accent-night mb-2">{eyebrow}</p>}
          <h1 className="text-[28px] sm:text-[38px] font-normal tracking-[-0.015em] text-tk-ink dark:text-white leading-tight break-words">{title || ' '}</h1>
          {description && <p className="mt-2 text-[13px] text-[#666666] dark:text-[#A09D96] max-w-2xl leading-relaxed">{description}</p>}
          {onSearch && (
            <form
              className="mt-5 flex max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                onSearch(term.trim());
              }}
              role="search"
            >
              <input
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search by name, note or collection"
                aria-label="Search fragrances"
                className="flex-1 min-w-0 px-4 py-2.5 border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[13px] outline-none focus:border-tk-ink dark:focus:border-tk-accent-night"
              />
              <button type="submit" className="px-5 bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night text-[11px] uppercase tracking-[0.16em]">
                Search
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
