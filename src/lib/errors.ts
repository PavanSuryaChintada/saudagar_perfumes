// One place that turns database, auth, storage, payment and network errors into sentences a shopper or an admin
// can act on. Raw technical text (table names, SQL, stack traces) is never shown; it goes to the console instead.

interface ErrorLike {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  status?: unknown;
  statusCode?: unknown;
  name?: unknown;
  error_description?: unknown;
}

export const GENERIC_ERROR = 'Something went wrong. Please try again.';
const TECHNICAL = 'Something went wrong on our side. Please try again, and contact us if it keeps happening.';
const OUTDATED = 'The store was just updated. Refresh the page and try again.';
const SESSION = 'Your session has expired. Please sign in again.';
const PERMISSION = "You don't have permission to do that. If you've been signed in for a while, sign in again.";
const CONNECTION = "We couldn't reach the server. Check your connection and try again.";
const BUSY = 'The store is very busy right now. Please try again in a moment.';
const CONFLICT = 'Someone else changed this at the same moment. Please try again.';

/** Coded SQL exceptions look like "CODE: human sentence" — the sentence is shown as-is. */
const CODED = /^([A-Z][A-Z0-9_]{2,}):\s*(.+)$/s;

/** Database table → what people call it: [one, many]. Link tables name the thing that uses the row. */
const NOUNS: Record<string, [string, string]> = {
  products: ['product', 'products'],
  product_variants: ['size', 'sizes'],
  categories: ['category', 'categories'],
  collections: ['collection', 'collections'],
  notes: ['note', 'notes'],
  attribute_options: ['option', 'options'],
  orders: ['order', 'orders'],
  order_items: ['order', 'orders'],
  coupons: ['coupon', 'coupons'],
  coupon_categories: ['coupon', 'coupons'],
  coupon_excluded_products: ['coupon', 'coupons'],
  coupon_redemptions: ['order', 'orders'],
  welcome_tiers: ['welcome offer', 'welcome offers'],
  pages: ['page', 'pages'],
  website_sections: ['page section', 'page sections'],
  media_assets: ['file', 'files'],
  addresses: ['address', 'addresses'],
  reviews: ['review', 'reviews'],
  returns: ['return', 'returns'],
  refunds: ['refund', 'refunds'],
  stories: ['story', 'stories'],
  reels: ['reel', 'reels'],
  reel_products: ['reel', 'reels'],
  testimonials: ['testimonial', 'testimonials'],
  faqs: ['FAQ', 'FAQs'],
  stockists: ['boutique', 'boutiques'],
  announcements: ['announcement', 'announcements'],
  profiles: ['customer', 'customers'],
  product_categories: ['product', 'products'],
  product_collections: ['product', 'products'],
  product_notes: ['product', 'products'],
  product_attributes: ['product', 'products'],
  product_media: ['product', 'products'],
  inventory_movements: ['stock history entry', 'stock history'],
  wishlists: ['wishlist', 'wishlists'],
  back_in_stock_requests: ['back-in-stock request', 'back-in-stock requests'],
};

/** Column → the label people see on the form. */
const FIELDS: Record<string, string> = {
  slug: 'web address (slug)',
  code: 'code',
  sku: 'SKU',
  email: 'email',
  phone: 'phone number',
  name: 'name',
  label: 'label',
  title: 'title',
  order_number: 'order number',
  pincode: 'pincode',
  key: 'key',
  price: 'price',
  base_price: 'price',
  value: 'value',
  full_name: 'full name',
  line1: 'address',
  city: 'city',
  state: 'state',
  size_ml: 'size',
  stock: 'stock',
  url: 'link',
  path: 'file',
};

const noun = (table: string, many = false) => {
  const n = NOUNS[table];
  return n ? n[many ? 1 : 0] : many ? 'other records' : 'item';
};
const field = (column: string) => FIELDS[column] ?? column.replace(/_/g, ' ');
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Words that mean a message is for developers, not people. */
const TECH = /relation "|column "|constraint "|syntax|violates|\bschema\b|operator does not exist|null value|PGRST|\bJSON\b|undefined|TypeError|ReferenceError|Cannot read|is not a function|Unexpected token|\bSQL\b|duplicate key|pg_|::|\bfunction\b.*\(|stack|ECONN|ENOTFOUND|status code/i;

