import Image from "next/image";
import Link from "next/link";
import { Flower2, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SpoolIcon, RosetteIcon } from "@/components/icons/CraftIcons";

// Separate crops for mobile vs laptop so nothing gets cut on either —
// save a dedicated mobile-friendly image as hero-weaving-mobile.png to use a different one there.
const HERO_IMAGE_DESKTOP = "/assets/images/hero-weaving.png";
const HERO_IMAGE_MOBILE = "/assets/images/hero-weaving-mobile.png";

const features = [
  { icon: Flower2, label: "Authentic\nBanarasi Weaves" },
  { icon: SpoolIcon, label: "Handcrafted\nby Artisans" },
  { icon: RosetteIcon, label: "Premium Quality\nFabrics" },
];

export function BrandIntro({
  desktopImage,
  mobileImage,
}: { desktopImage?: string; mobileImage?: string } = {}) {
  const heroDesktop = desktopImage || HERO_IMAGE_DESKTOP;
  const heroMobile = mobileImage || HERO_IMAGE_MOBILE;
  return (
    <section className="relative overflow-hidden bg-[#f6ede0] min-h-[540px] sm:min-h-[600px] lg:min-h-[90vh] flex items-center">
      {/* Background photo — never cropped, separate crops for mobile vs laptop */}
      <div className="absolute inset-x-0 top-[2px] bottom-[2px]">
        <Image
          src={heroMobile}
          alt="Banarasi handloom weaving craftsmanship"
          fill
          sizes="100vw"
          className="object-contain object-center lg:hidden"
          priority
        />
        <Image
          src={heroDesktop}
          alt="Banarasi handloom weaving craftsmanship"
          fill
          sizes="100vw"
          className="hidden object-contain object-[58%_45%] lg:block"
          priority
        />
        {/* Warm cream fade from the left so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#f6ede0] from-10% via-[#f6ede0]/75 via-45% to-transparent" />
        <div className="absolute inset-0 bg-[#f6ede0]/60 lg:hidden" />
      </div>

      {/* Decorative branch illustration, bottom-left */}
      <svg
        width="180"
        height="240"
        viewBox="0 0 180 240"
        fill="none"
        className="absolute bottom-0 left-0 opacity-25 pointer-events-none hidden sm:block"
        aria-hidden="true"
      >
        <path d="M20 240 Q30 150 90 110" stroke="#ad8150" strokeWidth="1.5" fill="none" />
        <path d="M40 200 Q70 170 60 120" stroke="#ad8150" strokeWidth="1" fill="none" />
        <path d="M55 150 Q65 125 58 100" fill="#ad8150" fillOpacity="0.2" stroke="#ad8150" strokeWidth="1" />
        <path d="M75 130 Q95 105 115 115" fill="#ad8150" fillOpacity="0.2" stroke="#ad8150" strokeWidth="1" />
        <path d="M15 190 Q35 175 30 145" fill="#ad8150" fillOpacity="0.2" stroke="#ad8150" strokeWidth="1" />
      </svg>

      <Container className="relative z-10 py-16 sm:py-10">
        <div className="max-w-xl mx-auto sm:mx-0 text-center sm:text-left">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-[#a9762f] mb-4">
            Khadeeja Empire
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-display font-semibold leading-[1.15] text-[#2d2016] mb-5 tracking-tight">
            Rooted in Tradition,
            <br />
            <span className="italic font-serif font-normal text-[#a9762f]">Woven with Love.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#4a3d31] leading-relaxed max-w-md mx-auto sm:mx-0 mb-7 font-light">
            From the hands of skilled artisans to timeless Banarasi weaves —
            every piece tells a story of heritage, craftsmanship and tradition.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-4 sm:gap-x-7 mb-8">
            {features.map((feature, index) => (
              <div
                key={feature.label}
                className={`flex items-center gap-3 ${
                  index > 0 ? "sm:pl-6 sm:border-l sm:border-[#a9762f]/25" : ""
                }`}
              >
                <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-[#a9762f] shrink-0" strokeWidth={1.2} />
                <span className="text-xs sm:text-sm text-[#4a3d31] leading-tight whitespace-pre-line text-left">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold uppercase tracking-[0.2em] text-[#2d2016] hover:text-[#a9762f] transition-colors group"
          >
            Our Heritage
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
