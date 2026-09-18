import type { ReactNode } from "react";
import { Lock, Store, Trophy } from "lucide-react";

const GUARANTEES = [
  { icon: Trophy, label: "100% Quality Guarantee" },
  { icon: Store, label: "Authorized Dealer" },
  { icon: Lock, label: "SSL Secure" },
];

const PAYMENT_MARKS: Array<{ name: string; node: ReactNode }> = [
  {
    name: "American Express",
    node: (
      <span className="flex h-full w-full items-center justify-center bg-[#006FCF] text-[9px] font-black tracking-tight text-white">
        AMEX
      </span>
    ),
  },
  {
    name: "Apple Pay",
    node: (
      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-black">
        <svg viewBox="0 0 384 512" className="h-3 w-3 fill-current" aria-hidden="true">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
        </svg>
        Pay
      </span>
    ),
  },
  {
    name: "Diners Club",
    node: (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0079BE]">
        <span className="h-4 w-1 bg-white/90" />
      </span>
    ),
  },
  {
    name: "Discover",
    node: (
      <span className="text-[8px] font-bold tracking-tight text-black">
        DISC<span className="text-[#F76B1C]">O</span>VER
      </span>
    ),
  },
  {
    name: "JCB",
    node: (
      <span className="flex items-center gap-px">
        <span className="flex h-4 w-2.5 items-center justify-center rounded-[1px] bg-[#0E4C96] text-[7px] font-bold text-white">J</span>
        <span className="flex h-4 w-2.5 items-center justify-center rounded-[1px] bg-[#EF4123] text-[7px] font-bold text-white">C</span>
        <span className="flex h-4 w-2.5 items-center justify-center rounded-[1px] bg-[#00A651] text-[7px] font-bold text-white">B</span>
      </span>
    ),
  },
  {
    name: "Mastercard",
    node: (
      <span className="flex items-center">
        <span className="h-4 w-4 rounded-full bg-[#EB001B]" />
        <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#F79E1B] mix-blend-multiply" />
      </span>
    ),
  },
  {
    name: "PayPal",
    node: (
      <span className="text-[10px] font-bold italic">
        <span className="text-[#003087]">Pay</span>
        <span className="text-[#009CDE]">Pal</span>
      </span>
    ),
  },
  {
    name: "Visa",
    node: (
      <span className="text-[11px] font-black italic tracking-tighter text-[#1A1F71]">VISA</span>
    ),
  },
];

export function TrustBadges() {
  return (
    <div className="flex h-full flex-col justify-center rounded-lg border border-border bg-surface-elevated p-5 shadow-sm sm:p-6">
      <h4 className="text-center font-display text-lg text-ink">
        100% Safe, Secure and Guaranteed Checkout
      </h4>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {GUARANTEES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 text-center">
            <Icon size={26} strokeWidth={1.25} style={{ color: "var(--color-maroon)" }} />
            <span className="text-[0.75rem] leading-snug text-ink">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {PAYMENT_MARKS.map(({ name, node }) => (
          <span
            key={name}
            title={name}
            className="flex h-7 w-11 items-center justify-center overflow-hidden rounded border border-border bg-white"
          >
            {node}
          </span>
        ))}
      </div>
    </div>
  );
}
