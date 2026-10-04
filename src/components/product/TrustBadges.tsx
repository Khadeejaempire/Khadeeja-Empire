import { Trophy, Store, Lock, Truck, ShieldCheck, CreditCard } from "lucide-react";

export function TrustBadges() {
  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* 100% Safe, Secure & Guaranteed Checkout Box */}
      <div className="rounded-lg border border-border/80 bg-surface/50 p-4 sm:p-5 text-center shadow-xs">
        <h4 className="font-display text-xs sm:text-sm md:text-base font-semibold text-ink tracking-wide">
          100% Safe, Secure and Guaranteed Checkout
        </h4>

        {/* 3 Core Trust Badges */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
          {/* Badge 1: 100% Quality Guarantee */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-surface-elevated border border-border/70 shadow-2xs">
              <Trophy size={18} strokeWidth={1.25} style={{ color: "var(--color-maroon)" }} />
            </div>
            <span className="text-[10px] sm:text-xs font-medium leading-tight text-ink">
              100% Quality<br className="hidden sm:inline" /> Guarantee
            </span>
          </div>

          {/* Badge 2: Authorized Dealer */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-surface-elevated border border-border/70 shadow-2xs">
              <Store size={18} strokeWidth={1.25} style={{ color: "var(--color-maroon)" }} />
            </div>
            <span className="text-[10px] sm:text-xs font-medium leading-tight text-ink">
              Authorized<br className="hidden sm:inline" /> Dealer
            </span>
          </div>

          {/* Badge 3: SSL Secure */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-surface-elevated border border-border/70 shadow-2xs">
              <Lock size={18} strokeWidth={1.25} style={{ color: "var(--color-maroon)" }} />
            </div>
            <span className="text-[10px] sm:text-xs font-medium leading-tight text-ink">
              SSL<br className="hidden sm:inline" /> Secure
            </span>
          </div>
        </div>

        {/* Variation A: Popular Indian UPI Apps (PhonePe, GPay, Paytm) + Cards */}
        <div className="mt-5 pt-4 border-t border-border/70">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {/* 1. PhonePe Badge */}
            <div
              title="PhonePe UPI"
              className="flex h-7.5 sm:h-8 items-center gap-1.5 rounded border border-border/80 bg-white px-2.5 shadow-2xs"
            >
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#5f259f] text-[10px] font-black text-white">
                पे
              </span>
              <span className="text-[11px] font-bold tracking-tight text-[#5f259f]">PhonePe</span>
            </div>

            {/* 2. Google Pay (GPay) Badge */}
            <div
              title="Google Pay"
              className="flex h-7.5 sm:h-8 items-center gap-1.5 rounded border border-border/80 bg-white px-2.5 shadow-2xs"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-[11px] font-bold tracking-tight text-gray-700">GPay</span>
            </div>

            {/* 3. Paytm Badge */}
            <div
              title="Paytm UPI"
              className="flex h-7.5 sm:h-8 items-center gap-0.5 rounded border border-border/80 bg-white px-2.5 shadow-2xs"
            >
              <span className="text-[12px] font-black tracking-tight text-[#002970]">Pay</span>
              <span className="text-[12px] font-black tracking-tight text-[#00BAF2]">tm</span>
            </div>

            {/* 4. Cards Badge */}
            <div
              title="All Credit & Debit Cards Supported"
              className="flex h-7.5 sm:h-8 items-center gap-1 rounded border border-border/80 bg-white px-2.5 shadow-2xs"
            >
              <CreditCard size={14} style={{ color: "var(--color-maroon)" }} />
              <span className="text-[11px] font-semibold tracking-tight text-gray-800">All Cards</span>
            </div>
          </div>

          {/* Footnote */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-muted">
            <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
            <span>✓ All UPI Apps & Major Cards Accepted • 100% Safe Payment</span>
          </div>
        </div>
      </div>

      {/* Delivery Time Box */}
      <div className="rounded-lg border border-border/80 bg-surface/50 p-3 sm:p-4 text-xs shadow-xs">
        <div className="flex items-center gap-2 font-semibold text-ink uppercase tracking-wider text-[11px]">
          <Truck size={14} style={{ color: "var(--color-maroon)" }} />
          <span>Delivery Time</span>
        </div>
        <ul className="mt-2 space-y-1 pl-4 text-muted leading-relaxed list-disc text-[11px] sm:text-xs">
          <li>
            <strong className="text-ink font-medium">India :</strong> 5–7 business days
          </li>
          <li>
            <strong className="text-ink font-medium">International :</strong> 10–15 business days
          </li>
        </ul>
      </div>
    </div>
  );
}
