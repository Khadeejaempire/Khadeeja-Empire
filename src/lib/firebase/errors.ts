export type FirebasePhoneAuthPhase = "send" | "verify";

export function firebaseAuthErrorCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }

  if (error instanceof Error) {
    return error.message.match(/\((auth\/[a-z0-9-]+)\)/i)?.[1].toLowerCase() ?? null;
  }

  return null;
}

export function firebasePhoneAuthErrorMessage(
  error: unknown,
  phase: FirebasePhoneAuthPhase
): string {
  const code = firebaseAuthErrorCode(error);

  if (!code && error instanceof Error && error.message === "Enter a valid phone number.") {
    return error.message;
  }

  if (!code && error instanceof Error && error.message.startsWith("Phone verification is still loading.")) {
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
    case "auth/missing-recaptcha-token":
    case "auth/invalid-recaptcha-token":
    case "auth/invalid-recaptcha-action":
    case "auth/missing-recaptcha-version":
    case "auth/invalid-recaptcha-version":
      return `The reCAPTCHA check failed (${code}). Refresh the page and try again.`;
    case "auth/recaptcha-not-enabled":
      return "Phone verification reCAPTCHA is not enabled in Firebase. Please contact support.";
    case "auth/unauthorized-domain":
    case "auth/app-not-authorized":
    case "auth/operation-not-allowed":
      return "Phone verification is not enabled for this site. Please contact support.";
    case "auth/invalid-api-key":
    case "auth/auth-domain-config-required":
      return "Phone verification is not configured correctly for this site. Please contact support.";
    case "auth/network-request-failed":
      return "A network error interrupted phone verification. Check your connection and try again.";
    case "auth/timeout":
      return "Phone verification timed out. Check your connection and try again.";
    case "auth/cors-unsupported":
    case "auth/operation-not-supported-in-this-environment":
    case "auth/web-storage-unsupported":
      return "This browser is blocking phone verification. Enable cookies and site storage, then try again in a standard browser tab.";
    case "auth/internal-error":
      return "Firebase could not complete phone verification. Refresh the page and try again. If it continues, contact support with code auth/internal-error.";
    case "auth/invalid-verification-id":
    case "auth/missing-verification-id":
      return "Your verification session is no longer valid. Request a new code.";
    case "auth/user-disabled":
      return "This phone account has been disabled. Please contact support.";
    default:
      if (code) {
        return `Phone verification failed (${code}). Please contact support with this code.`;
      }
      return phase === "send"
        ? "Firebase or reCAPTCHA could not start phone verification. Retry once; if it continues, disable browser content blockers and refresh the page."
        : "Code verification failed before Firebase returned an error code. Request a new code and try again.";
  }
}

export function canRetryFirebaseVerification(error: unknown): boolean {
  const code = firebaseAuthErrorCode(error);
  return code === "auth/invalid-verification-code" || code === "auth/network-request-failed";
}
