// Shapes returned by the catalog RPCs (supabase/migrations/0005_catalog_reads.sql).

export interface CardSize {
  variant_id: string;
  sku: string;
  ml: number | null;
  label: string;
  price: number;
  compare_at: number | null;
  stock: number;
}

export interface NoteRef {
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
}

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  badge: string | null;
  base_price: number;
  min_price: number;
  max_price: number;
  compare_at: number | null;
  images: string[];
  video: string | null;
  sizes: CardSize[];
  notes: { top: string[]; heart: string[]; base: string[] };
  concentration: string | null;
  concentration_note: string | null;
  family: string | null;
  category: string | null;
  category_slug: string | null;
  collections: { slug: string; name: string }[];
  rating_avg: number;
  rating_count: number;
  total_stock: number;
  is_featured: boolean;
  counts_toward_samples: boolean;
  created_at: string;
}

export interface AttributeRef {
  label: string;
  slug: string;
  description: string | null;
  badge: string | null;
  strength: number | null;
  is_primary: boolean;
}

export interface ProductDetail extends Omit<ProductCard, 'notes'> {
  description: string | null;
  perfumer: string | null;
  launch_year: number | null;
  inspiration: string | null;
  how_to_wear: string | null;
  ships_surface_only: boolean;
  seo_title: string | null;
  seo_description: string | null;
  compliance: Record<string, string | number | null>;
  media: { kind: 'image' | 'video'; url: string; alt: string | null; variant_id: string | null }[];
  notes: { top: NoteRef[]; heart: NoteRef[]; base: NoteRef[] };
  attributes: Record<string, AttributeRef[]>;
  categories: { slug: string; name: string }[];
}

export interface SearchResult {
  items: ProductCard[];
  total: number;
  page: number;
  page_size: number;
  facets: Record<string, Record<string, number>>;
}

export interface CatalogFilters {
  categories: { id: string; slug: string; name: string; parent_id: string | null }[];
  collections: { slug: string; name: string }[];
  notes: { slug: string; name: string; image: string | null; family: string | null }[];
  options: Record<string, { slug: string; label: string; description: string | null; badge: string | null }[]>;
  price: { min: number | null; max: number | null } | null;
  sizes: number[];
}

export interface CollectionInfo {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  headline: string | null;
  tagline: string | null;
  descriptor: string | null;
  notes_subtitle: string | null;
  image_url: string | null;
  hero_video_url: string | null;
  hero_poster_url: string | null;
  hero_badge: string | null;
  hero_title: string | null;
  hero_tagline: string | null;
  hero_subtext: string | null;
  hero_accent_tag: string | null;
  aliases: string[];
  position: number;
}

/** The product shape the original storefront components were written against. */
export interface LegacyProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  collection: string;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  rating: number;
  reviewsCount: number;
  images: string[];
  image: string;
  video: string | null;
  sizes: { ml: number | null; label: string; price: number; compareAt: number | null; variantId: string; stock: number }[];
  notes: { top: string[]; heart: string[]; base: string[] };
  description: string;
  concentration: string;
  family: string | null;
  inStock: boolean;
  totalStock: number;
}
