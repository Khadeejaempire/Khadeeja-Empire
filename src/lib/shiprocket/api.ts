import "server-only";

import { z } from "zod";

const schema = z.object({
  SHIPROCKET_EMAIL: z.string().trim().min(1),
  SHIPROCKET_PASSWORD: z.string().trim().min(1),
  SHIPROCKET_PICKUP_LOCATION: z.string().trim().min(1).optional(),
});

export type ShiprocketApiConfig = {
  email: string;
  password: string;
  pickupLocation?: string;
};

const BASE = "https://apiv2.shiprocket.in/v1/external";

export function getShiprocketApiConfig(env = process.env): ShiprocketApiConfig {
  const value = schema.parse(env);
  return {
    email: value.SHIPROCKET_EMAIL,
    password: value.SHIPROCKET_PASSWORD,
    pickupLocation: value.SHIPROCKET_PICKUP_LOCATION || undefined,
  };
}

export function isShiprocketConfigured(env = process.env): boolean {
  try {
    getShiprocketApiConfig(env);
    return true;
  } catch {
    return false;
  }
}

// Token lives 10 days server-side; cache it in module scope and refresh lazily.
let token: { value: string; expiresAt: number } | null = null;

async function getToken(env = process.env): Promise<string> {
  if (token && Date.now() < token.expiresAt) return token.value;
  const config = getShiprocketApiConfig(env);
  const response = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: config.email, password: config.password }),
  });
  if (!response.ok) {
    throw new Error(`Shiprocket login failed with status ${response.status}.`);
  }
  const data = (await response.json()) as { token?: string; expires_at?: string };
  if (!data.token) throw new Error("Shiprocket login did not return a token.");
  token = { value: data.token, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
  return token.value;
}

export async function resetShiprocketToken(): Promise<void> {
  token = null;
}

/** Shiprocket's own Create Custom Order payload (POST /v1/external/orders/create/adhoc). */
export interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location?: string;
  shipping_is_billing: boolean;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_state: string;
  billing_pincode: string | number;
  billing_country: string;
  billing_email: string;
  billing_phone: string | number;
  shipping_customer_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_address_2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string | number;
  shipping_country: string;
  order_items: { name: string; sku: string; units: number; selling_price: number }[];
  payment_method: "Prepaid" | "COD";
  sub_total: number;
  shipping_charges?: number;
  total_discount?: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
}

export async function createShiprocketOrder(
  payload: ShiprocketOrderPayload,
  env = process.env
): Promise<{ orderId: number; shipmentId: number }> {
  const authToken = await getToken(env);
  const response = await fetch(`${BASE}/orders/create/adhoc`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Shiprocket create order failed with status ${response.status}.`);
  }
  const data = (await response.json()) as { order_id?: string | number; shipment_id?: string | number };
  return {
    orderId: Number(data.order_id ?? 0),
    shipmentId: Number(data.shipment_id ?? 0),
  };
}
