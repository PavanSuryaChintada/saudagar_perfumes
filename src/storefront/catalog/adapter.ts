import type { LegacyProduct, NoteRef, ProductCard, ProductDetail } from './types';

export const PLACEHOLDER_IMAGE = '/images/crystal_square_flacon.png';

const noteNames = (list: (string | NoteRef)[] | undefined): string[] =>
  (list ?? []).map((n) => (typeof n === 'string' ? n : n.name)).filter(Boolean);

/** Maps a catalog RPC card or detail onto the product shape the existing storefront components render. */
export function toLegacyProduct(card: ProductCard | ProductDetail): LegacyProduct {
  const images = card.images && card.images.length > 0 ? card.images : [PLACEHOLDER_IMAGE];
  const sizes = (card.sizes ?? []).map((s) => ({
    ml: s.ml,
    label: s.label,
    price: s.price,
    compareAt: s.compare_at,
    variantId: s.variant_id,
    stock: s.stock,
  }));
  const notes = card.notes as { top?: (string | NoteRef)[]; heart?: (string | NoteRef)[]; base?: (string | NoteRef)[] };
  return {
    id: card.slug,
    slug: card.slug,
    name: card.name,
    category: card.category ?? card.concentration ?? '',
    collection: card.collections?.[0]?.name ?? '',
    price: card.min_price ?? card.base_price,
    compareAtPrice: card.compare_at ?? null,
    badge: card.badge,
    rating: card.rating_count > 0 ? Number(card.rating_avg) : 0,
    reviewsCount: card.rating_count ?? 0,
    images,
    image: images[0],
    video: card.video ?? null,
    sizes,
    notes: { top: noteNames(notes?.top), heart: noteNames(notes?.heart), base: noteNames(notes?.base) },
    description: card.short_description ?? '',
    concentration: card.concentration_note ?? card.concentration ?? '',
    family: card.family ?? null,
    inStock: (card.total_stock ?? 0) > 0,
    totalStock: card.total_stock ?? 0,
  };
}
