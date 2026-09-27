"use client";

import { useState, useTransition } from "react";
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import {
  login,
  requestSignupOtp,
  verifySignupOtp,
  requestLoginOtp,
  verifyLoginOtp,
  resetPassword,
} from "./actions";

type AuthMode = "login" | "signup" | "forgot";
type LoginMethod = "password" | "otp";
type Step = "details" | "code";

export function CustomerLoginForm({ next, initialSuccess }: { next: string; initialSuccess?: string }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [step, setStep] = useState<Step>("details");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(initialSuccess ?? null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setLoginMethod("password");
    setStep("details");
    setCode("");
    setChallengeId(null);
    setError(null);
    setSuccess(null);
  };

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === "password" ? "otp" : "password");
    setStep("details");
    setCode("");
    setChallengeId(null);
    setError(null);
    setSuccess(null);
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
      if (mode === "signup") {
        formData.append("password", password);
        formData.append("fullName", fullName);
        formData.append("phone", phone);
        const res = await requestSignupOtp(formData);
        if (!res.ok) {
          setError(res.error);
        } else {
          setChallengeId(res.challengeId);
          setSuccess("A new code has been sent.");
        }
      } else if (mode === "login" && loginMethod === "otp") {
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
    if (password) formData.append("password", password);
    if (fullName) formData.append("fullName", fullName);
    if (phone) formData.append("phone", phone);
    if (next) formData.append("next", next);
    if (step === "code") {
      formData.append("code", code);
      formData.append("challengeId", challengeId || "");
    }

    startTransition(async () => {
      if (mode === "login" && loginMethod === "password") {
        const res = await login(formData);
        if (res && "error" in res && res.error) setError(res.error);
        return;
      }

      if (mode === "login" && loginMethod === "otp") {
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
  const showEmailInput = step === "details";
  const showPasswordField =
    mode !== "forgot" && step === "details" && !(mode === "login" && loginMethod === "otp");
  const showCodeInput = step === "code";

  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-[480px] bg-white border border-border px-8 py-8 shadow-sm rounded-none">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-ink mb-2">
            {mode === "login" && "Welcome Back"}
            {mode === "signup" && "Create Account"}
            {mode === "forgot" && "Reset Password"}
          </h1>
          <p className="text-sm text-muted">
            {step === "code"
              ? "Enter the 6-digit code we emailed you"
              : mode === "login" && loginMethod === "otp"
                ? "Enter your email to receive a login code"
                : mode === "login" && "Login to continue to your account"}
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

          {/* Phone Number (Signup only) */}
          {showNameAndPhone && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-5 w-5 stroke-[1.5]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full h-12 pl-12 pr-4 bg-white border border-border rounded-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-ink placeholder:text-muted/60"
                  required
                />
              </div>
            </div>
          )}

          {/* Email (details step, all modes) */}
          {showEmailInput && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-5 w-5 stroke-[1.5]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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

          {/* Password (Login-password & Signup-details only) */}
          {showPasswordField && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-5 w-5 stroke-[1.5]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                  className="w-full h-12 pl-12 pr-12 bg-white border border-border rounded-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-ink placeholder:text-muted/60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 stroke-[1.5]" /> : <Eye className="h-5 w-5 stroke-[1.5]" />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-xs text-muted flex items-center gap-1.5 mt-2">
                  <span className="text-[#a46e38] border border-[#a46e38] rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold">✓</span>
                  Password must be at least 6 characters
                </p>
              )}
            </div>
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

          {/* Forgot Password / Remember me / OTP toggle (Login only, details step) */}
          {mode === "login" && step === "details" && (
            <div className="flex items-center justify-between pt-1">
              {loginMethod === "password" ? (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded-none border-border text-primary focus:ring-primary" />
                    <span className="text-sm text-ink">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-sm text-[#a46e38] hover:underline"
                  >
                    Forgot password?
                  </button>
                </>
              ) : (
                <span className="text-sm text-muted">We will email you a 6-digit code.</span>
              )}
            </div>
          )}
          {mode === "login" && step === "details" && (
            <button
              type="button"
              onClick={toggleLoginMethod}
              className="text-sm text-[#a46e38] hover:underline"
            >
              {loginMethod === "password" ? "Login with OTP instead" : "Use password instead"}
            </button>
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
                {mode === "login" && loginMethod === "password" && "LOGIN"}
                {mode === "login" && loginMethod === "otp" && step === "details" && "SEND CODE"}
                {mode === "login" && loginMethod === "otp" && step === "code" && "VERIFY & LOGIN"}
                {mode === "signup" && step === "details" && "SEND CODE"}
                {mode === "signup" && step === "code" && "VERIFY & CREATE ACCOUNT"}
                {mode === "forgot" && "SEND RESET LINK"}
              </>
            )}
          </button>

        </form>

        {/* Footer Toggle */}
        <p className="text-center text-sm text-ink mt-8">
          {mode === "login" && "Don't have an account? "}
          {mode === "signup" && "Already have an account? "}
          {mode === "forgot" && "Remembered your password? "}

          <button
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="text-[#a46e38] font-semibold hover:underline"
          >
            {mode === "login" ? "Sign up" : "Login"}
          </button>
        </p>

      </section>
    </main>
  );
}
