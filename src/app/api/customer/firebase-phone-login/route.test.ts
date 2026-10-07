// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { verifyIdToken, getDataProvider, getFirebaseAdminAuth } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  getDataProvider: vi.fn(),
  getFirebaseAdminAuth: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/firebase/server", () => ({
  getFirebaseAdminAuth,
}));
vi.mock("@/lib/data", () => ({ getDataProvider }));

import { POST } from "./route";
import { verifyCustomerSession } from "@/lib/auth/session";
import { getCustomerAuthConfig } from "@/lib/auth/config";
import { FirebaseConfigurationError } from "@/lib/firebase/admin-config";

function request(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/customer/firebase-phone-login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Firebase phone login route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFirebaseAdminAuth.mockReturnValue({ verifyIdToken });
    vi.stubEnv("CUSTOMER_SESSION_SECRET", "test-customer-session-secret");
    verifyIdToken.mockResolvedValue({
      phone_number: "+919876543210",
      firebase: { sign_in_provider: "phone" },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects malformed requests before loading Firebase Admin", async () => {
    const response = await POST(request({}));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "The verification request is invalid." });
    expect(verifyIdToken).not.toHaveBeenCalled();
    expect(getDataProvider).not.toHaveBeenCalled();
  });

  it("logs in an existing customer whose stored phone uses the legacy local format", async () => {
    const createCustomer = vi.fn();
    getDataProvider.mockReturnValue({
      listCustomers: vi.fn().mockResolvedValue([
        { id: "customer-existing", phone: "9876543210", status: "active" },
      ]),
      createCustomer,
    });

    const response = await POST(request({ idToken: "valid-token", allowCreate: false, next: "/account/orders" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, redirectTo: "/account/orders" });
    expect(response.headers.get("set-cookie")).toContain("ke_customer_session=");
    const cookie = response.headers.get("set-cookie")!;
    const token = cookie.split(";")[0].slice("ke_customer_session=".length);
    expect(await verifyCustomerSession(token, getCustomerAuthConfig())).toMatchObject({
      customerId: "customer-existing", phone: "+919876543210", role: "customer",
    });
    expect(verifyIdToken).toHaveBeenCalledWith("valid-token", true);
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it("creates a new customer with a canonical phone during registration", async () => {
    const createCustomer = vi.fn().mockResolvedValue({
      id: "customer-new",
      name: "New Customer",
      phone: "+919876543210",
      status: "active",
    });
    getDataProvider.mockReturnValue({
      listCustomers: vi.fn().mockResolvedValue([]),
      createCustomer,
    });

    const response = await POST(request({
      idToken: "valid-token",
      fullName: "  New Customer  ",
      allowCreate: true,
    }));

    expect(response.status).toBe(200);
    expect(createCustomer).toHaveBeenCalledWith({
      name: "New Customer",
      phone: "+919876543210",
      status: "active",
    });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("does not create an account from the login flow", async () => {
    const createCustomer = vi.fn();
    getDataProvider.mockReturnValue({
      listCustomers: vi.fn().mockResolvedValue([]),
      createCustomer,
    });

    const response = await POST(request({ idToken: "valid-token", allowCreate: false }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Account doesn't exist. Please register before login.",
    });
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it("does not reactivate an inactive customer", async () => {
    getDataProvider.mockReturnValue({
      listCustomers: vi.fn().mockResolvedValue([
        { id: "customer-inactive", phone: "9876543210", status: "inactive" },
      ]),
      createCustomer: vi.fn(),
    });

    const response = await POST(request({ idToken: "valid-token", allowCreate: false }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Your account is pending admin approval." });
  });

  it("returns a useful error when Firebase rejects an expired ID token", async () => {
    verifyIdToken.mockRejectedValue({ code: "auth/id-token-expired" });

    const response = await POST(request({ idToken: "expired-token", allowCreate: false }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Your phone verification expired. Request a new code and try again.",
    });
  });

  it("rejects a Firebase token that did not authenticate with a phone code", async () => {
    verifyIdToken.mockResolvedValue({
      phone_number: "+919876543210",
      firebase: { sign_in_provider: "password" },
    });

    const response = await POST(request({ idToken: "email-token", allowCreate: false }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Complete phone verification before signing in.",
    });
    expect(getDataProvider).not.toHaveBeenCalled();
  });

  it("returns a clear error for a disabled Firebase phone user", async () => {
    verifyIdToken.mockRejectedValue({ code: "auth/user-disabled" });

    const response = await POST(request({ idToken: "disabled-token", allowCreate: false }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "This phone account has been disabled. Please contact support.",
    });
  });

  it("does not create an orphan customer when session configuration is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("CUSTOMER_SESSION_SECRET", "");
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    const createCustomer = vi.fn();
    getDataProvider.mockReturnValue({ listCustomers: vi.fn().mockResolvedValue([]), createCustomer });
    const response = await POST(request({ idToken: "valid-token", allowCreate: true, fullName: "Test Customer" }));
    expect(response.status).toBe(503);
    expect(createCustomer).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("reports initialization failures with a safe log reference before database access", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getFirebaseAdminAuth.mockImplementationOnce(() => {
      throw new FirebaseConfigurationError("firebase_private_key_invalid");
    });
    const response = await POST(request({ idToken: "valid-token", allowCreate: true, fullName: "Test Customer" }));
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.reference).toEqual(expect.any(String));
    expect(body.error).toContain(body.reference);
    expect(log).toHaveBeenCalledWith("Firebase phone authentication failed.", expect.objectContaining({
      reference: body.reference, stage: "firebase_initialize", reason: "firebase_private_key_invalid",
    }));
    expect(verifyIdToken).not.toHaveBeenCalled();
    expect(getDataProvider).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it.each(["app/invalid-credential", "auth/insufficient-permission"])(
    "reports %s as a server problem without exposing credentials",
    async (code) => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      verifyIdToken.mockRejectedValueOnce(Object.assign(new Error("sensitive-upstream-detail"), { code }));
      const response = await POST(request({ idToken: "valid-token", allowCreate: false }));
      const body = await response.json();
      expect(response.status).toBe(503);
      expect(body.error).toContain("server configuration error");
      expect(JSON.stringify(body)).not.toContain("sensitive-upstream-detail");
      expect(JSON.stringify(log.mock.calls)).not.toContain("sensitive-upstream-detail");
      expect(log).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ stage: "firebase_verify", code }));
      expect(getDataProvider).not.toHaveBeenCalled();
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  );

  it("identifies customer creation failures without issuing a session", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getDataProvider.mockReturnValue({
      listCustomers: vi.fn().mockResolvedValue([]),
      createCustomer: vi.fn().mockRejectedValue(new Error("database failure")),
    });
    const response = await POST(request({ idToken: "valid-token", allowCreate: true, fullName: "Test Customer" }));
    expect(response.status).toBe(500);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(log).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ stage: "customer_create" }));
  });
});
