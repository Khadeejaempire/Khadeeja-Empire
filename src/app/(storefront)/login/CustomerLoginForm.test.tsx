import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, refresh: routerRefresh }),
}));

vi.mock("firebase/auth", () => {
  class RecaptchaVerifier {
    constructor(...args: unknown[]) {
      recaptchaConstructor(...args);
    }

    render = renderRecaptcha;
    clear = clearRecaptcha;
  }

  return { RecaptchaVerifier, signInWithPhoneNumber };
});

vi.mock("@/lib/firebase/client", () => ({ getFirebaseAuth }));

vi.mock("./actions", () => ({
  requestSignupOtp,
  verifySignupOtp: vi.fn(),
  requestLoginOtp,
  verifyLoginOtp: vi.fn(),
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
      "customer-phone-auth-submit",
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
});
