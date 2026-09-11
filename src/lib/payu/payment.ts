import "server-only";

import { z } from "zod";
import type { PaymentAttemptRecord } from "@/lib/admin/types";
import { getPayUConfig } from "./config";
import { createRequestHash, createResponseHash, formatPayUAmount, secureHashEquals, sha512 } from "./hash";

export type HostedCheckout = { actionUrl: string; fields: Record<string, string> };

export function buildHostedCheckout(attempt: PaymentAttemptRecord, orderNumber: string): HostedCheckout {
  const config = getPayUConfig();
  const signed = {
    key: config.key,
    txnid: attempt.transactionId,
    amount: formatPayUAmount(attempt.amount),
    productinfo: attempt.productInfo,
    firstname: attempt.customerName,
    email: attempt.customerEmail,
    udf1: orderNumber,
  };
  return {
    actionUrl: config.paymentUrl,
    fields: {
      ...signed,
      phone: attempt.customerPhone,
      surl: `${config.siteUrl}/api/payments/payu/callback`,
      furl: `${config.siteUrl}/api/payments/payu/callback`,
      hash: createRequestHash(signed, config.salt),
    },
  };
}

const callbackSchema = z.object({
  key: z.string().max(100), txnid: z.string().max(100), amount: z.string().max(40),
  productinfo: z.string().max(256), firstname: z.string().max(120), email: z.string().email().max(254),
  status: z.string().max(40), hash: z.string().max(128), udf1: z.string().max(100).default(""),
  udf2: z.string().max(256).default(""), udf3: z.string().max(256).default(""),
  udf4: z.string().max(256).default(""), udf5: z.string().max(256).default(""),
  mihpayid: z.string().max(100).optional(), error: z.string().max(100).optional(),
  error_Message: z.string().max(500).optional(), additionalCharges: z.string().max(40).optional(),
  additional_charges: z.string().max(40).optional(),
}).passthrough();

export type PayUCallback = z.infer<typeof callbackSchema>;

export function parseAndVerifyCallback(input: Record<string, string>): PayUCallback {
  const data = callbackSchema.parse(input);
  const config = getPayUConfig();
  if (data.key !== config.key) throw new Error("PayU merchant key mismatch.");
  const expected = createResponseHash({ ...data, additionalCharges: data.additionalCharges ?? data.additional_charges }, config.salt);
  if (!secureHashEquals(data.hash, expected)) throw new Error("Invalid PayU response hash.");
  return data;
}

const verifySchema = z.object({ status: z.union([z.number(), z.string()]).optional(), transaction_details: z.record(z.string(), z.unknown()).optional() }).passthrough();
export type VerifiedPayment = { status: "success" | "failure" | "pending"; transactionId: string; amount: string; providerPaymentId?: string };

export async function verifyPayment(transactionId: string): Promise<VerifiedPayment> {
  const config = getPayUConfig();
  const command = "verify_payment";
  const body = new URLSearchParams({ key: config.key, command, var1: transactionId, hash: sha512(`${config.key}|${command}|${transactionId}|${config.salt}`) });
  const response = await fetch(config.verifyUrl, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("PayU verification request failed.");
  const parsed = verifySchema.parse(await response.json());
  const details = parsed.transaction_details?.[transactionId];
  if (!details || typeof details !== "object") throw new Error("PayU verification response is missing transaction details.");
  const record = details as Record<string, unknown>;
  const verifiedTransactionId = String(record.txnid ?? "");
  const rawAmount = record.amt ?? record.amount;
  const numericAmount = typeof rawAmount === "number" ? rawAmount : Number(String(rawAmount ?? ""));
  if (verifiedTransactionId !== transactionId || !Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new Error("PayU verification response does not match the transaction.");
  }
  const rawStatus = String(record.status ?? "").toLowerCase();
  const status = rawStatus === "success" ? "success" : ["failure", "failed"].includes(rawStatus) ? "failure" : "pending";
  const providerPaymentId = record.mihpayid == null ? undefined : String(record.mihpayid);
  return { status, transactionId: verifiedTransactionId, amount: formatPayUAmount(numericAmount), providerPaymentId };
}
