import { NextResponse } from "next/server";
import { getCashfreeConfig } from "@/lib/cashfree/config";
import { processCashfreeReturn } from "@/lib/cashfree/process";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let siteUrl: string;
  try { siteUrl = getCashfreeConfig().siteUrl; }
  catch { return NextResponse.json({ error: "Payment configuration unavailable." }, { status: 500 }); }
  const transactionId = new URL(request.url).searchParams.get("order_id")?.trim() ?? "";
  const resultUrl = new URL("/checkout/result", siteUrl);
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(transactionId)) {
    resultUrl.searchParams.set("error", "invalid-response");
    return NextResponse.redirect(resultUrl, 303);
  }
  try {
    const result = await processCashfreeReturn(transactionId);
    resultUrl.searchParams.set("order", result.orderNumber);
  } catch {
    resultUrl.searchParams.set("error", "invalid-response");
  }
  return NextResponse.redirect(resultUrl, 303);
}
