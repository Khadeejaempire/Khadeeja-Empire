"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight, PackageSearch, X } from "lucide-react";
import { useUI } from "@/hooks/useUI";
import { Drawer } from "@/components/ui/Drawer";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export type SearchProduct = Pick<
  Product,
  "id" | "slug" | "name" | "category" | "collection" | "tags" | "images" | "price" | "currency"
>;

export function SearchDrawer({ products }: { products: SearchProduct[] }) {
  const { openDrawer, closeDrawer } = useUI();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (openDrawer === "search") {
      // Focus input when drawer opens with a slight delay for animation
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Clear query when closed
      setTimeout(() => setQuery(""), 300);
    }
  }, [openDrawer]);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const normalized = query.trim().toLowerCase();
    return products
      .filter((product) =>
        [product.name, product.category, product.collection, ...product.tags].some(
          (value) => value.toLowerCase().includes(normalized)
        )
      )
      .slice(0, 6);
  }, [products, query]);

  return (
    <Drawer
      open={openDrawer === "search"}
      onClose={closeDrawer}
      side="right"
      ariaLabel="Search products"
      hideCloseButton={false}
    >
      <div className="flex flex-col h-full bg-white">
        {/* Sticky Header with Search Input */}
        <div className="sticky top-0 z-10 bg-white border-b border-border p-6 pt-12 md:pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 font-display text-ink m-0">Search</h2>
            <button 
              onClick={closeDrawer} 
              className="p-2 -mr-2 text-ink hover:text-primary transition-colors" 
              aria-label="Close search"
            >
              <X size={28} className="stroke-[1.5]" />
            </button>
          </div>
          <div className="relative flex items-center mt-5">
            <Search size={22} className="absolute left-4 text-muted" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, categories..."
              aria-label="Search products"
              className="w-full h-14 pl-12 pr-4 bg-surface  border-2 border-[#ad8150] focus:border-primary focus:bg-white text-base text-ink placeholder:text-muted/70 transition-all duration-300 outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Scrollable Results Area */}
        <div className="flex-1 overflow-y-auto p-6" aria-live="polite">
          {query.trim().length >= 2 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
                <PackageSearch size={28} className="text-muted" />
              </div>
              <p className="font-display text-xl text-ink mb-2">No results found</p>
              <p className="text-sm text-muted">
                We couldn&apos;t find anything for &ldquo;<span className="font-medium text-ink">{query}</span>&rdquo;.
                <br /> Try different keywords or browse our categories.
              </p>
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="pt-1 pb-4">
              <p className="text-xs font-semibold text-muted tracking-wider uppercase mb-4">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {["Kurtis", "Co-ord Sets", "Resort Wear", "Dresses", "Banaras"].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-4 py-2 bg-surface hover:bg-border/50 text-sm text-ink rounded-full transition-colors duration-200"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <ul className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-muted tracking-wider uppercase mb-2">
                Products
              </p>
              {results.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={closeDrawer}
                    className="group flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-surface transition-all duration-300"
                  >
                    <div className="relative w-[72px] h-[96px] rounded-lg overflow-hidden bg-surface shadow-sm flex-shrink-0">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="72px"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
                        {product.category.replace(/-/g, " ")}
                      </span>
                      <span className="font-display text-lg text-ink truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </span>
                      <span className="text-sm font-medium text-primary mt-1">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length >= 2 && results.length > 0 && (
            <div className="pt-8 pb-4">
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={closeDrawer}
                className="group flex items-center justify-center gap-2 w-full h-12 bg-[#2d2520] hover:bg-primary !text-[#ffffff] font-semibold tracking-widest text-sm rounded-none transition-colors uppercase"
              >
                View all results
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
