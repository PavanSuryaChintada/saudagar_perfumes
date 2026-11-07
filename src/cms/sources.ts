// Where a product section gets its products from (chosen in the CMS).
export type SourceMode = 'collection' | 'category' | 'featured' | 'newest' | 'best_selling' | 'manual' | 'filter';
export interface ProductSource {
  mode: SourceMode;
  collection?: string;
  category?: string;
  products?: string[];
  attrs?: Record<string, string[]>;
  limit?: number;
}

const clamp = (n: number | undefined) => Math.min(48, Math.max(1, Math.round(n ?? 8)));

export function sourceToSearchPayload(src: ProductSource | null | undefined): Record<string, unknown> {
  const page_size = clamp(src?.limit);
  switch (src?.mode) {
    case 'collection':
      return src.collection ? { collection: src.collection, page_size, sort: 'featured' } : { featured: true, sort: 'featured', page_size };
    case 'category':
      return src.category ? { category: src.category, page_size, sort: 'featured' } : { featured: true, sort: 'featured', page_size };
    case 'manual': {
      const slugs = (src.products ?? []).filter(Boolean);
      return { slugs, page_size: clamp(slugs.length || 1) };
    }
    case 'filter':
      return { attrs: src.attrs ?? {}, page_size, sort: 'featured' };
    case 'newest':
      return { sort: 'newest', page_size };
    case 'best_selling':
      return { sort: 'best_selling', page_size };
    case 'featured':
    default:
      return { featured: true, sort: 'featured', page_size };
  }
}
