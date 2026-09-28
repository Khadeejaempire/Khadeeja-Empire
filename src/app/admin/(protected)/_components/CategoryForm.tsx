"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, FolderTree, RefreshCw } from "lucide-react";
import type { CategoryRecord } from "@/lib/admin/types";
import { saveCategoryAction } from "@/actions/admin/categories";
import { adminActionMessage } from "@/lib/admin/errors";
import { MediaUpload } from "@/components/admin/MediaUpload";

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/15 disabled:bg-stone-50";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryForm({
  category,
  categories,
}: {
  category?: CategoryRecord;
  categories: CategoryRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!category);
  const [active, setActive] = useState(category?.active !== false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await saveCategoryAction(data);
        toast.success(category ? "Category updated." : "Category created.");
        if (!category) router.push("/admin/categories");
      } catch (error) {
        toast.error(
          adminActionMessage(
            error,
            "Could not save the category. Reload and check before retrying."
          )
        );
      }
    });
  };

  // Exclude self and descendants from parent selection
  const excluded = new Set<string>();
  if (category) {
    excluded.add(category.id);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of categories) {
        if (item.parentId && excluded.has(item.parentId) && !excluded.has(item.id)) {
          excluded.add(item.id);
          changed = true;
        }
      }
    }
  }

  const parentOptions = categories.filter((item) => !excluded.has(item.id));
  const depthOf = (item: CategoryRecord) => {
    let depth = 0;
    let current: CategoryRecord | undefined = item;
    while (current?.parentId && depth < 10) {
      current = categories.find((candidate) => candidate.id === current?.parentId);
      depth += 1;
    }
    return depth;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {category && <input type="hidden" name="id" value={category.id} />}

      {/* Row 1: Name & Slug */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Category Name *
          </label>
          <input
            className={inputClass}
            name="name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Handloom Silk Sarees"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
              URL Slug *
            </label>
            <button
              type="button"
              onClick={() => {
                setAutoSlug(!autoSlug);
                if (!autoSlug) setSlug(slugify(name));
              }}
              className="text-[11px] font-medium text-[#9c5247] hover:underline"
            >
              {autoSlug ? "Locked to name" : "Auto generate"}
            </button>
          </div>
          <div className="relative mt-1.5 flex items-center">
            <span className="pointer-events-none absolute left-3 text-xs text-stone-400 font-mono">
              /collections/
            </span>
            <input
              className={`${inputClass} mt-0 pl-[92px] font-mono text-xs`}
              name="slug"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlug(e.target.value);
              }}
              placeholder="handloom-silk-sarees"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Description */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
          Category Description
        </label>
        <textarea
          className={`${inputClass} min-h-24 py-2.5 resize-y text-xs leading-relaxed`}
          name="description"
          defaultValue={category?.description || ""}
          placeholder="A short editorial description shown on collection banners and SEO meta..."
        />
      </div>

      {/* Row 3: Image & Parent Category */}
      <div className="grid gap-6 sm:grid-cols-2 items-start">
        <MediaUpload
          name="image"
          label="Category Cover Image"
          defaultValue={category?.image || ""}
          aspectClassName="aspect-square sm:aspect-[4/3]"
          folder="khadeeja/categories"
        />

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Parent Category Hierarchy
            </label>
            <p className="text-[11px] text-stone-400 mb-1">
              Leave as &quot;Root Category&quot; for top-level collections
            </p>
            <select
              className={inputClass}
              name="parentId"
              defaultValue={category?.parentId || ""}
            >
              <option value="">Root Category (Top Level)</option>
              {parentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {"— ".repeat(depthOf(item))}
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Sort Sequence / Display Order
            </label>
            <input
              className={inputClass}
              name="sortOrder"
              type="number"
              min="0"
              defaultValue={category?.sortOrder ?? 0}
            />
          </div>

          {/* Active Switch */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="hidden"
                name="active"
                value={active ? "true" : "false"}
              />
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  active ? "bg-[#9c5247]" : "bg-stone-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    active ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <div className="text-xs">
                <span className="font-bold text-stone-900 block">
                  {active ? "Published & Visible" : "Draft / Hidden"}
                </span>
                <span className="text-stone-400">
                  {active
                    ? "Available in navigation and filters"
                    : "Hidden from storefront navigation"}
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Footer / Buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-5">
        <Link
          href="/admin/categories"
          className="inline-flex min-h-10 items-center rounded-xl border border-stone-300 bg-white px-4 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#9c5247] to-[#7f4037] px-6 text-xs font-semibold text-white shadow-md shadow-[#9c5247]/20 hover:brightness-105 transition active:scale-95 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>{category ? "Save Changes" : "Create Category"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
