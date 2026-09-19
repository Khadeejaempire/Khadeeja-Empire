"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ArrowRight, Phone, Mail, Instagram, X } from "lucide-react";
import { useUI } from "@/hooks/useUI";
import { Drawer } from "@/components/ui/Drawer";
import { siteConfig } from "@/content/site";
import { buildCategoryTree } from "@/lib/storefront/category-tree";
import type { Category } from "@/types";

export function MobileNav({ categories }: { categories: Category[] }) {
  const { openDrawer, closeDrawer } = useUI();
  const open = openDrawer === "mobile-nav";

  return (
    <Drawer
      open={open}
      onClose={closeDrawer}
      side="left"
      hideCloseButton
      ariaLabel="Navigation menu"
    >
      <div className="flex flex-col h-full bg-surface text-ink px-5 sm:px-6 pt-5 sm:pt-6 pb-8 overflow-y-auto">
        {/* Header Branding: Grid centered layout with Logo (Left), Badge (Exact Center), and Smaller Close (Right) */}
        <div className="grid grid-cols-3 items-center pb-4 sm:pb-5 border-b border-border/60">
          {/* 1. Logo Left */}
          <div className="flex justify-start">
            <Link
              href="/"
              onClick={closeDrawer}
              className="relative h-10 sm:h-12 w-24 sm:w-28 flex items-center"
            >
              <Image
                src={siteConfig.logo}
                alt={`${siteConfig.name} logo`}
                fill
                sizes="140px"
                className="object-contain object-left"
              />
            </Link>
          </div>

          {/* 2. Luxury Banaras Badge Exact Center */}
          <div className="flex justify-center">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.18em] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-primary/10 text-primary border border-primary/15 text-center whitespace-nowrap">
              Luxury Banaras
            </span>
          </div>

          {/* 3. Smaller Close Button Right */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close navigation menu"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-bg/80 border border-border/60 flex items-center justify-center text-ink hover:text-primary hover:bg-primary/10 active:scale-95 transition-all"
            >
              <X size={16} className="stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Navigation Accordions & Links */}
        <nav className="flex flex-col gap-1 py-4 flex-1" aria-label="Mobile navigation">
          <Link
            href="/"
            onClick={closeDrawer}
            className="text-[17px] sm:text-lg font-medium tracking-wide text-ink py-3 border-b border-border/40 hover:text-primary transition-colors flex items-center justify-between"
          >
            <span>Home</span>
            <ArrowRight size={15} className="text-muted" />
          </Link>

          <details className="group border-b border-border/40">
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-[17px] sm:text-lg font-medium tracking-wide text-ink transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
              <span>Shop Collections</span>
              <ChevronDown
                size={17}
                strokeWidth={1.5}
                className="transition-transform duration-200 group-open:rotate-180 text-muted"
                aria-hidden="true"
              />
            </summary>
            <div className="flex flex-col pb-3 pl-3 space-y-1">
              <Link
                href="/shop"
                onClick={closeDrawer}
                className="py-2.5 px-3 text-[15px] sm:text-base font-semibold text-primary bg-primary/5 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Shop All Products</span>
                <span className="text-xs">→</span>
              </Link>
              {buildCategoryTree(categories).map((cat) => (
                <div key={cat.slug} className="flex flex-col">
                  <Link
                    href={`/collections/${cat.slug}`}
                    onClick={closeDrawer}
                    className="py-2 px-3 text-[14px] sm:text-[15px] text-ink/80 hover:text-primary hover:bg-black/5 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>{cat.name}</span>
                  </Link>
                  {cat.children.length ? (
                    <div className="flex flex-col border-l border-border/60 ml-4 pl-2">
                      {cat.children.map((child) => (
                        <Link
                          key={child.slug}
                          href={`/collections/${child.slug}`}
                          onClick={closeDrawer}
                          className="py-2 px-3 text-[13px] sm:text-[14px] text-muted hover:text-primary hover:bg-black/5 rounded-lg transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </details>

          <details className="group border-b border-border/40">
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-[17px] sm:text-lg font-medium tracking-wide text-ink transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
              <span>Customer Care</span>
              <ChevronDown
                size={17}
                strokeWidth={1.5}
                className="transition-transform duration-200 group-open:rotate-180 text-muted"
                aria-hidden="true"
              />
            </summary>
            <div className="flex flex-col pb-3 pl-3 space-y-1">
              <Link
                href="/track-order"
                onClick={closeDrawer}
                className="py-2 px-3 text-[14px] sm:text-[15px] text-ink/80 hover:text-primary hover:bg-black/5 rounded-lg transition-colors"
              >
                Track Order
              </Link>
              <Link
                href="/contact"
                onClick={closeDrawer}
                className="py-2 px-3 text-[14px] sm:text-[15px] text-ink/80 hover:text-primary hover:bg-black/5 rounded-lg transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/shipping-returns"
                onClick={closeDrawer}
                className="py-2 px-3 text-[14px] sm:text-[15px] text-ink/80 hover:text-primary hover:bg-black/5 rounded-lg transition-colors"
              >
                Refund &amp; Shipping Policies
              </Link>
            </div>
          </details>

          <div className="flex flex-col gap-1 pt-1">
            <Link
              href="/about"
              onClick={closeDrawer}
              className="py-3 text-[17px] sm:text-lg font-medium tracking-wide text-ink border-b border-border/40 hover:text-primary transition-colors flex items-center justify-between"
            >
              <span>Our Story</span>
              <ArrowRight size={15} className="text-muted" />
            </Link>
            <Link
              href="/contact"
              onClick={closeDrawer}
              className="py-3 text-[17px] sm:text-lg font-medium tracking-wide text-ink hover:text-primary transition-colors flex items-center justify-between"
            >
              <span>Contact Us</span>
              <ArrowRight size={15} className="text-muted" />
            </Link>
          </div>
        </nav>

        {/* Footer Contact & Social Section */}
        <div className="pt-6 border-t border-border/60 flex flex-col gap-3 text-xs sm:text-[13px] text-muted">
          <a href={`tel:${siteConfig.phone}`} className="flex items-center gap-2 hover:text-primary transition-colors">
            <Phone size={14} />
            <span>{siteConfig.phone}</span>
          </a>
          <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
            <Mail size={14} />
            <span>{siteConfig.email}</span>
          </a>
          {siteConfig.instagram && (
            <a
              href={siteConfig.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors pt-1"
            >
              <Instagram size={14} />
              <span>Follow @khadeeja_empireofficial</span>
            </a>
          )}
        </div>
      </div>
    </Drawer>
  );
}

