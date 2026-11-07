import { normalizeIndianPhone } from '../../lib/phone';

export type SettingType = 'text' | 'number' | 'boolean' | 'phone' | 'range';

export interface SettingField {
  key: string;
  label: string;
  type: SettingType;
  help?: string;
  min?: number;
  max?: number;
  /** Numbers are whole numbers unless this is true. */
  decimals?: boolean;
  pattern?: string;
  patternHint?: string;
  suffix?: string;
}

export interface SettingGroup {
  group: string;
  description?: string;
  fields: SettingField[];
}

export const SETTINGS_SCHEMA: SettingGroup[] = [
  {
    group: 'Store',
    fields: [{ key: 'store.name', label: 'Store name', type: 'text', help: 'Used in page titles, invoices and messages.' }],
  },
  {
    group: 'Delivery',
    fields: [
      { key: 'shipping.fee', label: 'Delivery fee', type: 'number', min: 0, suffix: '₹' },
      {
        key: 'shipping.free_threshold',
        label: 'Free delivery from',
        type: 'number',
        min: 0,
        suffix: '₹',
        help: 'Orders at or above this amount (after discount) ship free. Use 0 to make all delivery free.',
      },
      {
        key: 'shipping.default_eta',
        label: 'Delivery estimate (days)',
        type: 'range',
        min: 1,
        help: 'Shown on product pages and checkout until a courier gives a live estimate.',
      },
    ],
  },
  {
    group: 'Cash on delivery',
    fields: [
      { key: 'cod.enabled', label: 'Offer cash on delivery', type: 'boolean' },
      { key: 'cod.min_order', label: 'Minimum order for COD', type: 'number', min: 0, suffix: '₹', help: '0 means no minimum.' },
    ],
  },
  {
    group: 'Orders, returns and stock',
    fields: [
      {
        key: 'orders.prefix',
        label: 'Order number prefix',
        type: 'text',
        pattern: '^[A-Z]{1,6}-?$',
        patternHint: 'Use 1–6 capital letters, optionally ending with a dash, e.g. SAU-',
      },
      { key: 'returns.window_days', label: 'Return window', type: 'number', min: 0, suffix: 'days', help: 'Days after delivery a return can be requested.' },
      { key: 'inventory.low_stock_threshold', label: 'Low-stock alert at', type: 'number', min: 0, suffix: 'units' },
    ],
  },
  {
    group: 'Free samples',
    description: 'For every set amount of perfume in an order, the customer picks a free sample.',
    fields: [
      { key: 'samples.enabled', label: 'Free sample programme', type: 'boolean' },
      { key: 'samples.ml_per_sample', label: 'One sample for every', type: 'number', min: 1, suffix: 'ml of perfume' },
      { key: 'samples.sample_size_ml', label: 'Sample size', type: 'number', min: 1, suffix: 'ml' },
      { key: 'samples.max_per_order', label: 'Most samples per order', type: 'number', min: 0 },
      { key: 'samples.allow_duplicates', label: 'Allow the same scent twice', type: 'boolean' },
    ],
  },
  {
    group: 'Payments and sign-in',
    fields: [
      {
        key: 'payments.online_enabled',
        label: 'Online payment (Razorpay)',
        type: 'boolean',
        help: 'Turn on only after the Razorpay keys are added. Until then, checkout offers cash on delivery.',
      },
      { key: 'auth.google_enabled', label: 'Google sign-in', type: 'boolean', help: 'Needs a Google OAuth client set up in Supabase first.' },
    ],
  },
  {
    group: 'WhatsApp',
    fields: [
      { key: 'whatsapp.floating_number', label: 'Number for the chat button', type: 'phone', help: 'Leave empty to hide the floating chat button.' },
    ],
  },
  {
    group: 'Images and analytics',
    fields: [
      {
        key: 'media.transforms_enabled',
        label: 'Resize images on the fly',
        type: 'boolean',
        help: 'Requires the Supabase Pro plan. Leave off on the free plan.',
      },
      { key: 'analytics.ga4_id', label: 'Google Analytics 4 ID', type: 'text', pattern: '^(G-[A-Z0-9]+)?$', patternHint: 'Looks like G-ABC123XYZ, or leave empty.' },
      { key: 'analytics.gtm_id', label: 'Google Tag Manager ID', type: 'text', pattern: '^(GTM-[A-Z0-9]+)?$', patternHint: 'Looks like GTM-ABC123, or leave empty.' },
    ],
  },
];

export type ParseResult = { ok: true; value: unknown } | { ok: false; error: string };

function parseNumber(field: SettingField, raw: string): { ok: true; value: number } | { ok: false; error: string } {
  const text = String(raw ?? '').trim();
  if (text === '' || Number.isNaN(Number(text))) return { ok: false, error: 'Enter a number.' };
  const value = Number(text);
  if (!field.decimals && !Number.isInteger(value)) return { ok: false, error: 'Use a whole number.' };
  if (field.min !== undefined && value < field.min) return { ok: false, error: `Must be at least ${field.min}.` };
  if (field.max !== undefined && value > field.max) return { ok: false, error: `Must be at most ${field.max}.` };
  return { ok: true, value };
}

export function parseSettingInput(field: SettingField, raw: unknown): ParseResult {
  switch (field.type) {
    case 'boolean':
      return { ok: true, value: Boolean(raw) };
    case 'number':
      return parseNumber(field, raw as string);
    case 'range': {
      const r = (raw ?? {}) as { min?: string; max?: string };
      const lo = parseNumber(field, r.min ?? '');
      if (!lo.ok) return lo;
      const hi = parseNumber(field, r.max ?? '');
      if (!hi.ok) return hi;
      if (lo.value > hi.value) return { ok: false, error: 'The first number must not be bigger than the second.' };
      return { ok: true, value: { min: lo.value, max: hi.value } };
    }
    case 'phone': {
      const text = String(raw ?? '').trim();
      if (!text) return { ok: true, value: '' };
      const phone = normalizeIndianPhone(text);
      return phone ? { ok: true, value: phone } : { ok: false, error: 'Enter a 10-digit Indian mobile number.' };
    }
    case 'text':
    default: {
      const text = String(raw ?? '').trim();
      if (field.pattern && !new RegExp(field.pattern).test(text)) {
        return { ok: false, error: field.patternHint ?? 'This value is not in the expected format.' };
      }
      return { ok: true, value: text };
    }
  }
}

/** Turns a stored JSON value into what the form input shows. */
export function toInputValue(field: SettingField, value: unknown): unknown {
  if (field.type === 'boolean') return Boolean(value);
  if (field.type === 'range') {
    const v = (value ?? {}) as { min?: number; max?: number };
    return { min: v.min === undefined ? '' : String(v.min), max: v.max === undefined ? '' : String(v.max) };
  }
  if (value === null || value === undefined) return '';
  return String(value);
}
