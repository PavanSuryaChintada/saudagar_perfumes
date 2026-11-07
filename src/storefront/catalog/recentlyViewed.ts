const KEY = 'saudagar_recently_viewed';

export function pushRecent(list: string[], slug: string, max = 8): string[] {
  const clean = Array.isArray(list) ? list.filter((s) => typeof s === 'string' && s !== slug) : [];
  return [slug, ...clean].slice(0, max);
}

export function readRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

/** Records a product view and returns the other recently viewed slugs (newest first). */
export function recordView(slug: string): string[] {
  const next = pushRecent(readRecent(), slug);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode); recently viewed simply stays empty
  }
  return next.filter((s) => s !== slug);
}
