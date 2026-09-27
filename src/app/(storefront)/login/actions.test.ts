// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  revalidateMock,
  signInMock,
  signOutMock,
  createUserMock,
  deleteUserMock,
  getDataProviderMock,
  verifyEmailOtpChallengeMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
  revalidateMock: vi.fn(),
  signInMock: vi.fn(),
  signOutMock: vi.fn(),
  createUserMock: vi.fn(),
  deleteUserMock: vi.fn(),
  getDataProviderMock: vi.fn(),
  verifyEmailOtpChallengeMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword: signInMock, signOut: signOutMock },
  })),
}));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(() => ({
    auth: { admin: { createUser: createUserMock, deleteUser: deleteUserMock } },
  })),
}));
vi.mock("@/lib/data", () => ({ getDataProvider: getDataProviderMock }));
vi.mock("@/lib/brevo/server", () => ({
  sendBrevoEmail: vi.fn(),
  signupOtpContent: vi.fn(() => ({ subject: "", html: "", text: "" })),
  loginOtpContent: vi.fn(() => ({ subject: "", html: "", text: "" })),
  passwordResetContent: vi.fn(() => ({ subject: "", html: "", text: "" })),
}));
vi.mock("@/lib/auth/email-otp", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/email-otp")>("@/lib/auth/email-otp");
  return {
    ...actual,
    createProviderEmailOtpChallengeStore: vi.fn(() => ({})),
    verifyEmailOtpChallenge: verifyEmailOtpChallengeMock,
  };
});

import { ConflictError } from "@/lib/admin/errors";
import { login, verifySignupOtp } from "./actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("storefront auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the missing customer profile on login", async () => {
    signInMock.mockResolvedValue({
      data: { user: { user_metadata: { full_name: "Braja" } } },
      error: null,
    });
    const createCustomer = vi.fn().mockResolvedValue({ id: "c1" });
    getDataProviderMock.mockReturnValue({
      listCustomers: vi.fn().mockResolvedValue([]),
      createCustomer,
    });

    await expect(
      login(form({ email: "nixopex912@airychen.com", password: "secret123" }))
    ).rejects.toThrow("REDIRECT");

    expect(createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "nixopex912@airychen.com",
        name: "Braja",
        status: "active",
      })
    );
  });

  it("does not create a profile when the customer already exists", async () => {
    signInMock.mockResolvedValue({ data: { user: { user_metadata: {} } }, error: null });
    const createCustomer = vi.fn();
    getDataProviderMock.mockReturnValue({
      listCustomers: vi
        .fn()
        .mockResolvedValue([{ id: "c1", email: "a@b.com", status: "active" }]),
      createCustomer,
    });

    await expect(login(form({ email: "a@b.com", password: "x" }))).rejects.toThrow("REDIRECT");
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it("rolls back the auth user when the customer profile fails", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    deleteUserMock.mockResolvedValue({});
    getDataProviderMock.mockReturnValue({
      createCustomer: vi.fn().mockRejectedValue(new ConflictError("That record already exists.")),
    });
    verifyEmailOtpChallengeMock.mockResolvedValue({
      ok: true,
      payload: JSON.stringify({ password: "secret", fullName: "X", phone: "9999999999" }),
    });

    const result = await verifySignupOtp(
      form({ email: "x@y.com", code: "123456", challengeId: "abc" })
    );

    expect(deleteUserMock).toHaveBeenCalledWith("u1");
    expect(result).toMatchObject({ error: expect.stringContaining("phone") });
  });
});
