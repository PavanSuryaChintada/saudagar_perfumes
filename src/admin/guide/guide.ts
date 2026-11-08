// The admin guide: what to do, in which order, and where. Shown in full on /admin/guide and, per page, in the
// "How this page works" panel. Each section names the admin pages it belongs to.

export interface GuideLink {
  to: string;
  label: string;
}

export interface GuideStep {
  text: string;
  link?: GuideLink;
}

export type GuideCheck = 'setup' | 'categories' | 'scent' | 'notes' | 'collections' | 'products' | 'samples' | 'website' | 'orders' | 'coupons';

export interface GuideSection {
  id: string;
  title: string;
  /** One line: why this matters. */
  why: string;
  /** Admin paths this section explains (a path also matches its sub-pages). */
  routes: string[];
  steps: GuideStep[];
  tip?: string;
  optional?: boolean;
  check?: GuideCheck;
}

export const GUIDE: GuideSection[] = [
  {
    id: 'setup',
    title: 'Set up the store',
    why: 'Business details print on every invoice; payment and delivery rules decide what customers can do at checkout.',
    routes: ['/admin/settings', '/admin/shipping', '/admin/invoice'],
    check: 'setup',
    steps: [
      { text: 'Invoice: legal name, GSTIN, registered address and state, then every line printed on the invoice and packing slip, with a live preview.', link: { to: '/admin/invoice', label: 'Invoice' } },
      { text: 'Product details: manufacturer, packer, consumer care and shelf life, printed on every product page.', link: { to: '/admin/settings', label: 'Settings' } },
      { text: 'Cash on delivery: switch it on, and set the smallest and largest order allowed for COD.', link: { to: '/admin/settings', label: 'Settings' } },
      { text: 'Delivery: fee, free-delivery threshold, couriers you use (with their tracking link) and pincodes you can’t reach.', link: { to: '/admin/shipping', label: 'Shipping' } },
      { text: 'Brand: logo, support phone and email. They appear in the footer, on the contact page and on invoices.', link: { to: '/admin/site', label: 'Site content' } },
      { text: 'Online payment: turn it on only after the Razorpay keys are added (your developer does this once).', link: { to: '/admin/settings', label: 'Settings' } },
    ],
  },
  {
    id: 'categories',
    title: 'Categories',
    why: 'Categories are the shop’s sections (menu, breadcrumbs, filters). Every product needs a main category.',
    routes: ['/admin/categories'],
    check: 'categories',
    steps: [
      { text: 'Add the top-level categories first, e.g. Perfumes, Attars, Gift sets.', link: { to: '/admin/categories', label: 'Categories' } },
      { text: 'Then add sub-categories and choose their Parent, e.g. Perfumes › Oud. A category shows the products of its sub-categories too.' },
      { text: 'A product lives in one main category and can also be listed under any number of others (e.g. an oud that is also a gift).' },
      { text: 'To take a category off the site, switch Visible off instead of deleting it.' },
    ],
    tip: 'Forgot one? While adding a product, type the new name in the category box and pick “Add as a new category”.',
  },
  {
    id: 'scent',
    title: 'Scent profile',
    why: 'These options are the filters on the shop pages and the choices in step 2 of every product.',
    routes: ['/admin/scent-profile'],
    check: 'scent',
    steps: [
      { text: 'Each tab is one filter: Family, Accords, Longevity, Sillage, Season, Occasion, Concentration…', link: { to: '/admin/scent-profile', label: 'Scent profile' } },
      { text: 'Add only the options you use, e.g. Family: Woody, Floral, Amber. Short lists are easier for customers.' },
      { text: 'Hide an option you no longer use instead of deleting it; products keep their history.' },
    ],
  },
  {
    id: 'notes',
    title: 'Notes library',
    why: 'Each ingredient is added once and reused in every product’s note pyramid and on its own note page.',
    routes: ['/admin/notes'],
    check: 'notes',
    steps: [
      { text: 'Add each note once: Oud, Rose, Saffron… with its family and a photo.', link: { to: '/admin/notes', label: 'Notes' } },
      { text: 'Products then pick notes from this library into Top, Heart and Base.' },
    ],
    tip: 'Missing a note while adding a product? Type it and choose “Add as a new note”; fill in its photo here later.',
  },
  {
    id: 'collections',
    title: 'Collections',
    why: 'Hand-picked groups such as “The Oud Edit” for the homepage and campaigns.',
    routes: ['/admin/collections'],
    check: 'collections',
    optional: true,
    steps: [
      { text: 'Create a collection with its name, headline and image.', link: { to: '/admin/collections', label: 'Collections' } },
      { text: 'Add products to it here, or from each product’s “Where it’s listed” step.' },
    ],
  },
  {
    id: 'products',
    title: 'Add a product',
    why: 'The product editor walks you through it in order; each step unlocks after the one before.',
    routes: ['/admin/products'],
    check: 'products',
    steps: [
      { text: 'Products → Add product.', link: { to: '/admin/products/new', label: 'Add product' } },
      { text: 'Where it’s listed: pick the main category (search), then “Also list under” and Collections if needed.' },
      { text: 'Scent type: tap the family, accords and the rest. These become the product’s filters.' },
      { text: 'Notes pyramid: search the library for Top, Heart and Base notes; drag to reorder.' },
      { text: 'Name and description. The web address fills itself from the name.' },
      { text: 'Sizes: one row per bottle size with SKU, price and opening stock. Leave a size’s price empty to use the base price.' },
      { text: 'Photos: the first one is the main photo; drag to reorder; tie a photo to a size if it shows that bottle.' },
      { text: 'Story, extra page sections and compliance (HSN, GST, manufacturer) for the product page.' },
      { text: 'Visibility: switch Active on when it’s ready to sell, then Save.' },
    ],
    tip: 'Making something similar? Use “Copy details from another product” at the top of the editor, then change what differs.',
  },
  {
    id: 'spreadsheets',
    title: 'Many changes at once',
    why: 'Tick several rows to act on them together, or use a spreadsheet for prices, stock and new products.',
    routes: ['/admin/spreadsheets'],
    optional: true,
    steps: [
      { text: 'Products: tick several, then Make live, Hide, Add to category or collection, Set badge or Archive from the bar at the bottom.', link: { to: '/admin/products', label: 'Products' } },
      { text: 'Orders: tick several, then Mark packed, Ship (one tracking number each), Mark delivered, or print all their invoices and packing slips.', link: { to: '/admin/orders', label: 'Orders' } },
      { text: 'Prices & stock: download the sheet, change prices or stock in Excel or Google Sheets, upload it, check the preview, Apply.', link: { to: '/admin/spreadsheets', label: 'Spreadsheets' } },
      { text: 'New products: download the template, one row per bottle size, upload it, check the preview, Import. Missing categories and notes are created.', link: { to: '/admin/spreadsheets?tab=import', label: 'Import' } },
    ],
    tip: 'Save the sheet as CSV before uploading (Excel: File → Save as → CSV UTF-8). Nothing changes until you press Apply or Import.',
  },
  {
    id: 'samples',
    title: 'Free samples',
    why: 'Customers get a free sample for every set amount of perfume they buy, and can change the scent in the bag.',
    routes: ['/admin/samples'],
    check: 'samples',
    steps: [
      { text: 'Settings → Free samples: switch it on, set “one sample for every … ml” and the sample size.', link: { to: '/admin/settings', label: 'Settings' } },
      { text: 'Free samples page: switch on each perfume you offer as a sample. Samples are poured from that perfume’s own stock.', link: { to: '/admin/samples', label: 'Free samples' } },
      { text: 'The bag fills each sample with a suggestion, chosen from the perfumes with the most left. Customers can swap it by searching your sample list, or choose “Surprise me”.' },
    ],
  },
  {
    id: 'giftpack',
    title: 'Gift pack',
    why: 'Customers build their own Premium Gift Pack from your perfumes; the bag invites them to try it.',
    routes: ['/admin/gift-pack'],
    optional: true,
    steps: [
      { text: 'Gift pack page: switch it on and set how many perfumes go in a pack, how many ml each, the price and any discount.', link: { to: '/admin/gift-pack', label: 'Gift pack' } },
      { text: 'Make sure your perfumes have the size the pack is priced from (30 ml unless you change it). Only those can be chosen.', link: { to: '/admin/products', label: 'Products' } },
      { text: 'Add a picture of the box and check the words. Each pack’s perfumes are poured from their own stock, and the order page lists exactly what to pour.' },
    ],
  },
  {
    id: 'website',
    title: 'Homepage and pages',
    why: 'Everything a visitor reads is edited here; no code changes are needed.',
    routes: ['/admin/pages', '/admin/site', '/admin/content', '/admin/media'],
    check: 'website',
    steps: [
      { text: 'Pages → Home: each block is a section. Edit it, drag to reorder, or hide it.', link: { to: '/admin/pages', label: 'Pages' } },
      { text: 'Every button and link asks what it should open: a product, category, note, collection, page or another website. Search and pick.' },
      { text: 'Site content: menu, footer, logo, colours, fonts and search-engine text.', link: { to: '/admin/site', label: 'Site content' } },
      { text: 'Announcements: the thin bar at the top of the site.', link: { to: '/admin/content/announcements', label: 'Announcements' } },
      { text: 'Replace the placeholder text on the shipping, returns, privacy and terms pages before launch.', link: { to: '/admin/pages', label: 'Pages' } },
    ],
  },
  {
    id: 'orders',
    title: 'Daily orders',
    why: 'New orders ring the bell at the top. Each order moves Placed → Packed → Shipped → Delivered.',
    routes: ['/admin/orders', '/admin/inventory'],
    check: 'orders',
    steps: [
      { text: 'Open the new order. Cash orders can be packed straight away; online orders once they show Paid.', link: { to: '/admin/orders?status=PENDING', label: 'Orders to pack' } },
      { text: 'Print the invoice and packing slip, pack the parcel, then press Mark packed.' },
      { text: 'Ship: choose the courier and enter the tracking number. The customer sees tracking on their order.' },
      { text: 'When it arrives, mark it Delivered (cash orders are then marked paid). If it comes back, mark it Returned to us.' },
      { text: 'Cancelling before it ships puts the stock back automatically; paid online orders are refunded automatically.' },
      { text: 'Low on stock? Inventory → Adjust, with a reason. Every change is logged.', link: { to: '/admin/inventory', label: 'Inventory' } },
    ],
  },
  {
    id: 'returns',
    title: 'Returns and refunds',
    why: 'Customers can ask for a return within the return window, with photos.',
    routes: ['/admin/returns', '/admin/refunds'],
    steps: [
      { text: 'Review the request: approve (pickup, post, or no return needed) or decline with a reason.', link: { to: '/admin/returns', label: 'Returns' } },
      { text: 'When the parcel arrives: Restock (good condition) or Write off (damaged).' },
      { text: 'Resolve it: refund, or send a free replacement order. Online orders refund through Razorpay; cash orders by UPI or bank transfer (enter the reference).' },
      { text: 'Refunds → Refunds due lists paid orders that were cancelled or came back and still need money returned.', link: { to: '/admin/refunds', label: 'Refunds' } },
    ],
  },
  {
    id: 'coupons',
    title: 'Coupons and offers',
    why: 'Discount codes, a personal welcome code for every new customer, and birthday codes.',
    routes: ['/admin/coupons'],
    check: 'coupons',
    optional: true,
    steps: [
      { text: 'Coupons: code, percent or flat, minimum order, limits, dates and the categories it covers.', link: { to: '/admin/coupons', label: 'Coupons' } },
      { text: '“Show in the coupon list” offers it in the bag; otherwise customers must type it.' },
      { text: 'Welcome offer: every new account gets a personal first-order code.', link: { to: '/admin/coupons?tab=welcome', label: 'Welcome offer' } },
      { text: 'Birthdays: release codes for customers born on a chosen day.', link: { to: '/admin/coupons?tab=birthday', label: 'Birthdays' } },
    ],
  },
  {
    id: 'customers',
    title: 'Reviews, back in stock and customers',
    why: 'Keep in touch with buyers and keep the product pages trustworthy.',
    routes: ['/admin/reviews', '/admin/back-in-stock', '/admin/customers', '/admin/export'],
    optional: true,
    steps: [
      { text: 'Reviews come only from customers who bought the product and wait for your approval.', link: { to: '/admin/reviews', label: 'Reviews' } },
      { text: 'Back in stock lists who asked to be told about a sold-out size; contact them when it’s back.', link: { to: '/admin/back-in-stock', label: 'Back in stock' } },
      { text: 'Customers: search anyone, see their orders, set a birthday.', link: { to: '/admin/customers', label: 'Customers' } },
      { text: 'Data export: download any list as a spreadsheet.', link: { to: '/admin/export', label: 'Data export' } },
    ],
  },
];

/** The guide sections that explain the page at `pathname` (most specific first). */
export function sectionsFor(pathname: string): GuideSection[] {
  const path = pathname.replace(/\/+$/, '') || '/admin';
  return GUIDE.filter((s) => s.routes.some((r) => path === r || path.startsWith(`${r}/`)));
}
