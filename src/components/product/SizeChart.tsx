"use client";

import { Ruler, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SizeChartMeasurements, SizeChartSize } from "@/lib/admin/types";

interface SizeChartProps {
  measurements?: SizeChartMeasurements | null;
  modalOnly?: boolean;
}

export const DEFAULT_SIZE_CHART_MEASUREMENTS: SizeChartMeasurements = {
  enabled: true,
  unit: "cm",
  sizes: [
    { size: "XXS", chest: "30-32", waist: "24-26", hip: "32-34" },
    { size: "XS", chest: "32-34", waist: "26-28", hip: "34-36" },
    { size: "S", chest: "34-36", waist: "28-30", hip: "36-38" },
    { size: "M", chest: "36-38", waist: "30-32", hip: "38-40" },
    { size: "L", chest: "38-40", waist: "32-34", hip: "40-42" },
    { size: "XL", chest: "40-42", waist: "34-36", hip: "42-44" },
  ],
};

type Unit = "cm" | "inches";

const STANDARD_SIZES = ["XXS", "XS", "S", "M", "L", "XL"];
const SUMMARY_MEASUREMENTS: Array<{ key: keyof SizeChartSize; label: string }> = [
  { key: "chest", label: "Chest" },
  { key: "waist", label: "High Waist" },
  { key: "hip", label: "Hip" },
];

function convertedValue(value: string | null | undefined, fromUnit: Unit, toUnit: Unit) {
  if (!value) return "—";
  if (fromUnit === toUnit) return value;

  const conversion = fromUnit === "cm" ? (number: number) => number / 2.54 : (number: number) => number * 2.54;
  return value.replace(/\d+(?:\.\d+)?/g, (match) => {
    const converted = conversion(Number(match));
    return Number.isInteger(converted) ? String(converted) : converted.toFixed(1).replace(/\.0$/, "");
  });
}

