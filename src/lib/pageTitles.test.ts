import { describe, expect, it } from 'vitest';
import { pageTitle, PRIVATE_VIEWS } from './pageTitles';

describe('page titles', () => {
  it('names each fixed page with the brand from the CMS, in normal capitals', () => {
    expect(pageTitle('checkout', 'Saudagar Perfumers')).toBe('Secure checkout | Saudagar Perfumers');
    expect(pageTitle('notfound', 'Saudagar Perfumers')).toBe('Page not found | Saudagar Perfumers');
    expect(pageTitle('account', 'Rose & Oud')).toBe('Your account | Rose & Oud');
  });

  it('falls back to the store name and leaves pages that title themselves alone', () => {
    expect(pageTitle('login', '')).toBe('Sign in | Saudagar Perfumers');
    expect(pageTitle('product', 'Saudagar Perfumers')).toBeNull();
    expect(pageTitle('home', 'Saudagar Perfumers')).toBeNull();
  });

  it('marks the private pages that search engines should skip', () => {
    for (const v of ['account', 'checkout', 'order', 'login', 'register', 'forgot-password', 'reset-password', 'wishlist', 'notfound']) {
      expect(PRIVATE_VIEWS.has(v)).toBe(true);
    }
    expect(PRIVATE_VIEWS.has('product')).toBe(false);
  });
});
