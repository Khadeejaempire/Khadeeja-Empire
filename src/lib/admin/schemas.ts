import { z } from "zod";
import type { JsonValue } from "./types";

const trimmedString = z.string().trim();

export const idSchema = trimmedString
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "Use only letters, numbers, hyphens, and underscores.");

export const slugSchema = trimmedString
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug.");

export const safeAssetUrlSchema = trimmedString
  .min(1)
  .max(2048)
  .refine((value) => {
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Use an https URL or a site-relative asset path.");

export const safeRedirectSchema = trimmedString
  .refine((value) => value.startsWith("/") && !value.startsWith("//"), "Use a local path.")
  .refine((value) => !value.includes("\\") && !value.includes("\n"), "Use a safe local path.");

export const recordIdMutationSchema = z.object({ id: idSchema });
export const activeMutationSchema = z.object({ active: z.boolean() });
export const reorderMutationSchema = z.object({
  ids: z.array(idSchema).max(500),
});

const nullableAsset = safeAssetUrlSchema.nullable().optional();
export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ])
);

export const productImageInputSchema = z.union([
  safeAssetUrlSchema,
  z.object({
    id: idSchema.optional(),
    productId: idSchema.optional(),
    url: safeAssetUrlSchema,
    altText: trimmedString.max(240).nullable().optional(),
    type: z.enum(["image", "video"]).nullable().optional(),
    sortOrder: z.number().int().min(0).nullable().optional(),
    isPrimary: z.boolean().nullable().optional(),
  }),
]);

export const productImageSchema = productImageInputSchema;

export const productColorMutationSchema = z.object({
  productId: idSchema.nullable().optional(),
  name: trimmedString.min(1).max(80),
  hex: trimmedString.regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
  active: z.boolean().nullable().optional(),
  sortOrder: z.number().int().min(0).nullable().optional(),
});

export const productVariantMutationSchema = z.object({
  productId: idSchema,
  name: trimmedString.max(120).nullable().optional(),
  sku: trimmedString.max(120).nullable().optional(),
  size: trimmedString.max(32).nullable().optional(),
  colorId: idSchema.nullable().optional(),
  price: z.number().finite().min(0).nullable().optional(),
  stock: z.number().int().min(0).nullable().optional(),
  active: z.boolean().nullable().optional(),
});

export const productImageMutationSchema = z.object({
  productId: idSchema,
  url: safeAssetUrlSchema,
  altText: trimmedString.max(240).nullable().optional(),
  type: z.enum(["image", "video"]).nullable().optional(),
  sortOrder: z.number().int().min(0).nullable().optional(),
  isPrimary: z.boolean().nullable().optional(),
});

export const productInformationMutationSchema = z.object({
  details: trimmedString.max(10000).nullable().optional(),
  fabric: trimmedString.max(500).nullable().optional(),
  care: trimmedString.max(2000).nullable().optional(),
  fit: trimmedString.max(500).nullable().optional(),
  shipping: trimmedString.max(2000).nullable().optional(),
  measurements: z
    .object({
      enabled: z.boolean().nullable().optional(),
      unit: z.enum(["cm", "inches"]).nullable().optional(),
      sizes: z
        .array(
          z.object({
            size: trimmedString.min(1).max(32),
            chest: trimmedString.max(100).nullable().optional(),
            waist: trimmedString.max(100).nullable().optional(),
            hip: trimmedString.max(100).nullable().optional(),
          })
        )
        .max(50)
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  seo: z
    .object({
      title: trimmedString.max(240).nullable().optional(),
      description: trimmedString.max(500).nullable().optional(),
      keywords: z.array(trimmedString.max(80)).max(30).nullable().optional(),
      canonicalUrl: nullableAsset,
    })
    .nullable()
    .optional(),
});

export const productMutationSchema = z.object({
  name: trimmedString.min(1).max(240),
  slug: slugSchema,
  description: trimmedString.max(10000).nullable().optional(),
  shortDescription: trimmedString.max(500).nullable().optional(),
  categoryId: idSchema.nullable().optional(),
  categorySlug: slugSchema.nullable().optional(),
  collectionId: idSchema.nullable().optional(),
  collectionSlug: slugSchema.nullable().optional(),
  images: z.array(productImageSchema).max(50).nullable().optional(),
  video: nullableAsset,
  hoverImage: nullableAsset,
  price: z.number().finite().min(0).nullable().optional(),
  oldPrice: z.number().finite().min(0).nullable().optional(),
  currency: trimmedString.regex(/^[A-Z]{3}$/).nullable().optional(),
  priceStatus: z.enum(["demo", "confirmed"]).nullable().optional(),
  sizes: z.array(trimmedString.min(1).max(32)).max(30).nullable().optional(),
  tags: z.array(trimmedString.min(1).max(80)).max(30).nullable().optional(),
  availability: z.enum(["in-stock", "low-stock", "out-of-stock"]).nullable().optional(),
  sourcePostId: trimmedString.max(240).nullable().optional(),
  sourceUrl: nullableAsset,
  isPrototypeData: z.boolean().nullable().optional(),
  badge: z.enum(["new", "featured", "sale"]).nullable().optional(),
  active: z.boolean().nullable().optional(),
  featured: z.boolean().nullable().optional(),
  seo: z
    .object({
      title: trimmedString.max(240).nullable().optional(),
      description: trimmedString.max(500).nullable().optional(),
      keywords: z.array(trimmedString.max(80)).max(30).nullable().optional(),
      canonicalUrl: nullableAsset,
    })
    .nullable()
    .optional(),
}).superRefine((value, context) => {
  if (value.oldPrice !== null && value.oldPrice !== undefined && value.price !== null && value.price !== undefined && value.oldPrice < value.price) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["oldPrice"],
      message: "Old price must be greater than or equal to the current price.",
    });
  }
});

