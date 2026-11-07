import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { formatINR } from '../../../lib/money';
import { invokeFunction } from '../../../lib/razorpay';
import { formatOrderDateTime } from '../../../storefront/orders/useOrders';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextArea } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { rpc, throwIf } from '../../catalog/api';

interface RefundRow {
  id: string;
  order_id: string;
  method: 'RAZORPAY' | 'MANUAL';
  amount: number;
  status: 'PROCESSING' | 'REFUNDED' | 'FAILED';
  razorpay_refund_id: string | null;
  reference: string | null;
  note: string | null;
  created_at: string;
  order: { order_number: string; customer_name: string | null };
}

const TONE = { PROCESSING: 'bg-amber-50 text-amber-800 border-amber-200', REFUNDED: 'bg-emerald-50 text-emerald-800 border-emerald-200', FAILED: 'bg-rose-50 text-rose-700 border-rose-200' };

export default function RefundsPage() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'refunds'],
    queryFn: async () =>
      (await throwIf(supabase.from('refunds').select('*, order:orders(order_number, customer_name)').order('created_at', { ascending: false }).limit(300))) as unknown as RefundRow[],
  });
  const [managing, setManaging] = useState<RefundRow | null>(null);
  const [status, setStatus] = useState<RefundRow['status']>('PROCESSING');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'refunds'] });

  return (
    <div>
      <PageHeader title="Refunds" description="Every refund: online refunds through Razorpay and manual UPI / bank refunds for cash orders." />
      <div className="bg-white border border-[#EAEAEA] overflow-x-auto">
        <table className="w-full text-[13px] min-w-[680px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-[#777777] border-b border-[#EAEAEA]">
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">How</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {isLoading && <tr><td colSpan={5} className="px-3 py-6 text-[#777777]">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-[#777777]">No refunds yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2.5">
                  <Link to={`/admin/orders/${r.order_id}`} className="font-medium hover:underline">{r.order.order_number}</Link>
                  <p className="text-[11px] text-[#888888]">{r.order.customer_name} · {formatOrderDateTime(r.created_at)}</p>
                </td>
                <td className="px-3 py-2.5 tabular-nums">{formatINR(Number(r.amount))}</td>
                <td className="px-3 py-2.5 text-[12px]">
                  {r.method === 'RAZORPAY' ? 'Razorpay' : 'UPI / bank'}
                  <p className="text-[11px] text-[#888888] font-mono">{r.razorpay_refund_id ?? r.reference}</p>
                </td>
                <td className="px-3 py-2.5"><span className={`inline-block px-2 py-0.5 border text-[10.5px] uppercase tracking-[0.06em] ${TONE[r.status]}`}>{r.status.toLowerCase()}</span></td>
                <td className="px-3 py-2.5 text-right">
                  <Button size="sm" variant="secondary" onClick={() => { setManaging(r); setStatus(r.status); setNote(r.note ?? ''); }}>Manage</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!managing}
        onOpenChange={(o) => !o && !busy && setManaging(null)}
        title={`Refund · ${managing?.order.order_number ?? ''}`}
        description={managing ? `${formatINR(Number(managing.amount))} · ${managing.method === 'RAZORPAY' ? `Razorpay ${managing.razorpay_refund_id ?? ''}` : `UPI / bank ${managing.reference ?? ''}`}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setManaging(null)} disabled={busy}>Close</Button>
            <Button
              busy={busy}
              onClick={async () => {
                if (!managing) return;
                setBusy(true);
                try {
                  await rpc('update_refund', { p_refund: managing.id, p_status: status, p_note: note });
                  await refresh();
                  setManaging(null);
                  toast.success('Refund updated.');
                } catch (err) {
                  toast.error(toFriendlyError(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        {managing && (
          <div className="space-y-4">
            {managing.method === 'RAZORPAY' && managing.status === 'PROCESSING' && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await invokeFunction<{ status: RefundRow['status'] }>('razorpay-refund', { action: 'sync', order_id: managing.order_id });
                    setStatus(r.status);
                    await refresh();
                    toast.success(`Razorpay says: ${r.status.toLowerCase()}.`);
                  } catch (err) {
                    toast.error(toFriendlyError(err));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Refresh status from Razorpay
              </Button>
            )}
            <FieldShell label="Status" htmlFor="rf-status">
              <select id="rf-status" value={status} onChange={(e) => setStatus(e.target.value as RefundRow['status'])} className="w-full border border-[#D5D3CC] px-2 py-2 text-[13px] bg-white">
                <option value="PROCESSING">Processing</option>
                <option value="REFUNDED">Refunded</option>
                <option value="FAILED">Failed</option>
              </select>
            </FieldShell>
            <FieldShell label="Notes" htmlFor="rf-note">
              <TextArea id="rf-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </FieldShell>
          </div>
        )}
      </Modal>
    </div>
  );
}
