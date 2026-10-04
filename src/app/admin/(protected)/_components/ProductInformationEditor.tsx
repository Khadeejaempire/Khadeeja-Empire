"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Sparkles, 
  Maximize2, 
  ShieldCheck, 
  Truck, 
  FileText, 
  Ruler, 
  Save, 
  Loader2,
  Info 
} from "lucide-react";
import { MeasurementsEditor } from "./MeasurementsEditor";
import { saveProductInformationAction } from "@/actions/admin/products";
import type { SizeChartMeasurements } from "@/lib/admin/types";

const textareaClass =
  "mt-2 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-xs leading-relaxed text-stone-900 placeholder-stone-400 outline-none transition focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/15 min-h-[90px] resize-y";

interface ProductInformationEditorProps {
  info: any;
  productId: string;
}

export function ProductInformationEditor({
  info,
  productId,
}: ProductInformationEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [measurements, setMeasurements] = useState<SizeChartMeasurements | null | undefined>(
    info?.measurements
  );

  useEffect(() => {
    setMeasurements(info?.measurements);
  }, [info?.measurements]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("productId", productId);
    if (measurements) {
      formData.set("measurements", JSON.stringify(measurements));
    } else {
      formData.set("measurements", "");
    }

    startTransition(async () => {
      try {
        await saveProductInformationAction(formData);
        toast.success("Specifications & sizing saved successfully");
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || "Failed to save specifications");
      }
    });
  };

  const specCards = [
    {
      name: "fabric",
      label: "Fabric & Material",
      placeholder: "e.g. Pure Handloom Kora Tissue Silk with fine gold Zari weaving...",
      icon: Sparkles,
      value: info?.fabric,
    },
    {
      name: "fit",
      label: "Fit & Silhouette",
      placeholder: "e.g. Regular straight cut with traditional drape, tailored silhouette...",
      icon: Maximize2,
      value: info?.fit,
    },
    {
      name: "care",
      label: "Care & Preservation",
      placeholder: "e.g. Strictly dry clean only. Preserve in soft muslin cloth. Do not bleach...",
      icon: ShieldCheck,
      value: info?.care,
    },
    {
      name: "shipping",
      label: "Shipping & Dispatch",
      placeholder: "e.g. Handcrafted to order. Ships in 2-4 business days. Free shipping across India...",
      icon: Truck,
      value: info?.shipping,
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <input type="hidden" name="productId" value={productId} />
      <input
        type="hidden"
        name="measurements"
        value={measurements ? JSON.stringify(measurements) : ""}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
          <Info className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-stone-900">Garment Specifications & Care</h2>
          <p className="text-xs text-stone-500">
            Displayed on storefront product tabs: fabric provenance, fit guidance, washing directions, and dispatch notes.
          </p>
        </div>
      </div>

      {/* 2x2 Grid of Spec Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {specCards.map(({ name, label, placeholder, icon: Icon, value }) => (
          <div
            key={name}
            className="rounded-2xl border border-stone-200/90 bg-stone-50/40 p-4 transition-all hover:bg-stone-50/70"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-200/60 text-[#9c5247]">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <label htmlFor={name} className="text-xs font-bold uppercase tracking-wider text-stone-700 cursor-pointer">
                {label}
              </label>
            </div>
            <textarea
              id={name}
              name={name}
              defaultValue={String(value ?? "")}
              placeholder={placeholder}
              className={textareaClass}
            />
          </div>
        ))}
      </div>

      {/* Additional Details */}
      <div className="rounded-2xl border border-stone-200/90 bg-stone-50/40 p-4 transition-all hover:bg-stone-50/70">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-200/60 text-[#9c5247]">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <label htmlFor="details" className="text-xs font-bold uppercase tracking-wider text-stone-700 cursor-pointer">
            Additional Artisan & Craft Notes
          </label>
        </div>
        <textarea
          id="details"
          name="details"
          defaultValue={info?.details || ""}
          placeholder="e.g. Hand-spun yarn by master weavers of Varanasi. Subtle imperfections are hallmarks of artisanal craftsmanship..."
          className={textareaClass}
        />
      </div>

      {/* Size Chart & Measurements */}
      <div className="rounded-2xl border border-stone-200/90 bg-stone-50/40 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-200/60 text-[#9c5247]">
            <Ruler className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Interactive Size Chart & Measurements
          </h3>
        </div>

        <MeasurementsEditor value={measurements} onChange={setMeasurements} />
      </div>

      {/* Footer / Save Action */}
      <div className="flex items-center justify-end pt-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#9c5247] to-[#7f4037] px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#9c5247]/20 transition-all hover:brightness-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Specifications & Sizing
            </>
          )}
        </button>
      </div>
    </form>
  );
}
