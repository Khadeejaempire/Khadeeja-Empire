import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  Truck,
  XCircle,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getDataProvider } from "@/lib/data";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/content/site";
import { shouldApplyMappedStatus, syncShiprocketTracking } from "@/lib/shiprocket/fulfill";
import type { OrderStatus } from "@/lib/admin/types";
import { PrintButton } from "./PrintButton";
import { PrintReceipt } from "./PrintReceipt";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Details",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-stone-100 text-stone-600 border-stone-200",
};

function shipmentStatusStyle(rawStatus: string) {
  const s = rawStatus.toLowerCase();
  if (s.includes("deliver")) return "bg-green-50 text-green-700 border-green-200";
  if (s.includes("cancel") || s.includes("rto")) return "bg-red-50 text-red-700 border-red-200";
  if (s.includes("transit") || s.includes("out for") || s.includes("dispatch") || s.includes("pickup") || s.includes("shipped")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function trackingEventIcon(text: string) {
  const s = text.toLowerCase();
  if (s.includes("deliver")) return CheckCircle2;
  if (s.includes("transit") || s.includes("out for") || s.includes("dispatch") || s.includes("pickup")) return Truck;
  return Package;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

const TRACKING_STEPS: Array<{ key: OrderStatus; title: string; desc: string; icon: typeof Package }> = [
  { key: "pending", title: "Order Placed", desc: "Received & logged", icon: Package },
  { key: "processing", title: "Processing", desc: "Packing your order", icon: PackageCheck },
  { key: "shipped", title: "Shipped", desc: "In transit with courier", icon: Truck },
  { key: "delivered", title: "Delivered", desc: "Package delivered", icon: CheckCircle2 },
];

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/login?next=/account/orders/${id}`);

  const provider = getDataProvider();
  const order = await provider.getOrder(id);
  if (!order || order.customerId !== customer.id) notFound();

  const items = order.items?.length ? order.items : await provider.listOrderItems(order.id);

  // Best-effort live sync: catches an order whose webhook update never
  // arrived, and surfaces the AWB/courier/scan history for display. Never
  // blocks the page — if Shiprocket is slow or unreachable it just renders
  // whatever was already saved.
  let currentLocation: string | null = null;
  let scans: Array<{ date: string | null; status: string | null; activity: string | null; location: string | null }> = [];
  let liveSynced = false;
  if (order.shiprocketOrderId || order.awbCode) {
    try {
      const tracked = await syncShiprocketTracking({ shiprocketOrderId: order.shiprocketOrderId, awbCode: order.awbCode });
      const now = new Date().toISOString();
      const applyStatus = tracked.mappedStatus ? shouldApplyMappedStatus(order.status, tracked.mappedStatus) : false;
      await provider.updateOrderShipment(order.id, {
        awbCode: tracked.awbCode ?? order.awbCode,
        courierName: tracked.courierName ?? order.courierName,
        shiprocketStatus: tracked.shiprocketStatus ?? order.shiprocketStatus,
        shippedAt: applyStatus && tracked.mappedStatus === "shipped" ? order.shippedAt ?? now : order.shippedAt,
        deliveredAt: applyStatus && tracked.mappedStatus === "delivered" ? now : order.deliveredAt,
      });
      if (applyStatus && tracked.mappedStatus) await provider.updateOrderStatus(order.id, tracked.mappedStatus);

      order.awbCode = tracked.awbCode ?? order.awbCode;
      order.courierName = tracked.courierName ?? order.courierName;
      order.shiprocketStatus = tracked.shiprocketStatus ?? order.shiprocketStatus;
      if (applyStatus && tracked.mappedStatus) order.status = tracked.mappedStatus;
      currentLocation = tracked.currentLocation;
      scans = tracked.scans;
      liveSynced = true;
    } catch (error) {
      console.error("Failed to live-sync order with Shiprocket on customer order page:", error);
    }
  }

  const status = order.status;
  const statusStyle = STATUS_STYLES[status] ?? "bg-stone-100 text-stone-600 border-stone-200";
  const hasShipment = Boolean(order.shiprocketOrderId || order.awbCode);
  const isCancelled = status === "cancelled";
  const currentStep = isCancelled ? -1 : Math.max(1, TRACKING_STEPS.findIndex((s) => s.key === status) + 1);
  const stepTimes: Partial<Record<OrderStatus, string | null>> = {
    pending: formatDateTime(order.createdAt),
    shipped: formatDateTime(order.shippedAt),
    delivered: formatDateTime(order.deliveredAt),
  };

  const sortedScans = [...scans].sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return tb - ta;
  });

  return (
    <div className="py-12 md:py-16 print:py-0">
      <PrintReceipt order={order} items={items} address={order.shippingAddress} />
      <Container className="max-w-3xl print:hidden">
        <Link
          href="/account/orders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--color-maroon)] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to My Orders
        </Link>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-h1 text-ink">
              Order <span className="text-[var(--color-maroon)]">#{order.orderNumber}</span>
            </h1>
            <p className="mt-2 text-sm text-muted">
              Placed on {formatDate(order.createdAt)} &middot; {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <span className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wide border rounded-full ${statusStyle}`}>
            {status}
          </span>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <PrintButton orderNumber={order.orderNumber} />
          <a
            href={`https://wa.me/${siteConfig.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, I need assistance with my Order #${order.orderNumber}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold uppercase tracking-wide transition-colors"
          >
            <Phone size={14} />
            WhatsApp Support
          </a>
        </div>

        <div className="flex flex-col gap-6">
          {/* Live tracking progress */}
          <div className="border border-border p-5 sm:p-6">
            {isCancelled ? (
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 border border-red-200">
                  <XCircle size={22} className="text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-ink">This order has been cancelled</p>
                  <p className="mt-1 text-xs text-muted">For refund or cancellation queries, reach out via WhatsApp support above.</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-0 right-0 top-6 h-0.5 bg-border" />
                <div
                  className="absolute left-0 top-6 h-0.5 bg-[var(--color-maroon)] transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, ((currentStep - 1) / (TRACKING_STEPS.length - 1)) * 100))}%` }}
                />
                <div className="relative flex justify-between">
                  {TRACKING_STEPS.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isDone = currentStep >= stepNum;
                    const StepIcon = step.icon;
                    return (
                      <div key={step.key} className="flex max-w-[100px] flex-col items-center text-center">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            isDone
                              ? "border-[var(--color-maroon)] bg-[var(--color-maroon)] text-white"
                              : "border-border bg-white text-muted"
                          }`}
                        >
                          <StepIcon size={18} />
                        </div>
                        <p className={`mt-3 text-xs font-semibold ${isDone ? "text-ink" : "text-muted"}`}>{step.title}</p>
                        <p className="mt-0.5 hidden text-[10px] text-muted sm:block">{step.desc}</p>
                        {stepTimes[step.key] && <p className="mt-1 text-[10px] font-semibold text-[var(--color-maroon)]">{stepTimes[step.key]}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Shipment tracking */}
          {hasShipment && (
            <div className="border border-border p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-ink">Shipment Tracking</h2>
                    <p className="text-[11px] uppercase tracking-wide text-muted">Powered by Shiprocket</p>
                  </div>
                </div>
                {liveSynced && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Live
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-[var(--color-surface)] p-4">
                {order.shiprocketStatus && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${shipmentStatusStyle(order.shiprocketStatus)}`}>
                    {order.shiprocketStatus}
                  </span>
                )}
                {currentLocation && (
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Current Location</p>
                      <p className="text-sm font-semibold text-ink">{currentLocation}</p>
                    </div>
                    <MapPin size={18} className="text-[var(--color-maroon)]" />
                  </div>
                )}
              </div>

              {order.awbCode && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[160px] border border-border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">AWB Number</p>
                    <p className="mt-0.5 select-all font-mono text-sm font-semibold text-ink">{order.awbCode}</p>
                  </div>
                  {order.courierName && (
                    <div className="flex-1 min-w-[160px] border border-border p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Courier</p>
                      <p className="mt-0.5 text-sm font-semibold text-ink">{order.courierName}</p>
                    </div>
                  )}
                </div>
              )}

              {order.awbCode && (
                <a
                  href={`https://shiprocket.co/tracking/${order.awbCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="print:hidden mt-4 inline-flex h-10 items-center justify-center gap-2 bg-[var(--color-maroon)] px-6 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[var(--color-maroon-deep)]"
                >
                  <ExternalLink size={14} />
                  Track Shipment on Shiprocket
                </a>
              )}

              {sortedScans.length > 0 && (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">Tracking Timeline</p>
                  <div className="max-h-80 space-y-0 overflow-y-auto pr-2">
                    {sortedScans.map((scan, idx) => {
                      const isLatest = idx === 0;
                      const EventIcon = trackingEventIcon(scan.activity || scan.status || "");
                      return (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                isLatest ? "bg-[var(--color-maroon)] text-white" : "border border-border bg-white text-muted"
                              }`}
                            >
                              <EventIcon size={14} />
                            </div>
                            {idx !== sortedScans.length - 1 && <div className="my-1 w-px flex-1 bg-border" />}
                          </div>
                          <div className={`min-w-0 flex-1 ${isLatest ? "pb-4" : "pb-5"}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`text-sm font-semibold ${isLatest ? "text-ink" : "text-muted"}`}>{scan.activity || scan.status}</p>
                              {isLatest && (
                                <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-green-700">
                                  Latest
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                              {scan.location && <span>{scan.location}</span>}
                              {scan.location && scan.date && <span>&middot;</span>}
                              {scan.date && <span>{formatDateTime(scan.date)}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasShipment && !isCancelled && (
            <div className="flex items-center gap-4 border border-border p-5 sm:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-600">
                <Truck size={20} />
              </div>
              <div>
                <p className="font-semibold text-ink">Shipment Tracking</p>
                <p className="mt-1 text-sm text-muted">Your order hasn&apos;t shipped yet. As soon as it ships, detailed courier tracking will appear here.</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="border border-border p-5 sm:p-6">
            <h2 className="mb-4 font-semibold text-ink">Items ({items.length})</h2>
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-border bg-[var(--color-surface)]">
                    {item.image ? (
                      <Image src={item.image} alt={item.productName} fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{item.productName}</p>
                    <p className="mt-1 text-xs text-muted">
                      {item.size ? `Size: ${item.size} · ` : ""}
                      {item.color ? `Color: ${item.color} · ` : ""}
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink">{formatPrice(item.totalPrice, order.currency ?? "INR")}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">{formatPrice(order.subtotal, order.currency ?? "INR")}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span className="font-semibold text-ink">{order.shipping === 0 ? "FREE" : formatPrice(order.shipping, order.currency ?? "INR")}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                  <span>-{formatPrice(order.discount, order.currency ?? "INR")}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-ink">
                <span>Total</span>
                <span>{formatPrice(order.total, order.currency ?? "INR")}</span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="border border-border p-5 sm:p-6">
              <h2 className="mb-4 font-semibold text-ink">Shipping Address</h2>
              <p className="font-semibold text-ink">
                {order.shippingAddress.fullName} &middot; {order.shippingAddress.phone}
              </p>
              <p className="mt-2 text-sm text-muted">{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p className="text-sm text-muted">{order.shippingAddress.line2}</p>}
              <p className="text-sm text-muted">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
            </div>
          )}

          {/* Payment */}
          <div className="border border-border p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]">
                <CreditCard size={18} />
              </div>
              <h2 className="font-semibold text-ink">Payment</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted">Method:</span>
              <span className="font-semibold text-ink">{order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod ?? "—"}</span>
              <span className="text-border">|</span>
              <span className="text-muted">Status:</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                  order.paymentStatus === "paid" ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {order.paymentStatus === "paid" && <CheckCircle2 size={14} />}
                {order.paymentStatus ?? "Pending"}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
