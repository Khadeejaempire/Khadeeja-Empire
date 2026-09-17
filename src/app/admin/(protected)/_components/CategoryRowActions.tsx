"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { deleteCategoryAction, toggleCategoryAction } from "@/actions/admin/categories";
import { adminActionMessage } from "@/lib/admin/errors";

export function CategoryRowActions({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        formData.set("active", String(active === false));
        await toggleCategoryAction(formData);
        toast.success(active === false ? "Category activated." : "Category disabled.");
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not update the category. Reload and check before retrying."));
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${name}"? Products in this category will become uncategorised. This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        await deleteCategoryAction(formData);
        toast.success("Category deleted.");
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not delete the category. Reload and check before retrying."));
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Link href={`/admin/categories/${id}/edit`} className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold">Edit</Link>
      <button type="button" onClick={handleToggle} disabled={isPending} className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold disabled:cursor-wait disabled:opacity-60">
        {active === false ? "Activate" : "Disable"}
      </button>
      <button type="button" onClick={handleDelete} disabled={isPending} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:cursor-wait disabled:opacity-60">
        {isPending ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
