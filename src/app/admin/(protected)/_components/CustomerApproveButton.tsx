"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleCustomerAction } from "@/actions/admin/customers";
import { adminActionMessage } from "@/lib/admin/errors";

export function CustomerApproveButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        formData.set("active", "true");
        await toggleCustomerAction(formData);
        toast.success("Customer approved.");
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not approve the customer. Reload and check before retrying."));
      }
    });
  };

  return (
    <button type="button" onClick={handleApprove} disabled={isPending} className="text-xs font-semibold text-blue-600 hover:underline disabled:cursor-wait disabled:opacity-60">
      {isPending ? "Approving…" : "Approve"}
    </button>
  );
}
