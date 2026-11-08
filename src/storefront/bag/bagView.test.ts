import { describe, expect, it } from 'vitest';
import { bagProductIds, looseProblems } from './bagView';

describe('bag view helpers', () => {
  const quote = {
    lines: [
      { variant_id: 'v1', product_id: 'p1' },
      { kind: 'gift_pack', key: 'k1', variant_id: 'box', product_id: 'pack', picks: [{ product_id: 'p2' }, { product_id: 'p3' }, { product_id: 'p2' }] },
    ],
    problems: [
      { variant_id: 'v1', message: 'size' },
      { key: 'k1', variant_id: 'box', message: 'pack' },
      { name: 'Oud', message: 'Only 40 ml of Oud is left' },
    ],
  };
  const bag = [{ variantId: 'v1', quantity: 1 }, { packKey: 'k1', packPicks: ['p2', 'p3', 'p2'], quantity: 1 }];

  it('lists problems that belong to no single line, so the customer always sees why checkout is blocked', () => {
    expect(looseProblems(quote, bag).map((p) => p.message)).toEqual(['Only 40 ml of Oud is left']);
    expect(looseProblems(undefined, bag)).toEqual([]);
  });

  it('collects every perfume in the bag, pack contents included, without the pack box', () => {
    expect(bagProductIds(quote)).toEqual(['p1', 'p2', 'p3']);
  });
});
