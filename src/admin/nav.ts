import type { LucideIcon } from 'lucide-react';
import {
  BookOpen, Boxes, Clapperboard, Gift, IndianRupee, RotateCcw, ShoppingBag, TicketPercent, FileText, FolderTree, HelpCircle, Image, LayoutDashboard, Layers, Leaf, Megaphone, MessageSquareQuote, Package, Palette, Settings, Sparkles, Store, Truck,
} from 'lucide-react';

export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface AdminNavGroup {
  heading?: string;
  items: AdminNavItem[];
}

// Grows phase by phase (spec §14). Only pages that exist are listed.
export const ADMIN_NAV: AdminNavGroup[] = [
  { items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    heading: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { to: '/admin/returns', label: 'Returns', icon: RotateCcw },
      { to: '/admin/refunds', label: 'Refunds', icon: IndianRupee },
      { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
      { to: '/admin/samples', label: 'Free samples', icon: Gift },
      { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
    ],
  },
  {
    heading: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/categories', label: 'Categories', icon: FolderTree },
      { to: '/admin/collections', label: 'Collections', icon: Layers },
      { to: '/admin/notes', label: 'Notes', icon: Leaf },
      { to: '/admin/scent-profile', label: 'Scent profile', icon: Sparkles },
    ],
  },
  {
    heading: 'Content',
    items: [
      { to: '/admin/pages', label: 'Pages', icon: FileText },
      { to: '/admin/site', label: 'Site content', icon: Palette },
      { to: '/admin/content/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/content/stories', label: 'Stories', icon: BookOpen },
      { to: '/admin/content/reels', label: 'Reels', icon: Clapperboard },
      { to: '/admin/content/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
      { to: '/admin/content/faqs', label: 'FAQs', icon: HelpCircle },
      { to: '/admin/content/stockists', label: 'Boutiques', icon: Store },
      { to: '/admin/media', label: 'Media library', icon: Image },
    ],
  },
  {
    heading: 'Setup',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: Settings },
      { to: '/admin/shipping', label: 'Shipping', icon: Truck },
    ],
  },
];
