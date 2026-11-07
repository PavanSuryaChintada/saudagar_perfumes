import { describe, expect, it } from 'vitest';
import { codCollectable, isForward, isPincode, mapDelhiveryStatus, parcel, trackingUrl } from './core';

const box = { packaging_g: 150, default_item_g: 300, length_mm: 200, width_mm: 150, height_mm: 100 };

describe('parcel', () => {
  it('adds item weights, defaults and packaging', () => {
    expect(parcel([{ qty: 2, weight_g: 250 }, { qty: 1, weight_g: null }], box).weight_g).toBe(250 * 2 + 300 + 150);
  });
  it('uses the largest item box, else the default box', () => {
    expect(parcel([{ qty: 1, weight_g: 100, length_mm: 100, width_mm: 100, height_mm: 100 }, { qty: 1, weight_g: 100, length_mm: 300, width_mm: 200, height_mm: 120 }], box).length_mm).toBe(300);
    expect(parcel([{ qty: 1, weight_g: 100 }], box).length_mm).toBe(200);
  });
});

describe('codCollectable', () => {
  it('collects the total on unpaid COD', () => expect(codCollectable({ payment_method: 'COD', payment_status: 'PENDING', total: 2499 })).toBe(2499));
  it('collects nothing on paid orders', () => expect(codCollectable({ payment_method: 'ONLINE', payment_status: 'PAID', total: 2499 })).toBe(0));
});

describe('trackingUrl', () => {
  it('fills {awb}', () => expect(trackingUrl('https://www.delhivery.com/track/package/{awb}', 'AB 12')).toBe('https://www.delhivery.com/track/package/AB%2012'));
  it('keeps a template without {awb}', () => expect(trackingUrl('https://www.indiapost.gov.in/track', 'EK1IN')).toBe('https://www.indiapost.gov.in/track'));
  it('refuses non-web templates', () => expect(trackingUrl('javascript:alert(1)', 'x')).toBeNull());
});

describe('mapDelhiveryStatus', () => {
  it('maps the main events', () => {
    expect(mapDelhiveryStatus('In Transit', 'UD')).toBe('SHIPPED');
    expect(mapDelhiveryStatus('Dispatched', 'UD')).toBe('OUT_FOR_DELIVERY');
    expect(mapDelhiveryStatus('Delivered', 'DL')).toBe('DELIVERED');
    expect(mapDelhiveryStatus('RTO In Transit', 'RT')).toBe('RTO');
    expect(mapDelhiveryStatus('Something new', 'XX')).toBeNull();
  });
});

describe('helpers', () => {
  it('checks pincodes', () => {
    expect(isPincode('520001')).toBe(true);
    expect(isPincode('020001')).toBe(false);
  });
  it('never moves backwards', () => {
    expect(isForward('SHIPPED', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(isForward('DELIVERED', 'SHIPPED')).toBe(false);
  });
});
