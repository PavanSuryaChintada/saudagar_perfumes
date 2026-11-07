import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './csv';

describe('csv', () => {
  it('quotes commas, quotes and new lines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
  });
  it('keeps formulas as text but leaves negative numbers alone', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('-250')).toBe('-250');
  });
  it('writes a header from the union of keys, with a BOM', () => {
    const out = toCsv([{ a: 1 }, { b: null, a: 2 }]);
    expect(out.startsWith('﻿a,b\r\n1,\r\n2,')).toBe(true);
  });
});
