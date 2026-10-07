import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  clearRecaptcha,
  confirmPhoneCode,
  fetchPhoneLogin,
  getFirebaseAuth,
  getIdToken,
  recaptchaConstructor,
  renderRecaptcha,
  requestLoginOtp,
  requestSignupOtp,
  routerRefresh,
  routerReplace,
  signInWithPhoneNumber,
  verifyLoginOtp,
  verifySignupOtp,
} = vi.hoisted(() => ({
  clearRecaptcha: vi.fn(),
  confirmPhoneCode: vi.fn(),
  fetchPhoneLogin: vi.fn(),
  getFirebaseAuth: vi.fn(() => ({ name: "test-auth" })),
  getIdToken: vi.fn(),
  recaptchaConstructor: vi.fn(),
  renderRecaptcha: vi.fn(),
  requestLoginOtp: vi.fn(),
  requestSignupOtp: vi.fn(),
  routerRefresh: vi.fn(),
  routerReplace: vi.fn(),
  signInWithPhoneNumber: vi.fn(),
  verifyLoginOtp: vi.fn(),
  verifySignupOtp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, refresh: routerRefresh }),
  unstable_rethrow: vi.fn(),
}));

vi.mock("firebase/auth", () => {
  class RecaptchaVerifier {
    constructor(...args: unknown[]) {
      recaptchaConstructor(...args);
      const target = typeof args[1] === "string" ? document.getElementById(args[1]) : args[1];
      // Button-bound invisible reCAPTCHA owns subsequent clicks, including Verify.
      if (target instanceof HTMLButtonElement) {
        target.addEventListener("click", (event) => event.preventDefault());
      }
    }

    render = renderRecaptcha;
    clear = clearRecaptcha;
  }

  return { RecaptchaVerifier, signInWithPhoneNumber };
});

vi.mock("@/lib/firebase/client", () => ({ getFirebaseAuth }));

vi.mock("./actions", () => ({
  requestSignupOtp,
  verifySignupOtp,
  requestLoginOtp,
  verifyLoginOtp,
  resetPassword: vi.fn(),
}));

import { CustomerLoginForm } from "./CustomerLoginForm";

