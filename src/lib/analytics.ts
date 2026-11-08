// GA4 / GTM / Meta Pixel ecommerce events. Inert until Admin → Settings → Analytics (or Connections) has an ID.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
  }
}

let started = false;
let pixelOn = false;

type ShopEvent = 'page_view' | 'view_item' | 'add_to_cart' | 'begin_checkout' | 'add_payment_info' | 'purchase' | 'search' | 'add_to_wishlist';

const PIXEL_NAMES: Record<ShopEvent, string> = {
  page_view: 'PageView',
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase',
  search: 'Search',
  add_to_wishlist: 'AddToWishlist',
};

/** The Meta Pixel standard event and its fields for one of our shop events (null when there is none). */
export function pixelEvent(event: ShopEvent, params: Record<string, unknown>): [string, Record<string, unknown>] | null {
  const name = PIXEL_NAMES[event];
  if (!name) return null;
  if (event === 'page_view') return [name, {}];
  if (event === 'search') return [name, { search_string: params.search_term }];
  const out: Record<string, unknown> = {};
  if (typeof params.value === 'number') {
    out.value = params.value;
    out.currency = 'INR';
  }
  const items = Array.isArray(params.items) ? (params.items as { item_id?: string }[]) : [];
  if (items.length) {
    out.content_ids = items.map((i) => i.item_id).filter(Boolean);
    out.content_type = 'product';
  }
  return [name, out];
}

function startPixel(id: string) {
  // Meta's standard loader, written out so it works without an inline script tag.
  const w = window;
  if (w.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue!.push(args);
  } as NonNullable<Window['fbq']>;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  w.fbq = fbq;
  w._fbq = fbq;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  fbq('init', id);
  pixelOn = true;
}

export function initAnalytics(ga4Id?: string | null, gtmId?: string | null, metaPixelId?: string | null) {
  if (started || typeof window === 'undefined') return;
  const ga = (ga4Id ?? '').trim();
  const gtm = (gtmId ?? '').trim();
  const pixel = (metaPixelId ?? '').trim();
  const hasPixel = /^[0-9]{10,20}$/.test(pixel);
  if (!/^G-[A-Z0-9]+$/.test(ga) && !/^GTM-[A-Z0-9]+$/.test(gtm) && !hasPixel) return;
  started = true;
  if (hasPixel) startPixel(pixel);
  if (!/^G-[A-Z0-9]+$/.test(ga) && !/^GTM-[A-Z0-9]+$/.test(gtm)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  if (/^GTM-[A-Z0-9]+$/.test(gtm)) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${gtm}`;
    document.head.appendChild(s);
  }
  if (/^G-[A-Z0-9]+$/.test(ga)) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', ga, { send_page_view: false });
  }
}

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
}

export function track(event: ShopEvent, params: Record<string, unknown> = {}) {
  if (!started) return;
  if (window.gtag) window.gtag('event', event, { currency: 'INR', ...params });
  if (pixelOn && window.fbq) {
    const p = pixelEvent(event, params);
    if (p) window.fbq('track', p[0], p[1]);
  }
}

export function trackPageView(path: string, title: string) {
  track('page_view', { page_path: path, page_title: title, page_location: window.location.href });
}
