import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Search engines stay out until the real domain is connected: every page says "noindex, nofollow" and robots.txt
 * blocks all crawling. To go live, set VITE_ALLOW_INDEXING=true (and VITE_SITE_URL=https://your-domain) in
 * Vercel → Settings → Environment Variables, then redeploy.
 */
function searchEngines(allow, siteUrl) {
  const robots = allow
    ? [
        'User-agent: *',
        'Disallow: /admin',
        'Disallow: /account',
        'Disallow: /checkout',
        'Disallow: /orders/',
        'Disallow: /search',
        'Allow: /',
        ...(siteUrl ? ['', `Sitemap: ${siteUrl}/sitemap.xml`] : []),
        '',
      ].join('\n')
    : 'User-agent: *\nDisallow: /\n';
  return {
    name: 'search-engines',
    transformIndexHtml: () => (allow ? [] : [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' }]),
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
    },
    configureServer(server) {
      server.middlewares.use('/robots.txt', (_req, res) => {
        res.setHeader('Content-Type', 'text/plain');
        res.end(robots);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allow = env.VITE_ALLOW_INDEXING === 'true';
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '');
  return { plugins: [react(), searchEngines(allow, siteUrl)] };
});
