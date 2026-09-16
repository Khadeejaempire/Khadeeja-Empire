import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getCashfreeConfig } from "./config";
import { processCashfreeReturn } from "./process";

const webhookSchema = z.object({
  type: z.string().min(1),
  data: z.object({
    order: z.object({
      order_id: z.string().min(1),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

export type CashfreeWebhookResult = {
  orderNumber: string;
  status: "success" | "failure" | "pending";
  eventType: string;
};

export function verifyCashfreeWebhookSignature(rawBody: string, signature: string | null, timestamp: string | null): boolean {
  if (!signature || !timestamp) return false;
  const expected = createHmac("sha256", getCashfreeConfig().secretKey)
    .update(`${timestamp}${rawBody}`)
    .digest("base64");
  const receivedBuffer = Buffer.from(signature, "base64");
  const expectedBuffer = Buffer.from(expected, "base64");
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function processCashfreeWebhook(rawBody: string, headers: Headers): Promise<CashfreeWebhookResult> {
  if (!verifyCashfreeWebhookSignature(rawBody, headers.get("x-webhook-signature"), headers.get("x-webhook-timestamp"))) {
    throw new Error("Invalid Cashfree webhook signature.");
  }

  const payload = webhookSchema.parse(JSON.parse(rawBody));
  const result = await processCashfreeReturn(payload.data.order.order_id);
  return { ...result, eventType: payload.type };
}
