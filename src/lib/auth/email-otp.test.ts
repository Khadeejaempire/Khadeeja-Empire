import { describe, expect, it, vi } from "vitest";
import type { JsonValue } from "../admin/types";

vi.mock("server-only", () => ({}));

import {
  createMemoryEmailOtpChallengeStore,
  createProviderEmailOtpChallengeStore,
  requestEmailOtpChallenge,
  verifyEmailOtpChallenge,
  normalizeEmail,
  EMAIL_OTP_SETTING_PREFIX,
  OTP_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_REQUESTS,
  OTP_REQUEST_WINDOW_MS,
} from "./email-otp";

describe("email OTP", () => {
  it("normalizes and validates email-only input", () => {
    expect(normalizeEmail(" Test@Example.com ")).toBe("test@example.com");
    expect(() => normalizeEmail("not-an-email")).toThrow();
  });

  it("creates expiring server-side state and returns the real code once", async () => {
    const store = createMemoryEmailOtpChallengeStore();
    const challenge = await requestEmailOtpChallenge(store, "signup", "a@b.com", null, 1_700_000_000_000);

    expect(challenge).toMatchObject({
      id: expect.stringMatching(/^[a-f0-9-]+$/),
      code: expect.stringMatching(/^\d{6}$/),
      expiresAt: expect.any(Number),
    });
  });

  it("verifies the correct code once before expiry, carrying the payload through", async () => {
    const now = 1_700_000_000_000;
    const store = createMemoryEmailOtpChallengeStore();
    const challenge = await requestEmailOtpChallenge(store, "signup", "b@b.com", "pending-data", now);

    expect(await verifyEmailOtpChallenge(store, "signup", "b@b.com", challenge.id, "000000", now + 1)).toMatchObject({
      ok: false,
    });
    expect(
      await verifyEmailOtpChallenge(store, "signup", "b@b.com", challenge.id, challenge.code, now + 2)
    ).toEqual({ ok: true, payload: "pending-data" });
    expect(await verifyEmailOtpChallenge(store, "signup", "b@b.com", challenge.id, challenge.code, now + 3)).toMatchObject({
      ok: false,
    });
  });

  it("rejects an expired challenge", async () => {
    const now = 1_700_000_000_000;
    const store = createMemoryEmailOtpChallengeStore();
    const challenge = await requestEmailOtpChallenge(store, "login", "c@b.com", null, now);

    await expect(
      verifyEmailOtpChallenge(store, "login", "c@b.com", challenge.id, challenge.code, challenge.expiresAt + 1)
    ).resolves.toMatchObject({ ok: false });
  });

  it("keeps signup and login challenges for the same email independent", async () => {
    const now = 1_700_000_050_000;
    const store = createMemoryEmailOtpChallengeStore();
    const signupChallenge = await requestEmailOtpChallenge(store, "signup", "d@b.com", "signup-payload", now);
    const loginChallenge = await requestEmailOtpChallenge(store, "login", "d@b.com", "login-payload", now);

    expect(
      await verifyEmailOtpChallenge(store, "login", "d@b.com", signupChallenge.id, signupChallenge.code, now + 1)
    ).toMatchObject({ ok: false });
    expect(
      await verifyEmailOtpChallenge(store, "signup", "d@b.com", signupChallenge.id, signupChallenge.code, now + 1)
    ).toEqual({ ok: true, payload: "signup-payload" });
    expect(
      await verifyEmailOtpChallenge(store, "login", "d@b.com", loginChallenge.id, loginChallenge.code, now + 2)
    ).toEqual({ ok: true, payload: "login-payload" });
  });

  it("enforces request cooldown and a bounded request window", async () => {
    const email = "e@b.com";
    const now = 1_700_000_100_000;
    const store = createMemoryEmailOtpChallengeStore();
    await requestEmailOtpChallenge(store, "login", email, null, now);

    await expect(requestEmailOtpChallenge(store, "login", email, null, now + OTP_COOLDOWN_MS - 1)).rejects.toThrow(
      /wait/i
    );

    for (let request = 1; request < OTP_MAX_REQUESTS; request += 1) {
      await requestEmailOtpChallenge(store, "login", email, null, now + request * OTP_COOLDOWN_MS);
    }

    await expect(
      requestEmailOtpChallenge(store, "login", email, null, now + (OTP_MAX_REQUESTS + 1) * OTP_COOLDOWN_MS)
    ).rejects.toThrow(/too many/i);
    expect(OTP_REQUEST_WINDOW_MS).toBeGreaterThan(OTP_MAX_REQUESTS * OTP_COOLDOWN_MS);
  });

  it("locks a challenge after the maximum failed attempts", async () => {
    const email = "f@b.com";
    const now = 1_700_000_200_000;
    const store = createMemoryEmailOtpChallengeStore();
    const challenge = await requestEmailOtpChallenge(store, "login", email, null, now);

    for (let attempt = 0; attempt < OTP_MAX_ATTEMPTS; attempt += 1) {
      expect(
        await verifyEmailOtpChallenge(store, "login", email, challenge.id, "000000", now + attempt + 1)
      ).toMatchObject({ ok: false });
    }

    expect(
      await verifyEmailOtpChallenge(store, "login", email, challenge.id, challenge.code, now + 10)
    ).toMatchObject({ ok: false });
  });

  it("stores challenge state under a namespaced, hashed-email key across provider store instances", async () => {
    const values = new Map<string, JsonValue>();
    const provider = {
      async getSetting(key: string) {
        const value = values.get(key);
        return value === undefined ? null : { id: key, key, value };
      },
      async upsertSetting(key: string, value: JsonValue) {
        values.set(key, value);
        return { id: key, key, value };
      },
      async deleteSetting(key: string) {
        if (!values.delete(key)) throw Object.assign(new Error("missing"), { code: "not_found" });
      },
    };
    const email = "g@b.com";
    const firstStore = createProviderEmailOtpChallengeStore(provider);
    const secondStore = createProviderEmailOtpChallengeStore(provider);
    const challenge = await requestEmailOtpChallenge(firstStore, "signup", email, "secret-payload", 1_700_000_300_000);

    const keys = [...values.keys()];
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(new RegExp(`^${EMAIL_OTP_SETTING_PREFIX.replace(/\./g, "\\.")}signup\\.[a-f0-9]+$`));
    expect(JSON.stringify([...values.values()])).not.toContain(challenge.code);

    expect(
      await verifyEmailOtpChallenge(secondStore, "signup", email, challenge.id, challenge.code, 1_700_000_300_001)
    ).toEqual({ ok: true, payload: "secret-payload" });
    expect(values.size).toBe(0);
  });
});
