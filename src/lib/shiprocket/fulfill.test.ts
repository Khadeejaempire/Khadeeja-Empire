import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { mapShiprocketStatus } from "./fulfill";

vi.mock("./api", () => ({
  createShiprocketOrder: vi.fn().mockResolvedValue({ orderId: 1, shipmentId: 2 }),
  getShiprocketApiConfig: () => ({ pickupLocation: undefined }),
  isShiprocketConfigured: () => true,
}));

type OrderLike = Parameters<typeof import("./fulfill").buildShiprocketOrderPayload>[0];

const baseOrder = {
  orderNumber: "KE-1001",
  paymentStatus: "paid",
  paymentMethod: "payu",
  subtotal: 1998,
  shipping: 60,
  discount: 0,
  total: 2058,
  createdAt: "2026-09-11T10:00:00.000Z",
  shippingAddress: {
    id: "a1",
    fullName: "Aisha Rahman",
    line1: "12 Rose Road",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    phone: "9876543210",
  },
  items: [
    { id: "i1", orderId: "o1", productName: "Amber Kurti", productSlug: "amber-kurti", quantity: 2, unitPrice: 499, totalPrice: 998, size: "M" },
  ],
} as unknown as OrderLike;

describe("shiprocket fulfill", () => {
  it("builds the adhoc order payload from an order", async () => {
    const { buildShiprocketOrderPayload } = await import("./fulfill");
    const payload = buildShiprocketOrderPayload(baseOrder);
    expect(payload.order_id).toBe("KE-1001");
    expect(payload.order_date).toBe("2026-09-11");
    expect(payload.payment_method).toBe("Prepaid");
    expect(payload.sub_total).toBe(1998);
    expect(payload.billing_pincode).toBe("560001");
    expect(payload.billing_customer_name).toBe("Aisha");
    expect(payload.billing_last_name).toBe("Rahman");
    expect(payload.billing_address).toContain("12 Rose Road");
    expect(payload.billing_email).toBe("");
    expect(payload.billing_phone).toBe("9876543210");
    expect(payload.shipping_is_billing).toBe(true);
    expect(payload.order_items[0]).toMatchObject({ name: "Amber Kurti", units: 2, selling_price: 499 });
  });

  it("includes payment contact details when provided", async () => {
    const { buildShiprocketOrderPayload } = await import("./fulfill");
    const payload = buildShiprocketOrderPayload(baseOrder, { email: "buyer@example.com", phone: "9999999999" });
    expect(payload.billing_email).toBe("buyer@example.com");
    expect(payload.billing_phone).toBe("9999999999");
  });

  it("throws when the order has no address", async () => {
    const { buildShiprocketOrderPayload } = await import("./fulfill");
    expect(() => buildShiprocketOrderPayload({ ...baseOrder, shippingAddress: null, billingAddress: null })).toThrow(
      /no shipping address/
    );
  });

  it("maps tracking statuses", async () => {
    expect(mapShiprocketStatus("DELIVERED", "")).toBe("delivered");
    expect(mapShiprocketStatus("IN TRANSIT", "")).toBe("shipped");
    expect(mapShiprocketStatus("OUT FOR DELIVERY", "")).toBe("shipped");
    expect(mapShiprocketStatus("PICKED UP", "")).toBe("shipped");
    expect(mapShiprocketStatus("RTO INITIATED", "")).toBe("cancelled");
    expect(mapShiprocketStatus("UNDELIVERED", "")).toBe("cancelled");
    expect(mapShiprocketStatus("CANCELLED", "")).toBe("cancelled");
    expect(mapShiprocketStatus("SOMETHING ELSE", "")).toBe(null);
  });

  it("invokes the Shiprocket API with a config-overridden pickup location", async () => {
    const { createShiprocketOrder } = await import("./api");
    const { fulfillWithShiprocket } = await import("./fulfill");
    await fulfillWithShiprocket(baseOrder, { email: "buyer@example.com", phone: "9999999999" });
    expect(vi.mocked(createShiprocketOrder)).toHaveBeenCalledWith(
      expect.objectContaining({ billing_email: "buyer@example.com", billing_phone: "9999999999" })
    );
  });
});
