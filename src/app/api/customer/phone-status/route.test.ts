// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDataProvider } = vi.hoisted(() => ({ getDataProvider: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data", () => ({ getDataProvider }));

import { POST } from "./route";

function request(phone: unknown): Request {
  return new Request("http://localhost/api/customer/phone-status", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone }),
  });
}

describe("customer phone status route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds an active customer stored in the legacy local format", async () => {
    getDataProvider.mockReturnValue({
      listCustomers: vi.fn().mockResolvedValue([
        { id: "customer-existing", phone: "9876543210", status: "active" },
      ]),
    });

    const response = await POST(request("+919876543210"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: "active" });
  });

  it("reports a missing customer without exposing customer data", async () => {
    getDataProvider.mockReturnValue({ listCustomers: vi.fn().mockResolvedValue([]) });

    const response = await POST(request("9876543210"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: "missing" });
  });

  it("reports an inactive customer", async () => {
    getDataProvider.mockReturnValue({
      listCustomers: vi.fn().mockResolvedValue([
        { id: "customer-inactive", phone: "+919876543210", status: "inactive" },
      ]),
    });

    const response = await POST(request("9876543210"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: "inactive" });
  });

  it("rejects an invalid phone number", async () => {
    const response = await POST(request("invalid"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Enter a valid phone number." });
    expect(getDataProvider).not.toHaveBeenCalled();
  });
});
