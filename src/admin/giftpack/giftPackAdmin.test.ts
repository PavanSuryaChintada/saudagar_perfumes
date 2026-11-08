import { describe, expect, it } from 'vitest';
import { GIFT_PACK_RULES, GIFT_PACK_WORDS, previewPack } from './giftPackAdmin';
import { parseSettingInput } from '../settings/schema';

const perfumes = [
  { product_id: 'a', name: 'Amber', price: 1000, base_price: 1500, max_picks: 9 },
  { product_id: 'b', name: 'Musk', price: 600, base_price: 900, max_picks: 9 },
];

describe('gift pack admin', () => {
  it('previews the price of the rules on screen, before they are saved', () => {
    const rules = { 'giftpack.count': '5', 'giftpack.price_percent': '66.67', 'giftpack.discount_percent': '10' };
    const p = previewPack(rules, perfumes);
    expect(p?.picks.map((x) => x.name)).toEqual(['Amber', 'Musk', 'Amber', 'Musk', 'Amber']);
    expect(p?.full).toBe(1000 * 3 + 600 * 2);
    expect(p?.price).toBe(3780);
    expect(previewPack({ ...rules, 'giftpack.price_percent': '50' }, perfumes)?.picks[0].price).toBe(750);
    expect(previewPack(rules, [])).toBeNull();
  });

  it('keeps every rule within safe limits', () => {
    const field = (k: string) => GIFT_PACK_RULES.find((f) => f.key === k)!;
    expect(parseSettingInput(field('giftpack.count'), '0').ok).toBe(false);
    expect(parseSettingInput(field('giftpack.size_ml'), '0').ok).toBe(false);
    expect(parseSettingInput(field('giftpack.discount_percent'), '95').ok).toBe(false);
    expect(parseSettingInput(field('giftpack.price_percent'), '66.67').ok).toBe(true);
    expect(parseSettingInput(field('giftpack.sample_ml'), '0').ok).toBe(true);
  });

  it('lets the admin edit every word customers read, and the picture', () => {
    const keys = GIFT_PACK_WORDS.map((f) => f.key);
    for (const k of ['title', 'tagline', 'intro', 'image', 'bag_heading', 'bag_text', 'bag_button', 'add_button', 'sample_note']) expect(keys).toContain(k);
  });
});
