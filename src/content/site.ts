import type { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Khadeeja Empire",
  tagline: "Modern Indian Womenswear",
  logo: "/assets/logo.png",
  announcements: [
    "PAN INDIA SHIPPING IN 20 WORKING DAYS",
    "COMPLIMENTARY SHIPPING ON ORDERS ABOVE ₹2,000",
    "HANDCRAFTED IN BANARAS — MADE TO ORDER",
  ],
  email: "hello@khadeejaempire.com",
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  instagram: "https://www.instagram.com/khadeeja_empireofficial/",
  social: [
    {
      instagram: "https://www.instagram.com/khadeeja_empireofficial/",
      label: "Instagram",
    },
  ],
  navigation: [
    {
      label: "Shop",
      href: "/shop",
      megaMenu: {
        title: "Shop by Category",
        links: [
          { label: "All Products", href: "/shop" },
          { label: "Short Kurtis", href: "/collections/short-kurtis" },
          { label: "Co-ord Sets", href: "/collections/coord-sets" },
          { label: "Everyday Tops", href: "/collections/everyday-tops" },
          { label: "Dresses", href: "/collections/dresses" },
          { label: "Resort & Whites", href: "/collections/resort-and-whites" },
          { label: "New Arrivals", href: "/collections/new-arrivals" },
        ],
      },
    },
    {
      label: "Support",
      megaMenu: {
        title: "Customer Care",
        links: [
          { label: "Track Order", href: "/track-order" },
          { label: "Contact Us", href: "/contact" },
          {
            label: "Refund & Shipping Policies",
            href: "/shipping-returns",
          },
        ],
      },
    },
    {
      label: "Story",
      href: "/about",
    },
    {
      label: "Contact",
      href: "/contact",
    },
  ],
};
