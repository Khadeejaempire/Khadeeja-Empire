import "server-only";

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirebaseServiceAccount } from "./admin-config";

export function getFirebaseAdminAuth(): Auth {
  if (getApps().length > 0) return getAuth();

  return getAuth(
    initializeApp({
      credential: cert(getFirebaseServiceAccount(process.env)),
    })
  );
}
