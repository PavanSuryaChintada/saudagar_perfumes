import { describe, expect, it } from 'vitest';
import { hexToChannels, themeVariables } from './theme';

describe('hexToChannels', () => {
  it('converts #RRGGBB to space-separated channels', () => expect(hexToChannels('#C4823F')).toBe('196 130 63'));
  it('accepts 3-digit hex', () => expect(hexToChannels('#fff')).toBe('255 255 255'));
  it('rejects junk', () => expect(hexToChannels('red')).toBeNull());
});

describe('themeVariables', () => {
  it('maps the theme block to CSS variables and skips invalid colours', () => {
    expect(themeVariables({ accent: '#C4823F', ink: 'nope', font_body: 'Poppins', font_display: 'Cormorant Garamond' })).toEqual({
      '--c-accent': '196 130 63',
      '--font-body': '"Poppins"',
      '--font-display': '"Cormorant Garamond"',
    });
  });
});
