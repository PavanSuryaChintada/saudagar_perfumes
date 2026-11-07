import { describe, expect, it } from 'vitest';
import { parseSettingInput, SETTINGS_SCHEMA, type SettingField } from './schema';

const num: SettingField = { key: 'shipping.fee', label: 'Fee', type: 'number', min: 0 };

describe('parseSettingInput', () => {
  it('rejects a number below the minimum', () => {
    expect(parseSettingInput(num, '-5')).toEqual({ ok: false, error: 'Must be at least 0.' });
  });
  it('parses a valid number', () => expect(parseSettingInput(num, '250')).toEqual({ ok: true, value: 250 }));
  it('rejects text in a number field', () => expect(parseSettingInput(num, 'abc')).toEqual({ ok: false, error: 'Enter a number.' }));
  it('rejects decimals for whole-number fields', () =>
    expect(parseSettingInput(num, '2.5')).toEqual({ ok: false, error: 'Use a whole number.' }));
  it('passes booleans through', () =>
    expect(parseSettingInput({ key: 'cod.enabled', label: 'COD', type: 'boolean' }, false)).toEqual({ ok: true, value: false }));
  it('normalises phone numbers and allows empty', () => {
    const phone: SettingField = { key: 'whatsapp.floating_number', label: 'WA', type: 'phone' };
    expect(parseSettingInput(phone, '+91 98765 43210')).toEqual({ ok: true, value: '9876543210' });
    expect(parseSettingInput(phone, '')).toEqual({ ok: true, value: '' });
    expect(parseSettingInput(phone, '123')).toEqual({ ok: false, error: 'Enter a 10-digit Indian mobile number.' });
  });
  it('validates a min/max day range', () => {
    const range: SettingField = { key: 'shipping.default_eta', label: 'ETA', type: 'range', min: 1 };
    expect(parseSettingInput(range, { min: '3', max: '7' })).toEqual({ ok: true, value: { min: 3, max: 7 } });
    expect(parseSettingInput(range, { min: '8', max: '7' })).toEqual({ ok: false, error: 'The first number must not be bigger than the second.' });
  });
  it('checks text patterns', () => {
    const prefix: SettingField = { key: 'orders.prefix', label: 'Prefix', type: 'text', pattern: '^[A-Z]{1,6}-?$', patternHint: 'Capital letters, e.g. SAU-' };
    expect(parseSettingInput(prefix, 'SAU-')).toEqual({ ok: true, value: 'SAU-' });
    expect(parseSettingInput(prefix, 'sau')).toEqual({ ok: false, error: 'Capital letters, e.g. SAU-' });
  });
});

describe('SETTINGS_SCHEMA', () => {
  it('covers every seeded setting key exactly once', () => {
    const keys = SETTINGS_SCHEMA.flatMap((g) => g.fields.map((f) => f.key)).sort();
    expect(keys).toEqual(
      [
        'store.name', 'shipping.fee', 'shipping.free_threshold', 'shipping.default_eta', 'cod.enabled', 'cod.min_order',
        'returns.window_days', 'samples.enabled', 'samples.ml_per_sample', 'samples.sample_size_ml', 'samples.max_per_order',
        'samples.allow_duplicates', 'payments.online_enabled', 'auth.google_enabled', 'media.transforms_enabled',
        'whatsapp.floating_number', 'analytics.ga4_id', 'analytics.gtm_id', 'inventory.low_stock_threshold', 'orders.prefix',
      ].sort(),
    );
  });
});
