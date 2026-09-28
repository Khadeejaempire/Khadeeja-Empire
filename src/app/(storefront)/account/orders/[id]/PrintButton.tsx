"use client";

import { Printer } from "lucide-react";

export function PrintButton({ orderNumber }: { orderNumber: string }) {
  const handlePrint = () => {
    // The browser's "Save as PDF" filename comes from document.title at the
    // moment print() opens, so swap it in first and restore it only once
    // printing has actually finished (afterprint), not on a fixed timeout.
    const originalTitle = document.title;
    document.title = `Khadeeja Empire Receipt - ${orderNumber}`;
    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    setTimeout(() => window.print(), 50);
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--color-border-strong)] px-5 text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:border-[var(--color-maroon)] hover:text-[var(--color-maroon)]"
    >
      <Printer size={14} />
      Print Receipt
    </button>
  );
}
