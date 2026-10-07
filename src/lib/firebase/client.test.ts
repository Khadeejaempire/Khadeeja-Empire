import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { auth, getApp, getApps, getAuth, initializeApp } = vi.hoisted(() => ({
  auth: { settings: { appVerificationDisabledForTesting: false } },
  getApp: vi.fn(),
  getApps: vi.fn(() => []),
  getAuth: vi.fn(),
  initializeApp: vi.fn(() => ({ name: "test-app" })),
}));

vi.mock("firebase/app", () => ({ getApp, getApps, initializeApp }));
vi.mock("firebase/auth", () => ({ getAuth }));

import { getFirebaseAuth } from "./client";

describe("Firebase client phone test mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.settings.appVerificationDisabledForTesting = false;
    getAuth.mockReturnValue(auth);
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "test-api-key");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "test.firebaseapp.com");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "test-app-id");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables mock app verification only when explicitly requested in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_USE_TEST_PHONE_AUTH", "true");

    getFirebaseAuth();

    expect(auth.settings.appVerificationDisabledForTesting).toBe(true);
  });

  it("never disables app verification in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_USE_TEST_PHONE_AUTH", "true");

    getFirebaseAuth();

    expect(auth.settings.appVerificationDisabledForTesting).toBe(false);
  });
});
