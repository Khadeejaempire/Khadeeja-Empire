"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyTextButton({
  value,
  className = "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:bg-stone-50 hover:text-stone-700",
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ponytail: clipboard needs a secure context; if it is unavailable there is nothing useful to show.
    }
  };

  return (
    <button type="button" onClick={handleCopy} aria-label="Copy" className={className}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
