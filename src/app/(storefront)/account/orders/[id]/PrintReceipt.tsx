import type { AddressRecord, OrderItemRecord, OrderRecord } from "@/lib/admin/types";
import { siteConfig } from "@/content/site";
import { formatPrice } from "@/lib/utils";

export function PrintReceipt({
  order,
  items,
  address,
}: {
  order: OrderRecord;
  items: OrderItemRecord[];
  address?: AddressRecord | null;
}) {
  const placedOn = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const receiptDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const currency = order.currency ?? "INR";

  return (
    <div className="hidden print:block p-10 text-black">
      {/* Letterhead */}
      <div className="flex items-start justify-between border-b-2 border-black pb-6">
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={siteConfig.logo}
            alt={siteConfig.name}
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 object-contain"
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-wide">{siteConfig.name}</h1>
            <p className="mt-1 text-xs">{siteConfig.tagline}</p>
            <p className="mt-3 text-[11px]">
              {siteConfig.phone} &middot; {siteConfig.email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold uppercase tracking-widest">Order Receipt</h2>
          <p className="mt-2 text-[11px]">Receipt Date: {receiptDate}</p>
        </div>
      </div>

      {/* Order & Customer Info */}
      <div className="grid grid-cols-2 gap-8 border-b border-black/20 py-6">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-black/50">Order Details</p>
          <p className="text-sm">
            <span className="font-semibold">Order #:</span> {order.orderNumber}
          </p>
          <p className="mt-0.5 text-sm">
            <span className="font-semibold">Placed On:</span> {placedOn}
          </p>
          <p className="mt-0.5 text-sm">
            <span className="font-semibold">Payment Method:</span> {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod ?? "Online Payment"}
          </p>
          <p className="mt-0.5 text-sm">
            <span className="font-semibold">Payment Status:</span> <span className="capitalize">{order.paymentStatus ?? "Pending"}</span>
          </p>
        </div>
        {address && (
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-black/50">Billed &amp; Shipped To</p>
            <p className="text-sm font-semibold">{address.fullName}</p>
            <p className="mt-0.5 text-sm">{address.phone}</p>
            <p className="mt-0.5 text-sm">{address.line1}</p>
            {address.line2 && <p className="text-sm">{address.line2}</p>}
            <p className="text-sm">
              {address.city}, {address.state} {address.postalCode}
            </p>
          </div>
        )}
      </div>

      {/* Items Table */}
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-2 text-left text-[10px] font-bold uppercase tracking-wider">Item</th>
            <th className="py-2 text-left text-[10px] font-bold uppercase tracking-wider">Variant</th>
            <th className="py-2 text-center text-[10px] font-bold uppercase tracking-wider">Qty</th>
            <th className="py-2 text-right text-[10px] font-bold uppercase tracking-wider">Price</th>
            <th className="py-2 text-right text-[10px] font-bold uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx} className="border-b border-black/15">
              <td className="py-2.5 pr-2">{item.productName}</td>
              <td className="py-2.5 pr-2 text-black/70">{[item.size, item.color].filter(Boolean).join(" / ") || "—"}</td>
              <td className="py-2.5 text-center">{item.quantity}</td>
              <td className="py-2.5 text-right">{formatPrice(item.unitPrice, currency)}</td>
              <td className="py-2.5 text-right font-semibold">{formatPrice(item.totalPrice, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping, currency)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>-{formatPrice(order.discount, currency)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-black pt-2 text-base font-bold">
            <span>Total Paid</span>
            <span>{formatPrice(order.total, currency)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-black/20 pt-4 text-center">
        <p className="text-sm font-semibold">Thank you for shopping with {siteConfig.name}!</p>
        <p className="mt-1 text-[11px] text-black/60">
          For any queries regarding this order, contact us at {siteConfig.phone} or {siteConfig.email}
        </p>
        <p className="mt-4 text-[10px] text-black/40">This is a computer-generated receipt and does not require a signature.</p>
      </div>
    </div>
  );
}
