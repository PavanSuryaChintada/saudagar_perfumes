import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { toFriendlyError } from '../../lib/errors';
import { formatINR } from '../../lib/money';
import { formatIndianPhone } from '../../lib/phone';
import { formatOrderDate } from '../../storefront/orders/useOrders';
import { PageHeader } from '../ui/PageHeader';
import { Button } from '../ui/Button';
import { FieldShell, TextInput } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { rpc } from '../catalog/api';
import { downloadCsv, toCsv } from '../export/csv';

interface CustomerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
  marketing_opt_in: boolean;
  orders: number;
  spent: number;
  last_order_at: string | null;
}

const SIZE = 50;
const fmtBirthday = (d: string | null) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');

async function fetchCustomers(search: string, page: number, size = SIZE) {
  const { data, error } = await supabase.rpc('admin_customers', { p_search: search || undefined, p_page: page, p_page_size: size });
  if (error) throw error;
  return data as unknown as { count: number; rows: CustomerRow[] };
}

export default function CustomersPage() {
  const qc = useQueryClient();
  // ?q= comes from the admin search ("open this customer").
  const [params] = useSearchParams();
  const [input, setInput] = useState(() => params.get('q') ?? '');
  const [search, setSearch] = useState(() => params.get('q') ?? '');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [dob, setDob] = useState('');
  const [exporting, setExporting] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'customers', search, page], queryFn: () => fetchCustomers(search, page) });
  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / SIZE));

  const exportAll = async () => {
    setExporting(true);
    try {
      const all: CustomerRow[] = [];
      for (let p = 0; ; p++) {
        const chunk = await fetchCustomers(search, p, 200);
        all.push(...chunk.rows);
        if (all.length >= chunk.count || chunk.rows.length === 0) break;
      }
      downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(all as unknown as Record<string, unknown>[], ['full_name', 'email', 'phone', 'date_of_birth', 'orders', 'spent', 'last_order_at', 'created_at', 'marketing_opt_in']));
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Everyone with an account. Birthdays power the birthday codes under Coupons."
        actions={<Button variant="secondary" busy={exporting} onClick={exportAll}><Download size={14} /> Export CSV</Button>}
      />
      <form className="flex gap-2 mb-4 max-w-[480px]" onSubmit={(e) => { e.preventDefault(); setPage(0); setSearch(input.trim()); }}>
        <TextInput placeholder="Name, email or phone" value={input} onChange={(e) => setInput(e.target.value)} aria-label="Search customers" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      {error && <p className="text-[13px] text-rose-600 mb-3">{toFriendlyError(error)}</p>}
      <div className="bg-white border border-[#EAEAEA] overflow-x-auto">
        <table className="w-full text-[13px] min-w-[760px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-[#777777] border-b border-[#EAEAEA]">
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium text-right">Orders</th>
              <th className="px-3 py-2 font-medium text-right">Spent</th>
              <th className="px-3 py-2 font-medium">Last order</th>
              <th className="px-3 py-2 font-medium">Birthday</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {isLoading && <tr><td colSpan={6} className="px-3 py-6 text-[#777777]">Loading…</td></tr>}
            {!isLoading && (data?.rows ?? []).length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-[#777777]">No customers {search ? 'match' : 'yet'}.</td></tr>}
            {(data?.rows ?? []).map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2.5">
                  <p>{c.full_name || '—'}</p>
                  <p className="text-[11px] text-[#888888]">{c.email} · joined {formatOrderDate(c.created_at)}</p>
                </td>
                <td className="px-3 py-2.5 text-[12.5px]">{c.phone ? formatIndianPhone(c.phone) : ''}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{c.orders}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatINR(Number(c.spent))}</td>
                <td className="px-3 py-2.5 text-[12.5px]">{formatOrderDate(c.last_order_at)}</td>
                <td className="px-3 py-2.5 text-[12.5px]">
                  {fmtBirthday(c.date_of_birth)}
                  <button type="button" aria-label={`Set birthday for ${c.full_name || c.email}`} className="ml-1 p-1 text-[#999999] hover:text-tk-ink align-middle" onClick={() => { setEditing(c); setDob(c.date_of_birth ?? ''); }}>
                    <Pencil size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-3 mt-3 text-[12px]">
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {page + 1} of {pages}</span>
          <Button size="sm" variant="secondary" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Modal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={`Birthday · ${editing?.full_name || editing?.email || ''}`}
        description="Customers set their birthday once; correct it here if they ask."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!editing) return;
                try {
                  await rpc('set_customer_birthday', { p_user: editing.id, p_date: dob || null });
                  await qc.invalidateQueries({ queryKey: ['admin', 'customers'] });
                  setEditing(null);
                  toast.success('Birthday saved.');
                } catch (err) {
                  toast.error(toFriendlyError(err));
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <FieldShell label="Date of birth" htmlFor="cu-dob">
          <TextInput id="cu-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="max-w-[200px]" />
        </FieldShell>
      </Modal>
    </div>
  );
}
