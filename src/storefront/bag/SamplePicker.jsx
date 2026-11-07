import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSamplePool } from './useQuote';
import { useSetting } from '../../lib/bootstrap';
import { PLACEHOLDER_IMAGE } from '../catalog/adapter';

/**
 * The free-sample slots in the bag. Each slot is a scent from the admin's sample list or
 * "Surprise me" (we choose at dispatch). Slots come from the server's entitlement.
 */
export default function SamplePicker({ samples: s, picks = [], onChange }) {
  const heading = useSetting('samples.bag_heading', 'Your free samples');
  const helper = useSetting('samples.bag_text', '');
  const [slot, setSlot] = useState(null);
  const { data: pool = [] } = useSamplePool(!!s?.enabled);
  if (!s?.enabled) return null;

  const entitlement = s.entitlement || 0;
  const size = s.sample_size_ml || 5;
  const nameOf = (id) => pool.find((p) => p.variant_id === id)?.name;
  const choose = (index, variantId) => {
    const next = Array.from({ length: entitlement }, (_, i) => picks[i] ?? null);
    next[index] = variantId;
    while (next.length && next[next.length - 1] === null) next.pop();
    onChange(next);
    setSlot(null);
  };

  return (
    <div className="rounded-xs border border-tk-accent/25 dark:border-tk-gold/25 bg-[#FBF8F3] dark:bg-[#17141A] p-3.5 text-[11px]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-bold uppercase tracking-wider text-tk-ink dark:text-white">{heading}</p>
        {entitlement > 0 && (
          <span className="text-tk-accent dark:text-tk-accent-night font-semibold whitespace-nowrap">
            {entitlement} × {size} ml free
          </span>
        )}
      </div>
      {helper && <p className="text-[10.5px] text-[#777777] dark:text-white/60 mt-1 leading-relaxed">{helper}</p>}

      {entitlement > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {Array.from({ length: entitlement }, (_, i) => {
            const id = picks[i] ?? null;
            const name = id ? nameOf(id) : null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSlot(i)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 rounded-xs text-left hover:border-tk-accent dark:hover:border-tk-gold transition-colors cursor-pointer"
              >
                <span className="truncate">
                  <span className="text-[#999999] dark:text-white/40 mr-1.5">{i + 1}.</span>
                  {name ? <span className="font-semibold text-tk-ink dark:text-white">{name}</span> : <span className="text-[#777777] dark:text-white/60">Surprise me</span>}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-tk-accent dark:text-tk-accent-night shrink-0">Change</span>
              </button>
            );
          })}
        </div>
      )}

      {s.next_threshold_ml != null && (
        <p className="mt-2 text-[10.5px] text-[#666666] dark:text-white/60">
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
              <p className="text-[12px] font-bold uppercase tracking-wider">Free sample {slot + 1}</p>
              <button type="button" onClick={() => setSlot(null)} aria-label="Close" className="p-1 text-tk-ink dark:text-white">✕</button>
            </div>
            <div data-lenis-prevent="true" className="flex-1 overflow-y-auto p-4 space-y-2">
              <button
                type="button"
                onClick={() => choose(slot, null)}
                className={`w-full flex items-center gap-3 p-2.5 border rounded-xs text-left cursor-pointer ${picks[slot] == null ? 'border-tk-ink dark:border-white' : 'border-black/[0.08] dark:border-white/10'}`}
              >
                <span className="w-12 h-12 flex items-center justify-center bg-[#F5F2EC] dark:bg-white/10 text-tk-accent dark:text-tk-accent-night text-lg">✦</span>
                <span>
                  <span className="block text-[12px] font-semibold">Surprise me</span>
                  <span className="block text-[10.5px] text-[#777777] dark:text-white/60">We'll pick a scent you don't already have.</span>
                </span>
              </button>
              {pool.length === 0 && <p className="text-[11px] text-[#777777] dark:text-white/60 py-4 text-center">No scents to choose from right now — we'll surprise you.</p>}
              {pool.map((p) => {
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
                      <span className="block text-[12px] font-semibold uppercase tracking-wide truncate">{p.name}</span>
                      <span className="block text-[10.5px] text-[#777777] dark:text-white/60">{[p.family, p.label].filter(Boolean).join(' · ')}</span>
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
