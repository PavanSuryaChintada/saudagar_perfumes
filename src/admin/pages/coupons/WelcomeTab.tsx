import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { Panel } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextInput, Toggle } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { throwIf } from '../../catalog/api';
import { describeOffer } from './CouponsPage';

interface Tier {
  id: string;
  label: string;
  discount_type: 'PERCENT' | 'FLAT';
  value: number;
  weight: number;
  is_active: boolean;
  position: number;
}

const KEYS = ['welcome.enabled', 'welcome.prefix', 'welcome.valid_days', 'welcome.min_order', 'welcome.max_discount', 'welcome.first_order_only'] as const;

/** Admin → Coupons → Welcome offer: one personal code per new customer, tier picked by weight. */
export default function WelcomeTab() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ['admin', 'welcome-settings'],
    queryFn: async () => {
      const rows = (await throwIf(supabase.from('settings').select('key, value').in('key', KEYS as unknown as string[]))) as { key: string; value: unknown }[];
      return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
    },
  });
  const tiers = useQuery({
    queryKey: ['admin', 'welcome-tiers'],
    queryFn: async () => (await throwIf(supabase.from('welcome_tiers').select('*').order('position').order('created_at'))) as Tier[],
  });
  const stats = useQuery({
    queryKey: ['admin', 'welcome-stats'],
    queryFn: async () => {
      const rows = (await throwIf(supabase.from('coupons').select('welcome_tier_id, coupon_redemptions(released_at)').eq('kind', 'welcome'))) as unknown as {
        welcome_tier_id: string | null;
        coupon_redemptions: { released_at: string | null }[];
      }[];
      const out = new Map<string, { issued: number; used: number }>();
      for (const r of rows ?? []) {
        const k = r.welcome_tier_id ?? 'none';
        const s = out.get(k) ?? { issued: 0, used: 0 };
        s.issued += 1;
        if (r.coupon_redemptions.some((x) => !x.released_at)) s.used += 1;
        out.set(k, s);
      }
      return out;
    },
  });

  const [form, setForm] = useState({ enabled: true, prefix: 'WELCOME', valid_days: '30', min_order: '0', max_discount: '0', first_order_only: true });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const s = settings.data;
    if (!s) return;
    setForm({
      enabled: s['welcome.enabled'] !== false,
      prefix: String(s['welcome.prefix'] ?? 'WELCOME'),
      valid_days: String(s['welcome.valid_days'] ?? 30),
      min_order: String(s['welcome.min_order'] ?? 0),
      max_discount: String(s['welcome.max_discount'] ?? 0),
      first_order_only: s['welcome.first_order_only'] !== false,
    });
  }, [settings.data]);

  const saveSettings = async () => {
    const prefix = form.prefix.trim().toUpperCase();
    if (!/^[A-Z0-9_]{2,12}$/.test(prefix)) return toast.error('Prefix: 2–12 capital letters, numbers or _.');
    const days = Number(form.valid_days);
    if (!Number.isInteger(days) || days < 1) return toast.error('Valid days must be a whole number from 1.');
    if (!(Number(form.min_order) >= 0) || !(Number(form.max_discount) >= 0)) return toast.error('Amounts must be 0 or more.');
    setSaving(true);
    try {
      const updates: [string, unknown][] = [
        ['welcome.enabled', form.enabled],
        ['welcome.prefix', prefix],
        ['welcome.valid_days', days],
        ['welcome.min_order', Number(form.min_order)],
        ['welcome.max_discount', Number(form.max_discount)],
        ['welcome.first_order_only', form.first_order_only],
      ];
      for (const [key, value] of updates) await throwIf(supabase.from('settings').update({ value: value as never }).eq('key', key));
      await qc.invalidateQueries({ queryKey: ['admin', 'welcome-settings'] });
      toast.success('Welcome offer saved. New sign-ups get codes with these rules.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const [tier, setTier] = useState<Partial<Tier> & { value_text?: string; weight_text?: string } | null>(null);
  const saveTier = async () => {
    if (!tier) return;
    const value = Number(tier.value_text);
    const weight = Number(tier.weight_text);
    if (!tier.label?.trim()) return toast.error('Give the tier a label customers will see.');
    if (!(value > 0) || (tier.discount_type === 'PERCENT' && value > 100)) return toast.error('Enter a discount above 0 (percent at most 100).');
    if (!Number.isInteger(weight) || weight < 0 || weight > 100) return toast.error('Share must be a whole number from 0 to 100.');
    const row = { label: tier.label.trim(), discount_type: tier.discount_type ?? 'PERCENT', value, weight, is_active: tier.is_active ?? true };
    try {
      if (tier.id) await throwIf(supabase.from('welcome_tiers').update(row).eq('id', tier.id));
      else await throwIf(supabase.from('welcome_tiers').insert({ ...row, position: (tiers.data ?? []).length }));
      setTier(null);
      await qc.invalidateQueries({ queryKey: ['admin', 'welcome-tiers'] });
      toast.success('Tier saved.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  const activeWeight = (tiers.data ?? []).filter((t) => t.is_active).reduce((s, t) => s + t.weight, 0);

  return (
    <div className="space-y-5">
      <Panel title="Rules" description="Every customer who signs up gets one personal code, shown in their account under Offers.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-[14px] sm:col-span-2">
            <Toggle checked={form.enabled} onChange={(on) => setForm({ ...form, enabled: on })} label="Give welcome codes" /> Give a welcome code to every new customer
          </label>
          <FieldShell label="Code prefix" htmlFor="w-prefix" help="Codes look like WELCOME-7KX2QD.">
            <TextInput id="w-prefix" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })} />
          </FieldShell>
          <FieldShell label="Valid for (days)" htmlFor="w-days">
            <TextInput id="w-days" inputMode="numeric" placeholder="e.g. 30" value={form.valid_days} onChange={(e) => setForm({ ...form, valid_days: e.target.value })} />
          </FieldShell>
          <FieldShell label="Minimum order (₹)" htmlFor="w-min" help="0 = no minimum.">
            <TextInput id="w-min" inputMode="decimal" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
          </FieldShell>
          <FieldShell label="Maximum discount (₹)" htmlFor="w-max" help="0 = no cap.">
            <TextInput id="w-max" inputMode="decimal" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} />
          </FieldShell>
          <label className="flex items-center gap-2 text-[14px]">
            <Toggle checked={form.first_order_only} onChange={(on) => setForm({ ...form, first_order_only: on })} label="First order only" /> First order only
          </label>
        </div>
        <Button className="mt-4" onClick={saveSettings} busy={saving}>Save rules</Button>
      </Panel>

      <Panel title="Tiers" description="Each new customer gets one tier, chosen at random by its share. Tiers that have issued codes are switched off, not deleted.">
        {activeWeight === 0 && <p className="mb-3 text-[13px] text-rose-600">No active tier has a share above 0, so no codes are given.</p>}
        <div className="border border-[#E2E0DB] divide-y divide-[#E9E7E2] bg-white">
          {(tiers.data ?? []).map((t) => {
            const s = stats.data?.get(t.id) ?? { issued: 0, used: 0 };
            const share = activeWeight && t.is_active ? Math.round((t.weight / activeWeight) * 100) : 0;
            return (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 text-[14px]">
                <div className="min-w-0 flex-1">
                  <p className={t.is_active ? '' : 'text-[#575757]'}>{t.label}</p>
                  <p className="text-[12px] text-[#4F4F4F]">
                    {describeOffer({ discount_type: t.discount_type, value: t.value, max_discount: null, min_order: 0 })} · {t.is_active ? `${share}% of new customers` : 'off'} · {s.issued} issued · {s.used} used
                  </p>
                </div>
                <Toggle
                  checked={t.is_active}
                  label={`${t.label} active`}
                  onChange={async (on) => {
                    try {
                      await throwIf(supabase.from('welcome_tiers').update({ is_active: on }).eq('id', t.id));
                      await qc.invalidateQueries({ queryKey: ['admin', 'welcome-tiers'] });
                    } catch (err) {
                      toast.error(toFriendlyError(err));
                    }
                  }}
                />
                <button type="button" aria-label={`Edit ${t.label}`} className="p-1.5 text-[#4A4A4A] hover:text-tk-ink" onClick={() => setTier({ ...t, value_text: String(t.value), weight_text: String(t.weight) })}>
                  <Pencil size={14} />
                </button>
              </div>
            );
          })}
        </div>
        <Button variant="secondary" className="mt-3" onClick={() => setTier({ label: '', discount_type: 'PERCENT', value_text: '', weight_text: '100', is_active: true })}>
          <Plus size={14} /> Add tier
        </Button>
      </Panel>

      <Modal
        open={!!tier}
        onOpenChange={(o) => !o && setTier(null)}
        title={tier?.id ? 'Edit tier' : 'New tier'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTier(null)}>Cancel</Button>
            <Button onClick={saveTier}>Save tier</Button>
          </>
        }
      >
        {tier && (
          <div className="space-y-4">
            <FieldShell label="Label customers see" htmlFor="t-label">
              <TextInput id="t-label" placeholder="e.g. 10% off your first order" value={tier.label ?? ''} onChange={(e) => setTier({ ...tier, label: e.target.value })} />
            </FieldShell>
            <div className="grid gap-4 sm:grid-cols-3">
              <FieldShell label="Type" htmlFor="t-type">
                <select id="t-type" value={tier.discount_type} onChange={(e) => setTier({ ...tier, discount_type: e.target.value as Tier['discount_type'] })} className="w-full border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white">
                  <option value="PERCENT">Percent</option>
                  <option value="FLAT">Flat ₹</option>
                </select>
              </FieldShell>
              <FieldShell label="Value" htmlFor="t-value">
                <TextInput id="t-value" inputMode="decimal" placeholder="e.g. 10" value={tier.value_text ?? ''} onChange={(e) => setTier({ ...tier, value_text: e.target.value })} />
              </FieldShell>
              <FieldShell label="Share (0–100)" htmlFor="t-weight" help="Relative chance.">
                <TextInput id="t-weight" inputMode="numeric" value={tier.weight_text ?? ''} onChange={(e) => setTier({ ...tier, weight_text: e.target.value })} />
              </FieldShell>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
