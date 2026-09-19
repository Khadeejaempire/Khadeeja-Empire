"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/types";

const ROTATE_INTERVAL_MS = 4500;

const HERO_BG = "#e5dace";
const HERO_INK = "#87221a";
const HERO_BTN = "#7f1f18";
const HERO_BTN_HOVER = "#6a1913";

const IMAGE_SCALE = ["md:scale-[1.38]", "md:scale-[1.25]", "md:scale-[1.28]"];

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
      className="relative min-h-[calc(100dvh-99px)] w-full overflow-hidden"
      style={{ backgroundColor: HERO_BG }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div
        className="flex min-h-[calc(100dvh-99px)] w-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none"
        style={{ transform: `translate3d(-${current * 100}%, 0, 0)` }}
      >
        {slides.map((s, i) => {
          const isActive = i === current;

          return (
            <div
              key={s.id}
              className="relative flex min-h-[calc(100dvh-99px)] w-full shrink-0 flex-col md:flex-row md:items-stretch"
              aria-hidden={!isActive}
              inert={!isActive}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slideCount}: ${s.title}`}
            >
              <div className="relative h-[52dvh] w-full self-end md:h-auto md:min-h-[calc(100dvh-99px)] md:w-[46%] md:self-stretch flex items-end justify-center">
                <Image
                  src={s.image}
                  alt={s.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 46vw"
                  className={cn(
                    "object-contain object-bottom md:origin-bottom",
                    IMAGE_SCALE[i % IMAGE_SCALE.length]
                  )}
                  priority={i === 0}
                />
              </div>

              <div className="flex flex-1 items-center justify-center px-6 py-12 text-center md:py-0">
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
                  {s.subtitle && (
                    <span
                      className="mb-4 text-[11px] sm:text-sm lg:text-[18px] font-medium uppercase tracking-[0.6em]"
                      style={{ color: HERO_INK }}
                    >
                      {s.subtitle}
                    </span>
                  )}
                  <h2
                    className="font-display uppercase text-[clamp(2.25rem,4.6vw,5.25rem)] leading-[0.95] tracking-[0.01em]"
                    style={{ color: HERO_INK }}
                  >
                    {s.title}
                  </h2>
                  <Link
                    href={s.ctaLink}
                    tabIndex={isActive ? undefined : -1}
                    className="mt-8 inline-flex items-center justify-center px-12 py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] transition-colors duration-300"
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
