export type ProviderErrorCode =
  | "configuration"
  | "authorization"
  | "not_found"
  | "conflict"
  | "validation"
  | "storage"
  | "query"
  | "unknown";

export class DataProviderError extends Error {
  readonly code: ProviderErrorCode;

  constructor(code: ProviderErrorCode, message: string) {
    super(message);
    this.name = "DataProviderError";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const ProviderError = DataProviderError;

export class ConfigurationError extends DataProviderError {
  constructor(message = "Data provider configuration is incomplete.") {
    super("configuration", message);
    this.name = "ConfigurationError";
  }
}

export class AuthorizationError extends DataProviderError {
  constructor(message = "You are not authorized to perform this operation.") {
    super("authorization", message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends DataProviderError {
  constructor(resource = "Record") {
    super("not_found", `${resource} was not found.`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends DataProviderError {
  constructor(message = "That record already exists.") {
    super("conflict", message);
    this.name = "ConflictError";
  }
}

export class ValidationError extends DataProviderError {
  constructor(message = "The supplied data is invalid.") {
    super("validation", message);
    this.name = "ValidationError";
  }
}

export function isDataProviderError(error: unknown): error is DataProviderError {
  return error instanceof DataProviderError;
}

export function toDataProviderError(
  error: unknown,
  fallback = "The data provider could not complete the operation."
): DataProviderError {
  if (isDataProviderError(error)) return error;
  return new DataProviderError("unknown", fallback);
}

// Next.js strips thrown Server Action messages from production responses — the
// client only ever sees "Minified React error #441". `digest` is the one field
// it forwards verbatim, so `finishFormAction` puts the real reason there under
// an `admin:` prefix and we read it back on the client.
// ponytail: digest is a short opaque string, not a data channel. If a failure
// ever needs structure or more than a sentence, return an AdminActionResult
// from the action instead of throwing.
const ADMIN_DIGEST_PREFIX = "admin:";

export function adminDigest(message: string): string {
  return `${ADMIN_DIGEST_PREFIX}${message}`;
}

export function serverErrorMessage(error: unknown, fallback: string): string {
  const digest =
    error && typeof error === "object" && "digest" in error
      ? String((error as { digest?: unknown }).digest ?? "").trim()
      : "";
  if (digest.startsWith(ADMIN_DIGEST_PREFIX)) {
    const detail = digest.slice(ADMIN_DIGEST_PREFIX.length).trim();
    if (detail) return detail;
  }
  return fallback;
}

// A rejected server action can mean two very different things. Errors raised by
// `adminMutation` carry an `admin:` digest with the real reason; a framework or
// render error means the write may already have committed and only the page
// refresh failed. Never show the minified framework string, and never invite a
// blind retry in that second case.
const SERVER_REFRESH_FAILURE =
  /Minified React error #\d+|An error occurred in the Server Components render|An unexpected response was received from the server/i;

export function adminActionMessage(error: unknown, fallback: string): string {
  const fromDigest = serverErrorMessage(error, "");
  if (fromDigest) return fromDigest;
  const message = error instanceof Error ? error.message?.trim() : "";
  if (!message || SERVER_REFRESH_FAILURE.test(message)) return fallback;
  return message;
}
