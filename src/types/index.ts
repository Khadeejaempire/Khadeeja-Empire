export type CategorySlug =
  | "short-kurtis"
  | "coord-sets"
  | "everyday-tops"
  | "dresses"
  | "resort-and-whites"
  | "new-arrivals"
  | "the-everyday-edit";

export type CollectionSlug =
  | "short-kurtis"
  | "coord-sets"
  | "everyday-tops"
  | "dresses"
  | "resort-and-whites"
  | "new-arrivals";

export type PriceStatus = "demo" | "confirmed";

export type Availability = "in-stock" | "low-stock" | "out-of-stock";

export type ProductTag =
  | "Floral"
  | "Paisley"
  | "White"
  | "Halter"
  | "Casual"
  | "Ethnic"
  | "Indo-Western"
  | "Summer"
  | "Travel"
  | "Banaras-inspired"
  | "Statement"
  | "Minimal";

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  collection: CollectionSlug;
  description: string;
  images: string[];
  video?: string;
  price: number;
  oldPrice?: number;
  currency: string;
  priceStatus: PriceStatus;
  sizes: string[];
  tags: ProductTag[];
  availability: Availability;
  sourcePostId: string;
  sourceUrl: string;
  isPrototypeData: boolean;
  badge?: "new" | "featured" | "sale";
  hoverImage?: string;
}

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  image: string;
}

export interface Collection {
  slug: CollectionSlug;
  name: string;
  description: string;
  image: string;
  heroCopy: string;
}

export interface InstagramPost {
  id: string;
  caption: string;
  hashtags: string[];
  shortCode: string;
  sourceUrl: string;
  type: "Image" | "Video" | "Sidecar";
  image: string;
  video?: string;
  timestamp: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  video?: string;
  cta: string;
  ctaLink: string;
  collection: CollectionSlug;
}

export interface ValueItem {
  title: string;
  description: string;
}

export interface NavItem {
  label: string;
  href?: string;
  megaMenu?: {
    title: string;
    links: { label: string; href: string }[];
  };
}

export interface SiteConfig {
  name: string;
  tagline: string;
  logo: string;
  announcements: string[];
  email: string;
  phone: string;
  instagram: string;
  social: {
    instagram: string;
    label: string;
  }[];
  navigation: NavItem[];
}
