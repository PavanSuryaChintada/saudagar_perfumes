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

const SAMPLES_KEY = 'saudagar_samples';
const NOTE_KEY = 'saudagar_bag_note';
export const getStoredSamples = () => read(SAMPLES_KEY).map((x) => (typeof x === 'string' ? x : null));
export const setStoredSamples = (list) => write(SAMPLES_KEY, list);
export function getStoredNote() {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(NOTE_KEY) || '';
  } catch {
    return '';
  }
}
export function setStoredNote(note) {
  if (typeof window === 'undefined') return;
  try {
    if (note) localStorage.setItem(NOTE_KEY, note);
    else localStorage.removeItem(NOTE_KEY);
  } catch {
    // ignore
  }
}

const COUPON_KEY = 'saudagar_coupon';
export function getStoredCoupon() {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(COUPON_KEY) || '';
  } catch {
    return '';
  }
}
export function setStoredCoupon(code) {
  if (typeof window === 'undefined') return;
  try {
    if (code) localStorage.setItem(COUPON_KEY, code);
    else localStorage.removeItem(COUPON_KEY);
  } catch {
    // ignore
  }
}
