import { describe, expect, it } from 'vitest';
import { resolveStorefrontView } from './routes';

const r = (path: string, search = '') => resolveStorefrontView(path, search);

describe('resolveStorefrontView', () => {
  it('home', () => expect(r('/')).toEqual({ view: 'home' }));
  it('product page', () => expect(r('/product/saudagar-deep-canopy')).toEqual({ view: 'product', productId: 'saudagar-deep-canopy' }));
  it('product page with trailing slash', () => expect(r('/product/saudagar-deep-canopy/')).toEqual({ view: 'product', productId: 'saudagar-deep-canopy' }));
  it('any product slug resolves; the page shows the 404 when the database has no such product', () =>
    expect(r('/product/nope')).toEqual({ view: 'product', productId: 'nope' }));
  it('legacy ?id= redirects to the product path', () =>
    expect(r('/', '?id=saudagar-deep-canopy')).toEqual({ view: 'home', redirectTo: '/product/saudagar-deep-canopy' }));
  it('legacy ?collection= redirects to the collection path', () =>
    expect(r('/', '?collection=royal')).toEqual({ view: 'home', redirectTo: '/collections/royal' }));
  it('collection page', () => expect(r('/collections/royal')).toEqual({ view: 'collection', collectionSlug: 'royal' }));
  it('bare /collections/ falls back to signature', () => expect(r('/collections/')).toEqual({ view: 'collection', collectionSlug: 'signature' }));
  it('/collections/all is the shop', () => expect(r('/collections/all')).toEqual({ view: 'collection', collectionSlug: 'all' }));
  it('shop', () => expect(r('/shop')).toEqual({ view: 'listing', listing: { kind: 'shop' } }));
  it('category', () => expect(r('/categories/royal-attars')).toEqual({ view: 'listing', listing: { kind: 'category', slug: 'royal-attars' } }));
  it('notes index', () => expect(r('/notes')).toEqual({ view: 'notes' }));
  it('note page', () => expect(r('/notes/taif-rose')).toEqual({ view: 'listing', listing: { kind: 'note', slug: 'taif-rose' } }));
  it('search', () => expect(r('/search', '?q=oud')).toEqual({ view: 'listing', listing: { kind: 'search' } }));
  it('/about is the story page', () => expect(r('/about')).toEqual({ view: 'story' }));
  it('/story', () => expect(r('/story')).toEqual({ view: 'story' }));
  it('/profile is the account page', () => expect(r('/profile')).toEqual({ view: 'account' }));
  it('/account/orders is the account page', () => expect(r('/account/orders')).toEqual({ view: 'account' }));
  it('wishlist', () => expect(r('/wishlist')).toEqual({ view: 'wishlist' }));
  it('checkout', () => expect(r('/checkout')).toEqual({ view: 'checkout' }));
  it('auth pages', () => {
    expect(r('/login').view).toBe('login');
    expect(r('/register').view).toBe('register');
    expect(r('/forgot-password').view).toBe('forgot-password');
    expect(r('/reset-password').view).toBe('reset-password');
  });
  it('anything else is a 404', () => expect(r('/nope')).toEqual({ view: 'notfound' }));
});
