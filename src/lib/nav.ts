/** Only same-site paths are allowed as post-login destinations. */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  return next;
}
