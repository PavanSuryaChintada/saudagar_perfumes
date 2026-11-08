import { describe, expect, it } from 'vitest';
import { fullTitle, lengthAdvice, suggestListing } from './searchListing';

const site = 'Saudagar Perfumers';

describe('suggestListing', () => {
  it('writes a product title with its scent family when it fits, and a description from its own words, notes and sizes', () => {
    const s = suggestListing({
      kind: 'product',
      name: 'Mystic Smoky Oud',
      family: 'Woody',
      summary: 'A smoky oud for evenings.',
      notes: ['Oud', 'Saffron', 'Rose', 'Amber'],
      sizes: [100, 30, 50, 30],
      siteName: site,
    });
    expect(s.title).toBe('Mystic Smoky Oud – Woody perfume');
    expect(s.description).toBe('A smoky oud for evenings. Notes of oud, saffron and rose. Available in 30, 50 and 100 ml.');
  });

  it('keeps the product title short when the family would make it too long for Google', () => {
    const s = suggestListing({ kind: 'product', name: 'Saudagar Pure Dehn Al Oud Cambodi Special Reserve', family: 'Woody', siteName: site });
    expect(s.title).toBe('Saudagar Pure Dehn Al Oud Cambodi Special Reserve');
  });

  it('uses the first sentences of a long text, without HTML, and never cuts a word in half', () => {
    const body = '<p>Wrapped in our signature box.</p><p>' + 'Every bottle is filled by hand in small batches. '.repeat(6) + '</p>';
    const s = suggestListing({ kind: 'page', name: 'Gifting', body, siteName: site });
    expect(s.description.startsWith('Wrapped in our signature box. Every bottle')).toBe(true);
    expect(s.description.length).toBeLessThanOrEqual(160);
    expect(s.description).not.toMatch(/<|\s$/);
    expect(s.description.endsWith('.')).toBe(true);
  });

  it('names categories as perfumes and falls back to plain words when there is no text', () => {
    expect(suggestListing({ kind: 'category', name: 'Oud', siteName: site })).toEqual({ title: 'Oud perfumes', description: 'Shop Oud perfumes by Saudagar Perfumers.' });
    expect(suggestListing({ kind: 'category', name: 'Attars', siteName: site }).title).toBe('Attars');
    expect(suggestListing({ kind: 'collection', name: 'The Oud Edit', summary: 'Rare ouds, aged.', siteName: site }).description).toBe('Rare ouds, aged.');
    expect(suggestListing({ kind: 'note', name: 'Taif Rose', siteName: site }).description).toBe('Perfumes by Saudagar Perfumers with Taif Rose.');
  });
});

describe('length advice', () => {
  it('says plainly whether the words fit on Google', () => {
    expect(lengthAdvice('title', fullTitle('Mystic Smoky Oud', site))).toEqual({ ok: true, text: '37 of about 60 characters: fits.' });
    expect(lengthAdvice('title', 'x'.repeat(70)).ok).toBe(false);
    expect(lengthAdvice('description', 'short').text).toMatch(/a little short/);
    expect(lengthAdvice('description', 'y'.repeat(200)).text).toMatch(/Google cuts it/);
  });
});