describe("CustomerLoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_USE_TEST_PHONE_AUTH", "true");
    renderRecaptcha.mockResolvedValue(1);
    getIdToken.mockResolvedValue("firebase-id-token");
    confirmPhoneCode.mockResolvedValue({ user: { getIdToken } });
    signInWithPhoneNumber.mockResolvedValue({ confirm: confirmPhoneCode });
    fetchPhoneLogin.mockImplementation(async (input: string) => ({
      ok: true,
      json: async () => input === "/api/customer/phone-status"
        ? { ok: true, status: "active" }
        : { ok: true, redirectTo: "/account/orders" },
    }));
    vi.stubGlobal("fetch", fetchPhoneLogin);
    requestLoginOtp.mockResolvedValue({ ok: true, challengeId: "email-login-challenge" });
    requestSignupOtp.mockResolvedValue({ ok: true, challengeId: "email-signup-challenge" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("switches between email and phone icons based on the entered value", () => {
    render(<CustomerLoginForm next="/" />);

    const input = screen.getByPlaceholderText("Enter your email or phone number");
    expect(screen.getByTestId("email-input-icon")).toBeTruthy();

    fireEvent.change(input, { target: { value: "9876543210" } });
    expect(screen.getByTestId("phone-input-icon")).toBeTruthy();

    fireEvent.change(input, { target: { value: "customer@example.com" } });
    expect(screen.getByTestId("email-input-icon")).toBeTruthy();
  });

  it("renders reCAPTCHA before requesting a Firebase phone code", async () => {
    render(<CustomerLoginForm next="/account/orders" />);

    fireEvent.change(screen.getByPlaceholderText("Enter your email or phone number"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SEND LOGIN OTP" }));

    await waitFor(() => expect(signInWithPhoneNumber).toHaveBeenCalledTimes(1));
    expect(recaptchaConstructor).toHaveBeenCalledWith(
      { name: "test-auth" },
      expect.any(HTMLDivElement),
      { size: "invisible" }
    );
    expect(renderRecaptcha.mock.invocationCallOrder[0]).toBeLessThan(
      signInWithPhoneNumber.mock.invocationCallOrder[0]
    );
    expect(signInWithPhoneNumber).toHaveBeenCalledWith(
      { name: "test-auth" },
      "+919876543210",
      expect.any(Object)
    );
    expect(await screen.findByText("Enter the code sent to your phone")).toBeTruthy();
  });

  it("keeps email OTP requests on the existing Brevo action path", async () => {
    render(<CustomerLoginForm next="/" />);

    fireEvent.change(screen.getByPlaceholderText("Enter your email or phone number"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SEND LOGIN OTP" }));

    await waitFor(() => expect(requestLoginOtp).toHaveBeenCalledTimes(1));
    expect(signInWithPhoneNumber).not.toHaveBeenCalled();
    expect(await screen.findByText("Enter the 6-digit code sent to your email")).toBeTruthy();
  });

  it("exchanges a verified phone login token for an existing-customer session", async () => {
    render(<CustomerLoginForm next="/account/orders" />);

    fireEvent.change(screen.getByPlaceholderText("Enter your email or phone number"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SEND LOGIN OTP" }));
    fireEvent.change(await screen.findByPlaceholderText("6-digit code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "VERIFY & LOGIN" }));

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/account/orders"));
    expect(confirmPhoneCode).toHaveBeenCalledWith("123456");
    expect(getIdToken).toHaveBeenCalledWith(true);
    const request = fetchPhoneLogin.mock.calls[1][1];
    expect(JSON.parse(request.body)).toEqual({
      idToken: "firebase-id-token",
      next: "/account/orders",
      allowCreate: false,
    });
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("exchanges a verified registration token with the new customer details", async () => {
    fetchPhoneLogin.mockImplementation(async (input: string) => ({
      ok: true,
      json: async () => input === "/api/customer/phone-status"
        ? { ok: true, status: "missing" }
        : { ok: true, redirectTo: "/account/orders" },
    }));
    render(<CustomerLoginForm next="/" />);

    fireEvent.click(screen.getByRole("button", { name: "REGISTER" }));
    fireEvent.change(screen.getByPlaceholderText("Enter your full name"), {
      target: { value: "New Customer" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your email or phone number"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SEND CODE" }));
    fireEvent.change(await screen.findByPlaceholderText("6-digit code"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "VERIFY & CREATE ACCOUNT" }));

    await waitFor(() => expect(fetchPhoneLogin).toHaveBeenCalledTimes(2));
    const request = fetchPhoneLogin.mock.calls[1][1];
    expect(JSON.parse(request.body)).toEqual({
      idToken: "firebase-id-token",
      next: "/",
      fullName: "New Customer",
      allowCreate: true,
    });
  });

  it("stops an unregistered phone login before Firebase or SMS", async () => {
    fetchPhoneLogin.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, status: "missing" }),
    });
    render(<CustomerLoginForm next="/" />);

    fireEvent.change(screen.getByPlaceholderText("Enter your email or phone number"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SEND LOGIN OTP" }));

    expect(await screen.findByText("User doesn't exist. Register first.")).toBeTruthy();
    expect(signInWithPhoneNumber).not.toHaveBeenCalled();
    expect(recaptchaConstructor).not.toHaveBeenCalled();
  });

  it("validates a registration name before requesting either OTP provider", async () => {
    render(<CustomerLoginForm next="/" />);
    fireEvent.click(screen.getByRole("button", { name: "REGISTER" }));
    fireEvent.change(screen.getByPlaceholderText("Enter your full name"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your email or phone number"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SEND CODE" }));

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Enter your full name.");
    expect(fetchPhoneLogin).not.toHaveBeenCalled();
    expect(requestSignupOtp).not.toHaveBeenCalled();
  });

  it("explains how to test an existing phone account from localhost", async () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_USE_TEST_PHONE_AUTH", "false");
    render(<CustomerLoginForm next="/" />);

    fireEvent.change(screen.getByPlaceholderText("Enter your email or phone number"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SEND LOGIN OTP" }));

    expect(await screen.findByText(
      "Real Firebase phone OTP cannot run on localhost. Use a configured Firebase test phone number or test on the production domain."
    )).toBeTruthy();
    expect(signInWithPhoneNumber).not.toHaveBeenCalled();
  });

  async function enterPhoneCode(): Promise<HTMLFormElement> {
    render(<CustomerLoginForm next="/account/orders" />);
    fireEvent.change(screen.getByPlaceholderText("Enter your email or phone number"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SEND LOGIN OTP" }));
    const input = await screen.findByPlaceholderText("6-digit code");
    fireEvent.change(input, { target: { value: "123456" } });
    return input.closest("form")!;
  }

  it("prevents duplicate verification and locks mode changes while verification is pending", async () => {
    let resolveConfirmation!: (value: unknown) => void;
    confirmPhoneCode.mockImplementationOnce(() => new Promise((resolve) => { resolveConfirmation = resolve; }));
    const form = await enterPhoneCode();
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(confirmPhoneCode).toHaveBeenCalledTimes(1);
    expect((screen.getByRole("button", { name: "REGISTER" }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => resolveConfirmation({ user: { getIdToken } }));
    await waitFor(() => expect(routerReplace).toHaveBeenCalledTimes(1));
  });

  it("retries ID token generation without consuming the SMS code twice", async () => {
    getIdToken.mockRejectedValueOnce({ code: "auth/network-request-failed" });
    const form = await enterPhoneCode();
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("Your phone was verified"));
    fireEvent.submit(form);
    await waitFor(() => expect(routerReplace).toHaveBeenCalledTimes(1));
    expect(confirmPhoneCode).toHaveBeenCalledTimes(1);
    expect(getIdToken).toHaveBeenCalledTimes(2);
  });

  it("retries a failed backend exchange using a fresh ID token", async () => {
    const form = await enterPhoneCode();
    fetchPhoneLogin.mockRejectedValueOnce(new TypeError("Network unavailable"));
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("sign-in service"));
    fireEvent.submit(form);
    await waitFor(() => expect(routerReplace).toHaveBeenCalledTimes(1));
    expect(confirmPhoneCode).toHaveBeenCalledTimes(1);
    expect(getIdToken).toHaveBeenCalledTimes(2);
  });

  it("allows correction of a wrong phone code and resets an expired backend verification", async () => {
    confirmPhoneCode.mockRejectedValueOnce({ code: "auth/invalid-verification-code" });
    const form = await enterPhoneCode();
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("incorrect"));
    fetchPhoneLogin.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: "Verification expired. Request a new code." }) });
    fireEvent.submit(form);
    expect(await screen.findByPlaceholderText("Enter your email or phone number")).toBeTruthy();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it.each(["login", "signup"] as const)("submits %s email codes only to the existing email verification action", async (mode) => {
    render(<CustomerLoginForm next="/account/orders" />);
    if (mode === "signup") {
      fireEvent.click(screen.getByRole("button", { name: "REGISTER" }));
      fireEvent.change(screen.getByPlaceholderText("Enter your full name"), { target: { value: "Test Customer" } });
    }
    fireEvent.change(screen.getByPlaceholderText("Enter your email or phone number"), { target: { value: "customer@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: mode === "login" ? "SEND LOGIN OTP" : "SEND CODE" }));
    fireEvent.change(await screen.findByPlaceholderText("6-digit code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: mode === "login" ? "VERIFY & LOGIN" : "VERIFY & CREATE ACCOUNT" }));
    const verify = mode === "login" ? verifyLoginOtp : verifySignupOtp;
    await waitFor(() => expect(verify).toHaveBeenCalledTimes(1));
    expect(Object.fromEntries(verify.mock.calls[0][0])).toMatchObject({ email: "customer@example.com", code: "123456", next: "/account/orders", challengeId: `email-${mode}-challenge` });
    expect(signInWithPhoneNumber).not.toHaveBeenCalled();
    expect(fetchPhoneLogin).not.toHaveBeenCalled();
  });

  it("shows unexpected email service failures and releases the loading state", async () => {
    requestLoginOtp.mockRejectedValueOnce(new Error("Service unavailable"));
    render(<CustomerLoginForm next="/" />);
    fireEvent.change(screen.getByPlaceholderText("Enter your email or phone number"), { target: { value: "customer@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "SEND LOGIN OTP" }));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("Authentication could not be completed"));
    expect((screen.getByRole("button", { name: "SEND LOGIN OTP" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
