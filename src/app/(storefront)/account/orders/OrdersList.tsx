"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Clock, Package, PackageSearch, RotateCcw, Truck, XCircle } from "lucide-react";
import type { OrderRecord, OrderStatus } from "@/lib/admin/types";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_META: Record<OrderStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  processing: { label: "Processing", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Package },
  shipped: { label: "Shipped", className: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Truck },
  delivered: { label: "Delivered", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  refunded: { label: "Refunded", className: "bg-stone-100 text-stone-600 border-stone-200", icon: RotateCcw },
};

const FILTERS: { key: "all" | OrderStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

function formatOrderDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

export function OrdersList({ orders }: { orders: OrderRecord[] }) {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map: Partial<Record<OrderStatus, number>> = {};
    for (const order of orders) map[order.status] = (map[order.status] ?? 0) + 1;
    return map;
  }, [orders]);

  const visibleFilters = FILTERS.filter((f) => f.key === "all" || (counts[f.key] ?? 0) > 0);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false;
      if (!trimmed) return true;
      return (
        order.orderNumber.toLowerCase().includes(trimmed) ||
        (order.items ?? []).some((item) => item.productName.toLowerCase().includes(trimmed))
      );
    });
  }, [orders, filter, query]);

  return (
    <div>
      {/* Filter tabs + search */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {visibleFilters.map((f) => {
            const isActive = filter === f.key;
            const count = f.key === "all" ? orders.length : counts[f.key] ?? 0;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold uppercase tracking-wide transition-colors",
                  isActive
                    ? "border-[var(--color-maroon)] bg-[var(--color-maroon)] text-white"
                    : "border-border text-muted hover:border-[var(--color-maroon)] hover:text-[var(--color-maroon)]"
                )}
              >
                {f.label}
                <span className={cn("text-[10px]", isActive ? "text-white/80" : "text-muted/70")}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <PackageSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order # or product"
            className="h-9 w-full rounded-full border border-border bg-white pl-9 pr-4 text-xs text-ink placeholder:text-muted focus:border-[var(--color-maroon)] focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
          <Package size={24} strokeWidth={1.5} className="text-muted" />
          <p className="text-sm text-muted">No orders match this filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((order) => {
            const meta = STATUS_META[order.status] ?? STATUS_META.pending;
            const StatusIcon = meta.icon;
            const items = order.items ?? [];
            const thumbs = items.slice(0, 4);
            const extra = items.length - thumbs.length;

            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="group block overflow-hidden rounded-2xl border border-[#f0ebe1] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d8b88d]/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">#{order.orderNumber}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatOrderDate(order.createdAt)} &middot; {items.length} {items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                      meta.className
                    )}
                  >
                    <StatusIcon size={12} />
                    {meta.label}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center">
                    {thumbs.map((item, idx) => (
                      <div
                        key={item.id}
                        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-[var(--color-surface)] shadow-sm"
                        style={{ marginLeft: idx === 0 ? 0 : -14, zIndex: thumbs.length - idx }}
                      >
                        {item.image ? (
                          <Image src={item.image} alt={item.productName} fill sizes="56px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted">
                            <Package size={16} />
                          </div>
                        )}
                      </div>
                    ))}
                    {extra > 0 && (
                      <div
                        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-[var(--color-surface)] text-xs font-semibold text-muted shadow-sm"
                        style={{ marginLeft: -14 }}
                      >
                        +{extra}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted">
                        {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod ?? ""}
                      </p>
                      <p className="text-base font-bold text-ink">{formatPrice(order.total, order.currency ?? "INR")}</p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-all duration-300 group-hover:border-[var(--color-maroon)] group-hover:bg-[var(--color-maroon)] group-hover:text-white">
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
