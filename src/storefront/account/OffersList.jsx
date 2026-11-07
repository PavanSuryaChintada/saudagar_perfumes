import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { formatINR } from '../../lib/money';
import { toFriendlyError } from '../../lib/errors';

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '');

/** Account → Offers: the customer's personal codes (welcome, birthday, any code made just for them). */
export default function OffersList() {
  const { user } = useAuth();
  const [copied, setCopied] = useState('');
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['account', 'offers', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [coupons, used] = await Promise.all([
        supabase.from('coupons').select('id, code, kind, description, discount_type, value, max_discount, min_order, starts_at, expires_at, is_active, first_order_only').eq('assigned_user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('coupon_redemptions').select('coupon_id').is('released_at', null),
      ]);
      if (coupons.error) throw coupons.error;
      const usedIds = new Set((used.data ?? []).map((r) => r.coupon_id));
      return (coupons.data ?? []).map((c) => ({ ...c, used: usedIds.has(c.id) }));
    },
  });

  if (isLoading) return <p className="py-16 text-center text-[#888888] text-[13px]">Loading offers…</p>;
  if (error) return <p className="py-16 text-center text-rose-600 text-[13px]">{toFriendlyError(error)}</p>;
  if (data.length === 0) return <p className="py-16 text-center text-[#888888] text-[13px]">No personal offers right now. Add your birthday in Personal Details for a birthday treat.</p>;

  const now = Date.now();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {data.map((c) => {
        const expired = c.expires_at && new Date(c.expires_at).getTime() <= now;
        const upcoming = c.starts_at && new Date(c.starts_at).getTime() > now;
        const state = c.used ? 'Used' : expired ? 'Expired' : !c.is_active ? 'Not active' : upcoming ? `From ${fmt(c.starts_at)}` : c.expires_at ? `Valid until ${fmt(c.expires_at)}` : 'Ready to use';
        const usable = !c.used && !expired && c.is_active && !upcoming;
        const value = c.discount_type === 'PERCENT' ? `${Number(c.value)}% off` : `${formatINR(Number(c.value))} off`;
        return (
          <div key={c.id} className={`p-6 rounded-[2px] border ${usable ? 'border-tk-ink dark:border-white/30' : 'border-[#EEEEEE] dark:border-white/10 opacity-70'}`}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-tk-accent dark:text-tk-accent-night font-medium">
              {c.kind === 'welcome' ? 'Welcome gift' : c.kind === 'birthday' ? 'Birthday gift' : 'Just for you'}
            </p>
            <p className="text-[22px] font-normal tracking-tight mt-1">{value}</p>
            {c.description && <p className="text-[12.5px] text-[#666666] dark:text-[#AAAAAA] mt-0.5">{c.description}</p>}
            <p className="text-[11.5px] text-[#888888] mt-1">
              {[c.min_order > 0 && `On orders of ${formatINR(Number(c.min_order))}+`, c.max_discount && `up to ${formatINR(Number(c.max_discount))}`, c.first_order_only && 'first order only']
                .filter(Boolean)
                .join(' · ')}
            </p>
            <div className="mt-4 pt-3 border-t border-[#F0F0F0] dark:border-white/10 flex items-center justify-between gap-3">
              <span className="font-mono text-[14px] tracking-wider">{c.code}</span>
              {usable ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(c.code);
                      setCopied(c.code);
                      setTimeout(() => setCopied(''), 1800);
                    } catch {
                      // clipboard blocked: the code is visible to copy by hand
                    }
                  }}
                  className="text-[11px] uppercase tracking-wider text-tk-ink dark:text-white underline underline-offset-4"
                >
                  {copied === c.code ? 'Copied' : 'Copy code'}
                </button>
              ) : null}
            </div>
            <p className="text-[10.5px] uppercase tracking-wider text-[#999999] mt-2">{state}</p>
          </div>
        );
      })}
    </div>
  );
}
