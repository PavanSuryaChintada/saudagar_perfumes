import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvailableCoupons } from './useQuote';
import { formatINR } from '../../lib/money';

/**
 * "Apply coupon": type a code, or pick one of the offers available for this bag. The server decides
 * whether a code works; this sheet only shows its answer.
 */
export function CouponRow({ quote, couponCode, onApply, onRemove, cart }) {
  const [open, setOpen] = useState(false);
  const coupon = quote?.coupon;
  return (
    <div className="text-[11px]">
      {couponCode ? (
        <div className={`flex items-start justify-between gap-2 px-3 py-2 rounded-xs border ${coupon?.ok ? 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800/50' : 'border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-900/50'}`}>
          <div className="min-w-0">
            <p className="font-bold uppercase tracking-wider">{couponCode}</p>
            {coupon && <p className={coupon.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{coupon.message}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={() => setOpen(true)} className="uppercase tracking-wider text-[10px] text-[#777777] dark:text-white/60 underline underline-offset-2">Change</button>
            <button type="button" onClick={onRemove} className="uppercase tracking-wider text-[10px] text-rose-600 underline underline-offset-2">Remove</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2.5 border border-dashed border-black/20 dark:border-white/20 rounded-xs font-semibold uppercase tracking-wider hover:border-tk-accent dark:hover:border-tk-gold transition-colors cursor-pointer"
        >
          <span>Apply a coupon</span>
          <span className="text-tk-accent dark:text-tk-accent-night">→</span>
        </button>
      )}
      <CouponSheet open={open} onClose={() => setOpen(false)} cart={cart} current={couponCode} onApply={(code) => { onApply(code); setOpen(false); }} />
    </div>
  );
}

function CouponSheet({ open, onClose, cart, current, onApply }) {
  const [code, setCode] = useState('');
  const { data: offers = [], isLoading } = useAvailableCoupons(cart, open);
  const submit = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase().replace(/\s+/g, '');
    if (c) onApply(c);
    setCode('');
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-label="Apply a coupon"
          className="fixed inset-x-0 bottom-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[28rem] z-[70] bg-white dark:bg-[#0E0C10] text-tk-ink dark:text-white flex flex-col max-h-[85svh] sm:max-h-none border-t sm:border-t-0 sm:border-l border-black/[0.08] dark:border-white/10 shadow-2xl"
        >
          <div className="flex items-center justify-between p-4 border-b border-black/[0.06] dark:border-white/[0.08]">
            <p className="text-[12px] font-bold uppercase tracking-wider">Apply a coupon</p>
            <button type="button" onClick={onClose} aria-label="Close" className="p-1">✕</button>
          </div>
          <form onSubmit={submit} className="flex gap-2 p-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ENTER CODE"
              aria-label="Coupon code"
              autoCapitalize="characters"
              className="flex-1 px-3 py-2 bg-black/[0.05] dark:bg-white/[0.07] rounded-xs text-[11px] tracking-wider uppercase outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-tk-ink hover:bg-tk-accent dark:bg-tk-gold dark:text-tk-night text-white text-[10.5px] font-bold uppercase tracking-wide rounded-xs cursor-pointer">
              Apply
            </button>
          </form>
          <div data-lenis-prevent="true" className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
            {isLoading && <p className="text-[11px] text-[#777777]">Looking for offers…</p>}
            {!isLoading && offers.length === 0 && <p className="text-[11px] text-[#777777] dark:text-white/60">No offers for this bag right now. Have a code? Type it above.</p>}
            {offers.map((o) => (
              <div key={o.id} className={`p-3 border rounded-xs ${o.ok ? 'border-black/10 dark:border-white/15' : 'border-black/[0.06] dark:border-white/10 opacity-70'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-wider">
                      {o.code}
                      {o.kind !== 'general' && <span className="ml-2 text-[9.5px] text-tk-accent dark:text-tk-accent-night">{o.kind === 'welcome' ? 'Your welcome gift' : 'Your birthday gift'}</span>}
                    </p>
                    {o.description && <p className="text-[11px] text-[#555555] dark:text-white/70 mt-0.5">{o.description}</p>}
                    <p className={`text-[10.5px] mt-1 ${o.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#777777] dark:text-white/50'}`}>
                      {o.ok ? `You save ${formatINR(Number(o.discount))}` : o.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!o.ok || current === o.code}
                    onClick={() => onApply(o.code)}
                    className="shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-tk-ink dark:border-white rounded-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {current === o.code ? 'Applied' : 'Apply'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
