import { describe, expect, it } from 'vitest';
import { addressSchema, personalDetailsSchema } from './schemas';

const addr = {
  label: 'Home', full_name: 'Asha Rao', phone: '98765 43210', line1: '12 MG Road', line2: '', landmark: '',
  city: 'Bengaluru', state: 'Karnataka', pincode: '560001',
};
const fields = (r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => i.path[0]);

describe('addressSchema', () => {
  it('accepts a complete Indian address and normalises the phone', () => {
    const r = addressSchema.safeParse(addr);
    expect(r.success).toBe(true);
    expect(r.success && r.data.phone).toBe('9876543210');
  });
  it('rejects a 5-digit pincode', () => expect(fields(addressSchema.safeParse({ ...addr, pincode: '56001' }))).toEqual(['pincode']));
  it('rejects a pincode starting with 0', () => expect(fields(addressSchema.safeParse({ ...addr, pincode: '060001' }))).toEqual(['pincode']));
  it('rejects an unknown state', () => expect(fields(addressSchema.safeParse({ ...addr, state: 'Atlantis' }))).toEqual(['state']));
  it('requires the street line', () => expect(fields(addressSchema.safeParse({ ...addr, line1: '  ' }))).toEqual(['line1']));
});

describe('personalDetailsSchema', () => {
  const base = { full_name: 'Asha Rao', phone: '', date_of_birth: '', whatsapp_opt_in: false };
  it('allows leaving phone and birthday empty', () => expect(personalDetailsSchema.safeParse(base).success).toBe(true));
  it('normalises a phone when given', () => {
    const r = personalDetailsSchema.safeParse({ ...base, phone: '+91 98765 43210' });
    expect(r.success && r.data.phone).toBe('9876543210');
  });
  it('rejects an invalid phone', () => expect(fields(personalDetailsSchema.safeParse({ ...base, phone: '123' }))).toEqual(['phone']));
  it('rejects a future birthday', () =>
    expect(fields(personalDetailsSchema.safeParse({ ...base, date_of_birth: '2999-01-01' }))).toEqual(['date_of_birth']));
  it('turns empty phone and birthday into null', () => {
    const r = personalDetailsSchema.safeParse(base);
    expect(r.success && [r.data.phone, r.data.date_of_birth]).toEqual([null, null]);
  });
});
