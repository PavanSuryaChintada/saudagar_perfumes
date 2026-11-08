import { describe, expect, it } from 'vitest';
import { safeNext } from './nav';

describe('safeNext', () => {
  it('keeps in-site paths with query strings', () => expect(safeNext('/account/orders?x=1', '/')).toBe('/account/orders?x=1'));
  it('blocks protocol-relative URLs', () => expect(safeNext('//evil.com', '/account')).toBe('/account'));
  it('blocks absolute URLs', () => expect(safeNext('https://evil.com', '/')).toBe('/'));
  it('blocks backslash tricks', () => expect(safeNext('/\\evil.com', '/')).toBe('/'));
  it('uses the fallback when missing', () => expect(safeNext(null, '/admin')).toBe('/admin'));
  it('blocks hidden tab and newline tricks that browsers strip into //evil.com', () => {
    expect(safeNext('/\t/evil.com', '/')).toBe('/');
    expect(safeNext('/\n/evil.com', '/')).toBe('/');
    expect(safeNext('/%09/evil.com', '/')).toBe('/');
    expect(safeNext('/%2F/evil.com', '/')).toBe('/');
  });
});
