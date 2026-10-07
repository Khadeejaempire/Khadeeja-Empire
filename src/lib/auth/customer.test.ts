// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieGet, getDataProvider, getUser } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  getDataProvider: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}));
vi.mock("@/lib/data", () => ({ getDataProvider }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser } })),
}));

import { getCurrentCustomer } from "./customer";
import { getCustomerAuthConfig } from "./config";
import { signCustomerSession } from "./session";

describe("current customer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CUSTOMER_SESSION_SECRET", "test-customer-session-secret");
    getUser.mockResolvedValue({ data: { user: null } });
  });

  it("recognizes a Firebase customer session with a legacy stored phone", async () => {
    const token = await signCustomerSession(
      { customerId: "customer-phone", phone: "+919876543210" },
      getCustomerAuthConfig()
    );
    cookieGet.mockReturnValue({ value: token });
    getDataProvider.mockReturnValue({
      getCustomer: vi.fn().mockResolvedValue({
        id: "customer-phone",
        name: "Phone Customer",
        phone: "9876543210",
        status: "active",
      }),
    });

    await expect(getCurrentCustomer()).resolves.toMatchObject({ id: "customer-phone" });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("preserves the existing Supabase email session path", async () => {
    cookieGet.mockReturnValue(undefined);
    getUser.mockResolvedValue({ data: { user: { email: "CUSTOMER@example.com" } } });
    getDataProvider.mockReturnValue({
      listCustomers: vi.fn().mockResolvedValue([
        { id: "customer-email", email: "customer@example.com", status: "active" },
      ]),
    });

    await expect(getCurrentCustomer()).resolves.toMatchObject({ id: "customer-email" });
  });

  it("does not fall through to a different email identity when a phone cookie is invalid", async () => {
    cookieGet.mockReturnValue({ value: "invalid-phone-session" });
    getUser.mockResolvedValue({ data: { user: { email: "other@example.com" } } });
    getDataProvider.mockReturnValue({ getCustomer: vi.fn(), listCustomers: vi.fn() });

    await expect(getCurrentCustomer()).resolves.toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });
});
