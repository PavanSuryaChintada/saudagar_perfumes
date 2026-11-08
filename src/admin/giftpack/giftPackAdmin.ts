// Admin → Gift pack: the rules (settings giftpack.*) and the words and picture (site block `gift_pack`).
import type { FieldDef } from '../../cms/schema';
import type { SettingField } from '../settings/schema';

export const GIFT_PACK_RULES: SettingField[] = [
  { key: 'giftpack.enabled', label: 'Offer the gift pack', type: 'boolean', help: 'Shows the gift pack page and the “Try our gift pack” card in the bag.' },
  { key: 'giftpack.count', label: 'Perfumes in a pack', type: 'number', min: 1, max: 12, suffix: 'perfumes', help: 'Customers choose this many. The same perfume can be chosen more than once.' },
  { key: 'giftpack.size_ml', label: 'Each perfume', type: 'number', min: 1, max: 100, decimals: true, suffix: 'ml', help: 'Poured from the perfume’s own stock when the order is placed.' },
  {
    key: 'giftpack.price_base_ml',
    label: 'Priced from the',
    type: 'number',
    min: 1,
    max: 1000,
    decimals: true,
    suffix: 'ml bottle',
    help: 'Only perfumes sold in this size can go in a pack, and each one is priced from its price at this size.',
  },
  { key: 'giftpack.price_percent', label: 'Each perfume costs', type: 'number', min: 0, max: 1000, decimals: true, suffix: '% of that price', help: 'e.g. 66.67 makes a ₹1,500 bottle cost ₹1,000 in the pack.' },
  { key: 'giftpack.discount_percent', label: 'Pack discount', type: 'number', min: 0, max: 90, decimals: true, suffix: '% off the pack', help: 'Taken off the pack total. 0 means no discount.' },
  { key: 'giftpack.sample_ml', label: 'Free sample in every pack', type: 'number', min: 0, max: 100, decimals: true, suffix: 'ml', help: 'One sample, chosen like “Surprise me” and never one of the pack’s perfumes. 0 means no sample.' },
];

const t = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: 'text', help });

export const GIFT_PACK_WORDS: FieldDef[] = [
  t('title', 'Pack name', 'e.g. Premium Gift Pack'),
  t('tagline', 'Short line under the name', 'e.g. {count} perfumes of your choice, {size} ml each, in one gift box.'),
  { key: 'intro', label: 'Instructions on the pack page', type: 'textarea', help: 'e.g. Pick any {count} perfumes. Choose the same one more than once if you like.' },
  { key: 'image', label: 'Pack picture', type: 'media', accept: 'image', help: 'Shown on the pack page and in the bag. A square photo of the box works best.' },
  t('add_button', 'Add to bag button', 'e.g. Add the pack to bag'),
  t('sample_note', 'Free sample line', 'e.g. A free {sample} ml sample comes with every pack.'),
  t('bag_heading', 'Bag card heading', 'Shown in the bag until a pack is added, e.g. Try our Premium Gift Pack'),
  t('bag_text', 'Bag card text', 'e.g. {count} perfumes of your choice, {size} ml each, in one gift box.'),
  t('bag_button', 'Bag card button', 'e.g. Build your pack'),
];

export const GIFT_PACK_WORD_DEFAULTS: Record<string, string> = {
  title: 'Premium Gift Pack',
  tagline: '{count} perfumes of your choice, {size} ml each, in one gift box.',
  intro: 'Pick any {count} perfumes. Choose the same one more than once if you like.',
  image: '',
  add_button: 'Add the pack to bag',
  sample_note: 'A free {sample} ml sample comes with every pack.',
  bag_heading: 'Try our Premium Gift Pack',
  bag_text: '{count} perfumes of your choice, {size} ml each, in one gift box.',
  bag_button: 'Build your pack',
};

interface PreviewPerfume {
  name: string;
  base_price?: number;
}

/** The price of a pack made from the first perfumes (repeating them if there are fewer), using the rules on screen. */
export function previewPack(rules: Record<string, unknown>, perfumes: PreviewPerfume[]) {
  const usable = perfumes.filter((p) => Number(p.base_price) > 0);
  if (!usable.length) return null;
  const count = Math.max(1, Math.round(Number(rules['giftpack.count']) || 1));
  const pct = Math.max(0, Number(rules['giftpack.price_percent']) || 0);
  const discount = Math.min(90, Math.max(0, Number(rules['giftpack.discount_percent']) || 0));
  const picks = Array.from({ length: count }, (_, i) => {
    const p = usable[i % usable.length];
    return { name: p.name, price: Math.round((Number(p.base_price) * pct) / 100) };
  });
  const full = picks.reduce((s, p) => s + p.price, 0);
  const price = Math.round((full * (100 - discount)) / 100);
  return { picks, full, price, saved: full - price };
}
