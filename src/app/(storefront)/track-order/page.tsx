import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Package, Truck, XCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getDataProvider } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import type { OrderRecord } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Order",
};

const STAGES = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

function formatOrderDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

async function lookupOrder(orderNumber: string, contact: string): Promise<{ order: OrderRecord | null; error?: string }> {
  if (!orderNumber || !contact) return { order: null, error: "Enter both your order number and the email or phone used at checkout." };

  const provider = getDataProvider();
  const order = await provider.getOrder(orderNumber.trim()).catch(() => null);
  if (!order) return { order: null, error: `We could not find order "${orderNumber}". Check the number and try again.` };

  const customer = order.customerId ? await provider.getCustomer(order.customerId).catch(() => null) : null;
  const contactLower = contact.trim().toLowerCase();
  const phone = normalizePhone(contact);
  const phones = [customer?.phone ?? "", order.shippingAddress?.phone ?? ""].map(normalizePhone).filter(Boolean);

  const matches = contactLower.includes("@")
    ? (customer?.email ?? "").toLowerCase() === contactLower
    : phone.length === 10 && phones.some((candidate) => candidate === phone);

  if (!matches) {
    return { order: null, error: "That email or phone does not match this order. Please check and try again." };
  }
  return { order };
}

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; contact?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = (params.order ?? "").trim();
  const contact = (params.contact ?? "").trim();
  const submitted = Boolean(params.order || params.contact);
  const { order, error } = submitted ? await lookupOrder(orderNumber, contact) : { order: null, error: undefined };

  const currentStage = order ? STAGES.indexOf(order.status as (typeof STAGES)[number]) : -1;
  const isClosed = order?.status === "cancelled" || order?.status === "refunded";

  return (
    <div className="py-12 md:py-16">
      <Container className="max-w-3xl">
        <h1 className="text-h1 text-ink">Track your order</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your order number and the email or phone used at checkout.
        </p>

        <form className="mt-8 grid gap-4 sm:grid-cols-2" method="get">
          <label className="text-sm font-medium text-ink">
            Order number
            <input
              name="order"
              required
              defaultValue={orderNumber}
              placeholder="KE-XXXXXX"
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <label className="text-sm font-medium text-ink">
            Email or phone
            <input
              name="contact"
              required
              defaultValue={contact}
              placeholder="you@example.com"
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="h-11 px-6 inline-flex items-center justify-center bg-[#2d2520] hover:bg-primary !text-white font-semibold tracking-widest text-xs uppercase transition-colors"
              style={{ color: "#ffffff" }}
            >
              Track order
            </button>
          </div>
        </form>

        {submitted && error ? (
          <div className="mt-8 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {order ? (
          <div className="mt-10 border border-border p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="text-sm font-semibold text-ink">#{order.orderNumber}</p>
                <p className="text-xs text-muted mt-0.5">{formatOrderDate(order.createdAt)}</p>
              </div>
              <span className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide border rounded-full border-border text-ink">
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>

            {isClosed ? (
              <div className="mt-5 flex items-center gap-3 text-sm text-muted">
                <XCircle size={18} className="text-red-500" />
                This order is {order.status}. Contact us if you need help.
              </div>
            ) : (
              <ol className="mt-6 flex flex-col gap-0 sm:flex-row sm:justify-between">
                {STAGES.map((stage, index) => {
                  const reached = index <= currentStage;
                  return (
                    <li key={stage} className="flex flex-1 items-center gap-3 sm:flex-col sm:text-center">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full border ${reached ? "border-primary bg-primary text-white" : "border-border bg-surface text-muted"}`}
                      >
                        {index === 0 ? <Clock size={16} /> : index === 3 ? <Truck size={16} /> : index === 4 ? <CheckCircle2 size={16} /> : <Package size={16} />}
                      </span>
                      <span className={`text-xs font-medium ${reached ? "text-ink" : "text-muted"}`}>
                        {STATUS_LABELS[stage]}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            <ul className="mt-6 flex flex-col gap-2 border-t border-border pt-4">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-ink">
                    {item.productName}
                    {item.size ? ` (${item.size})` : ""} &times; {item.quantity}
                  </span>
                  <span className="text-muted shrink-0">{formatPrice(item.totalPrice, order.currency ?? "INR")}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs uppercase tracking-wide text-muted">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod ?? ""}
              </span>
              <span className="font-semibold text-ink">{formatPrice(order.total, order.currency ?? "INR")}</span>
            </div>

            <p className="mt-6 text-xs text-muted">
              Need help? <Link href="/contact" className="underline hover:text-primary">Contact us</Link>.
            </p>
          </div>
        ) : null}
      </Container>
    </div>
  );
}
