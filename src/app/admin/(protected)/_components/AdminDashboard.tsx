"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  Package,
  Clock,
  Star,
  MessageSquare,
  Mail,
  ArrowUpRight,
  ExternalLink,
  Plus,
  Tag,
  FolderTree,
  Image as ImageIcon,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Truck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { CustomerRecord, DashboardMetrics, OrderRecord } from "@/lib/admin/types";
import { formatCurrency, formatDate } from "./AdminPage";
import { toast } from "sonner";

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  processing: {
    label: "Processing",
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  shipped: {
    label: "Shipped",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  refunded: {
    label: "Refunded",
    bg: "bg-stone-100",
    text: "text-stone-700",
    border: "border-stone-200",
    dot: "bg-stone-400",
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  paid: {
    label: "Paid",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  pending: {
    label: "Payment Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  failed: {
    label: "Failed",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  refunded: {
    label: "Refunded",
    bg: "bg-stone-100",
    text: "text-stone-600",
    border: "border-stone-200",
  },
};

function getInitials(name?: string | null) {
  if (!name) return "KE";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AdminDashboard({
  metrics,
  customers,
}: {
  metrics: DashboardMetrics;
  customers: CustomerRecord[];
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const customerById = new Map(customers.map((c) => [c.id, c]));
  const recentOrders = metrics.recentOrders.slice(0, 5);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Order # copied!");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const primaryCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      subtext: "Gross verified store sales",
      Icon: IndianRupee,
      iconBg: "bg-emerald-50 text-emerald-700",
      pill: "Verified",
      pillBg: "bg-emerald-100 text-emerald-800",
    },
    {
      label: "Total Orders",
      value: String(metrics.totalOrders),
      subtext: `${metrics.pendingOrders} pending dispatch`,
      Icon: ShoppingCart,
      iconBg: "bg-[#9c5247]/10 text-[#9c5247]",
      pill: metrics.pendingOrders > 0 ? `${metrics.pendingOrders} to pack` : "All clear",
      pillBg: metrics.pendingOrders > 0 ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600",
    },
    {
      label: "Total Customers",
      value: String(metrics.totalCustomers),
      subtext: "Registered shoppers & buyers",
      Icon: Users,
      iconBg: "bg-blue-50 text-blue-700",
      pill: "Active",
      pillBg: "bg-blue-100 text-blue-800",
    },
    {
      label: "Catalog Products",
      value: String(metrics.totalProducts),
      subtext: `${metrics.activeProducts} published on store`,
      Icon: Package,
      iconBg: "bg-purple-50 text-purple-700",
      pill: `${Math.round((metrics.activeProducts / (metrics.totalProducts || 1)) * 100)}% active`,
      pillBg: "bg-purple-100 text-purple-800",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ── Welcome & Storefront Quick Access Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-2xs">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#9c5247]/10 px-2.5 py-0.5 text-xs font-semibold text-[#9c5247]">
                <Sparkles className="h-3.5 w-3.5" />
                Khadeeja Empire HQ
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-500 font-medium">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-sans">
              Welcome back, Admin
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 max-w-xl">
              Monitor boutique sales, track dispatch workflows, manage collection taxonomy, and curate customer discovery.
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 shadow-2xs hover:bg-stone-100 hover:border-stone-400 transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-stone-600 stroke-[2.5]" />
              <span>View Storefront</span>
            </Link>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-4 py-2 text-xs font-bold text-[#7f2d22] shadow-2xs hover:bg-[#f4e7e4] hover:border-[#7f2016] hover:text-[#5c160f] transition active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Top 4 Primary KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {primaryCards.map(({ label, value, subtext, Icon, iconBg, pill, pillBg }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-md hover:border-stone-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                {label}
              </span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 font-sans">
                {value}
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-1 text-[11px] text-stone-500 pt-2 border-t border-stone-100">
              <span className="truncate">{subtext}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${pillBg}`}>
                {pill}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Secondary Operational Notice Strips ── */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Strip 1: Orders Needing Action */}
        <Link
          href="/admin/orders?status=pending"
          className="group rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 transition hover:bg-amber-50 hover:shadow-2xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {metrics.pendingOrders} Orders to Fulfill
              </p>
              <p className="text-[11px] text-amber-700/80">Pending packaging</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Strip 2: Pending Reviews */}
        <Link
          href="/admin/reviews"
          className="group rounded-2xl border border-stone-200/90 bg-white p-4 transition hover:bg-stone-50 hover:shadow-2xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Star className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">
                {metrics.pendingReviews} Client Reviews
              </p>
              <p className="text-[11px] text-stone-500">Moderation required</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Strip 3: Inquiries */}
        <Link
          href="/admin/inquiries"
          className="group rounded-2xl border border-stone-200/90 bg-white p-4 transition hover:bg-stone-50 hover:shadow-2xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">
                {metrics.unreadInquiries} Inquiries
              </p>
              <p className="text-[11px] text-stone-500">Support tickets</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Strip 4: Subscribers */}
        <Link
          href="/admin/subscribers"
          className="group rounded-2xl border border-stone-200/90 bg-white p-4 transition hover:bg-stone-50 hover:shadow-2xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">
                {metrics.totalSubscribers} Subscribers
              </p>
              <p className="text-[11px] text-stone-500">VIP newsletter reach</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* ── Recent Orders Showcase ── */}
      <div className="rounded-2xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 sm:px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 font-sans">
                Recent Orders
              </h2>
              <p className="text-xs text-stone-500">Latest transactions from your storefront</p>
            </div>
          </div>

          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#9c5247] hover:underline"
          >
            <span>View All ({metrics.totalOrders})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-14 text-center">
            <ShoppingCart className="mx-auto h-8 w-8 text-stone-300" />
            <p className="mt-2 text-sm font-semibold text-stone-800">No orders yet</p>
            <p className="text-xs text-stone-400">Customer checkouts will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Fulfillment Status</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5 text-right min-w-[120px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentOrders.map((order) => {
                  const customer = order.customerId ? customerById.get(order.customerId) : undefined;
                  const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
                    label: order.status,
                    bg: "bg-stone-100",
                    text: "text-stone-700",
                    border: "border-stone-200",
                    dot: "bg-stone-400",
                  };
                  const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus ?? "pending"] || {
                    label: order.paymentStatus ?? "Pending",
                    bg: "bg-stone-100",
                    text: "text-stone-700",
                    border: "border-stone-200",
                  };

                  return (
                    <tr key={order.id} className="group hover:bg-stone-50/60 transition-colors">
                      {/* Order Number */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-bold text-xs text-stone-900 hover:text-[#9c5247] transition"
                          >
                            #{order.orderNumber}
                          </Link>
                          <button
                            onClick={() => handleCopy(order.orderNumber, order.id)}
                            title="Copy Order #"
                            className="text-stone-400 hover:text-stone-700 transition"
                          >
                            {copiedId === order.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </div>
                        <span className="text-[11px] text-stone-400 block mt-0.5">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 font-bold text-stone-700 text-[10px]">
                            {getInitials(customer?.name || order.shippingAddress?.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-900 truncate max-w-[150px]">
                              {customer?.name || order.shippingAddress?.name || "Guest Customer"}
                            </p>
                            <p className="text-[11px] text-stone-400 truncate max-w-[150px]">
                              {customer?.email || order.shippingAddress?.phone || "No contact"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentConfig.bg} ${paymentConfig.text} ${paymentConfig.border}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                          {paymentConfig.label}
                        </span>
                        <p className="mt-1 text-[10px] text-stone-400 uppercase font-mono">
                          {order.paymentMethod === "cod" ? "COD" : "Online"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 font-bold text-stone-900 text-sm">
                        {formatCurrency(order.total, order.currency || "INR")}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-3 py-1.5 text-xs font-bold text-[#7f2d22] shadow-2xs transition-all hover:bg-[#9c5247] hover:text-white cursor-pointer"
                        >
                          <span>Manage</span>
                          <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {metrics.totalOrders > 5 && (
              <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-3 text-center">
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c5247] hover:underline"
                >
                  <span>View all {metrics.totalOrders} orders</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Quick Storefront Modules Navigation Grid ── */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 font-sans">
            Quick Store Modules
          </h2>
          <p className="text-xs text-stone-500">Direct shortcuts to critical storefront controls</p>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/categories"
            className="group rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs hover:border-[#9c5247] hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9c5247]/10 text-[#9c5247]">
                <FolderTree className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900 group-hover:text-[#9c5247] transition">
                  Categories
                </p>
                <p className="text-[11px] text-stone-500">Taxonomy & discovery</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-stone-400 group-hover:text-[#9c5247] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>

          <Link
            href="/admin/hero-slides"
            className="group rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs hover:border-[#9c5247] hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900 group-hover:text-[#9c5247] transition">
                  Hero Slides
                </p>
                <p className="text-[11px] text-stone-500">Homepage carousel</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-stone-400 group-hover:text-[#9c5247] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>

          <Link
            href="/admin/settings/coupons"
            className="group rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs hover:border-[#9c5247] hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900 group-hover:text-[#9c5247] transition">
                  Coupons
                </p>
                <p className="text-[11px] text-stone-500">Discounts & promo codes</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-stone-400 group-hover:text-[#9c5247] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>

          <Link
            href="/admin/settings/shipping"
            className="group rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs hover:border-[#9c5247] hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900 group-hover:text-[#9c5247] transition">
                  Shipping Rates
                </p>
                <p className="text-[11px] text-stone-500">Free delivery rules</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-stone-400 group-hover:text-[#9c5247] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
