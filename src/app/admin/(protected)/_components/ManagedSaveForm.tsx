"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { adminActionMessage } from "@/lib/admin/errors";

type SaveAction = (formData: FormData) => Promise<void>;

export function ManagedSaveForm({
  action,
  successMessage,
  resetOnSuccess = false,
  className,
  children,
  submitLabel,
  submitAriaLabel,
  submitClassName,
  footerClassName = "mt-5 flex justify-end",
}: {
  action: SaveAction;
  successMessage: string;
  resetOnSuccess?: boolean;
  className?: string;
  children: ReactNode;
  submitLabel: string;
  submitAriaLabel?: string;
  submitClassName: string;
  footerClassName?: string;
}) {
  const [isPending, startTransition] = useTransition();
  // Bumping the key remounts the fields, which also clears uploaded-media state.
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(successMessage);
        if (resetOnSuccess) setFormKey((key) => key + 1);
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not save. Please check the details and try again."));
      }
    });
  };

  return (
    <form action={handleSubmit} className={className}>
      <div key={formKey}>{children}</div>
      <div className={footerClassName}>
        <button
          type="submit"
          disabled={isPending}
          aria-label={submitAriaLabel}
          className={`${submitClassName} disabled:cursor-wait disabled:opacity-60`}
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
