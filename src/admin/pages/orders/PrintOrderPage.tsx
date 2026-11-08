import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useAdminOrder, useBusinessSettings } from '../../orders/api';
import { useBlock } from '../../../cms/useSite';
import { formatINR } from '../../../lib/money';
import { formatIndianPhone } from '../../../lib/phone';
import { paymentLabel } from '../../../lib/orders';
import { buildInvoiceLines, isIntraState, rupeesInWords } from '../../../lib/invoice';
import { formatOrderDate } from '../../../storefront/orders/useOrders';

const SHIPPING_SAC = '996812';
const SHIPPING_GST = 18;

/** Printable tax invoice (?doc=invoice) or packing slip (?doc=slip). Opens the print dialog. */
export default function PrintOrderPage({ customer = false }: { customer?: boolean }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  // Customers only ever get their tax invoice; the packing slip is for the store.
  const doc = !customer && params.get('doc') === 'slip' ? 'slip' : 'invoice';
  const { data: o, isLoading } = useAdminOrder(id);
  const { data: biz } = useBusinessSettings();
  const brand = useBlock<Record<string, string>>('brand') || {};

  useEffect(() => {
    if (!o || !biz) return;
    document.title = `${doc === 'slip' ? 'Packing slip' : 'Invoice'} ${o.order_number}`;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [o, biz, doc]);

  if (isLoading || !biz) return <p className="p-8 text-[13px]">Preparing…</p>;
  if (!o) return <p className="p-8 text-[13px]">Order not found.</p>;

  const a = o.shipping_address || {};
  const items = o.order_items.filter((i) => i.line_type === 'item');
  const samples = o.order_items.filter((i) => i.line_type === 'sample');
  const sellerName = biz.legal_name || brand.legal_name || brand.name || '';
  const missing = [!biz.gstin && 'GSTIN', !biz.address && 'business address', !biz.state && 'business state'].filter(Boolean);

  const header = (
    <div className="flex justify-between gap-6 pb-4 border-b border-black">
      <div>
        {brand.logo_light_bg && <img src={brand.logo_light_bg} alt="" className="h-8 mb-2" />}
        <p className="font-semibold">{sellerName}</p>
        {biz.address && <p className="whitespace-pre-line">{biz.address}</p>}
        {biz.state && <p>State: {biz.state}</p>}
        {biz.gstin && <p>GSTIN: {biz.gstin}</p>}
      </div>
      <div className="text-right">
        <p className="text-[16px] font-semibold uppercase">{doc === 'slip' ? 'Packing slip' : 'Tax invoice'}</p>
        <p>Order / Invoice no: {o.order_number}</p>
        <p>Date: {formatOrderDate(o.created_at)}</p>
        <p>{paymentLabel(o)}</p>
      </div>
    </div>
  );

  const shipTo = (
    <div className="py-4">
      <p className="text-[10px] uppercase tracking-wider">Ship to</p>
      <p className="font-semibold">{a.full_name}</p>
      <p>{[a.line1, a.line2].filter(Boolean).join(', ')}</p>
      {a.landmark && <p>Near {a.landmark}</p>}
      <p>
        {a.city}, {a.state} {a.pincode}
      </p>
      {a.phone && <p>Phone: {formatIndianPhone(a.phone)}</p>}
    </div>
  );

  let body;
  if (doc === 'slip') {
    body = (
      <>
        {shipTo}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-black text-left">
              <th className="py-1.5">Item</th>
              <th className="py-1.5">SKU</th>
              <th className="py-1.5 text-right">Qty</th>
              <th className="py-1.5 text-right">Packed</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-[#CCCCCC]">
                <td className="py-1.5">{i.product_name} · {i.variant_label}</td>
                <td className="py-1.5 font-mono">{(i as unknown as { sku: string }).sku}</td>
                <td className="py-1.5 text-right">{i.qty}</td>
                <td className="py-1.5 text-right">☐</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-5 font-semibold uppercase text-[11px]">Free samples ({samples.length})</p>
        <table className="w-full border-collapse mt-1">
          <tbody>
            {samples.map((s) => (
              <tr key={s.id} className="border-b border-[#CCCCCC]">
                <td className="py-1.5">{s.product_name} · {s.variant_label}</td>
                <td className="py-1.5 font-mono">{(s as unknown as { sku: string }).sku}</td>
                <td className="py-1.5 text-right">1</td>
                <td className="py-1.5 text-right">☐</td>
              </tr>
            ))}
          </tbody>
        </table>
        {o.samples_short > 0 && <p className="mt-2 font-semibold">Note: {o.samples_short} sample(s) short — out of stock at order time.</p>}
        {o.note && (
          <p className="mt-4">
            <span className="font-semibold">Customer note:</span> {o.note}
          </p>
        )}
        {o.payment_method === 'COD' && o.payment_status !== 'PAID' && (
          <p className="mt-4 text-[14px] font-semibold">Collect cash: {formatINR(Number(o.total))}</p>
        )}
      </>
    );
  } else {
    const lines = buildInvoiceLines(
      items.map((i) => ({ name: `${i.product_name} · ${i.variant_label}`, hsn: (i as unknown as { hsn_code: string | null }).hsn_code, qty: i.qty, lineTotal: Number(i.line_total), gstRate: Number((i as unknown as { gst_rate: number | null }).gst_rate ?? 18) })),
      Number(o.discount),
    );
    const ship = Number(o.shipping_fee);
    if (ship > 0) lines.push(...buildInvoiceLines([{ name: 'Delivery charges', hsn: SHIPPING_SAC, qty: 1, lineTotal: ship, gstRate: SHIPPING_GST }], 0));
    const intra = isIntraState(biz.state, o.shipping_address?.state);
    const totalTaxable = lines.reduce((s, l) => s + l.taxable, 0);
    const totalTax = lines.reduce((s, l) => s + l.tax, 0);
    body = (
      <>
        <div className="grid grid-cols-2 gap-6">
          <div className="py-4">
            <p className="text-[10px] uppercase tracking-wider">Bill to</p>
            <p className="font-semibold">{o.customer_name}</p>
            {o.customer_email && <p>{o.customer_email}</p>}
            {o.customer_phone && <p>{formatIndianPhone(o.customer_phone)}</p>}
          </div>
          {shipTo}
        </div>
        <p className="mb-2">Place of supply: {a.state}</p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-black text-left">
              <th className="py-1.5">Description</th>
              <th className="py-1.5">HSN/SAC</th>
              <th className="py-1.5 text-right">Qty</th>
              <th className="py-1.5 text-right">Taxable value</th>
              {intra ? (
                <>
                  <th className="py-1.5 text-right">CGST</th>
                  <th className="py-1.5 text-right">SGST</th>
                </>
              ) : (
                <th className="py-1.5 text-right">IGST</th>
              )}
              <th className="py-1.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-[#CCCCCC] align-top">
                <td className="py-1.5">
                  {l.name}
                  {l.discount > 0 && <span className="block text-[10px]">Discount {formatINR(l.discount)}</span>}
                </td>
                <td className="py-1.5">{l.hsn}</td>
                <td className="py-1.5 text-right">{l.qty}</td>
                <td className="py-1.5 text-right">{formatINR(l.taxable)}</td>
                {intra ? (
                  <>
                    <td className="py-1.5 text-right">{formatINR(l.tax / 2)} <span className="text-[9px]">({l.gstRate / 2}%)</span></td>
                    <td className="py-1.5 text-right">{formatINR(l.tax / 2)} <span className="text-[9px]">({l.gstRate / 2}%)</span></td>
                  </>
                ) : (
                  <td className="py-1.5 text-right">{formatINR(l.tax)} <span className="text-[9px]">({l.gstRate}%)</span></td>
                )}
                <td className="py-1.5 text-right">{formatINR(l.total)}</td>
              </tr>
            ))}
            {samples.map((s) => (
              <tr key={s.id} className="border-b border-[#CCCCCC]">
                <td className="py-1.5">Free sample: {s.product_name} · {s.variant_label}</td>
                <td className="py-1.5">{(s as unknown as { hsn_code: string | null }).hsn_code}</td>
                <td className="py-1.5 text-right">1</td>
                <td className="py-1.5 text-right">{formatINR(0)}</td>
                {intra ? <><td /><td /></> : <td />}
                <td className="py-1.5 text-right">{formatINR(0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-black font-semibold">
              <td className="py-1.5" colSpan={3}>Total</td>
              <td className="py-1.5 text-right">{formatINR(totalTaxable)}</td>
              {intra ? (
                <>
                  <td className="py-1.5 text-right">{formatINR(totalTax / 2)}</td>
                  <td className="py-1.5 text-right">{formatINR(totalTax / 2)}</td>
                </>
              ) : (
                <td className="py-1.5 text-right">{formatINR(totalTax)}</td>
              )}
              <td className="py-1.5 text-right">{formatINR(Number(o.total))}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-3">Amount in words: {rupeesInWords(Number(o.total))}</p>
        {biz.invoice_note && <p className="mt-6 text-[10px] whitespace-pre-line">{biz.invoice_note}</p>}
        <p className="mt-8 text-right">For {sellerName}</p>
        <p className="mt-10 text-right text-[10px]">This is a computer-generated invoice.</p>
      </>
    );
  }

  return (
    <div className="bg-white text-black min-h-screen">
      {!customer && missing.length > 0 && doc === 'invoice' && (
        <p className="print:hidden px-6 py-3 bg-amber-50 border-b border-amber-200 text-[12px] text-amber-800">
          Add the {missing.join(', ')} in Admin → Settings → Business before using these invoices.
        </p>
      )}
      <div className="print:hidden px-6 py-3 flex gap-3 text-[12px] border-b border-[#EAEAEA]">
        <button type="button" onClick={() => window.print()} className="px-3 py-1.5 bg-black text-white">Print</button>
        <button type="button" onClick={() => window.close()} className="px-3 py-1.5 border border-black">Close</button>
      </div>
      <div className="max-w-[800px] mx-auto p-8 text-[11.5px] leading-relaxed">
        {header}
        {body}
      </div>
    </div>
  );
}
