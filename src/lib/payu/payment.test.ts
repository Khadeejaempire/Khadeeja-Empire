// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./config", () => ({ getPayUConfig: () => ({ key: "merchant", salt: "salt-1234", verifyUrl: "https://test.payu.in/merchant/postservice.php?form=2" }) }));

import { sha512 } from "./hash";
import { verifyPayment } from "./payment";

describe("PayU Verify Payment API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("signs the server request and returns reconciled details", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 1,
      transaction_details: { "KE-1": { txnid: "KE-1", status: "success", amt: "849.00", mihpayid: "PAYU-9" } },
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyPayment("KE-1")).resolves.toEqual({ status: "success", transactionId: "KE-1", amount: "849.00", providerPaymentId: "PAYU-9" });
    const [, init] = fetchMock.mock.calls[0];
    const body = init.body as URLSearchParams;
    expect(Object.fromEntries(body)).toEqual({
      key: "merchant", command: "verify_payment", var1: "KE-1",
      hash: sha512("merchant|verify_payment|KE-1|salt-1234"),
    });
  });

  it("rejects mismatched or missing authoritative details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ transaction_details: { "KE-1": { txnid: "OTHER", status: "success", amt: "849.00" } } }), { status: 200 })));
    await expect(verifyPayment("KE-1")).rejects.toThrow(/does not match/);
  });

  it("rejects a non-successful HTTP response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no", { status: 503 })));
    await expect(verifyPayment("KE-1")).rejects.toThrow(/failed/);
  });
});
