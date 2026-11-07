import { describe, expect, it } from 'vitest';
import { resolveLink } from './links';
import { sourceToSearchPayload } from './sources';
import { emptyValueFor, getAtPath, setAtPath, visibleFields, type FieldDef } from './schema';

describe('resolveLink', () => {
  it('maps internal link types to paths', () => {
    expect(resolveLink({ type: 'collection', value: 'royal' })).toEqual({ href: '/collections/royal', external: false });
    expect(resolveLink({ type: 'category', value: 'royal-attars' })).toEqual({ href: '/categories/royal-attars', external: false });
    expect(resolveLink({ type: 'note', value: 'oud' })).toEqual({ href: '/notes/oud', external: false });
    expect(resolveLink({ type: 'product', value: 'deep-canopy' })).toEqual({ href: '/product/deep-canopy', external: false });
    expect(resolveLink({ type: 'page', value: 'about' })).toEqual({ href: '/pages/about', external: false });
    expect(resolveLink({ type: 'page', value: 'home' })).toEqual({ href: '/', external: false });
    expect(resolveLink({ type: 'page', value: 'story' })).toEqual({ href: '/story', external: false });
    expect(resolveLink({ type: 'path', value: '/shop?occasion=evening' })).toEqual({ href: '/shop?occasion=evening', external: false });
  });
  it('treats web, mail, phone and WhatsApp links as external', () => {
    expect(resolveLink({ type: 'url', value: 'https://instagram.com/x' })).toEqual({ href: 'https://instagram.com/x', external: true });
    expect(resolveLink({ type: 'url', value: 'mailto:hi@x.com' })?.external).toBe(true);
    expect(resolveLink('https://wa.me/919876543210')?.external).toBe(true);
  });
  it('accepts plain strings', () => expect(resolveLink('/shop')).toEqual({ href: '/shop', external: false }));
  it('refuses script links and empty values', () => {
    expect(resolveLink({ type: 'url', value: 'javascript:alert(1)' })).toBeNull();
    expect(resolveLink({ type: 'collection', value: '' })).toBeNull();
    expect(resolveLink(undefined)).toBeNull();
  });
});

describe('sourceToSearchPayload', () => {
  it('collection source', () =>
    expect(sourceToSearchPayload({ mode: 'collection', collection: 'latest-drop', limit: 8 })).toEqual({ collection: 'latest-drop', page_size: 8, sort: 'featured' }));
  it('hand-picked products keep their slugs', () =>
    expect(sourceToSearchPayload({ mode: 'manual', products: ['a', 'b'] })).toEqual({ slugs: ['a', 'b'], page_size: 2 }));
  it('filtered by scent profile', () =>
    expect(sourceToSearchPayload({ mode: 'filter', attrs: { family: ['oud'] }, limit: 4 })).toEqual({ attrs: { family: ['oud'] }, page_size: 4, sort: 'featured' }));
  it('best sellers and newest', () => {
    expect(sourceToSearchPayload({ mode: 'best_selling' })).toEqual({ sort: 'best_selling', page_size: 8 });
    expect(sourceToSearchPayload({ mode: 'newest', limit: 99 })).toEqual({ sort: 'newest', page_size: 48 });
  });
  it('falls back to featured for unknown input', () => expect(sourceToSearchPayload(undefined)).toEqual({ featured: true, sort: 'featured', page_size: 8 }));
});

describe('schema helpers', () => {
  it('reads and writes nested paths without mutating', () => {
    const v = { a: { list: [{ t: 'x' }] } };
    const next = setAtPath(v, ['a', 'list', 0, 't'], 'y');
    expect(getAtPath(next, ['a', 'list', 0, 't'])).toBe('y');
    expect(v.a.list[0].t).toBe('x');
  });
  it('hides fields whose showIf does not match', () => {
    const fields: FieldDef[] = [
      { key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'video', label: 'Video' }, { value: 'image', label: 'Image' }] },
      { key: 'video', label: 'Video', type: 'media', accept: 'video', showIf: { field: 'mode', equals: 'video' } },
    ];
    expect(visibleFields(fields, { mode: 'image' }).map((f) => f.key)).toEqual(['mode']);
    expect(visibleFields(fields, { mode: 'video' }).map((f) => f.key)).toEqual(['mode', 'video']);
  });
  it('gives sensible empty values', () => {
    expect(emptyValueFor({ key: 'l', label: 'L', type: 'list', fields: [] })).toEqual([]);
    expect(emptyValueFor({ key: 'b', label: 'B', type: 'boolean' })).toBe(false);
    expect(emptyValueFor({ key: 't', label: 'T', type: 'text' })).toBe('');
  });
});
