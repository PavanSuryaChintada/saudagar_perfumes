import type { LucideIcon } from 'lucide-react';
import {
  BookOpen, Clapperboard, FileText, FolderTree, HelpCircle, Image, LayoutDashboard, Layers, Leaf, Megaphone, MessageSquareQuote, Package, Palette, Settings, Sparkles, Store,
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
  { heading: 'Setup', items: [{ to: '/admin/settings', label: 'Settings', icon: Settings }] },
];
