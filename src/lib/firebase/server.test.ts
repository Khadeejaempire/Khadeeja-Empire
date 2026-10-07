// @vitest-environment node

import { generateKeyPair, createLocalJWKSet, exportJWK, SignJWT, type JWK } from "jose";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FirebaseConfigurationError } from "./admin-config";

vi.mock("server-only", () => ({}));
vi.mock("jose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jose")>();
  return { ...actual, createRemoteJWKSet: vi.fn() };
});

import * as jose from "jose";
import { getFirebaseAdminAuth } from "./server";

const PROJECT_ID = "test-project";
let privateKey: CryptoKey;
let otherPrivateKey: CryptoKey;

function sign(
  claims: Record<string, unknown>,
  options: { key?: CryptoKey; issuer?: string; audience?: string; expiresIn?: string } = {}
) {
  return new SignJWT({
    auth_time: Math.floor(Date.now() / 1_000) - 5,
    phone_number: "+919876543210",
    firebase: { sign_in_provider: "phone" },
    ...claims,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setSubject("firebase-uid")
    .setIssuedAt()
    .setIssuer(options.issuer ?? `https://securetoken.google.com/${PROJECT_ID}`)
    .setAudience(options.audience ?? PROJECT_ID)
    .setExpirationTime(options.expiresIn ?? "1h")
    .sign(options.key ?? privateKey);
}

describe("Firebase ID token verification", () => {
  beforeAll(async () => {
    const pair = await generateKeyPair("RS256");
    privateKey = pair.privateKey;
    otherPrivateKey = (await generateKeyPair("RS256")).privateKey;
    const publicJwk: JWK = { ...(await exportJWK(pair.publicKey)), kid: "test-key", alg: "RS256" };
    vi.mocked(jose.createRemoteJWKSet).mockReturnValue(
      createLocalJWKSet({ keys: [publicJwk] }) as unknown as ReturnType<typeof jose.createRemoteJWKSet>
    );
  });

  beforeEach(() => {
    vi.stubEnv("FIREBASE_PROJECT_ID", PROJECT_ID);
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", PROJECT_ID);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the phone number and sign-in provider for a valid token", async () => {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(await sign({}));
    expect(decoded).toEqual({
      uid: "firebase-uid",
      phone_number: "+919876543210",
      firebase: { sign_in_provider: "phone" },
    });
  });

  it("normalizes dashboard whitespace and quotes on the project id", async () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", ` "${PROJECT_ID}" `);
    await expect(getFirebaseAdminAuth().verifyIdToken(await sign({}))).resolves.toBeDefined();
  });

  it("reports an expired token", async () => {
    const token = await sign({}, { expiresIn: "-1m" });
    await expect(getFirebaseAdminAuth().verifyIdToken(token)).rejects.toMatchObject({
      code: "auth/id-token-expired",
    });
  });

  it.each([
    ["garbage", () => Promise.resolve("invalid-diagnostic-token")],
    ["a token signed by another key", () => sign({}, { key: otherPrivateKey })],
    ["a token for another project", () => sign({}, { audience: "other-project" })],
    ["a token from another issuer", () => sign({}, { issuer: "https://securetoken.google.com/other" })],
    ["a token without auth_time", () => sign({ auth_time: undefined })],
    ["a token without a sign-in provider", () => sign({ firebase: {} })],
  ])("rejects %s as an invalid token", async (_, makeToken) => {
    await expect(getFirebaseAdminAuth().verifyIdToken(await makeToken())).rejects.toMatchObject({
      code: "auth/invalid-id-token",
    });
  });

  it.each([
    ["FIREBASE_PROJECT_ID", "", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "", "firebase_project_id_missing"],
    ["FIREBASE_PROJECT_ID", "different-project", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", PROJECT_ID, "firebase_project_mismatch"],
  ])("rejects invalid project configuration (%s=%s)", (nameA, valueA, nameB, valueB, reason) => {
    vi.stubEnv(nameA, valueA);
    vi.stubEnv(nameB, valueB);
    expect(getFirebaseAdminAuth).toThrow(FirebaseConfigurationError);
    expect(getFirebaseAdminAuth).toThrow(expect.objectContaining({ reason }));
  });
});
