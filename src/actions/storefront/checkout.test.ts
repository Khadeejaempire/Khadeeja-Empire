// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, getDataProviderMock, buildHostedCheckoutMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  getDataProviderMock: vi.fn(),
  buildHostedCheckoutMock: vi.fn(() => ({ actionUrl: "https://test.payu.in/_payment", fields: { txnid: "KE-TEST", hash: "hash" } })),
}));

vi.mock("server-only", () => ({}));
vi.mock("../../lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));
vi.mock("../../lib/data", () => ({ getDataProvider: getDataProviderMock }));
vi.mock("../../lib/payu/payment", () => ({ buildHostedCheckout: buildHostedCheckoutMock }));

import { placeOrder, previewCouponAction } from "./checkout";

const loggedInCustomer = { id: "customer-1", email: "demo@example.com", phone: "+919876543210" };

const input = {
  idempotencyKey: "checkout_attempt_123",
  items: [{ productId: "product-1", quantity: 1, size: "M" }],
  customer: { name: "Demo Customer", email: "demo@example.com", phone: "+919876543210" },
  paymentMethod: "cod" as const,
  shippingAddress: {
    line1: "1 Demo Road",
    city: "Varanasi",
    state: "Uttar Pradesh",
    postalCode: "221001",
    country: "IN",
  },
};

describe("placeOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { email: "demo@example.com" } } });
  });

  it("requires a signed-in customer", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(placeOrder(input)).resolves.toMatchObject({
      ok: false,
      code: "UNAUTHENTICATED",
    });
    expect(getDataProviderMock).not.toHaveBeenCalled();
  });

  it("creates a confirmed, mock-paid order from server-side records", async () => {
    const createOrder = vi.fn(async (order) => ({
      ...order,
      id: "order-1",
      orderNumber: order.orderNumber,
    }));
    const data = {
      listCustomers: vi.fn().mockResolvedValue([loggedInCustomer]),
      getOrder: vi.fn().mockResolvedValue(null),
      updateCustomer: vi.fn().mockResolvedValue({ id: "customer-1" }),
      getProduct: vi.fn().mockResolvedValue({
        id: "product-1",
        slug: "demo-product",
        name: "Demo Product",
        price: 750,
        currency: "INR",
        active: true,
        availability: "in-stock",
        sizes: ["M"],
      }),
      listCoupons: vi.fn().mockResolvedValue([]),
      listShippingRates: vi.fn().mockResolvedValue([
        { id: "standard", name: "Standard", amount: 99, active: true },
      ]),
      createOrder,
    };
    getDataProviderMock.mockReturnValue(data);

    const result = await placeOrder(input);

    expect(result).toMatchObject({ ok: true, replayed: false, order: { total: 849 } });
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "customer-1",
        status: "confirmed",
        paymentStatus: "pending",
        paymentMethod: "cod",
        subtotal: 750,
        shipping: 99,
        total: 849,
      })
    );
  });

  it("returns the existing customer order for an idempotent replay", async () => {
    getDataProviderMock.mockReturnValue({
      listCustomers: vi.fn().mockResolvedValue([loggedInCustomer]),
      getOrder: vi.fn().mockResolvedValue({
        id: "order-existing",
        orderNumber: "KE-DEMO-EXISTING",
        customerId: "customer-1",
        subtotal: 10,
        shipping: 0,
        discount: 0,
        total: 10,
        status: "confirmed",
        paymentStatus: "paid",
      }),
    });

    await expect(placeOrder(input)).resolves.toMatchObject({ ok: true, replayed: true });
  });

  it("applies a valid coupon and increments its used count", async () => {
    const createOrder = vi.fn(async (order) => ({
      ...order,
      id: "order-coupon",
      orderNumber: order.orderNumber,
    }));
    const incrementCouponUse = vi.fn().mockResolvedValue({ id: "coupon-1", usedCount: 1 });
    const data = {
      listCustomers: vi.fn().mockResolvedValue([loggedInCustomer]),
      getOrder: vi.fn().mockResolvedValue(null),
      updateCustomer: vi.fn().mockResolvedValue({ id: "customer-1" }),
      getProduct: vi.fn().mockResolvedValue({
        id: "product-1",
        slug: "demo-product",
        name: "Demo Product",
        price: 1000,
        currency: "INR",
        active: true,
        availability: "in-stock",
        sizes: ["M"],
      }),
      listCoupons: vi.fn().mockResolvedValue([
        {
          id: "coupon-1",
          code: "SAVE10",
          discountType: "percentage",
          discountValue: 10,
          active: true,
          usedCount: 0,
          maximumUses: 2,
        },
      ]),
      listShippingRates: vi.fn().mockResolvedValue([
        { id: "standard", name: "Standard", amount: 99, active: true },
      ]),
      createOrder,
      incrementCouponUse,
    };
    getDataProviderMock.mockReturnValue(data);

    const result = await placeOrder({ ...input, couponCode: "save10" });

    expect(result).toMatchObject({ ok: true, replayed: false, order: { total: 999 } });
    expect(incrementCouponUse).toHaveBeenCalledWith("coupon-1");
  });

  it("creates a pending PayU attempt without consuming the coupon", async () => {
    const createOrder = vi.fn(async (order) => ({ ...order, id: "order-payu", orderNumber: order.orderNumber }));
    const createPaymentAttempt = vi.fn(async (attempt) => ({ ...attempt, id: "attempt-1" }));
    const incrementCouponUse = vi.fn();
    getDataProviderMock.mockReturnValue({
      listCustomers: vi.fn().mockResolvedValue([loggedInCustomer]), getOrder: vi.fn().mockResolvedValue(null),
      updateCustomer: vi.fn().mockResolvedValue(loggedInCustomer),
      getProduct: vi.fn().mockResolvedValue({ id: "product-1", slug: "demo-product", name: "Demo Product", price: 1000, currency: "INR", active: true, availability: "in-stock", sizes: ["M"] }),
      listCoupons: vi.fn().mockResolvedValue([{ id: "coupon-1", code: "SAVE10", discountType: "percentage", discountValue: 10, active: true, usedCount: 0 }]),
      listShippingRates: vi.fn().mockResolvedValue([{ id: "standard", name: "Standard", amount: 99, active: true }]),
      createOrder, createPaymentAttempt, incrementCouponUse,
    });

    const result = await placeOrder({ ...input, paymentMethod: "payu", couponCode: "SAVE10" });

    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ status: "pending", paymentStatus: "pending", paymentMethod: "payu", total: 999 }));
    expect(createPaymentAttempt).toHaveBeenCalledWith(expect.objectContaining({ orderId: "order-payu", amount: 999, status: "pending", customerPhone: "+919876543210", couponId: "coupon-1" }));
    expect(incrementCouponUse).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, mode: "payu", gateway: { actionUrl: "https://test.payu.in/_payment" } });
  });
});

describe("previewCouponAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("previews a valid coupon discount", async () => {
    getDataProviderMock.mockReturnValue({
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
    });

    await expect(previewCouponAction("SAVE10", 1000)).resolves.toEqual({
      valid: true,
      code: "SAVE10",
      discount: 100,
    });
  });
});
