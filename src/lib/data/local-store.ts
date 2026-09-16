import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { DataProviderError } from "../admin/errors";
import { jsonValueSchema } from "../admin/schemas";
import type { AdminDataState } from "../admin/types";
import { createSeedData } from "./seed";

export const LOCAL_DATA_DIRECTORY = join(process.cwd(), ".data");
export const LOCAL_DATA_FILE = join(LOCAL_DATA_DIRECTORY, "khadeeja-admin.json");

const storedId = z.string().min(1).max(256);
const storedNullableString = z.string().nullable().optional();
const storedNullableNumber = z.number().finite().nullable().optional();
const storedNullableBoolean = z.boolean().nullable().optional();
const storedTimestamp = storedNullableString;

const storedSeoSchema = z
  .object({
    title: storedNullableString,
    description: storedNullableString,
    keywords: z.array(z.string()).nullable().optional(),
    canonicalUrl: storedNullableString,
  })
  .passthrough();

const storedImageSchema = z
  .object({
    id: storedId,
    productId: storedId,
    url: z.string().min(1),
    altText: storedNullableString,
    type: z.enum(["image", "video"]).nullable().optional(),
    sortOrder: storedNullableNumber,
    isPrimary: storedNullableBoolean,
    createdAt: storedTimestamp,
  })
  .passthrough();

const storedColorSchema = z
  .object({
    id: storedId,
    name: z.string().min(1),
    hex: storedNullableString,
    productId: storedNullableString,
    active: storedNullableBoolean,
    sortOrder: storedNullableNumber,
  })
  .passthrough();

const storedVariantSchema = z
  .object({
    id: storedId,
    productId: storedId,
    name: storedNullableString,
    sku: storedNullableString,
    size: storedNullableString,
    colorId: storedNullableString,
    price: storedNullableNumber,
    stock: storedNullableNumber,
    active: storedNullableBoolean,
  })
  .passthrough();

const storedCategorySchema = z
  .object({
    id: storedId,
    slug: z.string().min(1),
    name: z.string().min(1),
    description: storedNullableString,
    image: storedNullableString,
    parentId: storedNullableString,
    active: storedNullableBoolean,
    sortOrder: storedNullableNumber,
    productCount: storedNullableNumber,
  })
  .passthrough();

const storedCollectionSchema = z
  .object({
    id: storedId,
    slug: z.string().min(1),
    name: z.string().min(1),
    description: storedNullableString,
    image: storedNullableString,
    heroCopy: storedNullableString,
    active: storedNullableBoolean,
    sortOrder: storedNullableNumber,
  })
  .passthrough();

const storedInformationSchema = z
  .object({
    id: storedId,
    productId: storedId,
    details: storedNullableString,
    fabric: storedNullableString,
    care: storedNullableString,
    fit: storedNullableString,
    shipping: storedNullableString,
    seo: storedSeoSchema.nullable().optional(),
  })
  .passthrough();

const storedProductSchema = z
  .object({
    id: storedId,
    slug: z.string().min(1),
    name: z.string().min(1),
    description: storedNullableString,
    shortDescription: storedNullableString,
    categoryId: storedNullableString,
    categorySlug: storedNullableString,
    collectionId: storedNullableString,
    collectionSlug: storedNullableString,
    images: z.array(z.union([storedImageSchema, z.string().min(1)])).nullable().optional(),
    video: storedNullableString,
    hoverImage: storedNullableString,
    price: storedNullableNumber,
    oldPrice: storedNullableNumber,
    currency: storedNullableString,
    priceStatus: z.enum(["demo", "confirmed"]).nullable().optional(),
    sizes: z.array(z.string()).nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    availability: z.enum(["in-stock", "low-stock", "out-of-stock"]).nullable().optional(),
    sourcePostId: storedNullableString,
    sourceUrl: storedNullableString,
    isPrototypeData: storedNullableBoolean,
    badge: z.enum(["new", "featured", "sale"]).nullable().optional(),
    active: storedNullableBoolean,
    featured: storedNullableBoolean,
    colors: z.array(storedColorSchema).nullable().optional(),
    variants: z.array(storedVariantSchema).nullable().optional(),
    information: storedInformationSchema.nullable().optional(),
    seo: storedSeoSchema.nullable().optional(),
    createdAt: storedTimestamp,
    updatedAt: storedTimestamp,
  })
  .passthrough();

