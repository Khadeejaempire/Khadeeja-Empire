import Link from "next/link";
import {
  Instagram,
  Facebook,
  Mail,
  MapPin,
  Heart,
  MessageCircle,
} from "lucide-react";
import { siteConfig } from "@/content/site";
import { whatsappLink } from "@/lib/utils";
import { NewsletterForm } from "./NewsletterForm";
import { BrandLogo } from "./BrandLogo";
import type { Category } from "@/types";

const fallbackShopLinks = [
  { label: "All Products", href: "/shop" },
  { label: "Short Kurtis", href: "/collections/short-kurtis" },
  { label: "Co-ord Sets", href: "/collections/coord-sets" },
  { label: "Everyday Tops", href: "/collections/everyday-tops" },
  { label: "Dresses", href: "/collections/dresses" },
  { label: "New Arrivals", href: "/collections/new-arrivals" },
];

export function Footer({ categories }: { categories: Category[] }) {
  const shopLinks = categories.length
    ? [{ label: "All Products", href: "/shop" }, ...categories.map((c) => ({ label: c.name, href: `/collections/${c.slug}` }))]
    : fallbackShopLinks;
  return (
    <footer className="bg-bg border-t border-border/40 text-ink pt-10 md:pt-14 pb-8 relative" id="contact">
      <div className="w-full max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Newsletter Bar (Before Main Footer Grid, justify-between) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 mb-10 border-b border-border/50">
          <div className="max-w-xl">
            <h5 className="text-sm sm:text-base md:text-lg font-extrabold uppercase tracking-[0.22em] text-[#b89565] mb-1">
              STAY UPDATED
            </h5>
            <p className="text-xs sm:text-sm text-muted font-light leading-relaxed">
              New collections and stories, once a month.
            </p>
          </div>

          <div className="w-full md:w-[380px] lg:w-[420px] shrink-0">
            <NewsletterForm />
          </div>
        </div>

        {/* Main Footer Grid (Full 100% Container Width) */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 pb-12 border-b border-border/50">
          
          {/* Column 1: Brand Info & Social Media Buttons */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-4 flex flex-col items-start">
            <Link
              href="/"
              className="inline-block mb-1"
              aria-label={`${siteConfig.name} home`}
            >
              <BrandLogo variant="footer" />
            </Link>

            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-sm mb-5 font-light">
              Modern Indian Womenswear, rooted in Indian craft, designed for the way women dress now.
            </p>

            {/* Social Media Circular Buttons in Column 1 */}
            <div className="flex items-center gap-3 mt-3">
              <a
                href={siteConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full border border-[#b89565]/40 text-[#b89565] flex items-center justify-center hover:bg-[#b89565] hover:text-white transition-all duration-300 shadow-2xs active:scale-95"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full border border-[#b89565]/40 text-[#b89565] flex items-center justify-center hover:bg-[#b89565] hover:text-white transition-all duration-300 shadow-2xs active:scale-95"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="w-9 h-9 rounded-full border border-[#b89565]/40 text-[#b89565] flex items-center justify-center hover:bg-[#b89565] hover:text-white transition-all duration-300 shadow-2xs active:scale-95"
              >
                <span className="font-bold text-xs">P</span>
              </a>
              <a
                href={whatsappLink(siteConfig.whatsapp || siteConfig.phone)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full border border-[#b89565]/40 text-[#b89565] flex items-center justify-center hover:bg-[#b89565] hover:text-white transition-all duration-300 shadow-2xs active:scale-95"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: SHOP (Side-by-side on mobile) */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-2 flex flex-col items-start">
            <h5 className="text-sm sm:text-base font-extrabold uppercase tracking-[0.22em] text-[#b89565] mb-1.5">
              SHOP
            </h5>
            <div className="h-[2.5px] w-7 sm:w-8 bg-[#b89565]/70 mb-4" />

            <ul className="space-y-2.5 text-xs sm:text-sm text-ink/80 font-light">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#b89565] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: INFORMATION (Side-by-side on mobile) */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-2 flex flex-col items-start">
            <h5 className="text-sm sm:text-base font-extrabold uppercase tracking-[0.22em] text-[#b89565] mb-1.5">
              INFORMATION
            </h5>
            <div className="h-[2.5px] w-7 sm:w-8 bg-[#b89565]/70 mb-4" />

            <ul className="space-y-2.5 text-xs sm:text-sm text-ink/80 font-light">
              <li>
                <Link href="/about" className="hover:text-[#b89565] transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#b89565] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-[#b89565] transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:text-[#b89565] transition-colors">
                  Shipping &amp; Returns
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-[#b89565] transition-colors">
                  Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: VISIT US (Full Width Allocation to right edge) */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-4 flex flex-col items-start">
            <h5 className="text-sm sm:text-base font-extrabold uppercase tracking-[0.22em] text-[#b89565] mb-1.5">
              VISIT US
            </h5>
            <div className="h-[2.5px] w-7 sm:w-8 bg-[#b89565]/70 mb-4" />

            {/* Address */}
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-ink/80 mb-3.5">
              <MapPin size={16} className="text-[#b89565] shrink-0 mt-0.5" aria-hidden="true" />
              <address className="not-italic leading-relaxed">
                B16/35 Pandey Haveli, Varanasi<br />
                Uttar Pradesh, 221001<br />
                <span className="text-[#b89565] font-medium">Landmark: Kohinoor Guest House</span>
              </address>
            </div>

            {/* Email Link */}
            <div className="mb-3.5">
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-ink/80 hover:text-[#b89565] transition-colors font-medium"
              >
                <Mail size={15} className="text-[#b89565] shrink-0" aria-hidden="true" />
                <span>{siteConfig.email}</span>
              </a>
            </div>

            {/* Instagram Link */}
            <a
              href={siteConfig.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-ink/80 hover:text-[#b89565] transition-colors duration-300 font-medium"
            >
              <Instagram size={16} className="text-[#b89565] shrink-0" aria-hidden="true" />
              <span>Follow us on Instagram</span>
            </a>
          </div>

        </div>

        {/* Bottom Copyright & Policy Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-ink/80 font-medium text-center sm:text-left">
          <div>
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-ink/80">
            <Link href="/privacy" className="hover:text-[#b89565] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-border">|</span>
            <Link href="/terms" className="hover:text-[#b89565] transition-colors">
              Terms &amp; Conditions
            </Link>
            <span className="text-border">|</span>
            <Link href="/refund-policy" className="hover:text-[#b89565] transition-colors">
              Refund Policy
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-muted">
            <span>Made with</span>
            <Heart size={15} className="text-[#b89565] fill-[#b89565]" />
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


