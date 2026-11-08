// Searchable pickers for long or growing lists (categories, notes, collections, products, pages).
// Type to narrow the list, arrows + Enter to choose, Esc to close. When `onCreate` is given and nothing matches,
// the list offers "+ Add “…”" so a missing item can be created without leaving the form.
// Short fixed choices (yes/no, percent/flat) stay as plain buttons or selects.
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { toFriendlyError } from '../../lib/errors';

export interface PickOption {
  value: string;
  label: string;
  /** Second line, e.g. the category path or SKU. Also searched. */
  hint?: string;
  /** Small tag after the label, e.g. "hidden". */
  tag?: string;
}

interface Common {
  id?: string;
  options: PickOption[];
  placeholder?: string;
  ariaLabel?: string;
  /** Create a missing item from the typed text; resolve to its id (or null if it failed). */
  onCreate?: (label: string) => Promise<string | null>;
  /** "category", "note"… used in "+ Add “Oud” as a new category". */
  createNoun?: string;
  emptyText?: string;
  disabled?: boolean;
  /** Most rows shown at once; typing narrows the rest. */
  limit?: number;
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').trim();

/** Best matches first: label starts with the query, then a word starts with it, then it appears anywhere. */
export function rankOptions(options: PickOption[], query: string, limit = 50): PickOption[] {
  const q = norm(query);
  if (!q) return options.slice(0, limit);
  const scored: [number, PickOption][] = [];
  for (const o of options) {
    const l = norm(o.label);
    const h = norm(o.hint ?? '');
    const score = l.startsWith(q) ? 0 : l.split(/[\s›/-]+/).some((w) => w.startsWith(q)) ? 1 : l.includes(q) ? 2 : h.includes(q) ? 3 : -1;
    if (score >= 0) scored.push([score, o]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].label.localeCompare(b[1].label)).slice(0, limit).map(([, o]) => o);
}

const inputCls =
  'w-full border border-[#D5D3CC] bg-white px-3 py-2 text-[13px] text-tk-ink placeholder:text-[#999999] focus:outline-none focus:border-tk-ink disabled:bg-[#F4F4F2] disabled:text-[#999999]';

function useCombo({ options, onCreate, createNoun, limit = 50, exclude }: Common & { exclude?: Set<string> }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState(false);
  const available = useMemo(() => (exclude ? options.filter((o) => !exclude.has(o.value)) : options), [options, exclude]);
  const matches = useMemo(() => rankOptions(available, query, limit), [available, query, limit]);
  const typed = query.trim();
  const canCreate = !!onCreate && !!typed && !options.some((o) => norm(o.label) === norm(typed));
  const rows = matches.length + (canCreate ? 1 : 0);
  useEffect(() => setActive(0), [query, open]);

  const create = async (): Promise<string | null> => {
    if (!onCreate || !typed) return null;
    setCreating(true);
    try {
      const id = await onCreate(typed);
      if (id) toast.success(`“${typed}” added${createNoun ? ` as a new ${createNoun}` : ''}.`);
      return id;
    } catch (err) {
      toast.error(toFriendlyError(err));
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { open, setOpen, query, setQuery, active, setActive, matches, canCreate, rows, creating, create, typed };
}

function OptionList({
  listId,
  combo,
  onPick,
  onCreatePick,
  selected,
  createNoun,
  emptyText,
}: {
  listId: string;
  combo: ReturnType<typeof useCombo>;
  onPick: (o: PickOption) => void;
  onCreatePick: () => void;
  selected: (v: string) => boolean;
  createNoun?: string;
  emptyText?: string;
}) {
  const { matches, active, canCreate, typed, creating } = combo;
  return (
    <ul id={listId} role="listbox" className="absolute z-40 left-0 right-0 mt-1 max-h-72 overflow-y-auto border border-[#D5D3CC] bg-white shadow-sm">
      {matches.map((o, i) => (
        <li
          key={o.value}
          id={`${listId}-${i}`}
          role="option"
          aria-selected={selected(o.value)}
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(o);
          }}
          onMouseEnter={() => combo.setActive(i)}
          className={`px-3 py-2 cursor-pointer text-[13px] flex items-start gap-2 ${i === active ? 'bg-[#F4F3EE]' : ''}`}
        >
          <span className="w-4 shrink-0 pt-0.5">{selected(o.value) && <Check size={14} aria-hidden />}</span>
          <span className="min-w-0">
            <span className="block truncate">
              {o.label}
              {o.tag && <span className="ml-2 text-[10px] uppercase tracking-wider text-[#999999]">{o.tag}</span>}
            </span>
            {o.hint && <span className="block text-[11px] text-[#888888] truncate">{o.hint}</span>}
          </span>
        </li>
      ))}
      {canCreate && (
        <li
          id={`${listId}-${matches.length}`}
          role="option"
          aria-selected={false}
          onMouseDown={(e) => {
            e.preventDefault();
            onCreatePick();
          }}
          onMouseEnter={() => combo.setActive(matches.length)}
          className={`px-3 py-2 cursor-pointer text-[13px] flex items-center gap-2 border-t border-[#F0F0F0] text-tk-accent ${active === matches.length ? 'bg-[#F4F3EE]' : ''}`}
        >
          <Plus size={14} aria-hidden /> {creating ? 'Adding…' : `Add “${typed}”${createNoun ? ` as a new ${createNoun}` : ''}`}
        </li>
      )}
      {!matches.length && !canCreate && <li className="px-3 py-3 text-[12.5px] text-[#888888]">{typed ? 'Nothing matches.' : emptyText ?? 'Nothing to choose yet.'}</li>}
    </ul>
  );
}

function keyNav(e: KeyboardEvent, combo: ReturnType<typeof useCombo>, choose: (i: number) => void) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    combo.setOpen(true);
    combo.setActive((a) => Math.min(combo.rows - 1, a + 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    combo.setActive((a) => Math.max(0, a - 1));
  } else if (e.key === 'Enter') {
    if (combo.open && combo.rows) {
      e.preventDefault();
      choose(combo.active);
    }
  } else if (e.key === 'Escape') {
    combo.setOpen(false);
  }
}

/** Pick one item from a long list by typing. */
export function SearchSelect({
  value,
  onChange,
  allowClear = false,
  ...common
}: Common & { value: string | null | undefined; onChange: (value: string | null) => void; allowClear?: boolean }) {
  const autoId = useId();
  const id = common.id ?? autoId;
  const listId = `${id}-list`;
  const combo = useCombo(common);
  const current = common.options.find((o) => o.value === value) ?? null;
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (o: PickOption) => {
    onChange(o.value);
    combo.setQuery('');
    combo.setOpen(false);
  };
  const createPick = async () => {
    const newId = await combo.create();
    if (newId) {
      onChange(newId);
      combo.setQuery('');
      combo.setOpen(false);
    }
  };
  const choose = (i: number) => (i < combo.matches.length ? pick(combo.matches[i]) : void createPick());

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-label={common.ariaLabel}
        aria-expanded={combo.open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={combo.open && combo.rows ? `${listId}-${combo.active}` : undefined}
        autoComplete="off"
        disabled={common.disabled}
        className={`${inputCls} pr-14`}
        placeholder={current ? current.label : common.placeholder ?? 'Search…'}
        value={combo.open ? combo.query : current?.label ?? ''}
        onFocus={() => combo.setOpen(true)}
        onClick={() => combo.setOpen(true)}
        onBlur={() => combo.setOpen(false)}
        onChange={(e) => {
          combo.setQuery(e.target.value);
          combo.setOpen(true);
        }}
        onKeyDown={(e) => keyNav(e, combo, choose)}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#888888]">
        {allowClear && current && !common.disabled && (
          <button
            type="button"
            aria-label="Clear"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(null);
            }}
            className="p-0.5 hover:text-tk-ink"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={14} aria-hidden onMouseDown={(e) => { e.preventDefault(); inputRef.current?.focus(); }} />
      </span>
      {current?.hint && !combo.open && <p className="mt-1 text-[11px] text-[#888888]">{current.hint}</p>}
      {combo.open && <OptionList listId={listId} combo={combo} onPick={pick} onCreatePick={createPick} selected={(v) => v === value} createNoun={common.createNoun} emptyText={common.emptyText} />}
    </div>
  );
}

/** Pick any number of items from a long list by typing; chosen items show as removable chips. */
export function SearchMultiSelect({
  values,
  onChange,
  ...common
}: Common & { values: string[]; onChange: (values: string[]) => void }) {
  const autoId = useId();
  const id = common.id ?? autoId;
  const listId = `${id}-list`;
  const chosen = useMemo(() => new Set(values), [values]);
  const combo = useCombo({ ...common, exclude: chosen });
  const byValue = useMemo(() => new Map(common.options.map((o) => [o.value, o])), [common.options]);

  const pick = (o: PickOption) => {
    onChange([...values, o.value]);
    combo.setQuery('');
  };
  const createPick = async () => {
    const newId = await combo.create();
    if (newId) {
      onChange([...values, newId]);
      combo.setQuery('');
    }
  };
  const choose = (i: number) => (i < combo.matches.length ? pick(combo.matches[i]) : void createPick());

  return (
    <div className="relative">
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mb-1.5" aria-label="Chosen">
          {values.map((v) => (
            <li key={v} className="inline-flex items-center gap-1 border border-[#D5D3CC] bg-[#F8F7F5] pl-2 pr-1 py-0.5 text-[12px]">
              <span title={byValue.get(v)?.hint}>{byValue.get(v)?.label ?? '…'}</span>
              <button
                type="button"
                aria-label={`Remove ${byValue.get(v)?.label ?? ''}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
                disabled={common.disabled}
                className="p-0.5 text-[#888888] hover:text-tk-ink"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        role="combobox"
        aria-label={common.ariaLabel}
        aria-expanded={combo.open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={combo.open && combo.rows ? `${listId}-${combo.active}` : undefined}
        autoComplete="off"
        disabled={common.disabled}
        className={inputCls}
        placeholder={common.placeholder ?? 'Search to add…'}
        value={combo.query}
        onFocus={() => combo.setOpen(true)}
        onClick={() => combo.setOpen(true)}
        onBlur={() => combo.setOpen(false)}
        onChange={(e) => {
          combo.setQuery(e.target.value);
          combo.setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' && !combo.query && values.length) onChange(values.slice(0, -1));
          keyNav(e, combo, choose);
        }}
      />
      {combo.open && <OptionList listId={listId} combo={combo} onPick={pick} onCreatePick={createPick} selected={(v) => chosen.has(v)} createNoun={common.createNoun} emptyText={common.emptyText} />}
    </div>
  );
}

/** Category options with their full path ("Perfumes › Oud"), parents before children. */
export function categoryOptions(categories: { id: string; name: string; parent_id: string | null; is_active?: boolean }[]): PickOption[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const path = (c: (typeof categories)[number]) => {
    const parts = [c.name];
    let p = c.parent_id ? byId.get(c.parent_id) : undefined;
    for (let guard = 0; p && guard < 10; guard += 1) {
      parts.unshift(p.name);
      p = p.parent_id ? byId.get(p.parent_id) : undefined;
    }
    return parts;
  };
  return categories
    .map((c) => {
      const parts = path(c);
      return { value: c.id, label: c.name, hint: parts.length > 1 ? parts.join(' › ') : undefined, tag: c.is_active === false ? 'hidden' : undefined, sort: parts.join(' › ') };
    })
    .sort((a, b) => a.sort.localeCompare(b.sort))
    .map(({ sort: _sort, ...o }) => o);
}
