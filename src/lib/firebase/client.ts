import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

function getFirebaseApp() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (Object.values(config).some((value) => !value)) {
    throw new Error("Firebase phone login is not configured.");
  }

  return getApps().length > 0 ? getApp() : initializeApp(config);
}

export function getFirebaseAuth() {
  const auth = getAuth(getFirebaseApp());
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_FIREBASE_USE_TEST_PHONE_AUTH === "true"
  ) {
    auth.settings.appVerificationDisabledForTesting = true;
  }
  return auth;
}