export const categoryMutationSchema = z.object({
  slug: slugSchema,
  name: trimmedString.min(1).max(160),
  description: trimmedString.max(10000).nullable().optional(),
  image: nullableAsset,
  parentId: idSchema.nullable().optional(),
  active: z.boolean().nullable().optional(),
  sortOrder: z.number().int().min(0).nullable().optional(),
});

export const collectionMutationSchema = categoryMutationSchema.extend({
  heroCopy: trimmedString.max(500).nullable().optional(),
});

export const profileMutationSchema = z.object({
  email: trimmedString.email().max(320).nullable().optional(),
  fullName: trimmedString.max(160).nullable().optional(),
  phone: trimmedString.max(40).nullable().optional(),
  avatarUrl: nullableAsset,
  role: trimmedString.max(40).nullable().optional(),
});

export const customerMutationSchema = z.object({
  name: trimmedString.max(160).nullable().optional(),
  email: trimmedString.email().max(320).nullable().optional(),
  phone: trimmedString.max(40).nullable().optional(),
  status: z.enum(["active", "inactive"]).nullable().optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
});

export const orderPaymentStatusUpdateSchema = z.object({
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
});

export const addressMutationSchema = z.object({
  id: idSchema.optional(),
  customerId: idSchema.nullable().optional(),
  orderId: idSchema.nullable().optional(),
  label: trimmedString.max(80).nullable().optional(),
  fullName: trimmedString.min(1).max(160),
  line1: trimmedString.min(1).max(240),
  line2: trimmedString.max(240).nullable().optional(),
  city: trimmedString.min(1).max(120),
  state: trimmedString.min(1).max(120),
  postalCode: trimmedString.min(3).max(20),
  country: trimmedString.max(3).nullable().optional(),
  phone: trimmedString.max(40).nullable().optional(),
});

export const orderItemMutationSchema = z.object({
  id: idSchema.optional(),
  orderId: idSchema.optional(),
  productId: idSchema.nullable().optional(),
  productSlug: slugSchema.nullable().optional(),
  productName: trimmedString.min(1).max(240),
  quantity: z.number().int().min(1).max(1000),
  unitPrice: z.number().finite().min(0),
  totalPrice: z.number().finite().min(0),
  size: trimmedString.max(32).nullable().optional(),
  color: trimmedString.max(80).nullable().optional(),
  image: safeAssetUrlSchema.nullable().optional(),
});

export const orderMutationSchema = z.object({
  orderNumber: trimmedString.max(80).optional(),
  customerId: idSchema.nullable().optional(),
  profileId: idSchema.nullable().optional(),
  status: orderStatusUpdateSchema.shape.status.optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).nullable().optional(),
  paymentMethod: trimmedString.max(80).nullable().optional(),
  currency: trimmedString.regex(/^[A-Z]{3}$/).nullable().optional(),
  subtotal: z.number().finite().min(0),
  shipping: z.number().finite().min(0),
  discount: z.number().finite().min(0),
  total: z.number().finite().min(0),
  couponCode: trimmedString.max(80).nullable().optional(),
  shippingAddress: addressMutationSchema.nullable().optional(),
  billingAddress: addressMutationSchema.nullable().optional(),
  notes: trimmedString.max(2000).nullable().optional(),
  items: z.array(orderItemMutationSchema).min(1).max(100),
}).superRefine((value, context) => {
  const itemTotal = value.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const expectedTotal = value.subtotal + value.shipping - value.discount;

  if (Math.abs(itemTotal - value.subtotal) > 0.01) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["subtotal"],
      message: "Subtotal must equal the sum of order item totals.",
    });
  }
  if (Math.abs(expectedTotal - value.total) > 0.01) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["total"],
      message: "Total must equal subtotal plus shipping less discount.",
    });
  }
  if (value.discount > value.subtotal + value.shipping) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discount"],
      message: "Discount cannot exceed the order amount.",
    });
  }
});

