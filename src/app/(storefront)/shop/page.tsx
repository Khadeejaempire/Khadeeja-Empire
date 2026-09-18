import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { getDataProvider } from "@/lib/data";
import {
  attachProductRatings,
  toStorefrontCategory,
  toStorefrontProduct,
} from "@/lib/storefront/adapters";

export const metadata: Metadata = {
  title: "Shop All",
  description: "Browse our full collection of elegant Indian womenswear.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawPriceUnder = Array.isArray(params.price_under)
    ? params.price_under[0]
    : params.price_under;

  const priceUnder = rawPriceUnder ? Number(rawPriceUnder) : undefined;

  const provider = getDataProvider();
  const [productRecords, categoryRecords, reviewRecords] = await Promise.all([
    provider.listProducts({ active: true }),
    provider.listCategories({ active: true }),
    provider.listReviews(),
  ]);

  const products = attachProductRatings(productRecords.map(toStorefrontProduct), reviewRecords);
  const categories = categoryRecords.map(toStorefrontCategory);

  return (
    <div className="py-8 md:py-12">
      <Container className="max-w-[1460px]">
        <ShopCatalog
          products={products}
          categories={categories}
          priceUnder={priceUnder}
        />
      </Container>
    </div>
  );
}
