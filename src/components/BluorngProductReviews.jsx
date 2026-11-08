import React, { useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { publicUrl } from '../lib/media/upload';
import { useAuth } from '../lib/auth';
import { toFriendlyError } from '../lib/errors';

const PAGE = 6;
const SORTS = [
  ['newest', 'Newest'],
  ['helpful', 'Most helpful'],
  ['highest', 'Highest rated'],
  ['lowest', 'Lowest rated'],
];

function Stars({ value, size = 12 }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" className={s <= Math.round(value) ? 'text-tk-accent dark:text-tk-accent-night' : 'text-[#DDDDDD] dark:text-white/15'} fill="currentColor" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

// Reviews come only from verified buyers and show once the admin approves them.
export default function BluorngProductReviews({ productSlug, productName }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [sort, setSort] = useState('newest');
  const [error, setError] = useState('');
  const query = useInfiniteQuery({
    queryKey: ['reviews', productSlug, sort, user?.id ?? null],
    enabled: !!productSlug,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error: err } = await supabase.rpc('product_reviews', { p_slug: productSlug, p_sort: sort, p_page: pageParam, p_page_size: PAGE });
      if (err) throw err;
      return data;
    },
    getNextPageParam: (last, pages) => (pages.length * PAGE < (last?.count ?? 0) ? pages.length : undefined),
  });
  const first = query.data?.pages?.[0];
  const reviews = (query.data?.pages ?? []).flatMap((p) => p?.reviews ?? []);
  const count = first?.count ?? 0;

  const vote = async (id) => {
    setError('');
    if (!user) {
      setError('Sign in to mark reviews as helpful.');
      return;
    }
    const { error: err } = await supabase.rpc('vote_review', { p_review: id });
    if (err) setError(toFriendlyError(err));
    else await qc.invalidateQueries({ queryKey: ['reviews', productSlug] });
  };

  return (
    <section
      id="reviews-section"
      className="w-full bg-[#FFFFFF] dark:bg-tk-night border-t border-[#EAEAEA] dark:border-white/10 px-6 sm:px-10 lg:px-16 py-14 sm:py-16 transition-colors duration-300"
      aria-label="Customer reviews"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#EAEAEA] dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-tk-accent dark:bg-tk-accent-night" />
              <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-tk-accent dark:text-tk-accent-night">Customer Reviews</span>
            </div>
            <h2 className="text-[26px] sm:text-[34px] font-normal tracking-[-0.015em] text-tk-ink dark:text-white">Client Experiences & Ratings</h2>
            <p className="text-[13px] text-[#666666] dark:text-[#999999] mt-1 max-w-xl">Reviews of {productName} from customers who bought it.</p>
          </div>
          {count > 0 && (
            <div className="text-right">
              <p className="text-[32px] font-light text-tk-ink dark:text-white leading-none">{Number(first.average).toFixed(1)}</p>
              <div className="mt-1.5 flex justify-end"><Stars value={Number(first.average)} /></div>
              <p className="text-[11px] text-[#5F5F5F] dark:text-[#999999] mt-1">{count} review{count === 1 ? '' : 's'}</p>
            </div>
          )}
        </div>

        {query.isLoading && <p className="py-10 text-center text-[12.5px] text-[#666666]">Loading reviews…</p>}

        {!query.isLoading && count === 0 && (
          <div className="py-14 text-center">
            <p className="text-[15px] text-tk-ink dark:text-white">No reviews yet</p>
            <p className="text-[12.5px] text-[#5F5F5F] dark:text-[#999999] mt-1.5">Bought this fragrance? You'll be able to review it from your orders once it's delivered.</p>
          </div>
        )}

        {count > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10">
            <aside className="lg:col-span-4 space-y-6 text-[12px]">
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((s) => {
                  const n = Number(first.distribution?.[s] ?? 0);
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className="w-8 text-[#5F5F5F]">{s} ★</span>
                      <span className="flex-1 h-1.5 bg-[#EEEEEE] dark:bg-white/10 overflow-hidden">
                        <span className="block h-full bg-tk-accent dark:bg-tk-accent-night" style={{ width: `${count ? (n / count) * 100 : 0}%` }} />
                      </span>
                      <span className="w-6 text-right text-[#5F5F5F] tabular-nums">{n}</span>
                    </div>
                  );
                })}
              </div>
              {[['Longevity', first.longevity], ['Sillage', first.sillage]].map(([label, rows]) =>
                rows?.length ? (
                  <div key={label}>
                    <p className="text-[11.5px] uppercase tracking-[0.16em] text-[#666666] mb-1.5">{label}, as buyers felt it</p>
                    <ul className="space-y-1">
                      {rows.map((r) => (
                        <li key={r.label} className="flex justify-between"><span>{r.label}</span><span className="text-[#5F5F5F] tabular-nums">{r.count}</span></li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </aside>

            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#666666]">{count} review{count === 1 ? '' : 's'}</p>
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort reviews" className="text-[12px] border border-[#E0E0E0] dark:border-white/20 bg-transparent dark:bg-tk-night px-2 py-1">
                  {SORTS.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-[11.5px] text-rose-600 mb-3">{error}</p>}
              <ul className="divide-y divide-[#F0F0F0] dark:divide-white/10">
                {reviews.map((r) => (
                  <li key={r.id} className="py-6 space-y-2">
                    <div className="flex items-center gap-3">
                      <Stars value={r.rating} />
                      {r.title && <p className="text-[13.5px] font-medium text-tk-ink dark:text-white">{r.title}</p>}
                    </div>
                    {r.body && <p className="text-[13px] leading-relaxed text-[#444444] dark:text-[#CCCCCC] whitespace-pre-line">{r.body}</p>}
                    {(r.longevity || r.sillage) && (
                      <p className="text-[11px] text-[#666666]">{[r.longevity && `Longevity: ${r.longevity}`, r.sillage && `Sillage: ${r.sillage}`].filter(Boolean).join(' · ')}</p>
                    )}
                    {r.media?.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {r.media.map((path) => {
                          const url = publicUrl(SUPABASE_URL, 'reviews', path);
                          return (
                            <a key={path} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 bg-[#F4F3EE] dark:bg-white/5 overflow-hidden block">
                              <img src={url} alt="Customer photo" loading="lazy" className="w-full h-full object-cover" />
                            </a>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#666666] pt-1">
                      <span className="text-tk-ink dark:text-white">{r.display_name}</span>
                      {r.city && <span>{r.city}</span>}
                      {r.verified && <span className="text-emerald-700 dark:text-emerald-400">Verified buyer</span>}
                      <span>{fmtDate(r.created_at)}</span>
                      {!r.mine && (
                        <button type="button" onClick={() => vote(r.id)} className={`ml-auto underline underline-offset-2 ${r.voted ? 'text-tk-ink dark:text-white' : ''}`} aria-pressed={r.voted}>
                          Helpful{r.helpful_count ? ` (${r.helpful_count})` : ''}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {query.hasNextPage && (
                <button type="button" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage} className="mt-4 text-[11px] uppercase tracking-[0.16em] underline underline-offset-4">
                  {query.isFetchingNextPage ? 'Loading…' : 'Show more reviews'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
