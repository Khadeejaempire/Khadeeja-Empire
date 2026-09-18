import { StoreShell } from "@/components/layout/StoreShell";
import { getDataProvider } from "@/lib/data";
import { toStorefrontCategory, toStorefrontProduct } from "@/lib/storefront/adapters";
import { getCurrentCustomer } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const now = Date.now();
  const provider = getDataProvider();
  const [announcementRecords, productRecords, categoryRecords, discoveryRecords, customer] = await Promise.all([
    provider.listAnnouncements({ active: true }),
    provider.listProducts({ active: true }),
    provider.listCategories({ active: true }),
    provider.listDiscoveryMenuEntries({ active: true }),
    getCurrentCustomer(),
  ]);
  const announcements = announcementRecords
    .filter((item) => {
      const startsAt = item.startsAt ? Date.parse(item.startsAt) : null;
      const endsAt = item.endsAt ? Date.parse(item.endsAt) : null;
      return (!startsAt || startsAt <= now) && (!endsAt || endsAt > now);
    })
    .map((item) => item.text);

  const categories = categoryRecords.map(toStorefrontCategory);
  const discoveryLinks = discoveryRecords.map((entry) => ({ label: entry.label, href: entry.href }));
  const customerSummary = customer ? { name: customer.name ?? null, email: customer.email ?? null } : null;

  // The search drawer only needs a lightweight projection, not full products.
  const searchProducts = productRecords.map((record) => {
    const product = toStorefrontProduct(record);
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      collection: product.collection,
      tags: product.tags,
      images: product.images.slice(0, 1),
      price: product.price,
      currency: product.currency,
    };
  });

  return (
    <StoreShell
      announcements={announcements}
      products={searchProducts}
      categories={categories}
      discoveryLinks={discoveryLinks}
      customer={customerSummary}
    >
      {children}
    </StoreShell>
  );
}
