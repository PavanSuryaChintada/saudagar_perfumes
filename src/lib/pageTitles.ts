// Browser-tab titles for the shop's fixed pages. Products, collections, listings, CMS pages and the home page set
// their own (with Google words) once their data has loaded.

const TITLES: Record<string, string> = {
  notes: 'Fragrance notes',
  wishlist: 'Saved fragrances',
  story: 'Our story',
  order: 'Your order',
  account: 'Your account',
  checkout: 'Secure checkout',
  login: 'Sign in',
  register: 'Create account',
  'forgot-password': 'Reset password',
  'reset-password': 'Reset password',
  notfound: 'Page not found',
  giftpack: 'Gift pack',
};

/** Pages that are personal or empty, kept out of search results. */
export const PRIVATE_VIEWS = new Set(['account', 'checkout', 'order', 'login', 'register', 'forgot-password', 'reset-password', 'wishlist', 'notfound']);

export function pageTitle(view: string, siteName: string | null | undefined): string | null {
  const label = TITLES[view];
  return label ? `${label} | ${siteName?.trim() || 'Saudagar Perfumers'}` : null;
}
