"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Sparkles, X } from "lucide-react";
import type { PromoSettingsRecord } from "@/lib/admin/types";

export function PromoPopup({ promo }: { promo: PromoSettingsRecord | null }) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    if (!promo) return;
    const storage = promo.frequency === "once" ? window.localStorage : window.sessionStorage;
    if (promo.frequency !== "always") storage.setItem(`ke-promo-dismissed-${promo.id}`, "1");
    setOpen(false);
  }, [promo]);

  const handleCopyCode = (code: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
  };

  useEffect(() => {
    if (!promo?.enabled) return;
    const dismissalKey = `ke-promo-dismissed-${promo.id}`;
    const viewKey = `ke-promo-views-${promo.id}`;
    const storage = promo.frequency === "once" ? window.localStorage : window.sessionStorage;
    const dismissed = promo.frequency !== "always" && storage.getItem(dismissalKey) === "1";
    const views = Number(window.localStorage.getItem(viewKey) ?? "0");
    if (dismissed || (promo.maxViews != null && views >= promo.maxViews)) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      window.localStorage.setItem(viewKey, String(views + 1));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [promo]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        last.focus();
      }
    };
    document.addEventListener("keydown", handleKeyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyboard);
      previousFocus?.focus();
    };
  }, [close, open]);

  if (!promo?.enabled || !open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-4 backdrop-blur-sm transition-all"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex flex-col sm:flex-row w-full sm:w-auto max-w-md sm:max-w-3xl max-h-[90vh] overflow-y-auto sm:overflow-hidden rounded-2xl border-2 border-amber-600/30 ring-1 ring-amber-600/15 bg-[#FAF7F2] shadow-[0_25px_80px_rgba(30,15,10,0.4)] animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Left Visual Area - Ambient backdrop + uncropped image */}
        {promo.image ? (
          <div className="relative shrink-0 flex items-center justify-center bg-[#150e0c] overflow-hidden sm:w-[320px] md:w-[360px] min-h-[220px]">
            {/* Ambient Blurred Background Glow */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-md scale-110 -z-0"
              style={{ backgroundImage: `url(${promo.image})` }}
              aria-hidden="true"
            />
            {/* Uncropped crisp image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={promo.image}
              alt={promo.title || "Promotional collection"}
              className="relative z-10 h-full w-full max-h-64 sm:max-h-[480px] object-contain block"
            />
            {/* Subtle soft edge gradient blending into the card */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/25" />
          </div>
        ) : (
          <div className="hidden bg-gradient-to-b from-amber-600 to-[#7a1f1f] sm:block sm:w-3" aria-hidden="true" />
        )}

        {/* Right Content Area */}
        {/* Right Content Area */}
        <div className="relative flex flex-col justify-center p-6 sm:p-8 md:p-9 max-w-md bg-[#FAF7F2] min-h-[380px] sm:min-h-[460px]">
          {/* Top Festive Badge */}
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 bg-amber-500/10 px-3 py-0.5 text-[11px] font-semibold tracking-[0.2em] text-[#91622b] uppercase w-fit shadow-2xs">
            <Sparkles size={11} className="text-amber-600" />
            <span>Festive Celebration Offer</span>
          </div>

          {/* Heading */}
          <h2
            id={titleId}
            className="font-serif text-2xl sm:text-[1.85rem] font-semibold leading-tight tracking-normal text-[#5f1717]"
          >
            {promo.title || "Welcome to Khadeeja Empire"}
          </h2>

          {/* Delicate Festive Divider Line */}
          <div className="my-2 flex items-center gap-2" aria-hidden="true">
            <div className="h-[1.5px] w-8 bg-amber-600/50" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-amber-700 font-medium">Exclusive</span>
            <div className="h-[1.5px] w-8 bg-amber-600/50" />
          </div>

          {/* Subtitle / Body */}
          {promo.body ? (
            <p className="text-xs sm:text-[13px] leading-relaxed text-[#5c5047]">
              {promo.body}
            </p>
          ) : null}

          {/* Golden Shagun Voucher / Ticket with Perforated Notches */}
          {promo.couponCode ? (
            <div className="mt-3.5 mb-3.5 relative rounded-xl border-2 border-dashed border-amber-600/40 bg-gradient-to-r from-amber-500/10 via-amber-50/80 to-amber-500/10 p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-xs">
              {/* Left & Right Perforated Ticket Notches */}
              <span
                className="absolute -left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-[#FAF7F2] border-r-2 border-dashed border-amber-600/40"
                aria-hidden="true"
              />
              <span
                className="absolute -right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-[#FAF7F2] border-l-2 border-dashed border-amber-600/40"
                aria-hidden="true"
              />

              <div className="flex flex-col pl-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#ad8150]">
                  Coupon Code
                </span>
                <span className="font-mono text-base sm:text-lg font-bold tracking-[0.16em] text-[#5f1717]">
                  {promo.couponCode}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCode(promo.couponCode!)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                  copied
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-[#8f4338] text-white hover:bg-[#7a1f1f] hover:shadow-xs active:scale-95"
                }`}
                aria-label={copied ? "Code copied" : "Copy coupon code"}
              >
                {copied ? (
                  <>
                    <Check size={13} strokeWidth={2.5} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          ) : null}

          {/* Action Button */}
          {promo.ctaLink ? (
            <Link
              href={promo.ctaLink}
              onClick={close}
              className="group relative inline-flex min-h-11 sm:min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#8f4338] via-[#a34b3f] to-[#7f372d] px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-md shadow-[#8f4338]/25 transition-all duration-200 hover:shadow-lg hover:shadow-[#8f4338]/35 hover:brightness-105 active:scale-[0.99]"
            >
              <span>{promo.ctaLabel || "Shop Festive Collection"}</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
          ) : null}

          {/* Bottom Luxury Trust Tagline */}
          <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] font-medium tracking-wide text-[#7d6e63]">
            <span className="inline-block h-1 w-1 rounded-full bg-amber-600/70" />
            <span>Valid on all handcrafted silks & festive wear</span>
            <span className="inline-block h-1 w-1 rounded-full bg-amber-600/70" />
          </div>
        </div>

        {/* Minimal Sleek Circular Close Button (No ugly focus outline) */}
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 z-30 inline-grid h-8 w-8 place-items-center rounded-full bg-white/90 text-stone-600 shadow-sm border border-stone-200/80 backdrop-blur-xs transition-all duration-200 hover:rotate-90 hover:bg-[#8f4338] hover:text-white hover:border-[#8f4338] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
          aria-label="Close promotion"
        >
          <X size={15} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </section>
    </div>,
    document.body
  );
}
