import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getFirebaseAdminAuth } from "@/lib/firebase/server";
import { getDataProvider } from "@/lib/data";
import { getCustomerAuthConfig } from "@/lib/auth/config";
import { authErrorResponse } from "@/lib/auth/http";
import { normalizePhone } from "@/lib/auth/otp";
import {
  CUSTOMER_SESSION_COOKIE,
  createSessionCookieOptions,
  signCustomerSession,
} from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const runtime = "nodejs";

const requestSchema = z.object({
  idToken: z.string().min(1),
  next: z.string().optional(),
  fullName: z.string().trim().min(1).max(120).optional(),
}).strict();

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The verification request is invalid." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "The verification request is invalid." }, { status: 400 });
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(parsed.data.idToken);
    if (!decoded.phone_number) {
      return NextResponse.json({ error: "Firebase did not return a phone number." }, { status: 401 });
    }

    const phone = normalizePhone(decoded.phone_number);
    const provider = getDataProvider();
    const customer = await provider.upsertCustomerByPhone(phone, {
      status: "active",
      ...(parsed.data.fullName ? { name: parsed.data.fullName } : {}),
    });
    const config = getCustomerAuthConfig();
    const token = await signCustomerSession({ customerId: customer.id, phone }, config);
    const response = NextResponse.json({
      ok: true,
      redirectTo: safeRedirectPath(parsed.data.next, "/"),
    });

    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      token,
      createSessionCookieOptions(new Date(Date.now() + config.sessionTtlSeconds * 1_000))
    );
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}
