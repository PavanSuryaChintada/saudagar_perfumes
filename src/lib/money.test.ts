import { describe, expect, it } from 'vitest';
import { formatINR } from './money';

describe('formatINR', () => {
  it('formats with the existing RS. prefix and Indian digit grouping', () => {
    expect(formatINR(5500)).toBe('RS. 5,500');
    expect(formatINR(125000)).toBe('RS. 1,25,000');
  });

  it('rounds to whole rupees', () => {
    expect(formatINR(4999.6)).toBe('RS. 5,000');
  });

  it('formats zero', () => {
    expect(formatINR(0)).toBe('RS. 0');
  });
});
