import "server-only";

import { z } from "zod";
import type { PaymentAttemptRecord } from "@/lib/admin/types";
import { getCashfreeConfig } from "./config";

const orderSchema = z.object({
  order_id: z.string().min(1),
  order_status: z.string().min(1),
  order_amount: z.union([z.number(), z.string()]),
  order_currency: z.string().min(1),
  payment_session_id: z.string().min(1).optional(),
  cf_order_id: z.union([z.number(), z.string()]).optional(),
}).passthrough();

export type CashfreeOrder = z.infer<typeof orderSchema>;

function headers() {
  const config = getCashfreeConfig();
  return {
    config,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-api-version": "2025-01-01",
      "x-client-id": config.appId,
      "x-client-secret": config.secretKey,
    },
  };
}

function amount(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Cashfree returned an invalid payment amount.");
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

export async function createCashfreeOrder(attempt: PaymentAttemptRecord, customerId: string): Promise<{ paymentSessionId: string; environment: "sandbox" | "production" }> {
  const { config, headers: requestHeaders } = headers();
  const response = await fetch(`${config.apiUrl}/orders`, {
    method: "POST", headers: requestHeaders, cache: "no-store", signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      order_id: attempt.transactionId,
      order_amount: attempt.amount,
      order_currency: attempt.currency,
      customer_details: {
        customer_id: customerId,
        customer_name: attempt.customerName,
        customer_email: attempt.customerEmail,
        customer_phone: attempt.customerPhone.replace(/[^+0-9]/g, ""),
      },
      order_meta: { return_url: `${config.siteUrl}/api/payments/cashfree/return?order_id={order_id}` },
      order_note: attempt.productInfo,
    }),
  });
  if (response.status === 409) return { ...paymentSessionFromOrder(await fetchCashfreeOrder(attempt.transactionId)), environment: config.environment };
  if (!response.ok) throw new Error("Cashfree could not create the payment order.");
  return { ...paymentSessionFromOrder(orderSchema.parse(await response.json())), environment: config.environment };
}

function paymentSessionFromOrder(order: CashfreeOrder): { paymentSessionId: string } {
  if (!order.payment_session_id) throw new Error("Cashfree did not return a payment session.");
  return { paymentSessionId: order.payment_session_id };
}

export async function fetchCashfreeOrder(orderId: string): Promise<CashfreeOrder> {
  const { config, headers: requestHeaders } = headers();
  const response = await fetch(`${config.apiUrl}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET", headers: requestHeaders, cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Cashfree payment verification failed.");
  return orderSchema.parse(await response.json());
}

export type VerifiedCashfreePayment = { status: "success" | "failure" | "pending"; transactionId: string; amount: number; providerPaymentId?: string };

export async function verifyCashfreePayment(transactionId: string): Promise<VerifiedCashfreePayment> {
  const order = await fetchCashfreeOrder(transactionId);
  if (order.order_id !== transactionId) throw new Error("Cashfree verification does not match the order.");
  const status = order.order_status === "PAID" ? "success" : ["EXPIRED", "TERMINATED", "FAILED"].includes(order.order_status) ? "failure" : "pending";
  return { status, transactionId: order.order_id, amount: amount(order.order_amount), providerPaymentId: order.cf_order_id == null ? undefined : String(order.cf_order_id) };
}
