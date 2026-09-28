import "server-only";

import { getDataProvider } from "@/lib/data";
import { isBrevoConfigured, orderConfirmationContent, sendBrevoEmail } from "@/lib/brevo/server";
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
      void sendBrevoEmail({ to: attempt.customerEmail, toName: attempt.customerName, ...content }).catch((error) => {
        console.error("Cashfree order confirmation email failed:", error);
      });
    }
    // Shiprocket shipment creation is admin-triggered only (order detail page
    // "Ship via Shiprocket" button) — not pushed automatically on payment.
  } else if (verified.status === "failure") {
    await provider.applyVerifiedPaymentResult({ transactionId, status: "failed", providerPaymentId: verified.providerPaymentId ?? null, failureMessage: "Payment was not completed." });
  }
  return { orderNumber: order.orderNumber, status: verified.status };
}
