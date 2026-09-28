import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Package,
  Trash2,
  Truck,
  User,
  CreditCard,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Mail,
  Phone,
  Sparkles,
  AlertCircle,
  XCircle,
  Tag,
} from "lucide-react";
import {
  deleteOrderAction,
  pushOrderToShiprocketAction,
  updateOrderPaymentStatusAction,
  updateOrderStatusAction,
} from "@/actions/admin/orders";
import { getDataProvider } from "@/lib/data";
import { AdminCard, formatCurrency } from "../../_components/AdminPage";
import { ConfirmDeleteButton } from "../../_components/ConfirmDeleteButton";
import { CopyTextButton } from "../../_components/CopyTextButton";
import { OrderStatusForm } from "../../_components/OrderStatusForm";
import { ShiprocketCard } from "../../_components/ShiprocketCard";

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
    label: "Payment Failed",
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

function getInitials(name?: string | null) {
  if (!name) return "KE";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = getDataProvider();
  const order = await provider.getOrder(id);
  if (!order) notFound();

  const items = order.items?.length ? order.items : await provider.listOrderItems(order.id);
  const [customer, attempt] = await Promise.all([
    order.customerId ? provider.getCustomer(order.customerId) : Promise.resolve(null),
    provider.getLatestPaymentAttemptForOrder(order.id),
  ]);

  const address = order.shippingAddress;
  const currency = order.currency || "INR";
  const paymentMethod =
    order.paymentMethod === "payu"
      ? "Online Payment (PayU)"
      : order.paymentMethod === "cashfree"
        ? "Online Payment (Cashfree)"
        : order.paymentMethod === "cod"
          ? "Cash on Delivery (COD)"
          : order.paymentMethod || "—";

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

  const recipientName = address?.fullName || customer?.name || "Customer";
  const street1 = address?.line1 || "";
  const street2 = address?.line2 || "";
  const fullAddressString = [
    recipientName,
    street1,
    street2,
    address?.city,
    address?.state,
    address?.postalCode,
    address?.country || "India",
    address?.phone ? `Phone: ${address.phone}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Bar: Breadcrumbs & Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 font-medium text-stone-600 transition hover:text-[#9c5247]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Orders
            </Link>
            <span>/</span>
            <span className="font-sans font-bold text-stone-800 tracking-tight">
              #{order.orderNumber}
            </span>
          </div>

          {/* Heading with Status Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900 font-sans" style={{ fontVariantNumeric: "lining-nums" }}>
              #{order.orderNumber}
            </h1>
            <CopyTextButton
              value={order.orderNumber}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-2xs hover:bg-stone-50 hover:text-stone-800 transition"
            />

            {/* Order Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>

            {/* Payment Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentConfig.bg} ${paymentConfig.text} ${paymentConfig.border}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {paymentConfig.label}
            </span>
          </div>

          <p className="text-xs text-stone-500">
            Placed on {formatDateTime(order.createdAt)} • {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        {/* Top Right Action: Delete Order */}
        <div className="flex items-center gap-2">
          <ConfirmDeleteButton
            action={deleteOrderAction}
            id={order.id}
            confirmMessage="Delete this order? This action cannot be undone."
            successMessage="Order deleted."
            redirectTo="/admin/orders"
            label="Delete Order"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-2xs transition hover:bg-rose-50 active:scale-95 disabled:cursor-wait disabled:opacity-60"
          />
        </div>
      </div>

      {/* ── Main Two-Column Grid ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px]">
        {/* ── Left Column: Items, Payment, Timeline ── */}
        <div className="space-y-6">
          {/* Card 1: Order Items */}
          <AdminCard className="p-5 sm:p-6 shadow-2xs border border-stone-200/90 rounded-2xl bg-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                    Order Items ({items.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Handcrafted products requested by the client
                  </p>
                </div>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 italic">
                No items recorded for this order.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-1 last:pb-1"
                  >
                    {/* Item Thumbnail & Details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative h-14 w-14 rounded-xl border border-stone-200 bg-stone-50 overflow-hidden shrink-0 shadow-2xs">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.productName}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-stone-400 text-xs">
                            KE
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-stone-900 truncate">
                          {item.productName}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                          {item.size && (
                            <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                              Color: {item.color}
                            </span>
                          )}
                          {item.sku && (
                            <span className="font-mono text-[10px] text-stone-400">
                              SKU: {item.sku}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Pricing */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-stone-500 block">Unit Price</span>
                        <span className="text-xs font-semibold text-stone-800">
                          {formatCurrency(item.unitPrice, currency)}
                        </span>
                      </div>

                      <div className="text-center">
                        <span className="text-xs text-stone-500 block">Qty</span>
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-stone-100 px-1.5 text-xs font-bold text-stone-800">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="text-right min-w-[80px]">
                        <span className="text-xs text-stone-500 block">Total</span>
                        <span className="text-sm font-bold text-stone-900">
                          {formatCurrency(item.totalPrice, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>

          {/* Card 2: Payment & Financial Breakdown */}
          <AdminCard className="p-5 sm:p-6 shadow-2xs border border-stone-200/90 rounded-2xl bg-white space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  Financial Breakdown & Payment
                </h2>
                <p className="text-xs text-stone-500">
                  Gateway verification, subtotal, shipping, and totals
                </p>
              </div>
            </div>

            {/* Calculations List */}
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-stone-900">
                  {formatCurrency(order.subtotal, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span>Shipping Fee</span>
                <span>
                  {order.shipping === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      FREE SHIPPING
                    </span>
                  ) : (
                    <span className="font-semibold text-stone-900">
                      {formatCurrency(order.shipping, currency)}
                    </span>
                  )}
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    Discount Applied
                    {order.couponCode && (
                      <span className="rounded bg-emerald-100 px-1 text-[10px] font-mono">
                        ({order.couponCode})
                      </span>
                    )}
                  </span>
                  <span>-{formatCurrency(order.discount, currency)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-sm font-bold text-stone-900">
                <span>Final Total Amount</span>
                <span className="text-lg font-extrabold text-[#9c5247]">
                  {formatCurrency(order.total, currency)}
                </span>
              </div>
            </div>

            {/* Payment Method & Gateway Details */}
            <div className="rounded-xl border border-stone-200/80 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Payment Mode
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-stone-50 text-stone-700 border-stone-200">
                  {paymentMethod}
                </span>
              </div>

              {attempt && order.paymentMethod !== "cod" && (
                <div className="grid gap-2.5 pt-2 border-t border-stone-100 sm:grid-cols-2 text-xs">
                  <div className="rounded-lg bg-stone-50 p-2.5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      {attempt.provider.toUpperCase()} Transaction ID
                    </span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-xs text-stone-800 truncate">
                        {attempt.transactionId}
                      </span>
                      <CopyTextButton value={attempt.transactionId} />
                    </div>
                  </div>

                  {attempt.providerPaymentId && (
                    <div className="rounded-lg bg-stone-50 p-2.5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                        Gateway Payment ID
                      </span>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs text-stone-800 truncate">
                          {attempt.providerPaymentId}
                        </span>
                        <CopyTextButton value={attempt.providerPaymentId} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {order.paymentMethod === "cod" && (
                <div className="rounded-lg bg-amber-50/70 border border-amber-200/60 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cash on Delivery:</strong> Please verify customer contact before dispatch. Collect{" "}
                    <strong>{formatCurrency(order.total, currency)}</strong> in cash at delivery.
                  </span>
                </div>
              )}
            </div>
          </AdminCard>

          {/* Card 3: Milestone Timeline */}
          <AdminCard className="p-5 sm:p-6 shadow-2xs border border-stone-200/90 rounded-2xl bg-white space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  Lifecycle Timeline
                </h2>
                <p className="text-xs text-stone-500">
                  Timestamp log of order placement, payment, and status revisions
                </p>
              </div>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {/* Event 1: Order Placed */}
              <div className="relative">
                <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-bold text-stone-900">Order Placed</p>
                  <p className="text-[11px] text-stone-500">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>

              {/* Event 2: Payment Verified */}
              {attempt?.verifiedAt && (
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white ring-4 ring-white">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-stone-900">Payment Verified ({attempt.provider})</p>
                    <p className="text-[11px] text-stone-500">{formatDateTime(attempt.verifiedAt)}</p>
                  </div>
                </div>
              )}

              {/* Event 3: Last Updated */}
              {order.updatedAt && (
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-400 text-white ring-4 ring-white">
                    <Clock className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-stone-900">Last Status Revision</p>
                    <p className="text-[11px] text-stone-500">{formatDateTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        {/* ── Right Column: Status Manager, Customer, Shipping Address, Shiprocket ── */}
        <div className="space-y-6">
          {/* Box 1: Status & Payment Control */}
          <AdminCard className="p-5 sm:p-6 shadow-2xs border border-stone-200/90 rounded-2xl bg-white space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  Manage Status
                </h2>
                <p className="text-xs text-stone-500">
                  Update dispatch progression & payment
                </p>
              </div>
            </div>

            <OrderStatusForm
              id={order.id}
              status={order.status}
              paymentStatus={order.paymentStatus}
              orderAction={updateOrderStatusAction}
              paymentAction={updateOrderPaymentStatusAction}
            />
          </AdminCard>

          {/* Box 2: Shiprocket Logistics */}
          <AdminCard className="p-5 sm:p-6 shadow-2xs border border-stone-200/90 rounded-2xl bg-white space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  Shiprocket Logistics
                </h2>
                <p className="text-[11px] text-stone-500">Courier allocation & airway bill</p>
              </div>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Pushes this order to Shiprocket. You can assign a courier partner and generate pickup manifests directly.
            </p>

            <ShiprocketCard action={pushOrderToShiprocketAction} id={order.id} />
          </AdminCard>

          {/* Box 3: Shipping & Delivery Address */}
          <AdminCard className="p-5 sm:p-6 shadow-2xs border border-stone-200/90 rounded-2xl bg-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                    Shipping Address
                  </h2>
                </div>
              </div>

              {fullAddressString && (
                <CopyTextButton
                  value={fullAddressString}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 transition shadow-2xs"
                />
              )}
            </div>

            {address ? (
              <div className="space-y-1.5 text-xs text-stone-700 leading-relaxed font-medium">
                <p className="font-bold text-stone-900 text-sm">{recipientName}</p>
                {street1 && <p>{street1}</p>}
                {street2 && <p>{street2}</p>}
                <p>
                  {address.city}
                  {address.state ? `, ${address.state}` : ""}
                  {address.postalCode ? ` - ${address.postalCode}` : ""}
                </p>
                <p className="text-stone-500 uppercase">{address.country || "India"}</p>
                {address.phone && (
                  <p className="pt-2 text-stone-500 font-mono">Contact: {address.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic py-2">No address recorded.</p>
            )}
          </AdminCard>

          {/* Box 4: Customer Profile */}
          <AdminCard className="p-5 sm:p-6 shadow-2xs border border-stone-200/90 rounded-2xl bg-white space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  Client Profile
                </h2>
                <p className="text-xs text-stone-500">Buyer contact and history</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9c5247]/15 to-[#7f4037]/10 font-bold text-[#9c5247] text-sm shadow-2xs">
                  {getInitials(recipientName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">
                    {recipientName}
                  </p>
                  <p className="text-xs text-stone-500">Registered Customer</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
                {customer?.email && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-stone-500">
                      <Mail className="h-3.5 w-3.5 text-stone-400" />
                      Email
                    </span>
                    <a
                      href={`mailto:${customer.email}`}
                      className="font-medium text-[#9c5247] hover:underline truncate max-w-[190px]"
                    >
                      {customer.email}
                    </a>
                  </div>
                )}

                {(customer?.phone || address?.phone) && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-stone-500">
                      <Phone className="h-3.5 w-3.5 text-stone-400" />
                      Phone
                    </span>
                    <a
                      href={`tel:${customer?.phone || address?.phone}`}
                      className="font-mono font-medium text-stone-800 hover:underline"
                    >
                      {customer?.phone || address?.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
