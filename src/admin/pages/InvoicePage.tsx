import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { toFriendlyError } from '../../lib/errors';
import { useBlock } from '../../cms/useSite';
import { PageHeader, Panel } from '../ui/PageHeader';
import { Button } from '../ui/Button';
import { FieldShell, TextArea, TextInput } from '../ui/Field';
import { SchemaForm } from '../cms/SchemaForm';
import { throwIf } from '../catalog/api';
import { useBusinessSettings, type AdminOrder } from '../orders/api';
import { OrderDocument } from './orders/PrintOrderPage';
import { INVOICE_FIELD_GROUPS, withInvoiceDefaults, type InvoiceSettings } from '../invoice/invoiceSettings';

const BUSINESS: { key: string; label: string; help?: string; multiline?: boolean }[] = [
  { key: 'legal_name', label: 'Legal business name', help: 'e.g. Saudagar Perfumers Retail Private Limited' },
  { key: 'gstin', label: 'GSTIN', help: '15 characters, e.g. 37ABCDE1234F1Z5' },
  { key: 'address', label: 'Registered address', multiline: true },
  { key: 'state', label: 'State of registration', help: 'Same state as the customer = CGST + SGST; otherwise IGST.' },
  { key: 'invoice_note', label: 'Small print', multiline: true, help: 'Optional, e.g. a return policy line.' },
];

/** What the preview shows when there are no orders yet. */
const DEMO = {
  id: 'demo',
  order_number: 'SAU-1001',
  created_at: new Date().toISOString(),
  payment_method: 'COD',
  payment_status: 'PENDING',
  status: 'PACKED',
  total: 5148,
  subtotal: 4900,
  discount: 0,
  shipping_fee: 248,
  amount_refunded: 0,
  samples_short: 0,
  note: null,
  customer_name: 'Ravi Kumar',
  customer_email: 'ravi@example.com',
  customer_phone: '9876543210',
  shipping_address: { full_name: 'Ravi Kumar', line1: '12 MG Road', line2: 'Flat 4B', city: 'Guntur', state: 'Andhra Pradesh', pincode: '522001', phone: '9876543210' },
  order_items: [
    { id: 'i1', line_type: 'item', product_name: 'Amber Noir', variant_label: '50 ml', qty: 1, line_total: 4900, hsn_code: '3303', gst_rate: 18, sku: 'AMBER-NOIR-50', position: 0 },
    { id: 's1', line_type: 'sample', product_name: 'Velvet Oud', variant_label: '5 ml sample', qty: 1, line_total: 0, hsn_code: '3303', gst_rate: 18, sku: 'VELVET-OUD-S5', position: 1 },
  ],
} as unknown as AdminOrder;

