"use client";

import { type ReactNode } from "react";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { UIProvider } from "@/hooks/useUI";
import { AnnouncementBar } from "./AnnouncementBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SearchDrawer, type SearchProduct } from "./SearchDrawer";
import { CartDrawer } from "./CartDrawer";
import { MobileNav } from "./MobileNav";
import { MobileBottomNav } from "./MobileBottomNav";
import { FloatingContact } from "./FloatingContact";
import { ToastContainer } from "@/components/ui/Toast";
import type { Category } from "@/types";
import type { CustomerSummary } from "./Header";

export function StoreShell({ children, announcements, products, categories, discoveryLinks, customer }: { children: ReactNode; announcements: string[]; products: SearchProduct[]; categories: Category[]; discoveryLinks: {label:string;href:string}[]; customer: CustomerSummary }) {
  return (
    <WishlistProvider>
      <CartProvider>
        <UIProvider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <AnnouncementBar messages={announcements} />
          <Header discoveryLinks={discoveryLinks} categories={categories} customer={customer} />
          <main id="main-content">{children}</main>
          <Footer categories={categories} />
          <SearchDrawer products={products} />
          <CartDrawer />
          <MobileNav categories={categories} />
          <MobileBottomNav customer={customer} />
          <FloatingContact />
          <ToastContainer />
        </UIProvider>
      </CartProvider>
    </WishlistProvider>
  );
}
