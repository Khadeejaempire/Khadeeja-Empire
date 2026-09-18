import type {
  Category,
  CategorySlug,
  Collection,
  CollectionSlug,
  HeroSlide,
  InstagramPost,
  Product,
  ProductTag,
} from "@/types";
import type {
  CategoryRecord,
  CollectionRecord,
  HeroSlideRecord,
  InstagramPostRecord,
  ProductImageRecord,
  ProductRecord,
  ReviewRecord,
} from "@/lib/admin/types";

const asCategorySlug = (slug: string | null | undefined): CategorySlug =>
  (slug ?? "new-arrivals") as CategorySlug;

const asCollectionSlug = (slug: string | null | undefined): CollectionSlug =>
  (slug ?? "new-arrivals") as CollectionSlug;

const fallbackImage = "/assets/slides/girl-1.png";

function imageUrl(image: ProductImageRecord | string): string {
  return typeof image === "string" ? image : image.url;
}

export function toStorefrontProduct(record: ProductRecord): Product {
  const categorySlug = asCategorySlug(record.categorySlug ?? record.category?.slug);
  const collectionSlug = asCollectionSlug(
    record.collectionSlug ?? record.collection?.slug ?? record.categorySlug
  );

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    category: categorySlug,
    collection: collectionSlug,
    description: record.description ?? record.shortDescription ?? "",
    images: (record.images ?? []).map(imageUrl).filter(Boolean).length
      ? (record.images ?? []).map(imageUrl).filter(Boolean)
      : [fallbackImage],
    video: record.video ?? undefined,
    price: record.price ?? 0,
    oldPrice: record.oldPrice ?? undefined,
    currency: record.currency ?? "INR",
    priceStatus: record.priceStatus ?? "demo",
    sizes: record.sizes ?? [],
    tags: (record.tags ?? []) as ProductTag[],
    availability: record.availability ?? "out-of-stock",
    sourcePostId: record.sourcePostId ?? "",
    sourceUrl: record.sourceUrl ?? "",
    isPrototypeData: record.isPrototypeData ?? false,
    badge: record.badge ?? undefined,
    hoverImage: record.hoverImage ?? undefined,
  };
}

export function attachProductRatings(products: Product[], reviews: ReviewRecord[]): Product[] {
  const totals = new Map<string, { sum: number; count: number }>();
  for (const review of reviews) {
    if (review.status !== "approved" || !review.productId) continue;
    const entry = totals.get(review.productId) ?? { sum: 0, count: 0 };
    entry.sum += review.rating || 0;
    entry.count += 1;
    totals.set(review.productId, entry);
  }

  return products.map((product) => {
    const entry = totals.get(product.id);
    if (!entry) return product;
    return { ...product, rating: { average: entry.sum / entry.count, count: entry.count } };
  });
}

export function toStorefrontCategory(record: CategoryRecord): Category {
  return {
    slug: asCategorySlug(record.slug),
    name: record.name,
    description: record.description ?? "",
    image: record.image || fallbackImage,
  };
}

export function toStorefrontCollection(record: CollectionRecord): Collection {
  return {
    slug: asCollectionSlug(record.slug),
    name: record.name,
    description: record.description ?? "",
    image: record.image ?? "",
    heroCopy: record.heroCopy ?? record.description ?? "",
  };
}

export function toStorefrontInstagramPost(record: InstagramPostRecord): InstagramPost {
  return {
    id: record.id,
    caption: record.caption ?? "",
    hashtags: record.hashtags ?? [],
    shortCode: record.shortCode ?? "",
    sourceUrl: record.sourceUrl ?? "",
    type: record.type ?? "Image",
    image: record.image,
    video: record.video ?? undefined,
    timestamp: record.timestamp ?? "",
  };
}

export function toStorefrontHeroSlide(record: HeroSlideRecord): HeroSlide {
  return {
    id: record.id,
    title: record.title,
    subtitle: record.subtitle ?? "",
    image: record.image,
    imageAlt: record.imageAlt ?? record.title,
    video: record.video ?? undefined,
    cta: record.cta ?? "Explore",
    ctaLink: record.ctaLink ?? "/shop",
    collection: asCollectionSlug(record.collectionSlug),
  };
}

export const adaptProduct = toStorefrontProduct;
export const adaptCategory = toStorefrontCategory;
export const adaptCollection = toStorefrontCollection;
export const adaptInstagramPost = toStorefrontInstagramPost;
export const adaptHeroSlide = toStorefrontHeroSlide;