export function SizeChart({ measurements, modalOnly }: SizeChartProps) {
  const activeMeasurements = measurements;
  const sourceUnit: Unit = activeMeasurements?.unit === "inches" ? "inches" : "cm";
  const sizes = useMemo(() => activeMeasurements?.sizes ?? [], [activeMeasurements?.sizes]);
  const initialSize = STANDARD_SIZES.find((size) => sizes.some((entry) => entry.size.toUpperCase() === size)) ?? sizes[0]?.size ?? "XXS";
  const [unit, setUnit] = useState<Unit>(sourceUnit);
  const [selectedSize, setSelectedSize] = useState(initialSize.toUpperCase());
  const [guideOpen, setGuideOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const guideTriggerRef = useRef<HTMLButtonElement>(null);

  const selectedMeasurements = sizes.find((size) => size.size.toUpperCase() === selectedSize);
  const displayUnit = unit === "inches" ? "Inch" : "CM";

  useEffect(() => {
    if (!guideOpen) return;
    const previousOverflow = document.body.style.overflow;
    const guideTrigger = guideTriggerRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setGuideOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      guideTrigger?.focus();
    };
  }, [guideOpen]);

  useEffect(() => {
    const handleOpen = () => setGuideOpen(true);
    window.addEventListener("open-size-guide", handleOpen);
    return () => window.removeEventListener("open-size-guide", handleOpen);
  }, []);

  if (!activeMeasurements?.enabled || sizes.length === 0) return null;

  if (modalOnly) {
    return (
      <>
        {guideOpen ? (
          <div
            className="fixed inset-0 z-[var(--z-dialog)] grid place-items-center bg-ink/50 p-4 backdrop-blur-[2px]"
            onMouseDown={(event) => event.target === event.currentTarget && setGuideOpen(false)}
          >
            <div role="dialog" aria-modal="true" aria-labelledby="size-guide-title" className="relative w-full max-w-md rounded-2xl bg-surface-elevated p-6 shadow-2xl sm:p-8">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setGuideOpen(false)}
                className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                aria-label="Close size guide"
              >
                <X aria-hidden="true" size={20} />
              </button>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">Measuring guide</p>
              <h2 id="size-guide-title" className="mt-2 pr-10 font-display text-3xl text-ink">How to measure</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">Use a soft tape measure over light clothing. Keep it level and comfortably snug, without pulling tight.</p>
              <dl className="mt-6 space-y-4 border-t border-border pt-5">
                <div><dt className="font-semibold text-ink">Chest</dt><dd className="mt-1 text-sm leading-relaxed text-muted">Measure around the fullest part of your bust, keeping the tape straight across your back.</dd></div>
                <div><dt className="font-semibold text-ink">High waist</dt><dd className="mt-1 text-sm leading-relaxed text-muted">Measure around your natural waistline—the narrowest point above your navel.</dd></div>
                <div><dt className="font-semibold text-ink">Hip</dt><dd className="mt-1 text-sm leading-relaxed text-muted">Stand with your feet together and measure around the fullest part of your hips.</dd></div>
              </dl>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <section className="mt-8 border-t border-border pt-8" aria-labelledby="size-chart-heading">
      <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-[0_12px_35px_rgba(45,37,32,0.06)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">Find your fit</p>
            <h2 id="size-chart-heading" className="mt-1 font-display text-2xl text-ink">Size reference</h2>
          </div>
          <div className="inline-flex rounded-full border border-border bg-bg p-1" aria-label="Measurement unit">
            {(["cm", "inches"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setUnit(option)}
                className={`min-h-9 rounded-full px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                  unit === option ? "bg-ink text-white shadow-sm" : "text-muted hover:text-ink"
                }`}
                aria-pressed={unit === option}
              >
                {option === "cm" ? "CM" : "Inches"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2" aria-label="Preview measurements by size">
          {STANDARD_SIZES.map((size) => {
            const available = sizes.some((entry) => entry.size.toUpperCase() === size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => available && setSelectedSize(size)}
                disabled={!available}
                className={`min-h-10 min-w-12 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                  selectedSize === size
                    ? "border-ink bg-ink text-white"
                    : "border-border-strong bg-transparent text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-35"
                }`}
                aria-pressed={selectedSize === size}
              >
                {size}
              </button>
            );
          })}
        </div>

        <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {SUMMARY_MEASUREMENTS.map(({ key, label }) => (
            <div key={key} className="bg-surface px-4 py-3.5">
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-muted">{label}</dt>
              <dd className="mt-1 font-display text-lg text-ink">
                {convertedValue(selectedMeasurements?.[key], sourceUnit, unit)} {selectedMeasurements?.[key] ? displayUnit : ""}
              </dd>
            </div>
          ))}
        </dl>

        <button
          ref={guideTriggerRef}
          type="button"
          onClick={() => setGuideOpen(true)}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-ink px-5 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <Ruler aria-hidden="true" size={17} strokeWidth={1.6} />
          What is my size?
        </button>
      </div>

      {guideOpen ? (
        <div
          className="fixed inset-0 z-[var(--z-dialog)] grid place-items-center bg-ink/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => event.target === event.currentTarget && setGuideOpen(false)}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="size-guide-title" className="relative w-full max-w-md rounded-2xl bg-surface-elevated p-6 shadow-2xl sm:p-8">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setGuideOpen(false)}
              className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              aria-label="Close size guide"
            >
              <X aria-hidden="true" size={20} />
            </button>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">Measuring guide</p>
            <h2 id="size-guide-title" className="mt-2 pr-10 font-display text-3xl text-ink">How to measure</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">Use a soft tape measure over light clothing. Keep it level and comfortably snug, without pulling tight.</p>
            <dl className="mt-6 space-y-4 border-t border-border pt-5">
              <div><dt className="font-semibold text-ink">Chest</dt><dd className="mt-1 text-sm leading-relaxed text-muted">Measure around the fullest part of your bust, keeping the tape straight across your back.</dd></div>
              <div><dt className="font-semibold text-ink">High waist</dt><dd className="mt-1 text-sm leading-relaxed text-muted">Measure around your natural waistline—the narrowest point above your navel.</dd></div>
              <div><dt className="font-semibold text-ink">Hip</dt><dd className="mt-1 text-sm leading-relaxed text-muted">Stand with your feet together and measure around the fullest part of your hips.</dd></div>
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  );
}
