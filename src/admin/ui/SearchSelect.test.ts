import { describe, expect, it } from 'vitest';
import { categoryOptions, rankOptions } from './SearchSelect';

const opts = [
  { value: '1', label: 'Rose' },
  { value: '2', label: 'Damask Rose' },
  { value: '3', label: 'Primrose' },
  { value: '4', label: 'Oud', hint: 'Woody · rose-free' },
];

describe('rankOptions', () => {
  it('puts names that start with the text first, then word starts, then anywhere, then hints', () => {
    expect(rankOptions(opts, 'rose').map((o) => o.label)).toEqual(['Rose', 'Damask Rose', 'Primrose', 'Oud']);
  });
  it('ignores case and accents', () => {
    expect(rankOptions([{ value: 'a', label: 'Crème Brûlée' }], 'creme').length).toBe(1);
  });
  it('returns the list as given when nothing is typed', () => {
    expect(rankOptions(opts, '  ').map((o) => o.value)).toEqual(['1', '2', '3', '4']);
  });
});

describe('categoryOptions', () => {
  it('shows each category with its full path, parents first, and marks hidden ones', () => {
    const out = categoryOptions([
      { id: 'b', name: 'Oud', parent_id: 'a' },
      { id: 'a', name: 'Perfumes', parent_id: null },
      { id: 'c', name: 'Gift sets', parent_id: null, is_active: false },
    ]);
    expect(out.map((o) => [o.label, o.hint ?? '', o.tag ?? ''])).toEqual([
      ['Gift sets', '', 'hidden'],
      ['Perfumes', '', ''],
      ['Oud', 'Perfumes › Oud', ''],
    ]);
  });
});
