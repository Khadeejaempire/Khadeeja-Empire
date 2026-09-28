import { getDataProvider } from "@/lib/data";
import { ProductsManager } from "../_components/ProductsManager";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const provider = getDataProvider();
  const [products, categories] = await Promise.all([
    provider.listProducts(),
    provider.listCategories(),
  ]);

  return (
    <ProductsManager
      initialProducts={products}
      categories={categories}
      initialSearch={q || ""}
    />
  );
}
