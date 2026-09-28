import { getDataProvider } from "@/lib/data";
import { AdminDashboard } from "./_components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const provider = getDataProvider();
  const [metrics, customers] = await Promise.all([
    provider.getDashboardMetrics(),
    provider.listCustomers(),
  ]);

  return <AdminDashboard metrics={metrics} customers={customers} />;
}


