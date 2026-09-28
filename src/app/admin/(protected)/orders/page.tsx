import { getDataProvider } from "@/lib/data";
import { OrdersManager } from "../_components/OrdersManager";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string }>;
}) {
  const { q, status, payment } = await searchParams;
  const provider = getDataProvider();

  const [orders, customers] = await Promise.all([
    provider.listOrders(),
    provider.listCustomers(),
  ]);

  return (
    <OrdersManager
      initialOrders={orders}
      customers={customers}
      initialSearch={q || ""}
      initialStatus={status || "all"}
      initialPayment={payment || "all"}
    />
  );
}
