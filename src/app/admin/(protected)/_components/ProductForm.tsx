"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Star,
  Package,
  IndianRupee,
  AlertCircle,
  Image as ImageIcon,
  Globe,
  RefreshCw,
  Check,
} from "lucide-react";
import type { CategoryRecord, ProductRecord } from "@/lib/admin/types";
import { adminActionMessage } from "@/lib/admin/errors";
import { saveProductAction } from "@/actions/admin/products";
import { ProductImagesUpload } from "@/components/admin/ProductImagesUpload";
import { MediaUpload } from "@/components/admin/MediaUpload";

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm text-stone-900 placeholder-stone-400 outline-none transition-all focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/15 disabled:bg-stone-50 disabled:text-stone-400";

const textareaClass =
  "mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition-all focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/15";

const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const COMMON_TAGS = [
  "Banarasi",
  "Handloom",
  "Dupion Silk",
  "Kora Tissue",
  "Zari Weave",
  "Floral",
  "Festive",
  "Wedding",
  "Party Wear",
  "Casual",
];

function imageUrls(product?: ProductRecord) {
  return (product?.images || [])
    .map((image) => (typeof image === "string" ? image : image.url))
    .join("\n");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductRecord;
  categories: CategoryRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Controlled states for live interactions
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!product);
  const [price, setPrice] = useState<string>(
    product?.price !== null && product?.price !== undefined ? String(product.price) : ""
  );
  const [oldPrice, setOldPrice] = useState<string>(
    product?.oldPrice !== null && product?.oldPrice !== undefined ? String(product.oldPrice) : ""
  );
  const [active, setActive] = useState(product?.active !== false);
  const [featured, setFeatured] = useState(product?.featured === true);
  const [badge, setBadge] = useState<string>(product?.badge || "");
  const [sizes, setSizes] = useState<string>((product?.sizes || []).join(", "));
  const [tags, setTags] = useState<string>((product?.tags || []).join(", "));

  // Live discount calculation
  const numericPrice = Number(price) || 0;
  const numericOldPrice = Number(oldPrice) || 0;
  const isDiscounted = numericOldPrice > 0 && numericPrice > 0 && numericOldPrice > numericPrice;
  const discountPercent = isDiscounted
    ? Math.round(((numericOldPrice - numericPrice) / numericOldPrice) * 100)
    : 0;
  const discountSavings = isDiscounted ? numericOldPrice - numericPrice : 0;
  const hasPriceError = numericOldPrice > 0 && numericOldPrice < numericPrice;

  // Handle name change with auto-slug
  const handleNameChange = (val: string) => {
    setName(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  // Toggle size chip
  const toggleSizeChip = (size: string) => {
    const currentList = sizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = currentList.includes(size);
    const updated = exists ? currentList.filter((s) => s !== size) : [...currentList, size];
    setSizes(updated.join(", "));
  };

  // Toggle tag chip
  const toggleTagChip = (tag: string) => {
    const currentList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const exists = currentList.includes(tag);
    const updated = exists ? currentList.filter((t) => t !== tag) : [...currentList, tag];
    setTags(updated.join(", "));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const p = Number(data.get("price") || 0);
    const opRaw = data.get("oldPrice");
    const op = opRaw && String(opRaw).trim() !== "" ? Number(opRaw) : null;

    if (op !== null && op < p) {
      toast.error(`MRP / Old Price (₹${op}) must be greater than Selling Price (₹${p}).`);
      return;
    }

    startTransition(async () => {
      try {
        await saveProductAction(data);
        toast.success(
          product ? `"${name || "Product"}" updated successfully.` : "Product created successfully."
        );
        if (!product) router.push("/admin/products");
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not save the product. Please check fields and retry."));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {/* ── Top Floating Navigation & Save Action Bar ── */}
      <div className="sticky top-0 z-30 -mt-2 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#f7f5f2]/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
              title="Back to Products"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-400">Products /</span>
                <span className="text-xs font-bold text-stone-700 truncate max-w-[200px] sm:max-w-xs">
                  {name || (product ? "Edit Product" : "New Product")}
                </span>
                {active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
                    Draft
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {product?.slug && (
              <Link
                href={`/products/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 hover:text-stone-900"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Live</span>
              </Link>
            )}

            <Link
              href="/admin/products"
              className="inline-flex items-center rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#9c5247] to-[#7f4037] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-[#89443a] hover:to-[#6c342c] hover:shadow-md disabled:cursor-wait disabled:opacity-70 active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>{product ? "Save Changes" : "Publish Product"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 max-w-7xl mx-auto">
        {/* ── Left Column (Main Information) ── */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card: Basic Information */}
          <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-900">Basic Information</h2>
                <p className="text-xs text-stone-500">Title, URL slug, and customer-facing descriptions</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Heritage Red Kora Tissue Banarasi Saree"
                  className={inputClass}
                />
              </div>

              {/* Slug with Auto-Generator */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Storefront URL Slug <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSlug(!autoSlug);
                      if (!autoSlug) setSlug(slugify(name));
                    }}
                    className={`text-[11px] font-semibold transition ${
                      autoSlug ? "text-[#9c5247]" : "text-stone-400 hover:text-stone-600"
                    }`}
                  >
                    {autoSlug ? "✓ Auto-sync with title" : "Manual slug"}
                  </button>
                </div>
                <div className="relative mt-1.5 flex items-center">
                  <span className="pointer-events-none absolute left-3.5 text-xs text-stone-400 font-mono">
                    /products/
                  </span>
                  <input
                    name="slug"
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    value={slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                    placeholder="product-url-slug"
                    className={`${inputClass} pl-[82px] font-mono text-xs`}
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Short Summary / Highlight
                </label>
                <textarea
                  name="shortDescription"
                  rows={2}
                  defaultValue={product?.shortDescription || ""}
                  placeholder="A concise 1-2 sentence highlight shown in quick views and summary cards..."
                  className={`${textareaClass} min-h-20`}
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Full Description & Story
                </label>
                <textarea
                  name="description"
                  rows={5}
                  defaultValue={product?.description || ""}
                  placeholder="Describe the weave, occasion, craftsmanship, feel, and styling inspirations..."
                  className={`${textareaClass} min-h-32`}
                />
              </div>
            </div>
          </div>

          {/* Card: Pricing & Inventory */}
          <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-stone-900">Pricing & Availability</h2>
                  <p className="text-xs text-stone-500">Retail price, compare-at MRP discount, and inventory state</p>
                </div>
              </div>

              {isDiscounted && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  <Sparkles className="h-3 w-3" />
                  Save ₹{discountSavings.toLocaleString("en-IN")} ({discountPercent}% OFF)
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Selling Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Selling Price <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5 flex items-center">
                  <span className="pointer-events-none absolute left-3.5 text-xs font-bold text-stone-400">
                    ₹
                  </span>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="4999"
                    className={`${inputClass} pl-8 font-bold text-stone-900`}
                  />
                </div>
              </div>

              {/* MRP / Old Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Compare MRP <span className="text-[10px] font-normal text-stone-400">(Optional)</span>
                </label>
                <div className="relative mt-1.5 flex items-center">
                  <span className="pointer-events-none absolute left-3.5 text-xs font-bold text-stone-400">
                    ₹
                  </span>
                  <input
                    name="oldPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    placeholder="8999"
                    className={`${inputClass} pl-8 text-stone-700`}
                  />
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Stock Status
                </label>
                <select
                  name="availability"
                  defaultValue={product?.availability || "in-stock"}
                  className={inputClass}
                >
                  <option value="in-stock">🟢 In Stock</option>
                  <option value="low-stock">🟡 Low Stock</option>
                  <option value="out-of-stock">🔴 Out of Stock</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Currency
                </label>
                <input
                  name="currency"
                  maxLength={3}
                  defaultValue={product?.currency || "INR"}
                  className={`${inputClass} uppercase font-bold text-stone-600 text-center`}
                />
              </div>
            </div>

            {hasPriceError && (
              <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Compare-at MRP (₹{numericOldPrice}) cannot be lower than Selling Price (₹{numericPrice}).
                </span>
              </div>
            )}
          </div>

          {/* Card: Media & Assets */}
          <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-900">Product Photography & Video</h2>
                <p className="text-xs text-stone-500">
                  Upload primary image gallery, hover preview swap, and demonstration video
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-6">
              {/* Primary Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Primary Image Gallery
                  </span>
                  <span className="text-[11px] text-stone-400">First image is used as product thumbnail</span>
                </div>
                <ProductImagesUpload name="images" defaultValue={imageUrls(product)} />
              </div>

              {/* 2-Column: Hover Image & Video */}
              <div className="border-t border-stone-100 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
                  Interactive Media (Hover Swap & Video)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg">
                  <div className="rounded-xl border border-stone-200 p-3.5 bg-stone-50/50">
                    <MediaUpload
                      name="hoverImage"
                      label="Shop Hover Image"
                      defaultValue={product?.hoverImage || ""}
                      folder="khadeeja/products"
                      aspectClassName="aspect-9/16"
                    />
                    <p className="mt-2 text-[10px] text-stone-400">Swaps smoothly on shop grid mouse hover</p>
                  </div>

                  <div className="rounded-xl border border-stone-200 p-3.5 bg-stone-50/50">
                    <MediaUpload
                      name="video"
                      label="Video Reel (MP4)"
                      defaultValue={product?.video || ""}
                      folder="khadeeja/products"
                      aspectClassName="aspect-9/16"
                    />
                    <p className="mt-2 text-[10px] text-stone-400">Plays video loop on product page</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: SEO Optimization */}
          <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-900">Search Engine Listing (SEO)</h2>
                <p className="text-xs text-stone-500">Control how this piece ranks and looks on Google searches</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Google Search Preview */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Google Search Snippet Preview
                </span>
                <p className="text-xs text-blue-800 font-medium truncate">
                  https://khadeejaempire.com/products/{slug || "product-slug"}
                </p>
                <h4 className="text-sm font-semibold text-blue-900 hover:underline mt-0.5 cursor-pointer line-clamp-1">
                  {product?.seo?.title || name || "Product Name — Khadeeja Empire"}
                </h4>
                <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                  {product?.seo?.description ||
                    product?.shortDescription ||
                    "Shop authentic handcrafted Banarasi sarees, ethnic co-ords, and luxury Indian womenswear at Khadeeja Empire."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    SEO Meta Title
                  </label>
                  <input
                    name="seoTitle"
                    defaultValue={product?.seo?.title || ""}
                    placeholder="e.g. Royal Midnight Blue Saree | Khadeeja Empire"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    SEO Meta Keywords
                  </label>
                  <input
                    name="seoKeywords"
                    defaultValue={(product?.seo?.keywords || []).join(", ")}
                    placeholder="Banarasi saree, Dupion silk, zari, ethnic..."
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    SEO Meta Description
                  </label>
                  <textarea
                    name="seoDescription"
                    rows={2}
                    defaultValue={product?.seo?.description || ""}
                    placeholder="Engaging summary for search engines (around 150-160 characters)..."
                    className={`${textareaClass} min-h-20`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column (Sidebar: Status & Organization) ── */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card: Publishing Status */}
          <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 pb-3 border-b border-stone-100">
              Publishing & Visibility
            </h3>

            <div className="mt-4 space-y-4">
              {/* Storefront Active Toggle */}
              <label className="flex items-start justify-between gap-3 cursor-pointer p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">
                    Published on Storefront
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    {active ? "Live & purchasable by shoppers" : "Hidden from search and catalog"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  name="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-5 w-5 rounded-md accent-[#9c5247] cursor-pointer mt-0.5"
                />
              </label>

              {/* Featured Toggle */}
              <label className="flex items-start justify-between gap-3 cursor-pointer p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    <span className="text-xs font-bold text-stone-900">Featured Pick</span>
                  </div>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    Highlight in Homepage Hero & curated showcases
                  </span>
                </div>
                <input
                  type="checkbox"
                  name="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-5 w-5 rounded-md accent-[#9c5247] cursor-pointer mt-0.5"
                />
              </label>

              {/* Badge Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Promotional Badge
                </label>
                <select
                  name="badge"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className={inputClass}
                >
                  <option value="">None (Standard)</option>
                  <option value="new">✨ New Arrival</option>
                  <option value="featured">⭐ Featured</option>
                  <option value="sale">🏷️ On Sale</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card: Categorization & Stock Keeping */}
          <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 pb-3 border-b border-stone-100">
              Organization
            </h3>

            <div className="mt-4 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Category
                </label>
                <select
                  name="categoryId"
                  defaultValue={product?.categoryId || ""}
                  className={inputClass}
                >
                  <option value="">Uncategorised</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  name="sku"
                  defaultValue={product?.sku || ""}
                  placeholder="e.g. KE-SAR-037"
                  className={`${inputClass} font-mono`}
                />
              </div>

              {/* Sizes with Quick Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Sizes Available
                </label>
                <input
                  name="sizes"
                  value={sizes}
                  onChange={(e) => setSizes(e.target.value)}
                  placeholder="XS, S, M, L, XL"
                  className={inputClass}
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {COMMON_SIZES.map((size) => {
                    const isSelected = sizes
                      .split(",")
                      .map((s) => s.trim())
                      .includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSizeChip(size)}
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition ${
                          isSelected
                            ? "bg-[#9c5247] text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags with Quick Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Tags & Attributes
                </label>
                <input
                  name="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Banarasi, Silk, Zari, Festive"
                  className={inputClass}
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {COMMON_TAGS.map((tag) => {
                    const isSelected = tags
                      .split(",")
                      .map((t) => t.trim())
                      .includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTagChip(tag)}
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition ${
                          isSelected
                            ? "bg-stone-800 text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        +{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Bottom Action Summary */}
          <div className="rounded-2xl border border-stone-200/90 bg-stone-50/60 p-4 text-xs text-stone-500 space-y-2">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="font-semibold text-stone-800">{active ? "Active" : "Draft"}</span>
            </div>
            {product?.createdAt && (
              <div className="flex items-center justify-between">
                <span>Created</span>
                <span className="font-mono text-stone-600">
                  {new Date(product.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-200">
              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#9c5247] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#854036] transition disabled:opacity-50"
              >
                {isPending ? "Saving changes…" : product ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
