import "server-only";

import type * as FirebaseAdminApp from "firebase-admin/app";
import type * as FirebaseAdminAuth from "firebase-admin/auth";
import { getFirebaseServiceAccount } from "./admin-config";

type FirebaseAdminModules = {
  app: typeof FirebaseAdminApp;
  auth: typeof FirebaseAdminAuth;
};

function loadFirebaseAdmin(): FirebaseAdminModules {
  // Firebase Admin publishes separate ESM and CommonJS entry points. Next's
  // external-package loader selected the ESM entry point in Vercel and raised
  // ERR_REQUIRE_ESM before token verification. `require` deliberately selects
  // the CommonJS export, which is the supported Node runtime boundary here.
  return {
    app: require("firebase-admin/app") as typeof FirebaseAdminApp,
    auth: require("firebase-admin/auth") as typeof FirebaseAdminAuth,
  };
}

export function getFirebaseAdminAuth(): FirebaseAdminAuth.Auth {
  const { app, auth } = loadFirebaseAdmin();
  if (app.getApps().length > 0) return auth.getAuth();

  return auth.getAuth(
    app.initializeApp({
      credential: app.cert(getFirebaseServiceAccount(process.env)),
    })
  );
}
