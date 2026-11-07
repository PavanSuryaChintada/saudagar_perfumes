import { describe, expect, it } from 'vitest';
import { allowedNextStatuses, paymentLabel } from './orders';

describe('paymentLabel', () => {
  it('shows the amount due on an open COD order', () => {
    expect(paymentLabel({ payment_method: 'COD', payment_status: 'PENDING', total: 2499, status: 'PENDING' })).toMatch(/^Cash on delivery · ₹2,499 due$/);
  });
  it('says nothing is due on a cancelled COD order', () => {
    expect(paymentLabel({ payment_method: 'COD', payment_status: 'PENDING', total: 2499, status: 'CANCELLED' })).toBe('Cash on delivery · nothing due');
  });
  it('marks delivered COD as cash collected', () => {
    expect(paymentLabel({ payment_method: 'COD', payment_status: 'PAID', total: 10 })).toBe('Paid (cash collected)');
  });
  it('covers online states', () => {
    expect(paymentLabel({ payment_method: 'ONLINE', payment_status: 'PENDING', total: 10 })).toBe('Awaiting payment');
    expect(paymentLabel({ payment_method: 'ONLINE', payment_status: 'PAID', total: 10 })).toBe('Paid');
    expect(paymentLabel({ payment_method: 'ONLINE', payment_status: 'FAILED', total: 10 })).toBe('Payment failed');
    expect(paymentLabel({ payment_method: 'ONLINE', payment_status: 'REFUNDED', total: 10 })).toBe('Refunded');
  });
});

describe('allowedNextStatuses', () => {
  it('lets COD orders be packed straight away', () => {
    expect(allowedNextStatuses('PENDING', 'COD', 'PENDING')).toEqual(['PACKED', 'CANCELLED']);
  });
  it('holds unpaid online orders', () => {
    expect(allowedNextStatuses('PENDING', 'ONLINE', 'PENDING')).toEqual(['CANCELLED']);
  });
  it('sends shipped parcels to delivered or RTO, never cancelled', () => {
    expect(allowedNextStatuses('SHIPPED', 'COD', 'PENDING')).not.toContain('CANCELLED');
  });
  it('ends at delivered', () => {
    expect(allowedNextStatuses('DELIVERED', 'COD', 'PAID')).toEqual([]);
  });
});
