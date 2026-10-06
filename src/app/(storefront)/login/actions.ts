"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ConflictError } from "@/lib/admin/errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDataProvider } from "@/lib/data";
import {
  createProviderEmailOtpChallengeStore,
  normalizeEmail,
  requestEmailOtpChallenge,
  verifyEmailOtpChallenge,
  OtpRateLimitError,
  OTP_TTL_MS,
} from "@/lib/auth/email-otp";
import { sendBrevoEmail, signupOtpContent, loginOtpContent, passwordResetContent } from "@/lib/brevo/server";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nextUrl = (formData.get("next") as string) || "/";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { data: auth, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const dataProvider = getDataProvider();
  let customer = (await dataProvider.listCustomers({ search: email })).find(
    (c) => c.email?.toLowerCase() === email.toLowerCase()
  );

  if (customer?.status === "inactive") {
    await supabase.auth.signOut();
    return { error: "Your account is pending admin approval." };
  }

  // Self-heal: a signup that failed after the auth user was created leaves an
  // account with no customer profile, which then cannot check out.
  if (!customer) {
    const fullName =
      (auth.user?.user_metadata?.full_name as string | undefined)?.trim() ||
      email.split("@")[0];
    try {
      customer = await dataProvider.createCustomer({
        name: fullName,
        email,
        status: "active",
      });
    } catch {
      // A conflicting phone or a race must not block an otherwise valid login.
    }
  }

  revalidatePath("/", "layout");
  redirect(nextUrl);
}

async function finalizeSignup(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}): Promise<{ error?: string; signedIn?: boolean }> {
  const adminClient = createServiceRoleClient();

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, phone: input.phone },
  });

  if (createErr) {
    if (createErr.message?.toLowerCase().includes("already been registered")) {
      return { error: "An account with this email already exists. Log in or reset your password." };
    }
    return { error: createErr.message };
  }
  if (!created?.user) {
    return { error: "Could not create account. Please try again." };
  }

  const dataProvider = getDataProvider();
  try {
    await dataProvider.createCustomer({
      name: input.fullName,
      email: input.email,
      phone: input.phone,
      status: "active",
    });
  } catch (err) {
    // Roll back the auth user so a failed profile (e.g. duplicate phone) does
    // not leave the email permanently stuck as "already registered".
    await adminClient.auth.admin.deleteUser(created.user.id).catch(() => undefined);
    if (err instanceof ConflictError) {
      return { error: "That phone number is already registered. Use a different number, or log in to the existing account." };
    }
    return { error: err instanceof Error ? err.message : "Could not create customer profile." };
  }

  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  return { signedIn: !signInErr };
}

export async function requestSignupOtp(formData: FormData) {
  const emailRaw = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const phone = (formData.get("phone") as string) || "";

  if (!emailRaw || !password || !fullName) {
    return { ok: false as const, error: "All fields are required." };
  }
  if (password.length < 6) {
    return { ok: false as const, error: "Password must be at least 6 characters." };
  }

  let email: string;
  try {
    email = normalizeEmail(emailRaw);
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Enter a valid email address." };
  }

  const dataProvider = getDataProvider();
  const existing = await dataProvider.listCustomers({ search: email });
  if (existing.some((c) => c.email?.toLowerCase() === email)) {
    return { ok: false as const, error: "An account with this email already exists. Log in or reset your password." };
  }

  const store = createProviderEmailOtpChallengeStore(dataProvider);
  const payload = JSON.stringify({ password, fullName, phone });

  let challenge;
  try {
    challenge = await requestEmailOtpChallenge(store, "signup", email, payload);
  } catch (err) {
    if (err instanceof OtpRateLimitError) return { ok: false as const, error: err.message };
    throw err;
  }

  try {
    await sendBrevoEmail({
      to: email,
      toName: fullName,
      ...signupOtpContent(challenge.code, fullName),
    });
  } catch {
    return { ok: false as const, error: "Could not send the verification email. Please try again." };
  }

  return { ok: true as const, challengeId: challenge.id, expiresAt: challenge.expiresAt };
}

