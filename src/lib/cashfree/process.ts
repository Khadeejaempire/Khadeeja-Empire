import "server-only";

import { getDataProvider } from "@/lib/data";
import { isBrevoConfigured, orderConfirmationContent, sendBrevoEmail } from "@/lib/brevo/server";
import { isShiprocketConfigured } from "@/lib/shiprocket/api";
import { fulfillWithShiprocket } from "@/lib/shiprocket/fulfill";
import { getCashfreeConfig } from "./config";
import { verifyCashfreePayment } from "./payment";

export async function processCashfreeReturn(transactionId: string) {
  const provider = getDataProvider();
  const attempt = await provider.getPaymentAttemptByTransactionId(transactionId);
  if (!attempt || attempt.provider !== "cashfree") throw new Error("Unknown Cashfree transaction.");
  const order = await provider.getOrder(attempt.orderId);
  if (!order || order.paymentMethod !== "cashfree" || order.orderNumber !== transactionId) throw new Error("Unknown Cashfree order.");

  const verified = await verifyCashfreePayment(transactionId);
  if (verified.transactionId !== attempt.transactionId || verified.amount !== attempt.amount) {
    throw new Error("Verified Cashfree payment does not match the order.");
  }
  if (verified.status === "success") {
    const shouldRunPaidSideEffects = attempt.status !== "paid";
    await provider.applyVerifiedPaymentResult({ transactionId, status: "paid", providerPaymentId: verified.providerPaymentId ?? null });
    if (!shouldRunPaidSideEffects) return { orderNumber: order.orderNumber, status: verified.status };
    const siteUrl = getCashfreeConfig().siteUrl;
    if (isBrevoConfigured()) {
      const content = orderConfirmationContent(order.orderNumber, attempt.customerName, attempt.amount.toFixed(2), siteUrl);
      void sendBrevoEmail({ to: attempt.customerEmail, toName: attempt.customerName, ...content }).catch(() => {});
    }
    if (isShiprocketConfigured()) {
      const fullOrder = order.items ? order : await provider.getOrder(order.id);
      if (fullOrder?.items?.length) void fulfillWithShiprocket(fullOrder, { email: attempt.customerEmail, phone: attempt.customerPhone }).catch(() => {});
    }
  } else if (verified.status === "failure") {
    await provider.applyVerifiedPaymentResult({ transactionId, status: "failed", providerPaymentId: verified.providerPaymentId ?? null, failureMessage: "Payment was not completed." });
  }
  return { orderNumber: order.orderNumber, status: verified.status };
}
