import { NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { getDataProvider } from "@/lib/data";
import { mapShiprocketStatus, shouldApplyMappedStatus } from "@/lib/shiprocket/fulfill";

export const runtime = "nodejs";

const webhookSchema = z.object({
  awb: z.string().optional(),
  current_status: z.string().optional(),
  shipment_status: z.string().optional(),
  courier_name: z.string().optional(),
  sr_order_id: z.union([z.number(), z.string()]).optional(),
  order_id: z.union([z.number(), z.string()]).optional(),
  channel_order_id: z.union([z.number(), z.string()]).optional(),
}).passthrough();

function secretEquals(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 503 });
  }
  const apiKey = request.headers.get("x-api-key") ?? "";
  if (!secretEquals(apiKey, secret)) {
    return NextResponse.json({ error: "Invalid webhook credentials." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  // Shiprocket's webhook payload carries two different identifiers, and they
  // are NOT interchangeable: `channel_order_id` is the reference we gave
  // Shiprocket when creating the order (order_id: order.orderNumber in
  // buildShiprocketOrderPayload), while `order_id` here is Shiprocket's OWN
  // internal numeric order id, which we never store and cannot match on.
  const orderNumber = parsed.data.channel_order_id != null ? String(parsed.data.channel_order_id) : "";
  if (!orderNumber) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const provider = getDataProvider();
  const order = await provider.getOrder(orderNumber);
  if (!order) return NextResponse.json({ ok: true, ignored: true });

  const now = new Date().toISOString();
  const mapped = mapShiprocketStatus(parsed.data.current_status, parsed.data.shipment_status ?? "");
  const applyStatus = mapped ? shouldApplyMappedStatus(order.status, mapped) : false;

  await provider.updateOrderShipment(order.id, {
    shiprocketOrderId: parsed.data.sr_order_id != null ? String(parsed.data.sr_order_id) : order.shiprocketOrderId,
    awbCode: parsed.data.awb ?? order.awbCode,
    courierName: parsed.data.courier_name ?? order.courierName,
    shiprocketStatus: parsed.data.current_status ?? null,
    shippedAt: applyStatus && mapped === "shipped" ? order.shippedAt ?? now : order.shippedAt,
    deliveredAt: applyStatus && mapped === "delivered" ? now : order.deliveredAt,
  });

  if (applyStatus && mapped) {
    await provider.updateOrderStatus(order.id, mapped);
  }
  return NextResponse.json({ ok: true });
}
