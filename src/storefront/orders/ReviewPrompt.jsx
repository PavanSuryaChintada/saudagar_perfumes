import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { toFriendlyError } from '../../lib/errors';
import { uploadPrivate } from '../../lib/media/privateUpload';

const input = 'w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-tk-ink dark:focus:border-white text-[12.5px]';

/** Delivered orders: "Write a review" for each fragrance the customer hasn't reviewed yet. */
export default function ReviewPrompt({ order }) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ['reviewable'],
    enabled: order.status === 'DELIVERED',
    queryFn: async () => {
      const { data, error } = await supabase.rpc('reviewable_items');
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: options = [] } = useQuery({
    queryKey: ['review-options'],
    enabled: items.length > 0,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('attribute_options').select('id, kind, label').in('kind', ['longevity', 'sillage']).eq('is_active', true).order('position');
      if (error) throw error;
      return data ?? [];
    },
  });
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ rating: 5, title: '', body: '', longevity: '', sillage: '', name: '', city: '' });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [thanks, setThanks] = useState(false);

  const mine = items.filter((i) => order.order_items.some((oi) => oi.id === i.order_item_id || (oi.line_type === 'item' && oi.product_slug === i.product_slug)));
  if (order.status !== 'DELIVERED' || (mine.length === 0 && !thanks)) return null;

  const start = (item) => {
    setOpen(item);
    setError('');
    setFiles([]);
    setForm({ rating: 5, title: '', body: '', longevity: '', sillage: '', name: (profile?.full_name || '').split(' ')[0] || '', city: order.shipping_address?.city || '' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const paths = [];
      for (const f of files.slice(0, 4)) paths.push(await uploadPrivate('reviews', f, open.product_id));
      const { error: err } = await supabase.rpc('submit_review', {
        p_order_item: open.order_item_id,
        p_rating: form.rating,
        p_title: form.title,
        p_body: form.body,
        p_longevity: form.longevity || null,
        p_sillage: form.sillage || null,
        p_display_name: form.name,
        p_city: form.city,
        p_media: paths,
      });
      if (err) throw err;
      setOpen(null);
      setThanks(true);
      await qc.invalidateQueries({ queryKey: ['reviewable'] });
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5 border border-[#EEEEEE] dark:border-white/10 space-y-3 text-[12.5px]">
      <p className="text-[10px] uppercase tracking-[0.2em] text-tk-accent dark:text-tk-accent-night font-medium">Your reviews</p>
      {thanks && <p className="text-emerald-700 dark:text-emerald-400">Thank you! Your review will appear once we've checked it.</p>}
      {mine.map((i) => (
        <div key={i.order_item_id} className="flex items-center justify-between gap-3">
          <span>{i.product_name}</span>
          <button type="button" onClick={() => start(i)} className="text-[11px] uppercase tracking-[0.14em] underline underline-offset-4">Write a review</button>
        </div>
      ))}

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              onSubmit={submit}
              role="dialog"
              aria-modal="true"
              aria-label={`Review ${open.product_name}`}
              data-lenis-prevent="true"
              className="w-full max-w-md max-h-[90svh] overflow-y-auto bg-white dark:bg-[#141318] text-tk-ink dark:text-white p-6 rounded-[2px] border border-[#EAEAEA] dark:border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-medium">Review {open.product_name}</p>
                <button type="button" onClick={() => setOpen(null)} aria-label="Close">✕</button>
              </div>
              <div role="radiogroup" aria-label="Your rating" className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={form.rating === s} aria-label={`${s} star${s === 1 ? '' : 's'}`} onClick={() => setForm({ ...form, rating: s })} className={`text-[26px] leading-none ${s <= form.rating ? 'text-tk-accent dark:text-tk-accent-night' : 'text-[#DDDDDD] dark:text-white/20'}`}>
                    ★
                  </button>
                ))}
              </div>
              <input className={input} maxLength={120} placeholder="Title (optional), e.g. Lasts all evening" aria-label="Review title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className={input} rows={4} maxLength={2000} placeholder="How does it wear on you?" aria-label="Your review" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                {[['longevity', 'Longevity'], ['sillage', 'Sillage']].map(([k, label]) => (
                  <select key={k} aria-label={label} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={`${input} dark:bg-[#141318]`}>
                    <option value="">{label}…</option>
                    {options.filter((o) => o.kind === k).map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className={input} maxLength={60} placeholder="Name to show" aria-label="Name to show" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className={input} maxLength={60} placeholder="City" aria-label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label htmlFor="rv-files" className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">Photos (up to 4)</label>
                <input id="rv-files" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles([...(e.target.files ?? [])].slice(0, 4))} />
              </div>
              {error && <p className="text-rose-600 text-[11.5px]">{error}</p>}
              <button type="submit" disabled={busy} className="w-full py-2.5 bg-tk-ink text-white dark:bg-white dark:text-tk-night text-[11px] uppercase tracking-wider rounded-[2px] disabled:opacity-60">
                {busy ? 'Sending…' : 'Submit review'}
              </button>
              <p className="text-[10.5px] text-[#888888]">Reviews show after a quick check. Please keep them about the fragrance.</p>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
