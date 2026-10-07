export type FirebasePhoneAuthPhase = "send" | "verify";

export function firebaseAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
}

export function firebasePhoneAuthErrorMessage(
  error: unknown,
  phase: FirebasePhoneAuthPhase
): string {
  const code = firebaseAuthErrorCode(error);

  if (!code && error instanceof Error && error.message === "Enter a valid phone number.") {
    return error.message;
  }

  switch (code) {
    case "auth/invalid-phone-number":
    case "auth/missing-phone-number":
      return "Enter a valid phone number, including the country code if it is outside India.";
    case "auth/invalid-verification-code":
      return "That verification code is incorrect. Check the code and try again.";
    case "auth/code-expired":
    case "auth/session-expired":
      return "That verification code has expired. Request a new code.";
    case "auth/too-many-requests":
      return "Too many attempts were made from this device. Please wait before trying again.";
    case "auth/quota-exceeded":
      return "Phone verification is temporarily unavailable. Please try again later.";
    case "auth/captcha-check-failed":
    case "auth/missing-app-credential":
    case "auth/invalid-app-credential":
      return "The reCAPTCHA check failed. Refresh the page and try again.";
    case "auth/unauthorized-domain":
    case "auth/app-not-authorized":
    case "auth/operation-not-allowed":
      return "Phone verification is not enabled for this site. Please contact support.";
    case "auth/network-request-failed":
      return "A network error interrupted phone verification. Check your connection and try again.";
    default:
      return phase === "send"
        ? "Could not send the verification code. Please try again."
        : "Could not verify the code. Please try again.";
  }
}

export function canRetryFirebaseVerification(error: unknown): boolean {
  const code = firebaseAuthErrorCode(error);
  return code === "auth/invalid-verification-code" || code === "auth/network-request-failed";
}
