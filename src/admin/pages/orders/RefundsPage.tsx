import { useState } from 'react';
import { usePaged } from '../../../lib/paging';
import { Pager } from '../../ui/Pager';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { formatRupees as formatINR } from '../../../lib/money';
import { invokeFunction } from '../../../lib/razorpay';
import { formatOrderDateTime } from '../../../storefront/orders/useOrders';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextArea } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
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

interface DueRow {
  order_id: string;
  order_number: string;
  customer_name: string | null;
  status: 'CANCELLED' | 'RTO';
  due: number;
  since: string;
}

const TONE = { PROCESSING: 'bg-amber-50 text-amber-800 border-amber-200', REFUNDED: 'bg-emerald-50 text-emerald-800 border-emerald-200', FAILED: 'bg-rose-50 text-rose-700 border-rose-200' };
const LIMIT = 300;

export default function RefundsPage() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'refunds'],
    queryFn: async () =>
      (await throwIf(
        supabase.from('refunds').select('*, order:orders(order_number, customer_name)').order('created_at', { ascending: false }).limit(LIMIT),
      )) as unknown as RefundRow[],
  });
  const { data: due = [] } = useQuery({
    queryKey: ['admin', 'refunds-due'],
    queryFn: async () => (await rpc<DueRow[]>('refunds_due', {})) ?? [],
  });
  const paged = usePaged(rows, 25, rows.length);
  const [managing, setManaging] = useState<RefundRow | null>(null);
  const [status, setStatus] = useState<RefundRow['status']>('PROCESSING');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [refundingDue, setRefundingDue] = useState<DueRow | null>(null);
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['admin', 'refunds'] }), qc.invalidateQueries({ queryKey: ['admin', 'refunds-due'] })]);
  const online = managing?.method === 'RAZORPAY';

  return (
    <div>
      <PageHeader
        title="Refunds"
        description="Online refunds go back through Razorpay to the card, UPI or bank the customer used. Cash orders are refunded by UPI or bank transfer from the return, and recorded here."
      />

      {due.length > 0 && (
        <section aria-labelledby="due-h" className="mb-6 bg-white border border-rose-200">
          <div className="px-4 py-3 border-b border-rose-200 bg-rose-50">
            <h2 id="due-h" className="text-[14px] font-semibold text-rose-800">Refunds due · {due.length}</h2>
            <p className="text-[13px] text-rose-800/80">Paid online orders that were cancelled or came back, with money still to return.</p>
          </div>
          <ul className="divide-y divide-[#E9E7E2]">
            {due.map((d) => (
              <li key={d.order_id} className="px-4 py-3 flex flex-wrap items-center gap-3 justify-between text-[14px]">
                <div>
                  <Link to={`/admin/orders/${d.order_id}`} className="font-medium hover:underline">{d.order_number}</Link>
                  <p className="text-[12px] text-[#4F4F4F]">
                    {d.customer_name} · {d.status === 'CANCELLED' ? 'cancelled' : 'returned to us'} {formatOrderDateTime(d.since)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-medium">{formatINR(Number(d.due))}</span>
                  <Button size="sm" onClick={() => setRefundingDue(d)}>Refund {formatINR(Number(d.due))}</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="bg-white border border-[#E2E0DB] overflow-x-auto">
        <table className="w-full text-[14px] min-w-[680px]">
          <thead>
            <tr className="text-left text-[12px] text-[#4A4A4A] border-b border-[#E2E0DB] font-medium">
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">How</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E7E2]">
            {isLoading && <tr><td colSpan={5} className="px-3 py-6 text-[#4A4A4A]">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-[#4A4A4A]">No refunds yet. Refunds you make from an order or a return appear here.</td></tr>
            )}
            {paged.rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2.5">
                  <Link to={`/admin/orders/${r.order_id}`} className="font-medium hover:underline">{r.order.order_number}</Link>
                  <p className="text-[12px] text-[#4F4F4F]">{r.order.customer_name} · {formatOrderDateTime(r.created_at)}</p>
                </td>
                <td className="px-3 py-2.5 tabular-nums">{formatINR(Number(r.amount))}</td>
                <td className="px-3 py-2.5 text-[13px]">
                  {r.method === 'RAZORPAY' ? 'Razorpay' : 'UPI / bank'}
                  <p className="text-[12px] text-[#4F4F4F] font-mono">{r.razorpay_refund_id ?? r.reference}</p>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`inline-block px-2 py-0.5 border text-[12.5px] ${TONE[r.status]} font-medium`}>{r.status.toLowerCase()}</span>
                  {r.status === 'FAILED' && r.note && <p className="text-[12px] text-rose-700 mt-1 max-w-[260px]">{r.note}</p>}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Button size="sm" variant="secondary" onClick={() => { setManaging(r); setStatus(r.status); setNote(r.note ?? ''); }}>Manage</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager page={paged.page} pageCount={paged.pageCount} onPage={paged.setPage} from={paged.from} to={paged.to} total={paged.total} noun="refunds" />
        {rows.length >= LIMIT && (
          <p className="px-3 py-2 text-[12.5px] text-[#4A4A4A] border-t border-[#E2E0DB]">Showing the latest {LIMIT}. Older refunds are in Data export.</p>
        )}
      </div>

      <ConfirmDialog
        open={!!refundingDue}
        onOpenChange={(o) => !o && setRefundingDue(null)}
        title={`Refund ${refundingDue ? formatINR(Number(refundingDue.due)) : ''} for ${refundingDue?.order_number ?? ''}?`}
        description="Razorpay sends the money back to the card, UPI or bank the customer paid with. It usually arrives in 5–7 working days."
        confirmLabel="Refund now"
        danger
        onConfirm={async () => {
          if (!refundingDue) return;
          try {
            await invokeFunction('razorpay-refund', { action: 'refund', order_id: refundingDue.order_id });
            await refresh();
            toast.success('Refund started.');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />

      <Modal
        open={!!managing}
        onOpenChange={(o) => !o && !busy && setManaging(null)}
        title={`Refund · ${managing?.order.order_number ?? ''}`}
        description={managing ? `${formatINR(Number(managing.amount))} · ${online ? `Razorpay ${managing.razorpay_refund_id ?? ''}` : `UPI / bank ${managing.reference ?? ''}`}` : ''}
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
            {online ? (
              <div className="space-y-2">
                <p className="text-[13.5px] text-[#454545]">
                  Razorpay sets the status of online refunds; it updates on its own. Status now: <strong>{managing.status.toLowerCase()}</strong>.
                </p>
                {managing.status === 'PROCESSING' && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const r = await invokeFunction<{ checked: number; updated: number }>('razorpay-refund', { action: 'sync', order_id: managing.order_id });
                        await refresh();
                        setManaging(null);
                        toast.success(r.updated ? 'Status refreshed from Razorpay.' : 'Razorpay has no update yet.');
                      } catch (err) {
                        toast.error(toFriendlyError(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Check status with Razorpay
                  </Button>
                )}
              </div>
            ) : (
              <FieldShell label="Status" htmlFor="rf-status" help="Set this once the UPI or bank transfer has gone through.">
                <select id="rf-status" value={status} onChange={(e) => setStatus(e.target.value as RefundRow['status'])} className="w-full border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white">
                  <option value="PROCESSING">Processing</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="FAILED">Failed</option>
                </select>
              </FieldShell>
            )}
            <FieldShell label="Notes" htmlFor="rf-note" help="Only staff see this. e.g. UPI ref 4123 9876 sent on 12 Nov">
              <TextArea id="rf-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </FieldShell>
          </div>
        )}
      </Modal>
    </div>
  );
}
