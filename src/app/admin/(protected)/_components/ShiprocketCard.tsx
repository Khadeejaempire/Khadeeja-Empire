"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminActionMessage } from "@/lib/admin/errors";

type PushAction = (formData: FormData) => Promise<void>;

const DIMENSION_FIELDS = [
  { name: "weight", label: "Weight (kg)" },
  { name: "length", label: "Length (cm)" },
  { name: "breadth", label: "Breadth (cm)" },
  { name: "height", label: "Height (cm)" },
] as const;

export function ShiprocketCard({ id, action }: { id: string; action: PushAction }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dimensions, setDimensions] = useState<Record<string, string>>({});

  const handleShip = () => {
    if (!confirm("Create this order in Shiprocket? Only do this once per order.")) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        for (const field of DIMENSION_FIELDS) {
          const value = dimensions[field.name]?.trim();
          if (value) formData.set(field.name, value);
        }
        await action(formData);
        toast.success("Order pushed to Shiprocket.");
        router.refresh();
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not push to Shiprocket. Reload and check before retrying."));
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {DIMENSION_FIELDS.map((field) => (
          <label key={field.name} className="space-y-1">
            <span className="block text-xs font-semibold text-stone-600">{field.label}</span>
            <input
              type="number"
              name={field.name}
              value={dimensions[field.name] ?? ""}
              onChange={(event) =>
                setDimensions((current) => ({ ...current, [field.name]: event.target.value }))
              }
              placeholder="Auto"
              inputMode="decimal"
              min="0"
              step="0.1"
              className="min-h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm"
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-stone-500">
        Actual packed parcel dimensions give more accurate courier rates — leave any field blank to auto-estimate it.
      </p>
      <button
        type="button"
        onClick={handleShip}
        disabled={isPending}
        className="min-h-10 w-full rounded-lg bg-stone-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Shipping…" : "Ship via Shiprocket"}
      </button>
    </div>
  );
}
