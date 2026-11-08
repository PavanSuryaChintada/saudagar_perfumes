/** Only same-site paths are allowed as post-login destinations. */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  // Browsers drop tabs and newlines and decode %2F, so "/\t/evil.com" or "/%2F/evil.com" can turn into //evil.com.
  let decoded = next;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F\s]/.test(decoded.split('?')[0]) || /^\/[\\/]/.test(decoded)) return fallback;
  return next;
}
