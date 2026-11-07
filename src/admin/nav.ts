import type { LucideIcon } from 'lucide-react';
import { Image, LayoutDashboard, Settings } from 'lucide-react';

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
  { heading: 'Content', items: [{ to: '/admin/media', label: 'Media library', icon: Image }] },
  { heading: 'Setup', items: [{ to: '/admin/settings', label: 'Settings', icon: Settings }] },
];
