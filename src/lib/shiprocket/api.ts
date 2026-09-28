import "server-only";

import { z } from "zod";

const schema = z.object({
  SHIPROCKET_EMAIL: z.string().trim().min(1),
  SHIPROCKET_PASSWORD: z.string().trim().min(1),
  SHIPROCKET_PICKUP_LOCATION: z.string().trim().optional(),
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

async function shiprocketRequest(path: string, env = process.env, retry = true): Promise<unknown> {
  const authToken = await getToken(env);
  const response = await fetch(`${BASE}${path}`, {
    headers: { authorization: `Bearer ${authToken}` },
  });
  if (response.status === 401 && retry) {
    await resetShiprocketToken();
    return shiprocketRequest(path, env, false);
  }
  if (!response.ok) {
    throw new Error(`Shiprocket request to ${path} failed with status ${response.status}.`);
  }
  return response.json();
}

export type ShiprocketScanEvent = {
  date: string | null;
  status: string | null;
  activity: string | null;
  location: string | null;
};

/** Live courier tracking (status + full scan history) for a shipment that already has an AWB. */
export async function trackShiprocketShipmentByAwb(
  awbCode: string,
  env = process.env
): Promise<{ currentStatus: string | null; courierName: string | null; currentLocation: string | null; scans: ShiprocketScanEvent[] }> {
  const data = (await shiprocketRequest(`/courier/track/awb/${encodeURIComponent(awbCode)}`, env)) as {
    tracking_data?: {
      shipment_track?: Array<{ current_status?: string; courier_name?: string }>;
      shipment_track_activities?: Array<{ date?: string; status?: string; activity?: string; location?: string }>;
    };
  };
  const shipmentData = data?.tracking_data?.shipment_track?.[0];
  const activities = data?.tracking_data?.shipment_track_activities ?? [];
  const scans: ShiprocketScanEvent[] = activities.map((a) => ({
    date: a?.date ? String(a.date) : null,
    status: a?.status ? String(a.status) : null,
    activity: a?.activity ? String(a.activity) : null,
    location: a?.location ? String(a.location) : null,
  }));
  return {
    currentStatus: shipmentData?.current_status ? String(shipmentData.current_status) : null,
    courierName: shipmentData?.courier_name ? String(shipmentData.courier_name) : null,
    currentLocation: scans[0]?.location || null,
    scans,
  };
}

/** Order-level status for a shipment that has no AWB yet — also surfaces the AWB if Shiprocket assigned one but our webhook never arrived. */
export async function getShiprocketOrderShipment(
  shiprocketOrderId: string,
  env = process.env
): Promise<{ currentStatus: string | null; awbCode: string | null; courierName: string | null }> {
  const data = (await shiprocketRequest(`/orders/show/${encodeURIComponent(shiprocketOrderId)}`, env)) as {
    data?: {
      status?: string;
      last_mile_awb?: string;
      awb_code?: string;
      awb?: string;
      last_mile_courier_name?: string;
      courier_name?: string;
      shipments?: { awb?: string; awb_code?: string; courier?: string; courier_name?: string } | Array<{ awb?: string; awb_code?: string; courier?: string; courier_name?: string }>;
    };
  };
  const order = data?.data;
  const shipment = Array.isArray(order?.shipments) ? order.shipments[0] : order?.shipments;
  const awbCode = shipment?.awb || shipment?.awb_code || order?.last_mile_awb || order?.awb_code || order?.awb || null;
  const courierName = shipment?.courier || shipment?.courier_name || order?.last_mile_courier_name || order?.courier_name || null;
  return {
    currentStatus: order?.status ? String(order.status) : null,
    awbCode: awbCode ? String(awbCode) : null,
    courierName: courierName ? String(courierName) : null,
  };
}
