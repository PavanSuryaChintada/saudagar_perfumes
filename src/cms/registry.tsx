// The section registry: every section type the page builder offers — its component, admin label,
// description and the field schema the admin form is generated from. Adding a section type means adding
// a component and an entry here; nothing else.
import type { ComponentType } from 'react';
import type { FieldDef } from './schema';
import BluorngHero from '../components/BluorngHero.jsx';
import LuxuryKineticMarquee from '../components/motion/LuxuryKineticMarquee.jsx';
import BluorngCategories from '../components/BluorngCategories.jsx';
import BluorngFeaturedCollection from '../components/BluorngFeaturedCollection.jsx';
import AnimatedCampaignBanner from '../components/AnimatedCampaignBanner.jsx';
import BluorngCustomExclusive from '../components/BluorngCustomExclusive.jsx';
import BluorngGalleryHero from '../components/BluorngGalleryHero.jsx';
import BluorngSignatureCollection from '../components/BluorngSignatureCollection.jsx';
import BluorngEditorial from '../components/BluorngEditorial.jsx';
import BluorngTestimonials from '../components/BluorngTestimonials.jsx';
import BluorngInstagramReels from '../components/BluorngInstagramReels.jsx';
import BluorngFooterAccordions from '../components/BluorngFooterAccordions.jsx';
import BluorngStores from '../components/BluorngStores.jsx';
import { StoryClosing, StoryHero, StorySplit, StoryTenets, StoryTimeline } from '../storefront/sections/StorySections.jsx';
import { FaqSection, NewsletterSection, PromiseStrip, PromoBanner, PROMISE_ICONS, RichTextSection, ShopByNote } from '../storefront/sections/ExtraSections.jsx';

export interface SectionDef {
  label: string;
  description: string;
  component: ComponentType<any>;
  fields: FieldDef[];
}

const t = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: 'text', help });
const ta = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: 'textarea', help });
const media = (key: string, label: string, accept?: 'image' | 'video', help?: string): FieldDef => ({ key, label, type: 'media', accept, help });
const link = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: 'link', help });
const cta = (key: string, label: string): FieldDef => ({ key, label, type: 'group', fields: [t('label', 'Button text'), link('link', 'Button link')] });
const header = [t('eyebrow', 'Small heading'), t('heading', 'Heading'), ta('text', 'Text')];

function KineticMarqueeSection({ config = {} }: { config?: Record<string, any> }) {
  const items = (config.items || []).filter(Boolean);
  if (!items.length) return null;
  return <LuxuryKineticMarquee items={items} speed={Number(config.speed) || 40} reverse={!!config.reverse} />;
}

