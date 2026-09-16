import "server-only";

import type { OrderRecord } from "@/lib/admin/types";
import type { ShiprocketOrderPayload } from "./api";
import { createShiprocketOrder, getShiprocketApiConfig, isShiprocketConfigured } from "./api";

export type ShiprocketContact = {
  email?: string | null;
  phone?: string | null;
};

export function buildShiprocketOrderPayload(order: OrderRecord, contact: ShiprocketContact = {}): ShiprocketOrderPayload {
  const address = order.shippingAddress ?? order.billingAddress;
  if (!address) throw new Error(`Order ${order.orderNumber} has no shipping address.`);
  const nameParts = address.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "";
  const line1 = [address.line1, address.line2].filter(Boolean).join(", ");
  const items = (order.items ?? []).map((item) => ({
    name: item.productName,
    sku: `${item.productSlug ?? item.productName}${item.size ? `-${item.size}` : ""}`,
    units: item.quantity,
    selling_price: item.unitPrice,
  }));
  const payload: ShiprocketOrderPayload = {
    order_id: order.orderNumber,
    order_date: (order.createdAt ?? new Date().toISOString()).slice(0, 10),
    pickup_location: "Default",
    shipping_is_billing: true,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: line1,
    billing_city: address.city,
    billing_state: address.state,
    billing_pincode: address.postalCode,
    billing_country: address.country || "India",
    billing_email: contact.email?.trim() || "",
    billing_phone: contact.phone?.trim() || address.phone || "",
    shipping_customer_name: firstName,
    shipping_last_name: lastName,
    shipping_address: line1,
    shipping_city: address.city,
    shipping_state: address.state,
    shipping_pincode: address.postalCode,
    shipping_country: address.country || "India",
    order_items: items,
    payment_method: order.paymentStatus === "paid" ? "Prepaid" : "COD",
    sub_total: order.subtotal,
    shipping_charges: order.shipping,
    total_discount: order.discount,
  };
  return payload;
}

/** Map Shiprocket tracking webhook fields to our order statuses. */
export function mapShiprocketStatus(
  currentStatus: string | undefined,
  shipmentStatus: string
): "shipped" | "delivered" | "cancelled" | null {
  const combined = `${currentStatus ?? ""} ${shipmentStatus}`.toUpperCase();
  if (combined.includes("UNDELIVERED") || combined.includes("RTO") || combined.includes("CANCEL")) {
    return "cancelled";
  }
  if (combined.includes("DELIVERED")) return "delivered";
  if (/OUT FOR DELIVERY|IN TRANSIT|SHIPPED|PICKED UP|MANIFEST|AWB ASSIGNED|PENDING/.test(combined)) {
    return "shipped";
  }
  return null;
}

/** Push a paid order to Shiprocket. Fire-and-forget; never blocks payment flow. */
export async function fulfillWithShiprocket(order: OrderRecord, contact: ShiprocketContact = {}): Promise<number> {
  if (!isShiprocketConfigured()) {
    throw new Error("Shiprocket is not configured: set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.");
  }
  const payload = buildShiprocketOrderPayload(order, contact);
  const pickupLocation = getShiprocketApiConfig().pickupLocation;
  if (pickupLocation) payload.pickup_location = pickupLocation;
  else delete payload.pickup_location; // Shiprocket falls back to your default pickup address
  const result = await createShiprocketOrder(payload);
  return result.orderId;
}