function fromAuth(code: string, message: string): string | null {
  switch (code) {
    case 'invalid_credentials':
      return "That email and password don't match.";
    case 'email_exists':
    case 'user_already_exists':
      return 'An account with this email already exists. Try signing in instead.';
    case 'email_not_confirmed':
      return 'Please confirm your email address first. Check your inbox for our link.';
    case 'same_password':
      return 'Your new password must be different from the current one.';
    case 'over_email_send_rate_limit':
      return "We've sent several emails just now. Please wait a few minutes before asking again.";
    case 'over_request_rate_limit':
    case 'over_sms_send_rate_limit':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'email_address_invalid':
    case 'email_address_not_authorized':
      return 'Enter a valid email address.';
    case 'signup_disabled':
      return 'New accounts are paused right now. Please try again later.';
    case 'session_not_found':
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
    case 'session_expired':
    case 'bad_jwt':
      return SESSION;
    case 'user_not_found':
      return "We couldn't find an account with that email.";
    case 'otp_expired':
      return 'This link has expired. Ask for a new one.';
    case 'reauthentication_needed':
      return 'For security, please sign in again before changing your password.';
    case 'captcha_failed':
      return "Please complete the 'I'm not a robot' check again.";
    case 'weak_password':
      return weakPassword(message);
    default:
      return null;
  }
}

function weakPassword(message: string): string {
  if (/pwned|leak|known to be weak|easy to guess/i.test(message)) return 'That password has appeared in a data leak. Please choose a different one.';
  if (/character of each|characters/i.test(message)) return 'Use at least 8 characters, with both letters and numbers.';
  return 'Please choose a longer password (at least 8 characters).';
}

/** Postgres / PostgREST error codes. */
function fromDatabase(code: string, message: string, details: string): string | null {
  switch (code) {
    case '23505': {
      const key = details.match(/Key \((.+?)\)=\((.*?)\) already exists/);
      if (key && !key[1].includes(',')) {
        return `That ${field(key[1])} “${key[2]}” is already used. Choose a different one.`;
      }
      return 'That already exists. Change it slightly and try again.';
    }
    case '23503': {
      const del = message.match(/update or delete on table "(\w+)" violates foreign key constraint "[^"]+" on table "(\w+)"/);
      if (del && del[1] === del[2]) {
        return del[1] === 'categories'
          ? 'This category still has sub-categories. Move or delete them first.'
          : `This ${noun(del[1])} still has others linked to it. Move or delete those first.`;
      }
      if (del) {
        return `This ${noun(del[1])} is still used by ${noun(del[2], true)}. Remove it from those first, or switch it off instead of deleting it.`;
      }
      return 'Something this refers to no longer exists. Refresh the page and try again.';
    }
    case '23502': {
      const col = message.match(/column "(\w+)"/);
      return col ? `${capital(field(col[1]))} is required.` : 'Fill in the required fields.';
    }
    case '23514':
      return checkConstraint(message);
    case '22P02': {
      const type = message.match(/invalid input syntax for type (\w+)/)?.[1] ?? '';
      if (/int|numeric|real|double|decimal/.test(type)) return 'Enter a number.';
      if (type === 'uuid') return 'That link looks broken. Refresh the page and try again.';
      if (/date|time/.test(type)) return 'Enter a valid date.';
      if (type === 'boolean') return 'Choose yes or no.';
      if (/json/.test(type)) return "That data isn't in the right format.";
      return "One of the values isn't in the right format.";
    }
    case '22001':
      return 'That text is too long. Shorten it and try again.';
    case '22003':
      return 'That number is too large.';
    case '22007':
    case '22008':
      return 'Enter a valid date.';
    case '40001':
    case '40P01':
    case '55P03':
      return CONFLICT;
    case '57014':
      return 'That took too long. Please try again, or narrow your search.';
    case '53300':
    case '53400':
    case 'PGRST000':
    case 'PGRST001':
    case 'PGRST002':
      return BUSY;
    case '42501':
      return PERMISSION;
    case '42883':
    case '42P01':
    case '42703':
    case 'PGRST202':
    case 'PGRST204':
    case 'PGRST205':
      return OUTDATED;
    case 'PGRST116':
      return "We couldn't find that. It may have been deleted; refresh the page.";
    case 'PGRST301':
    case 'PGRST302':
    case 'PGRST303':
      return SESSION;
    case 'PGRST100':
    case 'PGRST102':
      return "That search uses characters we can't look for. Try different words.";
    default:
      return null;
  }
}

function checkConstraint(message: string): string {
  const name = message.match(/check constraint "(\w+)"/)?.[1] ?? '';
  if (/price|amount|total|fee/.test(name)) return 'Amounts must be ₹0 or more.';
  if (/stock|qty|quantity/.test(name)) return "Stock and quantities can't go below 0.";
  if (/percent|discount|value/.test(name)) return 'Check the discount: above 0, and at most 100 for a percentage.';
  if (/email/.test(name)) return 'Enter a valid email address.';
  if (/phone/.test(name)) return 'Enter a valid 10-digit mobile number.';
  if (/pincode/.test(name)) return 'Enter a valid 6-digit pincode.';
  if (/rating/.test(name)) return 'Choose a rating from 1 to 5.';
  if (/expires|starts|date/.test(name)) return 'The end date must be after the start date.';
  if (/weight/.test(name)) return 'Enter a share from 0 to 100.';
  if (/len|length|details|body|media/.test(name)) return 'That is too long, or has too many files. Shorten it and try again.';
  if (/slug|code|format/.test(name)) return 'Use only letters, numbers and dashes.';
  return "One of the values isn't allowed. Check the form and try again.";
}

