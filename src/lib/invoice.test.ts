import { describe, expect, it } from 'vitest';
import { buildInvoiceLines, isIntraState, rupeesInWords } from './invoice';

describe('buildInvoiceLines', () => {
  it('splits GST out of an inclusive price', () => {
    const [l] = buildInvoiceLines([{ name: 'A', hsn: '3303', qty: 1, lineTotal: 1180, gstRate: 18 }], 0);
    expect(l.taxable).toBe(1000);
    expect(l.tax).toBe(180);
  });

  it('spreads the discount by line value and keeps the total exact', () => {
    const lines = buildInvoiceLines(
      [
        { name: 'A', hsn: null, qty: 1, lineTotal: 3000, gstRate: 18 },
        { name: 'B', hsn: null, qty: 1, lineTotal: 1000, gstRate: 18 },
      ],
      401,
    );
    expect(lines[0].discount + lines[1].discount).toBeCloseTo(401, 2);
    expect(lines[0].total + lines[1].total).toBeCloseTo(3599, 2);
  });
});

describe('isIntraState', () => {
  it('matches states regardless of case', () => expect(isIntraState('Andhra Pradesh', 'andhra pradesh ')).toBe(true));
  it('treats an unknown seller state as inter-state', () => expect(isIntraState('', 'Delhi')).toBe(false));
});

describe('rupeesInWords', () => {
  it('uses the Indian system', () => expect(rupeesInWords(125000)).toBe('Rupees One Lakh Twenty Five Thousand Only'));
  it('handles paise', () => expect(rupeesInWords(2499.5)).toBe('Rupees Two Thousand Four Hundred Ninety Nine and Fifty Paise Only'));
  it('handles crores', () => expect(rupeesInWords(10000001)).toBe('Rupees One Crore One Only'));
});