export const settingsMutationSchema = z.object({
  key: trimmedString
    .min(1)
    .max(160)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use a safe setting key."),
  value: jsonValueSchema,
  description: trimmedString.max(500).nullable().optional(),
});

export const shippingRateMutationSchema = z.object({
  name: trimmedString.min(1).max(120),
  amount: z.number().finite().min(0),
  freeAbove: z.number().finite().min(0).nullable().optional(),
  codAvailable: z.boolean().nullable().optional(),
  active: z.boolean().nullable().optional(),
});

export const promoSettingsMutationSchema = z.object({
  enabled: z.boolean(),
  title: trimmedString.max(240).nullable().optional(),
  body: trimmedString.max(2000).nullable().optional(),
  image: nullableAsset,
  ctaLabel: trimmedString.max(80).nullable().optional(),
  ctaLink: safeRedirectSchema.nullable().optional(),
  couponCode: trimmedString.max(80).nullable().optional(),
  frequency: z.enum(["once", "session", "always"]).nullable().optional(),
  maxViews: z.number().int().min(0).nullable().optional(),
  endsAt: trimmedString.datetime({ offset: true }).nullable().optional(),
});

export const couponMutationSchema = z.object({
  code: trimmedString.min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
  description: trimmedString.max(500).nullable().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().finite().positive(),
  minimumAmount: z.number().finite().min(0).nullable().optional(),
  maximumUses: z.number().int().min(1).nullable().optional(),
  active: z.boolean().nullable().optional(),
  startsAt: trimmedString.datetime({ offset: true }).nullable().optional(),
  endsAt: trimmedString.datetime({ offset: true }).nullable().optional(),
}).superRefine((value, context) => {
  if (value.discountType === "percentage" && value.discountValue > 100) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountValue"],
      message: "Percentage discounts cannot exceed 100.",
    });
  }
});

export const heroSlideMutationSchema = z.object({
  title: trimmedString.min(1).max(240),
  subtitle: trimmedString.max(500).nullable().optional(),
  image: safeAssetUrlSchema,
  imageAlt: trimmedString.max(240).nullable().optional(),
  video: nullableAsset,
  cta: trimmedString.max(80).nullable().optional(),
  ctaLink: safeRedirectSchema.nullable().optional(),
  collectionSlug: slugSchema.nullable().optional(),
  active: z.boolean().nullable().optional(),
  sortOrder: z.number().int().min(0).nullable().optional(),
});

export const announcementMutationSchema = z.object({
  text: trimmedString.min(1).max(500),
  active: z.boolean().nullable().optional(),
  sortOrder: z.number().int().min(0).nullable().optional(),
  startsAt: trimmedString.datetime({ offset: true }).nullable().optional(),
  endsAt: trimmedString.datetime({ offset: true }).nullable().optional(),
});

export const reviewMutationSchema = z.object({
  productId: idSchema.nullable().optional(),
  customerId: idSchema.nullable().optional(),
  authorName: trimmedString.min(1).max(160),
  authorEmail: trimmedString.email().max(320).nullable().optional(),
  rating: z.number().int().min(1).max(5),
  title: trimmedString.max(240).nullable().optional(),
  body: trimmedString.min(1).max(5000),
  status: z.enum(["pending", "approved", "rejected"]).nullable().optional(),
  isHomeFeatured: z.boolean().nullable().optional(),
});

export const inquiryMutationSchema = z.object({
  name: trimmedString.min(1).max(160),
  email: trimmedString.email().max(320),
  phone: trimmedString.max(40).nullable().optional(),
  subject: trimmedString.max(240).nullable().optional(),
  message: trimmedString.min(1).max(10000),
  status: z.enum(["unread", "read", "replied"]).nullable().optional(),
});

export const subscriberMutationSchema = z.object({
  email: trimmedString.email().max(320),
  name: trimmedString.max(160).nullable().optional(),
  source: trimmedString.max(80).nullable().optional(),
});

