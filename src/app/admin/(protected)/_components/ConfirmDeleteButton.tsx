"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminActionMessage } from "@/lib/admin/errors";

type DeleteAction = (formData: FormData) => Promise<void>;

export function ConfirmDeleteButton({
  action,
  id,
  confirmMessage,
  successMessage,
  redirectTo,
  className = "min-h-10 w-full rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 disabled:cursor-wait disabled:opacity-60",
  label = "Delete",
  icon,
}: {
  action: DeleteAction;
  id: string;
  confirmMessage: string;
  successMessage: string;
  redirectTo?: string;
  className?: string;
  label?: string;
  icon?: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(confirmMessage)) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        await action(formData);
        toast.success(successMessage);
        if (redirectTo) router.push(redirectTo);
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not delete. Reload and check before retrying."));
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className={className}
      aria-label={icon ? label : undefined}
    >
      {icon ? icon : isPending ? "Deleting…" : label}
    </button>
  );
}
