// One search for the whole admin (Ctrl+K / ⌘K): products, SKUs, categories, notes, scent options, collections,
// orders, customers, coupons, pages and the admin's own pages. Picking a result opens it.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import * as Dialog from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatINR } from '../lib/money';
import { ADMIN_NAV } from './nav';

interface Hit {
  group: string;
  label: string;
  hint?: string;
  to: string;
}

const GROUP_ORDER = ['Go to', 'Products', 'Orders', 'Customers', 'Categories', 'Notes', 'Scent profile', 'Collections', 'Coupons', 'Pages'];
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/** Characters that would break a PostgREST filter are dropped. */
const clean = (q: string) => q.replace(/[%,()*:\\"]/g, ' ').replace(/\s+/g, ' ').trim();

async function searchAll(q: string): Promise<Hit[]> {
  const t = clean(q);
  if (t.length < 2) return [];
  const like = `%${t}%`;
  const digits = t.replace(/\D/g, '');
  const [products, skus, orders, customers, categories, notes, options, collections, coupons, pages] = await Promise.all([
    supabase.from('products').select('id, name, slug, archived_at').or(`name.ilike.${like},slug.ilike.${like}`).limit(6),
    supabase.from('product_variants').select('product_id, sku, label, products(name)').ilike('sku', like).limit(4),
    supabase
      .from('orders')
      .select('id, order_number, customer_name, total, status')
      .or(
        [`order_number.ilike.${like}`, `customer_name.ilike.${like}`, `customer_email.ilike.${like}`, digits.length >= 4 ? `customer_phone.ilike.%${digits}%` : null]
          .filter(Boolean)
          .join(','),
      )
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .or([`full_name.ilike.${like}`, `email.ilike.${like}`, digits.length >= 4 ? `phone.ilike.%${digits}%` : null].filter(Boolean).join(','))
      .limit(5),
    supabase.from('categories').select('id, name').ilike('name', like).limit(5),
    supabase.from('notes').select('id, name').ilike('name', like).limit(5),
    supabase.from('attribute_options').select('id, label, kind').ilike('label', like).limit(5),
    supabase.from('collections').select('id, name').ilike('name', like).limit(5),
    supabase.from('coupons').select('id, code, kind').ilike('code', like).limit(5),
    supabase.from('pages').select('id, title, slug').or(`title.ilike.${like},slug.ilike.${like}`).limit(5),
  ]);

  const hits: Hit[] = [];
  const seenProducts = new Set<string>();
  for (const p of products.data ?? []) {
    seenProducts.add(p.id);
    hits.push({ group: 'Products', label: p.name, hint: p.archived_at ? 'archived' : `/product/${p.slug}`, to: `/admin/products/${p.id}` });
  }
  for (const v of (skus.data ?? []) as unknown as { product_id: string; sku: string; label: string; products: { name: string } | null }[]) {
    if (seenProducts.has(v.product_id)) continue;
    seenProducts.add(v.product_id);
    hits.push({ group: 'Products', label: v.products?.name ?? v.sku, hint: `SKU ${v.sku} · ${v.label}`, to: `/admin/products/${v.product_id}` });
  }
  for (const o of orders.data ?? []) {
    hits.push({ group: 'Orders', label: `${o.order_number} · ${o.customer_name ?? 'Customer'}`, hint: `${formatINR(Number(o.total))} · ${String(o.status).toLowerCase().replace(/_/g, ' ')}`, to: `/admin/orders/${o.id}` });
  }
  for (const c of customers.data ?? []) {
    hits.push({ group: 'Customers', label: c.full_name || c.email || 'Customer', hint: [c.email, c.phone].filter(Boolean).join(' · '), to: `/admin/customers?q=${encodeURIComponent(c.email ?? c.full_name ?? '')}` });
  }
  for (const c of categories.data ?? []) hits.push({ group: 'Categories', label: c.name, to: `/admin/categories?edit=${c.id}` });
  for (const n of notes.data ?? []) hits.push({ group: 'Notes', label: n.name, to: `/admin/notes?edit=${n.id}` });
  for (const o of options.data ?? []) hits.push({ group: 'Scent profile', label: o.label, hint: o.kind.replace(/_/g, ' '), to: `/admin/scent-profile?edit=${o.id}` });
  for (const c of collections.data ?? []) hits.push({ group: 'Collections', label: c.name, to: `/admin/collections?edit=${c.id}` });
  for (const c of coupons.data ?? []) hits.push({ group: 'Coupons', label: c.code, hint: c.kind === 'general' ? undefined : `${c.kind} code`, to: `/admin/coupons?edit=${c.id}` });
  for (const p of pages.data ?? []) hits.push({ group: 'Pages', label: p.title, hint: `/${p.slug === 'home' ? '' : p.slug}`, to: `/admin/pages/${p.id}` });
  return hits;
}

function pageHits(q: string): Hit[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return ADMIN_NAV.flatMap((g) => g.items)
    .filter((i) => i.label.toLowerCase().includes(t) || (i.keywords ?? '').toLowerCase().split(' ').some((k) => k.startsWith(t)))
    .slice(0, 4)
    .map((i) => ({ group: 'Go to', label: i.label, hint: 'Admin page', to: i.to }));
}

/** The button that opens the search (the search window itself is rendered once, by the layout). */
export function SearchButton({ compact = false, onClick }: { compact?: boolean; onClick: () => void }) {
  return compact ? (
    <button type="button" aria-label="Search the admin" onClick={onClick} className="p-2 text-[#555555] hover:text-tk-ink">
      <Search size={18} />
    </button>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 w-full max-w-[420px] border border-[#D5D3CC] bg-white px-3 py-2 text-[13px] text-[#888888] hover:border-tk-ink"
    >
      <Search size={15} aria-hidden />
      <span className="flex-1 text-left">Search products, orders, customers…</span>
      <kbd className="text-[10.5px] border border-[#E0DDD5] px-1.5 py-0.5 text-[#777777]">{isMac ? '⌘' : 'Ctrl'} K</kbd>
    </button>
  );
}

export default function AdminSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const setOpen = onOpenChange;
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    const mine = ++seq.current;
    setActive(0);
    if (clean(q).length < 2) {
      setHits([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const found = await searchAll(q);
        if (mine === seq.current) setHits(found);
      } finally {
        if (mine === seq.current) setBusy(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const all = useMemo(() => {
    const list = [...pageHits(q), ...hits];
    return list.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
  }, [q, hits]);

  const go = (h: Hit) => {
    setOpen(false);
    setQ('');
    navigate(h.to);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(''); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/40" />
        <Dialog.Content className="fixed z-[91] left-1/2 top-[8vh] -translate-x-1/2 w-[min(640px,calc(100vw-24px))] bg-white border border-[#EAEAEA] shadow-xl focus:outline-none">
          <Dialog.Title className="sr-only">Search the admin</Dialog.Title>
          <Dialog.Description className="sr-only">Type a name, SKU, order number, phone or email, then pick a result to open it.</Dialog.Description>
          <div className="flex items-center gap-2 px-4 border-b border-[#EAEAEA]">
            <Search size={16} className="text-[#888888]" aria-hidden />
            <input
              autoFocus
              aria-label="Search the admin"
              role="combobox"
              aria-expanded={all.length > 0}
              aria-controls="admin-search-results"
              aria-activedescendant={all.length ? `admin-hit-${active}` : undefined}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(all.length - 1, a + 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
                if (e.key === 'Enter' && all[active]) { e.preventDefault(); go(all[active]); }
              }}
              placeholder="Name, SKU, order number, phone, email or a page like “refunds”"
              className="flex-1 py-3.5 text-[14px] bg-transparent focus:outline-none placeholder:text-[#AAAAAA]"
            />
            {busy && <span className="text-[11px] text-[#999999]">Searching…</span>}
          </div>
          <ul id="admin-search-results" role="listbox" className="max-h-[60vh] overflow-y-auto py-1">
            {all.map((h, i) => (
              <li key={`${h.group}-${h.to}-${i}`} role="presentation">
                {(i === 0 || all[i - 1].group !== h.group) && (
                  <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.12em] text-[#999999]">{h.group}</p>
                )}
                <button
                  type="button"
                  id={`admin-hit-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(h)}
                  className={`w-full text-left px-4 py-2 flex items-baseline justify-between gap-3 ${i === active ? 'bg-[#F4F3EE]' : ''}`}
                >
                  <span className="text-[13px] text-tk-ink truncate">{h.label}</span>
                  {h.hint && <span className="text-[11px] text-[#888888] truncate max-w-[45%]">{h.hint}</span>}
                </button>
              </li>
            ))}
            {!busy && clean(q).length >= 2 && all.length === 0 && <li className="px-4 py-6 text-[13px] text-[#777777]">Nothing found for “{q.trim()}”.</li>}
            {clean(q).length < 2 && (
              <li className="px-4 py-5 text-[12.5px] text-[#777777]">
                Type at least 2 letters. Try a product name, a SKU, an order number like SAU-1042, a phone number, or a page like “coupons”.
              </li>
            )}
          </ul>
          <p className="px-4 py-2 border-t border-[#EAEAEA] text-[11px] text-[#999999]">↑ ↓ to move · Enter to open · Esc to close</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
