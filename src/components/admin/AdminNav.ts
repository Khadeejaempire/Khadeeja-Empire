import type { LucideIcon } from "lucide-react";
import {
  FolderTree,
  Gift,
  Image,
  Instagram,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  User,
  Users,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface AdminNavSection {
  label: string;
  items: AdminNavItem[];
}

export const adminNavSections: AdminNavSection[] = [
  {
    label: "Store",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Subscribers", href: "/admin/subscribers", icon: Mail },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
      { label: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
    ],
  },
  {
    label: "Storefront",
    items: [
      { label: "Hero Slides", href: "/admin/hero-slides", icon: Image },
      { label: "Instagram Gallery", href: "/admin/instagram", icon: Instagram },
      { label: "Promo Popup", href: "/admin/home-banner", icon: Gift },
      { label: "Home Reviews", href: "/admin/home-reviews", icon: Star },
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Global FAQs", href: "/admin/settings/faqs", icon: Settings },
      { label: "Shipping Settings", href: "/admin/settings/shipping", icon: Truck },
      { label: "Manage Coupons", href: "/admin/settings/coupons", icon: Tag },
      { label: "Manage Profile", href: "/admin/settings/profile", icon: User },
    ],
  },
];

export function isAdminNavItemActive(pathname: string, item: AdminNavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
