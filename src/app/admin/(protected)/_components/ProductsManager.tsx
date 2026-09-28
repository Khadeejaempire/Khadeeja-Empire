"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Pencil,
  Trash2,
  ExternalLink,
  Sparkles,
  Star,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Tag,
  Check,
  ShoppingBag,
  TrendingUp,
  Percent,
} from "lucide-react";
import type { CategoryRecord, ProductRecord } from "@/lib/admin/types";
import { deleteProductAction, toggleProductAction } from "@/actions/admin/products";
import { adminActionMessage } from "@/lib/admin/errors";

type ViewMode = "table" | "grid";
type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc" | "stock";

function getPrimaryImage(product: ProductRecord): string | null {
  if (product.images && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === "string" && first.trim()) return first;
    if (typeof first === "object" && first && "url" in first && typeof first.url === "string") return first.url;
  }
  if (product.hoverImage) return product.hoverImage;
  return null;
}

function getAllImages(product: ProductRecord): string[] {
  const list: string[] = [];
  if (product.images && Array.isArray(product.images)) {
    for (const img of product.images) {
      if (typeof img === "string" && img.trim()) list.push(img.trim());
      else if (typeof img === "object" && img && "url" in img && typeof img.url === "string" && img.url.trim()) {
        list.push(img.url.trim());
      }
    }
  }
  if (product.hoverImage && !list.includes(product.hoverImage)) {
    list.push(product.hoverImage);
  }
  return list;
}

function formatPrice(value?: number | null, curr = "INR") {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: curr || "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function shortName(name: string, maxLen = 34) {
  if (!name) return "";
  return name.length > maxLen ? `${name.slice(0, maxLen).trim()}…` : name;
}

interface ProductsManagerProps {
  initialProducts: ProductRecord[];
  categories: CategoryRecord[];
  initialSearch?: string;
}

