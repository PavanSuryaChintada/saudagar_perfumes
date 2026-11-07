import { describe, expect, it } from 'vitest';
import { hasText, sanitizeHtml } from './richText';

describe('sanitizeHtml', () => {
  it('keeps basic formatting', () => expect(sanitizeHtml('<p>Hi <strong>there</strong></p>')).toBe('<p>Hi <strong>there</strong></p>'));
  it('removes scripts and event handlers', () =>
    expect(sanitizeHtml('<p onclick="x()">Hi</p><script>alert(1)</script><img src=x onerror=alert(1)>')).toBe('<p>Hi</p>'));
  it('detects empty rich text', () => {
    expect(hasText('<p><br></p>')).toBe(false);
    expect(hasText('<p>Oud</p>')).toBe(true);
  });
});
