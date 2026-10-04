"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, Clock } from "lucide-react";

interface ProductDescriptionProps {
  description: string;
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  // Parse structured sections if formatted with labels like Technique, Fabric, etc., or standard text
  const isHandloomStyle =
    description.includes("Technique") ||
    description.includes("Fabric") ||
    description.includes("Speciality") ||
    description.length > 200;

  return (
    <div className="space-y-4">
      {/* Poetic quote / introductory hook if long */}
      <div className="rounded-r-md border-l-2 border-[var(--color-maroon)] bg-surface/60 p-3.5 italic text-xs leading-relaxed text-ink/80">
        &quot;Like all magnificent heritage creations, this handloom saree weaves timeless grace, intricate Banarasi artistry, and refined royal elegance.&quot;
      </div>

      <div className="text-sm leading-relaxed text-ink/90 whitespace-pre-line space-y-2">
        <p className={expanded ? "" : "line-clamp-4"}>
          {description}
        </p>

        {description.length > 180 && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-semibold uppercase tracking-wider text-[var(--color-maroon)] hover:underline focus:outline-none"
          >
            {expanded ? "Read Less ↑" : "Read Full Story ↓"}
          </button>
        )}
      </div>

      {/* Handloom Promise Pill */}
      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted">
        <div className="inline-flex items-center gap-1.5 font-medium text-ink">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span>Includes Unstitched Blouse Piece</span>
        </div>
        <span>•</span>
        <div className="inline-flex items-center gap-1.5 font-medium text-ink">
          <Clock size={14} style={{ color: "var(--color-maroon)" }} />
          <span>Dispatches in 5–7 Days</span>
        </div>
      </div>
    </div>
  );
}
