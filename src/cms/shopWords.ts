// The fixed wording around the shop (bag, buttons, empty pages, checkout), editable in Admin → Site content →
// Shop words. Anything left empty falls back to the wording below.
import { useMemo } from 'react';
import { useBlock } from './useSite';

export const SHOP_WORD_FIELDS: { key: string; label: string; fallback: string }[] = [
  { key: 'bag_title', label: 'Bag: heading', fallback: 'Your Shopping Bag' },
  { key: 'bag_empty_title', label: 'Bag: heading when empty', fallback: 'Your Bag is Currently Empty' },
  { key: 'bag_empty_text', label: 'Bag: text when empty', fallback: 'Explore our royal collection of extraits, rare attars, and bespoke crystal flacons.' },
  { key: 'bag_empty_button', label: 'Bag: button when empty', fallback: 'Continue Browsing' },
  { key: 'bag_free_delivery_done', label: 'Bag: free delivery reached', fallback: 'You’ve unlocked free delivery' },
  { key: 'bag_note_button', label: 'Bag: note link', fallback: 'Add a note for us' },
  { key: 'bag_checkout_button', label: 'Bag: checkout button', fallback: 'Proceed to Checkout' },
  { key: 'bag_small_print', label: 'Bag: small print under the total', fallback: 'Prices include GST. Cash on delivery across India.' },
  { key: 'add_to_bag', label: 'Product page: add to bag button', fallback: 'Add to bag' },
  { key: 'sold_out', label: 'Product page: sold out', fallback: 'Sold out' },
  { key: 'in_stock', label: 'Product page: in stock', fallback: 'In stock' },
  { key: 'vegan', label: 'Product page: vegan', fallback: 'Vegan' },
  { key: 'cruelty_free', label: 'Product page: cruelty free', fallback: 'Cruelty Free' },
  { key: 'checkout_terms', label: 'Checkout: line under the order button', fallback: 'By placing the order you agree to our terms and policies.' },
  { key: 'wishlist_eyebrow', label: 'Wishlist: small heading', fallback: 'Your Private Selection' },
  { key: 'wishlist_title', label: 'Wishlist: page title', fallback: 'Saved Fragrances' },
  { key: 'wishlist_empty_title', label: 'Wishlist: heading when empty', fallback: 'Your wishlist is waiting for its first scent.' },
  { key: 'wishlist_empty_text', label: 'Wishlist: text when empty', fallback: 'Tap the bookmark on any fragrance to save it here, and return whenever you are ready to choose.' },
  { key: 'wishlist_empty_button', label: 'Wishlist: button when empty', fallback: 'Explore Collections' },
  { key: 'notes_eyebrow', label: 'Notes page: small heading', fallback: 'The Library' },
  { key: 'notes_title', label: 'Notes page: title', fallback: 'Fragrance Notes' },
  { key: 'notes_text', label: 'Notes page: text', fallback: 'Explore by ingredient. Each note leads to every Saudagar creation that carries it.' },
  { key: 'notfound_eyebrow', label: 'Page not found: small heading', fallback: 'Error 404' },
  { key: 'notfound_title', label: 'Page not found: title', fallback: 'This page has evaporated' },
  { key: 'notfound_text', label: 'Page not found: text', fallback: 'The link may be old, or the fragrance may have moved. Let us take you somewhere familiar.' },
  { key: 'notfound_home', label: 'Page not found: home button', fallback: 'Back to home' },
  { key: 'notfound_shop', label: 'Page not found: shop button', fallback: 'Explore fragrances' },
];

export type ShopWords = Record<string, string>;

export function withShopWords(saved: Record<string, unknown> | null | undefined): ShopWords {
  const out: ShopWords = {};
  for (const f of SHOP_WORD_FIELDS) {
    const v = saved?.[f.key];
    out[f.key] = typeof v === 'string' && v.trim() ? v : f.fallback;
  }
  return out;
}

export function useShopWords(): ShopWords {
  const saved = useBlock<Record<string, unknown>>('shop_words');
  return useMemo(() => withShopWords(saved), [saved]);
}
