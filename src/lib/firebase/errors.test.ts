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

  it("does not expose raw Firebase internal errors", () => {
    const error = new Error("Firebase: Error (auth/internal-error).");
    expect(firebasePhoneAuthErrorMessage(error, "verify")).toBe(
      "Could not verify the code. Please try again."
    );
  });
});
