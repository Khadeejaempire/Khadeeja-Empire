import { NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { getDataProvider } from "@/lib/data";
import { mapShiprocketStatus } from "@/lib/shiprocket/fulfill";

export const runtime = "nodejs";

const webhookSchema = z.object({
  awb: z.string().optional(),
  current_status: z.string().optional(),
  sr_order_id: z.union([z.number(), z.string()]).optional(),
  order_id: z.string().optional(),
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

  const orderNumber = parsed.data.order_id ?? "";
  const mapped = mapShiprocketStatus(parsed.data.current_status, "");
  if (!orderNumber || !mapped) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const provider = getDataProvider();
  const order = await provider.getOrder(orderNumber);
  if (!order) return NextResponse.json({ ok: true, ignored: true });

  // Delivered/RTO outrank in-transit states; never downgrade a delivered order.
  if (order.status === "delivered" && mapped !== "delivered") {
    return NextResponse.json({ ok: true, ignored: true });
  }
  if (
    (order.status !== "delivered" && order.status !== "cancelled") ||
    (order.status === "cancelled" && mapped === "delivered")
  ) {
    await provider.updateOrderStatus(order.id, mapped);
  }
  return NextResponse.json({ ok: true });
}
