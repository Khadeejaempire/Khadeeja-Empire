import "server-only";

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ConfigurationError } from "@/lib/admin/errors";

export function getFirebaseAdminAuth() {
  if (getApps().length > 0) return getAuth();

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new ConfigurationError(
      "Firebase phone login is not configured on the server. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  return getAuth(
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    })
  );
}
