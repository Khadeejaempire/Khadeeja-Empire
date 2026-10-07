// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { verifyIdToken, getDataProvider } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  getDataProvider: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/firebase/server", () => ({
  getFirebaseAdminAuth: () => ({ verifyIdToken }),
}));
vi.mock("@/lib/data", () => ({ getDataProvider }));

import { POST } from "./route";

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
    vi.stubEnv("CUSTOMER_SESSION_SECRET", "test-customer-session-secret");
    verifyIdToken.mockResolvedValue({ phone_number: "+919876543210" });
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
});
