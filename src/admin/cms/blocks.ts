import type { FieldDef } from '../../cms/schema';
import { SHOP_WORD_FIELDS } from '../../cms/shopWords';

// Site-wide content blocks (site_blocks table), edited in Admin → Site content.
const t = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: 'text', help });
const ta = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: 'textarea', help });
const media = (key: string, label: string, accept?: 'image' | 'video', help?: string): FieldDef => ({ key, label, type: 'media', accept, help });
const link = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: 'link', help });
const color = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: 'color', help });

const ACTIONS = [
  { value: 'link', label: 'Go to a link' },
  { value: 'stories', label: 'Open the stories viewer' },
  { value: 'wishlist', label: 'Open the wishlist' },
  { value: 'account', label: 'Open the account' },
  { value: 'stores', label: 'Show boutiques' },
];
const action: FieldDef = { key: 'action', label: 'When clicked', type: 'select', options: ACTIONS };
const actionLink: FieldDef = { ...link('link', 'Link'), showIf: { field: 'action', in: ['link', '', undefined] } };

export interface BlockDef {
  label: string;
  description: string;
  fields: FieldDef[];
}

export const BLOCK_SCHEMAS: Record<string, BlockDef> = {
  theme: {
    label: 'Theme',
    description: 'Brand colours and fonts used across the whole store.',
    fields: [
      color('accent', 'Accent colour', 'Buttons, links and highlights in light mode.'),
      color('accent_night', 'Accent colour (dark mode)'),
      color('gold', 'Gold'),
      color('ink', 'Text colour'),
      color('night', 'Dark background'),
      { key: 'font_body', label: 'Body font', type: 'font' },
      { key: 'font_display', label: 'Display font (serif headings)', type: 'font' },
    ],
  },
  brand: {
    label: 'Brand & contact',
    description: 'Logos, contact details and the boutiques switch.',
    fields: [
      t('name', 'Store name'),
      t('legal_name', 'Legal business name', 'Shown on invoices.'),
      media('logo_light_bg', 'Logo on light backgrounds', 'image'),
      media('logo_dark_bg', 'Logo on dark backgrounds', 'image'),
      media('logo_on_image', 'Logo over photos and films', 'image'),
      media('favicon', 'Browser tab icon', 'image', 'A square PNG, 64×64 or larger.'),
      t('support_email', 'Support email'),
      t('support_phone', 'Support phone'),
      t('support_hours', 'Support hours'),
      ta('address', 'Business address'),
      t('whatsapp', 'WhatsApp number', 'Country code and number, digits only, e.g. 918448441388. Used by the chat button.'),
      t('instagram', 'Instagram link'),
      t('youtube', 'YouTube link'),
      link('shop_link', '"Shop all" buttons go to', 'Explore, Continue shopping and empty-bag buttons. Leave empty to show every product.'),
      { key: 'show_preloader', label: 'Play the logo intro', type: 'boolean', help: 'The short logo animation when the site first opens.' },
      { key: 'show_boutiques', label: 'Show boutiques', type: 'boolean', help: 'Turns on the boutiques page and buttons.' },
      { ...ta('boutiques_message', 'Message when boutiques are hidden'), showIf: { field: 'show_boutiques', truthy: false } },
    ],
  },
  seo: {
    label: 'SEO',
    description: 'The default title, description and share image for search engines and social links.',
    fields: [t('default_title', 'Default page title'), ta('default_description', 'Default description'), media('og_image', 'Share image', 'image', '1200×630 works best.')],
  },
  announcement_bar: {
    label: 'Announcement bar',
    description: 'The bulletin panel that opens from the bar. The bar text itself comes from Content → Announcements.',
    fields: [
      t('bulletins_heading', 'Panel heading'),
      { key: 'bulletins', label: 'Bulletins', type: 'list', itemLabel: 'Bulletin', fields: [t('text', 'Text'), link('link', 'Link')] },
      { key: 'tags', label: 'Tags', type: 'strings' },
    ],
  },
  mega_nav: {
    label: 'Menu',
    description: 'The full-screen menu opened from the header.',
    fields: [
      {
        key: 'items',
        label: 'Main entries',
        type: 'list',
        itemLabel: 'Entry',
        fields: [
          t('title', 'Title'), t('numeral', 'Number', 'e.g. 01'), t('subtitle', 'Subtitle'), link('link', 'Link'),
          t('count_label', 'Count label', 'e.g. 12 Flacons'), t('concentration', 'Concentration line'), media('image', 'Image', 'image'), media('video', 'Film', 'video'),
        ],
      },
      t('accords_heading', 'Accords heading'),
      { key: 'accords', label: 'Accord links', type: 'list', itemLabel: 'Accord', fields: [t('label', 'Label'), link('link', 'Link')] },
      { key: 'quick_cards', label: 'Quick cards', type: 'list', itemLabel: 'Card', fields: [t('title', 'Title'), t('kicker', 'Small label'), t('subtitle', 'Subtitle'), link('link', 'Link')] },
      { key: 'secondary_links', label: 'Secondary links', type: 'list', itemLabel: 'Link', fields: [t('label', 'Label'), action, actionLink] },
      media('feature_badge_video', 'Feature film', 'video'),
      media('feature_badge_image', 'Feature image', 'image'),
      t('feature_cta_prefix', 'Feature button prefix'),
      { key: 'feature_secondary_cta', label: 'Feature second button', type: 'group', fields: [t('label', 'Button text'), link('link', 'Link')] },
      {
        key: 'side_cells',
        label: 'Side tiles',
        type: 'list',
        itemLabel: 'Tile',
        fields: [t('title', 'Title'), t('badge', 'Badge'), t('subtitle', 'Subtitle'), media('image', 'Image', 'image'), media('video', 'Film', 'video'), t('cta_label', 'Button text'), link('link', 'Link')],
      },
      t('footer_text', 'Menu footer line'),
    ],
  },
  mobile_drawer: {
    label: 'Mobile menu',
    description: 'The side drawer on phones.',
    fields: [
      { key: 'highlight', label: 'Highlight link', type: 'group', fields: [t('label', 'Label'), t('badge', 'Badge'), link('link', 'Link')] },
      { key: 'all_link', label: '"Shop all" link', type: 'group', fields: [t('label', 'Label'), link('link', 'Link')] },
      { key: 'collections', label: 'Collection links', type: 'list', itemLabel: 'Link', fields: [t('label', 'Label'), t('count_label', 'Count label'), link('link', 'Link')] },
      { key: 'utility_links', label: 'Utility links', type: 'list', itemLabel: 'Link', fields: [t('label', 'Label'), t('icon', 'Icon (emoji)'), action, actionLink] },
      t('theme_label', 'Theme switch label'),
      { key: 'footer_lines', label: 'Footer lines', type: 'strings' },
    ],
  },
  footer: {
    label: 'Footer',
    description: 'Newsletter, link columns, legal links and badges.',
    fields: [
      t('newsletter_eyebrow', 'Newsletter small heading'),
      t('newsletter_heading', 'Newsletter heading'),
      ta('newsletter_text', 'Newsletter text'),
      t('newsletter_placeholder', 'Email box placeholder'),
      t('newsletter_button', 'Subscribe button'),
      t('newsletter_success', 'Message after subscribing'),
      {
        key: 'columns',
        label: 'Link columns',
        type: 'list',
        itemLabel: 'Column',
        fields: [t('heading', 'Heading'), { key: 'links', label: 'Links', type: 'list', itemLabel: 'Link', fields: [t('label', 'Label'), action, actionLink] }],
      },
      ta('creed', 'Brand line'),
      t('theme_light_label', 'Light mode label'),
      t('theme_dark_label', 'Dark mode label'),
      t('back_to_top', '"Back to top" text'),
      t('copyright', 'Copyright line', 'Use {year} for the current year.'),
      { key: 'legal_links', label: 'Legal links', type: 'list', itemLabel: 'Link', fields: [t('label', 'Label'), link('link', 'Link')] },
      { key: 'badges', label: 'Badges', type: 'strings' },
    ],
  },
  product_page: {
    label: 'Product page',
    description: 'Titles of the product page sections, and sections every product shows unless it opts out.',
    fields: [
      t('profile_title', 'Scent profile section title', 'e.g. Scent Profile'),
      t('profile_note', 'Small print under the scent profile', 'e.g. Longevity and sillage are our own guidance.'),
      t('story_title', 'Story section title', 'e.g. The Story'),
      t('compliance_title', 'Details section title', 'e.g. Details & Compliance'),
      t('delivery_title', 'Delivery section title', 'e.g. Delivery & Free Samples'),
      t('surface_note', 'Note for surface-only products', 'Shown in the delivery section for flammable perfume.'),
      {
        key: 'default_sections',
        label: 'Sections on every product',
        type: 'list',
        itemLabel: 'Section',
        help: 'A product can switch these off and add its own in the product editor.',
        fields: [t('title', 'Title', 'e.g. How to store your perfume'), { key: 'body', label: 'Text', type: 'richtext' }],
      },
    ],
  },
  shop_words: {
    label: 'Shop words',
    description: 'The fixed wording around the shop: the bag, buttons, empty pages, checkout, wishlist and the page-not-found page. Leave a box empty to keep the wording shown under it.',
    fields: SHOP_WORD_FIELDS.map((f) => t(f.key, f.label, `Now: ${f.fallback}`)),
  },
  search: {
    label: 'Search',
    description: 'Suggestions shown when the search panel opens.',
    fields: [t('popular_heading', 'Suggestions heading'), { key: 'popular', label: 'Suggested searches', type: 'strings' }],
  },
  stories_viewer: {
    label: 'Stories viewer',
    description: 'The full-screen stories player. The stories themselves are under Content → Stories.',
    fields: [t('cta_label', 'Product button text')],
  },
};