export const instagramPostMutationSchema = z.object({
  caption: trimmedString.max(5000).nullable().optional(),
  hashtags: z.array(trimmedString.min(1).max(80)).max(50).nullable().optional(),
  shortCode: trimmedString.max(120).nullable().optional(),
  sourceUrl: nullableAsset,
  type: z.enum(["Image", "Video", "Sidecar"]).nullable().optional(),
  image: safeAssetUrlSchema,
  video: nullableAsset,
  timestamp: trimmedString.max(80).nullable().optional(),
  active: z.boolean().nullable().optional(),
  sortOrder: z.number().int().min(0).nullable().optional(),
});

export const testimonialMutationSchema = z.object({
  authorName: trimmedString.min(1).max(160),
  quote: trimmedString.min(1).max(2000),
  role: trimmedString.max(160).nullable().optional(),
  image: nullableAsset,
  active: z.boolean().nullable().optional(),
  sortOrder: z.number().int().min(0).nullable().optional(),
});

export const faqMutationSchema = z.object({
  question: trimmedString.min(1).max(500),
  answer: trimmedString.min(1).max(5000),
  category: trimmedString.max(120).nullable().optional(),
  active: z.boolean().nullable().optional(),
  sortOrder: z.number().int().min(0).nullable().optional(),
});

export const discoveryMenuMutationSchema = z.object({
  label: trimmedString.min(1).max(160),
  href: safeRedirectSchema,
  categoryId: idSchema.nullable().optional(),
  active: z.boolean().nullable().optional(),
  sortOrder: z.number().int().min(0).nullable().optional(),
});

export const reviewStatusUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  isHomeFeatured: z.boolean().optional(),
});

export const inquiryStatusUpdateSchema = z.object({
  status: z.enum(["unread", "read", "replied"]),
});

export type ProductMutation = z.infer<typeof productMutationSchema>;
export type CategoryMutation = z.infer<typeof categoryMutationSchema>;
export type CollectionMutation = z.infer<typeof collectionMutationSchema>;
export type ProductColorMutation = z.infer<typeof productColorMutationSchema>;
export type ProductVariantMutation = z.infer<typeof productVariantMutationSchema>;
export type ProductImageMutation = z.infer<typeof productImageMutationSchema>;
export type ProductInformationMutation = z.infer<typeof productInformationMutationSchema>;
export type ProfileMutation = z.infer<typeof profileMutationSchema>;
export type CustomerMutation = z.infer<typeof customerMutationSchema>;
export type AddressMutation = z.infer<typeof addressMutationSchema>;
export type OrderItemMutation = z.infer<typeof orderItemMutationSchema>;
export type OrderStatusUpdate = z.infer<typeof orderStatusUpdateSchema>;
export type OrderMutation = z.infer<typeof orderMutationSchema>;
export type SettingsMutation = z.infer<typeof settingsMutationSchema>;
export type ShippingRateMutation = z.infer<typeof shippingRateMutationSchema>;
export type PromoSettingsMutation = z.infer<typeof promoSettingsMutationSchema>;
export type CouponMutation = z.infer<typeof couponMutationSchema>;
export type ReviewMutation = z.infer<typeof reviewMutationSchema>;
export type InquiryMutation = z.infer<typeof inquiryMutationSchema>;
export type SubscriberMutation = z.infer<typeof subscriberMutationSchema>;
export type HeroSlideMutation = z.infer<typeof heroSlideMutationSchema>;
export type InstagramPostMutation = z.infer<typeof instagramPostMutationSchema>;
export type TestimonialMutation = z.infer<typeof testimonialMutationSchema>;
export type FaqMutation = z.infer<typeof faqMutationSchema>;
export type AnnouncementMutation = z.infer<typeof announcementMutationSchema>;
export type DiscoveryMenuMutation = z.infer<typeof discoveryMenuMutationSchema>;

export const productSchema = productMutationSchema;
export const categorySchema = categoryMutationSchema;
export const orderSchema = orderMutationSchema;
export const settingsSchema = settingsMutationSchema;
export const profileSchema = profileMutationSchema;
export const customerSchema = customerMutationSchema;
export const reviewSchema = reviewMutationSchema;
export const inquirySchema = inquiryMutationSchema;
export const instagramPostSchema = instagramPostMutationSchema;
export const testimonialSchema = testimonialMutationSchema;
export const faqSchema = faqMutationSchema;
export const discoveryMenuSchema = discoveryMenuMutationSchema;
