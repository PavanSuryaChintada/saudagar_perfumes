// One place that turns database, auth and network errors into sentences a shopper or admin can act on.

const KNOWN: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "That email and password don't match."],
  [/user already registered|already been registered/i, 'An account with this email already exists. Try signing in instead.'],
  [/email not confirmed/i, 'Please confirm your email address first.'],
  [/password should be at least|weak password/i, 'Please choose a longer password (at least 8 characters).'],
  [/rate limit|too many requests|over_email_send_rate_limit/i, 'Too many attempts. Please wait a minute and try again.'],
  [/failed to fetch|network ?error|load failed/i, "We couldn't reach the server. Check your connection and try again."],
  [/jwt expired|invalid jwt|refresh token/i, 'Your session has expired. Please sign in again.'],
  [/duplicate key value/i, 'That already exists.'],
  [/row-level security|permission denied/i, "You don't have permission to do that."],
];

/** Coded SQL exceptions look like "CODE: human sentence" — the sentence is shown as-is. */
const CODED = /^([A-Z][A-Z0-9_]{2,}):\s*(.+)$/s;

export function toFriendlyError(err: unknown): string {
  const fallback = 'Something went wrong. Please try again.';
  if (!err) return fallback;
  const e = err as { message?: unknown; code?: unknown; error_description?: unknown };
  const message = typeof err === 'string' ? err : typeof e.message === 'string' ? e.message : '';
  const coded = message.match(CODED);
  if (coded) return coded[2].trim();
  if (e.code === '42501') return "You don't have permission to do that.";
  for (const [pattern, friendly] of KNOWN) {
    if (pattern.test(message)) return friendly;
  }
  return message || fallback;
}
