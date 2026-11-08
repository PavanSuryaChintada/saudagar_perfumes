import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { pageWindow, usePaged } from './paging';

describe('pageWindow', () => {
  it('shows every page when there are few', () => {
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });
  it('keeps first, last and neighbours, with gaps', () => {
    expect(pageWindow(6, 20)).toEqual([1, null, 5, 6, 7, null, 20]);
    expect(pageWindow(1, 20)).toEqual([1, 2, null, 20]);
    expect(pageWindow(20, 20)).toEqual([1, null, 19, 20]);
  });
});

describe('usePaged', () => {
  const items = Array.from({ length: 60 }, (_, i) => i + 1);
  it('slices pages and reports the range shown', () => {
    const { result } = renderHook(() => usePaged(items, 25));
    expect(result.current.rows[0]).toBe(1);
    expect(result.current.pageCount).toBe(3);
    act(() => result.current.setPage(3));
    expect(result.current.rows).toEqual([51, 52, 53, 54, 55, 56, 57, 58, 59, 60]);
    expect([result.current.from, result.current.to, result.current.total]).toEqual([51, 60, 60]);
  });
  it('goes back to page 1 when the search changes, and never past the last page', () => {
    const { result, rerender } = renderHook(({ list, key }) => usePaged(list, 25, key), { initialProps: { list: items, key: 'a' } });
    act(() => result.current.setPage(3));
    rerender({ list: items.slice(0, 10), key: 'b' });
    expect(result.current.page).toBe(1);
    act(() => result.current.setPage(9));
    expect(result.current.page).toBe(1);
  });
});
