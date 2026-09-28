"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  FolderTree,
  Plus,
  Search,
  LayoutGrid,
  List,
  ExternalLink,
  Pencil,
  Trash2,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  Eye,
  CornerDownRight,
  Sparkles,
  Compass,
  ArrowRight,
  RefreshCw,
  X,
} from "lucide-react";
import type { CategoryRecord, DiscoveryMenuEntryRecord } from "@/lib/admin/types";
import { deleteCategoryAction, toggleCategoryAction } from "@/actions/admin/categories";
import { adminActionMessage } from "@/lib/admin/errors";
import { DiscoveryMenuEditor } from "./DiscoveryMenuEditor";

interface CategoriesManagerProps {
  categories: CategoryRecord[];
  discovery: DiscoveryMenuEntryRecord[];
}

export function CategoriesManager({ categories: initialCategories, discovery }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<CategoryRecord[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Category Map
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Tree Hierarchy Ordering
  const orderedTree = useMemo(() => {
    const byParent = new Map<string | null, CategoryRecord[]>();
    for (const category of categories) {
      const key = category.parentId ?? null;
      byParent.set(key, [...(byParent.get(key) ?? []), category]);
    }

    const result: Array<{
      category: CategoryRecord;
      depth: number;
      parentName?: string;
    }> = [];

    const walk = (parentId: string | null, depth: number) => {
      const children = byParent.get(parentId) ?? [];
      // Sort by sortOrder
      children.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      for (const cat of children) {
        const parent = cat.parentId ? categoryMap.get(cat.parentId) : undefined;
        result.push({
          category: cat,
          depth,
          parentName: parent?.name,
        });
        walk(cat.id, depth + 1);
      }
    };

    walk(null, 0);

    // Append any orphaned or disconnected categories
    for (const cat of categories) {
      if (!result.some((entry) => entry.category.id === cat.id)) {
        result.push({ category: cat, depth: 0 });
      }
    }

    return result;
  }, [categories, categoryMap]);

  // KPIs
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.active !== false).length;
    const totalProducts = categories.reduce((sum, c) => sum + (c.productCount ?? 0), 0);
    const rootCount = categories.filter((c) => !c.parentId).length;
    return { total, active, totalProducts, rootCount };
  }, [categories]);

  // Filtered entries
  const filteredTree = useMemo(() => {
    return orderedTree.filter(({ category, parentName }) => {
      const isActive = category.active !== false;
      if (selectedStatus === "active" && !isActive) return false;
      if (selectedStatus === "inactive" && isActive) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = category.name.toLowerCase().includes(q);
        const matchesSlug = category.slug.toLowerCase().includes(q);
        const matchesParent = parentName?.toLowerCase().includes(q);
        return matchesName || matchesSlug || matchesParent;
      }

      return true;
    });
  }, [orderedTree, selectedStatus, search]);

  // Toggle Category Active Status
  const handleToggleActive = (id: string, currentActive: boolean) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        formData.set("active", String(!currentActive));
        await toggleCategoryAction(formData);

        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, active: !currentActive } : c))
        );
        toast.success(!currentActive ? "Category published." : "Category set to draft.");
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not update status."));
      } finally {
        setPendingId(null);
      }
    });
  };

  // Delete Category
  const handleDeleteCategory = (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? Products in this collection will become uncategorised.`
      )
    )
      return;

    setPendingId(id);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        await deleteCategoryAction(formData);

        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success(`Category "${name}" deleted.`);
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not delete category."));
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#9c5247] to-[#7f4037] text-white shadow-md shadow-[#9c5247]/20">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-sans">
                Categories & Collections
              </h1>
              <p className="text-xs sm:text-sm text-stone-500">
                Organise storefront taxonomy, parent-child hierarchies, and catalog discovery.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-4 py-2.5 text-xs font-bold text-[#7f2d22] shadow-2xs hover:bg-[#f4e7e4] hover:border-[#7f2016] hover:text-[#5c160f] active:scale-95 transition"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Category</span>
          </Link>
        </div>
      </div>

      {/* ── Top Metric KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {/* Total Categories */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Categories
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#9c5247]/10 text-[#9c5247]">
              <FolderTree className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 font-sans">
              {stats.total}
            </span>
            <span className="text-xs text-stone-400 font-medium">defined</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {stats.rootCount} root collections
          </div>
        </div>

        {/* Active Published */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Published & Active
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700 font-sans">
              {stats.active}
            </span>
            <span className="text-xs text-emerald-600 font-medium">live on store</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            Visible in navigation & filters
          </div>
        </div>

        {/* Catalog Products */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Assigned Products
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 font-sans">
              {stats.totalProducts}
            </span>
            <span className="text-xs text-stone-400 font-medium">catalog items</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            Linked to categories
          </div>
        </div>

        {/* Discovery Links */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Discovery Nav Links
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-purple-700 font-sans">
              {discovery.length}
            </span>
            <span className="text-xs text-stone-400 font-medium">menu links</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            Featured discovery shortcuts
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls Bar ── */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category name, slug, or parent..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-[#9c5247] focus:bg-white focus:ring-2 focus:ring-[#9c5247]/15"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status & View Switcher */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none transition hover:border-stone-300 focus:border-[#9c5247]"
            >
              <option value="all">All Categories ({categories.length})</option>
              <option value="active">Active ({stats.active})</option>
              <option value="inactive">Draft / Disabled ({categories.length - stats.active})</option>
            </select>

            <div className="flex items-center rounded-xl border border-stone-200 bg-stone-100 p-0.5">
              <button
                onClick={() => setViewMode("table")}
                title="Hierarchy Table View"
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "table"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                title="Grid Cards View"
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "grid"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
          <span>
            Showing <strong className="text-stone-900 font-semibold">{filteredTree.length}</strong> of{" "}
            {categories.length} categories
          </span>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[#9c5247] hover:underline font-medium text-[11px]"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* ── Table Hierarchy View ── */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs">
          {filteredTree.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <FolderTree className="h-7 w-7" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-stone-900">No categories found</h3>
              <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
                Try adjusting your search query or create a new category to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-5 py-3.5">Category & Hierarchy</th>
                    <th className="px-5 py-3.5">Slug URL</th>
                    <th className="px-5 py-3.5">Catalog Products</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right min-w-[200px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredTree.map(({ category, depth, parentName }) => {
                    const isActive = category.active !== false;
                    const isBusy = isPending && pendingId === category.id;

                    return (
                      <tr
                        key={category.id}
                        className="group hover:bg-stone-50/60 transition-colors"
                      >
                        {/* Name & Hierarchy */}
                        <td className="px-5 py-3.5">
                          <div
                            className="flex items-center gap-3"
                            style={{ paddingLeft: depth ? `${depth * 24}px` : "0px" }}
                          >
                            {depth > 0 && (
                              <CornerDownRight className="h-4 w-4 text-stone-400 shrink-0 stroke-[2]" />
                            )}

                            {/* Image Thumbnail */}
                            <div className="relative h-10 w-10 rounded-xl border border-stone-200 bg-stone-100 overflow-hidden shrink-0 shadow-2xs">
                              {category.image ? (
                                <Image
                                  src={category.image}
                                  alt={category.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-stone-400">
                                  <FolderTree className="h-4 w-4" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-sm truncate">
                                  {category.name}
                                </span>
                                {depth === 0 && (
                                  <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
                                    Root
                                  </span>
                                )}
                              </div>
                              {parentName && (
                                <span className="text-[11px] text-stone-400 block truncate">
                                  Child of: <strong className="text-stone-600">{parentName}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="px-5 py-3.5">
                          <span className="rounded-md bg-stone-50 border border-stone-200 px-2 py-1 font-mono text-[11px] text-stone-700">
                            /collections/{category.slug}
                          </span>
                        </td>

                        {/* Product Count */}
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-800">
                            <Package className="h-3.5 w-3.5 text-stone-500" />
                            {category.productCount ?? 0} {category.productCount === 1 ? "item" : "items"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              isActive
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-stone-100 text-stone-600 border-stone-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isActive ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
                              }`}
                            />
                            {isActive ? "Published" : "Draft"}
                          </span>
                        </td>

                        {/* Action Buttons (High Contrast, Clearly Visible) */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Edit Button */}
                            <Link
                              href={`/admin/categories/${category.id}/edit`}
                              title="Edit Category Details"
                              className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:border-[#9c5247] hover:text-[#9c5247] transition active:scale-95"
                            >
                              <Pencil className="h-3 w-3" />
                              <span>Edit</span>
                            </Link>

                            {/* Toggle Publish / Draft */}
                            <button
                              type="button"
                              onClick={() => handleToggleActive(category.id, isActive)}
                              disabled={isBusy}
                              title={isActive ? "Set to draft" : "Publish on storefront"}
                              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer ${
                                isActive
                                  ? "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                                  : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              }`}
                            >
                              {isBusy ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <span>{isActive ? "Disable" : "Publish"}</span>
                              )}
                            </button>

                            {/* View on Storefront */}
                            <Link
                              href={`/collections/${category.slug}`}
                              target="_blank"
                              title="View on Storefront"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-2xs hover:text-[#9c5247] hover:border-stone-300 transition"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              disabled={isBusy}
                              title="Delete Category"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-700 shadow-2xs hover:bg-rose-50 transition active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Grid Cards View ── */}
      {viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTree.map(({ category, depth, parentName }) => {
            const isActive = category.active !== false;
            const isBusy = isPending && pendingId === category.id;

            return (
              <div
                key={category.id}
                className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs transition hover:shadow-md hover:border-stone-300 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar with Thumbnail & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-12 w-12 rounded-xl border border-stone-200 bg-stone-100 overflow-hidden shrink-0 shadow-2xs">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-400">
                            <FolderTree className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-stone-900 text-sm truncate">
                          {category.name}
                        </h3>
                        <p className="font-mono text-[11px] text-stone-400 truncate">
                          /{category.slug}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold shrink-0 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-stone-100 text-stone-600 border-stone-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? "bg-emerald-500" : "bg-stone-400"
                        }`}
                      />
                      {isActive ? "Live" : "Draft"}
                    </span>
                  </div>

                  {/* Subtitle / Parent info */}
                  <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span>
                      {parentName ? `Sub of ${parentName}` : "Root Collection"}
                    </span>
                    <span className="font-semibold text-stone-800 flex items-center gap-1">
                      <Package className="h-3.5 w-3.5 text-stone-400" />
                      {category.productCount ?? 0} items
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/collections/${category.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-[#9c5247] transition font-medium"
                  >
                    <span>Storefront</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/categories/${category.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 shadow-2xs hover:border-[#9c5247] hover:text-[#9c5247] transition"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      disabled={isBusy}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-700 shadow-2xs hover:bg-rose-50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Storefront Discovery Navigation Section ── */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-2xs">
        <DiscoveryMenuEditor entries={discovery} categories={categories} />
      </div>
    </div>
  );
}
