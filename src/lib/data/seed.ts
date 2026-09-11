import { categories, collections } from "../../content/categories";
import { heroSlides, products } from "../../content/catalog";
import { instagramPosts } from "../../content/instagram";
import { siteConfig } from "../../content/site";
import type {
  AdminDataState,
  ProductImageRecord,
  ProductInformationRecord,
  ProductRecord,
  SizeChartMeasurements,
} from "../admin/types";

const seedTimestamp = "2026-08-05T00:00:00.000Z";

const demoMeasurements: SizeChartMeasurements = {
  enabled: true,
  unit: "cm",
  sizes: [
    { size: "XXS", chest: "30-32", waist: "24-26", hip: "32-34" },
    { size: "XS", chest: "32-34", waist: "26-28", hip: "34-36" },
    { size: "S", chest: "34-36", waist: "28-30", hip: "36-38" },
    { size: "M", chest: "36-38", waist: "30-32", hip: "38-40" },
    { size: "L", chest: "38-40", waist: "32-34", hip: "40-42" },
    { size: "XL", chest: "40-42", waist: "34-36", hip: "42-44" },
  ],
};

export function createSeedData(): AdminDataState {
  const images: ProductImageRecord[] = [];
  const seededProducts: ProductRecord[] = products.map((product) => {
    const productImages = product.images.map((url, index) => {
      const image: ProductImageRecord = {
        id: `${product.id}-image-${index + 1}`,
        productId: product.id,
        url,
        sortOrder: index,
        isPrimary: index === 0,
        type: "image",
        createdAt: seedTimestamp,
      };
      images.push(image);
      return image;
    });

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      categorySlug: product.category,
      collectionSlug: product.collection,
      images: productImages,
      video: product.video,
      price: product.price,
      currency: product.currency,
      priceStatus: product.priceStatus,
      sizes: product.sizes,
      tags: product.tags,
      availability: product.availability,
      sourcePostId: product.sourcePostId,
      sourceUrl: product.sourceUrl,
      isPrototypeData: product.isPrototypeData,
      badge: product.badge,
      hoverImage: product.hoverImage,
      active: true,
      featured: product.badge === "featured",
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    };
  });
  const productInformation: ProductInformationRecord[] = seededProducts.slice(0, 6).map((product) => ({
    id: `${product.id}-information`,
    productId: product.id,
    measurements: {
      ...demoMeasurements,
      sizes: demoMeasurements.sizes?.map((size) => ({ ...size })),
    },
  }));

  return {
    products: seededProducts,
    categories: categories.map((category, index) => ({
      id: `category-${category.slug}`,
      slug: category.slug,
      name: category.name,
      description: category.description,
      image: category.image,
      active: true,
      sortOrder: index,
    })),
    collections: collections.map((collection, index) => ({
      id: `collection-${collection.slug}`,
      slug: collection.slug,
      name: collection.name,
      description: collection.description,
      image: collection.image,
      heroCopy: collection.heroCopy,
      active: true,
      sortOrder: index,
    })),
    colors: [],
    variants: [],
    images,
    productInformation,
    profiles: [],
    customers: [],
    addresses: [],
    orders: [],
    orderItems: [],
    paymentAttempts: [],
    reviews: [],
    inquiries: [],
    subscribers: [],
    heroSlides: heroSlides.map((slide, index) => ({
      id: slide.id,
      title: slide.title,
      subtitle: slide.subtitle,
      image: slide.image,
      imageAlt: slide.imageAlt,
      video: slide.video,
      cta: slide.cta,
      ctaLink: slide.ctaLink,
      collectionSlug: slide.collection,
      active: true,
      sortOrder: index,
    })),
    instagramPosts: instagramPosts.map((post, index) => ({
      id: post.id,
      caption: post.caption,
      hashtags: post.hashtags,
      shortCode: post.shortCode,
      sourceUrl: post.sourceUrl,
      type: post.type,
      image: post.image,
      video: post.video,
      timestamp: post.timestamp,
      active: true,
      sortOrder: index,
    })),
    testimonials: [],
    faqs: [],
    announcements: siteConfig.announcements.map((text, index) => ({
      id: `announcement-${index + 1}`,
      text,
      active: true,
      sortOrder: index,
    })),
    settings: [
      { id: "setting-site-name", key: "site.name", value: siteConfig.name },
      { id: "setting-site-tagline", key: "site.tagline", value: siteConfig.tagline },
      { id: "setting-site-logo", key: "site.logo", value: siteConfig.logo },
      { id: "setting-site-email", key: "site.email", value: siteConfig.email },
      { id: "setting-site-phone", key: "site.phone", value: siteConfig.phone },
      { id: "setting-site-instagram", key: "site.instagram", value: siteConfig.instagram },
      { id: "setting-shipping-threshold", key: "shipping.freeThreshold", value: 2000 },
      { id: "setting-shipping-default", key: "shipping.defaultRate", value: 99 },
      { id: "setting-shipping-cod", key: "shipping.codAvailable", value: true },
    ],
    coupons: [],
    shippingRates: [
      {
        id: "shipping-standard",
        name: "Standard shipping",
        amount: 99,
        freeAbove: 2000,
        codAvailable: true,
        active: true,
      },
    ],
    promoSettings: {
      id: "promo-home",
      enabled: false,
      frequency: "session",
      maxViews: 1,
    },
    discoveryMenuEntries: [],
  };
}
