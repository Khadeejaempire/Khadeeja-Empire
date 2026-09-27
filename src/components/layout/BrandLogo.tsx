import Image from "next/image";
import { siteConfig } from "@/content/site";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "navbar" | "footer";
  className?: string;
}

export function BrandLogo({ variant = "navbar", className }: BrandLogoProps) {
  const isNavbar = variant === "navbar";

  return (
    <span
      className={cn(
        "brand-logo",
        isNavbar ? "brand-logo-navbar" : "brand-logo-footer",
        className
      )}
    >
      <Image
        src={siteConfig.logo}
        alt={`${siteConfig.name} logo`}
        fill
        sizes={isNavbar ? "100px" : "140px"}
        className="object-contain"
        priority={isNavbar}
      />
    </span>
  );
}
