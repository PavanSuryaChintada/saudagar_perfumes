import { useEffect } from 'react';
import { useBlock } from './useSite';
import { themeVariables } from './theme';

// Fonts already loaded by index.html; anything else chosen in the Theme block is fetched from Google Fonts.
const PRELOADED = new Set(['Cormorant Garamond', 'DM Sans', 'Outfit', 'Playfair Display', 'Poppins', 'Prompt']);

function ensureFont(family: unknown) {
  if (typeof family !== 'string' || !/^[A-Za-z0-9 ]{2,40}$/.test(family) || PRELOADED.has(family)) return;
  const id = `font-${family.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

/** Applies Admin → Site content → Theme (colours, fonts) and Brand (favicon) to the live page. */
export default function ThemeRuntime() {
  const theme = useBlock<Record<string, unknown>>('theme');
  const brand = useBlock<Record<string, unknown>>('brand');

  useEffect(() => {
    const vars = themeVariables(theme);
    const root = document.documentElement;
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    ensureFont(theme?.font_body);
    ensureFont(theme?.font_display);
    return () => {
      for (const k of Object.keys(vars)) root.style.removeProperty(k);
    };
  }, [theme]);

  useEffect(() => {
    const href = typeof brand?.favicon === 'string' ? brand.favicon : '';
    if (!href) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [brand?.favicon]);

  return null;
}
