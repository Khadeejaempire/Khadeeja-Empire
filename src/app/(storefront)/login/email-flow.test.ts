// @vitest-environment node
// Real email challenge generation/verification and actions; external providers are simulated.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomerRecord, JsonValue } from "@/lib/admin/types";

const { provider, sendEmail, signIn, verifyOtp, clearPhoneSession, redirect } = vi.hoisted(() => ({
  provider: vi.fn(), sendEmail: vi.fn(), signIn: vi.fn(), verifyOtp: vi.fn(), clearPhoneSession: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth/server", () => ({ clearCustomerSession: clearPhoneSession }));
vi.mock("@/lib/data", () => ({ getDataProvider: provider }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signInWithPassword: signIn, verifyOtp } }) }));
vi.mock("@/lib/supabase/service-role", () => ({ createServiceRoleClient: () => ({ auth: { admin: {
  createUser: async () => ({ data: { user: { id: "email-user" } }, error: null }),
  deleteUser: vi.fn(),
  generateLink: async () => ({ data: { properties: { hashed_token: "email-session-proof" } }, error: null }),
} } }) }));
vi.mock("@/lib/brevo/server", async () => ({
  ...await vi.importActual<typeof import("@/lib/brevo/server")>("@/lib/brevo/server"),
  sendBrevoEmail: sendEmail,
}));

import { requestLoginOtp, requestSignupOtp, verifyLoginOtp, verifySignupOtp } from "./actions";

function form(values: Record<string, string>): FormData {
  const result = new FormData();
  Object.entries(values).forEach(([key, value]) => result.set(key, value));
  return result;
}

describe("Brevo email OTP flows", () => {
  const customers: CustomerRecord[] = [];
  const settings = new Map<string, JsonValue>();
  beforeEach(() => {
    vi.clearAllMocks();
    customers.length = 0;
    settings.clear();
    signIn.mockResolvedValue({ error: null });
    verifyOtp.mockResolvedValue({ data: { user: { email: "customer@example.com" } }, error: null });
    provider.mockReturnValue({
      listCustomers: async () => customers,
      createCustomer: async (input: Omit<CustomerRecord, "id">) => {
        const customer = { ...input, id: "email-customer" }; customers.push(customer); return customer;
      },
      getSetting: async (key: string) => settings.has(key) ? { value: settings.get(key) } : null,
      upsertSetting: async (key: string, value: JsonValue) => { settings.set(key, value); },
      deleteSetting: async (key: string) => { settings.delete(key); },
    });
  });

  it.each(["login", "signup"] as const)("completes %s from Brevo message to verified session and redirect", async (mode) => {
    if (mode === "login") customers.push({ id: "email-existing", email: "customer@example.com", status: "active" });
    const request = mode === "login" ? requestLoginOtp : requestSignupOtp;
    const verify = mode === "login" ? verifyLoginOtp : verifySignupOtp;
    const result = await request(form({ email: " Customer@example.com ", fullName: "Test Customer" }));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const code = sendEmail.mock.calls[0][0].text.match(/\b\d{6}\b/)[0];
    const verification = form({ email: "customer@example.com", challengeId: result.challengeId, code, next: "/account/orders" });
    await expect(verify(verification)).rejects.toThrow("REDIRECT:/account/orders");
    expect(customers).toHaveLength(1);
    expect(clearPhoneSession).toHaveBeenCalledTimes(1);
    if (mode === "login") expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "email-session-proof", type: "magiclink" });
    else expect(signIn).toHaveBeenCalledWith(expect.objectContaining({ email: "customer@example.com" }));
    // A consumed email OTP cannot create or sign in an account a second time.
    expect(await verify(verification)).toEqual({ error: "That code is invalid or has expired." });
  });
});
