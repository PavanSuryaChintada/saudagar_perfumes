import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { formatIndianPhone } from '../../../lib/phone';
import { Panel } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextInput } from '../../ui/Field';
import { rpc } from '../../catalog/api';

interface BirthdayCustomer {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string;
  has_code: boolean;
}

const todayIST = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Admin → Coupons → Birthdays: pick a day, see who was born on it, release one code each. */
export default function BirthdayTab() {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayIST());
  const [y, m, d] = date.split('-').map(Number);
  const [offer, setOffer] = useState({ prefix: 'BDAY', discount_type: 'PERCENT', value: '15', max_discount: '', min_order: '', valid_days: '14', description: 'Happy birthday from us' });
  const [busy, setBusy] = useState(false);

  const list = useQuery({
    queryKey: ['admin', 'birthdays', m, d, y],
    enabled: !!m && !!d && !!y,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('birthday_customers', { p_month: m, p_day: d, p_year: y });
      if (error) throw error;
      return (data ?? []) as BirthdayCustomer[];
    },
  });
  const pending = (list.data ?? []).filter((c) => !c.has_code).length;

  const release = async () => {
    const value = Number(offer.value);
    if (!(value > 0) || (offer.discount_type === 'PERCENT' && value > 100)) return toast.error('Enter a discount above 0 (percent at most 100).');
    if (!/^[A-Z0-9_]{2,12}$/.test(offer.prefix.trim().toUpperCase())) return toast.error('Prefix: 2–12 capital letters, numbers or _.');
    setBusy(true);
    try {
      const n = await rpc<number>('release_birthday_coupons', {
        p_month: m,
        p_day: d,
        p_year: y,
        payload: { ...offer, prefix: offer.prefix.trim().toUpperCase(), value },
      });
      await qc.invalidateQueries({ queryKey: ['admin', 'birthdays'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast.success(n ? `${n} birthday code${n === 1 ? '' : 's'} released. Customers see them under Offers.` : 'Everyone born on this day already has a code this year.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel title="Choose a day" description="Customers add their birthday in Account → Personal details. The code works from a week before the birthday.">
        <FieldShell label="Birthday" htmlFor="b-date">
          <TextInput id="b-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[200px]" />
        </FieldShell>
        <div className="mt-4 border border-[#EAEAEA] divide-y divide-[#F0F0F0] bg-white">
          {list.isLoading && <p className="px-3 py-3 text-[13px] text-[#777777]">Loading…</p>}
          {list.error && <p className="px-3 py-3 text-[13px] text-rose-600">{toFriendlyError(list.error)}</p>}
          {!list.isLoading && (list.data ?? []).length === 0 && <p className="px-3 py-3 text-[13px] text-[#777777]">No customers have a birthday on this day.</p>}
          {(list.data ?? []).map((c) => (
            <div key={c.user_id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
              <div className="min-w-0 flex-1">
                <p>{c.full_name || 'Customer'}</p>
                <p className="text-[11px] text-[#888888]">{[c.email, c.phone && formatIndianPhone(c.phone)].filter(Boolean).join(' · ')}</p>
              </div>
              <span className={`text-[10.5px] uppercase tracking-[0.06em] ${c.has_code ? 'text-emerald-700' : 'text-[#888888]'}`}>{c.has_code ? `Has a ${y} code` : 'No code yet'}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Birthday offer" description="One personal code per customer per birthday year. Customers who already have one are skipped.">
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldShell label="Code prefix" htmlFor="b-prefix">
            <TextInput id="b-prefix" value={offer.prefix} onChange={(e) => setOffer({ ...offer, prefix: e.target.value.toUpperCase() })} />
          </FieldShell>
          <FieldShell label="Type" htmlFor="b-type">
            <select id="b-type" value={offer.discount_type} onChange={(e) => setOffer({ ...offer, discount_type: e.target.value })} className="w-full border border-[#D5D3CC] px-2 py-2 text-[13px] bg-white">
              <option value="PERCENT">Percent</option>
              <option value="FLAT">Flat ₹</option>
            </select>
          </FieldShell>
          <FieldShell label="Value" htmlFor="b-value">
            <TextInput id="b-value" inputMode="decimal" placeholder="e.g. 15" value={offer.value} onChange={(e) => setOffer({ ...offer, value: e.target.value })} />
          </FieldShell>
          <FieldShell label="Maximum discount (₹)" htmlFor="b-max" help="Optional.">
            <TextInput id="b-max" inputMode="decimal" placeholder="e.g. 1000" value={offer.max_discount} onChange={(e) => setOffer({ ...offer, max_discount: e.target.value })} />
          </FieldShell>
          <FieldShell label="Minimum order (₹)" htmlFor="b-min" help="Optional.">
            <TextInput id="b-min" inputMode="decimal" placeholder="e.g. 1999" value={offer.min_order} onChange={(e) => setOffer({ ...offer, min_order: e.target.value })} />
          </FieldShell>
          <FieldShell label="Valid days after the birthday" htmlFor="b-days">
            <TextInput id="b-days" inputMode="numeric" value={offer.valid_days} onChange={(e) => setOffer({ ...offer, valid_days: e.target.value })} />
          </FieldShell>
          <div className="sm:col-span-3">
            <FieldShell label="What the customer sees" htmlFor="b-desc">
              <TextInput id="b-desc" placeholder="e.g. Happy birthday from us" value={offer.description} onChange={(e) => setOffer({ ...offer, description: e.target.value })} />
            </FieldShell>
          </div>
        </div>
        <Button className="mt-4" onClick={release} busy={busy} disabled={pending === 0}>
          Release {pending} code{pending === 1 ? '' : 's'}
        </Button>
      </Panel>
    </div>
  );
}
