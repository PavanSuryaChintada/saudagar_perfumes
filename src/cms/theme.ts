// Theme tokens: the five brand colours and two fonts, editable in Admin → Site content → Theme.
export const THEME_COLOR_VARS: Record<string, string> = {
  accent: '--c-accent',
  accent_night: '--c-accent-night',
  gold: '--c-gold',
  ink: '--c-ink',
  night: '--c-night',
};

export const FONT_CHOICES = [
  'Poppins', 'Outfit', 'DM Sans', 'Plus Jakarta Sans', 'Inter', 'Manrope', 'Jost',
  'Cormorant Garamond', 'IM Fell French Canon', 'Playfair Display', 'Bodoni Moda', 'Libre Caslon Text', 'Marcellus',
];

export function hexToChannels(hex: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex ?? '').trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
}

const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * The accent as small text on a light page: the same colour, darkened just enough to be easy to read (about 5 : 1
 * on white). Buttons and lines keep the accent itself.
 */
export function accentInk(channels: string, min = 5): string {
  const rgb = channels.split(' ').map(Number);
  for (let k = 1; k >= 0.2; k -= 0.02) {
    const c = rgb.map((v) => Math.round(v * k));
    if (1.05 / (luminance(c) + 0.05) >= min) return c.join(' ');
  }
  return '17 17 17';
}

export function themeVariables(theme: Record<string, unknown> | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!theme) return out;
  for (const [key, cssVar] of Object.entries(THEME_COLOR_VARS)) {
    const channels = typeof theme[key] === 'string' ? hexToChannels(theme[key] as string) : null;
    if (channels) out[cssVar] = channels;
  }
  if (out['--c-accent']) out['--c-accent-ink'] = accentInk(out['--c-accent']);
  const safeFont = (v: unknown) => (typeof v === 'string' && /^[A-Za-z0-9 ]{2,40}$/.test(v) ? `"${v}"` : null);
  const body = safeFont(theme.font_body);
  const display = safeFont(theme.font_display);
  if (body) out['--font-body'] = body;
  if (display) out['--font-display'] = display;
  return out;
}
