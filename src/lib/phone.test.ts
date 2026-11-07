import { describe, expect, it } from 'vitest';
import { normalizeIndianPhone } from './phone';

describe('normalizeIndianPhone', () => {
  it('accepts +91 with spaces', () => expect(normalizeIndianPhone('+91 98765 43210')).toBe('9876543210'));
  it('accepts a leading 0 with dashes', () => expect(normalizeIndianPhone('098765-43210')).toBe('9876543210'));
  it('accepts a bare 10-digit mobile', () => expect(normalizeIndianPhone('9876543210')).toBe('9876543210'));
  it('rejects too-short numbers', () => expect(normalizeIndianPhone('12345')).toBeNull());
  it('rejects numbers not starting 6-9', () => expect(normalizeIndianPhone('5876543210')).toBeNull());
  it('rejects empty input', () => expect(normalizeIndianPhone('')).toBeNull());
});
