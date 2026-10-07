import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type { JsonValue } from "../admin/types";
import type { DataProvider } from "../data/provider";
export { normalizePhone } from "./phone";

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_COOLDOWN_MS = 60 * 1000;
export const OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000;
export const OTP_MAX_REQUESTS = 3;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_SETTING_PREFIX = "auth.otp.challenge.";

// This is the SHA-256 digest of the mock code. The plain code exists only in the mock UI/tests.
const DEMO_OTP_HASH = "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5";

export interface OtpChallengeState extends Record<string, JsonValue> {
  challengeId: string;
  expiresAt: number;
  attempts: number;
  requestCount: number;
  windowStartedAt: number;
  lastRequestedAt: number;
}

export interface OtpChallengeStore {
  get(key: string): Promise<OtpChallengeState | null>;
  set(key: string, state: OtpChallengeState): Promise<void>;
  delete(key: string): Promise<boolean>;
}

interface AdminSettingProvider {
  getSetting(key: string): ReturnType<DataProvider["getSetting"]>;
  upsertSetting(
    key: string,
    value: Parameters<DataProvider["upsertSetting"]>[1],
    description?: string | null
  ): ReturnType<DataProvider["upsertSetting"]>;
  deleteSetting(key: string): ReturnType<DataProvider["deleteSetting"]>;
}

const otpChallengeStateSchema = z.object({
  challengeId: z.string().min(1).max(128),
  expiresAt: z.number().int().positive(),
  attempts: z.number().int().min(0).max(OTP_MAX_ATTEMPTS),
  requestCount: z.number().int().min(1).max(OTP_MAX_REQUESTS),
  windowStartedAt: z.number().int().positive(),
  lastRequestedAt: z.number().int().positive(),
});

export class OtpRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = "OtpRateLimitError";
    this.retryAfterMs = retryAfterMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function hashPhone(phone: string): string {
  return createHash("sha256").update(phone, "utf8").digest("hex");
}

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp, "utf8").digest("hex");
}

function settingKey(phone: string): string {
  return `${OTP_SETTING_PREFIX}${hashPhone(phone)}`;
}

export function createProviderOtpChallengeStore(
  provider: AdminSettingProvider
): OtpChallengeStore {
  return {
    async get(key) {
      const setting = await provider.getSetting(key);
      if (!setting) return null;
      const parsed = otpChallengeStateSchema.safeParse(setting.value);
      return parsed.success ? parsed.data : null;
    },
    async set(key, state) {
      await provider.upsertSetting(key, state, "Short-lived mock OTP challenge state.");
    },
    async delete(key) {
      try {
        await provider.deleteSetting(key);
        return true;
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "not_found") {
          return false;
        }
        throw error;
      }
    },
  };
}

/** Test-only adapter; production routes always use provider-backed settings. */
export function createMemoryOtpChallengeStore(): OtpChallengeStore {
  const values = new Map<string, OtpChallengeState>();
  return {
    async get(key) {
      const value = values.get(key);
      return value ? { ...value } : null;
    },
    async set(key, state) {
      values.set(key, { ...state });
    },
    async delete(key) {
      return values.delete(key);
    },
  };
}

export async function requestOtpChallenge(
  store: OtpChallengeStore,
  phone: string,
  now = Date.now()
): Promise<{ id: string; expiresAt: number }> {
  const key = settingKey(phone);
  const previous = await store.get(key);
  const windowExpired =
    !previous || now - previous.windowStartedAt >= OTP_REQUEST_WINDOW_MS;
  const requestCount = windowExpired ? 0 : previous.requestCount;
  const windowStartedAt = windowExpired ? now : previous.windowStartedAt;
  const lastRequestedAt = windowExpired ? 0 : previous.lastRequestedAt;

  if (now - lastRequestedAt < OTP_COOLDOWN_MS) {
    throw new OtpRateLimitError(
      "Please wait before requesting another verification code.",
      OTP_COOLDOWN_MS - (now - lastRequestedAt)
    );
  }
  if (requestCount >= OTP_MAX_REQUESTS) {
    throw new OtpRateLimitError(
      "Too many verification code requests. Try again later.",
      OTP_REQUEST_WINDOW_MS - (now - windowStartedAt)
    );
  }

  const state: OtpChallengeState = {
    challengeId: randomUUID(),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    requestCount: requestCount + 1,
    windowStartedAt,
    lastRequestedAt: now,
  };
  await store.set(key, state);
  return { id: state.challengeId, expiresAt: state.expiresAt };
}

export async function verifyOtpChallenge(
  store: OtpChallengeStore,
  challengeId: string,
  phone: string,
  otp: string,
  now = Date.now()
): Promise<boolean> {
  const key = settingKey(phone);
  const state = await store.get(key);
  if (!state || state.challengeId !== challengeId) return false;

  if (state.expiresAt <= now) {
    await store.delete(key);
    return false;
  }

  if (hashOtp(otp) !== DEMO_OTP_HASH) {
    const attempts = state.attempts + 1;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await store.delete(key);
    } else {
      await store.set(key, { ...state, attempts });
    }
    return false;
  }

  return store.delete(key);
}