const storedProfileSchema = z
  .object({
    id: storedId,
    email: storedNullableString,
    fullName: storedNullableString,
    phone: storedNullableString,
    avatarUrl: storedNullableString,
    role: storedNullableString,
    createdAt: storedTimestamp,
    updatedAt: storedTimestamp,
  })
  .passthrough();

const storedAddressSchema = z
  .object({
    id: storedId,
    customerId: storedNullableString,
    orderId: storedNullableString,
    label: storedNullableString,
    fullName: z.string().min(1),
    line1: z.string().min(1),
    line2: storedNullableString,
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: storedNullableString,
    phone: storedNullableString,
  })
  .passthrough();

const storedCustomerSchema = z
  .object({
    id: storedId,
    profileId: storedNullableString,
    name: storedNullableString,
    email: storedNullableString,
    phone: storedNullableString,
    status: z.enum(["active", "inactive"]).nullable().optional(),
    orderCount: storedNullableNumber,
    totalSpent: storedNullableNumber,
    addresses: z.array(storedAddressSchema).nullable().optional(),
    createdAt: storedTimestamp,
    updatedAt: storedTimestamp,
  })
  .passthrough();

const storedOrderItemSchema = z
  .object({
    id: storedId,
    orderId: storedId,
    productId: storedNullableString,
    productSlug: storedNullableString,
    productName: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().finite().min(0),
    totalPrice: z.number().finite().min(0),
    size: storedNullableString,
    color: storedNullableString,
    image: storedNullableString,
  })
  .passthrough();

const storedOrderSchema = z
  .object({
    id: storedId,
    orderNumber: z.string().min(1),
    customerId: storedNullableString,
    profileId: storedNullableString,
    status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]),
    paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).nullable().optional(),
    paymentMethod: storedNullableString,
    currency: storedNullableString,
    subtotal: z.number().finite().min(0),
    shipping: z.number().finite().min(0),
    discount: z.number().finite().min(0),
    total: z.number().finite().min(0),
    couponCode: storedNullableString,
    shippingAddress: storedAddressSchema.nullable().optional(),
    billingAddress: storedAddressSchema.nullable().optional(),
    notes: storedNullableString,
    items: z.array(storedOrderItemSchema).nullable().optional(),
    createdAt: storedTimestamp,
    updatedAt: storedTimestamp,
  })
  .passthrough();

const storedPaymentAttemptSchema = z.object({
  id: storedId,
  orderId: storedId,
  provider: z.enum(["payu", "cashfree"]),
  transactionId: z.string().min(1),
  providerPaymentId: storedNullableString,
  status: z.enum(["created", "pending", "paid", "failed", "cancelled", "refunded"]),
  amount: z.number().finite().nonnegative(),
  currency: z.string().min(1),
  productInfo: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  couponId: storedNullableString,
  couponReserved: storedNullableBoolean,
  reservationExpiresAt: storedTimestamp,
  failureCode: storedNullableString,
  failureMessage: storedNullableString,
  verifiedAt: storedTimestamp,
  createdAt: storedTimestamp,
  updatedAt: storedTimestamp,
}).passthrough();

const storedReviewSchema = z
  .object({
    id: storedId,
    productId: storedNullableString,
    customerId: storedNullableString,
    authorName: z.string().min(1),
    authorEmail: storedNullableString,
    rating: z.number().int().min(1).max(5),
    title: storedNullableString,
    body: z.string().min(1),
    status: z.enum(["pending", "approved", "rejected"]).nullable().optional(),
    isHomeFeatured: storedNullableBoolean,
    createdAt: storedTimestamp,
    updatedAt: storedTimestamp,
  })
  .passthrough();

const storedInquirySchema = z
  .object({
    id: storedId,
    name: z.string().min(1),
    email: z.string().email(),
    phone: storedNullableString,
    subject: storedNullableString,
    message: z.string().min(1),
    status: z.enum(["unread", "read", "replied"]).nullable().optional(),
    createdAt: storedTimestamp,
    updatedAt: storedTimestamp,
  })
  .passthrough();

