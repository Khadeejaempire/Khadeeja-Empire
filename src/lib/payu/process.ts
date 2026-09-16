import "server-only";

import { getDataProvider } from "@/lib/data";
import { isBrevoConfigured, orderConfirmationContent, sendBrevoEmail } from "@/lib/brevo/server";
import { isShiprocketConfigured } from "@/lib/shiprocket/api";
import { fulfillWithShiprocket } from "@/lib/shiprocket/fulfill";
import { formatPayUAmount } from "./hash";
import { getPayUConfig } from "./config";
import { parseAndVerifyCallback, verifyPayment } from "./payment";

export async function processPayUResponse(fields: Record<string, string>) {
  const callback = parseAndVerifyCallback(fields);
  const provider = getDataProvider();
  const attempt = await provider.getPaymentAttemptByTransactionId(callback.txnid);
  if (!attempt) throw new Error("Unknown PayU transaction.");
  const order = await provider.getOrder(attempt.orderId);
  if (!order || order.paymentMethod !== "payu") throw new Error("Unknown PayU order.");
  if (
    callback.udf1 !== order.orderNumber ||
    callback.amount !== formatPayUAmount(attempt.amount) ||
    callback.productinfo !== attempt.productInfo ||
    callback.email.toLowerCase() !== attempt.customerEmail.toLowerCase() ||
    callback.firstname !== attempt.customerName
  ) throw new Error("PayU response does not match the order.");

  const verified = await verifyPayment(callback.txnid);
  if (verified.amount !== formatPayUAmount(attempt.amount) || verified.transactionId !== attempt.transactionId) {
    throw new Error("Verified PayU payment does not match the order.");
  }
  if (verified.status === "success") {
    await provider.applyVerifiedPaymentResult({
      transactionId: callback.txnid,
      status: "paid",
      providerPaymentId: verified.providerPaymentId ?? callback.mihpayid ?? null,
    });
    if (isBrevoConfigured()) {
      const siteUrl = getPayUConfig().siteUrl;
      const content = orderConfirmationContent(
        order.orderNumber,
        attempt.customerName,
        formatPayUAmount(attempt.amount),
        siteUrl
      );
      // Fire-and-forget: a failed email must never fail a completed payment.
      // ponytail: no retry queue; check Brevo transactional logs if a send fails.
      void sendBrevoEmail({
        to: attempt.customerEmail,
        toName: attempt.customerName,
        ...content,
      }).catch(() => {});
    }
    if (isShiprocketConfigured()) {
      // Fire-and-forget: a failed push can be retried from admin; never blocks payment.
      // ponytail: no retry queue — re-pushed manually if a Shiprocket push is missed.
      const fullOrder = order.items ? order : await provider.getOrder(order.id);
      if (fullOrder?.items?.length) {
        void fulfillWithShiprocket(fullOrder, { email: attempt.customerEmail, phone: attempt.customerPhone }).catch(() => {});
      }
    }
  } else if (verified.status === "failure") {
    await provider.applyVerifiedPaymentResult({
      transactionId: callback.txnid,
      status: "failed",
      providerPaymentId: verified.providerPaymentId ?? callback.mihpayid ?? null,
      failureCode: callback.error ?? null,
      failureMessage: callback.error_Message ?? "Payment failed.",
    });
  }
  return { orderNumber: order.orderNumber, status: verified.status };
}

export function formDataToFields(form: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== "string" || key in result) throw new Error("Invalid PayU form payload.");
    result[key] = value;
  }
  return result;
}

export function assertPayURequest(request: Request): void {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(length) || length < 0 || length > 65_536) throw new Error("PayU payload is too large.");
  const type = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!type.startsWith("application/x-www-form-urlencoded") && !type.startsWith("multipart/form-data")) {
    throw new Error("Unsupported PayU payload type.");
  }
}
