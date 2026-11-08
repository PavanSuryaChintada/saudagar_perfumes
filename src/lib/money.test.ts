import { describe, expect, it } from 'vitest';
import { formatINR, formatRupees } from './money';

describe('formatINR', () => {
  it('shows the rupee sign with Indian digit grouping', () => {
    expect(formatINR(5500)).toBe('₹5,500');
    expect(formatINR(125000)).toBe('₹1,25,000');
  });

  it('rounds to whole rupees', () => {
    expect(formatINR(4999.6)).toBe('₹5,000');
  });

  it('formats zero', () => {
    expect(formatINR(0)).toBe('₹0');
  });

  it('matches formatRupees so every price on the site reads the same', () => {
    expect(formatINR(2899)).toBe(formatRupees(2899));
  });
});
