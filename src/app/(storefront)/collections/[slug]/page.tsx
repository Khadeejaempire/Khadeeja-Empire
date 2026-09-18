import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { getDataProvider } from "@/lib/data";
import {
  attachProductRatings,
  toStorefrontCategory,
  toStorefrontCollection,
  toStorefrontProduct,
} from "@/lib/storefront/adapters";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const provider = getDataProvider();
    const display =
      (await provider.getCollection(slug).catch(() => null)) ??
      (await provider.getCategory(slug).catch(() => null));
    const title =
      display?.name ||
      slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    return { title, description: display?.description || undefined };
  } catch {
    return { title: "Collection" };
  }
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;

  let collectionRecord = null;
  let categoryRecord = null;
  let productRecords: any[] = [];
  let categoryRecords: any[] = [];
  let reviewRecords: any[] = [];

  try {
    const provider = getDataProvider();
    const results = await Promise.all([
      provider.getCollection(slug).catch(() => null),
      provider.getCategory(slug).catch(() => null),
      provider.listProducts({ active: true }).catch(() => []),
      provider.listCategories({ active: true }).catch(() => []),
      provider.listReviews().catch(() => []),
    ]);
    collectionRecord = results[0];
    categoryRecord = results[1];
    productRecords = results[2] || [];
    categoryRecords = results[3] || [];
    reviewRecords = results[4] || [];
  } catch (err) {
    console.error("Error fetching collection page data:", err);
  }

  const categoryNames: Record<string, string> = {
    "short-kurtis": "Short Kurtis",
    "coord-sets": "Co-ord Sets",
    "everyday-tops": "Everyday Tops",
    dresses: "Dresses",
    "resort-and-whites": "Resort & Whites",
    "new-arrivals": "New Arrivals",
  };

  const displayName =
    collectionRecord?.name ||
    categoryRecord?.name ||
    categoryNames[slug] ||
    slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const products = attachProductRatings(productRecords.map(toStorefrontProduct), reviewRecords);
  const categories = categoryRecords.map(toStorefrontCategory);

  return (
    <div className="py-8 md:py-12">
      <Container className="max-w-[1460px]">
        <ShopCatalog
          products={products}
          categories={categories}
          initialCategory={slug}
          titleOverride={displayName}
        />
      </Container>
    </div>
  );
}
