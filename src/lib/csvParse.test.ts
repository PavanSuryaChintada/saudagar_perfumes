import { describe, expect, it } from 'vitest';
import { csvObjects, parseCsv } from './csvParse';

describe('parseCsv', () => {
  it('reads quoted cells with commas, quotes and line breaks', () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi""\nthere"\r\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"\nthere'],
    ]);
  });
  it('drops the byte-order mark and blank lines', () => {
    expect(parseCsv('﻿sku,stock\n\nA1,5\n,\n')).toEqual([
      ['sku', 'stock'],
      ['A1', '5'],
    ]);
  });
  it('detects semicolon-separated files', () => {
    expect(parseCsv('sku;price\nA1;1200')).toEqual([
      ['sku', 'price'],
      ['A1', '1200'],
    ]);
  });
});

describe('csvObjects', () => {
  it('matches headers loosely', () => {
    const { rows } = csvObjects('SKU,Price (₹),Compare-at price (₹), Stock \nA1, 1200 ,,7');
    expect(rows[0]).toEqual({ sku: 'A1', price: '1200', compare_at_price: '', stock: '7' });
  });
});
