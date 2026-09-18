import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package, Trash2, Truck, User } from "lucide-react";
import {
  deleteOrderAction,
  pushOrderToShiprocketAction,
  updateOrderPaymentStatusAction,
  updateOrderStatusAction,
} from "@/actions/admin/orders";
import { getDataProvider } from "@/lib/data";
import { AdminCard, EmptyState, formatCurrency, tableCell, tableHead } from "../../_components/AdminPage";
import { ConfirmDeleteButton } from "../../_components/ConfirmDeleteButton";
import { CopyTextButton } from "../../_components/CopyTextButton";
import { OrderStatusForm } from "../../_components/OrderStatusForm";
import { ShiprocketCard } from "../../_components/ShiprocketCard";

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

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
          ? "Cash on Delivery"
          : order.paymentMethod || "—";

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/orders"
            aria-label="Back to orders"
            className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-300 text-stone-600 transition hover:bg-stone-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900">
              Order #{order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-stone-500">Placed on {formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <ConfirmDeleteButton
          action={deleteOrderAction}
          id={order.id}
          confirmMessage="Delete this order? This cannot be undone."
          successMessage="Order deleted."
          redirectTo="/admin/orders"
          label="Delete order"
          icon={<Trash2 className="h-4 w-4" />}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <AdminCard>
            <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-4">
              <User className="h-4 w-4 text-stone-400" />
              <h2 className="font-semibold">Customer</h2>
            </div>
            <div className="space-y-1 p-5 text-sm text-stone-600">
              <p>{customer?.name || "Guest"}</p>
              <p>{customer?.email || "—"}</p>
              <p>{customer?.phone || "—"}</p>
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-4">
              <MapPin className="h-4 w-4 text-stone-400" />
              <h2 className="font-semibold">Shipping Address</h2>
            </div>
            <div className="p-5">
              {address ? (
                <address className="text-sm not-italic leading-6 text-stone-600">
                  {address.fullName}
                  <br />
                  {address.line1}
                  {address.line2 ? (
                    <>
                      <br />
                      {address.line2}
                    </>
                  ) : null}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                  <br />
                  {address.country || "IN"}
                  {address.phone ? (
                    <>
                      <br />
                      Phone: {address.phone}
                    </>
                  ) : null}
                </address>
              ) : (
                <p className="text-sm text-stone-400">No address recorded.</p>
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-4">
              <Package className="h-4 w-4 text-stone-400" />
              <h2 className="font-semibold">Order Items</h2>
            </div>
            {items.length === 0 ? (
              <EmptyState title="No items attached" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className={tableHead}>Product</th>
                      <th className={tableHead}>Size</th>
                      <th className={tableHead}>Color</th>
                      <th className={tableHead}>Design</th>
                      <th className={tableHead}>Product ID</th>
                      <th className={tableHead}>Unit Price</th>
                      <th className={tableHead}>Qty</th>
                      <th className={tableHead}>Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className={tableCell}>
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.productName}
                                width={40}
                                height={48}
                                className="h-12 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-12 w-10 rounded bg-stone-100" />
                            )}
                            <span className="font-semibold text-stone-900">{item.productName}</span>
                          </div>
                        </td>
                        <td className={tableCell}>{item.size || "—"}</td>
                        <td className={tableCell}>{item.color || "—"}</td>
                        <td className={tableCell}>
                          {/* ponytail: no design field in the schema, always em dash */}
                          {"—"}
                        </td>
                        <td className={tableCell}>
                          {item.productId ? (
                            <span className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-stone-500">
                                {item.productId.slice(0, 8)}…
                              </span>
                              <CopyTextButton value={item.productId} />
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className={tableCell}>{formatCurrency(item.unitPrice, currency)}</td>
                        <td className={tableCell}>{item.quantity}</td>
                        <td className={tableCell}>{formatCurrency(item.totalPrice, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>

          <AdminCard>
            <div className="border-b border-stone-100 px-5 py-4">
              <h2 className="font-semibold">Payment Summary</h2>
            </div>
            <div className="p-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-600">Subtotal</dt>
                  <dd>{formatCurrency(order.subtotal, currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-600">Shipping</dt>
                  <dd>
                    {order.shipping === 0 ? (
                      <span className="text-emerald-600">Free</span>
                    ) : (
                      formatCurrency(order.shipping, currency)
                    )}
                  </dd>
                </div>
                {order.discount > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-stone-600">Discount</dt>
                    <dd className="text-emerald-600">-{formatCurrency(order.discount, currency)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-stone-100 pt-3 font-bold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(order.total, currency)}</dd>
                </div>
              </dl>

              <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Payment Method</p>
                  <p className="mt-1 text-sm text-stone-700">{paymentMethod}</p>
                </div>

                {attempt && order.paymentMethod !== "cod" ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                        {attempt.provider.toUpperCase()} Transaction ID
                      </p>
                      <div className="mt-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
                        {attempt.transactionId}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                        {attempt.provider.toUpperCase()} Payment ID
                      </p>
                      <div className="mt-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
                        {attempt.providerPaymentId || "—"}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <div className="border-b border-stone-100 px-5 py-4">
              <h2 className="font-semibold">Timeline</h2>
            </div>
            <dl className="space-y-3 p-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-stone-600">Order Placed</dt>
                <dd className="text-right text-stone-900">{formatDateTime(order.createdAt)}</dd>
              </div>
              {attempt?.verifiedAt ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-stone-600">Paid</dt>
                  <dd className="text-right text-stone-900">{formatDateTime(attempt.verifiedAt)}</dd>
                </div>
              ) : null}
              {order.updatedAt ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-stone-600">Last Updated</dt>
                  <dd className="text-right text-stone-900">{formatDateTime(order.updatedAt)}</dd>
                </div>
              ) : null}
            </dl>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard className="p-5">
            <h2 className="mb-4 font-semibold">Manage Status</h2>
            <OrderStatusForm
              id={order.id}
              status={order.status}
              paymentStatus={order.paymentStatus}
              orderAction={updateOrderStatusAction}
              paymentAction={updateOrderPaymentStatusAction}
            />
          </AdminCard>

          <AdminCard>
            <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-4">
              <Truck className="h-4 w-4 text-stone-400" />
              <h2 className="font-semibold">Shipping (Shiprocket)</h2>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm text-stone-500">
                {"Pushes this order to Shiprocket. You'll then assign a courier and confirm pickup yourself from the Shiprocket dashboard."}
              </p>
              <ShiprocketCard action={pushOrderToShiprocketAction} id={order.id} />
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
