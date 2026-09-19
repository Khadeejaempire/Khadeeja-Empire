import { Fraunces } from "next/font/google";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { BrandIntro } from "@/components/home/BrandIntro";
import { CollectionGrid } from "@/components/home/CollectionGrid";
import { ExclusiveDeals } from "@/components/home/ExclusiveDeals";
import { NewCollection } from "@/components/home/NewCollection";
import { ProductRail } from "@/components/home/ProductRail";
import { CraftStory } from "@/components/home/CraftStory";
import { ValuesSection } from "@/components/home/ValuesSection";
import { VideoStrip } from "@/components/home/VideoStrip";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { HomeTheme } from "@/components/home/HomeTheme";
import { PublicReviews, type PublicReviewItem } from "@/components/home/PublicReviews";
import { HomeFaqs } from "@/components/home/HomeFaqs";
import { PromoPopup } from "@/components/home/PromoPopup";
import { getDataProvider } from "@/lib/data";
import {
  attachProductRatings,
  toStorefrontCategory,
  toStorefrontHeroSlide,
  toStorefrontInstagramPost,
  toStorefrontProduct,
} from "@/lib/storefront/adapters";

const homeDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-home-display",
  display: "swap",
});

export default async function HomePage() {
  const provider = getDataProvider();
  const [products, categories, heroSlides, instagramPosts, testimonials, reviews, faqs, promo] =
    await Promise.all([
      provider.listProducts({ active: true }),
      provider.listCategories({ active: true }),
      provider.listHeroSlides({ active: true }),
      provider.listInstagramPosts({ active: true }),
      provider.listTestimonials({ active: true }),
      provider.listReviews(),
      provider.listFaqs({ active: true }),
      provider.getPromoSettings(),
    ]);

  const sorted = [...products].sort((a, b) => {
    const aFeatured = a.featured === true ? 1 : 0;
    const bFeatured = b.featured === true ? 1 : 0;
    if (aFeatured !== bFeatured) return bFeatured - aFeatured;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });

  const publicReviews: PublicReviewItem[] = [
    ...testimonials.map((item) => ({
      id: item.id,
      authorName: item.authorName,
      quote: item.quote,
      role: item.role,
      rating: item.rating ?? 5,
    })),
    ...reviews
      .filter((item) => item.status === "approved" && item.isHomeFeatured)
      .map((item) => ({
        id: item.id,
        authorName: item.authorName,
        quote: item.body,
        role: item.title,
        rating: item.rating,
      })),
  ];

  const promoIsCurrent = !promo.endsAt || Date.parse(promo.endsAt) > Date.now();
  const storefrontProducts = attachProductRatings(sorted.map(toStorefrontProduct), reviews);

  return (
    <HomeTheme className={homeDisplay.variable}>
      <HeroCarousel slides={heroSlides.map(toStorefrontHeroSlide)} />
      <CollectionGrid categories={categories.map(toStorefrontCategory)} />
      <ExclusiveDeals />
      <NewCollection products={storefrontProducts.slice(0, 10)} />
      <ProductRail products={storefrontProducts.slice(0, 6)} />
      <BrandIntro />
      <CraftStory />
      <ValuesSection />
      <PublicReviews reviews={publicReviews} />
      <VideoStrip posts={instagramPosts.slice(0, 8).map(toStorefrontInstagramPost)} />
      <HomeFaqs faqs={faqs} />
      <NewsletterSection />
      <PromoPopup promo={promoIsCurrent ? promo : null} />
    </HomeTheme>
  );
}
