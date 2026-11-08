import React, { useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useGo } from '../../cms/useSite';
import { useFaqs } from '../../cms/useContent';
import { useCatalogFilters } from '../catalog/hooks';
import { sanitizeHtml, hasText } from '../../lib/richText';
import { supabase } from '../../lib/supabase';

// Additional CMS section types, built in the site's existing visual language.

const ICONS = {
  shipping: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 18.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm12 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" strokeLinecap="round" strokeLinejoin="round" />,
  authentic: <path d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3zm-3 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />,
  returns: <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />,
  payment: <path d="M2 6.5A1.5 1.5 0 0 1 3.5 5h17A1.5 1.5 0 0 1 22 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 17.5v-11zM2 9.5h20M6 15h5" strokeLinecap="round" strokeLinejoin="round" />,
  samples: <path d="M9 2h6M10 2v4l-4 9a4 4 0 0 0 3.6 6h4.8A4 4 0 0 0 18 15l-4-9V2" strokeLinecap="round" strokeLinejoin="round" />,
  concierge: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />,
};
export const PROMISE_ICONS = Object.keys(ICONS);

/** "promise_strip": three or four reassurance items. */
export function PromiseStrip({ config = {} }) {
  const items = (config.items || []).filter((i) => i && i.title);
  if (items.length === 0) return null;
  return (
    <section className="py-14 sm:py-16 bg-[#141418] text-[#F7F5F0] border-b border-tk-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`grid grid-cols-1 ${items.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-tk-gold/20`}>
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center px-4 pt-6 md:pt-0">
              <div className="w-14 h-14 rounded-full bg-[#0A0A0C] border border-tk-gold/40 text-tk-gold flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {ICONS[item.icon] || ICONS.authentic}
                </svg>
              </div>
              <h4 className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-white mb-2 font-sans">{item.title}</h4>
              {item.text && <p className="text-[11px] sm:text-xs text-white/65 font-light max-w-xs leading-relaxed">{item.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** "promo_banner": full-width image with a centred message and button. */
export function PromoBanner({ config = {} }) {
  const go = useGo();
  if (!config.heading && !config.image) return null;
  return (
    <section className="relative w-full py-28 sm:py-36 overflow-hidden bg-[#0A0A0C] text-white border-b border-tk-gold/25">
      {config.image && (
        <div className="absolute inset-0">
          <img src={config.image} alt="" className="w-full h-full object-cover object-center" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/90" />
        </div>
      )}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {config.eyebrow && <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-tk-gold font-semibold mb-3">{config.eyebrow}</p>}
        {config.heading && <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-[0.2em] uppercase text-white mb-6 font-sans">{config.heading}</h2>}
        {config.text && <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed max-w-xl mx-auto mb-8 tracking-[0.06em]">{config.text}</p>}
        {config.cta?.label && (
          <button
            onClick={() => go(config.cta.link)}
            className="bg-tk-gold text-[#0A0A0C] hover:bg-tk-accent-night text-xs font-bold uppercase tracking-[0.22em] px-10 py-3.5 transition-all duration-300 shadow-2xl hover:-translate-y-0.5"
          >
            {config.cta.label}
          </button>
        )}
      </div>
    </section>
  );
}

/** "shop_by_note": ingredient tiles linking to /notes/:slug. Picked notes, or the first notes with photos. */
export function ShopByNote({ config = {} }) {
  const { data } = useCatalogFilters();
  const all = data?.notes || [];
  const picked = (config.notes || []).map((slug) => all.find((n) => n.slug === slug)).filter(Boolean);
  const notes = picked.length ? picked : all.filter((n) => n.image).slice(0, config.limit || 8);
  if (notes.length === 0) return null;
  return (
    <section className="relative w-full bg-[#FFFFFF] dark:bg-tk-night py-14 sm:py-20 transition-colors duration-300">
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            {config.eyebrow && <span className="sf-eyebrow">{config.eyebrow}</span>}
            {config.heading && <h2 className="sf-title">{config.heading}</h2>}
          </div>
          <Link to="/notes" className="text-[11px] uppercase tracking-[0.12em] text-[#666666] hover:text-tk-ink dark:hover:text-white">
            {config.all_label || 'All notes'} →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {notes.map((n) => (
            <Link key={n.slug} to={`/notes/${n.slug}`} className="group flex flex-col items-center text-center gap-2">
              <div className="w-full aspect-square rounded-full overflow-hidden bg-[#F4F3EE] dark:bg-white/5 flex items-center justify-center">
                {n.image ? (
                  <img src={n.image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="text-[22px] text-tk-accent dark:text-tk-accent-night">{n.name.charAt(0)}</span>
                )}
              </div>
              <span className="text-[11.5px] uppercase tracking-[0.08em] text-tk-ink dark:text-white group-hover:text-tk-accent dark:group-hover:text-tk-accent-night">{n.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** "faq": questions from Admin → FAQs, optionally one group only. */
export function FaqSection({ config = {} }) {
  const { data = [] } = useFaqs();
  const items = config.group ? data.filter((f) => (f.group_name || '') === config.group) : data;
  const [open, setOpen] = useState(null);
  if (items.length === 0) return null;
  return (
    <section className="max-w-3xl mx-auto px-6 sm:px-10 py-14 sm:py-20">
      {config.heading && <h2 className="text-[22px] sm:text-[28px] font-normal tracking-[-0.01em] text-tk-ink dark:text-white mb-6">{config.heading}</h2>}
      <div className="divide-y divide-[#EAEAEA] dark:divide-white/10 border-y border-[#EAEAEA] dark:border-white/10">
        {items.map((f) => (
          <div key={f.id} className="py-4">
            <button
              type="button"
              onClick={() => setOpen(open === f.id ? null : f.id)}
              aria-expanded={open === f.id}
              className="w-full flex items-center justify-between gap-4 text-left text-[14px] text-tk-ink dark:text-white"
            >
              <span>{f.question}</span>
              <span className="text-[16px] font-light">{open === f.id ? '−' : '+'}</span>
            </button>
            <AnimatePresence>
              {open === f.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pt-3 text-[13px] text-[#555555] dark:text-[#A09D96] leading-relaxed [&_p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(f.answer) }}
                />
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

/** "rich_text": a heading and formatted text. */
export function RichTextSection({ config = {} }) {
  if (!config.heading && !hasText(config.body)) return null;
  return (
    <section className="max-w-3xl mx-auto px-6 sm:px-10 py-14 sm:py-16 text-tk-ink dark:text-white">
      {config.heading && <h2 className="text-[24px] sm:text-[32px] font-normal tracking-[-0.015em] mb-5">{config.heading}</h2>}
      {hasText(config.body) && (
        <div
          className="text-[14px] leading-relaxed text-[#444444] dark:text-[#CCCCCC] [&_p]:mb-3 [&_h2]:text-[20px] [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-[16px] [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:underline [&_a]:text-tk-accent"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(config.body) }}
        />
      )}
    </section>
  );
}

/** "newsletter": email sign-up. */
export function NewsletterSection({ config = {} }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const submit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.rpc('subscribe_newsletter', { p_email: email, p_source: 'section' });
    setState(error ? 'error' : 'done');
  };
  return (
    <section className="w-full bg-[#FAF9F6] dark:bg-[#0E0C10] py-14 sm:py-20 px-6">
      <div className="max-w-xl mx-auto text-center">
        {config.heading && <h2 className="font-serif text-[26px] sm:text-[34px] text-tk-ink dark:text-white">{config.heading}</h2>}
        {config.text && <p className="mt-2 text-[13px] text-[#666666] dark:text-white/65">{config.text}</p>}
        {state === 'done' ? (
          <p className="mt-6 text-[13px] text-emerald-700 dark:text-emerald-400" role="status">{config.success || '✓'}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 flex">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={config.placeholder}
              aria-label="Email address"
              className="flex-1 min-w-0 px-4 py-3 border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[13px] outline-none focus:border-tk-ink dark:focus:border-tk-accent-night"
            />
            <button type="submit" className="px-6 bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night text-[11px] uppercase tracking-[0.16em]">
              {config.button_label || 'Subscribe'}
            </button>
          </form>
        )}
        {state === 'error' && <p className="mt-2 text-[11px] text-rose-600" role="alert">Enter a valid email address.</p>}
      </div>
    </section>
  );
}
