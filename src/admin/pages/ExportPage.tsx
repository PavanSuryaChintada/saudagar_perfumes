import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { fetchAll } from '../../lib/fetchAll';
import { toFriendlyError } from '../../lib/errors';
import { PageHeader, Panel } from '../ui/PageHeader';
import { Button } from '../ui/Button';
import { downloadCsv, toCsv } from '../export/csv';

// `order` keeps the CSV in a useful order; the unique key (id, or `key` for settings) keeps paging exact.
const TABLES: { table: string; label: string; order?: string; unique?: string }[] = [
  { table: 'orders', label: 'Orders', order: 'created_at' },
  { table: 'order_items', label: 'Order lines' },
  { table: 'products', label: 'Products', order: 'created_at' },
  { table: 'product_variants', label: 'Sizes and stock', order: 'created_at' },
  { table: 'inventory_movements', label: 'Stock history', order: 'created_at' },
  { table: 'profiles', label: 'Customers', order: 'created_at' },
  { table: 'addresses', label: 'Addresses', order: 'created_at' },
  { table: 'coupons', label: 'Coupons', order: 'created_at' },
  { table: 'coupon_redemptions', label: 'Coupon uses', order: 'created_at' },
  { table: 'returns', label: 'Returns', order: 'created_at' },
  { table: 'refunds', label: 'Refunds', order: 'created_at' },
  { table: 'reviews', label: 'Reviews', order: 'created_at' },
  { table: 'newsletter_signups', label: 'Newsletter sign-ups', order: 'created_at' },
  { table: 'back_in_stock_requests', label: 'Back-in-stock requests', order: 'created_at' },
  { table: 'categories', label: 'Categories' },
  { table: 'collections', label: 'Collections' },
  { table: 'notes', label: 'Notes' },
  { table: 'settings', label: 'Settings', unique: 'key' },
];

/** Admin → Data export: a CSV of every main table, as a backup or for accounting. */
export default function ExportPage() {
  const [busy, setBusy] = useState<string | null>(null);

  const exportTable = async (table: string, order?: string, unique = 'id') => {
    setBusy(table);
    try {
      const rows = await fetchAll<Record<string, unknown>>((from, to) => {
        let q = supabase.from(table as never).select('*', { count: 'exact' });
        if (order) q = q.order(order as never, { ascending: true });
        q = q.order(unique as never, { ascending: true });
        return q.range(from, to) as unknown as PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown; count: number | null }>;
      });
      downloadCsv(`${table}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
      toast.success(`${rows.length} row${rows.length === 1 ? '' : 's'} exported.`);
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Data export" description="Download any table as a CSV that opens in Excel or Google Sheets. Supabase also keeps daily backups on the Pro plan." />
      <Panel>
        <ul className="divide-y divide-[#E9E7E2]">
          {TABLES.map((t) => (
            <li key={t.table} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
              <span>{t.label}</span>
              <Button size="sm" variant="secondary" busy={busy === t.table} disabled={!!busy && busy !== t.table} onClick={() => exportTable(t.table, t.order, t.unique)}>
                <Download size={13} /> CSV
              </Button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
