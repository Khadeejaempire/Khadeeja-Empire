"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Search,
  Eye,
  ExternalLink,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  XCircle,
  LayoutGrid,
  List,
  X,
  ArrowUpDown,
  Copy,
  Check,
  CreditCard,
  User,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  ShoppingBag,
  IndianRupee,
  Calendar,
  ChevronRight,
  Filter,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { CustomerRecord, OrderItemRecord, OrderRecord, OrderStatus, PaymentStatus } from "@/lib/admin/types";
import { updateOrderPaymentStatusAction, updateOrderStatusAction } from "@/actions/admin/orders";
import { adminActionMessage } from "@/lib/admin/errors";

type ViewMode = "table" | "grid";
type SortOption = "newest" | "oldest" | "total-desc" | "total-asc";

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string; icon: any }
> = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
    icon: RefreshCw,
  },
  shipped: {
    label: "Shipped",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-500",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    bg: "bg-stone-100",
    text: "text-stone-700",
    border: "border-stone-200",
    dot: "bg-stone-400",
    icon: AlertCircle,
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

function formatPrice(value?: number | null, curr = "INR") {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: curr || "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(parsed);
}

function formatDateShort(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(parsed);
}

function getInitials(name?: string | null) {
  if (!name) return "KE";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface OrdersManagerProps {
  initialOrders: OrderRecord[];
  customers: CustomerRecord[];
  initialSearch?: string;
  initialStatus?: string;
  initialPayment?: string;
}

export function OrdersManager({
  initialOrders,
  customers,
  initialSearch = "",
  initialStatus = "all",
  initialPayment = "all",
}: OrdersManagerProps) {
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [search, setSearch] = useState(initialSearch);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedPayment, setSelectedPayment] = useState<string>(initialPayment);
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick slide-over drawer modal
  const [drawerOrder, setDrawerOrder] = useState<OrderRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  // Customer map
  const customerById = useMemo(() => {
    return new Map(customers.map((c) => [c.id, c]));
  }, [customers]);

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPIs
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const paidRevenue = orders
      .filter((o) => o.paymentStatus === "paid" && o.status !== "cancelled" && o.status !== "refunded")
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter((o) => ["pending", "confirmed", "processing"].includes(o.status)).length;
    const deliveredOrders = orders.filter((o) => o.status === "delivered").length;

    return { totalOrders, paidRevenue, pendingOrders, deliveredOrders };
  }, [orders]);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (selectedStatus !== "all") {
      result = result.filter((o) => o.status === selectedStatus);
    }

    // Payment status filter
    if (selectedPayment !== "all") {
      result = result.filter((o) => (o.paymentStatus ?? "pending") === selectedPayment);
    }

    // Payment method filter
    if (selectedMethod !== "all") {
      if (selectedMethod === "cod") {
        result = result.filter((o) => o.paymentMethod?.toLowerCase().includes("cod"));
      } else if (selectedMethod === "online") {
        result = result.filter((o) => !o.paymentMethod?.toLowerCase().includes("cod"));
      }
    }

    // Search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((order) => {
        const customer = order.customerId ? customerById.get(order.customerId) : undefined;
        const matchesNumber = order.orderNumber?.toLowerCase().includes(q);
        const matchesCustomer = customer?.name?.toLowerCase().includes(q) || customer?.email?.toLowerCase().includes(q) || customer?.phone?.includes(q);
        const matchesCity = order.shippingAddress?.city?.toLowerCase().includes(q) || order.shippingAddress?.state?.toLowerCase().includes(q);
        const matchesItems = order.items?.some((item) => item.productName?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q));
        return matchesNumber || matchesCustomer || matchesCity || matchesItems;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      if (sortBy === "oldest") return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      if (sortBy === "total-desc") return (b.total || 0) - (a.total || 0);
      if (sortBy === "total-asc") return (a.total || 0) - (b.total || 0);
      return 0;
    });

    return result;
  }, [orders, selectedStatus, selectedPayment, selectedMethod, search, sortBy, customerById]);

  // Quick Status Update inside Drawer
  const handleQuickStatusChange = (orderId: string, newStatus: OrderStatus) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", orderId);
        formData.set("status", newStatus);
        await updateOrderStatusAction(formData);

        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (drawerOrder && drawerOrder.id === orderId) {
          setDrawerOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        toast.success(`Order status updated to ${newStatus}`);
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not update status"));
      }
    });
  };

  const handleQuickPaymentStatusChange = (orderId: string, newPaymentStatus: PaymentStatus) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", orderId);
        formData.set("paymentStatus", newPaymentStatus);
        await updateOrderPaymentStatusAction(formData);

        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o))
        );
        if (drawerOrder && drawerOrder.id === orderId) {
          setDrawerOrder((prev) => (prev ? { ...prev, paymentStatus: newPaymentStatus } : null));
        }
        toast.success(`Payment status updated to ${newPaymentStatus}`);
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not update payment status"));
      }
    });
  };

  // Status Counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedStatus !== "all" ||
    selectedPayment !== "all" ||
    selectedMethod !== "all";

  const clearAllFilters = () => {
    setSearch("");
    setSelectedStatus("all");
    setSelectedPayment("all");
    setSelectedMethod("all");
    setSortBy("newest");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#9c5247] to-[#7f4037] text-white shadow-md shadow-[#9c5247]/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                Orders Management
              </h1>
              <p className="text-xs sm:text-sm text-stone-500">
                Track client acquisitions, dispatch timelines, and payment fulfillments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Metric KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {/* Card 1: Total Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#9c5247]/10 text-[#9c5247]">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              {stats.totalOrders}
            </span>
            <span className="text-xs text-stone-400 font-medium">all-time</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            Khadeeja storefront transactions
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Collected Revenue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-700">
              {formatPrice(stats.paidRevenue)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600/80 font-medium">
            Paid & verified orders
          </div>
        </div>

        {/* Card 3: Pending & In-Progress */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Pending Dispatch
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-700">
              {stats.pendingOrders}
            </span>
            {stats.pendingOrders > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Action needed
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            Awaiting packing or shipping
          </div>
        </div>

        {/* Card 4: Delivered */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Delivered
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-700">
              {stats.deliveredOrders}
            </span>
            {stats.totalOrders > 0 && (
              <span className="text-xs text-stone-400 font-medium">
                ({Math.round((stats.deliveredOrders / stats.totalOrders) * 100)}% rate)
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            Successfully completed deliveries
          </div>
        </div>
      </div>

      {/* ── Status Pills Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "all", label: "All Orders", count: statusCounts.all || 0 },
          { key: "pending", label: "Pending", count: statusCounts.pending || 0 },
          { key: "confirmed", label: "Confirmed", count: statusCounts.confirmed || 0 },
          { key: "processing", label: "Processing", count: statusCounts.processing || 0 },
          { key: "shipped", label: "Shipped", count: statusCounts.shipped || 0 },
          { key: "delivered", label: "Delivered", count: statusCounts.delivered || 0 },
          { key: "cancelled", label: "Cancelled", count: statusCounts.cancelled || 0 },
        ].map(({ key, label, count }) => {
          const isSelected = selectedStatus === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? "bg-[#9c5247] text-white shadow-sm shadow-[#9c5247]/20 scale-102"
                  : "border border-stone-200/90 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              <span>{label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search, Secondary Filters & View Controls ── */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer name, email, phone, city, or product..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-[#9c5247] focus:bg-white focus:ring-2 focus:ring-[#9c5247]/15"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls: Dropdowns & View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Payment Status Dropdown */}
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 outline-none transition hover:border-stone-300 focus:border-[#9c5247]"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending Payment</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Payment Method Dropdown */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 outline-none transition hover:border-stone-300 focus:border-[#9c5247]"
            >
              <option value="all">All Methods</option>
              <option value="online">Online (Prepaid)</option>
              <option value="cod">Cash on Delivery</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-medium text-stone-700 outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="total-desc">Highest Total</option>
                <option value="total-asc">Lowest Total</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-stone-200 bg-stone-100 p-0.5">
              <button
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "table"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                title="Grid Cards View"
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "grid"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
          <span>
            Showing <strong className="text-stone-900 font-semibold">{filteredOrders.length}</strong> of{" "}
            {orders.length} orders
          </span>
          {hasActiveFilters && (
            <span className="text-[11px] text-[#9c5247] font-medium">Filters active</span>
          )}
        </div>
      </div>

      {/* ── View: Table Mode ── */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <Package className="h-7 w-7" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-stone-900">No orders found</h3>
              <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
                No orders match your current search terms or filter selection.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#9c5247] px-4 py-2 text-xs font-semibold text-white hover:bg-[#854036] transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-5 py-3.5">Order</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Items</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Total</th>
                    <th className="px-5 py-3.5 text-right min-w-[170px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.map((order) => {
                    const customer = order.customerId ? customerById.get(order.customerId) : undefined;
                    const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
                      label: order.status,
                      bg: "bg-stone-100",
                      text: "text-stone-700",
                      border: "border-stone-200",
                      dot: "bg-stone-400",
                      icon: Clock,
                    };
                    const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus ?? "pending"] || {
                      label: order.paymentStatus ?? "Pending",
                      bg: "bg-stone-100",
                      text: "text-stone-700",
                      border: "border-stone-200",
                    };
                    const StatusIcon = statusConfig.icon;
                    const itemCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || (order.items?.length ?? 1);

                    return (
                      <tr
                        key={order.id}
                        className="group hover:bg-stone-50/60 transition-colors"
                      >
                        {/* Order Column */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-900">
                              #{order.orderNumber}
                            </span>
                            <button
                              onClick={() => handleCopy(order.orderNumber, `order-${order.id}`)}
                              title="Copy order number"
                              className="text-stone-400 hover:text-stone-700 transition"
                            >
                              {copiedId === `order-${order.id}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                          </div>
                          <div className="mt-1 text-[11px] text-stone-400">
                            {formatDateTime(order.createdAt)}
                          </div>
                        </td>

                        {/* Customer Column */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-stone-100 to-stone-200 font-bold text-stone-700 text-[11px] shadow-2xs">
                              {getInitials(customer?.name || order.shippingAddress?.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-900 truncate max-w-[160px]">
                                {customer?.name || order.shippingAddress?.fullName || "Guest Customer"}
                              </p>
                              <p className="text-[11px] text-stone-400 truncate max-w-[160px]">
                                {customer?.email || order.shippingAddress?.phone || "No contact"}
                              </p>
                              {order.shippingAddress?.city && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-stone-400">
                                  <MapPin className="h-2.5 w-2.5 text-stone-300" />
                                  {order.shippingAddress.city}
                                  {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Items Preview */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {order.items && order.items.length > 0 ? (
                              <div className="flex items-center -space-x-2">
                                {order.items.slice(0, 3).map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="relative h-8 w-8 rounded-lg border-2 border-white bg-stone-100 overflow-hidden shadow-2xs shrink-0"
                                    title={`${item.productName} (${item.quantity}x)`}
                                  >
                                    {item.image ? (
                                      <Image
                                        src={item.image}
                                        alt={item.productName}
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-400 text-[9px] font-bold">
                                        KE
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white bg-stone-200 text-[10px] font-bold text-stone-700 shadow-2xs shrink-0">
                                    +{order.items.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : null}
                            <span className="text-[11px] font-medium text-stone-500 pl-1">
                              {itemCount} {itemCount === 1 ? "item" : "items"}
                            </span>
                          </div>
                        </td>

                        {/* Payment Column */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${paymentConfig.bg} ${paymentConfig.text} ${paymentConfig.border}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                            {paymentConfig.label}
                          </span>
                          <p className="mt-1 text-[11px] text-stone-400 uppercase font-mono">
                            {order.paymentMethod === "cod"
                              ? "Cash on Delivery"
                              : order.paymentMethod || "Online"}
                          </p>
                        </td>

                        {/* Order Status Column */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                            <StatusIcon className="h-3.5 w-3.5 opacity-70" />
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Total Column */}
                        <td className="px-5 py-4 text-right">
                          <div className="font-bold text-sm text-stone-900">
                            {formatPrice(order.total, order.currency || "INR")}
                          </div>
                          {order.discount > 0 && (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              Saved {formatPrice(order.discount)}
                            </span>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {/* Quick Preview Button */}
                            <button
                              type="button"
                              onClick={() => setDrawerOrder(order)}
                              title="Quick Order Preview"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 shadow-xs transition hover:border-[#9c5247] hover:bg-[#9c5247]/5 hover:text-[#9c5247] active:scale-95 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-stone-500" />
                              <span>Quick</span>
                            </button>

                            {/* Full Order Page Link - Light background with high-contrast bold dark text */}
                            <Link
                              href={`/admin/orders/${order.id}`}
                              title="Manage Order & Shipping"
                              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-3.5 py-1.5 text-xs font-bold text-[#7f2d22] shadow-2xs transition-all hover:bg-[#9c5247] hover:text-white active:scale-95 cursor-pointer"
                            >
                              <span>Manage</span>
                              <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── View: Grid Mode ── */}
      {viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => {
            const customer = order.customerId ? customerById.get(order.customerId) : undefined;
            const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
              label: order.status,
              bg: "bg-stone-100",
              text: "text-stone-700",
              border: "border-stone-200",
              dot: "bg-stone-400",
              icon: Clock,
            };
            const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus ?? "pending"] || {
              label: order.paymentStatus ?? "Pending",
              bg: "bg-stone-100",
              text: "text-stone-700",
              border: "border-stone-200",
            };
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs transition hover:shadow-md hover:border-stone-300 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top: Order # & Status Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div>
                      <span className="font-mono text-sm font-bold text-stone-900 block">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="pt-3 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-stone-100 to-stone-200 font-bold text-stone-700 text-xs shadow-2xs">
                      {getInitials(customer?.name || order.shippingAddress?.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-stone-900 truncate">
                        {customer?.name || order.shippingAddress?.fullName || "Guest Customer"}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {customer?.email || order.shippingAddress?.phone || "No contact"}
                      </p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>Items ({order.items.length})</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="relative h-11 w-11 rounded-lg border border-stone-200 bg-stone-50 overflow-hidden shrink-0"
                            title={`${item.productName} (x${item.quantity})`}
                          >
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.productName}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-400 font-bold">
                                KE
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Price, Payment & Action */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-stone-900 block">
                      {formatPrice(order.total, order.currency || "INR")}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${paymentConfig.bg} ${paymentConfig.text} ${paymentConfig.border}`}
                    >
                      {paymentConfig.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDrawerOrder(order)}
                      className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:border-[#9c5247] hover:text-[#9c5247] transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Quick</span>
                    </button>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-3.5 py-1.5 text-xs font-bold text-[#7f2d22] shadow-2xs transition-all hover:bg-[#9c5247] hover:text-white cursor-pointer"
                    >
                      <span>Manage</span>
                      <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Slide-over Quick Drawer Modal ── */}
      {drawerOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50/70">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-stone-900">
                    Order #{drawerOrder.orderNumber}
                  </span>
                  <button
                    onClick={() => handleCopy(drawerOrder.orderNumber, "drawer-num")}
                    className="text-stone-400 hover:text-stone-700 transition"
                  >
                    {copiedId === "drawer-num" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-stone-500">
                  Placed on {formatDateTime(drawerOrder.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/orders/${drawerOrder.id}`}
                  className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Full Page
                </Link>
                <button
                  onClick={() => setDrawerOrder(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Status Bar */}
              <div className="rounded-2xl border border-stone-200/90 bg-stone-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Quick Status Manager
                  </span>
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#9c5247] font-medium animate-pulse">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Updating…
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-500 block mb-1">
                      Fulfillment Status
                    </label>
                    <select
                      value={drawerOrder.status}
                      disabled={isPending}
                      onChange={(e) =>
                        handleQuickStatusChange(drawerOrder.id, e.target.value as OrderStatus)
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-800 outline-none focus:border-[#9c5247]"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-500 block mb-1">
                      Payment Status
                    </label>
                    <select
                      value={drawerOrder.paymentStatus ?? "pending"}
                      disabled={isPending}
                      onChange={(e) =>
                        handleQuickPaymentStatusChange(
                          drawerOrder.id,
                          e.target.value as PaymentStatus
                        )
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-800 outline-none focus:border-[#9c5247]"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Section */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-stone-700">
                  <User className="h-4 w-4 text-[#9c5247]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Customer & Delivery</h3>
                </div>

                {(() => {
                  const cust = drawerOrder.customerId
                    ? customerById.get(drawerOrder.customerId)
                    : undefined;
                  const addr = drawerOrder.shippingAddress;
                  return (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Name</span>
                        <span className="font-semibold text-stone-900">
                          {cust?.name || addr?.fullName || "Guest Customer"}
                        </span>
                      </div>
                      {(cust?.email || addr?.phone) && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Contact</span>
                          <span className="font-mono text-stone-800">
                            {cust?.email || addr?.phone}
                          </span>
                        </div>
                      )}
                      {addr && (
                        <div className="pt-2 border-t border-stone-100">
                          <span className="text-[11px] text-stone-400 block mb-1">Shipping Address:</span>
                          <p className="text-stone-700 leading-relaxed font-medium">
                            {[
                              addr.line1,
                              addr.line2,
                              addr.city,
                              addr.state,
                              addr.postalCode,
                              addr.country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Order Items List */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-700">
                    <Package className="h-4 w-4 text-[#9c5247]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Ordered Products ({drawerOrder.items?.length || 0})
                    </h3>
                  </div>
                </div>

                <div className="divide-y divide-stone-100">
                  {drawerOrder.items && drawerOrder.items.length > 0 ? (
                    drawerOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                        <div className="relative h-12 w-12 rounded-xl border border-stone-200 bg-stone-50 overflow-hidden shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.productName}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-bold text-stone-400 text-xs">
                              KE
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stone-900 truncate">
                            {item.productName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                            <span>Qty: {item.quantity}</span>
                            {item.size && <span>• Size: {item.size}</span>}
                            {item.color && <span>• {item.color}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-stone-900">
                            {formatPrice(item.totalPrice || item.unitPrice * item.quantity)}
                          </span>
                          <span className="block text-[10px] text-stone-400">
                            {formatPrice(item.unitPrice)} each
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-400 italic py-2">No item details stored.</p>
                  )}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="rounded-2xl border border-stone-200/90 bg-stone-50/50 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(drawerOrder.subtotal, drawerOrder.currency || "INR")}</span>
                </div>
                {drawerOrder.discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-medium">
                    <span>Discount {drawerOrder.couponCode ? `(${drawerOrder.couponCode})` : ""}</span>
                    <span>-{formatPrice(drawerOrder.discount, drawerOrder.currency || "INR")}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-stone-600">
                  <span>Shipping</span>
                  <span>
                    {drawerOrder.shipping > 0
                      ? formatPrice(drawerOrder.shipping, drawerOrder.currency || "INR")
                      : "FREE"}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm font-bold text-stone-900">
                  <span>Total Amount</span>
                  <span className="text-base text-[#9c5247]">
                    {formatPrice(drawerOrder.total, drawerOrder.currency || "INR")}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-stone-200 px-6 py-4 bg-stone-50/50 flex items-center justify-between">
              <span className="text-xs text-stone-500 font-mono">
                Method: {drawerOrder.paymentMethod || "Online"}
              </span>
              <Link
                href={`/admin/orders/${drawerOrder.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#9c5247] to-[#7f4037] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#9c5247]/20 hover:brightness-105 transition"
              >
                <span>Manage Order & Shipping</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
