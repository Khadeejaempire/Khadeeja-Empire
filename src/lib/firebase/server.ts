import "server-only";

import { createRemoteJWKSet, errors, jwtVerify } from "jose";
import { getFirebaseProjectId } from "./admin-config";

const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

export type FirebaseDecodedIdToken = {
  uid: string;
  phone_number?: string;
  firebase: { sign_in_provider: string };
};

class FirebaseTokenError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "FirebaseTokenError";
  }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

// Verifies Firebase ID tokens with `jose` and Google's public signing keys instead of
// firebase-admin, whose entry points fail with ERR_REQUIRE_ESM on the Vercel runtime.
async function verifyIdToken(projectId: string, idToken: string): Promise<FirebaseDecodedIdToken> {
  jwks ??= createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      algorithms: ["RS256"],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const firebase = payload.firebase as { sign_in_provider?: unknown } | undefined;
    const authTime = typeof payload.auth_time === "number" ? payload.auth_time : null;
    if (
      !payload.sub ||
      payload.sub.length > 128 ||
      authTime === null ||
      authTime > Math.floor(Date.now() / 1_000) + 60 ||
      typeof firebase?.sign_in_provider !== "string"
    ) {
      throw new FirebaseTokenError("auth/invalid-id-token");
    }

    return {
      uid: payload.sub,
      phone_number: typeof payload.phone_number === "string" ? payload.phone_number : undefined,
      firebase: { sign_in_provider: firebase.sign_in_provider },
    };
  } catch (error) {
    if (error instanceof FirebaseTokenError) throw error;
    if (error instanceof errors.JWTExpired) throw new FirebaseTokenError("auth/id-token-expired");
    if (error instanceof errors.JOSEError) throw new FirebaseTokenError("auth/invalid-id-token");
    throw error;
  }
}

export function getFirebaseAdminAuth() {
  const projectId = getFirebaseProjectId(process.env);
  return { verifyIdToken: (idToken: string) => verifyIdToken(projectId, idToken) };
}
