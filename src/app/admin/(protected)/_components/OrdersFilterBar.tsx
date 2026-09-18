"use client";

import type { FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const selectClass =
  "min-h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700";

export default function OrdersFilterBar({
  q,
  status,
  payment,
}: {
  q?: string;
  status?: string;
  payment?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "status", "payment"]) {
      const value = String(data.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <input
            name="q"
            defaultValue={q}
            aria-label="Search orders"
            placeholder="Search order number, customer name, email..."
            className="min-h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="min-h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
        >
          Search
        </button>
        <label className="flex flex-col gap-1 text-xs font-semibold text-stone-500">
          ORDER STATUS:
          <select
            name="status"
            defaultValue={status || ""}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className={selectClass}
          >
            <option value="">All Status</option>
            {ORDER_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-stone-500">
          PAYMENT STATUS:
          <select
            name="payment"
            defaultValue={payment || ""}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className={selectClass}
          >
            <option value="">All Payments</option>
            {PAYMENT_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </form>
    </div>
  );
}
