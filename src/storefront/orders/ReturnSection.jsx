import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toFriendlyError } from '../../lib/errors';
import { useSetting } from '../../lib/bootstrap';
import { uploadPrivate } from '../../lib/media/privateUpload';
import { formatOrderDate } from './useOrders';

export const RETURN_REASONS = [
  { value: 'DAMAGED', label: 'Arrived damaged' },
  { value: 'LEAKING', label: 'Bottle is leaking' },
  { value: 'WRONG_ITEM', label: 'Wrong item' },
  { value: 'MISSING_ITEM', label: 'Something is missing' },
];

export const RETURN_STATUS_LABEL = {
  REQUESTED: 'Return requested — we will reply soon',
  APPROVED: 'Return approved',
  PICKUP_SCHEDULED: 'Pickup scheduled',
  IN_TRANSIT: 'On its way back to us',
  RECEIVED: 'Received — we are resolving it',
  REFUNDED: 'Refunded',
  REPLACED: 'Replacement sent',
  REJECTED: 'Return declined',
};

const input = 'w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-tk-ink dark:focus:border-white text-[12.5px]';

/** Order page: ask for a return after delivery, then follow it. */
export default function ReturnSection({ order }) {
  const qc = useQueryClient();
  const windowDays = Number(useSetting('returns.window_days', 7)) || 7;
  const policy = useSetting('returns.policy_text', '');
  const { data: ret, isLoading } = useQuery({
    queryKey: ['orders', 'return', order.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('returns').select('*').eq('order_id', order.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('DAMAGED');
  const [details, setDetails] = useState('');
  const [qty, setQty] = useState({});
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState({ courier: 'India Post', number: '' });

  const items = order.order_items.filter((i) => i.line_type === 'item');
  const deliveredAt = order.delivered_at ? new Date(order.delivered_at).getTime() : 0;
  const closesAt = deliveredAt + windowDays * 86400000;
  const canRequest = order.status === 'DELIVERED' && deliveredAt && Date.now() < closesAt && !ret;

  if (isLoading) return null;

  if (ret) {
    return (
      <div className="p-5 border border-[#EEEEEE] dark:border-white/10 space-y-2 text-[12.5px]">
        <p className="text-[12px] uppercase tracking-[0.2em] text-tk-accent-ink dark:text-tk-accent-night font-medium">Return</p>
        <p className="font-medium">{RETURN_STATUS_LABEL[ret.status] ?? ret.status}</p>
        {ret.customer_note && <p className="text-[#666666] dark:text-[#AAAAAA]">{ret.customer_note}</p>}
        {ret.status === 'APPROVED' && ret.return_method === 'PICKUP' && <p className="text-[#666666] dark:text-[#AAAAAA]">Our courier partner will contact you to collect it.</p>}
        {ret.status === 'APPROVED' && ret.return_method === 'POST' && (
          <form
            className="space-y-2 pt-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              const { error: err } = await supabase.rpc('set_return_tracking', { p_return: ret.id, p_courier: tracking.courier, p_tracking: tracking.number });
              if (err) setError(toFriendlyError(err));
              else await qc.invalidateQueries({ queryKey: ['orders', 'return', order.id] });
            }}
          >
            <p className="text-[#666666] dark:text-[#AAAAAA]">Please post it back to us, then enter the article or tracking number.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className={input} aria-label="Courier" value={tracking.courier} onChange={(e) => setTracking({ ...tracking, courier: e.target.value })} />
              <input className={input} aria-label="Tracking number" placeholder="e.g. EK123456789IN" value={tracking.number} onChange={(e) => setTracking({ ...tracking, number: e.target.value })} />
            </div>
            {error && <p className="text-rose-600 text-[12px]">{error}</p>}
            <button type="submit" className="px-4 py-2 bg-tk-ink text-white dark:bg-white dark:text-tk-night text-[12px] uppercase tracking-wider rounded-[2px]">Save tracking number</button>
          </form>
        )}
        {ret.return_tracking && <p className="text-[#666666]">Return tracking: {ret.return_courier} · {ret.return_tracking}</p>}
      </div>
    );
  }

  if (!canRequest) {
    if (order.status === 'DELIVERED' && deliveredAt) {
      return <p className="text-[12px] text-[#666666]">Returns closed on {formatOrderDate(new Date(closesAt).toISOString())}.</p>;
    }
    return null;
  }

  if (!open) {
    return (
      <div className="text-[12.5px]">
        <button type="button" onClick={() => setOpen(true)} className="text-[12px] uppercase tracking-[0.16em] underline underline-offset-4">
          Problem with your order? Request a return
        </button>
        <p className="text-[12px] text-[#666666] mt-1">Open until {formatOrderDate(new Date(closesAt).toISOString())}.</p>
      </div>
    );
  }

  const chosen = items.filter((i) => (qty[i.id] ?? 0) > 0);
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!chosen.length) return setError('Choose the items with a problem.');
    if (files.length > 3) return setError('Add up to 3 photos or videos.');
    setBusy(true);
    try {
      const paths = [];
      for (const f of files) paths.push(await uploadPrivate('returns', f, order.id));
      const { error: err } = await supabase.rpc('request_return', {
        p_order: order.id,
        p_reason: reason,
        p_details: details,
        p_items: chosen.map((i) => ({ order_item_id: i.id, qty: qty[i.id] })),
        p_media: paths,
      });
      if (err) throw err;
      await qc.invalidateQueries({ queryKey: ['orders', 'return', order.id] });
      setOpen(false);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-5 border border-[#EEEEEE] dark:border-white/10 space-y-4 text-[12.5px]">
      <p className="font-medium">Request a return</p>
      {policy && <p className="text-[#666666] dark:text-[#AAAAAA]">{policy}</p>}
      <div>
        <label htmlFor="ret-reason" className="block text-[12px] uppercase tracking-wider text-[#5F5F5F] mb-1">What went wrong?</label>
        <select id="ret-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={`${input} dark:bg-[#141318]`}>
          {RETURN_REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <fieldset className="space-y-2">
        <legend className="block text-[12px] uppercase tracking-wider text-[#5F5F5F] mb-1">Which items?</legend>
        {items.map((i) => (
          <label key={i.id} className="flex items-center gap-3">
            <select
              aria-label={`How many ${i.product_name}`}
              value={qty[i.id] ?? 0}
              onChange={(e) => setQty({ ...qty, [i.id]: Number(e.target.value) })}
              className="border border-[#E0E0E0] dark:border-white/20 bg-transparent dark:bg-[#141318] px-2 py-1"
            >
              {Array.from({ length: i.qty + 1 }, (_, n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>{i.product_name} · {i.variant_label}</span>
          </label>
        ))}
      </fieldset>
      <div>
        <label htmlFor="ret-details" className="block text-[12px] uppercase tracking-wider text-[#5F5F5F] mb-1">Tell us more</label>
        <textarea id="ret-details" rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} className={input} placeholder="e.g. The cap was cracked and the box was wet." />
      </div>
      <div>
        <label htmlFor="ret-files" className="block text-[12px] uppercase tracking-wider text-[#5F5F5F] mb-1">Photos or videos (up to 3)</label>
        <input id="ret-files" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple onChange={(e) => setFiles([...(e.target.files ?? [])].slice(0, 3))} />
        {files.length > 0 && <p className="text-[12px] text-[#666666] mt-1">{files.map((f) => f.name).join(', ')}</p>}
      </div>
      {error && <p className="text-rose-600 text-[12px]">{error}</p>}
      <div className="flex gap-4">
        <button type="submit" disabled={busy} className="px-5 py-2 bg-tk-ink text-white dark:bg-white dark:text-tk-night text-[12px] uppercase tracking-wider rounded-[2px] disabled:opacity-60">
          {busy ? 'Sending…' : 'Send request'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[12px] uppercase tracking-wider text-[#5F5F5F]">Cancel</button>
      </div>
    </form>
  );
}
