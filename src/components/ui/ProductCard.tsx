"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Check, Trash2, Star } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, discountPercent } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useUI } from "@/hooks/useUI";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  variant?: "grid" | "list";
  isWishlistPage?: boolean;
  onRemove?: () => void;
}

function Stars({ average, count }: { average: number; count: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`${average.toFixed(1)} out of 5 stars from ${count} reviews`}>
      <span className="flex text-[#C29B47]">
        {[0, 1, 2, 3, 4].map((index) => (
          <Star key={index} size={12} fill={index < Math.round(average) ? "currentColor" : "none"} strokeWidth={1.5} aria-hidden="true" />
        ))}
      </span>
      <span className="text-[10px] text-muted">({count})</span>
    </span>
  );
}

export function ProductCard({
  product,
  className,
  imageClassName,
  priority,
  variant = "grid",
  isWishlistPage,
  onRemove,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const { hasItem, addItem: addWishlist, removeItem: removeWishlist } = useWishlist();
  const { openCart } = useUI();
  const hoverImage = product.hoverImage || product.images[1];
  const discount = discountPercent(product.price, product.oldPrice);

  const isWishlisted = hasItem(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultSize = product.sizes?.[0] || "M";
    addItem(product, defaultSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    openCart();
  };

  // Horizontal List View Card Layout
  if (variant === "list") {
    return (
      <article
        className={cn(
          "group bg-white rounded-lg p-4 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6 border-0 w-full",
          className
        )}
      >
        {/* Left Side: Product Image */}
        <div className="relative w-full sm:w-48 md:w-56 aspect-[3/4] sm:aspect-square shrink-0 rounded-md overflow-hidden bg-[#F9F8F6]">
          <Link
            href={`/products/${product.slug}`}
            className="block w-full h-full relative"
            aria-label={`View ${product.name}`}
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 240px"
              className={cn(
                "object-cover transition duration-500 ease-out group-hover:scale-105",
                hoverImage && "group-hover:opacity-0"
              )}
              priority={priority}
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 240px"
                className="object-cover opacity-0 transition duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
              />
            )}
          </Link>

          {/* Badges */}
          {product.badge && (
            <span
              className={cn(
                "absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-sm z-10",
                product.badge === "featured" && "bg-[#C29B47] text-white",
                product.badge === "new" && "bg-[#9C3D4D] text-white",
                product.badge === "sale" && "bg-amber-600 text-white"
              )}
            >
              {product.badge === "new" && "NEW"}
              {product.badge === "featured" && "FEATURED"}
              {product.badge === "sale" && "SALE"}
            </span>
          )}

          {/* Discount */}
          {discount > 0 && (
            <span className="absolute bottom-2 left-2 z-10 rounded-sm bg-[#7a1f1f] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              {discount}% OFF
            </span>
          )}

          {/* Wishlist / Remove Button */}
          {isWishlistPage ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove?.();
              }}
              aria-label="Remove from wishlist"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-700 hover:text-red-500 active:scale-90 transition-all z-10 shadow-sm"
            >
              <Trash2 size={14} className="transition-colors text-gray-700 hover:text-red-500" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isWishlisted) {
                  removeWishlist(product.id);
                } else {
                  addWishlist(product);
                }
              }}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-700 hover:text-red-500 active:scale-90 transition-all z-10 shadow-sm"
            >
              <Heart
                size={14}
                className={cn(
                  "transition-colors",
                  isWishlisted ? "fill-red-500 text-red-500" : "text-gray-700 hover:text-red-500"
                )}
              />
            </button>
          )}
        </div>

        {/* Right Side: Details & Actions */}
        <div className="flex flex-col justify-between flex-1 gap-3 py-1">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                {product.category.replace(/-/g, " ")}
              </span>
            </div>

            <Link
              href={`/products/${product.slug}`}
              className="font-serif text-lg sm:text-xl text-ink hover:text-primary transition-colors leading-snug font-semibold"
            >
              {product.name}
            </Link>

            {product.rating ? (
              <Stars average={product.rating.average} count={product.rating.count} />
            ) : null}

            {product.description && (
              <p className="text-xs text-muted leading-relaxed line-clamp-2 mt-1">
                {product.description}
              </p>
            )}

            {/* Available Sizes Pills */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Sizes:</span>
                {product.sizes.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-700 rounded border border-gray-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
            <div className="flex items-center gap-2">
              <span className="flex items-baseline gap-1.5">
                {discount > 0 && (
                  <span className="text-sm text-muted line-through">
                    {formatPrice(product.oldPrice!, product.currency)}
                  </span>
                )}
                <span className="text-xl font-bold text-ink">
                  {formatPrice(product.price, product.currency)}
                </span>
              </span>
              {product.priceStatus === "demo" && (
                <span className="text-xs text-muted font-normal">(Demo price)</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleQuickAdd}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-bold transition-all shadow-xs active:scale-95",
                added
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-[#FFFBF5] text-[#A37B34] border-[#D8C7B0] hover:bg-[#A37B34] hover:text-white hover:border-[#A37B34]"
              )}
            >
              {added ? (
                <>
                  <Check size={16} />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={16} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Standard Grid View Card Layout
  return (
    <article
      className={cn(
        "group bg-white rounded-xl p-2.5 sm:p-3 border border-[#f0ebe1] hover:border-[#d8b88d]/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between h-full",
        className
      )}
    >
      <div>
        {/* Product Image Box */}
        <div className={cn("relative overflow-hidden rounded-md bg-[#F9F8F6] mb-2.5", imageClassName || "aspect-[3/4]")}>
          <Link
            href={`/products/${product.slug}`}
            className="block w-full h-full relative"
            aria-label={`View ${product.name}`}
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition duration-500 ease-out group-hover:scale-105",
                hoverImage && "group-hover:opacity-0"
              )}
              priority={priority}
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
              />
            )}
          </Link>

          {/* Badges */}
          {product.badge && (
            <span
              className={cn(
                "absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-sm z-10",
                product.badge === "featured" && "bg-[#C29B47] text-white",
                product.badge === "new" && "bg-[#9C3D4D] text-white",
                product.badge === "sale" && "bg-amber-600 text-white"
              )}
            >
              {product.badge === "new" && "NEW"}
              {product.badge === "featured" && "FEATURED"}
              {product.badge === "sale" && "SALE"}
            </span>
          )}

          {/* Discount */}
          {discount > 0 && (
            <span className="absolute bottom-2 left-2 z-10 rounded-sm bg-[#7a1f1f] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              {discount}% OFF
            </span>
          )}

          {/* Wishlist / Remove Button */}
          {isWishlistPage ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove?.();
              }}
              aria-label="Remove from wishlist"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 hover:scale-110 active:scale-90 transition-all z-10"
            >
              <Trash2 size={14} className="transition-colors" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isWishlisted) {
                  removeWishlist(product.id);
                } else {
                  addWishlist(product);
                }
              }}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:scale-110 active:scale-90 transition-all z-10"
            >
              <Heart
                size={14}
                className={cn(
                  "transition-colors",
                  isWishlisted ? "fill-red-500 text-red-500" : "hover:text-red-500"
                )}
              />
            </button>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-0.5 px-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            {product.category.replace(/-/g, " ")}
          </span>
          <Link
            href={`/products/${product.slug}`}
            className="font-serif text-[12.5px] sm:text-[14px] md:text-[15px] text-ink hover:text-primary transition-colors leading-snug font-semibold line-clamp-2 min-h-[36px]"
          >
            {product.name}
          </Link>
          {product.rating ? (
            <Stars average={product.rating.average} count={product.rating.count} />
          ) : null}
        </div>
      </div>

      {/* Price & Quick Add Shopping Bag Button */}
      <div className="flex items-center justify-between pt-2 px-0.5 mt-1 border-t border-gray-100">
        <span className="flex items-baseline gap-1.5">
          {discount > 0 && (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.oldPrice!, product.currency)}
            </span>
          )}
          <span className="text-ink font-bold text-base">
            {formatPrice(product.price, product.currency)}
          </span>
        </span>

        <button
          type="button"
          onClick={handleQuickAdd}
          aria-label={`Add ${product.name} to cart`}
          title="Quick Add to Cart"
          className={cn(
            "w-8.5 h-8.5 rounded-lg border flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0",
            added
              ? "bg-green-600 text-white border-green-600"
              : "bg-[#FFFBF5] text-[#A37B34] border-[#D8C7B0] hover:bg-[#A37B34] hover:text-white hover:border-[#A37B34]"
          )}
        >
          {added ? <Check size={16} /> : <ShoppingBag size={16} />}
        </button>
      </div>
    </article>
  );
}
