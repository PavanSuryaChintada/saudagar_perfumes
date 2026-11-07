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

export function themeVariables(theme: Record<string, unknown> | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!theme) return out;
  for (const [key, cssVar] of Object.entries(THEME_COLOR_VARS)) {
    const channels = typeof theme[key] === 'string' ? hexToChannels(theme[key] as string) : null;
    if (channels) out[cssVar] = channels;
  }
  const safeFont = (v: unknown) => (typeof v === 'string' && /^[A-Za-z0-9 ]{2,40}$/.test(v) ? `"${v}"` : null);
  const body = safeFont(theme.font_body);
  const display = safeFont(theme.font_display);
  if (body) out['--font-body'] = body;
  if (display) out['--font-display'] = display;
  return out;
}
