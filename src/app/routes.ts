export type StorefrontView =
  | 'home'
  | 'product'
  | 'collection'
  | 'wishlist'
  | 'story'
  | 'account'
  | 'checkout'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'notfound';

export interface ResolvedView {
  view: StorefrontView;
  productId?: string;
  collectionSlug?: string;
  redirectTo?: string;
}

export const AUTH_VIEWS: StorefrontView[] = ['login', 'register', 'forgot-password', 'reset-password'];

const EXACT: Record<string, StorefrontView> = {
  '/': 'home',
  '/wishlist': 'wishlist',
  '/story': 'story',
  '/about': 'story',
  '/checkout': 'checkout',
  '/login': 'login',
  '/register': 'register',
  '/forgot-password': 'forgot-password',
  '/reset-password': 'reset-password',
};

/** Maps a URL onto the storefront's existing view switch. Pure, so routing rules are unit-tested. */
export function resolveStorefrontView(pathname: string, search: string, productExists: (id: string) => boolean): ResolvedView {
  const params = new URLSearchParams(search);
  const legacyId = params.get('id');
  const legacyCollection = params.get('collection');
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;

  if (path === '/' && legacyId) return { view: 'home', redirectTo: `/product/${encodeURIComponent(legacyId)}` };
  if (path === '/' && legacyCollection) return { view: 'home', redirectTo: `/collections/${encodeURIComponent(legacyCollection)}` };

  if (path.startsWith('/product/')) {
    const id = decodeURIComponent(path.slice('/product/'.length));
    return productExists(id) ? { view: 'product', productId: id } : { view: 'notfound' };
  }
  if (path === '/collections' || path.startsWith('/collections/')) {
    const slug = decodeURIComponent(path.slice('/collections/'.length)) || 'signature';
    return { view: 'collection', collectionSlug: slug };
  }
  if (path === '/account' || path.startsWith('/account/') || path === '/profile') return { view: 'account' };

  const exact = EXACT[path];
  return exact ? { view: exact } : { view: 'notfound' };
}
