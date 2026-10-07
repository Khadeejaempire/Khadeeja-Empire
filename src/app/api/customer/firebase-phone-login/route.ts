import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDataProvider } from "@/lib/data";
import { getCustomerAuthConfig } from "@/lib/auth/config";
import { FirebaseConfigurationError } from "@/lib/firebase/admin-config";
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
  idToken: z.string().min(1).max(16_384),
  next: z.string().optional(),
  fullName: z.string().trim().min(1).max(120).optional(),
  allowCreate: z.boolean().default(false),
}).strict();

function firebaseErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
}

type PhoneAuthStage = "firebase_load" | "firebase_initialize" | "firebase_verify" |
  "customer_lookup" | "session_config" | "customer_create" | "session_create";

function firebasePhoneErrorResponse(error: unknown, stage: PhoneAuthStage): Response {
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

  if (code === "auth/user-disabled") {
    return NextResponse.json(
      { error: "This phone account has been disabled. Please contact support." },
      { status: 403 }
    );
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      { error: "An account with this phone number already exists. Please log in." },
      { status: 409 }
    );
  }

  const reference = randomUUID();
  const credentialFailure = code === "app/invalid-credential" || code === "auth/invalid-credential";
  const permissionFailure = code === "auth/insufficient-permission" || code === "auth/project-not-found";
  const configurationFailure = error instanceof ConfigurationError || credentialFailure || permissionFailure;
  const reason = error instanceof FirebaseConfigurationError ? error.reason
    : credentialFailure ? "firebase_credentials_rejected"
    : permissionFailure ? "firebase_permissions_rejected"
    : error instanceof ConfigurationError ? "server_configuration_missing"
    : "phone_authentication_failed";
  console.error("Firebase phone authentication failed.", {
    reference,
    stage,
    reason,
    code,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return NextResponse.json(
    {
      error: configurationFailure
        ? `Phone sign-in is unavailable because of a server configuration error. Please contact support. Reference: ${reference}`
        : `Could not complete phone authentication. Please contact support with reference: ${reference}`,
      reference,
    },
    { status: configurationFailure ? 503 : 500, headers: { "Cache-Control": "no-store" } }
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

  let stage: PhoneAuthStage = "firebase_load";
  try {
    // Keep the Node-only Admin SDK out of route module initialization. If the
    // deployment runtime is misconfigured, the handler can still return JSON.
    const { getFirebaseAdminAuth } = await import("@/lib/firebase/server");
    stage = "firebase_initialize";
    const auth = getFirebaseAdminAuth();
    stage = "firebase_verify";
    const decoded = await auth.verifyIdToken(parsed.data.idToken);
    if (!decoded.phone_number) {
      return NextResponse.json({ error: "Firebase did not return a phone number." }, { status: 401 });
    }
    if (decoded.firebase.sign_in_provider !== "phone") {
      return NextResponse.json(
        { error: "Complete phone verification before signing in." },
        { status: 401 }
      );
    }

    const phone = normalizePhone(decoded.phone_number);
    stage = "customer_lookup";
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

    // Validate session configuration before creating a customer that cannot be signed in.
    stage = "session_config";
    const config = getCustomerAuthConfig();
    stage = "customer_create";
    const customer = existing ?? await provider.createCustomer({
      name: parsed.data.fullName!,
      phone,
      status: "active",
    });
    const now = Date.now();
    stage = "session_create";
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
    return firebasePhoneErrorResponse(error, stage);
  }
}
