// Browser-only cart and wishlist storage for guests. Replaced by the database for signed-in customers in later phases.
const CART_KEY = 'saudagar_cart_bluorng';
const WISHLIST_KEY = 'saudagar_wishlist';

function read(key) {
  if (typeof window === 'undefined') return [];
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}

export const getStoredCart = () => read(CART_KEY);
export const setStoredCart = (cart) => write(CART_KEY, cart);
export const getStoredWishlist = () => read(WISHLIST_KEY);
export const setStoredWishlist = (list) => write(WISHLIST_KEY, list);
