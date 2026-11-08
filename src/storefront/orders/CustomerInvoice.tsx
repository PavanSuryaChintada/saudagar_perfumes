import { useAuth } from '../../lib/auth';
import PrintOrderPage from '../../admin/pages/orders/PrintOrderPage';

/** /orders/:id/invoice — the customer's own GST invoice (row level security only returns their orders). */
export default function CustomerInvoice() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-[13px]">Preparing…</p>;
  if (!user) {
    return (
      <p className="p-8 text-[13px]">
        Please <a href={`/login?next=${encodeURIComponent(window.location.pathname)}`} className="underline">sign in</a> to see your invoice.
      </p>
    );
  }
  return <PrintOrderPage customer />;
}
