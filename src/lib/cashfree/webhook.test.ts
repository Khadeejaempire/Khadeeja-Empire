// @vitest-environment node

import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  processReturn: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./config", () => ({ getCashfreeConfig: () => ({ secretKey: "TEST_secret" }) }));
vi.mock("./process", () => ({ processCashfreeReturn: mocks.processReturn }));

import { processCashfreeWebhook, verifyCashfreeWebhookSignature } from "./webhook";

function signedHeaders(rawBody: string) {
  const timestamp = "1785401067911";
  const signature = createHmac("sha256", "TEST_secret").update(`${timestamp}${rawBody}`).digest("base64");
  return new Headers({ "x-webhook-timestamp": timestamp, "x-webhook-signature": signature });
}

describe("Cashfree webhook processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.processReturn.mockResolvedValue({ orderNumber: "KE-1", status: "success" });
  });

  it("verifies the Cashfree raw-body signature", () => {
    const rawBody = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "KE-1" } } });
    const headers = signedHeaders(rawBody);
    expect(verifyCashfreeWebhookSignature(rawBody, headers.get("x-webhook-signature"), headers.get("x-webhook-timestamp"))).toBe(true);
    expect(verifyCashfreeWebhookSignature(`${rawBody} `, headers.get("x-webhook-signature"), headers.get("x-webhook-timestamp"))).toBe(false);
  });

  it("processes a signed webhook through server-side Cashfree verification", async () => {
    const rawBody = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "KE-1" } } });
    await expect(processCashfreeWebhook(rawBody, signedHeaders(rawBody))).resolves.toEqual({ orderNumber: "KE-1", status: "success", eventType: "PAYMENT_SUCCESS_WEBHOOK" });
    expect(mocks.processReturn).toHaveBeenCalledWith("KE-1");
  });

  it("rejects an invalid signature", async () => {
    const rawBody = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "KE-1" } } });
    const headers = signedHeaders(rawBody);
    headers.set("x-webhook-signature", "invalid");
    await expect(processCashfreeWebhook(rawBody, headers)).rejects.toThrow(/signature/);
    expect(mocks.processReturn).not.toHaveBeenCalled();
  });
});
