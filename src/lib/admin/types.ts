export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[];

export type ProviderId = string;
export type SortDirection = "asc" | "desc";
export type RecordStatus = "active" | "inactive";
export type ProductAvailability = "in-stock" | "low-stock" | "out-of-stock";
export type ProductPriceStatus = "demo" | "confirmed";
export type ProductBadge = "new" | "featured" | "sale";
export type ProductImageType = "image" | "video";

export interface ListOptions {
  search?: string;
  active?: boolean;
  status?: string;
  paymentStatus?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export interface SeoRecord {
  title?: string | null;
  description?: string | null;
  keywords?: string[] | null;
  canonicalUrl?: string | null;
}

export interface ProductImageRecord {
  id: ProviderId;
  productId: ProviderId;
  url: string;
  altText?: string | null;
  type?: ProductImageType | null;
  sortOrder?: number | null;
  isPrimary?: boolean | null;
  createdAt?: string | null;
}

export interface ProductColorRecord {
  id: ProviderId;
  name: string;
  hex?: string | null;
  productId?: ProviderId | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface ProductVariantRecord {
  id: ProviderId;
  productId: ProviderId;
  name?: string | null;
  sku?: string | null;
  size?: string | null;
  colorId?: ProviderId | null;
  price?: number | null;
  stock?: number | null;
  active?: boolean | null;
}

export interface CategoryRecord {
  id: ProviderId;
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  parentId?: ProviderId | null;
  active?: boolean | null;
  sortOrder?: number | null;
  productCount?: number | null;
}

export interface CollectionRecord {
  id: ProviderId;
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  heroCopy?: string | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface SizeChartSize {
  size: string;
  chest?: string | null;
  waist?: string | null;
  hip?: string | null;
}

export interface SizeChartMeasurements {
  enabled?: boolean | null;
  unit?: "cm" | "inches" | null;
  sizes?: SizeChartSize[] | null;
}

export interface ProductInformationRecord {
  id: ProviderId;
  productId: ProviderId;
  details?: string | null;
  fabric?: string | null;
  care?: string | null;
  fit?: string | null;
  shipping?: string | null;
  measurements?: SizeChartMeasurements | null;
  seo?: SeoRecord | null;
}

export type ProductInformationMutationInput = Omit<
  ProductInformationRecord,
  "id" | "productId"
>;

export interface ProductRecord {
  id: ProviderId;
  slug: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  categoryId?: ProviderId | null;
  categorySlug?: string | null;
  collectionId?: ProviderId | null;
  collectionSlug?: string | null;
  category?: CategoryRecord | null;
  collection?: CollectionRecord | null;
  images?: Array<ProductImageRecord | string> | null;
  video?: string | null;
  hoverImage?: string | null;
  price?: number | null;
  oldPrice?: number | null;
  currency?: string | null;
  priceStatus?: ProductPriceStatus | null;
  sizes?: string[] | null;
  tags?: string[] | null;
  availability?: ProductAvailability | null;
  sourcePostId?: string | null;
  sourceUrl?: string | null;
  isPrototypeData?: boolean | null;
  badge?: ProductBadge | null;
  active?: boolean | null;
  featured?: boolean | null;
  colors?: ProductColorRecord[] | null;
  variants?: ProductVariantRecord[] | null;
  information?: ProductInformationRecord | null;
  seo?: SeoRecord | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProfileRecord {
  id: ProviderId;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AddressRecord {
  id: ProviderId;
  customerId?: ProviderId | null;
  orderId?: ProviderId | null;
  label?: string | null;
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string | null;
  phone?: string | null;
}

export interface CustomerRecord {
  id: ProviderId;
  profileId?: ProviderId | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: RecordStatus | null;
  orderCount?: number | null;
  totalSpent?: number | null;
  addresses?: AddressRecord[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentAttemptStatus = "created" | "pending" | "paid" | "failed" | "cancelled" | "refunded";

export interface PaymentAttemptRecord {
  id: ProviderId;
  orderId: ProviderId;
  provider: "payu" | "cashfree";
  transactionId: string;
  providerPaymentId?: string | null;
  status: PaymentAttemptStatus;
  amount: number;
  currency: string;
  productInfo: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  couponId?: ProviderId | null;
  couponReserved?: boolean | null;
  reservationExpiresAt?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  verifiedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type PaymentAttemptMutationInput = Omit<
  PaymentAttemptRecord,
  "id" | "providerPaymentId" | "failureCode" | "failureMessage" | "verifiedAt" | "createdAt" | "updatedAt"
>;

export interface VerifiedPaymentResultInput {
  transactionId: string;
  status: "paid" | "failed";
  providerPaymentId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
}

export interface OrderItemRecord {
  id: ProviderId;
  orderId: ProviderId;
  productId?: ProviderId | null;
  productSlug?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  size?: string | null;
  color?: string | null;
  image?: string | null;
}

export type OrderItemMutationInput = Omit<OrderItemRecord, "id" | "orderId"> & {
  id?: ProviderId;
  orderId?: ProviderId;
};

export interface OrderRecord {
  id: ProviderId;
  orderNumber: string;
  customerId?: ProviderId | null;
  profileId?: ProviderId | null;
  status: OrderStatus;
  paymentStatus?: PaymentStatus | null;
  paymentMethod?: string | null;
  currency?: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string | null;
  shippingAddress?: AddressRecord | null;
  billingAddress?: AddressRecord | null;
  notes?: string | null;
  items?: OrderItemRecord[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ReviewRecord {
  id: ProviderId;
  productId?: ProviderId | null;
  customerId?: ProviderId | null;
  authorName: string;
  authorEmail?: string | null;
  rating: number;
  title?: string | null;
  body: string;
  status?: "pending" | "approved" | "rejected" | null;
  isHomeFeatured?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface InquiryRecord {
  id: ProviderId;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status?: "unread" | "read" | "replied" | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SubscriberRecord {
  id: ProviderId;
  email: string;
  name?: string | null;
  active?: boolean | null;
  source?: string | null;
  subscribedAt?: string | null;
}

export interface HeroSlideRecord {
  id: ProviderId;
  title: string;
  subtitle?: string | null;
  image: string;
  imageAlt?: string | null;
  video?: string | null;
  cta?: string | null;
  ctaLink?: string | null;
  collectionSlug?: string | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface InstagramPostRecord {
  id: ProviderId;
  caption?: string | null;
  hashtags?: string[] | null;
  shortCode?: string | null;
  sourceUrl?: string | null;
  type?: "Image" | "Video" | "Sidecar" | null;
  image: string;
  video?: string | null;
  timestamp?: string | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface TestimonialRecord {
  id: ProviderId;
  authorName: string;
  quote: string;
  role?: string | null;
  rating?: number | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface FaqRecord {
  id: ProviderId;
  question: string;
  answer: string;
  category?: string | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface AnnouncementRecord {
  id: ProviderId;
  text: string;
  active?: boolean | null;
  sortOrder?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface SettingRecord {
  id: ProviderId;
  key: string;
  value: JsonValue;
  description?: string | null;
  updatedAt?: string | null;
}

export interface CouponRecord {
  id: ProviderId;
  code: string;
  description?: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumAmount?: number | null;
  maximumUses?: number | null;
  usedCount?: number | null;
  active?: boolean | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface ShippingRateRecord {
  id: ProviderId;
  name: string;
  amount: number;
  freeAbove?: number | null;
  codAvailable?: boolean | null;
  active?: boolean | null;
}

export interface PromoSettingsRecord {
  id: ProviderId;
  enabled: boolean;
  title?: string | null;
  body?: string | null;
  image?: string | null;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  couponCode?: string | null;
  frequency?: "once" | "session" | "always" | null;
  maxViews?: number | null;
  endsAt?: string | null;
}

export interface DiscoveryMenuEntryRecord {
  id: ProviderId;
  label: string;
  href: string;
  categoryId?: ProviderId | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface DiscoveryMenuEntryMutationInput {
  label: string;
  href: string;
  categoryId?: ProviderId | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface DashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  totalSubscribers: number;
  pendingReviews: number;
  unreadInquiries: number;
  recentOrders: OrderRecord[];
}

export interface ProductMutationInput {
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  categoryId?: string | null;
  categorySlug?: string | null;
  collectionId?: string | null;
  collectionSlug?: string | null;
  images?: Array<ProductImageRecord | string> | null;
  video?: string | null;
  hoverImage?: string | null;
  price?: number | null;
  oldPrice?: number | null;
  currency?: string | null;
  priceStatus?: ProductPriceStatus | null;
  sizes?: string[] | null;
  tags?: string[] | null;
  availability?: ProductAvailability | null;
  sourcePostId?: string | null;
  sourceUrl?: string | null;
  isPrototypeData?: boolean | null;
  badge?: ProductBadge | null;
  active?: boolean | null;
  featured?: boolean | null;
  seo?: SeoRecord | null;
}

export interface CategoryMutationInput {
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface CollectionMutationInput {
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  heroCopy?: string | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface OrderMutationInput {
  orderNumber?: string;
  customerId?: string | null;
  profileId?: string | null;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus | null;
  paymentMethod?: string | null;
  currency?: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string | null;
  shippingAddress?: AddressRecord | null;
  billingAddress?: AddressRecord | null;
  notes?: string | null;
  items: OrderItemMutationInput[];
}

export interface ProfileMutationInput {
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
}

export interface CustomerMutationInput {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: RecordStatus | null;
}

export interface ReviewMutationInput {
  productId?: string | null;
  customerId?: string | null;
  authorName: string;
  authorEmail?: string | null;
  rating: number;
  title?: string | null;
  body: string;
  status?: ReviewRecord["status"];
  isHomeFeatured?: boolean | null;
}

export interface InquiryMutationInput {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status?: InquiryRecord["status"];
}

export interface SubscriberMutationInput {
  email: string;
  name?: string | null;
  source?: string | null;
}

export interface HeroSlideMutationInput {
  title: string;
  subtitle?: string | null;
  image: string;
  imageAlt?: string | null;
  video?: string | null;
  cta?: string | null;
  ctaLink?: string | null;
  collectionSlug?: string | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface InstagramPostMutationInput {
  caption?: string | null;
  hashtags?: string[] | null;
  shortCode?: string | null;
  sourceUrl?: string | null;
  type?: InstagramPostRecord["type"];
  image: string;
  video?: string | null;
  timestamp?: string | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface TestimonialMutationInput {
  authorName: string;
  quote: string;
  role?: string | null;
  rating?: number | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface FaqMutationInput {
  question: string;
  answer: string;
  category?: string | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface AnnouncementMutationInput {
  text: string;
  active?: boolean | null;
  sortOrder?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface CouponMutationInput {
  code: string;
  description?: string | null;
  discountType: CouponRecord["discountType"];
  discountValue: number;
  minimumAmount?: number | null;
  maximumUses?: number | null;
  active?: boolean | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface ShippingRateMutationInput {
  name: string;
  amount: number;
  freeAbove?: number | null;
  codAvailable?: boolean | null;
  active?: boolean | null;
}

export interface PromoSettingsMutationInput
  extends Omit<PromoSettingsRecord, "id"> {}

export interface AdminDataState {
  products: ProductRecord[];
  categories: CategoryRecord[];
  collections: CollectionRecord[];
  colors: ProductColorRecord[];
  variants: ProductVariantRecord[];
  images: ProductImageRecord[];
  productInformation: ProductInformationRecord[];
  profiles: ProfileRecord[];
  customers: CustomerRecord[];
  addresses: AddressRecord[];
  orders: OrderRecord[];
  orderItems: OrderItemRecord[];
  paymentAttempts: PaymentAttemptRecord[];
  reviews: ReviewRecord[];
  inquiries: InquiryRecord[];
  subscribers: SubscriberRecord[];
  heroSlides: HeroSlideRecord[];
  instagramPosts: InstagramPostRecord[];
  testimonials: TestimonialRecord[];
  faqs: FaqRecord[];
  announcements: AnnouncementRecord[];
  settings: SettingRecord[];
  coupons: CouponRecord[];
  shippingRates: ShippingRateRecord[];
  promoSettings: PromoSettingsRecord;
  discoveryMenuEntries: DiscoveryMenuEntryRecord[];
}