export async function verifySignupOtp(formData: FormData) {
  const emailRaw = formData.get("email") as string;
  const code = formData.get("code") as string;
  const challengeId = formData.get("challengeId") as string;
  const nextUrl = (formData.get("next") as string) || "/";

  if (!emailRaw || !code || !challengeId) {
    return { error: "Missing verification details." };
  }

  let email: string;
  try {
    email = normalizeEmail(emailRaw);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Enter a valid email address." };
  }

  const dataProvider = getDataProvider();
  const store = createProviderEmailOtpChallengeStore(dataProvider);
  const result = await verifyEmailOtpChallenge(store, "signup", email, challengeId, code);
  if (!result.ok || !result.payload) {
    return { error: "That code is invalid or has expired." };
  }

  const pending = JSON.parse(result.payload) as { password: string; fullName: string; phone: string };
  const finalized = await finalizeSignup({
    email,
    password: pending.password,
    fullName: pending.fullName,
    phone: pending.phone,
  });

  if (finalized.error) {
    return { error: finalized.error };
  }

  revalidatePath("/", "layout");
  redirect(finalized.signedIn ? nextUrl : "/login?created=1");
}

export async function requestLoginOtp(formData: FormData) {
  const emailRaw = formData.get("email") as string;
  if (!emailRaw) return { ok: false as const, error: "Email is required." };

  let email: string;
  try {
    email = normalizeEmail(emailRaw);
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Enter a valid email address." };
  }

  const dataProvider = getDataProvider();
  const customer = (await dataProvider.listCustomers({ search: email })).find(
    (c) => c.email?.toLowerCase() === email
  );

  // Don't reveal whether an account exists: return a generic success shape
  // backed by an unusable challenge id, so verification simply fails as "invalid".
  const noAccountResponse = { ok: true as const, challengeId: randomUUID(), expiresAt: Date.now() + OTP_TTL_MS };

  if (!customer || customer.status === "inactive") {
    return noAccountResponse;
  }

  const adminClient = createServiceRoleClient();
  const { data, error } = await adminClient.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data?.properties?.hashed_token) {
    return noAccountResponse;
  }

  const store = createProviderEmailOtpChallengeStore(dataProvider);
  let challenge;
  try {
    challenge = await requestEmailOtpChallenge(store, "login", email, data.properties.hashed_token);
  } catch (err) {
    if (err instanceof OtpRateLimitError) return { ok: false as const, error: err.message };
    throw err;
  }

  try {
    await sendBrevoEmail({
      to: email,
      toName: customer.name ?? undefined,
      ...loginOtpContent(challenge.code),
    });
  } catch {
    return { ok: false as const, error: "Could not send the verification email. Please try again." };
  }

  return { ok: true as const, challengeId: challenge.id, expiresAt: challenge.expiresAt };
}

export async function verifyLoginOtp(formData: FormData) {
  const emailRaw = formData.get("email") as string;
  const code = formData.get("code") as string;
  const challengeId = formData.get("challengeId") as string;
  const nextUrl = (formData.get("next") as string) || "/";

  if (!emailRaw || !code || !challengeId) {
    return { error: "Missing verification details." };
  }

  let email: string;
  try {
    email = normalizeEmail(emailRaw);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Enter a valid email address." };
  }

  const dataProvider = getDataProvider();
  const store = createProviderEmailOtpChallengeStore(dataProvider);
  const result = await verifyEmailOtpChallenge(store, "login", email, challengeId, code);
  if (!result.ok || !result.payload) {
    return { error: "That code is invalid or has expired." };
  }

  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.verifyOtp({
    token_hash: result.payload,
    type: "magiclink",
  });
  if (error || !auth.user) {
    return { error: "Could not complete login. Please try again." };
  }

  let customer = (await dataProvider.listCustomers({ search: email })).find(
    (c) => c.email?.toLowerCase() === email
  );

  if (customer?.status === "inactive") {
    await supabase.auth.signOut();
    return { error: "Your account is pending admin approval." };
  }

  if (!customer) {
    const fullName =
      (auth.user.user_metadata?.full_name as string | undefined)?.trim() || email.split("@")[0];
    try {
      customer = await dataProvider.createCustomer({ name: fullName, email, status: "active" });
    } catch {
      // A conflicting phone or a race must not block an otherwise valid login.
    }
  }

  revalidatePath("/", "layout");
  redirect(nextUrl);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function resetPassword(formData: FormData) {
  const emailRaw = formData.get("email") as string;

  if (!emailRaw) {
    return { error: "Email is required." };
  }

  const genericSuccess = { success: "Password reset link sent to your email." };

  let email: string;
  try {
    email = normalizeEmail(emailRaw);
  } catch {
    return genericSuccess;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const adminClient = createServiceRoleClient();
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl}/auth/confirm` },
  });

  if (!error && data?.properties?.action_link) {
    try {
      await sendBrevoEmail({ to: email, ...passwordResetContent(data.properties.action_link) });
    } catch {
      // Don't reveal delivery failures; the generic response below still applies.
    }
  }

  return genericSuccess;
}
