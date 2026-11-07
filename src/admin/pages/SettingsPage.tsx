import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { toFriendlyError } from '../../lib/errors';
import { parseSettingInput, SETTINGS_SCHEMA, toInputValue, type SettingField } from '../settings/schema';
import { PageHeader, Panel } from '../ui/PageHeader';
import { Button } from '../ui/Button';
import { FieldShell, TextInput, Toggle } from '../ui/Field';

type Values = Record<string, unknown>;

function useSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('key, value');
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Values;
    },
  });
}

function FieldInput({ field, value, onChange, error }: { field: SettingField; value: unknown; onChange: (v: unknown) => void; error?: string }) {
  const id = `setting-${field.key}`;
  if (field.type === 'boolean') {
    return (
      <div className="flex items-start justify-between gap-4 py-1">
        <div>
          <label htmlFor={id} className="text-[13px] text-[#111111]">
            {field.label}
          </label>
          {field.help && <p className="text-[11px] text-[#888888] mt-0.5 max-w-[520px]">{field.help}</p>}
        </div>
        <Toggle id={id} checked={Boolean(value)} onChange={onChange} label={field.label} />
      </div>
    );
  }
  if (field.type === 'range') {
    const v = (value ?? { min: '', max: '' }) as { min: string; max: string };
    return (
      <FieldShell label={field.label} help={field.help} error={error}>
        <div className="flex items-center gap-2">
          <TextInput aria-label={`${field.label} from`} inputMode="numeric" value={v.min} onChange={(e) => onChange({ ...v, min: e.target.value })} className="max-w-[90px]" invalid={!!error} />
          <span className="text-[12px] text-[#777777]">to</span>
          <TextInput aria-label={`${field.label} to`} inputMode="numeric" value={v.max} onChange={(e) => onChange({ ...v, max: e.target.value })} className="max-w-[90px]" invalid={!!error} />
        </div>
      </FieldShell>
    );
  }
  return (
    <FieldShell label={field.label} htmlFor={id} help={field.help} error={error}>
      <div className="flex items-center gap-2">
        {field.suffix === '₹' && <span className="text-[13px] text-[#777777]">₹</span>}
        <TextInput
          id={id}
          inputMode={field.type === 'number' ? 'numeric' : field.type === 'phone' ? 'tel' : undefined}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          invalid={!!error}
          className={field.type === 'number' ? 'max-w-[160px]' : ''}
        />
        {field.suffix && field.suffix !== '₹' && <span className="text-[12px] text-[#777777] whitespace-nowrap">{field.suffix}</span>}
      </div>
    </FieldShell>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error: loadError } = useSettings();
  const [form, setForm] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const initial = useMemo(() => {
    if (!data) return null;
    const out: Values = {};
    for (const g of SETTINGS_SCHEMA) for (const f of g.fields) out[f.key] = toInputValue(f, data[f.key]);
    return out;
  }, [data]);

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const dirtyKeys = initial ? Object.keys(form).filter((k) => JSON.stringify(form[k]) !== JSON.stringify(initial[k])) : [];
  const dirty = dirtyKeys.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = async () => {
    const nextErrors: Record<string, string> = {};
    const updates: { key: string; value: unknown }[] = [];
    for (const g of SETTINGS_SCHEMA) {
      for (const f of g.fields) {
        if (!dirtyKeys.includes(f.key)) continue;
        const parsed = parseSettingInput(f, form[f.key]);
        if (parsed.ok) updates.push({ key: f.key, value: parsed.value });
        else nextErrors[f.key] = parsed.error;
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error('Some settings need fixing before they can be saved.');
      return;
    }
    setSaving(true);
    try {
      for (const u of updates) {
        const { error } = await supabase.from('settings').update({ value: u.value as never }).eq('key', u.key);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      await queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      toast.success(`Saved ${updates.length} setting${updates.length === 1 ? '' : 's'}. Changes are live.`);
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24">
      <PageHeader title="Settings" description="Store-wide rules for delivery, cash on delivery, returns, stock alerts, free samples and integrations." />
      {isLoading && <p className="text-[13px] text-[#777777]">Loading settings…</p>}
      {loadError && <p className="text-[13px] text-rose-600">{toFriendlyError(loadError)}</p>}
      {initial && (
        <div className="space-y-5">
          {SETTINGS_SCHEMA.map((g) => (
            <Panel key={g.group} title={g.group} description={g.description}>
              <div className="grid gap-5 md:grid-cols-2">
                {g.fields.map((f) => (
                  <div key={f.key} className={f.type === 'boolean' ? 'md:col-span-2' : ''}>
                    <FieldInput field={f} value={form[f.key]} error={errors[f.key]} onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))} />
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
      {dirty && (
        <div className="fixed bottom-0 inset-x-0 lg:left-[240px] z-30 bg-white border-t border-[#EAEAEA] px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
          <p className="text-[12px] text-[#555555]">
            {dirtyKeys.length} unsaved change{dirtyKeys.length === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setForm(initial!); setErrors({}); }} disabled={saving}>
              Discard
            </Button>
            <Button onClick={save} busy={saving}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
