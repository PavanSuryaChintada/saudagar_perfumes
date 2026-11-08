import { describe, expect, it } from 'vitest';
import { packContentsText, splitOrderLines } from './orderLines';

describe('order lines', () => {
  const lines = [
    { id: 's1', line_type: 'sample', parent_item_id: null, product_name: 'Rose', qty: 1, position: 4 },
    { id: 'p', line_type: 'item', parent_item_id: null, product_name: 'Premium Gift Pack', qty: 1, position: 1 },
    { id: 'a', line_type: 'item', parent_item_id: null, product_name: 'Amber', qty: 2, position: 0 },
    { id: 'c1', line_type: 'pack_item', parent_item_id: 'p', product_name: 'Musk', qty: 2, position: 3 },
    { id: 'c2', line_type: 'pack_item', parent_item_id: 'p', product_name: 'Oud', qty: 3, position: 2 },
    { id: 's2', line_type: 'sample', parent_item_id: 'p', product_name: 'Vetiver', qty: 1, position: 5 },
  ];

  it('puts each pack’s perfumes and free sample under it, in order, and keeps other samples apart', () => {
    const { items, samples } = splitOrderLines(lines);
    expect(items.map((i) => i.id)).toEqual(['a', 'p']);
    expect(items[1].contents.map((c) => c.id)).toEqual(['c2', 'c1']);
    expect(items[1].packSample?.id).toBe('s2');
    expect(items[0].contents).toEqual([]);
    expect(samples.map((s) => s.id)).toEqual(['s1']);
  });

  it('describes a pack in one line', () => {
    const { items } = splitOrderLines(lines);
    expect(packContentsText(items[1])).toBe('Oud × 3, Musk × 2');
    expect(packContentsText(items[0])).toBe('');
  });

  it('copes with orders from before gift packs', () => {
    const { items, samples } = splitOrderLines([{ id: 'x', line_type: 'item', product_name: 'Amber', qty: 1, position: 0 }]);
    expect(items).toHaveLength(1);
    expect(samples).toEqual([]);
    expect(splitOrderLines(undefined).items).toEqual([]);
  });
});
