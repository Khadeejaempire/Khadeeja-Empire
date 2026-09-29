"use client";

import { useState, useRef } from "react";
import { Palette, Layers, Plus, Trash2, Pipette } from "lucide-react";
import type { ProductColorRecord, ProductVariantRecord } from "@/lib/admin/types";
import {
  deleteProductColorAction,
  deleteProductVariantAction,
  saveProductColorAction,
  saveProductVariantAction,
} from "@/actions/admin/products";

const inputClass =
  "min-h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-900 placeholder-stone-400 outline-none transition focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/15";

const PRESET_COLORS = [
  { name: "Crimson Red", hex: "#a31d1d" },
  { name: "Banarasi Pink", hex: "#e05275" },
  { name: "Royal Navy", hex: "#1b2a4a" },
  { name: "Emerald Green", hex: "#0f5132" },
  { name: "Golden Mustard", hex: "#d4a017" },
  { name: "Deep Wine", hex: "#581845" },
  { name: "Terracotta", hex: "#9c5247" },
  { name: "Ivory White", hex: "#faf6ef" },
  { name: "Charcoal Black", hex: "#1c1917" },
  { name: "Teal Green", hex: "#008080" },
  { name: "Dusty Peach", hex: "#e39a7e" },
  { name: "Royal Purple", hex: "#6b2d5c" },
];

