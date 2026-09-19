"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Grid2X2,
  List,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import type { Category, Product } from "@/types";
import { ProductCard } from "@/components/ui/ProductCard";
import { Drawer } from "@/components/ui/Drawer";
import { buildCategoryTree } from "@/lib/storefront/category-tree";
import { cn } from "@/lib/utils";

function CategoryFilterLabel({
  name,
  slug,
  checked,
  count,
  onToggle,
}: {
  name: string;
  slug: string;
  checked: boolean;
  count: number;
  onToggle: (slug: string, checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between text-sm text-ink/80 hover:text-ink cursor-pointer group">
      <span className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(slug, e.target.checked)}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-[#A37B34]"
        />
        <span className={cn(checked && "font-semibold text-ink")}>{name}</span>
      </span>
      <span className="text-xs text-muted font-normal">({count})</span>
    </label>
  );
}

interface ShopCatalogProps {
  products: Product[];
  categories: Category[];
  categoryGroups?: Record<string, string[]>;
  initialCategory?: string;
  titleOverride?: string;
  priceUnder?: number;
}

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLOR_SWATCHES = [
  { name: "Beige", bg: "#D4B376" },
  { name: "Black", bg: "#1A1A1A" },
  { name: "White", bg: "#FFFFFF", border: true },
  { name: "Coral", bg: "#E57373" },
  { name: "Green", bg: "#668B4A" },
  { name: "Maroon", bg: "#800020" },
  { name: "Navy", bg: "#1F2937" },
];
const ALL_FABRICS = ["Pure Cotton", "Banarasi Silk", "Linen Blend", "Chiffon", "Georgette"];

export function ShopCatalog({
  products,
  categories,
  categoryGroups,
  initialCategory,
  titleOverride,
  priceUnder,
}: ShopCatalogProps) {
  // Filters State
  const [selectedTab, setSelectedTab] = useState<string>(initialCategory || "all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(
    priceUnder ?? 15000
  );
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);

  // Controls State
  const [sortBy, setSortBy] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Accordion Expand/Collapse State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    size: true,
    price: true,
    color: true,
    fabric: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Reset all filters
  const handleClearAll = () => {
    setSelectedTab("all");
    setSelectedCategories([]);
    setSelectedSizes([]);
    setMaxPrice(15000);
    setSelectedColors([]);
    setSelectedFabrics([]);
    setCurrentPage(1);
  };

  const categoryTabs = useMemo(
    () => [
      { slug: "all", name: "All" },
      ...categories.map((category) => ({ slug: category.slug, name: category.name })),
    ],
    [categories]
  );

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const toggleCategory = (slug: string, checked: boolean) => {
    setSelectedCategories(
      checked ? [...selectedCategories, slug] : selectedCategories.filter((s) => s !== slug)
    );
    setCurrentPage(1);
  };

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter products logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Horizontal Tab filter
      if (selectedTab !== "all" && !(categoryGroups?.[selectedTab] ?? [selectedTab]).includes(product.category)) {
        return false;
      }

      // Sidebar Category Checkbox filter
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(product.category)
      ) {
        return false;
      }

      // Size filter
      if (
        selectedSizes.length > 0 &&
        !product.sizes.some((s) => selectedSizes.includes(s))
      ) {
        return false;
      }

      // Price filter
      if (product.price > maxPrice) {
        return false;
      }

      // Color / Tag filter
      if (selectedColors.length > 0) {
        const matchesColor = selectedColors.some(
          (color) =>
            product.tags?.some((tag) =>
              tag.toLowerCase().includes(color.toLowerCase())
            ) || product.name.toLowerCase().includes(color.toLowerCase())
        );
        if (!matchesColor) return false;
      }

      // Fabric / Tag filter
      if (selectedFabrics.length > 0) {
        const matchesFabric = selectedFabrics.some(
          (fabric) =>
            product.tags?.some((tag) =>
              tag.toLowerCase().includes(fabric.toLowerCase())
            ) || product.description.toLowerCase().includes(fabric.toLowerCase())
        );
        if (!matchesFabric) return false;
      }

      return true;
    });
  }, [
    products,
    categoryGroups,
    selectedTab,
    selectedCategories,
    selectedSizes,
    maxPrice,
    selectedColors,
    selectedFabrics,
  ]);

  // Sort products logic
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === "price-asc") {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === "price-desc") {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortBy === "newest") {
      return list.sort((a, b) => (b.badge === "new" ? 1 : -1));
    }
    if (sortBy === "name-asc") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Featured default sort
    return list.sort((a, b) => (b.badge === "featured" ? 1 : -1));
  }, [filteredProducts, sortBy]);

  // Pagination logic
  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage]);

  const hasActiveFilters =
    selectedTab !== "all" ||
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    maxPrice < 15000 ||
    selectedColors.length > 0 ||
    selectedFabrics.length > 0;

  // Render Filter Sidebar Content
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col gap-6 text-ink">
      {/* Sidebar Header (Only rendered on desktop) */}
      {!isMobile && (
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <span className="font-bold text-base tracking-wide flex items-center gap-2 text-ink">
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-[#B3883B] hover:underline flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      )}

      {/* 1. CATEGORY Accordion */}
      <div className="border-b border-border/50 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("category")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-ink py-1 text-left"
        >
          <span>Category</span>
          {openSections.category ? (
            <ChevronUp size={14} className="text-muted" />
          ) : (
            <ChevronDown size={14} className="text-muted" />
          )}
        </button>

        {openSections.category && (
          <div className="flex flex-col gap-3 pt-3 pl-0.5">
            {categoryTree.map((parent) => (
              <div key={parent.slug} className="flex flex-col gap-2.5">
                <CategoryFilterLabel
                  name={parent.name}
                  slug={parent.slug}
                  checked={selectedCategories.includes(parent.slug)}
                  count={categoryCounts[parent.slug] || 0}
                  onToggle={toggleCategory}
                />
                {parent.children.length ? (
                  <div className="ml-2 flex flex-col gap-2.5 border-l border-border/60 pl-4">
                    {parent.children.map((child) => (
                      <CategoryFilterLabel
                        key={child.slug}
                        name={child.name}
                        slug={child.slug}
                        checked={selectedCategories.includes(child.slug)}
                        count={categoryCounts[child.slug] || 0}
                        onToggle={toggleCategory}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. SIZE Accordion */}
      <div className="border-b border-border/50 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("size")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-ink py-1 text-left"
        >
          <span>Size</span>
          {openSections.size ? (
            <ChevronUp size={14} className="text-muted" />
          ) : (
            <ChevronDown size={14} className="text-muted" />
          )}
        </button>

        {openSections.size && (
          <div className="grid grid-cols-3 gap-2 pt-3">
            {ALL_SIZES.map((size) => {
              const isSelected = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSizes(selectedSizes.filter((s) => s !== size));
                    } else {
                      setSelectedSizes([...selectedSizes, size]);
                    }
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "py-2 px-3 text-xs font-semibold rounded-lg border transition-all duration-200 text-center",
                    isSelected
                      ? "bg-[#A37B34] text-white border-[#A37B34] shadow-sm"
                      : "bg-surface text-ink border-border/70 hover:border-ink"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. PRICE Accordion */}
      <div className="border-b border-border/50 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-ink py-1 text-left"
        >
          <span>Price Range</span>
          {openSections.price ? (
            <ChevronUp size={14} className="text-muted" />
          ) : (
            <ChevronDown size={14} className="text-muted" />
          )}
        </button>

        {openSections.price && (
          <div className="flex flex-col gap-2 pt-2">
            {/* Floating Price Tooltip Badge Above Thumb Dot */}
            <div className="relative w-full pt-6">
              <div
                className="absolute top-0 -translate-x-1/2 pointer-events-none transition-all duration-75"
                style={{
                  left: `${Math.min(94, Math.max(6, ((maxPrice - 500) / (15000 - 500)) * 100))}%`,
                }}
              >
                <div className="bg-[#A37B34] text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm relative whitespace-nowrap flex items-center justify-center">
                  ₹{maxPrice.toLocaleString("en-IN")}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#A37B34] rotate-45" />
                </div>
              </div>

              {/* Range Input Slider with Dynamic Fill Color */}
              {(() => {
                const fillPercentage = ((maxPrice - 500) / (15000 - 500)) * 100;
                return (
                  <input
                    type="range"
                    min={500}
                    max={15000}
                    step={100}
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#A37B34]"
                    style={{
                      background: `linear-gradient(to right, #A37B34 0%, #A37B34 ${fillPercentage}%, #E5E7EB ${fillPercentage}%, #E5E7EB 100%)`,
                    }}
                  />
                );
              })()}
            </div>

            {/* Bottom Min / Max Indicators */}
            <div className="flex items-center justify-between text-ink pt-1.5">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Min Price</span>
                <span className="font-bold text-gray-800 text-xs sm:text-sm">₹500</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Max Selected</span>
                <span className="font-bold text-[#A37B34] text-sm sm:text-base">₹{maxPrice.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. COLOR Accordion */}
      <div className="border-b border-border/50 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("color")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-ink py-1 text-left"
        >
          <span>Color</span>
          {openSections.color ? (
            <ChevronUp size={14} className="text-muted" />
          ) : (
            <ChevronDown size={14} className="text-muted" />
          )}
        </button>

        {openSections.color && (
          <div className="flex items-center gap-2.5 pt-3 flex-wrap">
            {COLOR_SWATCHES.map((c) => {
              const isSelected = selectedColors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedColors(selectedColors.filter((color) => color !== c.name));
                    } else {
                      setSelectedColors([...selectedColors, c.name]);
                    }
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all relative flex items-center justify-center shrink-0 cursor-pointer shadow-2xs",
                    isSelected
                      ? "ring-2 ring-offset-2 ring-[#A37B34] scale-105"
                      : "hover:scale-110 opacity-90 hover:opacity-100",
                    c.border ? "border border-gray-300" : "border border-black/10"
                  )}
                  style={{ backgroundColor: c.bg }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 5. FABRIC Accordion */}
      <div className="pb-2">
        <button
          type="button"
          onClick={() => toggleSection("fabric")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-ink py-1 text-left"
        >
          <span>Fabric</span>
          {openSections.fabric ? (
            <ChevronUp size={14} className="text-muted" />
          ) : (
            <ChevronDown size={14} className="text-muted" />
          )}
        </button>

        {openSections.fabric && (
          <div className="flex flex-col gap-2 pt-3">
            {ALL_FABRICS.map((fabric) => {
              const isChecked = selectedFabrics.includes(fabric);
              return (
                <label
                  key={fabric}
                  className="flex items-center gap-2.5 text-sm text-ink/80 hover:text-ink cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFabrics([...selectedFabrics, fabric]);
                      } else {
                        setSelectedFabrics(selectedFabrics.filter((f) => f !== fabric));
                      }
                      setCurrentPage(1);
                    }}
                    className="w-4 h-4 rounded border-border text-primary accent-[#A37B34]"
                  />
                  <span className={cn(isChecked && "font-semibold text-ink")}>{fabric}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* 1. Header Section: Breadcrumb + Title + Product Count */}
      <div className="flex flex-col gap-3">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="text-muted/60">›</span>
          <Link href="/shop" className="hover:text-primary transition-colors">
            Shop
          </Link>
          {titleOverride && (
            <>
              <span className="text-muted/60">›</span>
              <span className="text-ink font-semibold">{titleOverride}</span>
            </>
          )}
        </nav>

        {/* Title & Top Right Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-ink">
              {titleOverride || (priceUnder ? `Under ₹${priceUnder}` : "Shop All")}
            </h1>
          </div>

          {/* Top Right Control Bar: Sort & Filter Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto self-stretch md:self-end">
            {/* Sort Select Pill */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-800 text-xs font-semibold py-2.5 pl-4 pr-9 rounded focus:outline-none focus:border-ink cursor-pointer shadow-xs transition-colors"
                aria-label="Sort products"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
            </div>

            {/* Filter Mobile Trigger */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center justify-center gap-2 bg-[#FAF5ED] text-[#8C6627] border border-[#E8DCCB] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs hover:bg-[#EFE5D5] transition-all shrink-0"
            >
              <Filter size={14} />
              <span>Filter</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#A37B34]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Category Filter Tabs + Grid Toggle Bar */}
      <div className="flex items-center justify-between gap-4 border-y border-border/60 py-3.5 overflow-x-auto no-scrollbar">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2.5 shrink-0">
          {categoryTabs.map((tab) => {
            const isActive = selectedTab === tab.slug;
            return (
              <button
                key={tab.slug}
                type="button"
                onClick={() => {
                  setSelectedTab(tab.slug);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-5 py-2.5 text-xs font-semibold rounded whitespace-nowrap transition-all duration-200 shadow-xs border",
                  isActive
                    ? "bg-[#A37B34] text-white border-[#A37B34] shadow-sm"
                    : "bg-white text-ink/80 border-gray-200 hover:border-gray-400 hover:text-ink"
                )}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* View Layout Switcher (Grid vs List) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0 text-xs font-semibold text-gray-500">
          <span>View:</span>
          <div className="flex items-center gap-1 bg-white p-1 border border-gray-200 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "grid"
                  ? "bg-[#FAF5ED] text-[#8C6627] border border-[#E8DCCB]"
                  : "text-muted hover:text-ink"
              )}
            >
              <Grid2X2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="List View"
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "list"
                  ? "bg-[#FAF5ED] text-[#8C6627] border border-[#E8DCCB]"
                  : "text-muted hover:text-ink"
              )}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Catalog Content: Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs sticky top-24">
          {renderSidebarContent()}
        </aside>

        {/* Right Product Grid Area */}
        <main className="lg:col-span-9 flex flex-col gap-10">
          {paginatedProducts.length > 0 ? (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid gap-x-3 gap-y-4 sm:gap-x-5 sm:gap-y-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "flex flex-col gap-4"
              )}
            >
              {paginatedProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant={viewMode}
                  priority={index < 4}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="py-20 px-4 bg-white rounded-2xl border border-gray-200 text-center flex flex-col items-center gap-4 shadow-xs">
              <Sparkles className="h-10 w-10 text-[#A37B34] opacity-60" />
              <h3 className="font-serif text-2xl text-ink">No Products Found</h3>
              <p className="text-muted max-w-md text-sm">
                We couldn't find any products matching your selected filter criteria. Try resetting your filters.
              </p>
              <button
                type="button"
                onClick={handleClearAll}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A37B34] text-white text-xs font-semibold shadow-md hover:bg-[#8C6627] transition-colors"
              >
                <RotateCcw size={14} />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}

          {/* 4. Pagination Bar (Bottom - Matching Reference Screenshot) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 sm:gap-3 pt-6 border-t border-border/50">
              {/* Prev Button - Rounded Rectangle Box */}
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                  window.scrollTo({ top: 180, behavior: "smooth" });
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#EAE3DA] shadow-xs flex items-center justify-center text-[#735A2A] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FAF5ED] transition-all text-sm font-bold shrink-0"
                aria-label="Previous page"
              >
                <ChevronDown size={16} className="rotate-90 text-[#735A2A]" />
              </button>

              {/* Dynamic Page Numbers with Ellipsis support */}
              {(() => {
                const range: (number | string)[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) range.push(i);
                } else if (currentPage <= 3) {
                  range.push(1, 2, 3, "...", totalPages);
                } else if (currentPage >= totalPages - 2) {
                  range.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
                } else {
                  range.push(1, "...", currentPage, "...", totalPages);
                }

                return range.map((item, idx) => {
                  if (item === "...") {
                    return (
                      <span key={`dots-${idx}`} className="text-gray-400 font-bold px-1 text-sm">
                        ...
                      </span>
                    );
                  }

                  const pageNum = Number(item);
                  const isActive = currentPage === pageNum;

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 180, behavior: "smooth" });
                      }}
                      className={cn(
                        "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm font-bold transition-all flex items-center justify-center shadow-2xs",
                        isActive
                          ? "rounded-full bg-[#A37B34] text-white shadow-sm"
                          : "rounded-full bg-white text-ink border border-gray-200 hover:border-[#A37B34] hover:text-[#A37B34]"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                });
              })()}

              {/* Next Button - Rounded Rectangle Box */}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  window.scrollTo({ top: 180, behavior: "smooth" });
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#EAE3DA] shadow-xs flex items-center justify-center text-[#735A2A] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FAF5ED] transition-all text-sm font-bold shrink-0"
                aria-label="Next page"
              >
                <ChevronDown size={16} className="-rotate-90 text-[#735A2A]" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 5. Mobile Filters Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        side="left"
        hideCloseButton
        ariaLabel="Filter catalog"
      >
        <div className="p-6 h-full overflow-y-auto bg-surface flex flex-col justify-between">
          <div>
            {/* Single Clean Mobile Drawer Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-border/70 pt-2">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                  <SlidersHorizontal size={18} />
                  <span>Filters</span>
                </h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-semibold text-[#B3883B] hover:underline flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200/80 flex items-center justify-center text-gray-700 active:scale-95 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter Content */}
            {renderSidebarContent(true)}
          </div>

          <div className="mt-8 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-3 rounded-xl bg-[#A37B34] text-white font-semibold text-sm shadow-md"
            >
              Apply Filters ({sortedProducts.length} Results)
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
