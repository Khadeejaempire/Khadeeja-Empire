import { describe, expect, it } from "vitest";
import {
  canRetryFirebaseVerification,
  firebasePhoneAuthErrorMessage,
} from "./errors";

describe("Firebase phone auth errors", () => {
  it("keeps an incorrect code retryable", () => {
    const error = { code: "auth/invalid-verification-code" };
    expect(canRetryFirebaseVerification(error)).toBe(true);
    expect(firebasePhoneAuthErrorMessage(error, "verify")).toContain("incorrect");
  });

  it("requires a new challenge for an expired code", () => {
    const error = { code: "auth/code-expired" };
    expect(canRetryFirebaseVerification(error)).toBe(false);
    expect(firebasePhoneAuthErrorMessage(error, "verify")).toContain("expired");
  });

  it("extracts Firebase codes from Error messages and returns an actionable error", () => {
    const error = new Error("Firebase: Error (auth/internal-error).");
    expect(firebasePhoneAuthErrorMessage(error, "verify")).toBe(
      "Firebase could not complete phone verification. Refresh the page and try again. If it continues, contact support with code auth/internal-error."
    );
  });

  it("preserves an unknown Firebase error code for support", () => {
    const error = { code: "auth/example-failure" };
    expect(firebasePhoneAuthErrorMessage(error, "send")).toContain("auth/example-failure");
  });
});
