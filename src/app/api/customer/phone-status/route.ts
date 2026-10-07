import { NextResponse } from "next/server";
import { z } from "zod";
import { getDataProvider } from "@/lib/data";
import { findCustomerByPhone } from "@/lib/auth/customer";
import { normalizePhone } from "@/lib/auth/phone";

export const runtime = "nodejs";

const requestSchema = z.object({ phone: z.string().min(1).max(40) }).strict();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  let phone: string;
  try {
    phone = normalizePhone(parsed.data.phone);
  } catch {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  try {
    const customer = await findCustomerByPhone(getDataProvider(), phone);
    const status = customer?.status === "inactive"
      ? "inactive"
      : customer
        ? "active"
        : "missing";
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("Customer phone status lookup failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Could not check your account. Please try again." },
      { status: 500 }
    );
  }
}
