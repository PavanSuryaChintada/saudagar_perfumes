import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Emphasis } from './emphasis';

describe('Emphasis', () => {
  it('turns *word* into italics and leaves the rest as text', () => {
    const { container } = render(<Emphasis text="Fragrance is *patience*, poured slowly." />);
    expect(container.innerHTML).toBe('Fragrance is <em class="italic">patience</em>, poured slowly.');
  });
  it('renders nothing for empty text', () => {
    const { container } = render(<Emphasis text="" />);
    expect(container.innerHTML).toBe('');
  });
  it('never renders HTML from the text', () => {
    const { container } = render(<Emphasis text="<b>bold</b>" />);
    expect(container.innerHTML).toBe('&lt;b&gt;bold&lt;/b&gt;');
  });
});
