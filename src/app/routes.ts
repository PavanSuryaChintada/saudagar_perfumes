export type StorefrontView =
  | 'home'
  | 'product'
  | 'collection'
  | 'listing'
  | 'notes'
  | 'page'
  | 'wishlist'
  | 'story'
  | 'account'
  | 'checkout'
  | 'order'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'notfound';

export interface ListingRoute {
  kind: 'shop' | 'category' | 'note' | 'search';
  slug?: string;
}

export interface ResolvedView {
  view: StorefrontView;
  productId?: string;
  collectionSlug?: string;
  listing?: ListingRoute;
  pageSlug?: string;
  orderId?: string;
  redirectTo?: string;
}

export const AUTH_VIEWS: StorefrontView[] = ['login', 'register', 'forgot-password', 'reset-password'];

const EXACT: Record<string, StorefrontView> = {
  '/': 'home',
  '/wishlist': 'wishlist',
  '/story': 'story',
  '/about': 'story',
  '/checkout': 'checkout',
  '/notes': 'notes',
  '/login': 'login',
  '/register': 'register',
  '/forgot-password': 'forgot-password',
  '/reset-password': 'reset-password',
};

const tail = (path: string, prefix: string) => decodeURIComponent(path.slice(prefix.length));

/** Maps a URL onto the storefront's view switch. Pure, so routing rules are unit-tested. */
export function resolveStorefrontView(pathname: string, search: string): ResolvedView {
  const params = new URLSearchParams(search);
  const legacyId = params.get('id');
  const legacyCollection = params.get('collection');
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;

  if (path === '/' && legacyId) return { view: 'home', redirectTo: `/product/${encodeURIComponent(legacyId)}` };
  if (path === '/' && legacyCollection) return { view: 'home', redirectTo: `/collections/${encodeURIComponent(legacyCollection)}` };

  if (path.startsWith('/product/')) return { view: 'product', productId: tail(path, '/product/') };
  if (path === '/collections' || path.startsWith('/collections/')) {
    return { view: 'collection', collectionSlug: tail(path, '/collections/') || 'signature' };
  }
  if (path === '/shop') return { view: 'listing', listing: { kind: 'shop' } };
  if (path === '/search') return { view: 'listing', listing: { kind: 'search' } };
  if (path.startsWith('/categories/')) return { view: 'listing', listing: { kind: 'category', slug: tail(path, '/categories/') } };
  if (path.startsWith('/pages/')) return { view: 'page', pageSlug: tail(path, '/pages/') };
  if (path.startsWith('/notes/')) return { view: 'listing', listing: { kind: 'note', slug: tail(path, '/notes/') } };
  if (path === '/account' || path.startsWith('/account/') || path === '/profile') return { view: 'account' };
  if (path.startsWith('/orders/')) return { view: 'order', orderId: tail(path, '/orders/') };

  const exact = EXACT[path];
  return exact ? { view: exact } : { view: 'notfound' };
}
