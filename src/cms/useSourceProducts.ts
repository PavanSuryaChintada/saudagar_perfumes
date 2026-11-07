import { useLegacyProducts, useProductsBySlugs } from '../storefront/catalog/hooks';
import { sourceToSearchPayload, type ProductSource } from './sources';

/** Products for a CMS product source; hand-picked products keep the order the admin chose. */
export function useSourceProducts(source: ProductSource | null | undefined) {
  const manual = source?.mode === 'manual';
  const picked = useProductsBySlugs(manual ? source?.products ?? [] : []);
  const searched = useLegacyProducts(sourceToSearchPayload(source), !manual);
  return manual ? { products: picked.products, isLoading: picked.isLoading } : { products: searched.products, isLoading: searched.isLoading };
}
