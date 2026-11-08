import { describe, expect, it } from 'vitest';
import { pixelEvent } from './analytics';

describe('Meta Pixel events', () => {
  it('maps shop events to the standard Pixel events with value and currency', () => {
    expect(pixelEvent('purchase', { value: 4900, transaction_id: 'SAU-1' })).toEqual(['Purchase', { value: 4900, currency: 'INR' }]);
    expect(pixelEvent('add_to_cart', { value: 1200, items: [{ item_id: 'p1' }] })).toEqual(['AddToCart', { value: 1200, currency: 'INR', content_ids: ['p1'], content_type: 'product' }]);
    expect(pixelEvent('begin_checkout', { value: 10 })?.[0]).toBe('InitiateCheckout');
    expect(pixelEvent('view_item', { items: [{ item_id: 'amber' }] })?.[0]).toBe('ViewContent');
    expect(pixelEvent('search', { search_term: 'oud' })).toEqual(['Search', { search_string: 'oud' }]);
    expect(pixelEvent('page_view', {})).toEqual(['PageView', {}]);
  });

  it('ignores events the Pixel has no match for', () => {
    expect(pixelEvent('add_payment_info' as never, {})?.[0]).toBe('AddPaymentInfo');
    expect(pixelEvent('unknown' as never, {})).toBeNull();
  });
});
