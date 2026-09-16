import { after, NextResponse } from "next/server";
import { processCashfreeWebhook } from "@/lib/cashfree/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers = new Headers();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");
  if (signature) headers.set("x-webhook-signature", signature);
  if (timestamp) headers.set("x-webhook-timestamp", timestamp);

  // Cashfree needs a 200 within ~50ms, retries otherwise, and requires 200 for
  // its test events. Signature verification and processing happen after the
  // response; unsigned events are still rejected there and never processed.
  after(() => processCashfreeWebhook(rawBody, headers).catch(() => {}));

  return NextResponse.json({ received: true }, { headers: { "cache-control": "no-store" } });
}
