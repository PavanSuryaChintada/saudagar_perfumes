import { describe, expect, it } from 'vitest';
import { canPick, fillPackText, groupPicks, packEstimate } from './packMath';

const opts = {
  count: 5,
  size_ml: 20,
  sample_ml: 10,
  discount_percent: 10,
  perfumes: [
    { product_id: 'a', price: 1000, max_picks: 3 },
    { product_id: 'b', price: 600, max_picks: 10 },
  ],
};

describe('gift pack maths', () => {
  it('adds up the picks and takes the pack discount off', () => {
    expect(packEstimate(opts, ['a', 'a', 'a', 'b', 'b'])).toEqual({ full: 4200, price: 3780, saved: 420 });
    expect(packEstimate({ ...opts, discount_percent: 0 }, ['b'])).toEqual({ full: 600, price: 600, saved: 0 });
    expect(packEstimate(opts, ['gone'])).toEqual({ full: 0, price: 0, saved: 0 });
  });

  it('allows a pick while the pack has room and the perfume has liquid for it', () => {
    expect(canPick(opts, ['a', 'a'], 'a')).toBe(true);
    expect(canPick(opts, ['a', 'a', 'a'], 'a')).toBe(false);
    expect(canPick(opts, ['b', 'b', 'b', 'b', 'b'], 'b')).toBe(false);
    expect(canPick(opts, [], 'missing')).toBe(false);
  });

  it('groups repeats for display', () => {
    expect(groupPicks([{ product_id: 'a', name: 'Amber' }, { product_id: 'b', name: 'Musk' }, { product_id: 'a', name: 'Amber' }])).toEqual([
      { product_id: 'a', name: 'Amber', n: 2 },
      { product_id: 'b', name: 'Musk', n: 1 },
    ]);
  });

  it('fills the rule numbers into the admin words', () => {
    expect(fillPackText('{count} perfumes, {size} ml each, plus a {sample} ml sample. Save {discount}%.', opts)).toBe(
      '5 perfumes, 20 ml each, plus a 10 ml sample. Save 10%.',
    );
    expect(fillPackText(undefined, opts)).toBe('');
  });
});
