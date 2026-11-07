import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { formatIndianPhone } from '../../../lib/phone';
import { formatOrderDateTime } from '../../../storefront/orders/useOrders';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { throwIf } from '../../catalog/api';

interface RequestRow {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  back_in_stock_at: string | null;
  notified_at: string | null;
  variant: { id: string; label: string; stock: number; product: { id: string; name: string } | null } | null;
}

/** Admin → Back in stock: who asked to be told about which size, and which are back now. */
export default function BackInStockPage() {
  const qc = useQueryClient();
  const [show, setShow] = useState<'open' | 'all'>('open');
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'back-in-stock', show],
    queryFn: async () => {
      let q = supabase
        .from('back_in_stock_requests')
        .select('id, email, phone, created_at, back_in_stock_at, notified_at, variant:product_variants(id, label, stock, product:products(id, name))')
        .order('created_at', { ascending: false })
        .limit(500);
      if (show === 'open') q = q.is('notified_at', null);
      return (await throwIf(q)) as unknown as RequestRow[];
    },
  });

  const groups = useMemo(() => {
    const by = new Map<string, { key: string; name: string; productId: string; label: string; stock: number; rows: RequestRow[] }>();
    for (const r of rows) {
      if (!r.variant) continue;
      const g = by.get(r.variant.id) ?? { key: r.variant.id, name: r.variant.product?.name ?? 'Product', productId: r.variant.product?.id ?? '', label: r.variant.label, stock: r.variant.stock, rows: [] };
      g.rows.push(r);
      by.set(r.variant.id, g);
    }
    return [...by.values()].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || b.rows.length - a.rows.length);
  }, [rows]);

  const markNotified = async (ids: string[]) => {
    try {
      await throwIf(supabase.from('back_in_stock_requests').update({ notified_at: new Date().toISOString() }).in('id', ids));
      await qc.invalidateQueries({ queryKey: ['admin', 'back-in-stock'] });
      toast.success('Marked as told.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  return (
    <div>
      <PageHeader title="Back in stock" description="Customers who asked to be told when a sold-out size returns. Sizes back in stock are listed first — let these customers know, then mark them as told." />
      <div className="flex gap-1 mb-4">
        {(['open', 'all'] as const).map((v) => (
          <button key={v} type="button" onClick={() => setShow(v)} className={`px-3 py-1.5 text-[12px] border ${show === v ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#D5D3CC] text-[#555555] hover:border-tk-ink'}`}>
            {v === 'open' ? 'Waiting' : 'All'}
          </button>
        ))}
      </div>
      {isLoading && <p className="text-[13px] text-[#777777]">Loading…</p>}
      {!isLoading && groups.length === 0 && <p className="bg-white border border-[#EAEAEA] px-4 py-6 text-[13px] text-[#777777]">No requests.</p>}
      <div className="space-y-4">
        {groups.map((g) => {
          const open = g.rows.filter((r) => !r.notified_at);
          return (
            <div key={g.key} className="bg-white border border-[#EAEAEA]">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#EAEAEA] text-[13px]">
                <Link to={`/admin/products/${g.productId}`} className="font-medium hover:underline">{g.name}</Link>
                <span className="text-[#777777]">{g.label}</span>
                <span className={`text-[11px] uppercase tracking-[0.06em] ${g.stock > 0 ? 'text-emerald-700' : 'text-[#999999]'}`}>{g.stock > 0 ? `Back · ${g.stock} in stock` : 'Still sold out'}</span>
                <span className="text-[12px] text-[#777777]">{g.rows.length} request{g.rows.length === 1 ? '' : 's'}</span>
                {open.length > 0 && (
                  <Button size="sm" variant="secondary" className="ml-auto" onClick={() => markNotified(open.map((r) => r.id))}>Mark all as told</Button>
                )}
              </div>
              <ul className="divide-y divide-[#F0F0F0] text-[12.5px]">
                {g.rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-2">
                    <span>{r.email ?? '—'}</span>
                    {r.phone && <span className="text-[#777777]">{formatIndianPhone(r.phone)}</span>}
                    <span className="text-[11px] text-[#888888]">asked {formatOrderDateTime(r.created_at)}</span>
                    <span className="ml-auto text-[11px] text-[#888888]">{r.notified_at ? `told ${formatOrderDateTime(r.notified_at)}` : r.back_in_stock_at ? 'ready to tell' : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
