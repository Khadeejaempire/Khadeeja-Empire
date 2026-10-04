"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Star, Play, Camera, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export interface PublicReviewItem {
  id: string;
  authorName: string;
  quote: string;
  role?: string | null;
  rating?: number | null;
  photoUrl?: string | null;
  videoUrl?: string | null;
}

const SPEED_PX_PER_SEC = 35;
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

  // Lightbox Modal state for full photo/video view
  const [selectedMedia, setSelectedMedia] = useState<PublicReviewItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedMedia) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedMedia(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedMedia]);

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
        if (!pausedRef.current && !reduceMotion && !selectedMedia) {
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
  }, [reviews.length, selectedMedia]);

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
    <section id="testimonials" className="paper-grain bg-bg py-10 md:py-16 scroll-mt-28" aria-labelledby="home-reviews-title">
      <Container>
        <SectionHeading
          eyebrow="From Our Community"
          title="Worn and loved"
          description="Notes and captures from women who have made Khadeeja Empire their own."
          className="mb-10"
        />
        <h2 id="home-reviews-title" className="sr-only">Customer reviews</h2>

        <div
          ref={wrapperRef}
          className="relative overflow-hidden py-3"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onFocusCapture={() => { pausedRef.current = true; }}
          onBlurCapture={() => { pausedRef.current = false; }}
        >
          <div ref={trackRef} className="flex w-max gap-6 will-change-transform items-stretch">
            {items.map((review, index) => {
              const rating = review.rating ?? 5;
              const hasMedia = Boolean(review.videoUrl || review.photoUrl);
              const isVideo = Boolean(review.videoUrl);

              return (
                <figure
                  key={`${review.id}-${index}`}
                  className="group flex min-h-[250px] w-[290px] shrink-0 flex-col justify-between rounded-2xl border border-border/70 bg-[#FAF6EF] p-6 shadow-2xs transition-all duration-300 hover:border-[#D4A017]/50 hover:shadow-md sm:w-[330px] md:p-7 lg:w-[350px]"
                >
                  <div className="flex flex-col">
                    {/* Star Ratings + "View Photo" / "Watch Reel" pill */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex gap-1 text-[#D4A017]" aria-label={`${rating} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, star) => (
                          <Star key={star} size={15} fill={star < rating ? "currentColor" : "none"} aria-hidden="true" />
                        ))}
                      </div>

                      {hasMedia && (
                        <button
                          type="button"
                          onClick={() => setSelectedMedia(review)}
                          className="flex items-center gap-1.5 rounded-full border border-[#D4A017]/50 bg-amber-50/80 px-2.5 py-1 text-[11px] font-medium text-amber-900 shadow-2xs transition-all hover:bg-[#D4A017] hover:text-white active:scale-95 cursor-pointer"
                          title="Click to view customer capture"
                        >
                          {isVideo ? (
                            <>
                              <Play size={10} fill="currentColor" /> Watch Reel
                            </>
                          ) : (
                            <>
                              <Camera size={11} /> View Photo
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Review Quote (Uniform height & line-clamp) */}
                    <blockquote className="text-[14px] leading-relaxed text-ink/80 line-clamp-4">
                      &ldquo;{review.quote}&rdquo;
                    </blockquote>
                  </div>

                  {/* Customer Information (Uniform Monogram Badges for ALL cards) */}
                  <figcaption className="mt-6 flex items-center gap-3.5 border-t border-border/50 pt-4">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1f3d2f] text-sm font-semibold text-white shadow-2xs"
                      aria-hidden="true"
                    >
                      {initials(review.authorName)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-sm font-semibold text-ink">
                        {review.authorName}
                      </strong>
                      <span className="block truncate text-xs text-muted">
                        {review.role || "Verified Buyer"}
                      </span>
                    </div>
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

      {/* Full Window Black Background Lightbox (Mounted to body via createPortal) */}
      {mounted &&
        selectedMedia &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none p-4 sm:p-8"
            onClick={() => setSelectedMedia(null)}
          >
            {/* Top Close Button (Pure clean header) */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/90 hover:bg-white/25 hover:text-white transition-all cursor-pointer border border-white/20 shadow-lg active:scale-95"
                aria-label="Close photo preview"
              >
                <X size={22} />
              </button>
            </div>

            {/* Pure Photo / Video Display (No text, no stars, no cuts) */}
            <div
              className="relative flex items-center justify-center max-h-[92vh] max-w-[94vw] w-auto h-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.videoUrl ? (
                <video
                  src={selectedMedia.videoUrl}
                  poster={selectedMedia.photoUrl || undefined}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[88vh] max-w-[92vw] w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/10"
                />
              ) : selectedMedia.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMedia.photoUrl}
                  alt={
                    selectedMedia.authorName
                      ? `${selectedMedia.authorName} wearing Khadeeja Empire`
                      : "Customer review photo"
                  }
                  className="max-h-[88vh] max-w-[92vw] w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
                />
              ) : null}
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
