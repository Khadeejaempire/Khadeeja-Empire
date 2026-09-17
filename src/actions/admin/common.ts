import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDigest, isDataProviderError } from "@/lib/admin/errors";
import { idSchema } from "@/lib/admin/schemas";
import { requireAdmin } from "@/lib/auth/server";

export type AdminActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

type FormOptions = {
  booleans?: string[];
  numbers?: string[];
  arrays?: string[];
  json?: string[];
  nullable?: string[];
};

function parseArray(value: string): unknown[] {
  if (!value.trim()) return [];
  if (value.trim().startsWith("[")) {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error("Expected an array.");
    return parsed;
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function formDataObject(formData: FormData, options: FormOptions = {}) {
  const result: Record<string, unknown> = {};
  const booleans = new Set(options.booleans);
  const numbers = new Set(options.numbers);
  const arrays = new Set(options.arrays);
  const json = new Set(options.json);
  const nullable = new Set(options.nullable);

  for (const [key, raw] of formData.entries()) {
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (booleans.has(key)) {
      result[key] = ["true", "1", "on", "yes"].includes(value.toLowerCase());
    } else if (numbers.has(key)) {
      result[key] = value === "" && nullable.has(key) ? null : Number(value);
    } else if (arrays.has(key)) {
      result[key] = parseArray(value);
    } else if (json.has(key)) {
      result[key] = value === "" && nullable.has(key) ? null : JSON.parse(value);
    } else {
      result[key] = value === "" && nullable.has(key) ? null : value;
    }
  }
  return result;
}

export function inputObject(input: unknown, options?: FormOptions): unknown {
  return input instanceof FormData ? formDataObject(input, options) : input;
}

export function parseId(id: unknown): string {
  return idSchema.parse(id);
}

export async function adminMutation<T>(
  operation: () => Promise<T>,
  paths: string[] = []
): Promise<AdminActionResult<T>> {
  try {
    await requireAdmin();
    const data = await operation();
    for (const path of new Set(paths)) revalidatePath(path);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const flattened = error.flatten();
      return {
        success: false,
        error: flattened.formErrors[0] ?? "Please correct the highlighted fields.",
        fieldErrors: flattened.fieldErrors as Record<string, string[]>,
      };
    }
    if (isDataProviderError(error) || error instanceof Error && error.name === "UnauthorizedError") {
      return { success: false, error: error.message };
    }
    console.error("Unhandled admin mutation failure:", error);
    return { success: false, error: "The operation could not be completed. Please try again." };
  }
}

export function noData<T>(result: AdminActionResult<T>): AdminActionResult {
  return result.success
    ? { success: true }
    : { success: false, error: result.error, fieldErrors: result.fieldErrors };
}

export async function finishFormAction<T>(result: Promise<AdminActionResult<T>>): Promise<void> {
  const outcome = await result;
  if (!outcome.success) {
    const errorDetails = outcome.fieldErrors 
      ? Object.entries(outcome.fieldErrors)
          .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
          .join(" | ")
      : outcome.error;
    const message = errorDetails ?? "The operation could not be completed.";
    // Next.js hides thrown Server Action messages in production, so the reason
    // rides along in `digest`, which the client does receive. See adminActionMessage.
    throw Object.assign(new Error(message), { digest: adminDigest(message) });
  }
}
