// A link chosen in the CMS: an internal destination by type, a site path, or an external URL.
export type LinkType = 'collection' | 'category' | 'note' | 'product' | 'page' | 'path' | 'url';
export interface LinkValue {
  type: LinkType;
  value: string;
  new_tab?: boolean;
}

const EXTERNAL = /^(https?:|mailto:|tel:)/i;

export function resolveLink(link: LinkValue | string | null | undefined): { href: string; external: boolean } | null {
  if (!link) return null;
  const l: LinkValue = typeof link === 'string' ? { type: link.startsWith('/') ? 'path' : 'url', value: link } : link;
  const v = (l.value ?? '').trim();
  if (!v) return null;
  switch (l.type) {
    case 'collection':
      return { href: `/collections/${encodeURIComponent(v)}`, external: false };
    case 'category':
      return { href: `/categories/${encodeURIComponent(v)}`, external: false };
    case 'note':
      return { href: `/notes/${encodeURIComponent(v)}`, external: false };
    case 'product':
      return { href: `/product/${encodeURIComponent(v)}`, external: false };
    case 'page':
      return { href: v === 'home' ? '/' : v === 'story' ? '/story' : `/pages/${encodeURIComponent(v)}`, external: false };
    case 'path':
      return v.startsWith('/') && !v.startsWith('//') ? { href: v, external: false } : null;
    case 'url':
    default:
      if (v.startsWith('/') && !v.startsWith('//')) return { href: v, external: false };
      return EXTERNAL.test(v) ? { href: v, external: true } : null;
  }
}
