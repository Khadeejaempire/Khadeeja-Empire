"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { updatePassword } from "./actions";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const formData = new FormData();
    formData.append("password", password);
    formData.append("confirm", confirm);

    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {(["password", "confirm"] as const).map((name) => (
        <div key={name} className="space-y-2">
          <label className="block text-sm font-semibold text-ink">
            {name === "password" ? "New Password" : "Confirm Password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted stroke-[1.5]" />
            <input
              type={showPassword ? "text" : "password"}
              value={name === "password" ? password : confirm}
              onChange={(event) =>
                name === "password"
                  ? setPassword(event.target.value)
                  : setConfirm(event.target.value)
              }
              placeholder={name === "password" ? "Create a password" : "Re-enter password"}
              className="h-12 w-full rounded-none border border-border bg-white pl-12 pr-12 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
            {name === "password" && (
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-5 w-5 stroke-[1.5]" /> : <Eye className="h-5 w-5 stroke-[1.5]" />}
              </button>
            )}
          </div>
        </div>
      ))}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 h-12 w-full rounded-none bg-[#2d2520] text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Please wait..." : "Update password"}
      </button>
    </form>
  );
}
