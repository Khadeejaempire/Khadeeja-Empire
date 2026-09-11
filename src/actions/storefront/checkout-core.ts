import { createHash } from "node:crypto";
import { z } from "zod";
import type {
  AddressRecord,
  CouponRecord,
  OrderItemMutationInput,
  OrderRecord,
  ProductRecord,
  ShippingRateRecord,
} from "../../lib/admin/types";
import type { DataProvider } from "../../lib/data/provider";

const money = z.number().finite().nonnegative();

export const checkoutInputSchema = z
  .object({
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/, "The checkout attempt identifier is invalid."),
    items: z
      .array(
        z
          .object({
            productId: z.string().trim().min(1).max(160),
            quantity: z.number().int().min(1).max(20),
            size: z.string().trim().max(80).optional(),
            color: z.string().trim().max(80).optional(),
          })
          .strict()
      )
      .min(1, "Your bag is empty.")
      .max(50),
    customer: z
      .object({
        name: z.string().trim().min(2).max(120).refine((value) => !value.includes("|"), "Name contains an unsupported character."),
        email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
        phone: z.string().trim().regex(/^[+0-9][0-9\s-]{8,18}$/, "Enter a valid phone number."),
      })
      .strict(),
    paymentMethod: z.enum(["cod", "payu"]),
    shippingAddress: z
      .object({
        line1: z.string().trim().min(5).max(200),
        line2: z.string().trim().max(200).optional(),
        city: z.string().trim().min(2).max(100),
        state: z.string().trim().min(2).max(100),
        postalCode: z.string().trim().min(4).max(12),
        country: z.string().trim().length(2).default("IN"),
      })
      .strict(),
    couponCode: z.string().trim().max(40).optional(),
    shippingRateId: z.string().trim().max(160).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type CheckoutInput = z.input<typeof checkoutInputSchema>;
export type ValidCheckoutInput = z.output<typeof checkoutInputSchema>;

export class CheckoutError extends Error {
  constructor(
    readonly code:
      | "CART_INVALID"
      | "PRODUCT_UNAVAILABLE"
      | "STOCK_UNAVAILABLE"
      | "COUPON_INVALID"
      | "SHIPPING_INVALID",
    message: string
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export interface CheckoutQuote {
  currency: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode: string | null;
  couponId: string | null;
  items: OrderItemMutationInput[];
}

export type CouponPreviewResult = {
  valid: boolean;
  code?: string;
  discount?: number;
  message?: string;
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function primaryImage(product: ProductRecord): string | null {
  const first = product.images?.[0];
  if (!first) return null;
  return typeof first === "string" ? first : first.url;
}

function usablePrice(value: number | null | undefined): number | null {
  const parsed = money.safeParse(value);
  return parsed.success ? roundMoney(parsed.data) : null;
}

function chooseUnitPrice(
  product: ProductRecord,
  requested: ValidCheckoutInput["items"][number]
): number {
  const variants = (product.variants ?? []).filter((variant) => variant.active !== false);
  if (variants.length === 0) {
    if (requested.size && product.sizes?.length && !product.sizes.includes(requested.size)) {
      throw new CheckoutError("PRODUCT_UNAVAILABLE", `${product.name} is not available in that size.`);
    }
    const price = usablePrice(product.price);
    if (price === null) throw new CheckoutError("PRODUCT_UNAVAILABLE", `${product.name} has no valid price.`);
    return price;
  }

  const colors = product.colors ?? [];
  const variant = variants.find((candidate) => {
    const sizeMatches = requested.size ? candidate.size === requested.size : true;
    if (!requested.color) return sizeMatches;
    const color = colors.find((entry) => entry.id === candidate.colorId);
    return (
      sizeMatches &&
      (candidate.colorId === requested.color ||
        color?.name.toLowerCase() === requested.color.toLowerCase())
    );
  });

  if (!variant) {
    throw new CheckoutError("PRODUCT_UNAVAILABLE", `${product.name} is not available in that option.`);
  }
  if (variant.stock != null && variant.stock < requested.quantity) {
    throw new CheckoutError("STOCK_UNAVAILABLE", `Only ${variant.stock} of ${product.name} are available.`);
  }
  const price = usablePrice(variant.price ?? product.price);
  if (price === null) throw new CheckoutError("PRODUCT_UNAVAILABLE", `${product.name} has no valid price.`);
  return price;
}

function couponIsCurrent(coupon: CouponRecord, now: number): boolean {
  const starts = coupon.startsAt ? Date.parse(coupon.startsAt) : null;
  const ends = coupon.endsAt ? Date.parse(coupon.endsAt) : null;
  return (
    coupon.active !== false &&
    (starts === null || (Number.isFinite(starts) && starts <= now)) &&
    (ends === null || (Number.isFinite(ends) && ends >= now)) &&
    (coupon.maximumUses == null || (coupon.usedCount ?? 0) < coupon.maximumUses)
  );
}

function calculateDiscount(coupon: CouponRecord, subtotal: number): number {
  if (coupon.minimumAmount != null && subtotal < coupon.minimumAmount) {
    throw new CheckoutError(
      "COUPON_INVALID",
      `This coupon requires a minimum order of ${coupon.minimumAmount}.`
    );
  }
  const raw =
    coupon.discountType === "percentage"
      ? subtotal * (coupon.discountValue / 100)
      : coupon.discountValue;
  return roundMoney(Math.min(subtotal, Math.max(0, raw)));
}

export async function previewCoupon(
  provider: DataProvider,
  code: string,
  subtotal: number,
  now = Date.now()
): Promise<CouponPreviewResult> {
  const requested = code.trim().toUpperCase();
  if (!requested) return { valid: false, message: "Enter a coupon code." };
  const coupons = await provider.listCoupons({ active: true, search: requested });
  const coupon = coupons.find((candidate) => candidate.code.toUpperCase() === requested);
  if (!coupon || !couponIsCurrent(coupon, now)) {
    return { valid: false, message: "That coupon is invalid or has expired." };
  }
  try {
    const discount = calculateDiscount(coupon, subtotal);
    return { valid: true, code: coupon.code, discount };
  } catch (error) {
    if (error instanceof CheckoutError) return { valid: false, message: error.message };
    throw error;
  }
}

async function shippingAmount(
  provider: DataProvider,
  subtotal: number,
  requestedId?: string
): Promise<number> {
  const rates = await provider.listShippingRates({ active: true });
  let rate: ShippingRateRecord | undefined;
  if (requestedId) {
    rate = rates.find((candidate) => candidate.id === requestedId);
    if (!rate) throw new CheckoutError("SHIPPING_INVALID", "That shipping option is unavailable.");
  } else {
    rate = rates[0];
  }
  if (rate) return rate.freeAbove != null && subtotal >= rate.freeAbove ? 0 : roundMoney(rate.amount);

  const [defaultSetting, thresholdSetting] = await Promise.all([
    provider.getSetting("shipping.defaultRate"),
    provider.getSetting("shipping.freeThreshold"),
  ]);
  const defaultRate = typeof defaultSetting?.value === "number" ? defaultSetting.value : 0;
  const threshold = typeof thresholdSetting?.value === "number" ? thresholdSetting.value : null;
  return threshold != null && subtotal >= threshold ? 0 : roundMoney(Math.max(0, defaultRate));
}

export async function buildCheckoutQuote(
  provider: DataProvider,
  input: ValidCheckoutInput,
  now = Date.now()
): Promise<CheckoutQuote> {
  const grouped = new Map<string, ValidCheckoutInput["items"][number]>();
  for (const item of input.items) {
    const key = `${item.productId}\u0000${item.size ?? ""}\u0000${item.color ?? ""}`;
    const current = grouped.get(key);
    const quantity = (current?.quantity ?? 0) + item.quantity;
    if (quantity > 20) throw new CheckoutError("CART_INVALID", "An item quantity cannot exceed 20.");
    grouped.set(key, { ...item, quantity });
  }

  const products = await Promise.all(
    [...grouped.values()].map(async (item) => ({ item, product: await provider.getProduct(item.productId) }))
  );
  let currency: string | null = null;
  const items: OrderItemMutationInput[] = products.map(({ item, product }) => {
    if (!product || product.active === false || product.availability === "out-of-stock") {
      throw new CheckoutError("PRODUCT_UNAVAILABLE", "A product in your bag is no longer available.");
    }
    const productCurrency = product.currency ?? "INR";
    if (currency && currency !== productCurrency) {
      throw new CheckoutError("CART_INVALID", "Products with different currencies cannot be combined.");
    }
    currency = productCurrency;
    const unitPrice = chooseUnitPrice(product, item);
    return {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice: roundMoney(unitPrice * item.quantity),
      size: item.size ?? null,
      color: item.color ?? null,
      image: primaryImage(product),
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.totalPrice, 0));
  let coupon: CouponRecord | undefined;
  const requestedCoupon = input.couponCode?.trim().toUpperCase();
  if (requestedCoupon) {
    const coupons = await provider.listCoupons({ active: true, search: requestedCoupon });
    coupon = coupons.find((candidate) => candidate.code.toUpperCase() === requestedCoupon);
    if (!coupon || !couponIsCurrent(coupon, now)) {
      throw new CheckoutError("COUPON_INVALID", "That coupon is invalid or has expired.");
    }
  }
  const discount = coupon ? calculateDiscount(coupon, subtotal) : 0;
  const shipping = await shippingAmount(provider, subtotal, input.shippingRateId);

  return {
    currency: currency ?? "INR",
    subtotal,
    shipping,
    discount,
    total: roundMoney(Math.max(0, subtotal + shipping - discount)),
    couponCode: coupon?.code ?? null,
    couponId: coupon?.id ?? null,
    items,
  };
}

export function checkoutOrderNumber(customerId: string, idempotencyKey: string): string {
  const digest = createHash("sha256")
    .update(`${customerId}\u0000${idempotencyKey}`)
    .digest("hex")
    .slice(0, 20)
    .toUpperCase();
  return `KE-${digest}`;
}

export function checkoutAddress(
  customerId: string,
  phone: string,
  name: string,
  input: ValidCheckoutInput["shippingAddress"],
  orderNumber: string
): AddressRecord {
  return {
    id: `address-${orderNumber.toLowerCase()}`,
    customerId,
    label: "Shipping",
    fullName: name,
    line1: input.line1,
    line2: input.line2 ?? null,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    country: input.country,
    phone,
  };
}

export function publicOrder(order: OrderRecord) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    currency: order.currency ?? "INR",
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    paymentStatus: order.paymentStatus,
  };
}
