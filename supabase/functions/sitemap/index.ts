// sitemap.xml for search engines: home, story, shop, collections, categories, notes, published pages and products.
// Served at /sitemap.xml through a Vercel rewrite. SITE_URL secret = the public store address.
import { serviceClient } from '../_shared/razorpay.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

Deno.serve(async () => {
  const site = (Deno.env.get('SITE_URL') ?? 'https://saudagarperfumes.com').replace(/\/+$/, '');
  const db = serviceClient();
  const [products, collections, categories, notes, pages] = await Promise.all([
    db.from('products').select('slug, updated_at').eq('is_active', true).is('archived_at', null),
    db.from('collections').select('slug, updated_at').eq('is_active', true),
    db.from('categories').select('slug, updated_at').eq('is_active', true),
    db.from('notes').select('slug, updated_at').eq('is_active', true),
    db.from('pages').select('slug, updated_at').eq('is_published', true),
  ]);
  const urls: { loc: string; lastmod?: string; priority: string }[] = [
    { loc: '/', priority: '1.0' },
    { loc: '/shop', priority: '0.9' },
    { loc: '/notes', priority: '0.5' },
  ];
  for (const p of pages.data ?? []) {
    if (p.slug === 'home') continue;
    urls.push({ loc: p.slug === 'story' ? '/story' : `/pages/${p.slug}`, lastmod: p.updated_at, priority: '0.4' });
  }
  for (const c of collections.data ?? []) urls.push({ loc: `/collections/${c.slug}`, lastmod: c.updated_at, priority: '0.8' });
  for (const c of categories.data ?? []) urls.push({ loc: `/categories/${c.slug}`, lastmod: c.updated_at, priority: '0.8' });
  for (const n of notes.data ?? []) urls.push({ loc: `/notes/${n.slug}`, lastmod: n.updated_at, priority: '0.5' });
  for (const p of products.data ?? []) urls.push({ loc: `/product/${p.slug}`, lastmod: p.updated_at, priority: '0.9' });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(site + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
});
