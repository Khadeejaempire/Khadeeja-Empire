// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./config", () => ({ getCashfreeConfig: () => ({ appId: "TEST_app", secretKey: "TEST_secret", environment: "sandbox", apiUrl: "https://sandbox.cashfree.com/pg", siteUrl: "https://shop.example" }) }));

import { createCashfreeOrder, verifyCashfreePayment } from "./payment";

const attempt = { transactionId: "KE-1", amount: 849, currency: "INR", customerName: "Buyer", customerEmail: "buyer@example.com", customerPhone: "+91 98765 43210", productInfo: "Order KE-1" } as never;

describe("Cashfree payment API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("creates a server-side Cashfree order and returns only the session to the client", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ order_id: "KE-1", order_status: "ACTIVE", order_amount: 849, order_currency: "INR", payment_session_id: "session-1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createCashfreeOrder(attempt, "customer-1")).resolves.toEqual({ paymentSessionId: "session-1", environment: "sandbox" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://sandbox.cashfree.com/pg/orders");
    expect(init.headers).toMatchObject({ "x-client-id": "TEST_app", "x-client-secret": "TEST_secret", "x-api-version": "2025-01-01" });
    expect(JSON.parse(init.body)).toMatchObject({ order_id: "KE-1", order_meta: { return_url: "https://shop.example/api/payments/cashfree/return?order_id={order_id}" } });
  });

  it("accepts paid status only from Cashfree's order API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ order_id: "KE-1", order_status: "PAID", order_amount: "849.00", order_currency: "INR", cf_order_id: 123 }), { status: 200 })));
    await expect(verifyCashfreePayment("KE-1")).resolves.toEqual({ status: "success", transactionId: "KE-1", amount: 849, providerPaymentId: "123" });
  });
});
