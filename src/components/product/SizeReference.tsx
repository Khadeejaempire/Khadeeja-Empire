"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SizeChartMeasurements, SizeChartSize } from "@/lib/admin/types";

interface SizeReferenceProps {
  measurements?: SizeChartMeasurements | null;
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

export function SizeReference({ measurements }: SizeReferenceProps) {
  const activeMeasurements = measurements ?? DEFAULT_SIZE_CHART_MEASUREMENTS;
  const sourceUnit: Unit = activeMeasurements.unit === "inches" ? "inches" : "cm";
  const sizes = useMemo(() => activeMeasurements.sizes ?? [], [activeMeasurements.sizes]);
  const initialSize = STANDARD_SIZES.find((size) => sizes.some((entry) => entry.size.toUpperCase() === size)) ?? sizes[0]?.size ?? "XXS";
  const [unit, setUnit] = useState<Unit>(sourceUnit);
  const [selectedSize, setSelectedSize] = useState(initialSize.toUpperCase());
  const [showScrollHint, setShowScrollHint] = useState(true);

  const selectedMeasurements = sizes.find((size) => size.size.toUpperCase() === selectedSize);
  const displayUnit = unit === "inches" ? "Inch" : "CM";

  if (!activeMeasurements.enabled || sizes.length === 0) return null;

  const handleScrollHint = () => {
    setShowScrollHint(false);
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface-elevated p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-maroon)" }}>
            Find your fit
          </p>
          <h3 className="mt-1 font-display text-xl text-ink">Size Reference</h3>
        </div>
        <div className="inline-flex rounded-full border border-border bg-bg p-0.5" aria-label="Measurement unit">
          {(["cm", "inches"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setUnit(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                unit === option
                  ? "text-white shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
              style={unit === option ? { backgroundColor: "var(--color-maroon)" } : {}}
              aria-pressed={unit === option}
            >
              {option === "cm" ? "CM" : "INCHES"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Preview measurements by size">
        {STANDARD_SIZES.map((size) => {
          const available = sizes.some((entry) => entry.size.toUpperCase() === size);
          return (
            <button
              key={size}
              type="button"
              onClick={() => available && setSelectedSize(size)}
              disabled={!available}
              className={`min-w-10 h-9 rounded-full border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                selectedSize === size
                  ? "text-white"
                  : "border-border bg-transparent text-ink hover:border-[var(--color-maroon)] disabled:cursor-not-allowed disabled:opacity-35"
              }`}
              style={
                selectedSize === size
                  ? { backgroundColor: "var(--color-maroon)", borderColor: "var(--color-maroon)" }
                  : {}
              }
              aria-pressed={selectedSize === size}
            >
              {size}
            </button>
          );
        })}
      </div>

      <dl className="mt-5 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
        {SUMMARY_MEASUREMENTS.map(({ key, label }) => (
          <div key={key} className="bg-surface-elevated p-3">
            <dt className="text-[0.6rem] font-semibold uppercase tracking-wide text-muted">
              {label}
            </dt>
            <dd className="mt-0.5 font-display text-base text-ink">
              {convertedValue(selectedMeasurements?.[key], sourceUnit, unit)}
              {selectedMeasurements?.[key] ? ` ${displayUnit}` : ""}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-size-guide"))}
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
          style={{ color: "var(--color-maroon)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" />
          </svg>
          What is my size?
        </button>
        {showScrollHint && (
          <button
            type="button"
            onClick={handleScrollHint}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition hover:text-ink md:hidden"
            aria-label="Scroll thumbnails"
          >
            <ChevronDown size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
