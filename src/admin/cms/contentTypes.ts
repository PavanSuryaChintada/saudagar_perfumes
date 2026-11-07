import type { FieldDef } from '../../cms/schema';

// The content lists under Admin → Content. Each maps one table onto a schema form.
export interface ContentType {
  table: 'announcements' | 'stories' | 'reels' | 'testimonials' | 'faqs' | 'stockists';
  label: string;
  singular: string;
  description: string;
  titleField: string;
  subtitle?: (row: Record<string, any>) => string;
  thumbField?: string;
  fields: FieldDef[];
  /** Reels: products are stored in reel_products, edited here as product_ids. */
  linksProducts?: boolean;
  /** Query keys the storefront reads this content under. */
  invalidates: string[][];
}

const t = (key: string, label: string, help?: string, placeholder?: string): FieldDef => ({ key, label, type: 'text', help, placeholder });
const ta = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: 'textarea', help });
const active: FieldDef = { key: 'is_active', label: 'Show on the site', type: 'boolean' };

export const CONTENT_TYPES: Record<string, ContentType> = {
  announcements: {
    table: 'announcements',
    label: 'Announcements',
    singular: 'announcement',
    description: 'Messages in the bar above the header. The bar only appears while at least one is on and inside its dates.',
    titleField: 'text',
    subtitle: (r) => [r.starts_at && `from ${new Date(r.starts_at).toLocaleDateString('en-IN')}`, r.ends_at && `until ${new Date(r.ends_at).toLocaleDateString('en-IN')}`].filter(Boolean).join(' '),
    fields: [
      t('text', 'Message', undefined, 'e.g. Free delivery on orders above ₹4,999'),
      { key: 'link', label: 'Link', type: 'link' },
      { key: 'starts_at', label: 'Start showing', type: 'datetime', help: 'Leave empty to start now.' },
      { key: 'ends_at', label: 'Stop showing', type: 'datetime', help: 'Leave empty to keep showing.' },
      active,
    ],
    invalidates: [['bootstrap']],
  },
  stories: {
    table: 'stories',
    label: 'Stories',
    singular: 'story',
    description: 'Full-screen stories opened from the header and menus.',
    titleField: 'title',
    subtitle: (r) => r.tag ?? '',
    thumbField: 'image_url',
    fields: [
      t('title', 'Title', undefined, 'e.g. Oud Roses is here'),
      t('subtitle', 'Subtitle', undefined, 'e.g. Taif rose over aged oud'),
      t('tag', 'Tag', 'A short label, e.g. New drop.'),
      { key: 'image_url', label: 'Image', type: 'media', accept: 'image' },
      { key: 'video_url', label: 'Film (optional)', type: 'media', accept: 'video', help: 'Plays instead of the image.' },
      { key: 'duration_ms', label: 'Seconds on screen', type: 'number', min: 1, max: 60, help: 'For images. Films play to the end.' },
      { key: 'product_id', label: 'Product to shop', type: 'product', by: 'id' },
      active,
    ],
    invalidates: [['cms', 'stories']],
  },
  reels: {
    table: 'reels',
    label: 'Reels',
    singular: 'reel',
    description: 'The Instagram reels strip on the home page.',
    titleField: 'title',
    subtitle: (r) => r.caption ?? '',
    thumbField: 'thumbnail_url',
    linksProducts: true,
    fields: [
      t('title', 'Title', undefined, 'e.g. Behind the bottle'),
      ta('caption', 'Caption'),
      { key: 'video_url', label: 'Film', type: 'media', accept: 'video' },
      { key: 'thumbnail_url', label: 'Cover image', type: 'media', accept: 'image' },
      t('external_url', 'Instagram link', undefined, 'https://www.instagram.com/reel/…'),
      { key: 'product_ids', label: 'Products in this reel', type: 'product', multiple: true, by: 'id' },
      active,
    ],
    invalidates: [['cms', 'reels']],
  },
  testimonials: {
    table: 'testimonials',
    label: 'Testimonials',
    singular: 'testimonial',
    description: 'Quotes in the testimonials section. Only publish words a real customer gave you.',
    titleField: 'name',
    subtitle: (r) => r.quote ?? '',
    fields: [
      ta('quote', 'Quote'),
      t('name', 'Customer name'),
      t('location', 'City'),
      { key: 'rating', label: 'Stars (1–5)', type: 'number', min: 1, max: 5 },
      { key: 'product_id', label: 'Product', type: 'product', by: 'id' },
      active,
    ],
    invalidates: [['cms', 'testimonials']],
  },
  faqs: {
    table: 'faqs',
    label: 'FAQs',
    singular: 'question',
    description: 'Questions shown by FAQ sections. Group them to show different sets on different pages.',
    titleField: 'question',
    subtitle: (r) => r.group_name ?? '',
    fields: [t('question', 'Question', undefined, 'e.g. How long does delivery take?'), { key: 'answer', label: 'Answer', type: 'richtext' }, t('group_name', 'Group', 'e.g. Shipping. FAQ sections can show one group.'), active],
    invalidates: [['cms', 'faqs']],
  },
  stockists: {
    table: 'stockists',
    label: 'Boutiques',
    singular: 'boutique',
    description: 'Boutique cards on the boutiques page. Turn on "Show boutiques" in Site content → Brand to make the page visible.',
    titleField: 'name',
    subtitle: (r) => r.city ?? '',
    thumbField: 'image_url',
    fields: [
      t('name', 'Name', undefined, 'e.g. Saudagar Atelier'),
      t('city', 'City', undefined, 'e.g. Hyderabad'),
      ta('address', 'Address'),
      t('phone', 'Phone'),
      t('hours', 'Opening hours', undefined, 'e.g. 11 am – 9 pm, all days'),
      t('map_url', 'Map link', undefined, 'https://maps.google.com/…'),
      { key: 'image_url', label: 'Photo', type: 'media', accept: 'image' },
      active,
    ],
    invalidates: [['cms', 'stockists']],
  },
};
