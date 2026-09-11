import { NextResponse } from "next/server";
import { getPayUConfig } from "@/lib/payu/config";
import { assertPayURequest, formDataToFields, processPayUResponse } from "@/lib/payu/process";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let siteUrl: string;
  try { siteUrl = getPayUConfig().siteUrl; }
  catch { return NextResponse.json({ error: "Payment configuration unavailable." }, { status: 500 }); }
  try {
    assertPayURequest(request);
    const result = await processPayUResponse(formDataToFields(await request.formData()));
    const url = new URL("/checkout/result", siteUrl);
    url.searchParams.set("order", result.orderNumber);
    return NextResponse.redirect(url, 303);
  } catch {
    const url = new URL("/checkout/result", siteUrl);
    url.searchParams.set("error", "invalid-response");
    return NextResponse.redirect(url, 303);
  }
}
