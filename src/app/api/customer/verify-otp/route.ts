import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "This legacy OTP endpoint has been retired. Use Firebase phone verification." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