export const SECTION_TYPES: Record<string, SectionDef> = {
  hero_video_carousel: {
    label: 'Video hero',
    description: 'Full-screen films with a film switcher, sound toggle and one button.',
    component: BluorngHero,
    fields: [
      { key: 'slides', label: 'Films', type: 'list', itemLabel: 'Film', fields: [t('label', 'Short label', 'Shown in the film switcher, e.g. Palace'), t('title', 'Title (for screen readers)'), media('video', 'Video', 'video')] },
      media('fallback_image', 'Image while films load (desktop)', 'image'),
      media('fallback_image_mobile', 'Image while films load (mobile)', 'image'),
      t('fallback_alt', 'Image description'),
      t('cta_label', 'Button text'),
      link('cta_link', 'Button link', 'Leave empty to scroll to the next section.'),
    ],
  },
  kinetic_marquee: {
    label: 'Scrolling text ribbon',
    description: 'A slow, endless line of phrases.',
    component: KineticMarqueeSection,
    fields: [
      { key: 'items', label: 'Phrases', type: 'strings', placeholder: 'Add a phrase' },
      { key: 'speed', label: 'Speed (seconds per loop)', type: 'number', min: 10, max: 120 },
      { key: 'reverse', label: 'Scroll the other way', type: 'boolean' },
    ],
  },
  category_tiles: {
    label: 'Category tiles',
    description: 'Shop-by-category list with a large image for the hovered tile.',
    component: BluorngCategories,
    fields: [
      t('eyebrow', 'Small heading'), t('heading', 'Heading'), t('view_all_label', '"View all" text'), link('view_all_link', '"View all" link'),
      t('cta_label', 'Tile button text'), t('notes_label', 'Notes label'),
      { key: 'items', label: 'Tiles', type: 'list', itemLabel: 'Tile', fields: [
        t('numeral', 'Numeral'), t('title', 'Title'), t('subtitle', 'Subtitle'), t('count_label', 'Count label', 'e.g. 8 Formulations'),
        ta('description', 'Description'), t('notes', 'Notes line'), t('concentration', 'Concentration line'), media('image', 'Image', 'image'), link('link', 'Link'),
      ] },
    ],
  },
  product_carousel: {
    label: 'Product row (latest drop)',
    description: 'A heading with a grid of products from a collection, category or hand-picked list.',
    component: BluorngFeaturedCollection,
    fields: [...header, t('side_label', 'Side label'), t('cta_label', 'Button text'), link('cta_link', 'Button link'), { key: 'source', label: 'Products', type: 'product_source' }],
  },
  product_showcase: {
    label: 'Product showcase (coffrets)',
    description: 'A dark showcase of products, e.g. discovery sets.',
    component: BluorngCustomExclusive,
    fields: [...header, t('side_label', 'Side label'), t('cta_label', 'Button text'), link('cta_link', 'Button link'), { key: 'source', label: 'Products', type: 'product_source' }],
  },
  product_grid_tabs: {
    label: 'Product grid with tabs',
    description: 'Products with filter tabs; each tab has its own product source.',
    component: BluorngSignatureCollection,
    fields: [...header, { key: 'tabs', label: 'Tabs', type: 'list', itemLabel: 'Tab', fields: [t('label', 'Tab name'), { key: 'source', label: 'Products', type: 'product_source' }] }],
  },
  campaign_banner_animated: {
    label: 'Campaign film banner',
    description: 'A background film with an animated headline, notes strip and two buttons.',
    component: AnimatedCampaignBanner,
    fields: [
      t('kicker', 'Small heading'), t('headline', 'Headline'), t('italic_word', 'Word shown in italics'), t('subheading', 'Sub-heading'), ta('text', 'Text'),
      { key: 'notes', label: 'Notes strip', type: 'strings' }, media('video', 'Background video', 'video'), media('image', 'Background image (if no video)', 'image'),
      cta('primary_cta', 'Main button'), cta('secondary_cta', 'Second button'), t('badge', 'Badge'),
    ],
  },
  gallery_tiles: {
    label: 'Three editorial tiles',
    description: 'Three large image tiles that link anywhere.',
    component: BluorngGalleryHero,
    fields: [...header, t('side_label', 'Side label'), { key: 'tiles', label: 'Tiles', type: 'list', itemLabel: 'Tile', max: 3, fields: [t('kicker', 'Small label'), t('title', 'Title'), t('subtitle', 'Caption'), media('image', 'Image', 'image'), link('link', 'Link')] }],
  },
  editorial_story: {
    label: 'Brand statement & bento',
    description: 'A large statement, four bento tiles and three collection entry cards.',
    component: BluorngEditorial,
    fields: [
      t('eyebrow', 'Small heading'), t('statement', 'Statement', 'Put *words in asterisks* to show them in italics.'), ta('intro', 'Intro text'),
      { key: 'atelier', label: 'Large image tile', type: 'group', fields: [t('kicker', 'Small label'), t('title', 'Title'), media('image', 'Image', 'image'), link('link', 'Link')] },
      { key: 'stat', label: 'Number tile', type: 'group', fields: [t('kicker', 'Small label'), t('number', 'Number'), t('caption', 'Caption')] },
      { key: 'sourcing', label: 'Sourcing tile', type: 'group', fields: [t('kicker', 'Small label'), t('title', 'Title'), media('image', 'Image', 'image')] },
      { key: 'craft', label: 'Text tile', type: 'group', fields: [t('kicker', 'Small label'), t('text', 'Text', 'Put *words in asterisks* to show them in italics.')] },
      t('entries_heading', 'Entry cards heading'), t('view_all_label', '"View all" text'), link('view_all_link', '"View all" link'),
      { key: 'entries', label: 'Entry cards', type: 'list', itemLabel: 'Card', fields: [t('title', 'Title'), t('note', 'Note'), media('image', 'Image', 'image'), link('link', 'Link')] },
    ],
  },
  testimonials: {
    label: 'Testimonials',
    description: 'Rotating customer quotes. Manage the quotes under Content → Testimonials.',
    component: BluorngTestimonials,
    fields: [],
  },
  instagram_reels: {
    label: 'Instagram reels',
    description: 'An endless strip of reels. Manage the reels under Content → Reels.',
    component: BluorngInstagramReels,
    fields: [
      t('handle', 'Handle'), t('handle_note', 'Handle note'), t('heading', 'Heading'), ta('text', 'Text'), t('follow_label', 'Follow button text'), t('follow_url', 'Follow link (Instagram URL)'),
      t('tags_label', 'Tags label'), { key: 'tags', label: 'Tags', type: 'strings' }, t('episodes_label', 'Stories button text'),
    ],
  },
  seo_accordion: {
    label: 'Brand text & popular searches',
    description: 'A text block with "read more" and tabs of popular searches.',
    component: BluorngFooterAccordions,
    fields: [
      t('eyebrow', 'Small heading'), t('heading', 'Heading'), { key: 'intro', label: 'Intro', type: 'richtext' }, { key: 'more', label: '"Read more" text', type: 'richtext' },
      t('read_more_label', '"Read more" button'), t('read_less_label', '"Read less" button'), t('searches_heading', 'Searches heading'),
      { key: 'search_tabs', label: 'Search tabs', type: 'list', itemLabel: 'Tab', fields: [t('label', 'Tab name'), { key: 'terms', label: 'Searches', type: 'list', itemLabel: 'Search', fields: [t('label', 'Shown as'), t('query', 'Searches for')] }] },
    ],
  },
  story_hero: {
    label: 'Story: hero',
    description: 'Centred heading, intro and a wide image with a caption.',
    component: StoryHero,
    fields: [...header, media('image', 'Image', 'image'), t('image_kicker', 'Image label'), t('image_caption', 'Image caption')],
  },
  story_tenets: {
    label: 'Story: pillars',
    description: 'Numbered pillars in two columns.',
    component: StoryTenets,
    fields: [t('eyebrow', 'Small heading'), t('heading', 'Heading'), { key: 'items', label: 'Pillars', type: 'list', itemLabel: 'Pillar', fields: [t('num', 'Number'), t('title', 'Title'), ta('text', 'Text')] }],
  },
  story_timeline: {
    label: 'Story: timeline',
    description: 'Dated chapters on a vertical line.',
    component: StoryTimeline,
    fields: [...header, { key: 'chapters', label: 'Chapters', type: 'list', itemLabel: 'Chapter', fields: [t('year', 'Year'), t('subtitle', 'Subtitle'), t('title', 'Title'), ta('body', 'Text')] }],
  },
  story_split: {
    label: 'Image & text',
    description: 'An image beside a heading, text and a quote.',
    component: StorySplit,
    fields: [media('image', 'Image', 'image'), t('image_caption', 'Image caption'), ...header, t('quote', 'Quote')],
  },
  story_closing: {
    label: 'Closing quote',
    description: 'A centred quote with an attribution and a button.',
    component: StoryClosing,
    fields: [ta('quote', 'Quote'), t('attribution', 'Attribution'), cta('cta', 'Button')],
  },
  stockists: {
    label: 'Boutiques',
    description: 'Boutique cards. Manage the boutiques under Content → Stockists.',
    component: BluorngStores,
    fields: [t('watermark', 'Background word'), t('badge', 'Badge'), t('script_line', 'Script line'), t('heading', 'Heading'), ta('text', 'Text'), t('side_label', 'Side label'), t('directions_label', 'Directions link text')],
  },
  promise_strip: {
    label: 'Promise strip',
    description: 'Three or four reassurance points with icons.',
    component: PromiseStrip,
    fields: [{ key: 'items', label: 'Points', type: 'list', itemLabel: 'Point', max: 4, fields: [
      { key: 'icon', label: 'Icon', type: 'select', options: PROMISE_ICONS.map((v: string) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
      t('title', 'Title'), ta('text', 'Text'),
    ] }],
  },
  promo_banner: {
    label: 'Promo banner',
    description: 'A full-width image with a centred message and button.',
    component: PromoBanner,
    fields: [t('eyebrow', 'Small heading'), t('heading', 'Heading'), ta('text', 'Text'), media('image', 'Background image', 'image'), cta('cta', 'Button')],
  },
  shop_by_note: {
    label: 'Shop by note',
    description: 'Round ingredient tiles linking to each note page.',
    component: ShopByNote,
    fields: [t('eyebrow', 'Small heading'), t('heading', 'Heading'), t('all_label', '"All notes" text'), { key: 'notes', label: 'Notes (links)', type: 'strings', help: 'Note links, e.g. taif-rose-petals. Leave empty to show notes that have photos.' }, { key: 'limit', label: 'How many (when automatic)', type: 'number', min: 1, max: 16 }],
  },
  faq: {
    label: 'FAQ',
    description: 'Questions and answers from Content → FAQs.',
    component: FaqSection,
    fields: [t('heading', 'Heading'), t('group', 'Only this group', 'Leave empty to show every FAQ.')],
  },
  rich_text: {
    label: 'Text',
    description: 'A heading with formatted text.',
    component: RichTextSection,
    fields: [t('heading', 'Heading'), { key: 'body', label: 'Text', type: 'richtext' }],
  },
  newsletter: {
    label: 'Newsletter sign-up',
    description: 'An email sign-up form.',
    component: NewsletterSection,
    fields: [t('heading', 'Heading'), ta('text', 'Text'), t('placeholder', 'Email placeholder'), t('button_label', 'Button text'), t('success', 'Thank-you message')],
  },
};
