"use client";

import { useState } from "react";
import { MapPin, CheckCircle2, Truck, ShieldCheck } from "lucide-react";

interface PincodeEstimatorProps {
  dispatchDays?: number;
}

export function PincodeEstimator({ dispatchDays = 7 }: PincodeEstimatorProps) {
  const [pincode, setPincode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincode.trim();

    if (!/^\d{6}$/.test(cleanPin)) {
      setStatus("error");
      setErrorMessage("Please enter a valid 6-digit Indian PIN code");
      return;
    }

    setStatus("checking");

    // Simulate instant delivery calculation based on dispatch days
    setTimeout(() => {
      const now = new Date();
      const totalDays = dispatchDays + 3; // dispatch + transit
      const estDate = new Date(now.getTime() + totalDays * 24 * 60 * 60 * 1000);

      const formattedDate = estDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      setDeliveryDate(formattedDate);
      setStatus("success");
      setErrorMessage("");
    }, 350);
  };

  return (
    <div className="rounded-lg border border-border/80 bg-surface/40 p-4 transition-all">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
        <MapPin size={15} style={{ color: "var(--color-maroon)" }} />
        <span>Check Delivery & COD Availability</span>
      </div>

      <form onSubmit={handleCheck} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, ""));
              if (status !== "idle") setStatus("idle");
            }}
            placeholder="Enter 6-digit PIN code"
            className="w-full rounded border border-border bg-surface-elevated px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-[var(--color-maroon)] focus:outline-none focus:ring-1 focus:ring-[var(--color-maroon)]"
          />
        </div>
        <button
          type="submit"
          disabled={status === "checking" || !pincode}
          className="rounded px-4 py-2 text-xs font-semibold tracking-wide uppercase text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--color-maroon)" }}
        >
          {status === "checking" ? "Checking..." : "Check"}
        </button>
      </form>

      {status === "error" && (
        <p className="mt-2 text-xs text-red-600">{errorMessage}</p>
      )}

      {status === "success" && (
        <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>Expected Delivery by <strong className="text-ink">{deliveryDate}</strong></span>
          </div>
          <div className="flex items-center gap-3 text-muted">
            <span className="flex items-center gap-1">
              <Truck size={13} style={{ color: "var(--color-maroon)" }} /> Free Standard Shipping
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" /> Cash on Delivery Available
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
