"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  ArrowRight,
  Truck,
  Award,
  RotateCcw,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { formatPrice, discountPercent } from "@/lib/utils";
import type { Product } from "@/types";

const STORE_USPS = [
  {
    icon: Truck,
    title: "Free Shipping",
    subtitle: "On orders above ₹2,000",
  },
  {
    icon: Award,
    title: "Premium Quality",
    subtitle: "Handpicked for you",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    subtitle: "Hassle-free return",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    subtitle: "100% safe & secure",
  },
];

export function ProductRail({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -260, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  return (
    <section className="bg-surface/40 py-8 sm:py-10 md:py-14 border-b border-border/40 relative overflow-hidden">
      <Container>
        {/* Section Header - Centered on Mobile */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 gap-4">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left mx-auto sm:mx-0 max-w-xl">
            <div className="flex flex-col items-center sm:items-start gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                JUST IN
              </span>
              <div className="h-[2px] w-6 bg-primary/60" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-[2.5rem] font-display font-bold text-ink tracking-tight leading-tight">
              Latest <span className="font-serif italic font-normal text-primary">Arrivals</span>
            </h2>

            <p className="text-xs sm:text-sm text-muted max-w-md mt-2 leading-relaxed">
              Discover our newest styles, freshly added to keep your wardrobe on trend.
            </p>
          </div>

          {/* Desktop Navigation Prev/Next Circular Buttons */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Scroll left"
              className="w-10 h-10 rounded-full border border-border/80 bg-surface text-ink shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 flex items-center justify-center active:scale-95"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              aria-label="Scroll right"
              className="w-10 h-10 rounded-full border border-border/80 bg-surface text-ink shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 flex items-center justify-center active:scale-95"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Product Carousel Wrapper with Mobile Floating Buttons */}
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
            className="flex gap-3.5 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2 px-5 sm:px-6 md:px-0"
            aria-label="Latest arrivals products"
          >
            {products.map((product) => (
              <article
                key={product.id}
                className="group shrink-0 w-[54vw] sm:w-[220px] md:w-[240px] lg:w-[250px] snap-start"
              >
                <div className="bg-surface rounded-2xl md:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden">
                  {/* Product Image Container */}
                  <Link
                    href={`/products/${product.slug}`}
                    className="relative block aspect-[4/4.3] sm:aspect-[4/5] w-full overflow-hidden bg-bg/50"
                    aria-label={`View ${product.name}`}
                  >
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 54vw, 250px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    />

                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute left-2.5 top-2.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-primary bg-amber-200/90 border border-primary/20 backdrop-blur-sm shadow-sm">
                        {product.badge === "new" ? "NEW" : "FEATURED"}
                      </span>
                    )}

                    {/* Discount */}
                    {discountPercent(product.price, product.oldPrice) > 0 && (
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-white bg-[#7a1f1f] shadow-sm">
                        {discountPercent(product.price, product.oldPrice)}% OFF
                      </span>
                    )}
                  </Link>

                  {/* Card Details Body */}
                  <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2 sm:gap-2.5">
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80 block mb-1">
                        {product.category.replace(/-/g, " ")}
                      </span>
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-display font-semibold text-xs sm:text-sm text-ink line-clamp-1 hover:text-primary transition-colors block"
                      >
                        {product.name}
                      </Link>
                      {product.rating ? (
                        <span className="mt-1 flex items-center gap-1" aria-label={`${product.rating.average.toFixed(1)} out of 5 stars`}>
                          <span className="flex text-[#C29B47]">
                            {[0, 1, 2, 3, 4].map((index) => (
                              <Star key={index} size={11} fill={index < Math.round(product.rating!.average) ? "currentColor" : "none"} strokeWidth={1.5} aria-hidden="true" />
                            ))}
                          </span>
                          <span className="text-[9px] text-muted">({product.rating.count})</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Price & Cart Button */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-baseline gap-1">
                        {discountPercent(product.price, product.oldPrice) > 0 && (
                          <span className="text-[11px] sm:text-xs text-muted line-through">
                            {formatPrice(product.oldPrice!, product.currency)}
                          </span>
                        )}
                        <span className="font-bold text-[16px] sm:text-[18px] md:text-xl text-ink">
                          {formatPrice(product.price, product.currency)}
                        </span>
                        {product.priceStatus === "demo" && (
                          <span className="text-[9px] sm:text-[10px] text-muted">(Demo)</span>
                        )}
                      </div>

                      <Link
                        href={`/products/${product.slug}`}
                        className="group/cart w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-border/80 bg-surface/80 flex items-center justify-center text-ink hover:bg-primary hover:text-white hover:border-primary active:bg-primary active:text-white active:scale-95 transition-all duration-300 shadow-sm shrink-0"
                        aria-label={`Add ${product.name} to bag`}
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 transition-colors group-hover/cart:text-white group-active/cart:text-white" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* View All Products Button */}
        <div className="flex justify-center mt-8 sm:mt-10">
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-surface border border-[#0A1129] shadow-md text-xs font-semibold uppercase tracking-[0.18em] text-ink hover:border-[#0A1129] hover:bg-[#0A1129] hover:text-white transition-all duration-300 group hover:shadow-lg active:scale-95"
          >
            <span className="transition-colors duration-300 group-hover:text-white">View All Products</span>
            <span className="w-6 h-6 rounded-full bg-[#0A1129] text-white group-hover:bg-white flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-3 h-3 text-white group-hover:text-[#0A1129] transition-colors duration-300" />
            </span>
          </Link>
        </div>


      </Container>
    </section>
  );
}


