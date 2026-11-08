import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { suggestSamples, useSamplePool } from './useQuote';
import { SURPRISE, emptySlots, fillSlots, searchPool } from './samplePicks';
import { useSetting } from '../../lib/bootstrap';
import { PLACEHOLDER_IMAGE } from '../catalog/adapter';

/**
 * The free-sample slots in the bag. Each slot starts with a suggestion chosen like "Surprise me" (weighted by
 * stock, away from what's in the bag); the customer can swap it for any scent switched on as a sample, or for
 * "Surprise me" (we choose when packing). Slots come from the server's entitlement.
 */
const NONE = [];

export default function SamplePicker({ samples: s, picks = [], onChange, avoid = [] }) {
  const heading = useSetting('samples.bag_heading', 'Your free samples');
  const helper = useSetting('samples.bag_text', '');
  const [slot, setSlot] = useState(null);
  const [term, setTerm] = useState('');
  const { data: pool = NONE } = useSamplePool(!!s?.enabled);
  const entitlement = s?.enabled ? s.entitlement || 0 : 0;
  const shown = useMemo(() => searchPool(pool, term), [pool, term]);

  // Fill empty slots with real suggestions, once for each new set of empty slots.
  const asked = useRef('');
  const latest = useRef(picks);
  latest.current = picks;
  const avoidKey = avoid.join(',');
  const picksKey = JSON.stringify(picks);
  useEffect(() => {
    const current = JSON.parse(picksKey);
    const waiting = emptySlots(current, entitlement);
    if (!onChange || waiting.length === 0) return;
    const productOf = new Map(pool.map((p) => [p.variant_id, p.product_id]));
    const avoidIds = [...new Set([...(avoidKey ? avoidKey.split(',') : []), ...current.map((id) => productOf.get(id)).filter(Boolean)])];
    const key = JSON.stringify([entitlement, picksKey, avoidIds]);
    if (asked.current === key) return;
    asked.current = key;
    suggestSamples(waiting.length, avoidIds)
      .catch(() => [])
      .then((ids) => {
        // Only if nothing changed while we asked; otherwise this effect runs again for the new slots.
        if (JSON.stringify(latest.current) === picksKey) onChange(fillSlots(current, entitlement, ids));
      });
  }, [picksKey, entitlement, avoidKey, pool, onChange]);

  if (!s?.enabled) return null;

  const size = s.sample_size_ml || 5;
  const nameOf = (id) => pool.find((p) => p.variant_id === id)?.name;
  const choose = (index, variantId) => {
    const next = Array.from({ length: entitlement }, (_, i) => picks[i] ?? SURPRISE);
    next[index] = variantId ?? SURPRISE;
    onChange(next);
    setSlot(null);
    setTerm('');
  };

  return (
    <div className="rounded-xs border border-tk-accent/25 dark:border-tk-gold/25 bg-[#FBF8F3] dark:bg-[#17141A] p-3.5 text-[12px]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-bold uppercase tracking-wider text-tk-ink dark:text-white">{heading}</p>
        {entitlement > 0 && (
          <span className="text-tk-accent-ink dark:text-tk-accent-night font-semibold whitespace-nowrap">
            {entitlement} × {size} ml free
          </span>
        )}
      </div>
      {helper && <p className="text-[12px] text-[#5F5F5F] dark:text-white/60 mt-1 leading-relaxed">{helper}</p>}

      {entitlement > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {Array.from({ length: entitlement }, (_, i) => {
            const id = picks[i] ?? null;
            const name = id && id !== SURPRISE ? nameOf(id) : null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSlot(i)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 rounded-xs text-left hover:border-tk-accent dark:hover:border-tk-gold transition-colors cursor-pointer"
              >
                <span className="truncate">
                  <span className="text-[#6B6B6B] dark:text-white/60 mr-1.5">{i + 1}.</span>
                  {name ? (
                    <span className="font-semibold text-tk-ink dark:text-white">{name}</span>
                  ) : (
                    <span className="text-[#666666] dark:text-white/60">{id ? 'Surprise me' : 'Choosing for you…'}</span>
                  )}
                </span>
                <span className="text-[12px] uppercase tracking-wider text-tk-accent-ink dark:text-tk-accent-night shrink-0">Change</span>
              </button>
            );
          })}
        </div>
      )}

      {s.next_threshold_ml != null && (
        <p className="mt-2 text-[12px] text-[#666666] dark:text-white/60">
          {entitlement === 0 ? 'Add' : 'Add'} {Math.ceil(s.next_threshold_ml)} ml more of perfume for {entitlement === 0 ? 'a free sample' : 'another free sample'}.
        </p>
      )}

      <AnimatePresence>
        {slot !== null && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Choose free sample ${slot + 1}`}
            className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-0 z-[60] bg-white dark:bg-[#0E0C10] flex flex-col max-h-[85svh] sm:max-h-none border-t border-black/[0.08] dark:border-white/10"
          >
            <div className="flex items-center justify-between p-4 border-b border-black/[0.06] dark:border-white/[0.08]">
              <p className="text-[12.5px] font-bold uppercase tracking-wider">Free sample {slot + 1}</p>
              <button type="button" onClick={() => { setSlot(null); setTerm(''); }} aria-label="Close" className="p-1 text-tk-ink dark:text-white">✕</button>
            </div>
            <div className="px-4 pt-3">
              <input
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search scents"
                aria-label="Search scents"
                autoFocus
                className="w-full px-3 py-2.5 border border-black/[0.12] dark:border-white/15 bg-white dark:bg-[#141318] text-[12.5px] text-tk-ink dark:text-white placeholder:text-[#777777] dark:placeholder:text-white/40 outline-none focus:border-tk-ink dark:focus:border-white rounded-xs"
              />
            </div>
            <div data-lenis-prevent="true" className="flex-1 overflow-y-auto p-4 space-y-2">
              <button
                type="button"
                onClick={() => choose(slot, null)}
                className={`w-full flex items-center gap-3 p-2.5 border rounded-xs text-left cursor-pointer ${picks[slot] === SURPRISE ? 'border-tk-ink dark:border-white' : 'border-black/[0.08] dark:border-white/10'}`}
              >
                <span className="w-12 h-12 flex items-center justify-center bg-[#F5F2EC] dark:bg-white/10 text-tk-accent-ink dark:text-tk-accent-night text-lg">✦</span>
                <span>
                  <span className="block text-[12.5px] font-semibold">Surprise me</span>
                  <span className="block text-[12px] text-[#5F5F5F] dark:text-white/60">We'll pick a scent you don't already have.</span>
                </span>
              </button>
              {pool.length === 0 && <p className="text-[12px] text-[#666666] dark:text-white/60 py-4 text-center">No scents to choose from right now. We'll surprise you.</p>}
              {pool.length > 0 && shown.length === 0 && <p className="text-[12px] text-[#666666] dark:text-white/60 py-4 text-center">No scents match “{term}”.</p>}
              {shown.map((p) => {
                const taken = !s.allow_duplicates && picks.some((x, j) => j !== slot && x === p.variant_id);
                return (
                  <button
                    key={p.variant_id}
                    type="button"
                    disabled={taken}
                    onClick={() => choose(slot, p.variant_id)}
                    className={`w-full flex items-center gap-3 p-2.5 border rounded-xs text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${picks[slot] === p.variant_id ? 'border-tk-ink dark:border-white' : 'border-black/[0.08] dark:border-white/10'}`}
                  >
                    <img src={p.image || PLACEHOLDER_IMAGE} alt="" className="w-12 h-12 object-contain bg-[#F7F7F6] dark:bg-[#18171C]" />
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold uppercase tracking-wide truncate">{p.name}</span>
                      <span className="block text-[12px] text-[#5F5F5F] dark:text-white/60">{[p.family, p.label].filter(Boolean).join(' · ')}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
