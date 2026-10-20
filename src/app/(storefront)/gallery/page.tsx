import type { Metadata } from "next";
import Link from "next/link";
import { Instagram } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { getDataProvider } from "@/lib/data";
import { toStorefrontInstagramPost } from "@/lib/storefront/adapters";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Reels, looks and real moments from Khadeeja Empire.",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const records = await getDataProvider().listInstagramPosts({ active: true });
  const posts = records.map(toStorefrontInstagramPost);

  return (
    <div className="min-h-screen bg-[#fcfaf7] pb-16 md:pb-24">
      <section className="relative overflow-hidden py-14 sm:py-20">
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#7A1F1F]/10 blur-[110px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-amber-500/10 blur-[110px]" />

        <Container className="relative z-10 flex flex-col items-center px-4 text-center">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-[2px] w-6 bg-[#d8b88d] md:w-8" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8b88d] md:text-[11px]">
              Follow Along
            </span>
            <div className="h-[2px] w-6 bg-[#d8b88d] md:w-8" />
          </div>

          <h1 className="mb-4 font-display text-3xl font-medium leading-[1.1] text-ink sm:text-4xl md:text-5xl lg:text-6xl">
            Our <span className="font-serif italic text-[#d8b88d]">Gallery</span>
          </h1>

          <p className="mx-auto mb-6 max-w-md text-[13px] text-muted sm:text-sm md:text-base">
            Real pieces, real moments, straight from our Instagram.
          </p>

          <Link
            href="https://www.instagram.com/khadeeja_empireofficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#7A1F1F]/25 bg-white px-5 py-2 text-xs font-semibold text-[#7A1F1F]! shadow-sm transition hover:bg-[#7A1F1F] hover:text-white!"
          >
            <Instagram className="h-4 w-4" />
            @khadeeja_empireofficial
          </Link>
        </Container>
      </section>

      <Container className="px-4">
        {posts.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">Our gallery is coming soon.</p>
        ) : (
          <GalleryGrid posts={posts} />
        )}
      </Container>
    </div>
  );
}
