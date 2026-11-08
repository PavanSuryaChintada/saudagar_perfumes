import { describe, expect, it } from 'vitest';
import { addToBag, bagCount, fromSavedItems, hasPack, lineKey, mergeBags, problemForLine, quoteLineFor, toQuoteItems, toSavedItems } from './bagLines';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const P1 = '33333333-3333-4333-8333-333333333333';
const P2 = '44444444-4444-4444-8444-444444444444';

describe('bag lines', () => {
  it('adds sizes by merging quantities, but every gift pack stays its own line', () => {
    let bag = addToBag([], { variantId: A, quantity: 1, name: 'Amber' });
    bag = addToBag(bag, { variantId: A, quantity: 2 });
    bag = addToBag(bag, { packKey: 'k1', packPicks: [P1, P1, P2, P2, P2], quantity: 1 });
    bag = addToBag(bag, { packKey: 'k2', packPicks: [P1, P1, P1, P1, P1], quantity: 5 });
    expect(bag).toHaveLength(3);
    expect(bag[0].quantity).toBe(3);
    expect(bag[2].quantity).toBe(1);
    expect(bagCount(bag)).toBe(5);
    expect(hasPack(bag)).toBe(true);
    expect(hasPack(bag.slice(0, 1))).toBe(false);
  });

  it('sends sizes as variant and quantity, and packs as their key and picks', () => {
    const bag = [
      { variantId: A, quantity: 120 },
      { packKey: 'k1', packPicks: [P1, P2], quantity: 1 },
      { variantId: '', quantity: 1 },
      { packKey: 'k3', packPicks: [], quantity: 1 },
    ];
    expect(toQuoteItems(bag)).toEqual([
      { variant_id: A, qty: 99 },
      { key: 'k1', picks: [P1, P2] },
    ]);
  });

  it('finds the quote line and problem for each bag line', () => {
    const quote = {
      lines: [{ variant_id: A }, { kind: 'gift_pack', key: 'k1', variant_id: B }],
      problems: [{ key: 'k2', variant_id: B, message: 'pack problem' }, { variant_id: A, message: 'size problem' }],
    };
    expect(quoteLineFor(quote, { packKey: 'k1', packPicks: [P1], quantity: 1 })).toBe(quote.lines[1]);
    expect(quoteLineFor(quote, { variantId: A, quantity: 1 })).toBe(quote.lines[0]);
    expect(problemForLine(quote, { packKey: 'k2', packPicks: [P1], quantity: 1 })?.message).toBe('pack problem');
    expect(problemForLine(quote, { variantId: A, quantity: 1 })?.message).toBe('size problem');
    // A pack problem never lands on a size line that happens to share the pack's box variant.
    expect(problemForLine(quote, { variantId: B, quantity: 1 })).toBeUndefined();
  });

  it('saves and restores packs in the saved bag', () => {
    const bag = [
      { variantId: A, quantity: 2, name: 'Amber', image: 'a.jpg', price: 100, size: '30 ml', productId: 'pa', slug: 'amber' },
      { packKey: 'k1', packPicks: [P1, P2], quantity: 1, name: 'Premium Gift Pack' },
    ];
    const saved = toSavedItems(bag);
    expect(saved[1]).toEqual({ key: 'k1', picks: [P1, P2], meta: { name: 'Premium Gift Pack', image: undefined, price: undefined } });
    expect(fromSavedItems(saved)).toEqual([
      { name: 'Amber', image: 'a.jpg', price: 100, size: '30 ml', productId: 'pa', slug: 'amber', variantId: A, quantity: 2 },
      { name: 'Premium Gift Pack', image: undefined, price: undefined, packKey: 'k1', packPicks: [P1, P2], quantity: 1 },
    ]);
    expect(fromSavedItems([{ junk: true }, null, { variant_id: A, qty: 0 }])).toEqual([{ variantId: A, quantity: 1 }]);
  });

  it('merges the saved bag with this device: largest quantity per size, every pack once', () => {
    const saved = [{ variantId: A, quantity: 1 }, { packKey: 'k1', packPicks: [P1], quantity: 1 }];
    const device = [{ variantId: A, quantity: 3 }, { variantId: B, quantity: 1 }, { packKey: 'k1', packPicks: [P1], quantity: 1 }, { packKey: 'k2', packPicks: [P2], quantity: 1 }];
    const merged = mergeBags(saved, device);
    expect(merged.map(lineKey)).toEqual([`v:${A}`, 'pack:k1', `v:${B}`, 'pack:k2']);
    expect(merged[0].quantity).toBe(3);
  });
});
