import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import ListingHeader from '../ListingHeader.jsx';
import PageNav from '../PageNav.jsx';
import { useBlock } from '../../cms/useSite';
import { usePaged } from '../../lib/paging';
import { formatINR } from '../../lib/money';
import { PLACEHOLDER_IMAGE } from '../catalog/adapter';
import { useGiftPackOptions } from '../bag/useQuote';
import { newPackKey } from '../bag/bagLines';
import { canPick, fillPackText, packEstimate } from './packMath';

const NO_WORDS = {};

const DEFAULT_WORDS = {
  title: 'Premium Gift Pack',
  tagline: '{count} perfumes of your choice, {size} ml each, in one gift box.',
  intro: 'Pick any {count} perfumes. Choose the same one more than once if you like.',
  add_button: 'Add the pack to bag',
  sample_note: 'A free {sample} ml sample comes with every pack.',
};

/**
 * The customer builds a gift pack: any perfumes sold in the base size, repeats allowed, until the pack is full.
 * Rules come from Admin → Gift pack; the price shown is checked again by the server in the bag.
 */
export default function GiftPackPage({ onAddToCart, onNavigateCollection }) {
  const block = useBlock('gift_pack') ?? NO_WORDS;
  const { data: opts, isLoading, error } = useGiftPackOptions();
  const [picks, setPicks] = useState([]);
  const [term, setTerm] = useState('');

  const words = useMemo(() => {
    const merged = { ...DEFAULT_WORDS };
    for (const k of Object.keys(DEFAULT_WORDS)) if (block[k]) merged[k] = block[k];
    return opts ? Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, fillPackText(v, opts)])) : merged;
  }, [block, opts]);

  useEffect(() => {
    document.title = `${(words.title || 'Gift pack').toUpperCase()} | SAUDAGAR PERFUMES`;
  }, [words.title]);

  const perfumes = useMemo(() => {
    const all = opts?.perfumes ?? [];
    const q = term.trim().toLowerCase();
    return q ? all.filter((p) => p.name.toLowerCase().includes(q)) : all;
  }, [opts, term]);
  const paged = usePaged(perfumes, 24, term);
  const byId = useMemo(() => new Map((opts?.perfumes ?? []).map((p) => [p.product_id, p])), [opts]);
  const est = opts ? packEstimate(opts, picks) : { full: 0, price: 0, saved: 0 };
  const count = opts?.count ?? 5;
  const full = picks.length === count;

  const add = (id) => opts && canPick(opts, picks, id) && setPicks([...picks, id]);
  const removeAt = (i) => setPicks(picks.filter((_, j) => j !== i));
  const removeOne = (id) => {
    const i = picks.lastIndexOf(id);
    if (i >= 0) removeAt(i);
  };

  const addToBag = () => {
    if (!full) return;
    onAddToCart({
      packKey: newPackKey(),
      packPicks: picks,
      quantity: 1,
      name: words.title,
      image: block.image || byId.get(picks[0])?.image || null,
      price: est.price,
      productId: 'gift-pack',
      size: `${count} × ${Number(opts.size_ml)} ml`,
    });
    setPicks([]);
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-tk-night text-tk-ink dark:text-white pt-32 px-4 sm:px-8 lg:px-12">
        <p className="text-[13px] text-[#666666] dark:text-white/60">Loading the gift pack…</p>
      </div>
    );
  }

  if (error || !opts?.enabled) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-tk-night text-tk-ink dark:text-white pb-28">
        <ListingHeader eyebrow="Gift pack" title={words.title} />
        <div className="px-4 sm:px-8 lg:px-12 py-12 space-y-4">
          <p className="text-[14px] text-[#555555] dark:text-white/70">
            {error ? 'We couldn’t load the gift pack. Check your connection and try again.' : 'The gift pack isn’t available right now. Please check back soon.'}
          </p>
          <button type="button" onClick={() => onNavigateCollection?.()} className="px-6 py-3 bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night text-[11px] uppercase tracking-[0.16em]">
            Shop perfumes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white dark:bg-tk-night text-tk-ink dark:text-white pb-44">
      <ListingHeader eyebrow="Gift pack" title={words.title} description={words.tagline} image={block.image || undefined} />

      <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-10 space-y-8">
        <p className="text-[13.5px] text-[#555555] dark:text-white/70 max-w-2xl leading-relaxed">{words.intro}</p>

        {/* The pack: one slot per perfume */}
        <section aria-label="Your pack">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-tk-accent dark:text-tk-accent-night">
              Your pack · {picks.length} of {count} chosen
            </h2>
            {picks.length > 0 && (
              <button type="button" onClick={() => setPicks([])} className="text-[11.5px] underline underline-offset-2 text-[#555555] dark:text-white/70 hover:text-tk-ink dark:hover:text-white">
                Start again
              </button>
            )}
          </div>
          <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: count }, (_, i) => {
              const p = byId.get(picks[i]);
              return (
                <li key={i} className={`flex items-center gap-2.5 p-2.5 border min-h-[64px] ${p ? 'border-tk-ink/30 dark:border-white/25' : 'border-dashed border-[#C9C6BE] dark:border-white/20'}`}>
                  <span className="text-[11px] text-[#777777] dark:text-white/50 w-4 shrink-0">{i + 1}</span>
                  {p ? (
                    <>
                      <img src={p.image || PLACEHOLDER_IMAGE} alt="" className="w-10 h-10 object-contain bg-[#F7F7F6] dark:bg-[#18171C] shrink-0" />
                      <span className="min-w-0 flex-1 text-[12px] font-semibold uppercase tracking-wide leading-tight line-clamp-2">{p.name}</span>
                      <button type="button" onClick={() => removeAt(i)} aria-label={`Remove ${p.name}`} className="text-[#777777] dark:text-white/50 hover:text-rose-600 px-1">
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="text-[12px] text-[#777777] dark:text-white/50">Choose a perfume</span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {/* Perfumes to choose from */}
        <section aria-label="Choose perfumes" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-tk-accent dark:text-tk-accent-night">
              Perfumes · {Number(opts.size_ml)} ml each
            </h2>
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search perfumes"
              aria-label="Search perfumes"
              className="w-full sm:w-72 px-4 py-2.5 border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[13px] outline-none focus:border-tk-ink dark:focus:border-tk-accent-night"
            />
          </div>
          {opts.perfumes.length === 0 && (
            <p className="text-[13px] text-[#555555] dark:text-white/70">No perfumes can go in a pack right now. Please check back soon.</p>
          )}
          {opts.perfumes.length > 0 && perfumes.length === 0 && <p className="text-[13px] text-[#555555] dark:text-white/70">No perfumes match “{term}”.</p>}
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {paged.rows.map((p) => {
              const n = picks.filter((x) => x === p.product_id).length;
              const ok = canPick(opts, picks, p.product_id);
              const soldOut = p.max_picks <= n && !full;
              return (
                <li key={p.product_id} className={`flex flex-col border ${n ? 'border-tk-ink dark:border-white' : 'border-[#E6E4DF] dark:border-white/10'}`}>
                  <Link to={`/product/${p.slug}`} className="block aspect-[4/5] bg-[#F7F7F6] dark:bg-[#18171C] p-3">
                    <img src={p.image || PLACEHOLDER_IMAGE} alt={p.name} className="w-full h-full object-contain" loading="lazy" />
                  </Link>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <p className="text-[12px] font-semibold uppercase tracking-wide leading-tight">{p.name}</p>
                    <p className="text-[12px] text-[#555555] dark:text-white/70">
                      {formatINR(p.price)} for {Number(opts.size_ml)} ml
                    </p>
                    <div className="mt-auto flex items-center gap-2">
                      {n > 0 && (
                        <button type="button" onClick={() => removeOne(p.product_id)} aria-label={`One less ${p.name}`} className="w-9 h-9 border border-[#C9C6BE] dark:border-white/25 text-[15px]">
                          −
                        </button>
                      )}
                      {n > 0 && <span className="text-[12.5px] font-semibold w-5 text-center" aria-label={`${n} in your pack`}>{n}</span>}
                      <button
                        type="button"
                        onClick={() => add(p.product_id)}
                        disabled={!ok}
                        className="flex-1 h-9 bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night text-[10.5px] uppercase tracking-[0.14em] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {soldOut ? 'No more left' : n > 0 ? 'Add another' : 'Add'}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <PageNav page={paged.page} pageCount={paged.pageCount} label="Perfume pages" onPage={(pg) => paged.setPage(pg)} />
        </section>
      </div>

      {/* Summary bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white dark:bg-[#0E0C10] border-t border-[#E6E4DF] dark:border-white/10 px-4 sm:px-8 lg:px-12 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] lg:pb-3 mb-[60px] lg:mb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[12.5px]">
            <p className="font-semibold">
              {picks.length} of {count} chosen
              {picks.length > 0 && (
                <>
                  {' · '}
                  {est.saved > 0 && <span className="line-through text-[#777777] dark:text-white/50 mr-1.5">{formatINR(est.full)}</span>}
                  <span>{formatINR(est.price)}</span>
                </>
              )}
            </p>
            <p className="text-[11.5px] text-[#555555] dark:text-white/70">{words.sample_note}</p>
          </div>
          <button
            type="button"
            onClick={addToBag}
            disabled={!full}
            className="w-full sm:w-auto px-8 py-3.5 bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night text-[11.5px] font-bold uppercase tracking-[0.12em] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {full ? words.add_button : `Choose ${count - picks.length} more`}
          </button>
        </div>
      </div>
    </div>
  );
}
