"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, X, Sparkles, FolderOpen } from "lucide-react";
import { useUI } from "@/hooks/useUI";
import { formatPrice } from "@/lib/utils";
import type { Product, Category } from "@/types";

export type SearchProduct = Pick<
  Product,
  "id" | "slug" | "name" | "category" | "collection" | "tags" | "images" | "price" | "currency"
>;

interface SearchDrawerProps {
  products: SearchProduct[];
  categories?: Category[];
}

export function SearchDrawer({ products, categories = [] }: SearchDrawerProps) {
  const router = useRouter();
  const { openDrawer, closeDrawer } = useUI();
  const isOpen = openDrawer === "search";
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 100% Dynamic Trending Searches extracted from actual store products & categories
  const dynamicTrendingTags = useMemo(() => {
    const tagSet = new Set<string>();

    // 1. Add categories from database
    categories.forEach((cat) => {
      if (cat.name && cat.name.trim().length > 2) {
        tagSet.add(cat.name.trim());
      }
    });

    // 2. Add product tags from database
    products.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          if (t && t.trim().length > 2) {
            const clean = t
              .trim()
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(" ");
            tagSet.add(clean);
          }
        });
      }
    });

    const list = Array.from(tagSet);
    if (list.length > 0) {
      return list.slice(0, 8);
    }

    return ["Banarasi Silk", "Tissue Silk", "Dupion Silk", "Handloom Sarees"];
  }, [products, categories]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = "";
      setTimeout(() => setQuery(""), 200);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeDrawer]);

  // Filter matching products
  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const normalized = query.trim().toLowerCase();
    return products.filter((product) =>
      [product.name, product.category, product.collection, ...product.tags].some(
        (value) => value && value.toLowerCase().includes(normalized)
      )
    );
  }, [products, query]);

  // Filter matching categories
  const matchingCategories = useMemo(() => {
    if (query.trim().length < 2 || !categories.length) return [];
    const normalized = query.trim().toLowerCase();
    return categories.filter((c) =>
      c.name.toLowerCase().includes(normalized) || c.slug.toLowerCase().includes(normalized)
    );
  }, [categories, query]);

  // Curated showcase products to show when query is empty
  const showcaseProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      closeDrawer();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Khadeeja Empire creations"
      className="fixed inset-0 z-[100] bg-surface/98 backdrop-blur-2xl flex flex-col overflow-y-auto animate-in fade-in duration-200"
    >
      {/* ──────────────────────────────────────────────────────────────
          TOP BAR (Brand title + Sleek Close Button)
          ────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted">
            Khadeeja Empire
          </span>
          <span className="text-muted/40">•</span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">
            Studio Search
          </span>
        </div>

        <button
          type="button"
          onClick={closeDrawer}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-ink hover:text-primary hover:bg-black/5 transition-all group"
          aria-label="Close search"
        >
          <span className="text-[11px] font-medium tracking-widest uppercase text-muted group-hover:text-ink hidden sm:inline">
            Close [ESC]
          </span>
          <div className="w-8 h-8 rounded-full bg-white border border-border/70 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <X size={16} className="stroke-[2]" />
          </div>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────
          HERO SEARCH INPUT (Style A: Floating Luxury Pill Bar)
          ────────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center h-14 sm:h-16 pl-5 sm:pl-6 pr-2 bg-white rounded-full border border-[#d8b88d]/70 shadow-[0_4px_24px_rgba(0,0,0,0.06)] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0 stroke-[2.2] mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by weave, silk type, or motif..."
              aria-label="Search products"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              style={{ outline: "none", boxShadow: "none" }}
              className="no-focus-outline flex-1 h-full text-base sm:text-lg md:text-xl font-display text-ink placeholder:text-muted/50 bg-transparent border-0 outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 shadow-none !outline-none !shadow-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-2 mr-1 rounded-full text-muted hover:text-ink hover:bg-black/5 transition-colors"
                aria-label="Clear query"
              >
                <X size={18} />
              </button>
            )}
            <button
              type="submit"
              className="h-10 sm:h-11 px-5 sm:px-6 rounded-full bg-maroon hover:bg-[#641b21] text-white text-xs sm:text-[13px] font-semibold tracking-wider uppercase transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <span>Search</span>
              <ArrowRight size={14} className="hidden sm:inline" />
            </button>
          </div>
        </form>
      </div>

      {/* ──────────────────────────────────────────────────────────────
          CONTENT AREA (Dynamic Trending + Curated Showcase OR Live Results)
          ────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1">
        {/* STATE 1: EMPTY QUERY (< 2 characters) -> SHOW DYNAMIC TRENDING & SHOWCASE */}
        {query.trim().length < 2 && (
          <div className="space-y-12 pt-4">
            {/* 1. Dynamic Trending Search Pills */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                  Trending Searches
                </h3>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {dynamicTrendingTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setQuery(tag)}
                    className="px-4 py-2 rounded-full bg-white hover:bg-primary/5 hover:border-primary/50 text-xs sm:text-[13px] font-medium text-ink/80 hover:text-primary border border-border shadow-2xs transition-all active:scale-95"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Explore Collections (from dynamic categories) */}
            {categories.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FolderOpen size={14} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                    Explore Studio Collections
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/collections/${cat.slug}`}
                      onClick={closeDrawer}
                      className="group p-4 rounded-xl bg-white border border-border/80 hover:border-primary/40 shadow-xs hover:shadow-sm transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                          {cat.name}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5">Explore Collection</p>
                      </div>
                      <span className="text-primary text-xs opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Featured / Curated Showcase Creations */}
            {showcaseProducts.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted mb-4">
                  Curated Creations
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {showcaseProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={closeDrawer}
                      className="group flex flex-col"
                    >
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white border border-border/50 shadow-xs mb-3">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : null}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                        {product.category?.replace(/-/g, " ")}
                      </span>
                      <h4 className="font-display text-sm sm:text-base text-ink group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </h4>
                      <p className="text-xs sm:text-sm font-semibold text-primary mt-1">
                        {formatPrice(product.price, product.currency)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATE 2: ACTIVE SEARCH RESULTS (>= 2 characters) */}
        {query.trim().length >= 2 && (
          <div className="space-y-8 pt-4 animate-in fade-in duration-150">
            {/* Header info bar */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <p className="text-xs sm:text-sm text-ink font-medium">
                Showing <span className="font-bold text-primary">{results.length}</span> matching{" "}
                {results.length === 1 ? "creation" : "creations"} for &ldquo;{query}&rdquo;
              </p>
              {results.length > 0 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="text-xs font-bold text-primary hover:underline uppercase tracking-wider inline-flex items-center gap-1"
                >
                  <span>View in Full Catalog</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            {/* Matching Categories preview */}
            {matchingCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted font-medium">Matching Collections:</span>
                {matchingCategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/collections/${cat.slug}`}
                    onClick={closeDrawer}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    {cat.name} →
                  </Link>
                ))}
              </div>
            )}

            {/* Zero Results State */}
            {results.length === 0 && (
              <div className="py-16 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-white border border-border mx-auto flex items-center justify-center text-muted mb-4 shadow-xs">
                  <Search size={24} />
                </div>
                <h4 className="font-display text-xl text-ink mb-2">No creations found</h4>
                <p className="text-sm text-muted mb-6 leading-relaxed">
                  We couldn&apos;t find any sarees matching &ldquo;{query}&rdquo;. Try clicking one of our trending searches or explore collections.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {dynamicTrendingTags.slice(0, 3).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setQuery(tag)}
                      className="px-4 py-2 rounded-full bg-white border border-border text-xs font-medium text-ink hover:text-primary hover:border-primary transition-all"
                    >
                      Search &ldquo;{tag}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results Grid (Clean 4-column luxury layout) */}
            {results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={closeDrawer}
                    className="group flex flex-col"
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white border border-border/50 shadow-xs mb-3">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                      {product.category?.replace(/-/g, " ")}
                    </span>
                    <h4 className="font-display text-sm sm:text-base text-ink group-hover:text-primary transition-colors line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="text-xs sm:text-sm font-semibold text-primary mt-1">
                      {formatPrice(product.price, product.currency)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
