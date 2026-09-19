"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { Category } from "@/types";

export function CollectionGrid({ categories }: { categories: Category[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (categories.length === 0) return null;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: "smooth" });
    }
  };

  return (
    <section className="py-8 sm:py-10 md:py-14 bg-surface/50 border-b border-border/40 relative overflow-hidden">
      <Container>
        {/* Heading Header - Centered on Mobile */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 gap-4">
          <div className="flex flex-col gap-2 items-center text-center sm:items-start sm:text-left mx-auto sm:mx-0 max-w-xl sm:max-w-2xl">
            <span className="text-xs uppercase tracking-[0.18em] text-muted font-semibold">
              Curated Edits
            </span>
            <h2 className="text-3xl md:text-[40px] md:leading-[44px] font-display font-medium text-ink leading-tight">
              Shop by Collection
            </h2>
            <p className="text-xs sm:text-sm md:text-[17px] text-muted leading-relaxed max-w-lg">
              Explore our handcrafted edits—each collection tells its own story.
            </p>
          </div>

          {/* Desktop Navigation Scroll Buttons */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Scroll left"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-surface text-ink shadow-sm hover:border-primary hover:bg-primary hover:text-white transition-all active:scale-95"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              aria-label="Scroll right"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-surface text-ink shadow-sm hover:border-primary hover:bg-primary hover:text-white transition-all active:scale-95"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Carousel Container with Mobile Left/Right Buttons */}
        <div className="relative group/carousel">
          {/* Mobile Left Scroll Button */}
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Scroll left"
            className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-white/95 text-ink shadow-xl backdrop-blur-md active:scale-90 transition-all hover:bg-primary hover:text-white"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          {/* Mobile Right Scroll Button */}
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Scroll right"
            className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-white/95 text-ink shadow-xl backdrop-blur-md active:scale-90 transition-all hover:bg-primary hover:text-white"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>

          {/* Horizontal Scroll Track */}
          <div
            ref={scrollRef}
            className="flex gap-3.5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2 px-5 sm:px-6 md:px-2"
          >
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collections/${cat.slug}`}
                className="group shrink-0 w-[54vw] sm:w-[240px] md:w-[270px] lg:w-[290px] snap-start"
                aria-label={`Explore ${cat.name}`}
              >
                <div className="relative aspect-[4/4.5] sm:aspect-[3/4] overflow-hidden rounded-2xl md:rounded-3xl bg-surface shadow-md sm:shadow-lg group-hover:shadow-2xl group-active:shadow-sm transition-all duration-500">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 54vw, 290px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#efe4d4] via-[#e6d5bd] to-[#d8b88d]" aria-hidden="true" />
                  )}
                  
                  {/* Dark Luxury Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-300" />
                  
                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between text-white">
                    {/* Category Pill Tag */}
                    <div className="self-start">
                      <span className="inline-block px-2.5 py-1 sm:px-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[9px] sm:text-[10px] uppercase tracking-[0.18em] font-semibold text-white">
                        {cat.name}
                      </span>
                    </div>

                    {/* Title & Arrow Link */}
                    <div>
                      <h3 className="font-display text-lg sm:text-2xl font-bold leading-tight mb-1 sm:mb-2 group-hover:text-amber-200 transition-colors">
                        {cat.name}
                      </h3>
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-white/90 group-hover:text-white">
                        <span>Explore Collection</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}