function fromMessage(message: string): string | null {
  const known: Array<[RegExp, string | ((m: RegExpMatchArray) => string)]> = [
    [/invalid login credentials/i, "That email and password don't match."],
    [/user already registered|already been registered/i, 'An account with this email already exists. Try signing in instead.'],
    [/email not confirmed/i, 'Please confirm your email address first. Check your inbox for our link.'],
    [/password should|weak password|password is known/i, (m) => weakPassword(m.input ?? '')],
    [/should be different from the old password/i, 'Your new password must be different from the current one.'],
    [/only request this after (\d+) seconds?/i, (m) => `For security, please wait ${m[1]} seconds before trying again.`],
    [/email rate limit|over_email_send_rate_limit/i, "We've sent several emails just now. Please wait a few minutes before asking again."],
    [/rate limit|too many requests/i, 'Too many attempts. Please wait a minute and try again.'],
    [/(unable to validate email|email address .* is invalid|invalid email)/i, 'Enter a valid email address.'],
    [/signups? not allowed/i, 'New accounts are paused right now. Please try again later.'],
    [/(link|token) (is invalid or )?has expired|expired or is invalid/i, 'This link has expired. Ask for a new one.'],
    [/jwt expired|invalid jwt|refresh token|auth session missing/i, SESSION],
    [/row-level security|permission denied/i, PERMISSION],
    [/exceeded the maximum allowed size|payload too large|entity too large/i, 'That file is too big. Use a smaller one (photos under 10 MB, videos under 50 MB).'],
    [/mime type .* is not supported|invalid mime|file type/i, "That file type isn't supported. Use JPG, PNG or WebP for photos, or MP4 for video."],
    [/the resource already exists/i, 'A file with that name already exists. Rename it and try again.'],
    [/object not found/i, 'That file no longer exists.'],
    [/invalid ?key/i, "The file name has characters we can't use. Rename it and try again."],
    [/could not find the (function|.* column)|schema cache/i, OUTDATED],
    [/multiple \(or no\) rows returned|contains 0 rows/i, "We couldn't find that. It may have been deleted; refresh the page."],
    [/deadlock|could not serialize/i, CONFLICT],
    [/statement timeout|canceling statement/i, 'That took too long. Please try again, or narrow your search.'],
    [/too many connections|remaining connection slots/i, BUSY],
    [/failed to send a request to the edge function|relay error/i, CONNECTION],
    [/failed to fetch|network ?error|load failed|fetch failed|err_internet|err_network/i, CONNECTION],
    [/abort|timed? ?out/i, 'That took too long. Check your connection and try again.'],
  ];
  for (const [pattern, out] of known) {
    const m = message.match(pattern);
    if (m) return typeof out === 'string' ? out : out(m);
  }
  return null;
}

function fromStatus(status: number): string | null {
  if (status === 401) return SESSION;
  if (status === 403) return PERMISSION;
  if (status === 404) return "We couldn't find that. It may have been deleted; refresh the page.";
  if (status === 409) return CONFLICT;
  if (status === 413) return 'That file is too big. Use a smaller one.';
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (status >= 500) return 'The server had a problem. Please try again in a minute.';
  return null;
}

export function toFriendlyError(err: unknown): string {
  if (!err) return GENERIC_ERROR;
  const e = (typeof err === 'object' ? err : {}) as ErrorLike;
  const message = typeof err === 'string' ? err : typeof e.message === 'string' ? e.message : typeof e.error_description === 'string' ? e.error_description : '';
  const code = typeof e.code === 'string' ? e.code : '';
  const details = typeof e.details === 'string' ? e.details : '';

  const coded = message.match(CODED);
  if (coded) return coded[2].trim();

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return "You're offline. Reconnect and try again.";

  const friendly =
    (code && (fromDatabase(code, message, details) ?? fromAuth(code, message))) ||
    fromMessage(message) ||
    fromStatus(Number(e.status ?? e.statusCode ?? 0));
  if (friendly) return friendly;

  if (message && !TECH.test(message) && message.length <= 300) return message;
  if (message && typeof console !== 'undefined') console.warn('[error]', err);
  return message ? TECHNICAL : GENERIC_ERROR;
}
