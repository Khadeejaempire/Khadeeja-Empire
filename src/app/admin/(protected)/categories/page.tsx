import { getDataProvider } from "@/lib/data";
import { CategoriesManager } from "../_components/CategoriesManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const provider = getDataProvider();
  const [categories, discovery] = await Promise.all([
    provider.listCategories(),
    provider.listDiscoveryMenuEntries(),
  ]);

  return <CategoriesManager categories={categories} discovery={discovery} />;
}
