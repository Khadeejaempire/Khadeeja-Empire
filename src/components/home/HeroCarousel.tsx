"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { HeroSlide } from "@/types";

const ROTATE_INTERVAL_MS = 4500;

const HERO_INK = "#87221a";
const HERO_BTN = "#7f1f18";
const HERO_BTN_HOVER = "#6a1913";

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const slideCount = slides.length;

  useEffect(() => {
    if (slideCount < 2) return;
    const timer = setInterval(
      () => setCurrent((c) => (c + 1) % slideCount),
      ROTATE_INTERVAL_MS
    );
    return () => clearInterval(timer);
  }, [slideCount]);

  if (slideCount === 0) return null;

  return (
    <section
      className="relative min-h-[calc(100svh-156px)] w-full overflow-hidden bg-[#f6ead4] md:min-h-[calc(100dvh-99px)] md:bg-[#e5dace]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div
        className="flex min-h-[calc(100svh-156px)] w-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none md:min-h-[calc(100dvh-99px)]"
        style={{ transform: `translate3d(-${current * 100}%, 0, 0)` }}
      >
        {slides.map((s, i) => {
          const isActive = i === current;

          return (
            <div
              key={s.id}
              className="relative flex min-h-[calc(100svh-156px)] w-full shrink-0 flex-col md:min-h-[calc(100dvh-99px)] md:flex-row md:items-stretch"
              aria-hidden={!isActive}
              inert={!isActive}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slideCount}: ${s.title}`}
            >
              <div className="relative w-full md:flex md:flex-initial md:h-auto md:min-h-[calc(100dvh-99px)] md:w-[46%] md:self-stretch md:items-end md:justify-center">
                {/* Mobile: fixed square box, always full width — zero gap. Upload a 1:1 image so nothing gets cropped; a slightly off-ratio image is cropped minimally rather than leaving a gap. */}
                <div className="relative w-full aspect-square md:hidden">
                  <Image
                    src={s.mobileImage || s.image}
                    alt={s.imageAlt}
                    fill
                    sizes="100vw"
                    className="object-cover object-center"
                    priority={i === 0}
                  />
                </div>
                {/* Desktop: fills the fixed-height side panel, never cropped */}
                <div className="hidden md:block md:h-full md:w-full">
                  <div className="relative h-full w-full">
                    <Image
                      src={s.image}
                      alt={s.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 46vw"
                      className="object-contain object-center"
                      priority={i === 0}
                    />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-center px-6 py-2 sm:py-4 text-center md:flex-1 md:py-0">
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
                  {s.subtitle && (
                    <span
                      className="mb-2 sm:mb-4 text-[10px] sm:text-sm lg:text-[18px] font-medium uppercase tracking-[0.4em] sm:tracking-[0.6em]"
                      style={{ color: HERO_INK }}
                    >
                      {s.subtitle}
                    </span>
                  )}
                  <h2
                    className="font-display uppercase text-[clamp(1.75rem,4.6vw,5.25rem)] leading-[0.95] tracking-[0.01em]"
                    style={{ color: HERO_INK }}
                  >
                    {s.title}
                  </h2>
                  <Link
                    href={s.ctaLink}
                    tabIndex={isActive ? undefined : -1}
                    className="mt-4 sm:mt-8 inline-flex items-center justify-center px-12 py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] transition-colors duration-300"
                    style={{ backgroundColor: HERO_BTN, color: "#ffffff" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = HERO_BTN_HOVER)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = HERO_BTN)}
                  >
                    {s.cta}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