export function ProductOptionsEditor({
  productId,
  colors: rawColors = [],
  variants: rawVariants = [],
}: {
  productId: string;
  colors?: ProductColorRecord[];
  variants?: ProductVariantRecord[];
}) {
  const colors = Array.isArray(rawColors) ? rawColors : [];
  const variants = Array.isArray(rawVariants) ? rawVariants : [];
  const [selectedHex, setSelectedHex] = useState("#8f4338");
  const [colorName, setColorName] = useState("");
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPreset = (e: React.MouseEvent, preset: { name: string; hex: string }) => {
    e.preventDefault();
    e.stopPropagation();
    const hex = preset.hex.toLowerCase();
    setSelectedHex(hex);
    setColorName(preset.name);
  };

  const handleOpenColorPicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (colorInputRef.current) {
      if (typeof colorInputRef.current.showPicker === "function") {
        colorInputRef.current.showPicker();
      } else {
        colorInputRef.current.click();
      }
    }
  };

  // Safe 7-char lowercase hex for native input[type="color"]
  const safeColorValue =
    selectedHex.startsWith("#") && selectedHex.length === 7
      ? selectedHex.toLowerCase()
      : "#8f4338";

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
          <Palette className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-stone-900">Colours & Product Variants</h2>
          <p className="text-xs text-stone-500">
            Define specific colorways, sizes, SKU barcodes, inventory stock, and variant pricing
          </p>
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-2">
        {/* ── Left Column: Colours ── */}
        <div className="rounded-2xl border border-stone-200/90 bg-stone-50/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#9c5247]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Colourways ({colors.length})
              </h3>
            </div>
          </div>

          {/* Color List */}
          <div className="space-y-2">
            {colors.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-2">No custom colors defined yet.</p>
            ) : (
              colors.map((color) => (
                <div
                  key={color.id}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3 shadow-2xs transition hover:border-stone-300"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-6 w-6 rounded-full border border-black/10 shadow-inner shrink-0"
                      style={{ backgroundColor: color.hex || "#ffffff" }}
                    />
                    <div>
                      <span className="text-xs font-semibold text-stone-900 block">{color.name}</span>
                      {color.hex && (
                        <span className="font-mono text-[10px] text-stone-400 uppercase">
                          {color.hex}
                        </span>
                      )}
                    </div>
                  </div>

                  <form action={deleteProductColorAction}>
                    <input type="hidden" name="id" value={color.id} />
                    <button
                      type="submit"
                      title="Remove colour"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-700 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>

          {/* Add Color Form */}
          <form
            action={saveProductColorAction}
            className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                + Add New Colour
              </span>
              <span className="text-[10px] text-stone-400">Click circle to open color wheel</span>
            </div>

            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="active" value="true" />
            <input type="hidden" name="sortOrder" value={colors.length} />

            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              {/* Color Name Input */}
              <div className="flex-1">
                <input
                  className={inputClass}
                  name="name"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  required
                  placeholder="Colour name (e.g. Midnight Blue)"
                />
              </div>

              {/* Color Picker Swatch & Hex input */}
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 px-2.5 py-1 min-h-10 shrink-0">
                {/* Visual Clickable Color Circle with showPicker trigger */}
                <button
                  type="button"
                  onClick={handleOpenColorPicker}
                  title="Click to open color wheel"
                  className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/20 shadow-sm transition-transform hover:scale-110 active:scale-95"
                  style={{ backgroundColor: safeColorValue }}
                >
                  <Pipette className="h-3.5 w-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none" />
                </button>

                {/* Hidden native color input */}
                <input
                  ref={colorInputRef}
                  type="color"
                  value={safeColorValue}
                  onChange={(e) => {
                    const hex = e.target.value.toLowerCase();
                    setSelectedHex(hex);
                    const matched = PRESET_COLORS.find((p) => p.hex.toLowerCase() === hex);
                    if (matched && !colorName) {
                      setColorName(matched.name);
                    }
                  }}
                  className="sr-only"
                  tabIndex={-1}
                />

                {/* Hex Code Input */}
                <input
                  className="w-18 bg-transparent text-xs font-mono font-semibold uppercase text-stone-800 outline-none"
                  name="hex"
                  value={selectedHex}
                  onChange={(e) => setSelectedHex(e.target.value)}
                  placeholder="#HEX"
                />
              </div>

              {/* Add Button */}
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#9c5247] px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#854036] transition active:scale-95 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Quick Preset Palette */}
            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Quick shades:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_COLORS.map((preset) => {
                  const isSelected = selectedHex.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={(e) => handleSelectPreset(e, preset)}
                      title={`${preset.name} (${preset.hex})`}
                      className={`group relative flex h-6 w-6 items-center justify-center rounded-full border border-black/15 transition-transform hover:scale-125 active:scale-90 cursor-pointer ${
                        isSelected ? "ring-2 ring-[#9c5247] ring-offset-2 scale-110 shadow-sm" : ""
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    >
                      {isSelected && (
                        <span className="block h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                      )}
                      <span className="sr-only">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* ── Right Column: Variants ── */}
        <div className="rounded-2xl border border-stone-200/90 bg-stone-50/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#9c5247]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Size / Stock Variants ({variants.length})
              </h3>
            </div>
          </div>

          {/* Variants List */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {variants.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-2">No variants created yet.</p>
            ) : (
              variants.map((variant) => {
                const assignedColor = colors.find((c) => c.id === variant.colorId);
                return (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3 shadow-2xs transition hover:border-stone-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 font-bold text-stone-800 text-xs">
                        {variant.size || "FS"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-stone-900">
                            Size: {variant.size || "Free Size"}
                          </span>
                          {assignedColor && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: assignedColor.hex || "#999" }}
                              />
                              {assignedColor.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                          <span>
                            Stock:{" "}
                            <strong
                              className={(variant.stock ?? 0) > 0 ? "text-emerald-700" : "text-red-600"}
                            >
                              {variant.stock}
                            </strong>
                          </span>
                          {variant.sku && <span>SKU: {variant.sku}</span>}
                          {variant.price !== null && variant.price !== undefined && (
                            <span>Price: ₹{Number(variant.price).toLocaleString("en-IN")}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <form action={deleteProductVariantAction}>
                      <input type="hidden" name="id" value={variant.id} />
                      <button
                        type="submit"
                        title="Remove variant"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-700 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Variant Form */}
          <form
            action={saveProductVariantAction}
            className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs space-y-3"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              + Add Size / Stock Variant
            </span>
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="active" value="true" />

            <div className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} name="size" placeholder="Size (e.g. S, M, L)" />
              <input className={inputClass} name="sku" placeholder="SKU Barcode" />
              <select className={inputClass} name="colorId">
                <option value="">No colour assigned</option>
                {colors.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                name="stock"
                type="number"
                min="0"
                required
                placeholder="Stock quantity *"
              />
              <div className="sm:col-span-2">
                <input
                  className={inputClass}
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price override (leave blank to use base price)"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#9c5247] px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#854036] transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Variant</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
