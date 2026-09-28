"use client";

import { Compass, Plus, Trash2, Link as LinkIcon, FolderTree } from "lucide-react";
import type { CategoryRecord, DiscoveryMenuEntryRecord } from "@/lib/admin/types";
import { deleteDiscoveryMenuEntryAction, saveDiscoveryMenuEntryAction } from "@/actions/admin/settings";

const inputClass =
  "min-h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-900 placeholder-stone-400 outline-none transition focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/15";

export function DiscoveryMenuEditor({
  entries,
  categories,
}: {
  entries: DiscoveryMenuEntryRecord[];
  categories: CategoryRecord[];
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
          <Compass className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-stone-900 font-sans">
            Storefront Discovery Navigation
          </h2>
          <p className="text-xs text-stone-500">
            Featured discovery links displayed in storefront collections navigation & discovery drawer.
          </p>
        </div>
      </div>

      {/* Existing Entries List */}
      <div className="space-y-2.5">
        {entries.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-3">No discovery menu links defined yet.</p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => {
              const matchedCategory = categories.find((c) => c.id === entry.categoryId);
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border border-stone-200/90 bg-stone-50/50 p-3.5 shadow-2xs transition hover:border-stone-300"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold text-stone-900 truncate">{entry.label}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-stone-500">
                      <span className="font-mono text-stone-600 truncate max-w-[140px]">
                        {entry.href}
                      </span>
                      {matchedCategory && (
                        <span className="inline-flex items-center gap-1 rounded bg-stone-200/70 px-1.5 py-0.2 text-[9px] font-semibold text-stone-700">
                          <FolderTree className="h-2.5 w-2.5 text-stone-400" />
                          {matchedCategory.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <form action={deleteDiscoveryMenuEntryAction}>
                    <input type="hidden" name="id" value={entry.id} />
                    <button
                      type="submit"
                      title="Delete link"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-700 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add New Discovery Link Form */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
          + Add New Discovery Link
        </span>

        <form action={saveDiscoveryMenuEntryAction} className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 items-center">
          <input type="hidden" name="active" value="true" />
          <input type="hidden" name="sortOrder" value={entries.length} />

          <div>
            <input
              className={inputClass}
              name="label"
              required
              placeholder="Link title (e.g. Silk Kurtis)"
            />
          </div>

          <div>
            <input
              className={inputClass}
              name="href"
              required
              placeholder="Target URL (e.g. /collections/silk)"
            />
          </div>

          <div>
            <select className={inputClass} name="categoryId">
              <option value="">Link to Category (Optional)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#9c5247] px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#854036] transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
