import { describe, expect, it } from 'vitest';
import { SHOP_WORD_FIELDS, withShopWords } from './shopWords';
import { BLOCK_SCHEMAS } from '../admin/cms/blocks';

describe('shop words', () => {
  it('uses the admin’s words and falls back for anything left empty', () => {
    const w = withShopWords({ bag_title: 'My bag', add_to_bag: '   ' });
    expect(w.bag_title).toBe('My bag');
    expect(w.add_to_bag).toBe('Add to bag');
    expect(withShopWords(null).sold_out).toBe('Sold out');
  });

  it('every word is editable in Site content, with the current wording as its example', () => {
    const fields = BLOCK_SCHEMAS.shop_words.fields;
    expect(fields.map((f) => f.key)).toEqual(SHOP_WORD_FIELDS.map((f) => f.key));
    expect(fields.every((f) => f.help?.includes(SHOP_WORD_FIELDS.find((x) => x.key === f.key)!.fallback))).toBe(true);
  });
});
