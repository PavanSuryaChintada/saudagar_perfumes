import DOMPurify from 'dompurify';

/** Admin-entered rich text is sanitised before it is rendered. */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

export function hasText(html: string | null | undefined): boolean {
  return sanitizeHtml(html).replace(/<[^>]+>/g, '').trim().length > 0;
}
