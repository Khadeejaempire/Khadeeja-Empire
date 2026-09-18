import Link from "next/link";
import { Eye } from "lucide-react";
import { getDataProvider } from "@/lib/data";
import {
  AdminCard,
  EmptyState,
  PageHeading,
  StatusBadge,
  formatCurrency,
  formatDate,
  tableCell,
  tableHead,
} from "../_components/AdminPage";
import OrdersFilterBar from "../_components/OrdersFilterBar";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string }>;
}) {
  const { q, status, payment } = await searchParams;
  const provider = getDataProvider();
  const [orders, customers] = await Promise.all([
    provider.listOrders({
      status: status || undefined,
      paymentStatus: payment || undefined,
    }),
    provider.listCustomers(),
  ]);

  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const query = q?.trim().toLowerCase() ?? "";
  const visibleOrders = query
    ? orders.filter((order) => {
        const customer = order.customerId ? customerById.get(order.customerId) : undefined;
        return [order.orderNumber, order.status, order.paymentStatus, customer?.name, customer?.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
    : orders;

  return (
    <div>
      <PageHeading title="Orders" description="Manage and track all store orders." />
      <div className="mb-4">
        <OrdersFilterBar q={q} status={status} payment={payment} />
      </div>
      <AdminCard>
        {visibleOrders.length === 0 ? (
          <EmptyState title="No orders found" detail="Orders created at checkout will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className={tableHead}>Order</th>
                  <th className={tableHead}>Date</th>
                  <th className={tableHead}>Customer</th>
                  <th className={tableHead}>Total</th>
                  <th className={tableHead}>Payment</th>
                  <th className={tableHead}>Status</th>
                  <th className={tableHead}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visibleOrders.map((order) => {
                  const customer = order.customerId ? customerById.get(order.customerId) : undefined;
                  return (
                    <tr key={order.id} className="hover:bg-stone-50/70">
                      <td className={tableCell}>
                        <span className="font-semibold text-stone-900">#{order.orderNumber}</span>
                      </td>
                      <td className={tableCell}>{formatDate(order.createdAt)}</td>
                      <td className={tableCell}>
                        <p className="font-semibold text-stone-900">{customer?.name || "—"}</p>
                        <p className="text-xs text-stone-400">{customer?.email || "—"}</p>
                      </td>
                      <td className={tableCell}>
                        {formatCurrency(order.total, order.currency || "INR")}
                      </td>
                      <td className={tableCell}>
                        <StatusBadge value={order.paymentStatus} />
                        <p className="mt-1 text-xs text-stone-400">{order.paymentMethod || "—"}</p>
                      </td>
                      <td className={tableCell}>
                        <StatusBadge value={order.status} />
                      </td>
                      <td className={tableCell}>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          aria-label="View order"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 text-stone-600 transition hover:bg-stone-100"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
