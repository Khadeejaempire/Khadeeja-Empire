import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getFirebaseAdminAuth } from "@/lib/firebase/server";
import { getDataProvider } from "@/lib/data";
import { getCustomerAuthConfig } from "@/lib/auth/config";
import { authErrorResponse } from "@/lib/auth/http";
import { findCustomerByPhone } from "@/lib/auth/customer";
import { normalizePhone } from "@/lib/auth/phone";
import { ConfigurationError, ConflictError } from "@/lib/admin/errors";
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
  allowCreate: z.boolean().default(false),
}).strict();

function firebaseErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
}

function firebasePhoneErrorResponse(error: unknown): Response {
  const code = firebaseErrorCode(error);
  if (
    code === "auth/id-token-expired" ||
    code === "auth/id-token-revoked" ||
    code === "auth/invalid-id-token" ||
    code === "auth/argument-error"
  ) {
    return NextResponse.json(
      { error: "Your phone verification expired. Request a new code and try again." },
      { status: 401 }
    );
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      { error: "An account with this phone number already exists. Please log in." },
      { status: 409 }
    );
  }

  if (error instanceof ConfigurationError) return authErrorResponse(error);

  console.error("Firebase phone authentication failed.", {
    code,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return NextResponse.json(
    { error: "Could not complete phone authentication. Please try again." },
    { status: 500 }
  );
}

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
    const existing = await findCustomerByPhone(provider, phone);
    if (existing?.status === "inactive") {
      return NextResponse.json(
        { error: "Your account is pending admin approval." },
        { status: 403 }
      );
    }
    if (existing && parsed.data.allowCreate) {
      return NextResponse.json(
        { error: "An account with this phone number already exists. Please log in." },
        { status: 409 }
      );
    }
    if (!existing && !parsed.data.allowCreate) {
      return NextResponse.json(
        { error: "Account doesn't exist. Please register before login." },
        { status: 404 }
      );
    }
    if (!existing && !parsed.data.fullName) {
      return NextResponse.json(
        { error: "Enter your full name to create an account." },
        { status: 400 }
      );
    }

    const customer = existing ?? await provider.createCustomer({
      name: parsed.data.fullName!,
      phone,
      status: "active",
    });
    const config = getCustomerAuthConfig();
    const now = Date.now();
    const token = await signCustomerSession({ customerId: customer.id, phone }, config, now);
    const response = NextResponse.json({
      ok: true,
      redirectTo: safeRedirectPath(parsed.data.next, "/"),
    });

    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      token,
      createSessionCookieOptions(new Date(now + config.sessionTtlSeconds * 1_000))
    );
    return response;
  } catch (error) {
    return firebasePhoneErrorResponse(error);
  }
}