const storedSubscriberSchema = z
  .object({
    id: storedId,
    email: z.string().email(),
    name: storedNullableString,
    active: storedNullableBoolean,
    source: storedNullableString,
    subscribedAt: storedTimestamp,
  })
  .passthrough();

const storedHeroSlideSchema = z
  .object({
    id: storedId,
    title: z.string().min(1),
    subtitle: storedNullableString,
    image: z.string().min(1),
    imageAlt: storedNullableString,
    video: storedNullableString,
    cta: storedNullableString,
    ctaLink: storedNullableString,
    collectionSlug: storedNullableString,
    active: storedNullableBoolean,
    sortOrder: storedNullableNumber,
  })
  .passthrough();

const storedInstagramPostSchema = z
  .object({
    id: storedId,
    caption: storedNullableString,
    hashtags: z.array(z.string()).nullable().optional(),
    shortCode: storedNullableString,
    sourceUrl: storedNullableString,
    type: z.enum(["Image", "Video", "Sidecar"]).nullable().optional(),
    image: z.string().min(1),
    video: storedNullableString,
    timestamp: storedTimestamp,
    active: storedNullableBoolean,
    sortOrder: storedNullableNumber,
  })
  .passthrough();

const storedTestimonialSchema = z
  .object({
    id: storedId,
    authorName: z.string().min(1),
    quote: z.string().min(1),
    role: storedNullableString,
    image: storedNullableString,
    active: storedNullableBoolean,
    sortOrder: storedNullableNumber,
  })
  .passthrough();

const storedFaqSchema = z
  .object({
    id: storedId,
    question: z.string().min(1),
    answer: z.string().min(1),
    category: storedNullableString,
    active: storedNullableBoolean,
    sortOrder: storedNullableNumber,
  })
  .passthrough();

const storedAnnouncementSchema = z
  .object({
    id: storedId,
    text: z.string().min(1),
    active: storedNullableBoolean,
    sortOrder: storedNullableNumber,
    startsAt: storedTimestamp,
    endsAt: storedTimestamp,
  })
  .passthrough();

const storedSettingSchema = z
  .object({
    id: storedId,
    key: z.string().min(1),
    value: jsonValueSchema,
    description: storedNullableString,
    updatedAt: storedTimestamp,
  })
  .passthrough();

const storedCouponSchema = z
  .object({
    id: storedId,
    code: z.string().min(1),
    description: storedNullableString,
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().finite().positive(),
    minimumAmount: storedNullableNumber,
    maximumUses: storedNullableNumber,
    usedCount: storedNullableNumber,
    active: storedNullableBoolean,
    startsAt: storedTimestamp,
    endsAt: storedTimestamp,
  })
  .passthrough();

const storedShippingRateSchema = z
  .object({
    id: storedId,
    name: z.string().min(1),
    amount: z.number().finite().min(0),
    freeAbove: storedNullableNumber,
    codAvailable: storedNullableBoolean,
    active: storedNullableBoolean,
  })
  .passthrough();

const storedPromoSettingsSchema = z
  .object({
    id: storedId,
    enabled: z.boolean(),
    title: storedNullableString,
    body: storedNullableString,
    image: storedNullableString,
    ctaLabel: storedNullableString,
    ctaLink: storedNullableString,
    couponCode: storedNullableString,
    frequency: z.enum(["once", "session", "always"]).nullable().optional(),
    maxViews: storedNullableNumber,
    endsAt: storedTimestamp,
  })
  .passthrough();

const storedDiscoveryMenuEntrySchema = z
  .object({
    id: storedId,
    label: z.string().min(1),
    href: z.string().min(1),
    categoryId: storedNullableString,
    active: storedNullableBoolean,
    sortOrder: storedNullableNumber,
  })
  .passthrough();

