"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart, Maximize2, Play, X } from "lucide-react";
import { useState, useRef, useEffect, type TouchEvent, type MouseEvent } from "react";

interface ProductGalleryProps {
  images: string[];
  video?: string | null;
  productName: string;
}

type Slide = { type: "image" | "video"; src: string };

const SWIPE_THRESHOLD = 35;

export function ProductGallery({ images, video, productName }: ProductGalleryProps) {
  const slides: Slide[] = [
    ...images.map((src) => ({ type: "image" as const, src })),
    ...(video ? [{ type: "video" as const, src: video }] : []),
  ];

  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [wishlist, setWishlist] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hover zoom state (Desktop)
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const hasMultipleSlides = slides.length > 1;

  const selectSlide = (index: number) => {
    if (!slides.length) return;
    setActiveIndex((index + slides.length) % slides.length);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    setTouchStart(event.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStart === null || !hasMultipleSlides) return;
    const distance = touchStart - (event.changedTouches[0]?.clientX ?? touchStart);
    setTouchStart(null);

    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    selectSlide(activeIndex + (distance > 0 ? 1 : -1));
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  if (!slides.length) {
    return (
      <div className="grid aspect-product place-items-center bg-surface text-sm text-muted rounded-sm" suppressHydrationWarning>
        Image coming soon
      </div>
    );
  }

  const activeSlide = slides[activeIndex];

  return (
    <>
      <section aria-label={`${productName} image gallery`} className="relative" suppressHydrationWarning>
        {/* Desktop & Tablet: Vertical thumbnail strip + Magnifier Zoom */}
        <div className="hidden md:flex gap-3 lg:gap-4">
          {/* Vertical Thumbnail Strip */}
          <div className="flex flex-col gap-2.5 w-[68px] lg:w-[84px] flex-shrink-0 max-h-[580px] overflow-y-auto no-scrollbar">
            {slides.map((slide, index) => (
              <button
                key={`${slide.src}-thumb-${index}`}
                type="button"
                suppressHydrationWarning
                onClick={() => selectSlide(index)}
                className={`relative w-full aspect-[3/4] overflow-hidden bg-surface transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                  activeIndex === index
                    ? "ring-2 ring-[var(--color-maroon)] shadow-xs"
                    : "opacity-70 hover:opacity-100 border border-border/80"
                }`}
                aria-label={slide.type === "video" ? "Show product video" : `Show image ${index + 1} of ${images.length}`}
                aria-current={activeIndex === index ? "true" : undefined}
              >
                {slide.type === "video" ? (
                  <>
                    <video src={slide.src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play size={14} className="text-white fill-white" strokeWidth={0} />
                    </span>
                  </>
                ) : (
                  <Image src={slide.src} alt="" fill sizes="84px" className="object-cover" />
                )}
              </button>
            ))}
          </div>

          {/* Main Image with Zoom on Hover */}
          <div
            ref={imageContainerRef}
            onMouseEnter={() => activeSlide.type === "image" && setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
            className="relative flex-1 aspect-[3/4] max-h-[640px] bg-surface-elevated overflow-hidden rounded border border-border/80 group cursor-crosshair"
          >
            {activeSlide.type === "video" ? (
              <video
                src={activeSlide.src}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={activeSlide.src}
                  alt={`${productName}, view ${activeIndex + 1}`}
                  fill
                  sizes="(min-width: 1024px) 50vw, (min-width: 768px) 50vw, 100vw"
                  className={`object-cover object-top transition-transform duration-150 ease-out ${
                    isZooming ? "scale-[2.2]" : "scale-100"
                  }`}
                  style={
                    isZooming
                      ? {
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        }
                      : undefined
                  }
                  priority={activeIndex === 0}
                />
              </div>
            )}

            {/* Lightbox Trigger Button */}
            {activeSlide.type === "image" && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-3 right-3 z-10 flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs text-ink shadow-md transition hover:bg-white hover:scale-105"
                aria-label="Click to enlarge image"
                title="Click to zoom full screen"
              >
                <Maximize2 size={15} strokeWidth={1.75} />
              </button>
            )}

            {/* Wishlist button */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setWishlist(!wishlist)}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs shadow-xs transition hover:bg-white hover:scale-105"
              aria-label={mounted && wishlist ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={mounted ? wishlist : false}
            >
              <Heart
                size={16}
                strokeWidth={1.5}
                className={
                  mounted && wishlist
                    ? "fill-[var(--color-maroon)] text-[var(--color-maroon)]"
                    : "text-[var(--color-muted)]"
                }
              />
            </button>

            {/* Subtle Zoom Hint */}
            {!isZooming && activeSlide.type === "image" && (
              <div className="absolute top-3 left-3 pointer-events-none rounded bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Hover to Zoom
              </div>
            )}
          </div>
        </div>

        {/* Mobile View: Compact Aspect-[4/5] Touch Slider + Pagination Badge */}
        <div className="md:hidden">
          <div className="relative aspect-[4/5] max-h-[460px] w-full bg-surface-elevated overflow-hidden rounded-lg border border-border/80">
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {slides.map((slide, index) => (
                <div key={`${slide.src}-${index}`} className="relative h-full min-w-full flex-shrink-0">
                  {slide.type === "video" ? (
                    <video
                      src={slide.src}
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={slide.src}
                      alt={`${productName}, view ${index + 1}`}
                      fill
                      sizes="100vw"
                      className="object-cover object-top"
                      priority={index === 0}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Top Bar on Mobile: Wishlist & Lightbox */}
            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-2">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setIsLightboxOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm"
                aria-label="Enlarge view"
              >
                <Maximize2 size={13} />
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setWishlist(!wishlist)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm"
                aria-label={mounted && wishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  size={15}
                  className={
                    mounted && wishlist
                      ? "fill-[var(--color-maroon)] text-[var(--color-maroon)]"
                      : "text-[var(--color-muted)]"
                  }
                />
              </button>
            </div>

            {/* Slide Count Badge (Bottom Center) */}
            {hasMultipleSlides && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
                {activeIndex + 1} / {slides.length}
              </div>
            )}
          </div>

          {/* Mobile Horizontal Thumbnail Strip (Touch Snap) */}
          {hasMultipleSlides && (
            <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.src}-mthumb-${index}`}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => selectSlide(index)}
                  className={`relative h-14 w-11 shrink-0 overflow-hidden rounded bg-surface border transition-all ${
                    activeIndex === index
                      ? "ring-2 ring-[var(--color-maroon)] border-transparent scale-105"
                      : "opacity-60 border-border"
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image src={slide.src} alt="" fill sizes="44px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal (Full Screen on Click) */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
        >
          {/* Close button */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
            aria-label="Close fullscreen view"
          >
            <X size={22} />
          </button>

          {/* Navigation Prev */}
          {hasMultipleSlides && (
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => selectSlide(activeIndex - 1)}
              className="absolute left-2 sm:left-4 z-50 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Modal Image container */}
          <div className="relative max-h-[85vh] max-w-[92vw] sm:max-w-[85vw] w-full h-full flex items-center justify-center">
            {activeSlide.type === "video" ? (
              <video
                src={activeSlide.src}
                controls
                autoPlay
                className="max-h-[80vh] max-w-full rounded shadow-2xl"
              />
            ) : (
              <div className="relative w-full h-full max-h-[80vh]">
                <Image
                  src={activeSlide.src}
                  alt={productName}
                  fill
                  className="object-contain"
                  sizes="95vw"
                  quality={95}
                />
              </div>
            )}
          </div>

          {/* Navigation Next */}
          {hasMultipleSlides && (
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => selectSlide(activeIndex + 1)}
              className="absolute right-2 sm:right-4 z-50 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
              aria-label="Next slide"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Bottom thumbnails */}
          {hasMultipleSlides && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex gap-2 overflow-x-auto max-w-[92vw] p-1.5 bg-black/50 rounded-full backdrop-blur-sm">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.src}-lb-${index}`}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => selectSlide(index)}
                  className={`relative h-11 w-9 shrink-0 overflow-hidden rounded transition ${
                    activeIndex === index
                      ? "ring-2 ring-white scale-105"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image src={slide.src} alt="" fill sizes="36px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
