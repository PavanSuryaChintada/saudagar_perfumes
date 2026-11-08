import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { formatRupees as formatINR } from '../../../lib/money';
import { PageHeader, Panel } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextInput, Toggle } from '../../ui/Field';
import { SchemaForm } from '../../cms/SchemaForm';
import { throwIf } from '../../catalog/api';
import { parseSettingInput, toInputValue, type SettingField } from '../../settings/schema';
import { GIFT_PACK_RULES, GIFT_PACK_WORDS, GIFT_PACK_WORD_DEFAULTS, previewPack } from '../../giftpack/giftPackAdmin';
import type { GiftPackOptions } from '../../../storefront/bag/useQuote';
import { packFacts } from '../../../storefront/giftpack/packMath';

type Values = Record<string, unknown>;

/** Admin → Gift pack: every rule, word and picture of the Premium Gift Pack, with a live price preview. */
export default function GiftPackPage() {
  const qc = useQueryClient();
  const saved = useQuery({
    queryKey: ['admin', 'gift-pack'],
    queryFn: async () => {
      const [settings, block] = await Promise.all([
        throwIf(supabase.from('settings').select('key, value').like('key', 'giftpack.%')),
        throwIf(supabase.from('site_blocks').select('value').eq('key', 'gift_pack').maybeSingle()),
      ]);
      const rules: Values = {};
      const byKey = new Map((settings as { key: string; value: unknown }[]).map((r) => [r.key, r.value]));
      for (const f of GIFT_PACK_RULES) rules[f.key] = toInputValue(f, byKey.get(f.key));
      return { rules, words: { ...GIFT_PACK_WORD_DEFAULTS, ...((block as { value?: Values } | null)?.value ?? {}) } as Values };
    },
  });
  const options = useQuery({
    queryKey: ['gift-pack-options'],
    queryFn: async () => (await throwIf(supabase.rpc('gift_pack_options'))) as unknown as GiftPackOptions,
  });
  const pool = useQuery({
    queryKey: ['admin', 'sample-pool-count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('product_variants').select('id', { count: 'exact', head: true }).eq('kind', 'sample').eq('in_sample_pool', true).eq('is_hidden', false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const [rules, setRules] = useState<Values | null>(null);
  const [words, setWords] = useState<Values | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (saved.data) {
      setRules((cur) => cur ?? { ...saved.data.rules });
      setWords((cur) => cur ?? { ...saved.data.words });
    }
  }, [saved.data]);

  const dirty = !!saved.data && !!rules && !!words && (JSON.stringify(rules) !== JSON.stringify(saved.data.rules) || JSON.stringify(words) !== JSON.stringify(saved.data.words));
  const preview = useMemo(() => (rules && options.data ? previewPack(rules, options.data.perfumes) : null), [rules, options.data]);

  const save = async () => {
    if (!rules || !words) return;
    const next: Record<string, string> = {};
    const parsed: Values = {};
    for (const f of GIFT_PACK_RULES) {
      const r = parseSettingInput(f, rules[f.key]);
      if (r.ok) parsed[f.key] = r.value;
      else next[f.key] = r.error;
    }
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('Some rules need fixing. They are marked in red.');
      return;
    }
    if (!String(words.title ?? '').trim()) {
      toast.error('Give the pack a name.');
      return;
    }
    setBusy(true);
    try {
      for (const f of GIFT_PACK_RULES) {
        await throwIf(supabase.from('settings').update({ value: parsed[f.key] as never }).eq('key', f.key));
      }
      await throwIf(supabase.from('site_blocks').upsert({ key: 'gift_pack', value: words as never }));
      setRules(null);
      setWords(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'gift-pack'] }),
        qc.invalidateQueries({ queryKey: ['gift-pack-options'] }),
        qc.invalidateQueries({ queryKey: ['bootstrap'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
      ]);
      toast.success('Gift pack saved. The shop shows it straight away.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (saved.error) return <p className="text-[14px] text-rose-600">{toFriendlyError(saved.error)}</p>;
  if (!rules || !words) return <p className="text-[14px] text-[#4A4A4A]">Loading…</p>;

  const setRule = (key: string, v: unknown) => setRules({ ...rules, [key]: v });
  const size = Number(rules['giftpack.size_ml']);
  const base = Number(rules['giftpack.price_base_ml']);
  const matching = size > 0 && base > 0 ? Math.round((size / base) * 10000) / 100 : null;
  const savedBase = options.data?.price_base_ml;
  const eligible = options.data?.perfumes ?? [];

  return (
    <div className="pb-24">
      <PageHeader
        title="Gift pack"
        description="The Premium Gift Pack: customers choose their own perfumes, each poured in a small size, in one box. Set the rules, the words and the picture here."
        actions={
          <div className="flex gap-2">
            <a href="/gift-pack" target="_blank" rel="noreferrer" className="px-3.5 py-2 text-[13.5px] border border-[#C4C1B9] hover:border-tk-ink bg-white">
              Open the pack page
            </a>
            <Button onClick={save} busy={busy} disabled={!dirty}>
              Save gift pack
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5 min-w-0">
          <Panel title="Rules" description="How the pack is built and priced. Changes apply to new bags straight away.">
            <div className="space-y-4">
              {GIFT_PACK_RULES.map((f) => (
                <RuleInput key={f.key} field={f} value={rules[f.key]} error={errors[f.key]} onChange={(v) => setRule(f.key, v)} />
              ))}
              {matching !== null && Number(rules['giftpack.price_percent']) !== matching && (
                <p className="text-[13px] text-[#3F3F3F]">
                  {size} ml of a {base} ml bottle is {matching}% of it.{' '}
                  <button type="button" className="underline underline-offset-2" onClick={() => setRule('giftpack.price_percent', String(matching))}>
                    Use {matching}%
                  </button>
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Words and picture" description="Write these in plain words. The numbers (how many perfumes, ml each, the free sample and the discount) are shown next to them automatically from the rules above, so they are always right.">
            <SchemaForm fields={GIFT_PACK_WORDS} value={words} onChange={(next) => setWords(next)} />
          </Panel>
        </div>

        <div className="min-w-0 space-y-5">
          <div className="xl:sticky xl:top-4 space-y-5">
            <Panel title="How it looks in the bag">
              <div className="flex gap-3 items-center border border-[#D6D1C6] bg-[#FAF9F6] p-3">
                {typeof words.image === 'string' && words.image && <img src={words.image} alt="" className="w-12 h-12 object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold uppercase tracking-wider">{String(words.bag_heading || 'Try our Premium Gift Pack')}</p>
                  <p className="text-[12px] text-[#4A4A4A] mt-0.5">{String(words.bag_text || '')}</p>
                  <p className="text-[11.5px] text-tk-accent font-semibold mt-1">
                    {packFacts({
                      count: Number(rules['giftpack.count']) || 0,
                      size_ml: Number(rules['giftpack.size_ml']) || 0,
                      sample_ml: Number(rules['giftpack.sample_ml']) || 0,
                      discount_percent: Number(rules['giftpack.discount_percent']) || 0,
                    }).join(' · ')}
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-1.5 bg-tk-ink text-white text-[11px] font-semibold uppercase tracking-wider">{String(words.bag_button || 'Build your pack')}</span>
              </div>
            </Panel>

            <Panel title="Price preview">
              {preview ? (
                <div className="space-y-2 text-[14px]">
                  <p className="text-[13px] text-[#3F3F3F]">A pack of the first {preview.picks.length} perfumes that can go in a pack:</p>
                  <ul className="text-[13.5px] space-y-0.5">
                    {preview.picks.map((p, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="truncate">{p.name}</span>
                        <span className="tabular-nums whitespace-nowrap">{formatINR(p.price)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-[#E2E0DB] flex justify-between font-medium">
                    <span>Pack price</span>
                    <span className="tabular-nums">
                      {preview.saved > 0 && <span className="line-through text-[#4F4F4F] font-normal mr-2">{formatINR(preview.full)}</span>}
                      {formatINR(preview.price)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[13.5px] text-[#3F3F3F]">Nothing to preview yet.</p>
              )}
            </Panel>

            <Panel title={`Perfumes that can go in a pack (${eligible.length})`}>
              {savedBase !== undefined && Number(rules['giftpack.price_base_ml']) !== Number(savedBase) && (
                <p className="text-[13px] text-amber-800 mb-2">Save to see which perfumes have the new {base} ml size.</p>
              )}
              {eligible.length === 0 ? (
                <p className="text-[13.5px] text-rose-700">
                  No live perfume has a {savedBase ?? base} ml size, so customers can’t build a pack. Add a {savedBase ?? base} ml size in{' '}
                  <Link to="/admin/products" className="underline">Products</Link>.
                </p>
              ) : (
                <ul className="text-[13.5px] max-h-[280px] overflow-auto space-y-0.5 pr-1">
                  {eligible.map((p) => (
                    <li key={p.product_id} className="flex justify-between gap-3">
                      <span className="truncate">{p.name}</span>
                      <span className={`whitespace-nowrap ${p.max_picks === 0 ? 'text-rose-700' : 'text-[#3F3F3F]'}`}>{p.max_picks === 0 ? 'Not enough left' : `enough for ${p.max_picks}`}</span>
                    </li>
                  ))}
                </ul>
              )}
              {Number(rules['giftpack.sample_ml']) > 0 && pool.data === 0 && (
                <p className="mt-3 text-[13px] text-amber-800">
                  No perfume is switched on as a free sample, so packs go out without their sample. Switch some on in{' '}
                  <Link to="/admin/samples" className="underline">Free samples</Link>.
                </p>
              )}
            </Panel>
          </div>
        </div>
      </div>

      {dirty && (
        <div className="fixed bottom-0 inset-x-0 lg:left-[240px] z-30 bg-white border-t border-[#E2E0DB] px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
          <p className="text-[13.5px] text-[#3F3F3F]">Unsaved changes</p>
          <Button onClick={save} busy={busy}>Save gift pack</Button>
        </div>
      )}
    </div>
  );
}

function RuleInput({ field, value, error, onChange }: { field: SettingField; value: unknown; error?: string; onChange: (v: unknown) => void }) {
  const id = `gp-${field.key}`;
  if (field.type === 'boolean') {
    return (
      <div className="flex items-start justify-between gap-4 py-1">
        <div>
          <label htmlFor={id} className="text-[14px] text-tk-ink">{field.label}</label>
          {field.help && <p className="text-[12.5px] text-[#4F4F4F] mt-0.5 max-w-[520px]">{field.help}</p>}
        </div>
        <Toggle id={id} checked={Boolean(value)} onChange={onChange} label={field.label} />
      </div>
    );
  }
  return (
    <FieldShell label={field.label} htmlFor={id} help={field.help} error={error}>
      <div className="flex items-center gap-2">
        <TextInput id={id} inputMode="decimal" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} invalid={!!error} className="max-w-[140px]" />
        {field.suffix && <span className="text-[13.5px] text-[#3F3F3F] whitespace-nowrap">{field.suffix}</span>}
      </div>
    </FieldShell>
  );
}
