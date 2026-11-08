import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { PageHeader, Panel } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { throwIf } from '../../catalog/api';
import { SchemaForm } from '../../cms/SchemaForm';
import { BLOCK_SCHEMAS } from '../../cms/blocks';

const TABS = Object.keys(BLOCK_SCHEMAS);

export default function SiteContentPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get('tab') ?? '') ? (params.get('tab') as string) : TABS[0];
  return (
    <div>
      <PageHeader title="Site content" description="Everything that appears on every page: theme, brand, menus, footer and SEO." />
      <div role="tablist" aria-label="Site content" className="flex flex-wrap gap-1 border-b border-[#E2E0DB] mb-5">
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={k === tab}
            onClick={() => setParams({ tab: k })}
            className={`px-3 py-2 text-[13px] -mb-px border-b-2 ${k === tab ? 'border-tk-ink text-tk-ink' : 'border-transparent text-[#4A4A4A] hover:text-tk-ink'}`}
          >
            {BLOCK_SCHEMAS[k].label}
          </button>
        ))}
      </div>
      <BlockEditor key={tab} blockKey={tab} />
    </div>
  );
}

export function BlockEditor({ blockKey, embedded = false, onDirty }: { blockKey: string; embedded?: boolean; onDirty?: (dirty: boolean) => void }) {
  const def = BLOCK_SCHEMAS[blockKey];
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'block', blockKey],
    queryFn: async () => {
      const row = (await throwIf(supabase.from('site_blocks').select('value').eq('key', blockKey).maybeSingle())) as { value: Record<string, unknown> } | null;
      return row?.value ?? {};
    },
  });
  const [value, setValue] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) setValue(data);
  }, [data]);
  const dirty = value !== null && JSON.stringify(value) !== JSON.stringify(data ?? {});
  useEffect(() => {
    onDirty?.(dirty);
  }, [dirty, onDirty]);
  useEffect(() => () => onDirty?.(false), [onDirty]);

  const save = async () => {
    if (!value) return;
    setBusy(true);
    try {
      await throwIf(supabase.from('site_blocks').upsert({ key: blockKey, value: value as never }));
      await Promise.all([qc.invalidateQueries({ queryKey: ['admin', 'block', blockKey] }), qc.invalidateQueries({ queryKey: ['bootstrap'] })]);
      toast.success(`${def.label} saved.`);
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || value === null) return <p className="p-5 text-[14px] text-[#4A4A4A]">Loading…</p>;
  if (embedded) {
    return (
      <div>
        <div className="px-5 py-4 border-b border-[#E0DBD1]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#6B6B6B]">Site settings</p>
          <h2 className="text-[20px] font-semibold text-[#141414]">{def.label}</h2>
          <p className="mt-1 text-[13.5px] text-[#3F3F3F]">{def.description}</p>
        </div>
        <div className="p-5">
          <SchemaForm fields={def.fields} value={value} onChange={setValue} />
        </div>
        <div className="sticky bottom-0 px-5 py-3 bg-white border-t border-[#E0DBD1] flex items-center gap-3">
          <Button onClick={save} busy={busy} disabled={!dirty}>Save {def.label.toLowerCase()}</Button>
          {dirty ? <Button variant="ghost" onClick={() => setValue(data ?? {})}>Discard changes</Button> : <span className="text-[13px] text-[#4F4F4F]">All changes saved.</span>}
        </div>
      </div>
    );
  }
  return (
    <Panel title={def.label} description={def.description}>
      <SchemaForm fields={def.fields} value={value} onChange={setValue} />
      <div className="sticky bottom-0 mt-6 -mx-4 sm:-mx-5 px-4 sm:px-5 py-3 bg-white border-t border-[#E2E0DB] flex items-center gap-3">
        <Button onClick={save} busy={busy} disabled={!dirty}>Save {def.label.toLowerCase()}</Button>
        {dirty && (
          <Button variant="ghost" onClick={() => setValue(data ?? {})}>Discard changes</Button>
        )}
        {!dirty && <span className="text-[13px] text-[#4F4F4F]">All changes saved.</span>}
      </div>
    </Panel>
  );
}
