import { useEffect } from 'react';
import { useBlock } from '../cms/useSite';

export interface SeoInput {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  /** Path for the canonical link, e.g. /product/oud-roses. Defaults to the current path. */
  path?: string;
  type?: 'website' | 'product' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
  noindex?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, value: string | null | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

const absolute = (url: string | null | undefined) => (!url ? null : /^https?:\/\//i.test(url) ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`);

/** Title, description, canonical, Open Graph, Twitter and JSON-LD for the current page. */
export function useSEO(input: SeoInput) {
  const seo = useBlock<Record<string, string>>('seo') || {};
  const brand = useBlock<Record<string, string>>('brand') || {};
  const key = JSON.stringify(input);
  useEffect(() => {
    const siteName = brand.name || 'Saudagar Perfumers';
    const title = input.title ? `${input.title} | ${siteName}` : seo.default_title || siteName;
    const description = input.description || seo.default_description || '';
    const image = absolute(input.image || seo.og_image || null);
    const canonical = `${window.location.origin}${input.path ?? window.location.pathname}`;
    document.title = title;
    setMeta('name', 'description', description.slice(0, 300));
    setMeta('name', 'robots', input.noindex ? 'noindex, nofollow' : null);
    setLink('canonical', canonical);
    setMeta('property', 'og:site_name', siteName);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description.slice(0, 300));
    setMeta('property', 'og:type', input.type ?? 'website');
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description.slice(0, 300));
    setMeta('name', 'twitter:image', image);

    document.head.querySelectorAll('script[data-seo-jsonld]').forEach((s) => s.remove());
    const blocks = input.jsonLd ? (Array.isArray(input.jsonLd) ? input.jsonLd : [input.jsonLd]) : [];
    for (const b of blocks) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.dataset.seoJsonld = '1';
      s.text = JSON.stringify(b).replace(/</g, '\\u003c');
      document.head.appendChild(s);
    }
    return () => {
      document.head.querySelectorAll('script[data-seo-jsonld]').forEach((s) => s.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, seo.default_title, seo.default_description, seo.og_image, brand.name]);
}

/** schema.org Product with one Offer per bottle size. */
export function productJsonLd(p: {
  name: string;
  slug: string;
  description?: string | null;
  images: string[];
  brand: string;
  rating?: { average: number; count: number } | null;
  offers: { sku: string; price: number; inStock: boolean; label: string }[];
}) {
  const url = `${window.location.origin}/product/${p.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: (p.description ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) || undefined,
    image: p.images.map((i) => absolute(i)).filter(Boolean),
    brand: { '@type': 'Brand', name: p.brand },
    url,
    ...(p.rating && p.rating.count > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating.average, reviewCount: p.rating.count } }
      : {}),
    offers: p.offers.map((o) => ({
      '@type': 'Offer',
      sku: o.sku,
      name: o.label,
      price: o.price.toFixed(2),
      priceCurrency: 'INR',
      availability: o.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url,
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${window.location.origin}${it.path}` })),
  };
}

export function organizationJsonLd(brand: Record<string, string>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name || 'Saudagar Perfumers',
    url: window.location.origin,
    logo: absolute(brand.logo_light_bg) ?? undefined,
    sameAs: [brand.instagram, brand.youtube].filter((u) => u && /^https?:\/\/.+\/.+/.test(u)),
    contactPoint: brand.support_phone ? [{ '@type': 'ContactPoint', telephone: brand.support_phone, contactType: 'customer service', areaServed: 'IN' }] : undefined,
  };
}
