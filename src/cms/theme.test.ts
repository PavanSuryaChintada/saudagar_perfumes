import { describe, expect, it } from 'vitest';
import { accentInk, hexToChannels, themeVariables } from './theme';

describe('hexToChannels', () => {
  it('converts #RRGGBB to space-separated channels', () => expect(hexToChannels('#C4823F')).toBe('196 130 63'));
  it('accepts 3-digit hex', () => expect(hexToChannels('#fff')).toBe('255 255 255'));
  it('rejects junk', () => expect(hexToChannels('red')).toBeNull());
});

describe('themeVariables', () => {
  it('maps the theme block to CSS variables and skips invalid colours', () => {
    expect(themeVariables({ accent: '#C4823F', ink: 'nope', font_body: 'Poppins', font_display: 'Cormorant Garamond' })).toEqual({
      '--c-accent': '196 130 63',
      '--c-accent-ink': accentInk('196 130 63'),
      '--font-body': '"Poppins"',
      '--font-display': '"Cormorant Garamond"',
    });
  });
});

describe('readable accent for small text', () => {
  const contrastOnWhite = (channels: string) => {
    const [r, g, b] = channels.split(' ').map(Number).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return 1.05 / (L + 0.05);
  };

  it('darkens the brand gold-brown until small text is easy to read, also on the cream panels', () => {
    const ink = accentInk('196 130 63');
    expect(contrastOnWhite(ink)).toBeGreaterThanOrEqual(5);
    expect(contrastOnWhite(ink)).toBeLessThan(6.5); // still clearly the brand colour, not black
    const [r, g, b] = ink.split(' ').map(Number);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b); // same warm hue
  });

  it('keeps a colour that is already dark enough', () => {
    expect(accentInk('17 17 17')).toBe('17 17 17');
  });

  it('is set next to the accent whenever the admin changes it', () => {
    const vars = themeVariables({ accent: '#C4823F' });
    expect(vars['--c-accent-ink']).toBe(accentInk('196 130 63'));
  });
});
