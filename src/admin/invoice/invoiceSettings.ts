// Everything printed on the customer's invoice and the packing slip, editable in Admin → Invoice and stored as the
// `invoice` site block. Seller details (legal name, GSTIN, address, state, small print) stay in Settings → Business
// because GST is worked out from them; the Invoice page edits them in the same place.
import type { FieldDef } from '../../cms/schema';
import { useBlock } from '../../cms/useSite';

export interface InvoiceSettings {
  title: string;
  slip_title: string;
  show_logo: boolean;
  logo: string;
  number_label: string;
  date_label: string;
  bill_to_label: string;
  ship_to_label: string;
  place_of_supply_label: string;
  col_description: string;
  col_hsn: string;
  col_qty: string;
  col_taxable: string;
  col_total: string;
  show_hsn: boolean;
  show_samples: boolean;
  sample_prefix: string;
  delivery_label: string;
  show_amount_in_words: boolean;
  amount_in_words_label: string;
  thank_you: string;
  payment_details: string;
  terms: string;
  signature: string;
  signatory_label: string;
  footer: string;
}

export const INVOICE_DEFAULTS: InvoiceSettings = {
  title: 'Tax invoice',
  slip_title: 'Packing slip',
  show_logo: true,
  logo: '',
  number_label: 'Invoice no.',
  date_label: 'Date',
  bill_to_label: 'Bill to',
  ship_to_label: 'Ship to',
  place_of_supply_label: 'Place of supply',
  col_description: 'Description',
  col_hsn: 'HSN/SAC',
  col_qty: 'Qty',
  col_taxable: 'Taxable value',
  col_total: 'Total',
  show_hsn: true,
  show_samples: true,
  sample_prefix: 'Free sample',
  delivery_label: 'Delivery charges',
  show_amount_in_words: true,
  amount_in_words_label: 'Amount in words',
  thank_you: 'Thank you for shopping with us.',
  payment_details: '',
  terms: '',
  signature: '',
  signatory_label: 'Authorised signatory',
  footer: 'This is a computer-generated invoice.',
};

const t = (key: keyof InvoiceSettings, label: string, help?: string): FieldDef => ({ key, label, type: 'text', help });
const ta = (key: keyof InvoiceSettings, label: string, help?: string): FieldDef => ({ key, label, type: 'textarea', rows: 3, help });
const b = (key: keyof InvoiceSettings, label: string, help?: string): FieldDef => ({ key, label, type: 'boolean', help });

/** The Invoice page form, in the order things appear on the page. */
export const INVOICE_FIELD_GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Top of the invoice',
    fields: [
      t('title', 'Invoice title', 'e.g. Tax invoice'),
      b('show_logo', 'Show the logo'),
      { key: 'logo', label: 'Logo for invoices', type: 'media', accept: 'image', help: 'Optional. Leave empty to use the logo from Site content → Brand.' },
      t('number_label', 'Invoice number label', 'e.g. Invoice no.'),
      t('date_label', 'Date label'),
    ],
  },
  {
    title: 'Customer',
    fields: [t('bill_to_label', 'Billing heading', 'e.g. Bill to'), t('ship_to_label', 'Delivery heading', 'e.g. Ship to'), t('place_of_supply_label', 'Place of supply label')],
  },
  {
    title: 'Items table',
    fields: [
      t('col_description', 'Item column'),
      b('show_hsn', 'Show the HSN/SAC column'),
      t('col_hsn', 'HSN column'),
      t('col_qty', 'Quantity column'),
      t('col_taxable', 'Taxable value column'),
      t('col_total', 'Total column'),
      t('delivery_label', 'Delivery line', 'e.g. Delivery charges'),
      b('show_samples', 'List free samples (at ₹0)'),
      t('sample_prefix', 'Free sample label', 'e.g. Free sample'),
      b('show_amount_in_words', 'Show the amount in words'),
      t('amount_in_words_label', 'Amount in words label'),
    ],
  },
  {
    title: 'Bottom of the invoice',
    fields: [
      t('thank_you', 'Thank-you line', 'e.g. Thank you for shopping with us.'),
      ta('payment_details', 'Bank / UPI details', 'Optional, e.g. for B2B orders.'),
      ta('terms', 'Terms', 'Optional, e.g. return policy in one or two lines.'),
      { key: 'signature', label: 'Signature image', type: 'media', accept: 'image', help: 'Optional. A transparent PNG works best.' },
      t('signatory_label', 'Under the signature', 'e.g. Authorised signatory'),
      t('footer', 'Last line', 'e.g. This is a computer-generated invoice.'),
      t('slip_title', 'Packing slip title'),
    ],
  },
];

/** The saved invoice settings with every missing value filled from the defaults. */
export function withInvoiceDefaults(saved: Partial<InvoiceSettings> | null | undefined): InvoiceSettings {
  const out = { ...INVOICE_DEFAULTS };
  for (const [k, v] of Object.entries(saved ?? {})) {
    if (v === null || v === undefined) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export function useInvoiceSettings(): InvoiceSettings {
  return withInvoiceDefaults(useBlock<Partial<InvoiceSettings>>('invoice'));
}
