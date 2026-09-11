// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  provider: { getPaymentAttemptByTransactionId: vi.fn(), getOrder: vi.fn(), applyVerifiedPaymentResult: vi.fn() },
  parse: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data", () => ({ getDataProvider: () => mocks.provider }));
vi.mock("./payment", () => ({ parseAndVerifyCallback: mocks.parse, verifyPayment: mocks.verify }));

import { formDataToFields, processPayUResponse } from "./process";

const callback = { txnid: "KE-1", amount: "849.00", productinfo: "Order KE-1", email: "buyer@example.com", firstname: "Buyer", udf1: "KE-1", mihpayid: "payu-9" };
const attempt = { id: "a1", orderId: "o1", transactionId: "KE-1", amount: 849, productInfo: "Order KE-1", customerEmail: "buyer@example.com", customerName: "Buyer" };
const order = { id: "o1", orderNumber: "KE-1", paymentMethod: "payu" };

describe("PayU response processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.parse.mockReturnValue(callback);
    mocks.provider.getPaymentAttemptByTransactionId.mockResolvedValue(attempt);
    mocks.provider.getOrder.mockResolvedValue(order);
  });

  it("marks paid only after server verification succeeds", async () => {
    mocks.verify.mockResolvedValue({ status: "success", transactionId: "KE-1", amount: "849.00", providerPaymentId: "payu-9" });
    await expect(processPayUResponse({ hash: "signed" })).resolves.toEqual({ orderNumber: "KE-1", status: "success" });
    expect(mocks.provider.applyVerifiedPaymentResult).toHaveBeenCalledWith({ transactionId: "KE-1", status: "paid", providerPaymentId: "payu-9" });
  });

  it("records a verified failure", async () => {
    mocks.parse.mockReturnValue({ ...callback, error: "E101", error_Message: "Declined" });
    mocks.verify.mockResolvedValue({ status: "failure", transactionId: "KE-1", amount: "849.00", providerPaymentId: "payu-9" });
    await processPayUResponse({});
    expect(mocks.provider.applyVerifiedPaymentResult).toHaveBeenCalledWith(expect.objectContaining({ status: "failed", failureCode: "E101", failureMessage: "Declined" }));
  });

  it("does not mutate a still-pending payment", async () => {
    mocks.verify.mockResolvedValue({ status: "pending", transactionId: "KE-1", amount: "849.00" });
    await processPayUResponse({});
    expect(mocks.provider.applyVerifiedPaymentResult).not.toHaveBeenCalled();
  });

  it("rejects a verification response with another amount", async () => {
    mocks.verify.mockResolvedValue({ status: "success", transactionId: "KE-1", amount: "1.00" });
    await expect(processPayUResponse({})).rejects.toThrow(/does not match/);
    expect(mocks.provider.applyVerifiedPaymentResult).not.toHaveBeenCalled();
  });

  it.each([
    ["amount", { amount: "848.99" }], ["order", { udf1: "KE-X" }],
    ["email", { email: "attacker@example.com" }], ["name", { firstname: "Other" }],
    ["product", { productinfo: "Other" }],
  ])("rejects a signed but mismatched %s", async (_label, change) => {
    mocks.parse.mockReturnValue({ ...callback, ...change });
    await expect(processPayUResponse({})).rejects.toThrow(/does not match/);
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.provider.applyVerifiedPaymentResult).not.toHaveBeenCalled();
  });

  it("rejects duplicate form fields", () => {
    const form = new FormData();
    form.append("txnid", "one"); form.append("txnid", "two");
    expect(() => formDataToFields(form)).toThrow(/Invalid PayU form payload/);
  });
});