export default function InvoicePage() {
  const qc = useQueryClient();
  const saved = useBlock<Partial<InvoiceSettings>>('invoice');
  const brand = useBlock<Record<string, string>>('brand') || {};
  const { data: biz } = useBusinessSettings();
  const [inv, setInv] = useState<InvoiceSettings | null>(null);
  const [seller, setSeller] = useState<Record<string, string> | null>(null);
  const [doc, setDoc] = useState<'invoice' | 'slip'>('invoice');
  const [busy, setBusy] = useState(false);

  useEffect(() => setInv((cur) => cur ?? withInvoiceDefaults(saved)), [saved]);
  useEffect(() => setSeller((cur) => cur ?? (biz ? { ...biz } : null)), [biz]);

  const { data: latest } = useQuery({
    queryKey: ['admin', 'invoice-preview-order'],
    queryFn: async () => {
      const rows = (await throwIf(supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(1))) as unknown as AdminOrder[];
      const o = rows[0];
      if (o) o.order_items = [...(o.order_items ?? [])].sort((a, b) => a.position - b.position);
      return o ?? null;
    },
  });
  const order = latest ?? DEMO;
  const dirty = useMemo(
    () => !!inv && !!seller && (JSON.stringify(inv) !== JSON.stringify(withInvoiceDefaults(saved)) || JSON.stringify(seller) !== JSON.stringify(biz)),
    [inv, seller, saved, biz],
  );

  const save = async () => {
    if (!inv || !seller) return;
    if (seller.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(seller.gstin.trim().toUpperCase())) {
      toast.error('The GSTIN should be 15 characters, e.g. 37ABCDE1234F1Z5.');
      return;
    }
    setBusy(true);
    try {
      await throwIf(supabase.from('site_blocks').upsert({ key: 'invoice', value: inv as never }));
      for (const b of BUSINESS) {
        const value = b.key === 'gstin' ? (seller[b.key] ?? '').trim().toUpperCase() : (seller[b.key] ?? '').trim();
        await throwIf(supabase.from('settings').update({ value: value as never }).eq('key', `business.${b.key}`));
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['bootstrap'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'business-settings'] }),
      ]);
      toast.success('Invoice saved. Every invoice, including old orders, now prints this way.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!inv || !seller) return <p className="text-[14px] text-[#4A4A4A]">Loading…</p>;

  return (
    <div className="pb-24">
      <PageHeader
        title="Invoice"
        description="Everything printed on the invoice customers download and on your packing slips. The preview on the right updates as you type."
        actions={
          <Button onClick={save} busy={busy} disabled={!dirty}>
            Save invoice
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,440px)_1fr]">
        <div className="space-y-5 min-w-0">
          <Panel title="Seller details" description="Printed at the top. GST is split from the state below.">
            <div className="space-y-4">
              {BUSINESS.map((b) => (
                <FieldShell key={b.key} label={b.label} htmlFor={`biz-${b.key}`} help={b.help}>
                  {b.multiline ? (
                    <TextArea id={`biz-${b.key}`} rows={3} value={seller[b.key] ?? ''} onChange={(e) => setSeller({ ...seller, [b.key]: e.target.value })} />
                  ) : (
                    <TextInput id={`biz-${b.key}`} value={seller[b.key] ?? ''} onChange={(e) => setSeller({ ...seller, [b.key]: e.target.value })} />
                  )}
                </FieldShell>
              ))}
            </div>
          </Panel>
          {INVOICE_FIELD_GROUPS.map((g) => (
            <Panel key={g.title} title={g.title}>
              <SchemaForm fields={g.fields} value={inv as unknown as Record<string, unknown>} onChange={(next) => setInv(next as unknown as InvoiceSettings)} />
            </Panel>
          ))}
        </div>

        <div className="min-w-0">
          <div className="xl:sticky xl:top-4 space-y-3">
            <div role="tablist" aria-label="Preview" className="flex gap-1">
              {([
                ['invoice', 'Invoice'],
                ['slip', 'Packing slip'],
              ] as const).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={doc === k}
                  onClick={() => setDoc(k)}
                  className={`px-3 py-1.5 text-[13.5px] border ${doc === k ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#C4C1B9] hover:border-tk-ink'}`}
                >
                  {l}
                </button>
              ))}
              <span className="self-center ml-2 text-[13px] text-[#4A4A4A]">{latest ? `Your latest order, ${latest.order_number}` : 'Example order (no orders yet)'}</span>
            </div>
            <div className="bg-white border border-[#E2E0DB] shadow-sm overflow-auto max-h-[calc(100vh-180px)] text-black">
              <OrderDocument o={order} biz={seller} brand={brand} doc={doc} inv={inv} />
            </div>
          </div>
        </div>
      </div>
      {dirty && (
        <div className="fixed bottom-0 inset-x-0 lg:left-[240px] z-30 bg-white border-t border-[#E2E0DB] px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
          <p className="text-[13.5px] text-[#3F3F3F]">Unsaved changes</p>
          <Button onClick={save} busy={busy}>Save invoice</Button>
        </div>
      )}
    </div>
  );
}