export const adminDataStateSchema = z
  .object({
    products: z.array(storedProductSchema),
    categories: z.array(storedCategorySchema),
    collections: z.array(storedCollectionSchema),
    colors: z.array(storedColorSchema),
    variants: z.array(storedVariantSchema),
    images: z.array(storedImageSchema),
    productInformation: z.array(storedInformationSchema),
    profiles: z.array(storedProfileSchema),
    customers: z.array(storedCustomerSchema),
    addresses: z.array(storedAddressSchema),
    orders: z.array(storedOrderSchema),
    orderItems: z.array(storedOrderItemSchema),
    paymentAttempts: z.array(storedPaymentAttemptSchema).default([]),
    reviews: z.array(storedReviewSchema),
    inquiries: z.array(storedInquirySchema),
    subscribers: z.array(storedSubscriberSchema),
    heroSlides: z.array(storedHeroSlideSchema),
    instagramPosts: z.array(storedInstagramPostSchema),
    testimonials: z.array(storedTestimonialSchema),
    faqs: z.array(storedFaqSchema),
    announcements: z.array(storedAnnouncementSchema),
    settings: z.array(storedSettingSchema),
    coupons: z.array(storedCouponSchema),
    shippingRates: z.array(storedShippingRateSchema),
    promoSettings: storedPromoSettingsSchema,
    discoveryMenuEntries: z.array(storedDiscoveryMenuEntrySchema),
  })
  .strict();

const writeQueues = new Map<string, Promise<void>>();

function enqueueWrite<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const previous = writeQueues.get(filePath) ?? Promise.resolve();
  const current = previous.then(operation);
  const marker = current.then(
    () => undefined,
    () => undefined
  );
  writeQueues.set(filePath, marker);

  return current.then(
    (value) => {
      if (writeQueues.get(filePath) === marker) writeQueues.delete(filePath);
      return value;
    },
    (error: unknown) => {
      if (writeQueues.get(filePath) === marker) writeQueues.delete(filePath);
      throw error;
    }
  );
}

export interface LocalStoreOptions {
  filePath?: string;
  seed?: () => AdminDataState;
}

function cloneState(state: AdminDataState): AdminDataState {
  return JSON.parse(JSON.stringify(state)) as AdminDataState;
}

function parseState(raw: string): AdminDataState {
  try {
    const parsed: unknown = JSON.parse(raw);
    return adminDataStateSchema.parse(parsed) as unknown as AdminDataState;
  } catch {
    throw new DataProviderError(
      "storage",
      "Local provider data is invalid. Repair or remove the local data file before continuing."
    );
  }
}

function isMissingFile(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && error.code === "ENOENT"
  );
}

export class LocalStore {
  readonly filePath: string;
  private readonly seed: () => AdminDataState;

  constructor(options: LocalStoreOptions = {}) {
    this.filePath = options.filePath ?? LOCAL_DATA_FILE;
    this.seed = options.seed ?? createSeedData;
  }

  async read(): Promise<AdminDataState> {
    const pending = writeQueues.get(this.filePath);
    if (pending) await pending;
    return this.readUnlocked();
  }

  private async readUnlocked(): Promise<AdminDataState> {
    try {
      return parseState(await readFile(this.filePath, "utf8"));
    } catch (error) {
      if (!isMissingFile(error)) {
        if (error instanceof DataProviderError) throw error;
        throw new DataProviderError(
          "storage",
          "Local provider data could not be read. Check the local data file and permissions."
        );
      }

      const seeded = cloneState(this.seed());
      await this.writeNow(seeded);
      return seeded;
    }
  }

  async write(state: AdminDataState): Promise<void> {
    await enqueueWrite(this.filePath, () => this.writeNow(state));
  }

  async update(
    updater: (state: AdminDataState) => AdminDataState | Promise<AdminDataState>
  ): Promise<AdminDataState> {
    return enqueueWrite(this.filePath, async () => {
      const current = await this.readUnlocked();
      const next = cloneState(await updater(current));
      await this.writeNow(next);
      return next;
    });
  }

  private async writeNow(state: AdminDataState): Promise<void> {
    try {
      adminDataStateSchema.parse(state);
      await mkdir(dirname(this.filePath), { recursive: true });
      const temporaryPath = join(
        dirname(this.filePath),
        `.${this.filePath.split(/[\\/]/).pop() ?? "admin"}.${randomUUID()}.tmp`
      );
      await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
      await rename(temporaryPath, this.filePath);
    } catch (error) {
      if (error instanceof DataProviderError) throw error;
      throw new DataProviderError(
        "storage",
        "Local provider data could not be written atomically. Check the local data directory and permissions."
      );
    }
  }
}

export function createLocalStore(options: LocalStoreOptions = {}): LocalStore {
  return new LocalStore(options);
}
