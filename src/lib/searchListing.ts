// The words a page shows on Google: written automatically from the page itself, used by the shop when the admin
// leaves them empty and shown as a preview in the admin, so both always match.

export interface ListingInput {
  kind: 'product' | 'category' | 'collection' | 'page' | 'note';
  name: string;
  /** Short description, tagline or summary. */
  summary?: string | null;
  /** Longer text; may contain HTML. */
  body?: string | null;
  /** Note names, most important first. */
  notes?: string[];
  family?: string | null;
  sizes?: number[];
  siteName: string;
}

const TITLE_MAX = 60;
const DESC_MAX = 160;
const KIND_WORD = /\b(perfumes?|attars?|fragrances?|oils?|sets?|gifts?)\b/i;

export const fullTitle = (title: string, siteName: string) => `${title} | ${siteName}`;

const plain = (html: string | null | undefined) =>
  String(html ?? '')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** Whole sentences that fit; if even the first is too long, cut at a word and add a full stop. */
function clip(text: string, max = DESC_MAX): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const sentences = t.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let out = '';
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  if (out.trim()) return out.trim();
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\s]+$/, '')}.`;
}

const list = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const sentence = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

export function suggestListing(i: ListingInput): { title: string; description: string } {
  const name = i.name.trim();
  const own = plain(i.summary) || plain(i.body);
  if (i.kind === 'product') {
    const withFamily = i.family ? `${name} – ${i.family} perfume` : name;
    const title = i.family && fullTitle(withFamily, i.siteName).length <= TITLE_MAX ? withFamily : name;
    const parts: string[] = [];
    if (own) parts.push(sentence(clip(own, 110)));
    const notes = (i.notes ?? []).slice(0, 3).map((n) => n.toLowerCase());
    if (notes.length) parts.push(`Notes of ${list(notes)}.`);
    const sizes = [...new Set((i.sizes ?? []).filter((n) => n > 0))].sort((a, b) => a - b);
    if (sizes.length) parts.push(`Available in ${list(sizes.map(String))} ml.`);
    if (!parts.length) parts.push(`${name} by ${i.siteName}.`);
    return { title, description: clip(parts.join(' ')) };
  }
  if (i.kind === 'category') {
    return { title: KIND_WORD.test(name) ? name : `${name} perfumes`, description: own ? clip(own) : `Shop ${name} perfumes by ${i.siteName}.` };
  }
  if (i.kind === 'note') {
    return { title: `${name} perfumes`, description: own ? clip(own) : `Perfumes by ${i.siteName} with ${name}.` };
  }
  return { title: name, description: own ? clip(own) : `${name} at ${i.siteName}.` };
}

/** Plain advice on length, as Google shows about 60 characters of a title and 160 of a description. */
export function lengthAdvice(kind: 'title' | 'description', text: string): { ok: boolean; text: string } {
  const n = text.trim().length;
  if (kind === 'title') {
    if (n > TITLE_MAX) return { ok: false, text: `${n} characters: Google cuts it after about ${TITLE_MAX}. Make it shorter.` };
    return { ok: true, text: `${n} of about ${TITLE_MAX} characters: fits.` };
  }
  if (n > DESC_MAX) return { ok: false, text: `${n} characters: Google cuts it after about ${DESC_MAX}. Make it shorter.` };
  if (n < 70) return { ok: true, text: `${n} characters: a little short; 120–160 tells people more.` };
  return { ok: true, text: `${n} of about ${DESC_MAX} characters: good.` };
}
