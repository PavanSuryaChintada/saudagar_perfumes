import { describe, expect, it } from 'vitest';
import { SURPRISE, emptySlots, fillSlots, searchPool } from './samplePicks';

describe('sample slots', () => {
  it('finds the slots still waiting for a pick (Surprise me counts as chosen)', () => {
    expect(emptySlots([], 2)).toEqual([0, 1]);
    expect(emptySlots(['v1', null, SURPRISE], 4)).toEqual([1, 3]);
    expect(emptySlots(['v1', 'v2', 'v3'], 2)).toEqual([]);
  });

  it('fills waiting slots with suggestions, and with Surprise me when there are too few', () => {
    expect(fillSlots(['v1', null], 3, ['s1', 's2'])).toEqual(['v1', 's1', 's2']);
    expect(fillSlots([null], 2, ['s1'])).toEqual(['s1', SURPRISE]);
    expect(fillSlots(['v1', 'v2', 'v3'], 2, [])).toEqual(['v1', 'v2']);
  });

  it('searches the sample list by name, family or size', () => {
    const pool = [
      { variant_id: '1', name: 'Amber Noir', family: 'Oriental', label: '5 ml sample' },
      { variant_id: '2', name: 'Velvet Oud', family: 'Woody', label: '5 ml sample' },
    ];
    expect(searchPool(pool, 'oud').map((p) => p.variant_id)).toEqual(['2']);
    expect(searchPool(pool, ' ORIENTAL ').map((p) => p.variant_id)).toEqual(['1']);
    expect(searchPool(pool, '')).toHaveLength(2);
  });
});
