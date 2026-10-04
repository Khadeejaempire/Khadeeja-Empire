"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, MessageCircle, ShieldCheck, Ruler, Sparkles, Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useUI } from "@/hooks/useUI";
import { showToast } from "@/components/ui/Toast";
import type { Product } from "@/types";

interface ProductActionsProps {
  product: Product;
  hasSizeGuide?: boolean;
}

export function ProductActions({ product, hasSizeGuide = false }: ProductActionsProps) {
  const { addItem } = useCart();
  const { openCart } = useUI();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [addedAnimation, setAddedAnimation] = useState(false);

  const validateSize = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      setError("Please select an option");
      return false;
    }
    setError("");
    return true;
  };

  const handleAddToBag = () => {
    if (!validateSize()) return;
    addItem(product, selectedSize || "Free Size", quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
    showToast(`${product.name} added to your bag`);
    openCart();
  };

  const handleBuyNow = () => {
    if (!validateSize()) return;
    addItem(product, selectedSize || "Free Size", quantity);
    router.push("/checkout");
  };

  const handleWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `Hello Khadeeja Empire! I am interested in purchasing:\n*${product.name}*\nPrice: ₹${product.price.toLocaleString("en-IN")}\nLink: ${window.location.href}`
    );
    window.open(`https://wa.me/919999999999?text=${text}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Availability / Stock Status & SKU */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
          </span>
          <span className="font-medium text-emerald-800">
            {product.availability === "in-stock" ? "In Stock — Ready to Handloom Dispatch" : "Limited Artisan Stock"}
          </span>
        </div>
        {product.sku && (
          <span className="text-muted tracking-wider uppercase font-mono text-[11px]">
            SKU: {product.sku}
          </span>
        )}
      </div>

      {/* Size / Variant Selector (if any) */}
      {product.sizes.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink">
              Option / Size: <span className="font-normal text-muted">{selectedSize || "Select"}</span>
            </label>
            {hasSizeGuide && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-size-guide"))}
                className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline rounded"
                style={{ color: "var(--color-maroon)" }}
              >
                <Ruler size={14} />
                <span>Size Guide</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select size">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={selectedSize === size}
                onClick={() => {
                  setSelectedSize(size);
                  setError("");
                }}
                className={`min-w-[48px] h-10 px-3.5 border text-xs font-medium transition rounded ${
                  selectedSize === size
                    ? "border-[var(--color-maroon)] bg-[var(--color-maroon)] text-white shadow-sm"
                    : "border-border bg-surface-elevated text-ink hover:border-ink/60"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Quantity Selector & Add Actions */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink">
            Quantity
          </label>
          <div className="inline-flex items-center rounded border border-border bg-surface-elevated">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              aria-label="Decrease quantity"
              className="w-9 h-9 flex items-center justify-center text-sm font-semibold text-ink hover:bg-surface transition"
            >
              −
            </button>
            <span className="w-10 text-center text-xs font-semibold text-ink">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              aria-label="Increase quantity"
              className="w-9 h-9 flex items-center justify-center text-sm font-semibold text-ink hover:bg-surface transition"
            >
              +
            </button>
          </div>
        </div>

        {/* CTA Buttons: Add to Bag (Solid) + Buy It Now (Outline/Secondary) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleAddToBag}
            className="h-12 flex items-center justify-center gap-2 rounded text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
            style={{ backgroundColor: "var(--color-maroon)" }}
          >
            {addedAnimation ? (
              <>
                <Check size={16} /> Added to Bag
              </>
            ) : (
              <>
                <ShoppingBag size={16} /> Add to Bag
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="h-12 flex items-center justify-center gap-2 rounded text-xs font-bold uppercase tracking-wider border-2 border-[var(--color-maroon)] text-[var(--color-maroon)] bg-transparent transition-all duration-200 hover:bg-[var(--color-maroon)] hover:text-white active:scale-[0.99]"
          >
            Buy It Now
          </button>
        </div>

        {/* WhatsApp Inquiry Button */}
        <button
          type="button"
          onClick={handleWhatsAppInquiry}
          className="w-full h-11 flex items-center justify-center gap-2 rounded border border-emerald-600/60 bg-emerald-50/50 text-emerald-800 text-xs font-semibold uppercase tracking-wider transition hover:bg-emerald-100/70"
        >
          <MessageCircle size={16} className="text-emerald-600" />
          Order / Inquire via WhatsApp
        </button>
      </div>
    </div>
  );
}