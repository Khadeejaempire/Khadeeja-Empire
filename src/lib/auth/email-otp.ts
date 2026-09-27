import "server-only";

import { createHash, randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import type { JsonValue } from "../admin/types";
import type { DataProvider } from "../data/provider";
import {
  OTP_TTL_MS,
  OTP_COOLDOWN_MS,
  OTP_REQUEST_WINDOW_MS,
  OTP_MAX_REQUESTS,
  OTP_MAX_ATTEMPTS,
  OtpRateLimitError,
} from "./otp";

export { OTP_TTL_MS, OTP_COOLDOWN_MS, OTP_REQUEST_WINDOW_MS, OTP_MAX_REQUESTS, OTP_MAX_ATTEMPTS, OtpRateLimitError };

export const EMAIL_OTP_SETTING_PREFIX = "auth.otp.email.";

export type EmailOtpPurpose = "signup" | "login";

export interface EmailOtpChallengeState extends Record<string, JsonValue> {
  challengeId: string;
  expiresAt: number;
  attempts: number;
  requestCount: number;
  windowStartedAt: number;
  lastRequestedAt: number;
  codeHash: string;
  payload: string | null;
}

export interface EmailOtpChallengeStore {
  get(key: string): Promise<EmailOtpChallengeState | null>;
  set(key: string, state: EmailOtpChallengeState): Promise<void>;
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

const emailOtpChallengeStateSchema = z.object({
  challengeId: z.string().min(1).max(128),
  expiresAt: z.number().int().positive(),
  attempts: z.number().int().min(0).max(OTP_MAX_ATTEMPTS),
  requestCount: z.number().int().min(1).max(OTP_MAX_REQUESTS),
  windowStartedAt: z.number().int().positive(),
  lastRequestedAt: z.number().int().positive(),
  codeHash: z.string().min(1),
  payload: z.string().nullable(),
});

export function normalizeEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }
  return normalized;
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function hashCode(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email, "utf8").digest("hex");
}

function settingKey(purpose: EmailOtpPurpose, email: string): string {
  return `${EMAIL_OTP_SETTING_PREFIX}${purpose}.${hashEmail(email)}`;
}

export function createProviderEmailOtpChallengeStore(
  provider: AdminSettingProvider
): EmailOtpChallengeStore {
  return {
    async get(key) {
      const setting = await provider.getSetting(key);
      if (!setting) return null;
      const parsed = emailOtpChallengeStateSchema.safeParse(setting.value);
      return parsed.success ? parsed.data : null;
    },
    async set(key, state) {
      await provider.upsertSetting(key, state, "Short-lived email OTP challenge state.");
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

/** Test-only adapter; production actions always use provider-backed settings. */
export function createMemoryEmailOtpChallengeStore(): EmailOtpChallengeStore {
  const values = new Map<string, EmailOtpChallengeState>();
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

export async function requestEmailOtpChallenge(
  store: EmailOtpChallengeStore,
  purpose: EmailOtpPurpose,
  email: string,
  payload: string | null,
  now = Date.now()
): Promise<{ id: string; code: string; expiresAt: number }> {
  const key = settingKey(purpose, email);
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

  const code = generateOtpCode();
  const state: EmailOtpChallengeState = {
    challengeId: randomUUID(),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    requestCount: requestCount + 1,
    windowStartedAt,
    lastRequestedAt: now,
    codeHash: hashCode(code),
    payload,
  };
  await store.set(key, state);
  return { id: state.challengeId, code, expiresAt: state.expiresAt };
}

export async function verifyEmailOtpChallenge(
  store: EmailOtpChallengeStore,
  purpose: EmailOtpPurpose,
  email: string,
  challengeId: string,
  code: string,
  now = Date.now()
): Promise<{ ok: boolean; payload: string | null }> {
  const key = settingKey(purpose, email);
  const state = await store.get(key);
  if (!state || state.challengeId !== challengeId) return { ok: false, payload: null };

  if (state.expiresAt <= now) {
    await store.delete(key);
    return { ok: false, payload: null };
  }

  if (hashCode(code) !== state.codeHash) {
    const attempts = state.attempts + 1;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await store.delete(key);
    } else {
      await store.set(key, { ...state, attempts });
    }
    return { ok: false, payload: null };
  }

  await store.delete(key);
  return { ok: true, payload: state.payload };
}
