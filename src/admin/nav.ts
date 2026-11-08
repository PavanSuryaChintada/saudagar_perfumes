import type { LucideIcon } from 'lucide-react';
import {
  BellRing, BookOpen, PackagePlus, PanelTop, FileSpreadsheet, ReceiptText, Boxes, Clapperboard, Compass, DatabaseBackup, Star, Users, Gift, IndianRupee, RotateCcw, ShoppingBag, TicketPercent, FileText, FolderTree, HelpCircle, Image, LayoutDashboard, Layers, Leaf, Megaphone, MessageSquareQuote, Package, Palette, Settings, Sparkles, Store, Truck,
} from 'lucide-react';

export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Extra words the admin search matches for this page, e.g. "cod" for Settings. */
  keywords?: string;
}

export interface AdminNavGroup {
  heading?: string;
  items: AdminNavItem[];
}

// Daily work first; catalog setup in the order it's needed (categories → scent profile → notes → collections →
// samples); then marketing, the website, and settings.
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, keywords: 'home overview sales revenue' },
      { to: '/admin/guide', label: 'Guide', icon: Compass, keywords: 'help how to start tutorial steps' },
    ],
  },
  {
    heading: 'Daily',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, keywords: 'pack ship tracking cod invoice' },
      { to: '/admin/returns', label: 'Returns', icon: RotateCcw, keywords: 'damaged leaking wrong replacement' },
      { to: '/admin/refunds', label: 'Refunds', icon: IndianRupee, keywords: 'money back razorpay upi' },
      { to: '/admin/inventory', label: 'Inventory', icon: Boxes, keywords: 'stock low stock adjust' },
      { to: '/admin/products', label: 'Products', icon: Package, keywords: 'perfume add product sizes prices' },
      { to: '/admin/spreadsheets', label: 'Spreadsheets', icon: FileSpreadsheet, keywords: 'bulk import csv excel price stock update many' },
    ],
  },
  {
    heading: 'Catalog setup',
    items: [
      { to: '/admin/categories', label: 'Categories', icon: FolderTree, keywords: 'menu sections type' },
      { to: '/admin/scent-profile', label: 'Scent profile', icon: Sparkles, keywords: 'family accord longevity sillage season occasion filters' },
      { to: '/admin/notes', label: 'Notes', icon: Leaf, keywords: 'ingredients pyramid top heart base' },
      { to: '/admin/collections', label: 'Collections', icon: Layers, keywords: 'edit curated group' },
      { to: '/admin/samples', label: 'Free samples', icon: Gift, keywords: '5 ml vials sample pool' },
      { to: '/admin/gift-pack', label: 'Gift pack', icon: PackagePlus, keywords: 'premium gift box 5 x 20 ml pack bundle' },
    ],
  },
  {
    heading: 'Marketing',
    items: [
      { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent, keywords: 'discount code welcome birthday offer' },
      { to: '/admin/reviews', label: 'Reviews', icon: Star, keywords: 'ratings approve moderate' },
      { to: '/admin/back-in-stock', label: 'Back in stock', icon: BellRing, keywords: 'notify me waiting list' },
      { to: '/admin/customers', label: 'Customers', icon: Users, keywords: 'people accounts birthday' },
    ],
  },
  {
    heading: 'Website',
    items: [
      { to: '/admin/cms', label: 'Website (CMS)', icon: FileText, keywords: 'cms pages home sections story product page category page best sellers content site settings menu footer logo brand theme colours fonts seo shop words' },
      { to: '/admin/cms?tab=content&kind=announcements', label: 'Announcements', icon: Megaphone, keywords: 'top bar banner' },
      { to: '/admin/cms?tab=content&kind=stories', label: 'Stories', icon: BookOpen },
      { to: '/admin/cms?tab=content&kind=reels', label: 'Reels', icon: Clapperboard, keywords: 'video instagram' },
      { to: '/admin/cms?tab=content&kind=testimonials', label: 'Testimonials', icon: MessageSquareQuote, keywords: 'quotes press' },
      { to: '/admin/cms?tab=content&kind=faqs', label: 'FAQs', icon: HelpCircle, keywords: 'questions answers' },
      { to: '/admin/cms?tab=content&kind=stockists', label: 'Boutiques', icon: Store, keywords: 'stores stockists' },
      { to: '/admin/cms?tab=site&block=mega_nav', label: 'Mega menu', icon: PanelTop, keywords: 'menu navigation header links mega nav' },
      { to: '/admin/cms?tab=site', label: 'Site settings', icon: Palette, keywords: 'menu footer logo brand theme colours fonts seo header shop words' },
      { to: '/admin/media', label: 'Media library', icon: Image, keywords: 'photos images videos uploads' },
    ],
  },
  {
    heading: 'Settings',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: Settings, keywords: 'cod payments razorpay gst business invoice samples analytics whatsapp' },
      { to: '/admin/invoice', label: 'Invoice', icon: ReceiptText, keywords: 'gst bill tax invoice packing slip signature seller' },
      { to: '/admin/shipping', label: 'Shipping', icon: Truck, keywords: 'delivery courier pincode fee' },
      { to: '/admin/export', label: 'Data export', icon: DatabaseBackup, keywords: 'csv excel backup download' },
    ],
  },
];
