"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export interface PublicReviewItem {
  id: string;
  authorName: string;
  quote: string;
  role?: string | null;
  rating?: number | null;
}

const SPEED_PX_PER_SEC = 40;
const CARD_GAP = 24;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function PublicReviews({ reviews }: { reviews: PublicReviewItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const offsetRef = useRef(0);
  const targetRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    const wrapper = wrapperRef.current;
    if (!track || !wrapper || reviews.length <= 1) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(now - last, 64);
      last = now;
      const half = track.scrollWidth / 2;

      if (half > wrapper.clientWidth) {
        if (!pausedRef.current && !reduceMotion) {
          targetRef.current += (SPEED_PX_PER_SEC * delta) / 1000;
        }
        if (targetRef.current >= half) {
          targetRef.current -= half;
          offsetRef.current -= half;
        }
        if (targetRef.current < 0) {
          targetRef.current += half;
          offsetRef.current += half;
        }
        offsetRef.current += (targetRef.current - offsetRef.current) * Math.min(1, delta / 180);
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  const items = reviews.length > 1 ? [...reviews, ...reviews] : reviews;

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + CARD_GAP : track.clientWidth;
    targetRef.current += direction * step;
  };

  return (
    <section className="paper-grain bg-bg py-10 md:py-14" aria-labelledby="home-reviews-title">
      <Container>
        <SectionHeading
          eyebrow="From Our Community"
          title="Worn and loved"
          description="Notes from women who have made Khadeeja Empire their own."
          className="mb-10"
        />
        <h2 id="home-reviews-title" className="sr-only">Customer reviews</h2>

        <div
          ref={wrapperRef}
          className="relative overflow-hidden"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onFocusCapture={() => { pausedRef.current = true; }}
          onBlurCapture={() => { pausedRef.current = false; }}
        >
          <div ref={trackRef} className="flex w-max gap-6 will-change-transform">
            {items.map((review, index) => {
              const rating = review.rating ?? 5;
              return (
                <figure
                  key={`${review.id}-${index}`}
                  className="flex min-h-64 w-[280px] shrink-0 flex-col rounded-2xl border border-border/60 bg-[#FAF6EF] p-6 sm:w-[320px] md:p-8 lg:w-[360px]"
                >
                  <div className="mb-5 flex gap-1 text-[#D4A017]" aria-label={`${rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, star) => (
                      <Star key={star} size={16} fill={star < rating ? "currentColor" : "none"} aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="flex-1 text-[15px] leading-relaxed text-ink/80">
                    {review.quote}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1f3d2f] text-sm font-semibold text-white"
                      aria-hidden="true"
                    >
                      {initials(review.authorName)}
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm font-semibold text-ink">{review.authorName}</strong>
                      {review.role ? <span className="text-xs text-muted">{review.role}</span> : null}
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Previous reviews"
            className="absolute left-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-surface/95 text-ink shadow-lg backdrop-blur transition-all hover:border-primary hover:bg-primary hover:text-white active:scale-95 sm:left-2"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Next reviews"
            className="absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-surface/95 text-ink shadow-lg backdrop-blur transition-all hover:border-primary hover:bg-primary hover:text-white active:scale-95 sm:right-2"
          >
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        </div>
      </Container>
    </section>
  );
}
