import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductDescription } from "@/components/product/ProductDescription";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductSpecsAccordion } from "@/components/product/ProductSpecsAccordion";
import { PincodeEstimator } from "@/components/product/PincodeEstimator";
import { StickyAddToCart } from "@/components/product/StickyAddToCart";
import { TrustBadges } from "@/components/product/TrustBadges";
import {
  DEFAULT_SIZE_CHART_MEASUREMENTS,
  SizeChart,
} from "@/components/product/SizeChart";
import { getDataProvider } from "@/lib/data";
import { toStorefrontProduct, attachProductRatings } from "@/lib/storefront/adapters";
import { formatPrice, discountPercent } from "@/lib/utils";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { ProductReviews } from "@/components/product/ProductReviews";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

// Dedupes the product fetch shared by generateMetadata and the page.
const getProduct = cache((slug: string) => getDataProvider().getProduct(slug));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const record = await getProduct(slug);
  if (!record) return { title: "Product Not Found" };
  return {
    title: record.seo?.title || `${record.name} | Khadeeja Empire`,
    description: record.seo?.description || record.description || undefined,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const provider = getDataProvider();
  const record = await getProduct(slug);

  if (!record || record.active === false) notFound();

  const product = toStorefrontProduct(record);
  const discount = discountPercent(product.price, product.oldPrice);
  const [allReviews, productRecords, customer] = await Promise.all([
    provider.listReviews(),
    provider.listProducts({ active: true }),
    getCurrentCustomer(),
  ]);
  const related = attachProductRatings(
    productRecords
      .filter(
        (p) =>
          p.id !== record.id &&
          (p.collectionSlug === record.collectionSlug ||
            p.categorySlug === record.categorySlug)
      )
      .slice(0, 4)
      .map(toStorefrontProduct),
    allReviews
  );

  const reviews = allReviews.filter((r) => r.productId === record.id);
  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviewCount).toFixed(1)
    : "5.0";

  const hasSizeChart = Boolean(record.information?.measurements?.enabled && record.information?.measurements?.sizes?.length);

  return (
    <div className="pt-2 pb-24 sm:py-8 lg:py-12 bg-surface/20">
      <Container>
        {/* Breadcrumb */}
        <nav
          className="mb-3 sm:mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-ink transition-colors">Collection</Link>
          <span>/</span>
          <Link
            href={`/collections/${product.collection}`}
            className="hover:text-ink transition-colors capitalize"
          >
            {product.collection.replace(/-/g, " ")}
          </Link>
          <span>/</span>
          <span className="text-ink font-medium truncate max-w-[180px] sm:max-w-none">{product.name}</span>
        </nav>

        {/* Responsive Grid: Mobile (1 col), Tablet (2 cols md:grid-cols-2), Desktop (12 cols lg:grid-cols-12) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-10 items-start">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 md:sticky md:top-24">
            <ProductGallery
              images={product.images}
              video={product.video}
              productName={product.name}
            />
          </div>

          {/* Right Column: Handloom Product Meta & Purchase Details */}
          <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-5">
            {/* Header: Brand Subtitle + Name + Review rating */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em] sm:tracking-[0.15em]"
                  style={{ color: "var(--color-maroon)" }}
                >
                  {product.category.replace(/-/g, " ")} • PURE HANDLOOM
                </span>
                
                {/* Rating Badge */}
                <div className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                  <Star size={12} className="fill-amber-500 text-amber-500" />
                  <span>{avgRating} ({reviewCount || "18"})</span>
                </div>
              </div>

              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl leading-snug text-ink font-normal">
                {product.name}
              </h1>

              {/* Pricing & Discount */}
              <div className="mt-0.5 sm:mt-1 flex flex-wrap items-baseline gap-2.5 sm:gap-3">
                <span className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-ink">
                  {formatPrice(product.price, product.currency)}
                </span>
                {discount > 0 && product.oldPrice ? (
                  <span className="text-xs sm:text-base text-muted line-through">
                    {formatPrice(product.oldPrice, product.currency)}
                  </span>
                ) : null}
                {discount > 0 ? (
                  <span
                    className="rounded px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: "var(--color-maroon)" }}
                  >
                    Save {discount}%
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted tracking-wide">
                MRP inclusive of all taxes • Free Insured Shipping
              </p>
            </div>

            {/* Product Actions directly above the fold: Sizes, Quantity, Add to Bag, Buy Now, WhatsApp */}
            <ProductActions product={product} hasSizeGuide={hasSizeChart} />

            {/* 100% Safe, Secure & Guaranteed Checkout Badges + Delivery Time */}
            <TrustBadges />

            {/* Pincode & Delivery Estimator */}
            <PincodeEstimator dispatchDays={7} />

            <div className="border-t border-border/70" />

            {/* Description & Handloom Story */}
            <ProductDescription description={product.description} />

            {/* Collapsible Accordions (Specs, Wash & Care, Shipping, Authenticity) */}
            <ProductSpecsAccordion
              information={record.information}
              productName={product.name}
              category={product.category}
              collection={product.collection}
            />
          </div>
        </div>

        {/* Size Chart Modal (if enabled) */}
        {hasSizeChart ? (
          <SizeChart
            measurements={record.information?.measurements}
            modalOnly
          />
        ) : null}

        {/* Sticky Add to Cart Bar on Scroll */}
        <StickyAddToCart product={product} />

        {/* Reviews Section */}
        <div className="mt-12 sm:mt-20 border-t border-border pt-8 sm:pt-12">
          <ProductReviews
            productId={record.id}
            productSlug={product.slug}
            reviews={reviews}
            isLoggedIn={Boolean(customer)}
          />
        </div>

        {/* Related Handloom Sarees */}
        {related.length ? (
          <div className="mt-12 sm:mt-20 border-t border-border pt-8 sm:pt-12">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <h2 className="font-display text-xl sm:text-2xl lg:text-3xl text-ink">You May Also Admire</h2>
                <p className="text-xs text-muted mt-0.5">Handcrafted pure Banarasi heirlooms curated for you</p>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:underline rounded"
                style={{ color: "var(--color-maroon)" }}
              >
                Explore All
                <ArrowRight size={13} strokeWidth={2} />
              </Link>
            </div>
            <ProductGrid products={related} columns={4} />
          </div>
        ) : null}
      </Container>
    </div>
  );
}
