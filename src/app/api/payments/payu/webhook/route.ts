import { NextResponse } from "next/server";
import { assertPayURequest, formDataToFields, processPayUResponse } from "@/lib/payu/process";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertPayURequest(request);
    await processPayUResponse(formDataToFields(await request.formData()));
    return NextResponse.json({ received: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ received: false }, { status: 400, headers: { "cache-control": "no-store" } });
  }
}
