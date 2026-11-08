import { describe, expect, it } from 'vitest';
import { columnToMobile, mobileToColumn, pickMedia } from './mobileMedia';

describe('pickMedia', () => {
  const config = { title: 'Hero', image: 'desk.jpg', image_mobile: 'phone.jpg', slides: [{ image: '', image_mobile: 'only-phone.jpg' }, { image: 'd2.jpg' }] };
  it('uses the phone picture on phones', () => {
    const out = pickMedia(config, true);
    expect(out.image).toBe('phone.jpg');
    expect(out.slides.map((s) => s.image)).toEqual(['only-phone.jpg', 'd2.jpg']);
  });
  it('keeps the desktop picture on desktop, falling back to the phone one when it is the only one', () => {
    const out = pickMedia(config, false);
    expect(out.image).toBe('desk.jpg');
    expect(out.slides[0].image).toBe('only-phone.jpg');
  });
  it('reads table rows that keep phone pictures in mobile_media', () => {
    expect(pickMedia({ image_url: 'a.jpg', mobile_media: { image_url: 'b.jpg' } }, true).image_url).toBe('b.jpg');
    expect(pickMedia({ image_url: 'a.jpg', mobile_media: {} }, true).image_url).toBe('a.jpg');
  });
  it('leaves non-objects alone', () => {
    expect(pickMedia(null, true)).toBeNull();
    expect(pickMedia('x', true)).toBe('x');
  });
});

describe('mobile_media column', () => {
  it('round-trips form keys and the column', () => {
    const col = mobileToColumn({ image_url_mobile: ' p.jpg ', thumbnail_url_mobile: '' }, ['image_url', 'thumbnail_url']);
    expect(col).toEqual({ image_url: 'p.jpg' });
    expect(columnToMobile({ mobile_media: col })).toEqual({ image_url_mobile: 'p.jpg' });
  });
});
