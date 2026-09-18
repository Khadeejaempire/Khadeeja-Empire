"use server";

import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { ConflictError } from "../../lib/admin/errors";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { getDataProvider } from "../../lib/data";
import { createCashfreeOrder } from "@/lib/cashfree/payment";
import { codOrderConfirmationContent, isBrevoConfigured, sendBrevoEmail } from "@/lib/brevo/server";
import {
  buildCheckoutQuote,
  checkoutAddress,
  checkoutInputSchema,
  checkoutOrderNumber,
  CheckoutError,
  previewCoupon,
  publicOrder,
  type CheckoutInput,
  type CouponPreviewResult,
} from "./checkout-core";

export type CheckoutActionResult =
  | { ok: true; mode: "cod"; order: ReturnType<typeof publicOrder>; replayed: boolean }
  | { ok: true; mode: "cashfree"; order: ReturnType<typeof publicOrder>; replayed: boolean; paymentSessionId: string; environment: "sandbox" | "production" }
  | {
      ok: false;
      code: "VALIDATION" | "UNAUTHENTICATED" | "CART" | "PROVIDER";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function previewCouponAction(code: string, subtotal: number): Promise<CouponPreviewResult> {
  try {
    return await previewCoupon(getDataProvider(), code, subtotal);
  } catch {
    return { valid: false, message: "We could not check that coupon right now. Please try again." };
  }
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutActionResult> {
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION",
      message: "Check the highlighted checkout details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let userEmail: string;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return { ok: false, code: "UNAUTHENTICATED", message: "Sign in to place your order." };
    }
    userEmail = user.email;
  } catch {
    return { ok: false, code: "PROVIDER", message: "Checkout configuration is unavailable." };
  }

  const provider = getDataProvider();
  const customers = await provider.listCustomers({ search: userEmail });
  const customer = customers.find((c) => c.email?.toLowerCase() === userEmail.toLowerCase());
  if (!customer) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Your customer profile is incomplete. Please contact support." };
  }
  if (parsed.data.customer.email !== userEmail.toLowerCase()) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Use the email address linked to your signed-in account." };
  }
  const session = { customerId: customer.id, phone: parsed.data.customer.phone };

  const orderNumber = checkoutOrderNumber(session.customerId, parsed.data.idempotencyKey);
  try {
    const existing = await provider.getOrder(orderNumber);
    if (existing) {
      if (existing.customerId !== session.customerId) {
        return { ok: false, code: "PROVIDER", message: "This checkout attempt could not be verified." };
      }
      if ((existing.paymentMethod ?? "cod") !== parsed.data.paymentMethod) {
        return { ok: false, code: "PROVIDER", message: "This checkout attempt already uses another payment method." };
      }
      if (parsed.data.paymentMethod === "cod") {
        return { ok: true, mode: "cod", order: publicOrder(existing), replayed: true };
      }
      let attempt = await provider.getLatestPaymentAttemptForOrder(existing.id);
      if (!attempt || attempt.status === "failed" || attempt.status === "cancelled") {
        const transactionId = attempt
          ? `KE-${createHash("sha256").update(`${orderNumber}:${randomUUID()}`).digest("hex").slice(0, 20).toUpperCase()}`
          : orderNumber;
        let couponId: string | null = null;
        if (existing.couponCode) {
          const coupons = await provider.listCoupons({ search: existing.couponCode });
          couponId = coupons.find((item) => item.code.toUpperCase() === existing.couponCode!.toUpperCase())?.id ?? null;
        }
        attempt = await provider.createPaymentAttempt({
          orderId: existing.id, provider: "cashfree", transactionId, status: "pending",
          amount: existing.total, currency: existing.currency ?? "INR", productInfo: `Order ${orderNumber}`,
          customerName: parsed.data.customer.name, customerEmail: parsed.data.customer.email,
          customerPhone: customer.phone ?? parsed.data.customer.phone, couponId,
        });
      }
      const cashfree = await createCashfreeOrder(attempt, session.customerId);
      return { ok: true, mode: "cashfree", order: publicOrder(existing), replayed: true, paymentSessionId: cashfree.paymentSessionId, environment: cashfree.environment };
    }

    await provider.updateCustomer(session.customerId, {
      name: parsed.data.customer.name,
      email: parsed.data.customer.email,
      phone: customer.phone ?? session.phone,
      status: "active",
    });

    const quote = await buildCheckoutQuote(provider, parsed.data);
    const address = checkoutAddress(
      session.customerId,
      session.phone,
      parsed.data.customer.name,
      parsed.data.shippingAddress,
      orderNumber
    );
    const order = await provider.createOrder({
      orderNumber,
      customerId: session.customerId,
      status: parsed.data.paymentMethod === "cod" ? "confirmed" : "pending",
      paymentStatus: "pending",
      paymentMethod: parsed.data.paymentMethod,
      currency: quote.currency,
      subtotal: quote.subtotal,
      shipping: quote.shipping,
      discount: quote.discount,
      total: quote.total,
      couponCode: quote.couponCode,
      shippingAddress: address,
      billingAddress: address,
      notes: parsed.data.notes ?? null,
      items: quote.items,
    });
    if (quote.couponId && parsed.data.paymentMethod === "cod") {
      await provider.incrementCouponUse(quote.couponId);
    }
    if (parsed.data.paymentMethod === "cod") {
      if (isBrevoConfigured()) {
        // Fire-and-forget: a failed email must never fail a placed order.
        // ponytail: no retry queue; check Brevo transactional logs if a send fails.
        const siteUrl = (() => {
          try {
            return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").origin;
          } catch {
            return "";
          }
        })();
        const content = codOrderConfirmationContent(
          order.orderNumber,
          parsed.data.customer.name,
          order.total.toFixed(2),
          siteUrl
        );
        void sendBrevoEmail({
          to: parsed.data.customer.email,
          toName: parsed.data.customer.name,
          ...content,
        }).catch((error) => {
          console.error("COD order confirmation email failed:", error);
        });
      }
      return { ok: true, mode: "cod", order: publicOrder(order), replayed: false };
    }
    let attempt;
    try {
      attempt = await provider.createPaymentAttempt({
        orderId: order.id, provider: "cashfree", transactionId: orderNumber, status: "pending",
        amount: order.total, currency: order.currency ?? "INR", productInfo: `Order ${orderNumber}`,
        customerName: parsed.data.customer.name, customerEmail: parsed.data.customer.email,
        customerPhone: customer.phone ?? parsed.data.customer.phone, couponId: quote.couponId,
      });
    } catch (error) {
      await provider.deleteOrder(order.id).catch(() => undefined);
      throw error;
    }
    const cashfree = await createCashfreeOrder(attempt, session.customerId);
    return { ok: true, mode: "cashfree", order: publicOrder(order), replayed: false, paymentSessionId: cashfree.paymentSessionId, environment: cashfree.environment };
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { ok: false, code: "CART", message: error.message };
    }
    if (error instanceof ConflictError) {
      try {
        const existing = await getDataProvider().getOrder(orderNumber);
        if (existing?.customerId === session.customerId) {
          if (existing.paymentMethod === "cod") return { ok: true, mode: "cod", order: publicOrder(existing), replayed: true };
        }
      } catch {
        // The stable generic error below covers a failed conflict lookup.
      }
    }
    if (error instanceof z.ZodError) {
      return { ok: false, code: "VALIDATION", message: "The checkout details are invalid." };
    }
    return { ok: false, code: "PROVIDER", message: "We could not place your order. Please try again." };
  }
}
