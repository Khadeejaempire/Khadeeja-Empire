// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import type { DataProvider } from "../../lib/data/provider";
import { buildCheckoutQuote, checkoutInputSchema, checkoutOrderNumber } from "./checkout-core";

function provider(overrides: Partial<DataProvider>): DataProvider {
  return overrides as DataProvider;
}

const validInput = checkoutInputSchema.parse({
  idempotencyKey: "checkout_attempt_123",
  items: [{ productId: "product-1", quantity: 2, size: "M" }],
  customer: { name: "Demo Customer", email: "DEMO@example.com", phone: "+919876543210" },
  paymentMethod: "cod",
  shippingAddress: {
    line1: "1 Demo Road",
    city: "Varanasi",
    state: "Uttar Pradesh",
    postalCode: "221001",
    country: "IN",
  },
  couponCode: "save10",
});

describe("storefront checkout quote", () => {
  it("recalculates product prices, coupon, and shipping from provider records", async () => {
    const data = provider({
      getProduct: vi.fn().mockResolvedValue({
        id: "product-1",
        slug: "demo-product",
        name: "Demo Product",
        price: 500,
        currency: "INR",
        active: true,
        availability: "in-stock",
        sizes: ["S", "M"],
        images: ["/assets/demo.jpg"],
      }),
      listCoupons: vi.fn().mockResolvedValue([
        {
          id: "coupon-1",
          code: "SAVE10",
          discountType: "percentage",
          discountValue: 10,
          active: true,
          usedCount: 0,
        },
      ]),
      listShippingRates: vi.fn().mockResolvedValue([
        { id: "standard", name: "Standard", amount: 99, freeAbove: 900, active: true },
      ]),
    });

    const quote = await buildCheckoutQuote(data, validInput, Date.parse("2026-08-06T00:00:00Z"));

    expect(quote).toMatchObject({
      currency: "INR",
      subtotal: 1000,
      shipping: 0,
      discount: 100,
      total: 900,
      couponCode: "SAVE10",
    });
    expect(quote.items[0]).toMatchObject({ unitPrice: 500, quantity: 2, totalPrice: 1000 });
  });

  it("rejects inactive products before an order can be created", async () => {
    const data = provider({
      getProduct: vi.fn().mockResolvedValue({
        id: "product-1",
        slug: "inactive",
        name: "Inactive",
        price: 1,
        active: false,
      }),
    });

    await expect(buildCheckoutQuote(data, { ...validInput, couponCode: undefined })).rejects.toMatchObject({
      code: "PRODUCT_UNAVAILABLE",
    });
  });

  it("binds idempotency order numbers to both customer and attempt", () => {
    expect(checkoutOrderNumber("customer-a", "attempt-123")).toBe(
      checkoutOrderNumber("customer-a", "attempt-123")
    );
    expect(checkoutOrderNumber("customer-a", "attempt-123")).not.toBe(
      checkoutOrderNumber("customer-b", "attempt-123")
    );
  });
});
