"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  SlidersHorizontal,
  IndianRupee,
  Palette,
  Sparkles,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Loader2,
  Pipette,
  Check,
} from "lucide-react";
import type { ShopFilterSettings, ShopFilterColor } from "@/types";
import { DEFAULT_SHOP_FILTER_SETTINGS } from "@/lib/storefront/filters-constants";
import { saveShopFilterSettingsAction } from "@/actions/admin/settings";

const PRESET_COLOR_SWATCHES = [
  { name: "Beige", hex: "#D4B376" },
  { name: "Black", hex: "#1A1A1A" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Coral", hex: "#E57373" },
  { name: "Green", hex: "#668B4A" },
  { name: "Maroon", hex: "#800020" },
  { name: "Navy", hex: "#1F2937" },
  { name: "Crimson Red", hex: "#A31D1D" },
  { name: "Banarasi Pink", hex: "#E05275" },
  { name: "Golden Mustard", hex: "#D4A017" },
  { name: "Deep Wine", hex: "#581845" },
  { name: "Teal Green", hex: "#008080" },
];

export function ShopFiltersManager({
  initialSettings,
}: {
  initialSettings: ShopFilterSettings;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Price Range State
  const [minPrice, setMinPrice] = useState<number>(initialSettings.minPrice ?? 500);
  const [maxPrice, setMaxPrice] = useState<number>(initialSettings.maxPrice ?? 15000);
  const [priceStep, setPriceStep] = useState<number>(initialSettings.priceStep ?? 100);

  // Colors State
  const [colors, setColors] = useState<ShopFilterColor[]>(
    initialSettings.colors && initialSettings.colors.length > 0
      ? initialSettings.colors
      : DEFAULT_SHOP_FILTER_SETTINGS.colors
  );
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#800020");
  const colorPickerRef = useRef<HTMLInputElement>(null);

  // Fabrics State
  const [fabrics, setFabrics] = useState<string[]>(
    initialSettings.fabrics && initialSettings.fabrics.length > 0
      ? initialSettings.fabrics
      : DEFAULT_SHOP_FILTER_SETTINGS.fabrics
  );
  const [newFabricName, setNewFabricName] = useState("");

  // Add Color Handler
  const handleAddColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newColorName.trim();
    if (!trimmed) {
      toast.error("Please enter a color name");
      return;
    }
    if (colors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Color "${trimmed}" is already in the list`);
      return;
    }
    setColors([...colors, { name: trimmed, hex: newColorHex }]);
    setNewColorName("");
    toast.success(`Added color "${trimmed}"`);
  };

  const handleRemoveColor = (index: number) => {
    const target = colors[index];
    setColors(colors.filter((_, i) => i !== index));
    toast.info(`Removed "${target.name}"`);
  };

  // Add Fabric Handler
  const handleAddFabric = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newFabricName.trim();
    if (!trimmed) {
      toast.error("Please enter a fabric name");
      return;
    }
    if (fabrics.some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Fabric "${trimmed}" is already in the list`);
      return;
    }
    setFabrics([...fabrics, trimmed]);
    setNewFabricName("");
    toast.success(`Added fabric "${trimmed}"`);
  };

  const handleRemoveFabric = (index: number) => {
    const target = fabrics[index];
    setFabrics(fabrics.filter((_, i) => i !== index));
    toast.info(`Removed "${target}"`);
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    if (confirm("Reset all filter settings (Price, Colors, Fabrics) to defaults?")) {
      setMinPrice(DEFAULT_SHOP_FILTER_SETTINGS.minPrice);
      setMaxPrice(DEFAULT_SHOP_FILTER_SETTINGS.maxPrice);
      setPriceStep(DEFAULT_SHOP_FILTER_SETTINGS.priceStep);
      setColors(DEFAULT_SHOP_FILTER_SETTINGS.colors);
      setFabrics(DEFAULT_SHOP_FILTER_SETTINGS.fabrics);
      toast.info("Filter settings reset to defaults. Remember to click Save.");
    }
  };

  // Save Settings
  const handleSave = () => {
    if (minPrice < 0) {
      toast.error("Min price cannot be negative");
      return;
    }
    if (maxPrice <= minPrice) {
      toast.error("Max price must be greater than Min price");
      return;
    }
    if (colors.length === 0) {
      toast.error("At least one color must be specified");
      return;
    }
    if (fabrics.length === 0) {
      toast.error("At least one fabric must be specified");
      return;
    }

    const payload: ShopFilterSettings = {
      minPrice,
      maxPrice,
      priceStep: Math.max(1, priceStep),
      colors,
      fabrics,
    };

    const formData = new FormData();
    formData.set("filterSettings", JSON.stringify(payload));

    startTransition(async () => {
      try {
        await saveShopFilterSettingsAction(formData);
        toast.success("Shop filter settings saved successfully!");
        router.refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to save filter settings";
        toast.error(message);
      }
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9c5247]/10 text-[#9c5247]">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">Filter Configuration</h2>
            <p className="text-xs text-stone-500">Live controls for Storefront Shop Catalog</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 transition disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-[#9c5247] hover:bg-[#854036] text-white shadow-xs transition disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Price Range & Fabrics (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* 1. PRICE RANGE CARD */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <IndianRupee className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Price Range Boundaries</h3>
                <p className="text-xs text-stone-500">
                  Control the slider scale and step on the storefront
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Min Price (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#9c5247]"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Max Price (₹)
                </label>
                <input
                  type="number"
                  min={minPrice + 100}
                  step={100}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#9c5247]"
                  placeholder="15000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Step Interval (₹)
                </label>
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={priceStep}
                  onChange={(e) => setPriceStep(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#9c5247]"
                  placeholder="100"
                />
              </div>
            </div>

            {/* Slider Live Simulation Box */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Live Storefront Slider Preview:
              </span>
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span>₹{minPrice.toLocaleString("en-IN")}</span>
                <span className="text-[#9c5247]">₹{maxPrice.toLocaleString("en-IN")} (Default)</span>
              </div>
              <div className="w-full h-2 rounded-lg bg-stone-200 overflow-hidden relative">
                <div className="h-full bg-[#9c5247] w-full" />
              </div>
              <p className="text-[11px] text-stone-400">
                Customers will be able to filter products from ₹{minPrice.toLocaleString("en-IN")} up to ₹{maxPrice.toLocaleString("en-IN")}.
              </p>
            </div>
          </div>

          {/* 2. FABRICS CARD */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Fabric & Material Tags</h3>
                  <p className="text-xs text-stone-500">
                    Fabrics displayed in the shop sidebar checkbox filter ({fabrics.length})
                  </p>
                </div>
              </div>
            </div>

            {/* Add Fabric Form */}
            <form onSubmit={handleAddFabric} className="flex gap-2">
              <input
                type="text"
                value={newFabricName}
                onChange={(e) => setNewFabricName(e.target.value)}
                placeholder="New fabric name (e.g. Katan Silk, Organza)"
                className="flex-1 h-10 px-3 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#9c5247]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#9c5247] hover:bg-[#854036] text-white text-xs font-semibold shadow-xs transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Fabric</span>
              </button>
            </form>

            {/* Fabrics List */}
            <div className="flex flex-wrap gap-2 pt-1">
              {fabrics.map((fabric, index) => (
                <div
                  key={`${fabric}-${index}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-stone-800 shadow-2xs hover:bg-stone-100 transition"
                >
                  <span>{fabric}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFabric(index)}
                    title={`Remove ${fabric}`}
                    className="text-stone-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Colors (5 Cols) */}
        <div className="lg:col-span-5 space-y-8">
          {/* 3. COLOR SWATCHES CARD */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[#9c5247]">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Color Swatches</h3>
                <p className="text-xs text-stone-500">
                  Interactive color circles on storefront ({colors.length})
                </p>
              </div>
            </div>

            {/* Add New Color Form */}
            <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200 space-y-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                + Add New Color
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Color Name (e.g. Royal Navy)"
                  className="flex-1 h-10 px-3 rounded-xl border border-stone-200 text-xs font-medium bg-white focus:outline-none focus:border-[#9c5247]"
                />

                {/* Color Swatch Picker */}
                <div className="flex items-center gap-2 px-2.5 h-10 rounded-xl border border-stone-200 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => colorPickerRef.current?.click()}
                    title="Open Color Wheel"
                    className="w-6 h-6 rounded-full border border-black/20 shadow-2xs cursor-pointer flex items-center justify-center transition hover:scale-110"
                    style={{ backgroundColor: newColorHex }}
                  >
                    <Pipette className="h-3 w-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />
                  </button>
                  <input
                    ref={colorPickerRef}
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="sr-only"
                  />
                  <input
                    type="text"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-16 text-xs font-mono font-semibold uppercase text-stone-700 outline-none"
                  />
                </div>
              </div>

              {/* Quick Preset Colors */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLOR_SWATCHES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      title={preset.name}
                      onClick={() => {
                        setNewColorHex(preset.hex);
                        if (!newColorName) setNewColorName(preset.name);
                      }}
                      className="w-5 h-5 rounded-full border border-black/15 shadow-2xs hover:scale-125 transition"
                      style={{ backgroundColor: preset.hex }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddColor}
                className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#9c5247] hover:bg-[#854036] text-white text-xs font-semibold shadow-xs transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add to Color Swatches</span>
              </button>
            </div>

            {/* Colors List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {colors.map((color, index) => (
                <div
                  key={`${color.name}-${index}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-6 h-6 rounded-full border border-black/15 shadow-inner shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div>
                      <span className="text-xs font-semibold text-stone-800 block">
                        {color.name}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 uppercase">
                        {color.hex}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveColor(index)}
                    title={`Delete ${color.name}`}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
