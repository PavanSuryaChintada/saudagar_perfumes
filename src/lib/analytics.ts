// GA4 / GTM ecommerce events. Inert until Admin → Settings → Analytics has an ID.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let started = false;

export function initAnalytics(ga4Id?: string | null, gtmId?: string | null) {
  if (started || typeof window === 'undefined') return;
  const ga = (ga4Id ?? '').trim();
  const gtm = (gtmId ?? '').trim();
  if (!/^G-[A-Z0-9]+$/.test(ga) && !/^GTM-[A-Z0-9]+$/.test(gtm)) return;
  started = true;
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

export function track(event: 'page_view' | 'view_item' | 'add_to_cart' | 'begin_checkout' | 'add_payment_info' | 'purchase' | 'search' | 'add_to_wishlist', params: Record<string, unknown> = {}) {
  if (!started || !window.gtag) return;
  window.gtag('event', event, { currency: 'INR', ...params });
}

export function trackPageView(path: string, title: string) {
  track('page_view', { page_path: path, page_title: title, page_location: window.location.href });
}
