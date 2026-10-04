"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useUI } from "@/hooks/useUI";
import { showToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface StickyAddToCartProps {
  product: Product;
}

export function StickyAddToCart({ product }: StickyAddToCartProps) {
  const [visible, setVisible] = useState(false);
  const { addItem } = useCart();
  const { openCart } = useUI();

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling past 500px
      if (window.scrollY > 480) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  const handleQuickAdd = () => {
    addItem(product, product.sizes[0] || "Free Size", 1);
    showToast(`${product.name} added to your bag`);
    openCart();
  };

  const imageSrc = product.images[0] || "/assets/slides/girl-1.png";

  return (
    <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 z-30 border-t border-border bg-surface-elevated/95 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg transition-transform duration-300">
      <div className="mx-auto flex max-w-[1460px] items-center justify-between gap-3 sm:gap-4">
        {/* Product Thumbnail & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
          <div className="relative h-10 w-9 sm:h-12 sm:w-10 shrink-0 overflow-hidden rounded border border-border bg-surface">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-xs sm:text-sm font-medium text-ink max-w-[180px] sm:max-w-[320px]">
              {product.name}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-semibold text-ink">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-[10px] sm:text-xs text-muted line-through">
                  {formatPrice(product.oldPrice, product.currency)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Add CTA */}
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={handleQuickAdd}
            className="flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded px-3.5 sm:px-5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "var(--color-maroon)" }}
          >
            <ShoppingBag size={13} className="sm:size-4" />
            <span>Add to Bag</span>
          </button>
        </div>
      </div>
    </div>
  );
}
