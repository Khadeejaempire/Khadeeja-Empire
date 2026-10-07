// @vitest-environment node

import { generateKeyPairSync } from "node:crypto";
import { deleteApp, getApps } from "firebase-admin/app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FirebaseConfigurationError } from "./admin-config";

vi.mock("server-only", () => ({}));

import { getFirebaseAdminAuth } from "./server";

// Exercise the real Admin SDK with a temporary key, without contacting Firebase.
const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

describe("Firebase Admin credential loading", () => {
  beforeEach(() => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "test@test-project.iam.gserviceaccount.com");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", privateKey);
  });

  afterEach(async () => {
    await Promise.all(getApps().map((app) => deleteApp(app)));
    vi.unstubAllEnvs();
  });

  it.each([
    ["PEM", privateKey],
    ["escaped newlines", privateKey.replace(/\n/g, "\\n")],
    ["JSON string", JSON.stringify(privateKey)],
    ["quoted multiline", `'${privateKey}'`],
    ["double-escaped newlines", privateKey.replace(/\n/g, "\\\\n")],
    ["Windows newlines", privateKey.replace(/\n/g, "\r\n")],
  ])("loads %s credentials and rejects an invalid token without a server error", async (_, value) => {
    vi.stubEnv("FIREBASE_PRIVATE_KEY", `  ${value}  `);
    const auth = getFirebaseAdminAuth();
    expect(getFirebaseAdminAuth()).toBe(auth);
    await expect(auth.verifyIdToken("invalid-diagnostic-token", true)).rejects.toMatchObject({
      code: "auth/argument-error",
    });
  });

  it("normalizes dashboard whitespace and quotes on the project and service-account email", () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", ' "test-project" ');
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", ' "test@test-project.iam.gserviceaccount.com" ');
    expect(getFirebaseAdminAuth()).toBeDefined();
  });

  it.each([
    ["FIREBASE_PRIVATE_KEY", "", "firebase_credentials_missing"],
    ["FIREBASE_PRIVATE_KEY", "invalid-private-key", "firebase_private_key_invalid"],
    ["FIREBASE_PROJECT_ID", "different-project", "firebase_project_mismatch"],
  ])("rejects invalid %s configuration before initializing an app", (name, value, reason) => {
    vi.stubEnv(name, value);
    expect(getFirebaseAdminAuth).toThrow(FirebaseConfigurationError);
    expect(getFirebaseAdminAuth).toThrow(expect.objectContaining({ reason }));
    expect(getApps()).toHaveLength(0);
  });
});
