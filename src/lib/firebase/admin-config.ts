import { createPrivateKey } from "node:crypto";
import type { ServiceAccount } from "firebase-admin/app";
import { ConfigurationError } from "@/lib/admin/errors";

type FirebaseConfigurationReason =
  | "firebase_credentials_missing"
  | "firebase_project_mismatch"
  | "firebase_private_key_invalid";

export class FirebaseConfigurationError extends ConfigurationError {
  constructor(readonly reason: FirebaseConfigurationReason) {
    super("Phone sign-in is unavailable because of a server configuration error. Please contact support.");
    this.name = "FirebaseConfigurationError";
  }
}

function unquote(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  const quote = trimmed[0];
  return (quote === '"' || quote === "'") && trimmed.endsWith(quote)
    ? trimmed.slice(1, -1).trim()
    : trimmed;
}

export function getFirebaseServiceAccount(env: NodeJS.ProcessEnv): ServiceAccount {
  const browserProjectId = unquote(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const projectId = unquote(env.FIREBASE_PROJECT_ID) || browserProjectId;
  const clientEmail = unquote(env.FIREBASE_CLIENT_EMAIL);
  // Dashboard values may contain literal JSON escapes, surrounding quotes, or CRLF.
  const privateKey = unquote(env.FIREBASE_PRIVATE_KEY)
    .replace(/\\+r\\+n/g, "\n")
    .replace(/\\+n/g, "\n")
    .replace(/\r\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new FirebaseConfigurationError("firebase_credentials_missing");
  }
  if (browserProjectId && projectId !== browserProjectId) {
    throw new FirebaseConfigurationError("firebase_project_mismatch");
  }
  try {
    if (createPrivateKey(privateKey).asymmetricKeyType !== "rsa") {
      throw new Error("A service-account RSA private key is required.");
    }
  } catch {
    throw new FirebaseConfigurationError("firebase_private_key_invalid");
  }

  return { projectId, clientEmail, privateKey };
}
