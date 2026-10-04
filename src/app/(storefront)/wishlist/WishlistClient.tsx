"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { useWishlist } from "@/hooks/useWishlist";
import { ChevronRight, Heart, Trash2, SlidersHorizontal } from "lucide-react";

export default function WishlistClient() {
  const { items: products, removeItem, clearWishlist, isHydrated } = useWishlist();

  if (!isHydrated) {
    return <div className="min-h-[50vh] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[12px] md:text-[13px] font-medium tracking-wide text-muted mb-4 md:mb-6">
        <Link href="/" className="hover:text-[#a27b53] transition-colors">Home</Link>
        <ChevronRight size={14} className="opacity-40" strokeWidth={1.5} />
        <span className="text-[#a27b53]">Wishlist</span>
      </nav>

      {products.length > 0 ? (
        <>
          {/* Header & Actions Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6 md:gap-0">
            {/* Left: Icon, Title, Subtitle */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-3 mb-2 md:mb-3">
                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#fdfaf5] border border-[#d8b88d]/20 flex items-center justify-center text-[#a27b53] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                   <Heart className="w-4 h-4 md:w-5 md:h-5 fill-current" strokeWidth={1} />
                 </div>
                 <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium text-ink">
                   Your Wishlist
                 </h1>
              </div>
              <p className="text-[13px] sm:text-sm text-muted">
                {products.length} {products.length === 1 ? 'item' : 'items'} saved for later. Keep your favorite pieces close.
              </p>
            </div>

            {/* Right: Clear Wishlist */}
            <div className="flex shrink-0 w-full md:w-auto justify-center md:justify-end">
              <button 
                type="button" 
                onClick={clearWishlist}
                className="inline-flex items-center justify-center w-full md:w-auto gap-2 px-5 py-2.5 rounded-lg border border-border/60 bg-white text-ink text-[13px] font-medium hover:border-red-500 hover:text-red-600 transition-colors shadow-sm group"
              >
                <Trash2 size={15} className="text-muted group-hover:text-red-500 transition-colors" />
                <span>Clear Wishlist</span>
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlistPage={true}
                onRemove={() => removeItem(product.id)}
                imageClassName="aspect-square sm:aspect-[4/5] md:aspect-[3.5/4]"
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 md:py-16 px-6 bg-gradient-to-b from-white to-[#fcfaf7] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#d8b88d]/15 max-w-3xl mx-auto mt-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-sm border border-[#d8b88d]/20 flex items-center justify-center text-[#d8b88d] mb-6 md:mb-8">
            <Heart className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1} />
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-medium text-ink mb-5 text-center">Your wishlist is empty</h2>
          <p className="text-muted text-sm md:text-base text-center max-w-sm mb-4">
            You haven&apos;t saved any items yet. Start exploring our collections to find your new favorites.
          </p>
          <div className="mt-4 md:mt-6">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#a27b53] text-white font-semibold text-[12px] md:text-[13px] tracking-[0.1em] uppercase hover:bg-[#8b6845] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 shadow-lg shadow-[#a27b53]/20"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
