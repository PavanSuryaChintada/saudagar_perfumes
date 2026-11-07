import { describe, expect, it } from 'vitest';
import { buildStoragePath, fitWithin, validateUpload, IMAGE_TYPES, VIDEO_TYPES, MAX_UPLOAD_BYTES } from './upload';

describe('fitWithin', () => {
  it('scales the long edge down to the max, keeping aspect ratio', () => {
    expect(fitWithin(4800, 3200)).toEqual({ width: 2400, height: 1600 });
    expect(fitWithin(1000, 5000, 2500)).toEqual({ width: 500, height: 2500 });
  });
  it('leaves small images alone', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe('validateUpload', () => {
  const opts = { maxBytes: MAX_UPLOAD_BYTES, accept: [...IMAGE_TYPES, ...VIDEO_TYPES] };
  it('refuses files over the plan limit with the limit in the message', () => {
    expect(validateUpload({ size: 60 * 1024 * 1024, type: 'video/mp4' }, opts)).toMatch(/50 MB/);
  });
  it('refuses types the browser cannot handle, naming what to use', () => {
    expect(validateUpload({ size: 1000, type: 'image/heic' }, opts)).toMatch(/Use JPG, PNG, WebP/);
  });
  it('accepts a normal image', () => {
    expect(validateUpload({ size: 200_000, type: 'image/png' }, opts)).toBeNull();
  });
});

describe('buildStoragePath', () => {
  it('slugs the name, buckets by year/month and kind', () => {
    expect(buildStoragePath('Deep Canopy Hero!.PNG', 'webp', new Date('2026-11-07T10:00:00Z'), 'ab12'))
      .toBe('images/2026/11/deep-canopy-hero-ab12.webp');
  });
  it('puts videos under videos/', () => {
    expect(buildStoragePath('Palace Film.mov', 'mov', new Date('2026-01-31T20:00:00Z'), 'zz99'))
      .toBe('videos/2026/02/palace-film-zz99.mov');
  });
});
