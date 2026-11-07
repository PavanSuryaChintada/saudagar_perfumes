import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { toFriendlyError } from '../../lib/errors';
import { PageHeader, Panel } from '../ui/PageHeader';
import { Button } from '../ui/Button';
import { FieldShell, TextArea, TextInput, Toggle } from '../ui/Field';
import { throwIf } from '../catalog/api';
import { useShippingSettings, type Courier } from '../orders/shipping';

const pins = (text: string) => [...new Set(text.split(/[\s,;]+/).map((p) => p.trim()).filter(Boolean))];

export default function ShippingSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useShippingSettings();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [form, setForm] = useState({
    default_courier: 'other', blocked: '', cod_blocked: '', surface_days: '2', packaging_g: '150', item_g: '300',
    box_l: '200', box_w: '150', box_h: '100', status_updates: 'webhook', dl_enabled: false, dl_mode: 'staging', dl_pickup: '',
  });
  const [saving, setSaving] = useState(false);
  const [testPin, setTestPin] = useState('');
  const [testResult, setTestResult] = useState<{ serviceable: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!data) return;
    const box = (data['shipping.default_box'] ?? {}) as Record<string, number>;
    setCouriers(Array.isArray(data['shipping.couriers']) ? (data['shipping.couriers'] as Courier[]) : []);
    setForm({
      default_courier: String(data['shipping.default_courier'] ?? 'other'),
      blocked: ((data['shipping.blocked_pincodes'] as string[]) ?? []).join(', '),
      cod_blocked: ((data['shipping.cod_blocked_pincodes'] as string[]) ?? []).join(', '),
      surface_days: String(data['shipping.surface_extra_days'] ?? 2),
      packaging_g: String(data['shipping.packaging_g'] ?? 150),
      item_g: String(data['shipping.default_item_g'] ?? 300),
      box_l: String(box.length_mm ?? 200),
      box_w: String(box.width_mm ?? 150),
      box_h: String(box.height_mm ?? 100),
      status_updates: String(data['shipping.status_updates'] ?? 'webhook'),
      dl_enabled: data['delhivery.enabled'] === true,
      dl_mode: String(data['delhivery.mode'] ?? 'staging'),
      dl_pickup: String(data['delhivery.pickup_location'] ?? ''),
    });
  }, [data]);

  const save = async () => {
    const blocked = pins(form.blocked);
    const codBlocked = pins(form.cod_blocked);
    const bad = [...blocked, ...codBlocked].find((p) => !/^[1-9][0-9]{5}$/.test(p));
    if (bad) return toast.error(`“${bad}” is not a 6-digit pincode.`);
    for (const c of couriers) {
      if (!c.name.trim()) return toast.error('Every courier needs a name.');
      if (c.tracking_url && !/^https?:\/\//i.test(c.tracking_url)) return toast.error(`${c.name}: the tracking link must start with https://`);
    }
    const nums = [form.surface_days, form.packaging_g, form.item_g, form.box_l, form.box_w, form.box_h].map(Number);
    if (nums.some((n) => !Number.isInteger(n) || n < 0)) return toast.error('Days, weights and box sizes must be whole numbers.');
    if (form.dl_enabled && !form.dl_pickup.trim()) return toast.error('Enter the Delhivery pickup location name before switching it on.');
    setSaving(true);
    try {
      const updates: [string, unknown][] = [
        ['shipping.couriers', couriers.map((c) => ({ ...c, name: c.name.trim(), tracking_url: c.tracking_url.trim() }))],
        ['shipping.default_courier', form.default_courier],
        ['shipping.blocked_pincodes', blocked],
        ['shipping.cod_blocked_pincodes', codBlocked],
        ['shipping.surface_extra_days', nums[0]],
        ['shipping.packaging_g', nums[1]],
        ['shipping.default_item_g', nums[2]],
        ['shipping.default_box', { length_mm: nums[3], width_mm: nums[4], height_mm: nums[5] }],
        ['shipping.status_updates', form.status_updates],
        ['delhivery.enabled', form.dl_enabled],
        ['delhivery.mode', form.dl_mode],
        ['delhivery.pickup_location', form.dl_pickup.trim()],
      ];
      for (const [key, value] of updates) await throwIf(supabase.from('settings').update({ value: value as never }).eq('key', key));
      await Promise.all([qc.invalidateQueries({ queryKey: ['admin', 'shipping-settings'] }), qc.invalidateQueries({ queryKey: ['pincode'] }), qc.invalidateQueries({ queryKey: ['bootstrap'] })]);
      toast.success('Shipping settings saved.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <p className="text-[13px] text-[#777777]">Loading…</p>;

  return (
    <div className="space-y-5 pb-20">
      <PageHeader title="Shipping" description="Couriers, where you deliver, cash-on-delivery limits and parcel defaults. The delivery fee and estimate are under Settings → Delivery." />

      <Panel title="Couriers" description="The tracking link template uses {awb} for the tracking number. A courier that can't collect cash turns off COD while it is the default.">
        <FieldShell label="Default courier" htmlFor="sh-default">
          <select id="sh-default" value={form.default_courier} onChange={(e) => setForm({ ...form, default_courier: e.target.value })} className="w-full sm:max-w-[280px] border border-[#D5D3CC] px-2 py-2 text-[13px] bg-white">
            {couriers.map((c) => (
              <option key={c.key} value={c.key}>{c.name}</option>
            ))}
          </select>
        </FieldShell>
        <div className="mt-4 space-y-3">
          {couriers.map((c, i) => (
            <div key={c.key} className="grid gap-2 sm:grid-cols-[180px_1fr_auto_auto] items-end border border-[#EAEAEA] p-3">
              <FieldShell label="Name">
                <TextInput value={c.name} onChange={(e) => setCouriers(couriers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Courier name" />
              </FieldShell>
              <FieldShell label="Tracking link">
                <TextInput placeholder="https://…/{awb}" value={c.tracking_url} onChange={(e) => setCouriers(couriers.map((x, j) => (j === i ? { ...x, tracking_url: e.target.value } : x)))} aria-label="Tracking link template" />
              </FieldShell>
              <label className="flex items-center gap-2 text-[12px] pb-2">
                <Toggle checked={c.cod_allowed} onChange={(on) => setCouriers(couriers.map((x, j) => (j === i ? { ...x, cod_allowed: on } : x)))} label={`${c.name} collects cash`} /> Collects cash
              </label>
              <button
                type="button"
                aria-label={`Remove ${c.name}`}
                disabled={['india_post', 'delhivery', 'other'].includes(c.key) || c.key === form.default_courier}
                className="p-2 text-[#999999] hover:text-rose-600 disabled:opacity-30"
                onClick={() => setCouriers(couriers.filter((_, j) => j !== i))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          className="mt-3"
          onClick={() => setCouriers([...couriers, { key: `courier_${Date.now().toString(36)}`, name: '', tracking_url: '', cod_allowed: true }])}
        >
          <Plus size={14} /> Add courier
        </Button>
      </Panel>

      <Panel title="Where you deliver">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Pincodes you don't deliver to" htmlFor="sh-blocked" help="Separate with commas or new lines.">
            <TextArea id="sh-blocked" rows={3} placeholder="e.g. 744101, 682555" value={form.blocked} onChange={(e) => setForm({ ...form, blocked: e.target.value })} />
          </FieldShell>
          <FieldShell label="Pincodes without cash on delivery" htmlFor="sh-codblocked">
            <TextArea id="sh-codblocked" rows={3} placeholder="e.g. 194101" value={form.cod_blocked} onChange={(e) => setForm({ ...form, cod_blocked: e.target.value })} />
          </FieldShell>
          <FieldShell label="Extra days for surface-only products" htmlFor="sh-surface" help="Flammable perfume often travels by road.">
            <TextInput id="sh-surface" inputMode="numeric" value={form.surface_days} onChange={(e) => setForm({ ...form, surface_days: e.target.value })} className="max-w-[120px]" />
          </FieldShell>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <FieldShell label="Test a pincode" htmlFor="sh-test">
            <TextInput id="sh-test" inputMode="numeric" maxLength={6} placeholder="e.g. 520001" value={testPin} onChange={(e) => setTestPin(e.target.value.replace(/\D/g, ''))} className="max-w-[140px]" />
          </FieldShell>
          <Button
            variant="secondary"
            onClick={async () => {
              const { data: r, error } = await supabase.rpc('check_pincode', { p_pincode: testPin, p_surface: false });
              if (error) toast.error(toFriendlyError(error));
              else setTestResult(r as { serviceable: boolean; message: string });
            }}
          >
            Check
          </Button>
          {testResult && <p className={`text-[12px] pb-2 ${testResult.serviceable ? 'text-emerald-700' : 'text-rose-600'}`}>{testResult.message} (saved settings)</p>}
        </div>
      </Panel>

      <Panel title="Parcels" description="Used for courier bookings. Each size's own weight and box are used when set on the product.">
        <div className="grid gap-4 sm:grid-cols-5">
          <FieldShell label="Packaging (g)" htmlFor="sh-pack"><TextInput id="sh-pack" inputMode="numeric" value={form.packaging_g} onChange={(e) => setForm({ ...form, packaging_g: e.target.value })} /></FieldShell>
          <FieldShell label="Item without weight (g)" htmlFor="sh-item"><TextInput id="sh-item" inputMode="numeric" value={form.item_g} onChange={(e) => setForm({ ...form, item_g: e.target.value })} /></FieldShell>
          <FieldShell label="Box length (mm)" htmlFor="sh-l"><TextInput id="sh-l" inputMode="numeric" value={form.box_l} onChange={(e) => setForm({ ...form, box_l: e.target.value })} /></FieldShell>
          <FieldShell label="Box width (mm)" htmlFor="sh-w"><TextInput id="sh-w" inputMode="numeric" value={form.box_w} onChange={(e) => setForm({ ...form, box_w: e.target.value })} /></FieldShell>
          <FieldShell label="Box height (mm)" htmlFor="sh-h"><TextInput id="sh-h" inputMode="numeric" value={form.box_h} onChange={(e) => setForm({ ...form, box_h: e.target.value })} /></FieldShell>
        </div>
      </Panel>

      <Panel title="Delhivery (automatic booking)" description="Off until the Delhivery API token is added as the DELHIVERY_TOKEN secret in Supabase. Test in staging first; the integration is marked unverified until checked against your account's API documents.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-[13px] sm:col-span-2">
            <Toggle checked={form.dl_enabled} onChange={(on) => setForm({ ...form, dl_enabled: on })} label="Book with Delhivery" /> Book packed orders with Delhivery automatically
          </label>
          <FieldShell label="Mode" htmlFor="sh-dlmode">
            <select id="sh-dlmode" value={form.dl_mode} onChange={(e) => setForm({ ...form, dl_mode: e.target.value })} className="w-full border border-[#D5D3CC] px-2 py-2 text-[13px] bg-white">
              <option value="staging">Staging (test)</option>
              <option value="production">Production (live)</option>
            </select>
          </FieldShell>
          <FieldShell label="Pickup location name" htmlFor="sh-pickup" help="Exactly as registered with Delhivery.">
            <TextInput id="sh-pickup" value={form.dl_pickup} onChange={(e) => setForm({ ...form, dl_pickup: e.target.value })} />
          </FieldShell>
          <FieldShell label="Status updates" htmlFor="sh-updates" help="Webhook if Delhivery pushes updates to you, otherwise check every 30 minutes.">
            <select id="sh-updates" value={form.status_updates} onChange={(e) => setForm({ ...form, status_updates: e.target.value })} className="w-full border border-[#D5D3CC] px-2 py-2 text-[13px] bg-white">
              <option value="webhook">Webhook</option>
              <option value="poll">Check every 30 minutes</option>
            </select>
          </FieldShell>
        </div>
      </Panel>

      <div className="fixed bottom-0 inset-x-0 lg:left-[240px] z-30 bg-white border-t border-[#EAEAEA] px-4 sm:px-8 py-3 flex justify-end">
        <Button onClick={save} busy={saving}>Save shipping settings</Button>
      </div>
    </div>
  );
}
