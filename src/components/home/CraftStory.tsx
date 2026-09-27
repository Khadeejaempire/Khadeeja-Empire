import Image from "next/image";
import Link from "next/link";
import { Flower2, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { CraftMark } from "@/components/ui/CraftMark";
import { SpoolIcon, RosetteIcon } from "@/components/icons/CraftIcons";

const CRAFT_IMAGE = "/assets/images/craft-story.png";

const features = [
  { icon: Flower2, label: "Authentic\nBanarasi Weaves" },
  { icon: SpoolIcon, label: "Handcrafted\nby Artisans" },
  { icon: RosetteIcon, label: "Premium Quality\nFabrics" },
];

export function CraftStory() {
  return (
    <section className="relative bg-[#3a1a12] overflow-hidden">
      {/* Background image, blended into the dark background */}
      <div className="absolute inset-0 lg:right-[38%]">
        <Image
          src={CRAFT_IMAGE}
          alt="Banarasi handloom weaving — every thread tells a story"
          fill
          sizes="(max-width: 1024px) 100vw, 62vw"
          className="object-cover object-[38%_42%]"
          priority
        />
        {/* Mobile: flat dark wash so overlaid text stays readable */}
        <div className="absolute inset-0 bg-[#2c130d]/70 lg:hidden" />
        {/* Desktop: fade the photo into the dark background on the right */}
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-transparent from-35% via-transparent via-65% to-[#3a1a12]" />
      </div>

      {/* Decorative branch illustration, bottom-right */}
      <svg
        width="140"
        height="220"
        viewBox="0 0 140 220"
        fill="none"
        className="absolute bottom-0 right-0 opacity-20 pointer-events-none hidden lg:block"
        aria-hidden="true"
      >
        <path d="M70 220 Q70 120 10 70" stroke="#d8b88d" strokeWidth="1.5" fill="none" />
        <path d="M70 170 Q100 140 130 80" stroke="#d8b88d" strokeWidth="1" fill="none" />
        <path d="M35 130 Q50 100 42 70" fill="#d8b88d" fillOpacity="0.25" stroke="#d8b88d" strokeWidth="1" />
        <path d="M80 140 Q105 110 128 120" fill="#d8b88d" fillOpacity="0.25" stroke="#d8b88d" strokeWidth="1" />
      </svg>

      <Container className="relative z-10 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Spacer column reserves space for the background image on desktop */}
          <div className="hidden lg:block" aria-hidden="true" />

          {/* Text Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-5 sm:gap-6 max-w-xl mx-auto lg:mx-0">
            <div className="flex flex-col items-center gap-4 w-full">
              <CraftMark className="h-12 w-12 sm:h-14 sm:w-14 text-accent" tone="turmeric" />
              <div className="flex items-center gap-4 w-full">
                <div className="h-px flex-1 bg-accent/40" />
                <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-accent whitespace-nowrap">
                  Our Heritage
                </p>
                <div className="h-px flex-1 bg-accent/40" />
              </div>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-[3.1rem] font-display font-bold leading-[1.15] text-white tracking-tight">
              Every thread{" "}
              <span className="text-accent italic font-serif font-normal">
                tells a story.
              </span>
            </h2>

            <div className="flex flex-col gap-4 text-base sm:text-lg leading-relaxed text-white/80 font-light">
              <p>
                Born in Banaras and made for the modern woman, Khadeeja Empire
                bridges the gap between heritage and today. Our sarees, suits
                and fabrics are woven with skilled hands, rich traditions and
                timeless art.
              </p>
              <p>
                Each piece is a celebration of craftsmanship, culture and the
                soul of Banaras — designed to be a part of your story, today
                and always.
              </p>
            </div>

            <Link
              href="/about"
              className="mt-1 inline-flex items-center gap-2.5 rounded-full bg-accent text-primary px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold uppercase tracking-[0.15em] shadow-lg hover:bg-white hover:text-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,255,255,0.2)] active:translate-y-0 active:scale-95"
            >
              Discover Our Journey
              <ArrowRight className="w-5 h-5" />
            </Link>

            {/* Feature Icons */}
            <div className="flex flex-wrap items-start justify-center lg:justify-start gap-x-6 gap-y-5 sm:gap-x-9 pt-6 mt-1">
              {features.map((feature, index) => (
                <div
                  key={feature.label}
                  className={`flex flex-col items-center lg:items-start gap-2.5 ${
                    index > 0 ? "sm:pl-9 sm:border-l sm:border-white/15" : ""
                  }`}
                >
                  <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-accent" strokeWidth={1.2} />
                  <span className="text-xs sm:text-sm text-white/70 leading-tight whitespace-pre-line">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
