"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  User,
  Heart,
  Package,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { useUI } from "@/hooks/useUI";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { siteConfig } from "@/content/site";
import { cn } from "@/lib/utils";
import { buildCategoryTree, type CategoryNode } from "@/lib/storefront/category-tree";
import { BrandLogo } from "./BrandLogo";
import { logout } from "@/app/(storefront)/login/actions";
import type { Category } from "@/types";

export type CustomerSummary = { name: string | null; email: string | null } | null;

interface HeaderProps {
  discoveryLinks: { label: string; href: string }[];
  categories: Category[];
  customer: CustomerSummary;
}

export function Header({ discoveryLinks, categories, customer }: HeaderProps) {
  const pathname = usePathname();
  const { openSearch, openCart, openMobileNav } = useUI();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!accountMenuOpen && !openMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountMenuOpen, openMenu]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openDropdown = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setAccountMenuOpen(false);
    setOpenMenu(label);
  };

  const closeDropdown = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 150);
  };

  const categoryTree: CategoryNode[] = useMemo(() => {
    const fullTree = buildCategoryTree(categories);
    const featuredNodes = fullTree.filter((cat) => cat.isFeatured);
    // Showcase up to 3 featured categories in navbar (or fallback to top 3 active)
    return (featuredNodes.length > 0 ? featuredNodes : fullTree).slice(0, 3);
  }, [categories]);

  return (
    <header
      className={cn(
        "print:hidden sticky top-0 z-[var(--z-header,40)] w-full transition-all duration-300",
        scrolled
          ? "bg-surface/98 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          : "bg-surface/95 backdrop-blur-sm"
      )}
    >
      {/* ──────────────────────────────────────────────────────────────
          TIER 2: MAIN HEADER ROW (Brand Logo + Search Bar + Actions)
          ────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 relative z-40">
        <div className="flex items-center justify-between gap-4 lg:gap-8 py-1.5 lg:py-2">
          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={openMobileNav}
              aria-label="Open menu"
              className="p-2 -ml-2 rounded-full text-ink hover:text-primary hover:bg-black/5 active:scale-95 transition-all"
            >
              <Menu className="h-6 w-6" strokeWidth={1.75} />
            </button>
          </div>

          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 transition-transform duration-300 hover:scale-105"
            aria-label={`${siteConfig.name} home`}
          >
            <BrandLogo variant="navbar" className="w-[56px] h-[56px] sm:w-[68px] sm:h-[68px] lg:w-[80px] lg:h-[80px]" />
          </Link>

          {/* Center Search Bar (Desktop - Prominent Handlooms style) */}
          <div
            onClick={openSearch}
            className="hidden lg:flex items-center flex-1 max-w-[560px] xl:max-w-[620px] mx-2 xl:mx-6 h-11 bg-white border border-[#d8b88d]/60 hover:border-primary focus-within:border-primary rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-pointer group transition-all"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openSearch();
              }
            }}
            aria-label="Search store products"
          >
            <span className="flex-1 px-4 text-xs xl:text-sm text-ink/50 group-hover:text-ink/80 transition-colors select-none font-normal">
              What are you looking for?
            </span>
            <div className="h-full px-5 bg-maroon group-hover:bg-[#641b21] text-white flex items-center justify-center transition-colors rounded-r-md">
              <Search className="w-[18px] h-[18px] stroke-[2.2]" />
            </div>
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
            {/* Trust Badge (Silk Mark Certified style) */}
            <div className="hidden xl:flex items-center gap-2.5 text-left border-r border-border/70 pr-4 mr-1">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80 shadow-xs">
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Handcrafted in Banaras
                </span>
                <span className="text-[10px] text-muted font-medium">
                  Pure Craft • Made to Order
                </span>
              </div>
            </div>

            {/* Account / Login */}
            {customer ? (
              <div className="relative z-50 hidden sm:block" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen((open) => !open);
                    setOpenMenu(null);
                  }}
                  aria-label="Account menu"
                  aria-haspopup="true"
                  aria-expanded={accountMenuOpen}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-ink hover:text-primary hover:bg-black/5 transition-all"
                >
                  <User className="h-4 w-4 stroke-[1.75]" />
                  <span className="whitespace-nowrap">{customer.name || "Account"}</span>
                  <ChevronDown size={13} className="text-muted" />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-full z-50 pt-2 animate-in fade-in-80 slide-in-from-top-2 duration-200">
                    <div className="bg-white border border-border shadow-[0_16px_40px_rgba(0,0,0,0.14)] rounded-2xl min-w-[220px] p-2.5">
                      <div className="px-4 pt-2 pb-3 border-b border-border/50">
                        <p className="text-xs font-semibold text-ink truncate">{customer.name || "Your Account"}</p>
                        {customer.email && <p className="text-[11px] text-muted truncate">{customer.email}</p>}
                      </div>
                      <ul className="flex flex-col pt-1.5">
                        <li>
                          <Link
                            href="/account/orders"
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium tracking-wide text-ink hover:bg-primary/5 hover:text-primary transition-all duration-200"
                          >
                            <Package size={15} strokeWidth={1.5} />
                            My Orders
                          </Link>
                        </li>
                        <li>
                          <form action={logout}>
                            <button
                              type="submit"
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium tracking-wide text-ink hover:bg-primary/5 hover:text-primary transition-all duration-200"
                            >
                              <LogOut size={15} strokeWidth={1.5} />
                              Logout
                            </button>
                          </form>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-ink hover:text-primary hover:bg-black/5 transition-all"
              >
                <User className="h-4 w-4 stroke-[1.75]" />
                <span>Login</span>
              </Link>
            )}

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative p-2 sm:p-2.5 rounded-full text-ink hover:text-primary hover:bg-black/5 transition-colors flex items-center justify-center"
            >
              <Heart className="h-5 w-5 stroke-[1.75]" />
              {mounted && wishlistCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-maroon text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white shadow-xs">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              ) : null}
            </Link>

            {/* Cart Icon */}
            <button
              type="button"
              onClick={openCart}
              aria-label={mounted ? `Open cart, ${itemCount} items` : "Open cart"}
              className="relative p-2 sm:p-2.5 rounded-full text-ink hover:text-primary hover:bg-black/5 transition-colors flex items-center justify-center"
            >
              <ShoppingBag className="h-5 w-5 stroke-[1.75]" />
              {mounted && itemCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-maroon text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white shadow-xs">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Mobile Search Input Bar */}
        <div className="lg:hidden pb-3">
          <div
            onClick={openSearch}
            className="flex items-center w-full h-10 bg-white border border-[#d8b88d]/60 rounded-md shadow-xs cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openSearch();
              }
            }}
            aria-label="Search store products"
          >
            <span className="flex-1 px-3 text-xs text-ink/50 select-none">
              What are you looking for?
            </span>
            <div className="h-full px-3.5 bg-maroon text-white flex items-center justify-center rounded-r-md">
              <Search className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────
          TIER 3: CATEGORY NAVIGATION STRIP (Refined Handlooms Style)
          - Single-line (whitespace-nowrap)
          - Title Case typography (clean & elegant)
          - Saree categories cleanly grouped under "Banarasi Sarees ▾"
          ────────────────────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="hidden lg:block border-y border-border/50 bg-surface/90 relative z-20"
        aria-label="Main category navigation"
      >
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center justify-center gap-5 xl:gap-7 2xl:gap-8 py-2.5 whitespace-nowrap overflow-visible">
            {/* 1. Home */}
            <li>
              <Link
                href="/"
                className={cn(
                  "text-[13px] xl:text-[14px] font-normal transition-colors relative py-1 whitespace-nowrap",
                  pathname === "/" ? "text-primary font-semibold" : "text-ink/80 hover:text-primary"
                )}
              >
                Home
                {pathname === "/" && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                )}
              </Link>
            </li>

            {/* 2. Dynamic Categories from Admin Dashboard */}
            {categoryTree.map((cat) => {
              const hasChildren = cat.children && cat.children.length > 0;
              const href = `/collections/${cat.slug}`;
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              const isDropdownOpen = openMenu === cat.slug;

              if (hasChildren) {
                return (
                  <li
                    key={cat.slug}
                    className="relative"
                    onMouseEnter={() => openDropdown(cat.slug)}
                    onMouseLeave={closeDropdown}
                  >
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1 text-[13px] xl:text-[14px] font-normal transition-colors py-1 whitespace-nowrap cursor-pointer",
                        isActive ? "text-primary font-semibold" : "text-ink/80 hover:text-primary"
                      )}
                      aria-expanded={isDropdownOpen}
                      onClick={() => setOpenMenu((prev) => (prev === cat.slug ? null : cat.slug))}
                    >
                      <span>{cat.name}</span>
                      <ChevronDown
                        size={13}
                        className={cn("transition-transform duration-200 text-muted", isDropdownOpen && "rotate-180")}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute left-0 top-full z-50 pt-1.5 animate-in fade-in-80 slide-in-from-top-1 duration-150">
                        <div className="bg-white border border-border shadow-[0_12px_36px_rgba(0,0,0,0.12)] rounded-xl min-w-[240px] p-2.5">
                          <div className="px-3 pt-2 pb-2 text-[10.5px] uppercase tracking-[0.15em] text-muted font-bold border-b border-border/50">
                            {cat.name}
                          </div>
                          <ul className="flex flex-col pt-1.5">
                            {cat.children.map((child) => (
                              <li key={child.slug}>
                                <Link
                                  href={`/collections/${child.slug}`}
                                  onClick={() => setOpenMenu(null)}
                                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-ink hover:text-primary hover:bg-primary/5 transition-colors"
                                >
                                  <span>{child.name}</span>
                                  <span className="text-[11px] text-muted">→</span>
                                </Link>
                              </li>
                            ))}
                            <li className="pt-1 mt-1 border-t border-border/40">
                              <Link
                                href={href}
                                onClick={() => setOpenMenu(null)}
                                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                              >
                                <span>Explore All {cat.name}</span>
                                <span>→</span>
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </li>
                );
              }

              return (
                <li key={cat.slug}>
                  <Link
                    href={href}
                    className={cn(
                      "text-[13px] xl:text-[14px] font-normal transition-colors relative py-1 whitespace-nowrap",
                      isActive ? "text-primary font-semibold" : "text-ink/80 hover:text-primary"
                    )}
                  >
                    {cat.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                    )}
                  </Link>
                </li>
              );
            })}

            {/* 3. Custom Discovery Navigation Links from Admin */}
            {discoveryLinks
              ?.filter((d) => !categoryTree.some((c) => `/collections/${c.slug}` === d.href || c.slug === d.href))
              .map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "text-[13px] xl:text-[14px] font-normal transition-colors relative py-1 whitespace-nowrap",
                      pathname === item.href ? "text-primary font-semibold" : "text-ink/80 hover:text-primary"
                    )}
                  >
                    {item.label}
                    {pathname === item.href && (
                      <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                    )}
                  </Link>
                </li>
              ))}

            {/* 4. Shop All */}
            <li>
              <Link
                href="/shop"
                className={cn(
                  "text-[13px] xl:text-[14px] font-normal transition-colors relative py-1 whitespace-nowrap",
                  pathname === "/shop" ? "text-primary font-semibold" : "text-ink/80 hover:text-primary"
                )}
              >
                Shop All
                {pathname === "/shop" && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                )}
              </Link>
            </li>

            {/* 5. Our Story */}
            <li>
              <Link
                href="/about"
                className={cn(
                  "text-[13px] xl:text-[14px] font-normal transition-colors relative py-1 whitespace-nowrap",
                  pathname === "/about" ? "text-primary font-semibold" : "text-ink/80 hover:text-primary"
                )}
              >
                Our Story
                {pathname === "/about" && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                )}
              </Link>
            </li>

            {/* 6. Happy Customers (Testimonials) */}
            <li>
              <Link
                href="/#testimonials"
                className="text-[13px] xl:text-[14px] font-normal text-ink/80 hover:text-primary transition-colors relative py-1 whitespace-nowrap"
              >
                Happy Customers
              </Link>
            </li>

            {/* 7. Contact Us */}
            <li>
              <Link
                href="/contact"
                className={cn(
                  "text-[13px] xl:text-[14px] font-normal transition-colors relative py-1 whitespace-nowrap",
                  pathname === "/contact" ? "text-primary font-semibold" : "text-ink/80 hover:text-primary"
                )}
              >
                Contact Us
                {pathname === "/contact" && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                )}
              </Link>
            </li>

            {/* 8. Support Dropdown */}
            <li
              className="relative"
              onMouseEnter={() => openDropdown("Support")}
              onMouseLeave={closeDropdown}
            >
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 text-[13px] xl:text-[14px] font-normal transition-colors py-1 whitespace-nowrap cursor-pointer",
                  pathname.startsWith("/shipping-returns")
                    ? "text-primary font-semibold"
                    : "text-ink/80 hover:text-primary"
                )}
                aria-expanded={openMenu === "Support"}
                onClick={() => setOpenMenu((prev) => (prev === "Support" ? null : "Support"))}
              >
                <span>Support</span>
                <ChevronDown
                  size={13}
                  className={cn("transition-transform duration-200 text-muted", openMenu === "Support" && "rotate-180")}
                />
              </button>

              {openMenu === "Support" && (
                <div className="absolute right-0 top-full z-50 pt-1.5 animate-in fade-in-80 slide-in-from-top-1 duration-150">
                  <div className="bg-white border border-border shadow-[0_12px_36px_rgba(0,0,0,0.12)] rounded-xl min-w-[240px] p-2.5">
                    <div className="px-3 pt-2 pb-2 text-[10.5px] uppercase tracking-[0.2em] text-muted font-bold border-b border-border/50">
                      Customer Care
                    </div>
                    <ul className="flex flex-col pt-1.5">
                      <li>
                        <Link
                          href="/contact"
                          onClick={() => setOpenMenu(null)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-ink hover:text-primary hover:bg-primary/5 transition-colors"
                        >
                          <span>Contact Us</span>
                          <span className="text-[11px] text-muted">→</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shipping-returns"
                          onClick={() => setOpenMenu(null)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-ink hover:text-primary hover:bg-primary/5 transition-colors"
                        >
                          <span>Refund & Shipping Policies</span>
                          <span className="text-[11px] text-muted">→</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
