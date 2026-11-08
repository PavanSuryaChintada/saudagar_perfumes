import { describe, expect, it } from 'vitest';
import { markIntroSeen, shouldPlayIntro } from './intro';

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe('brand intro', () => {
  it('plays when a visitor first lands on the home page', () => {
    expect(shouldPlayIntro('home', true, memory())).toBe(true);
  });

  it('never plays on a page reached directly, so a shopper from Google sees the perfume at once', () => {
    for (const view of ['product', 'collection', 'listing', 'checkout', 'account', 'page']) {
      expect(shouldPlayIntro(view, true, memory())).toBe(false);
    }
  });

  it('plays only once per visit', () => {
    const store = memory();
    markIntroSeen(store);
    expect(shouldPlayIntro('home', true, store)).toBe(false);
  });

  it('stays off when the owner turned it off', () => {
    expect(shouldPlayIntro('home', false, memory())).toBe(false);
  });

  it('still plays when the browser blocks storage', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(shouldPlayIntro('home', true, blocked)).toBe(true);
    expect(() => markIntroSeen(blocked)).not.toThrow();
  });
});
