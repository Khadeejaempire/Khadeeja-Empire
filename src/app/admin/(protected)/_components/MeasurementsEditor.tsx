"use client";

import { useState, useEffect } from "react";
import type { SizeChartMeasurements } from "@/lib/admin/types";

interface MeasurementsEditorProps {
  value?: SizeChartMeasurements | null;
  onChange: (value: SizeChartMeasurements) => void;
}

export function MeasurementsEditor({ value, onChange }: MeasurementsEditorProps) {
  const [enabled, setEnabled] = useState(value?.enabled ?? false);
  const [unit, setUnit] = useState<"cm" | "inches">(value?.unit ?? "cm");
  const [sizes, setSizes] = useState(value?.sizes ?? []);
  const [newSize, setNewSize] = useState("");
  const [measurementKeys, setMeasurementKeys] = useState<string[]>(["chest", "waist", "hip"]);

  useEffect(() => {
    setEnabled(value?.enabled ?? false);
    setUnit(value?.unit ?? "cm");
    setSizes(value?.sizes ?? []);
  }, [value]);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    const nextSizes = checked && sizes.length === 0 ? [
      { size: "XXS", chest: "30-32", waist: "24-26", hip: "32-34" },
      { size: "XS", chest: "32-34", waist: "26-28", hip: "34-36" },
      { size: "S", chest: "34-36", waist: "28-30", hip: "36-38" },
      { size: "M", chest: "36-38", waist: "30-32", hip: "38-40" },
      { size: "L", chest: "38-40", waist: "32-34", hip: "40-42" },
      { size: "XL", chest: "40-42", waist: "34-36", hip: "42-44" },
    ] : sizes;
    if (checked && sizes.length === 0) {
      setSizes(nextSizes);
    }
    updateValue(checked, unit, nextSizes);
  };

  const handleUnitChange = (newUnit: "cm" | "inches") => {
    setUnit(newUnit);
    updateValue(enabled, newUnit, sizes);
  };

  const handleAddSize = () => {
    if (!newSize.trim()) return;
    const newSizeObj = {
      size: newSize.trim(),
      ...measurementKeys.reduce(
        (acc, key) => ({ ...acc, [key]: "" }),
        {} as Record<string, string>
      ),
    };
    const updated = [...sizes, newSizeObj];
    setSizes(updated);
    setNewSize("");
    updateValue(enabled, unit, updated);
  };

  const handleSizeChange = (index: number, field: string, val: string) => {
    const updated = sizes.map((s, i) =>
      i === index ? { ...s, [field]: val } : s
    );
    setSizes(updated);
    updateValue(enabled, unit, updated);
  };

  const handleRemoveSize = (index: number) => {
    const updated = sizes.filter((_, i) => i !== index);
    setSizes(updated);
    updateValue(enabled, unit, updated);
  };

  const handleAddMeasurementKey = () => {
    const newKey = prompt("Enter measurement name (e.g., length, shoulder):");
    if (newKey && !measurementKeys.includes(newKey.toLowerCase())) {
      const key = newKey.toLowerCase().trim();
      setMeasurementKeys([...measurementKeys, key]);
      // Add to existing sizes
      const updated = sizes.map((s) => ({ ...s, [key]: "" }));
      setSizes(updated);
      updateValue(enabled, unit, updated);
    }
  };

  const handleRemoveMeasurementKey = (key: string) => {
    const updated = measurementKeys.filter((k) => k !== key);
    setMeasurementKeys(updated);
    // Remove from sizes
    const updatedSizes = sizes.map((s) => {
      const copy = { ...s };
      delete copy[key as keyof typeof copy];
      return copy;
    });
    setSizes(updatedSizes);
    updateValue(enabled, unit, updatedSizes);
  };

  const updateValue = (
    en: boolean,
    un: "cm" | "inches",
    sz: typeof sizes
  ) => {
    onChange({
      enabled: en,
      unit: un,
      sizes: sz,
    });
  };

  return (
    <div className="space-y-6 border-t border-stone-100 pt-6">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="h-4 w-4 accent-[#9c5247]"
          />
          Enable size chart
        </label>
      </div>

      {enabled && (
        <>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Measurement Unit
            </label>
            <div className="flex gap-3">
              {(["cm", "inches"] as const).map((u) => (
                <label key={u} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={unit === u}
                    onChange={() => handleUnitChange(u)}
                    className="h-4 w-4 accent-[#9c5247]"
                  />
                  <span className="text-sm text-stone-600">
                    {u === "cm" ? "Centimeters" : "Inches"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Measurement Keys */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-stone-700">
                Measurements
              </label>
              <button
                type="button"
                onClick={handleAddMeasurementKey}
                className="text-xs text-[#9c5247] hover:text-[#7e3f35] font-medium"
              >
                + Add field
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {measurementKeys.map((key) => (
                <div
                  key={key}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs"
                >
                  <span className="capitalize">{key}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMeasurementKey(key)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Size */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Add Size
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="e.g., XS, S, M, L, XL"
                className="mr-2 flex-1 min-h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/20"
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="min-h-10 rounded-lg bg-[#9c5247] px-4 text-sm font-medium text-white hover:bg-[#7e3f35]"
              >
                Add
              </button>
            </div>
          </div>

          {/* Sizes Table */}
          {sizes.length > 0 && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="px-3 py-2 text-left font-medium text-stone-700">
                        Size
                      </th>
                      {measurementKeys.map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 text-center font-medium text-stone-700 capitalize"
                        >
                          {key}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center font-medium text-stone-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {sizes.map((sizeInfo, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="px-3 py-2 font-medium text-stone-900">
                          {sizeInfo.size}
                        </td>
                        {measurementKeys.map((key) => (
                          <td
                            key={`${idx}-${key}`}
                            className="px-3 py-2 text-center"
                          >
                            <input
                              type="text"
                              value={
                                sizeInfo[
                                  key as keyof typeof sizeInfo
                                ] || ""
                              }
                              onChange={(e) =>
                                handleSizeChange(idx, key, e.target.value)
                              }
                              placeholder={`e.g., 30-32`}
                              className="w-full min-h-8 rounded border border-stone-200 bg-white px-2 text-sm text-center outline-none focus:border-[#9c5247] focus:ring-1 focus:ring-[#9c5247]/30"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(idx)}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
