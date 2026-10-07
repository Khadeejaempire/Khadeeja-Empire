import { ConfigurationError } from "@/lib/admin/errors";

type FirebaseConfigurationReason = "firebase_project_id_missing" | "firebase_project_mismatch";

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

// ID tokens are verified against Google's public keys, so only the project id is needed.
export function getFirebaseProjectId(env: NodeJS.ProcessEnv): string {
  const browserProjectId = unquote(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const projectId = unquote(env.FIREBASE_PROJECT_ID) || browserProjectId;

  if (!projectId) throw new FirebaseConfigurationError("firebase_project_id_missing");
  if (browserProjectId && projectId !== browserProjectId) {
    throw new FirebaseConfigurationError("firebase_project_mismatch");
  }
  return projectId;
}
