import { NextResponse } from "next/server";
import { processCashfreeWebhook } from "@/lib/cashfree/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const result = await processCashfreeWebhook(await request.text(), request.headers);
    return NextResponse.json({ received: true, order: result.orderNumber, status: result.status }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ received: false }, { status: 400, headers: { "cache-control": "no-store" } });
  }
}
