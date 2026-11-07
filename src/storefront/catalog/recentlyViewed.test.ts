import { describe, expect, it } from 'vitest';
import { pushRecent } from './recentlyViewed';

describe('pushRecent', () => {
  it('puts the newest first without duplicates', () => expect(pushRecent(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']));
  it('caps the list', () => expect(pushRecent(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b']));
  it('ignores junk stored values', () => expect(pushRecent('nope' as never, 'a')).toEqual(['a']));
});
