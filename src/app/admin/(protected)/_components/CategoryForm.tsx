"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CategoryRecord } from "@/lib/admin/types";
import { saveCategoryAction } from "@/actions/admin/categories";
import { adminActionMessage } from "@/lib/admin/errors";
import { MediaUpload } from "@/components/admin/MediaUpload";

const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/20";

export function CategoryForm({ category, categories }: { category?: CategoryRecord; categories: CategoryRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await saveCategoryAction(data);
        toast.success(category ? "Category updated." : "Category created.");
        if (!category) router.push("/admin/categories");
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not save the category. Reload and check before retrying."));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-stone-700">Name
          <input className={inputClass} name="name" required defaultValue={category?.name || ""} />
        </label>
        <label className="text-sm font-medium text-stone-700">Slug
          <input className={inputClass} name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={category?.slug || ""} />
        </label>
      </div>
      <label className="block text-sm font-medium text-stone-700">Description
        <textarea className={`${inputClass} min-h-28 py-3`} name="description" defaultValue={category?.description || ""} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <MediaUpload name="image" label="Image" defaultValue={category?.image || ""} aspectClassName="aspect-[4/4.5] sm:aspect-3/4" folder="khadeeja/content" />
        <label className="text-sm font-medium text-stone-700">Parent category
          <select className={inputClass} name="parentId" defaultValue={category?.parentId || ""}>
            <option value="">None</option>
            {categories.filter((item) => item.id !== category?.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-stone-700">Sort order
          <input className={inputClass} name="sortOrder" type="number" min="0" defaultValue={category?.sortOrder ?? 0} />
        </label>
        <label className="mt-6 flex min-h-11 items-center gap-3 text-sm font-medium text-stone-700">
          <input name="active" type="checkbox" defaultChecked={category?.active !== false} className="h-4 w-4 accent-[#9c5247]" /> Active
        </label>
      </div>
      <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
        <Link href="/admin/categories" className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 text-sm font-semibold text-stone-700">Cancel</Link>
        <button className="min-h-11 rounded-lg bg-[#9c5247] px-5 text-sm font-semibold text-white hover:bg-[#7e3f35] disabled:cursor-wait disabled:opacity-70" type="submit" disabled={isPending}>{isPending ? "Saving…" : category ? "Save changes" : "Create category"}</button>
      </div>
    </form>
  );
}
