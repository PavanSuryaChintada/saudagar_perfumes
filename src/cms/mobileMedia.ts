// Phone and desktop pictures. Any picture `key` can have a phone version `key_mobile` next to it (page sections and
// site blocks), or under `mobile_media.key` (table rows such as stories, categories and collections).
//   On a phone:   the phone picture if there is one, otherwise the desktop one.
//   On desktop:   the desktop picture if there is one, otherwise the phone one.
// The swap happens where content is loaded, so every section and component gets the right picture without
// knowing about it.
import { useCallback, useMemo, useSyncExternalStore } from 'react';

export const PHONE_QUERY = '(max-width: 767px)';

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
const isPhoneNow = () => (typeof window !== 'undefined' && !!window.matchMedia ? window.matchMedia(PHONE_QUERY).matches : false);

/** True on phone-sized screens; updates when the window is resized across the breakpoint. */
export function useIsPhone(): boolean {
  return useSyncExternalStore(subscribe, isPhoneNow, () => false);
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const filled = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** Returns a copy of `value` with every picture set for the screen size (deep: lists and nested blocks too). */
export function pickMedia<T>(value: T, phone: boolean): T {
  if (Array.isArray(value)) return value.map((x) => pickMedia(x, phone)) as unknown as T;
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = k === 'mobile_media' ? v : pickMedia(v, phone);
  const mobile: Record<string, unknown> = {
    ...(isPlainObject(value.mobile_media) ? value.mobile_media : {}),
    ...Object.fromEntries(Object.entries(value).filter(([k]) => k.endsWith('_mobile')).map(([k, v]) => [k.slice(0, -'_mobile'.length), v])),
  };
  for (const [base, url] of Object.entries(mobile)) {
    if (!filled(url)) continue;
    if (phone || !filled(out[base])) out[base] = url;
  }
  return out as T;
}

/** pickMedia for the current screen, recomputed only when the value or screen size changes. */
export function useScreenMedia<T>(value: T): T {
  const phone = useIsPhone();
  return useMemo(() => pickMedia(value, phone), [value, phone]);
}

/** Admin: `{ image_mobile: url }` form keys ⇄ the `mobile_media` column of a table row. */
export function mobileToColumn(form: Record<string, unknown>, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = form[`${k}_mobile`];
    if (filled(v)) out[k] = v.trim();
  }
  return out;
}
export function columnToMobile(row: Record<string, unknown>): Record<string, unknown> {
  const mm = isPlainObject(row.mobile_media) ? row.mobile_media : {};
  return Object.fromEntries(Object.entries(mm).map(([k, v]) => [`${k}_mobile`, v]));
}

/** A react-query `select` that sets pictures for the current screen. */
export function usePickMedia() {
  const phone = useIsPhone();
  return useCallback(<T,>(value: T): T => pickMedia(value, phone), [phone]);
}