export function ProductsManager({
  initialProducts,
  categories,
  initialSearch = "",
}: ProductsManagerProps) {
  const [products, setProducts] = useState<ProductRecord[]>(initialProducts);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStock, setSelectedStock] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedBadge, setSelectedBadge] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [previewProduct, setPreviewProduct] = useState<ProductRecord | null>(null);

  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.active !== false).length;
    const featured = products.filter((p) => p.featured === true || p.badge === "featured").length;
    const outOfStock = products.filter(
      (p) => p.availability === "out-of-stock" || p.availability === "low-stock"
    ).length;
    return { total, active, featured, outOfStock };
  }, [products]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      const cat = p.categoryId || p.categorySlug || "uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q))) ||
          (p.category?.name && p.category.name.toLowerCase().includes(q))
        );
      });
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) =>
          p.categoryId === selectedCategory ||
          p.categorySlug === selectedCategory ||
          p.category?.slug === selectedCategory
      );
    }

    // Stock availability filter
    if (selectedStock !== "all") {
      result = result.filter((p) => (p.availability || "in-stock") === selectedStock);
    }

    // Active status filter
    if (selectedStatus === "active") {
      result = result.filter((p) => p.active !== false);
    } else if (selectedStatus === "disabled") {
      result = result.filter((p) => p.active === false);
    }

    // Badge filter
    if (selectedBadge !== "all") {
      if (selectedBadge === "featured") {
        result = result.filter((p) => p.featured === true || p.badge === "featured");
      } else {
        result = result.filter((p) => p.badge === selectedBadge);
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "stock") {
        const orderMap: Record<string, number> = { "out-of-stock": 0, "low-stock": 1, "in-stock": 2 };
        const aVal = orderMap[a.availability || "in-stock"] ?? 2;
        const bVal = orderMap[b.availability || "in-stock"] ?? 2;
        return aVal - bVal;
      }
      // default: newest first
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

    return result;
  }, [products, search, selectedCategory, selectedStock, selectedStatus, selectedBadge, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedStock !== "all" ||
    selectedStatus !== "all" ||
    selectedBadge !== "all";

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedStock("all");
    setSelectedStatus("all");
    setSelectedBadge("all");
  };

  // Toggle active status
  const handleToggle = (product: ProductRecord) => {
    const newActive = product.active === false;
    setTogglingId(product.id);

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, active: newActive } : p))
    );

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", product.id);
        formData.set("active", String(newActive));
        await toggleProductAction(formData);
        toast.success(newActive ? `"${product.name}" is now Live.` : `"${product.name}" is now Hidden.`);
      } catch (error) {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, active: !newActive } : p))
        );
        toast.error(adminActionMessage(error, "Could not update the product status."));
      } finally {
        setTogglingId(null);
      }
    });
  };

  // Delete product
  const handleDelete = (product: ProductRecord) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(product.id);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", product.id);
        await deleteProductAction(formData);
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        toast.success(`"${product.name}" was permanently deleted.`);
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not delete the product."));
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Add Product Action ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Products
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              <Package className="h-3.5 w-3.5 text-[#9c5247]" />
              {products.length} {products.length === 1 ? "Item" : "Items"}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Curate and manage your Indian womenswear catalog, inventory, pricing, and storefront visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/products/new"
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-5 text-sm font-bold text-[#7f2d22] shadow-sm transition-all duration-200 hover:bg-[#f4e7e4] hover:border-[#7f2016] hover:text-[#5c160f] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[2.5] transition-transform group-hover:rotate-90 duration-200" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* Total Catalog */}
        <div className="group relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-stone-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
              Total Catalog
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9c5247]/10 text-[#9c5247] transition-transform duration-200 group-hover:scale-110">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              {stats.total}
            </span>
            <span className="text-xs text-stone-500">in catalog</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
            <Tag className="h-3 w-3 text-stone-400" />
            <span>{categories.length} categories</span>
          </div>
        </div>

        {/* Live on Store */}
        <div className="group relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
              Live Storefront
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform duration-200 group-hover:scale-110">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700">
              {stats.active}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% live
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Visible to shoppers</span>
          </div>
        </div>

        {/* Featured Picks */}
        <div className="group relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-amber-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
              Featured Items
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform duration-200 group-hover:scale-110">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-800">
              {stats.featured}
            </span>
            <span className="text-xs text-stone-500">spotlighted</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <Sparkles className="h-3 w-3" />
            <span>Hero & homepage</span>
          </div>
        </div>

        {/* Inventory Watch */}
        <div className="group relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-rose-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
              Stock Watch
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${
                stats.outOfStock > 0 ? "bg-rose-50 text-rose-600" : "bg-stone-100 text-stone-600"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                stats.outOfStock > 0 ? "text-rose-700" : "text-stone-900"
              }`}
            >
              {stats.outOfStock}
            </span>
            <span className="text-xs text-stone-500">items flagged</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
            <span>Low or out of stock</span>
          </div>
        </div>
      </div>

      {/* ── Category Quick Pills ── */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
            selectedCategory === "all"
              ? "bg-[#9c5247] text-white shadow-sm"
              : "border border-stone-200/90 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
          }`}
        >
          <span>All Categories</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              selectedCategory === "all" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
            }`}
          >
            {products.length}
          </span>
        </button>

        {categories.map((category) => {
          const count = categoryCounts[category.id] || categoryCounts[category.slug] || 0;
          const isSelected = selectedCategory === category.id || selectedCategory === category.slug;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? "all" : category.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                isSelected
                  ? "bg-[#9c5247] text-white shadow-sm"
                  : "border border-stone-200/90 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
              }`}
            >
              <span>{category.name}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search, Filters & View Toggle Bar ── */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, slug, SKU, tag, fabric..."
              className="min-h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10 pr-9 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-[#9c5247] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c5247]/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stock Filter */}
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              aria-label="Filter by Stock"
              className="min-h-11 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition hover:border-stone-300 focus:border-[#9c5247] focus:outline-none focus:ring-2 focus:ring-[#9c5247]/15"
            >
              <option value="all">All Stock Status</option>
              <option value="in-stock">🟢 In Stock</option>
              <option value="low-stock">🟡 Low Stock</option>
              <option value="out-of-stock">🔴 Out of Stock</option>
            </select>

            {/* Visibility Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Visibility"
              className="min-h-11 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition hover:border-stone-300 focus:border-[#9c5247] focus:outline-none focus:ring-2 focus:ring-[#9c5247]/15"
            >
              <option value="all">All Visibility</option>
              <option value="active">Live on Store</option>
              <option value="disabled">Hidden / Draft</option>
            </select>

            {/* Badge Filter */}
            <select
              value={selectedBadge}
              onChange={(e) => setSelectedBadge(e.target.value)}
              aria-label="Filter by Badge"
              className="min-h-11 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition hover:border-stone-300 focus:border-[#9c5247] focus:outline-none focus:ring-2 focus:ring-[#9c5247]/15"
            >
              <option value="all">All Badges</option>
              <option value="featured">⭐ Featured</option>
              <option value="new">✨ New</option>
              <option value="sale">🏷️ Sale</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort products"
              className="min-h-11 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition hover:border-stone-300 focus:border-[#9c5247] focus:outline-none focus:ring-2 focus:ring-[#9c5247]/15"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="stock">Stock Issues First</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-white text-[#9c5247] shadow-sm"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Card Grid View"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-[#9c5247] shadow-sm"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3.5 text-xs font-semibold text-red-700 transition hover:bg-red-100/60"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results summary counter */}
        <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs text-stone-500">
          <span>
            Showing <strong className="text-stone-800">{filteredProducts.length}</strong> of{" "}
            <strong className="text-stone-800">{products.length}</strong> products
          </span>
          {hasActiveFilters && (
            <span className="text-[#9c5247] font-medium">Filtered active</span>
          )}
        </div>
      </div>

      {/* ── Content: Empty State ── */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
            <Package className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-stone-900">No products found</h2>
          <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "We couldn't find any products matching your active filters or search terms."
              : "You haven't added any products to your catalog yet."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800"
              >
                <X className="h-3.5 w-3.5" />
                <span>Clear Filters</span>
              </button>
            ) : (
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[#9c5247] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#854036]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Your First Product</span>
              </Link>
            )}
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* ── View Mode: Compact Responsive Table View ── */
        <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto md:table-fixed">
              <thead>
                <tr className="border-b border-stone-200/80 bg-stone-50/75">
                  <th className="w-[36%] min-w-[210px] px-3.5 sm:px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Product
                  </th>
                  <th className="w-[16%] min-w-[110px] px-2.5 sm:px-3 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Category
                  </th>
                  <th className="w-[14%] min-w-[95px] px-2.5 sm:px-3 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Pricing
                  </th>
                  <th className="w-[12%] min-w-[85px] px-2.5 sm:px-3 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Stock
                  </th>
                  <th className="w-[10%] min-w-[75px] px-2.5 sm:px-3 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Visibility
                  </th>
                  <th className="w-[12%] min-w-[100px] px-3.5 sm:px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-stone-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((product) => {
                  const image = getPrimaryImage(product);
                  const isFeatured = product.featured === true || product.badge === "featured";
                  const isDiscounted = product.oldPrice && product.price && product.oldPrice > product.price;
                  const discountPercent = isDiscounted
                    ? Math.round(((product.oldPrice! - product.price!) / product.oldPrice!) * 100)
                    : 0;
                  const isLive = product.active !== false;
                  const categoryName = (product.category?.name || product.categorySlug || "Uncategorized").replace(/-/g, " ");

                  return (
                    <tr
                      key={product.id}
                      className="group transition-colors duration-150 hover:bg-[#fbfaf8]"
                    >
                      {/* Product Column */}
                      <td className="px-3.5 sm:px-4 py-3">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          {/* Image Thumbnail (compact 48x48) */}
                          <div
                            onClick={() => setPreviewProduct(product)}
                            className="group/thumb relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-stone-200/90 bg-stone-100 shadow-xs"
                          >
                            {image ? (
                              <Image
                                src={image}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover object-center transition-transform duration-300 group-hover/thumb:scale-110"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-stone-400">
                                <ShoppingBag className="h-5 w-5 stroke-1" />
                              </div>
                            )}

                            {/* Badge overlay on image */}
                            {isFeatured && (
                              <span
                                title="Featured Product"
                                className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs"
                              >
                                <Star className="h-2 w-2 fill-current" />
                              </span>
                            )}
                            {product.badge === "new" && (
                              <span className="absolute left-0.5 bottom-0.5 rounded bg-emerald-600 px-1 py-0.2 text-[7px] font-bold uppercase tracking-wider text-white">
                                New
                              </span>
                            )}
                            {product.badge === "sale" && (
                              <span className="absolute left-0.5 bottom-0.5 rounded bg-rose-600 px-1 py-0.2 text-[7px] font-bold uppercase tracking-wider text-white">
                                Sale
                              </span>
                            )}
                          </div>

                          {/* Info strictly bounded */}
                          <div className="min-w-0 max-w-[170px] sm:max-w-[210px] md:max-w-[250px] lg:max-w-[320px]">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/admin/products/${product.id}/edit`}
                                title={product.name}
                                className="truncate font-semibold text-xs sm:text-sm text-stone-900 transition-colors hover:text-[#9c5247]"
                              >
                                {shortName(product.name, 34)}
                              </Link>
                              {isFeatured && (
                                <span className="hidden sm:inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700">
                                  <Sparkles className="h-2 w-2" />
                                  Featured
                                </span>
                              )}
                            </div>

                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone-400 truncate">
                              {product.sku ? (
                                <span className="font-mono text-stone-600 font-medium">
                                  SKU: {product.sku}
                                </span>
                              ) : (
                                <span className="font-mono truncate">
                                  /{product.slug.slice(0, 18)}{product.slug.length > 18 ? "…" : ""}
                                </span>
                              )}
                              {product.sizes && product.sizes.length > 0 && (
                                <>
                                  <span className="text-stone-300">·</span>
                                  <span className="text-stone-500 truncate">
                                    {product.sizes.slice(0, 3).join(", ")}
                                    {product.sizes.length > 3 ? "…" : ""}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-2.5 sm:px-3 py-3 align-middle">
                        <span
                          title={categoryName}
                          className="inline-block max-w-[110px] sm:max-w-[130px] truncate rounded-full bg-stone-100 px-2 sm:px-2.5 py-0.5 text-xs font-medium text-stone-700 capitalize whitespace-nowrap"
                        >
                          {categoryName}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="px-2.5 sm:px-3 py-3 align-middle whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs sm:text-sm text-stone-900">
                            {formatPrice(product.price, product.currency || "INR")}
                          </span>
                          {isDiscounted && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-stone-400 line-through">
                                {formatPrice(product.oldPrice, product.currency || "INR")}
                              </span>
                              <span className="rounded bg-rose-50 px-1 py-0.2 text-[9px] font-bold text-rose-700">
                                -{discountPercent}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Stock / Availability */}
                      <td className="px-2.5 sm:px-3 py-3 align-middle whitespace-nowrap">
                        {product.availability === "out-of-stock" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                            Out of stock
                          </span>
                        ) : product.availability === "low-stock" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Low stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            In stock
                          </span>
                        )}
                      </td>

                      {/* Visibility Toggle / Status */}
                      <td className="px-2.5 sm:px-3 py-3 align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggle(product)}
                          disabled={togglingId === product.id}
                          className={`group/status inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-all duration-200 ${
                            isLive
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                          } ${togglingId === product.id ? "opacity-50 cursor-wait" : ""}`}
                          title={`Click to ${isLive ? "hide" : "publish"} on storefront`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isLive ? "bg-emerald-500" : "bg-stone-400"
                            }`}
                          />
                          <span>{isLive ? "Live" : "Hidden"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 sm:px-4 py-3 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Live on Store */}
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View live storefront"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>

                          {/* Edit */}
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            title="Edit product"
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 text-xs font-semibold text-stone-700 transition hover:border-[#9c5247] hover:bg-[#9c5247]/5 hover:text-[#9c5247]"
                          >
                            <Pencil className="h-3 w-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            title="Delete product"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── View Mode: High-Fashion Card Grid ── */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const image = getPrimaryImage(product);
            const isFeatured = product.featured === true || product.badge === "featured";
            const isDiscounted = product.oldPrice && product.price && product.oldPrice > product.price;
            const discountPercent = isDiscounted
              ? Math.round(((product.oldPrice! - product.price!) / product.oldPrice!) * 100)
              : 0;
            const isLive = product.active !== false;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs transition-all duration-300 hover:border-stone-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Product Image Box */}
                <div
                  onClick={() => setPreviewProduct(product)}
                  className="relative aspect-[4/5] w-full cursor-pointer overflow-hidden bg-stone-100"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-300">
                      <ShoppingBag className="h-12 w-12 stroke-1" />
                    </div>
                  )}

                  {/* Gradient shadow overlay for chips */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/25 pointer-events-none" />

                  {/* Top-left floating chips */}
                  <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                    {product.category?.name && (
                      <span className="rounded-full bg-white/90 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-stone-800 shadow-sm">
                        {product.category.name}
                      </span>
                    )}
                    {isFeatured && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/95 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Top-right floating visibility pill */}
                  <div className="absolute right-3 top-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-md ${
                        isLive ? "bg-emerald-500/90 text-white" : "bg-black/60 text-white/80"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-white" : "bg-stone-400"}`} />
                      {isLive ? "Live" : "Draft"}
                    </span>
                  </div>

                  {/* Bottom stock pill */}
                  <div className="absolute bottom-3 left-3">
                    {product.availability === "out-of-stock" ? (
                      <span className="rounded-md bg-rose-600/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Out of stock
                      </span>
                    ) : product.availability === "low-stock" ? (
                      <span className="rounded-md bg-amber-600/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Low stock
                      </span>
                    ) : (
                      <span className="rounded-md bg-emerald-600/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        In stock
                      </span>
                    )}
                  </div>

                  {/* Discount chip bottom right */}
                  {isDiscounted && (
                    <div className="absolute bottom-3 right-3">
                      <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-rose-600 shadow-sm">
                        -{discountPercent}% OFF
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-4">
                  {/* Title & SKU */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="font-semibold text-stone-900 transition-colors hover:text-[#9c5247] line-clamp-1"
                      >
                        {product.name}
                      </Link>
                    </div>

                    <p className="mt-0.5 text-xs text-stone-400 truncate">
                      /{product.slug}
                      {product.sku ? ` · ${product.sku}` : ""}
                    </p>

                    {/* Sizes chips */}
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1">
                        {product.sizes.map((size) => (
                          <span
                            key={size}
                            className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[9px] font-bold text-stone-600"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price Row */}
                  <div className="mt-3.5 flex items-baseline justify-between border-t border-stone-100 pt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-stone-900">
                        {formatPrice(product.price, product.currency || "INR")}
                      </span>
                      {isDiscounted && (
                        <span className="text-xs text-stone-400 line-through">
                          {formatPrice(product.oldPrice, product.currency || "INR")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-3.5 grid grid-cols-4 gap-1.5 border-t border-stone-100 pt-3">
                    {/* View Live */}
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View live storefront page"
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>

                    {/* Edit */}
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      title="Edit product"
                      className="col-span-2 inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 transition hover:border-[#9c5247] hover:bg-[#9c5247]/5 hover:text-[#9c5247]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Link>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      title="Delete product"
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick Product Preview Modal ── */}
      {previewProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <div>
                <h3 className="font-display text-xl font-semibold text-stone-900">
                  {previewProduct.name}
                </h3>
                <p className="text-xs text-stone-400">/{previewProduct.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5">
              {/* Image Gallery */}
              {(() => {
                const images = getAllImages(previewProduct);
                if (images.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                      Product Media ({images.length})
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                        >
                          <Image
                            src={img}
                            alt={`${previewProduct.name} image ${idx + 1}`}
                            fill
                            sizes="150px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-stone-50 p-4 text-xs">
                <div>
                  <span className="text-stone-400">Price</span>
                  <p className="text-sm font-bold text-stone-900 mt-0.5">
                    {formatPrice(previewProduct.price, previewProduct.currency || "INR")}
                    {previewProduct.oldPrice ? (
                      <span className="ml-2 text-xs font-normal text-stone-400 line-through">
                        {formatPrice(previewProduct.oldPrice, previewProduct.currency || "INR")}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div>
                  <span className="text-stone-400">Category</span>
                  <p className="font-semibold text-stone-800 mt-0.5">
                    {previewProduct.category?.name || previewProduct.categorySlug || "Uncategorized"}
                  </p>
                </div>
                <div>
                  <span className="text-stone-400">Availability</span>
                  <p className="font-semibold text-stone-800 mt-0.5 capitalize">
                    {previewProduct.availability || "in-stock"}
                  </p>
                </div>
                <div>
                  <span className="text-stone-400">Status</span>
                  <p className="font-semibold text-stone-800 mt-0.5">
                    {previewProduct.active !== false ? "Live on Storefront" : "Hidden / Draft"}
                  </p>
                </div>
                {previewProduct.sku && (
                  <div>
                    <span className="text-stone-400">SKU</span>
                    <p className="font-mono text-stone-800 mt-0.5">{previewProduct.sku}</p>
                  </div>
                )}
                {previewProduct.sizes && previewProduct.sizes.length > 0 && (
                  <div>
                    <span className="text-stone-400">Sizes</span>
                    <p className="font-semibold text-stone-800 mt-0.5">
                      {previewProduct.sizes.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              {previewProduct.shortDescription && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Summary
                  </span>
                  <p className="mt-1 text-sm text-stone-600 leading-relaxed">
                    {previewProduct.shortDescription}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-6 py-3.5">
              <Link
                href={`/products/${previewProduct.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in Storefront</span>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewProduct(null)}
                  className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Close
                </button>
                <Link
                  href={`/admin/products/${previewProduct.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#9c5247] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#854036]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit Product</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
