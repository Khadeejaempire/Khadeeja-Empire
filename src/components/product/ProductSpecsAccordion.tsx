"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, ShieldCheck, Truck, RefreshCw, Feather } from "lucide-react";
import type { ProductInformationRecord } from "@/lib/admin/types";

interface ProductSpecsAccordionProps {
  information?: ProductInformationRecord | null;
  productName: string;
  category?: string;
  collection?: string;
}

export function ProductSpecsAccordion({
  information,
  productName,
  category,
  collection,
}: ProductSpecsAccordionProps) {
  const [openSection, setOpenSection] = useState<string | null>("specs");

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mt-6 divide-y divide-border border-y border-border">
      {/* 1. Product Details & Specifications */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("specs")}
          className="flex w-full items-center justify-between py-4 text-left font-display text-base font-medium text-ink transition hover:text-[var(--color-maroon)]"
          aria-expanded={openSection === "specs"}
        >
          <span className="flex items-center gap-2.5">
            <Sparkles size={16} style={{ color: "var(--color-maroon)" }} />
            Product Details & Specifications
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 text-muted ${
              openSection === "specs" ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSection === "specs" && (
          <div className="pb-5 pt-1 text-sm text-ink/90">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex justify-between border-b border-border/40 py-1.5">
                <dt className="text-muted">Fabric / Material</dt>
                <dd className="font-medium text-ink text-right">
                  {information?.fabric || "Pure Kora / Dupion Handloom Silk"}
                </dd>
              </div>

              <div className="flex justify-between border-b border-border/40 py-1.5">
                <dt className="text-muted">Weaving Technique</dt>
                <dd className="font-medium text-ink text-right">
                  Authentic Banarasi Handloom Kadwa Weave
                </dd>
              </div>

              <div className="flex justify-between border-b border-border/40 py-1.5">
                <dt className="text-muted">Zari Detailing</dt>
                <dd className="font-medium text-ink text-right">
                  Tested Fine Rose Gold & Antique Zari
                </dd>
              </div>

              <div className="flex justify-between border-b border-border/40 py-1.5">
                <dt className="text-muted">Blouse Piece</dt>
                <dd className="font-medium text-ink text-right">
                  Included (Unstitched 80cm matching piece)
                </dd>
              </div>

              <div className="flex justify-between border-b border-border/40 py-1.5">
                <dt className="text-muted">Dimensions</dt>
                <dd className="font-medium text-ink text-right">
                  Length: 5.5m + 0.8m | Width: 45 inches
                </dd>
              </div>

              <div className="flex justify-between border-b border-border/40 py-1.5">
                <dt className="text-muted">Craft Origin</dt>
                <dd className="font-medium text-ink text-right">
                  Varanasi (Banaras), India
                </dd>
              </div>
            </dl>

            {information?.details && (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {information.details}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 2. Wash & Care */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("care")}
          className="flex w-full items-center justify-between py-4 text-left font-display text-base font-medium text-ink transition hover:text-[var(--color-maroon)]"
          aria-expanded={openSection === "care"}
        >
          <span className="flex items-center gap-2.5">
            <Feather size={16} style={{ color: "var(--color-maroon)" }} />
            Wash & Care Instructions
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 text-muted ${
              openSection === "care" ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSection === "care" && (
          <div className="pb-5 pt-1 text-sm text-muted">
            <ul className="list-disc space-y-2 pl-5 leading-relaxed text-xs sm:text-sm">
              <li>
                <strong className="text-ink font-medium">Dry Clean Recommended:</strong> To preserve the natural silk luster and zari brilliance, dry clean only.
              </li>
              <li>
                <strong className="text-ink font-medium">Storage:</strong> Wrap in pure cotton or breathable muslin cloth. Avoid direct plastic covers.
              </li>
              <li>
                <strong className="text-ink font-medium">Ironing:</strong> Iron on low-to-medium heat on reverse side or use a protective pressing cloth.
              </li>
              <li>
                <strong className="text-ink font-medium">Perfumes & Sprays:</strong> Avoid spraying perfume, deodorant or water directly onto zari work.
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* 3. Shipping & Delivery */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("shipping")}
          className="flex w-full items-center justify-between py-4 text-left font-display text-base font-medium text-ink transition hover:text-[var(--color-maroon)]"
          aria-expanded={openSection === "shipping"}
        >
          <span className="flex items-center gap-2.5">
            <Truck size={16} style={{ color: "var(--color-maroon)" }} />
            Shipping & Dispatch Timelines
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 text-muted ${
              openSection === "shipping" ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSection === "shipping" && (
          <div className="pb-5 pt-1 text-xs sm:text-sm leading-relaxed text-muted space-y-2">
            <p>
              • <strong className="text-ink font-medium">Domestic Shipping (India):</strong> Free standard doorstep delivery across all serviceable Indian pincodes.
            </p>
            <p>
              • <strong className="text-ink font-medium">Dispatch Timeline:</strong> Each handloom piece undergoes rigorous quality finishing and is dispatched within <strong>5–7 business days</strong>.
            </p>
            <p>
              • <strong className="text-ink font-medium">Worldwide Shipping:</strong> Available to 50+ countries (USA, UK, UAE, Canada, Australia, Europe, Singapore).
            </p>
            <p>
              • <strong className="text-ink font-medium">Tracking:</strong> Live real-time SMS & WhatsApp tracking updates dispatched upon shipment.
            </p>
          </div>
        )}
      </div>

      {/* 4. Authenticity & The Handloom Promise */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("authenticity")}
          className="flex w-full items-center justify-between py-4 text-left font-display text-base font-medium text-ink transition hover:text-[var(--color-maroon)]"
          aria-expanded={openSection === "authenticity"}
        >
          <span className="flex items-center gap-2.5">
            <ShieldCheck size={16} style={{ color: "var(--color-maroon)" }} />
            Authenticity & Craftsmanship Promise
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 text-muted ${
              openSection === "authenticity" ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSection === "authenticity" && (
          <div className="pb-5 pt-1 text-xs sm:text-sm leading-relaxed text-muted space-y-2">
            <p>
              Every Khadeeja Empire creation is an ode to timeless Banarasi heritage. Our sarees are individually crafted by master weavers using time-honored loom techniques.
            </p>
            <p className="italic text-ink/80 pt-1 border-l-2 border-[var(--color-maroon)] pl-3">
              &quot;Slight variations in weave texture and zari motifs are the natural hallmark of authentic handmade handloom artistry, making your piece one of a kind.&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
