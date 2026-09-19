"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search, ShoppingBag, User, Heart, Package, LogOut } from "lucide-react";
import { useUI } from "@/hooks/useUI";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { siteConfig } from "@/content/site";
import { cn } from "@/lib/utils";
import { buildCategoryTree } from "@/lib/storefront/category-tree";
import { IconButton } from "@/components/ui/IconButton";
import { BrandLogo } from "./BrandLogo";
import { logout } from "@/app/(storefront)/login/actions";
import type { Category } from "@/types";

export type CustomerSummary = { name: string | null; email: string | null } | null;

type ShopLink = { label: string; href: string; children?: { label: string; href: string }[] };

export function Header({ discoveryLinks, categories, customer }: { discoveryLinks: { label: string; href: string }[]; categories: Category[]; customer: CustomerSummary }) {
  const pathname = usePathname();
  const { openSearch, openCart, openMobileNav } = useUI();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openDropdown = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };

  const closeDropdown = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 150);
  };

  return (
    <header
      className={cn(
        "sticky-header site-header transition-all duration-300",
        scrolled
          ? "bg-surface/95 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] border-b border-border/80"
          : "bg-surface/80 backdrop-blur-sm border-b border-border/40"
      )}
    >
      <div className="nav">
        {/* Mobile left menu toggle */}
        <div className="mobile-toggle-wrapper flex items-center lg:hidden">
          <IconButton
            onClick={openMobileNav}
            ariaLabel="Open menu"
            className="nav-icon-btn mobile-menu-toggle rounded-full hover:bg-black/5 transition-all active:scale-95"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </IconButton>
        </div>

        {/* Desktop navigation links */}
        <nav className="desktop-nav-links hidden lg:flex items-center gap-5 xl:gap-6 2xl:gap-7" aria-label="Main navigation">
          <Link
            href="/"
            className={cn("nav-link-item group relative py-1", pathname === "/" && "active")}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <span className="text-[11.5px] lg:text-xs xl:text-[13px] 2xl:text-sm font-semibold uppercase tracking-[0.13em] xl:tracking-[0.15em] text-ink group-hover:text-primary transition-colors">
              Home
            </span>
            <span
              className={cn(
                "absolute bottom-0 left-0 h-[2px] w-full bg-primary origin-left transition-transform duration-300 ease-out",
                pathname === "/" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              )}
            />
          </Link>

          {siteConfig.navigation.map((item) => {
            const menuOpen = openMenu === item.label;
            const menuId = `desktop-nav-${item.label.toLowerCase().replaceAll(" ", "-")}`;
            const isActive =
              item.href &&
              (pathname === item.href ||
                (item.href !== "/shop" && pathname.startsWith(item.href)));
            const shopLinks: ShopLink[] = [
              { label: "Shop All", href: "/shop" },
              ...buildCategoryTree(categories).map((c) => ({
                label: c.name,
                href: `/collections/${c.slug}`,
                children: c.children.map((child) => ({
                  label: child.name,
                  href: `/collections/${child.slug}`,
                })),
              })),
            ];
            const menuLinks: ShopLink[] | undefined =
              item.label === "Shop" && discoveryLinks.length
                ? [{ label: "Shop All", href: "/shop" }, ...discoveryLinks]
                : item.label === "Shop" && categories.length
                  ? shopLinks
                  : item.megaMenu?.links;

            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={item.megaMenu ? () => openDropdown(item.label) : undefined}
                onMouseLeave={item.megaMenu ? closeDropdown : undefined}
                onFocusCapture={item.megaMenu ? () => openDropdown(item.label) : undefined}
                onBlurCapture={
                  item.megaMenu
                    ? (event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) {
                          closeDropdown();
                        }
                      }
                    : undefined
                }
                onKeyDown={
                  item.megaMenu
                    ? (event) => {
                        if (event.key === "Escape") {
                          setOpenMenu(null);
                          (event.currentTarget.querySelector("a, button") as HTMLElement)?.focus();
                        }
                      }
                    : undefined
                }
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn("nav-link-item group relative py-1 inline-flex items-center gap-1.5", isActive && "active")}
                    aria-current={isActive ? "page" : undefined}
                    aria-haspopup={item.megaMenu ? "true" : undefined}
                    aria-expanded={item.megaMenu ? menuOpen : undefined}
                    aria-controls={item.megaMenu ? menuId : undefined}
                  >
                    <span className="text-[11.5px] lg:text-xs xl:text-[13px] 2xl:text-sm font-semibold uppercase tracking-[0.13em] xl:tracking-[0.15em] text-ink group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                    {item.megaMenu && (
                      <ChevronDown
                        size={13}
                        strokeWidth={1.5}
                        className={cn(
                          "transition-transform duration-200 text-ink/70 group-hover:text-primary",
                          menuOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={cn(
                        "absolute bottom-0 left-0 h-[2px] w-full bg-primary origin-left transition-transform duration-300 ease-out",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      )}
                    />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="nav-link-item group relative py-1 inline-flex items-center gap-1.5 focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                    aria-controls={menuId}
                    onClick={() => openDropdown(item.label)}
                  >
                    <span className="text-[11.5px] lg:text-xs xl:text-[13px] 2xl:text-sm font-semibold uppercase tracking-[0.13em] xl:tracking-[0.15em] text-ink group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                    <ChevronDown
                      size={13}
                      strokeWidth={1.5}
                      className={cn(
                        "transition-transform duration-200 text-ink/70 group-hover:text-primary",
                        menuOpen && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "absolute bottom-0 left-0 h-[2px] w-full bg-primary origin-left transition-transform duration-300 ease-out",
                        menuOpen ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      )}
                    />
                  </button>
                )}

                {item.megaMenu && menuOpen && (
                  <div id={menuId} className="absolute left-0 top-full z-20 pt-3 animate-in fade-in-80 slide-in-from-top-2 duration-200">
                    <div className="bg-surface/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl min-w-[260px] p-2.5">
                      <div className="px-4 pt-3 pb-2 text-[10.5px] uppercase tracking-[0.2em] text-muted font-bold border-b border-border/40">
                        {item.megaMenu.title}
                      </div>
                      <ul className="flex flex-col pt-1.5">
                        {menuLinks?.map((link, index) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={() => setOpenMenu(null)}
                              className={cn(
                                "flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium tracking-wide text-ink hover:bg-primary/5 hover:text-primary transition-all duration-200 group/link",
                                item.label === "Shop" && index === 0 &&
                                  "font-semibold text-primary bg-primary/5 mb-1"
                              )}
                            >
                              <span>{link.label}</span>
                              <span className="text-[11px] opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-200 text-primary">→</span>
                            </Link>
                            {link.children?.length ? (
                              <ul className="flex flex-col pb-1 pl-3">
                                {link.children.map((child) => (
                                  <li key={child.href}>
                                    <Link
                                      href={child.href}
                                      onClick={() => setOpenMenu(null)}
                                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11.5px] text-muted hover:bg-primary/5 hover:text-primary transition-all duration-200"
                                    >
                                      <span className="h-1 w-1 rounded-full bg-current opacity-50" aria-hidden="true" />
                                      {child.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Center Logo */}
        <Link
          href="/"
          className="logo logo-image nav-logo transition-transform duration-300 hover:scale-105"
          aria-label={`${siteConfig.name} home`}
        >
          <BrandLogo variant="navbar" />
        </Link>

        {/* Right CTA Actions */}
        <div className="nav-cta flex items-center gap-2 md:gap-3">
          <IconButton
            onClick={openSearch}
            ariaLabel="Search products"
            className="w-10 h-10 md:w-[46px] md:h-[46px] rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#d8b88d]/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 text-ink hover:text-primary transition-all duration-300 active:scale-95 hidden md:flex items-center justify-center shrink-0"
          >
            <Search className="h-[18px] w-[18px] md:h-5 md:w-5 stroke-[1.5]" aria-hidden="true" />
          </IconButton>
          
          {customer ? (
            <div className="relative hidden sm:block" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={accountMenuOpen}
                className="w-10 h-10 md:w-[46px] md:h-[46px] rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#d8b88d]/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 text-ink hover:text-primary transition-all duration-300 active:scale-95 flex items-center justify-center shrink-0"
              >
                <User className="h-[18px] w-[18px] md:h-5 md:w-5 stroke-[1.5]" aria-hidden="true" />
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 top-full z-20 pt-3 animate-in fade-in-80 slide-in-from-top-2 duration-200">
                  <div className="bg-surface/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl min-w-[220px] p-2.5">
                    <div className="px-4 pt-2 pb-3 border-b border-border/40">
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
              aria-label="Account"
              className="w-10 h-10 md:w-[46px] md:h-[46px] rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#d8b88d]/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 text-ink hover:text-primary transition-all duration-300 active:scale-95 items-center justify-center shrink-0 hidden sm:flex"
            >
              <User className="h-[18px] w-[18px] md:h-5 md:w-5 stroke-[1.5]" aria-hidden="true" />
            </Link>
          )}

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="w-10 h-10 md:w-[46px] md:h-[46px] rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#d8b88d]/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 text-ink hover:text-primary transition-all duration-300 active:scale-95 flex items-center justify-center shrink-0 hidden md:flex"
          >
            <span className="relative inline-flex items-center justify-center">
              <Heart className="h-[18px] w-[18px] md:h-5 md:w-5 stroke-[1.5]" aria-hidden="true" />
              <span className="absolute -top-2.5 -right-2.5 md:-top-2.5 md:-right-3 min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px] rounded-full bg-[#a27b53] text-white text-[10px] md:text-[11px] font-bold flex items-center justify-center px-1 animate-in zoom-in-50 duration-200 shadow-sm border-[1.5px] border-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            </span>
          </Link>
          
          <IconButton
            onClick={openCart}
            ariaLabel={`Open cart, ${itemCount} items`}
            className="w-10 h-10 md:w-[46px] md:h-[46px] rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#d8b88d]/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 text-ink hover:text-primary transition-all duration-300 active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="relative inline-flex items-center justify-center">
              <ShoppingBag
                className="h-[18px] w-[18px] md:h-5 md:w-5 stroke-[1.5]"
                aria-hidden="true"
              />
              <span className="absolute -top-2.5 -right-2.5 md:-top-2.5 md:-right-3 min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px] rounded-full bg-[#a27b53] text-white text-[10px] md:text-[11px] font-bold flex items-center justify-center px-1 animate-in zoom-in-50 duration-200 shadow-sm border-[1.5px] border-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            </span>
          </IconButton>
        </div>
      </div>
    </header>
  );
}

