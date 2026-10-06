"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, User } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  requestSignupOtp,
  verifySignupOtp,
  requestLoginOtp,
  verifyLoginOtp,
  resetPassword,
} from "./actions";

type AuthMode = "login" | "signup" | "forgot";
type LoginMethod = "emailOtp" | "phoneOtp";
type Step = "details" | "code";

export function CustomerLoginForm({ next, initialSuccess }: { next: string; initialSuccess?: string }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("emailOtp");
  const [step, setStep] = useState<Step>("details");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(initialSuccess ?? null);
  const router = useRouter();
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setLoginMethod("emailOtp");
    setStep("details");
    setCode("");
    setChallengeId(null);
    setError(null);
    setSuccess(null);
  };

  const normalizeFirebasePhone = (value: string) => {
    const compact = value.trim().replace(/[\s()\-]/g, "");
    return compact.startsWith("+") ? compact : `+91${compact}`;
  };

  const getRecaptchaVerifier = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(getFirebaseAuth(), "firebase-recaptcha", {
        size: "invisible",
      });
    }
    return recaptchaRef.current;
  };

  const requestFirebasePhoneCode = async (value = phone) => {
    const normalizedPhone = normalizeFirebasePhone(value);
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setError("Enter a valid phone number.");
      return;
    }

    const confirmation = await signInWithPhoneNumber(
      getFirebaseAuth(),
      normalizedPhone,
      getRecaptchaVerifier()
    );
    confirmationRef.current = confirmation;
    setStep("code");
  };

  const handleBackToDetails = () => {
    setStep("details");
    setCode("");
    setChallengeId(null);
    setError(null);
    setSuccess(null);
  };

  const handleResend = () => {
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("email", email);
    if (next) formData.append("next", next);

    startTransition(async () => {
      if (mode === "login" && loginMethod === "phoneOtp") {
        try {
          await requestFirebasePhoneCode();
          setSuccess("A new code has been sent.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not send a new code. Please try again.");
        }
      } else if (mode === "signup" && isPhoneValue(email)) {
        try {
          await requestFirebasePhoneCode(email);
          setSuccess("A new code has been sent.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not send a new code. Please try again.");
        }
      } else if (mode === "signup") {
        formData.append("fullName", fullName);
        formData.append("phone", phone);
        const res = await requestSignupOtp(formData);
        if (!res.ok) {
          setError(res.error);
        } else {
          setChallengeId(res.challengeId);
          setSuccess("A new code has been sent.");
        }
      } else if (mode === "login" && isPhoneValue(email)) {
        try {
          await requestFirebasePhoneCode(email);
          setSuccess("A new code has been sent.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not send a new code. Please try again.");
        }
      } else if (mode === "login" && loginMethod === "emailOtp") {
        const res = await requestLoginOtp(formData);
        if (!res.ok) {
          setError(res.error);
        } else {
          setChallengeId(res.challengeId);
          setSuccess("A new code has been sent.");
        }
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("email", email);
    if (fullName) formData.append("fullName", fullName);
    if (phone) formData.append("phone", phone);
    if (next) formData.append("next", next);
    if (step === "code") {
      formData.append("code", code);
      formData.append("challengeId", challengeId || "");
    }

    startTransition(async () => {
      if (
        (mode === "login" && (loginMethod === "phoneOtp" || isPhoneValue(email))) ||
        (mode === "signup" && step === "details" && isPhoneValue(email))
      ) {
        try {
          if (step === "details") {
            await requestFirebasePhoneCode(email);
            return;
          }

          if (!confirmationRef.current) {
            setError("Your verification session expired. Request a new code.");
            setStep("details");
            return;
          }

          const credential = await confirmationRef.current.confirm(code);
          const idToken = await credential.user.getIdToken();
          const response = await fetch("/api/customer/firebase-phone-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idToken,
              next,
              fullName: mode === "signup" ? fullName : undefined,
              allowCreate: mode === "signup",
            }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || !result.ok) {
            setError(result.error || "Could not sign you in. Please try again.");
            return;
          }
          router.push(result.redirectTo || "/");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not verify the code. Please try again.");
        }
        return;
      }

      if (mode === "login" && loginMethod === "emailOtp") {
        if (step === "details") {
          const res = await requestLoginOtp(formData);
          if (!res.ok) {
            setError(res.error);
          } else {
            setChallengeId(res.challengeId);
            setStep("code");
          }
          return;
        }
        const res = await verifyLoginOtp(formData);
        if (res && "error" in res && res.error) setError(res.error);
        return;
      }

      if (mode === "signup") {
        if (step === "details") {
          const res = await requestSignupOtp(formData);
          if (!res.ok) {
            setError(res.error);
          } else {
            setChallengeId(res.challengeId);
            setStep("code");
          }
          return;
        }
        const res = await verifySignupOtp(formData);
        if (res && "error" in res && res.error) setError(res.error);
        return;
      }

      if (mode === "forgot") {
        const res = await resetPassword(formData);
        if ("error" in res && res.error) setError(res.error);
        if ("success" in res && res.success) setSuccess(res.success);
      }
    });
  };

  const showNameAndPhone = mode === "signup" && step === "details";
  const showEmailInput = step === "details" && !(mode === "login" && loginMethod === "phoneOtp");
  const showCodeInput = step === "code";
  const isPhoneValue = (value: string) => /^[+]?\d[\d\s()\-]{6,}$/.test(value.trim());

  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-[480px] bg-white border border-border px-8 py-8 shadow-sm rounded-none">

        {mode !== "forgot" && (
          <div className="flex w-full rounded-none border border-border p-1 mb-8">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`h-11 flex-1 text-sm font-semibold tracking-widest transition-colors ${
                mode === "login" ? "bg-[#2d2520] text-white" : "text-ink hover:bg-[#f5eee4]"
              }`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`h-11 flex-1 text-sm font-semibold tracking-widest transition-colors ${
                mode === "signup" ? "bg-[#2d2520] text-white" : "text-ink hover:bg-[#f5eee4]"
              }`}
            >
              REGISTER
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-ink mb-2">
            {mode === "login" && "Welcome Back"}
            {mode === "signup" && "Create Account"}
            {mode === "forgot" && "Reset Password"}
          </h1>
          <p className="text-sm text-muted">
            {step === "code"
              ? isPhoneValue(email)
                ? "Enter the code sent to your phone"
                : "Enter the 6-digit code sent to your email"
              : mode === "login"
                ? "Enter your email address or phone number to receive a login code"
                : "Enter your email address or phone number to receive a verification code"}
            {step === "details" && mode === "signup" && "Join Khadeeja Empire and shop your favorites"}
            {mode === "forgot" && "Enter your email address to receive a password reset link."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mb-3">

          {/* Full Name (Signup only) */}
          {showNameAndPhone && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-5 w-5 stroke-[1.5]" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full h-12 pl-12 pr-4 bg-white border border-border rounded-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-ink placeholder:text-muted/60"
                  required
                />
              </div>
            </div>
          )}

          {/* Email (details step, all modes) */}
          {showEmailInput && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">Phone Number/Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-5 w-5 stroke-[1.5]" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email or phone number"
                  className="w-full h-12 pl-12 pr-4 bg-white border border-border rounded-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-ink placeholder:text-muted/60"
                  required
                />
              </div>
            </div>
          )}

          {/* Code sent notice */}
          {showCodeInput && (
            <p className="text-sm text-muted">
              Code sent to <span className="font-semibold text-ink">{email}</span>
            </p>
          )}

          {/* Verification code (signup or login-otp, code step) */}
          {showCodeInput && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code"
                className="w-full h-12 px-4 text-center text-lg tracking-[0.4em] bg-white border border-border rounded-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-ink placeholder:text-muted/60"
                required
              />
              <div className="flex items-center justify-between pt-1 text-sm">
                <button type="button" onClick={handleBackToDetails} className="text-[#a46e38] hover:underline">
                  {mode === "signup" ? "Edit details" : "Change email"}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isPending}
                  className="text-[#a46e38] hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </div>
          )}

          {/* OTP delivery notice */}
          {mode === "login" && step === "details" && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-muted">
                {isPhoneValue(email) ? "We will text you a verification code." : "We will email you a verification code."}
              </span>
            </div>
          )}
          {/* Submit Button */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {success && <p className="text-green-500 text-sm text-center">{success}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-[#2d2520] hover:bg-primary text-white font-semibold tracking-widest text-sm rounded-none transition-colors mt-1 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Please wait..." : (
              <>
                {mode === "login" && step === "details" && "SEND LOGIN OTP"}
                {mode === "login" && step === "code" && "VERIFY & LOGIN"}
                {mode === "signup" && step === "details" && "SEND CODE"}
                {mode === "signup" && step === "code" && "VERIFY & CREATE ACCOUNT"}
                {mode === "forgot" && "SEND RESET LINK"}
              </>
            )}
          </button>

        </form>
        <div id="firebase-recaptcha" />

      </section>
    </main>
  );
}
