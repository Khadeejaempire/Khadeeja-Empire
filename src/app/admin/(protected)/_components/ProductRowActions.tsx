"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { deleteProductAction, toggleProductAction } from "@/actions/admin/products";
import { adminActionMessage } from "@/lib/admin/errors";

export function ProductRowActions({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        formData.set("active", String(active === false));
        await toggleProductAction(formData);
        toast.success(active === false ? "Product activated." : "Product disabled.");
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not update the product. Reload and check before retrying."));
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        await deleteProductAction(formData);
        toast.success("Product deleted.");
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not delete the product. Reload and check before retrying."));
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Link href={`/admin/products/${id}/edit`} className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold">Edit</Link>
      <button type="button" onClick={handleToggle} disabled={isPending} className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold disabled:cursor-wait disabled:opacity-60">
        {active === false ? "Activate" : "Disable"}
      </button>
      <button type="button" onClick={handleDelete} disabled={isPending} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:cursor-wait disabled:opacity-60">
        Delete
      </button>
    </div>
  );
}
