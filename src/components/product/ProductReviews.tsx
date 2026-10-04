"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Star, Camera, Play, X } from "lucide-react";
import { ReviewForm } from "@/components/product/ReviewForm";
import type { ReviewRecord } from "@/lib/admin/types";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" style={{ color: "var(--color-maroon)" }} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={14} fill={index < rating ? "currentColor" : "none"} aria-hidden="true" />
      ))}
    </div>
  );
}

function formatReviewDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

interface ProductReviewsProps {
  productId: string;
  productSlug: string;
  reviews: ReviewRecord[];
  isLoggedIn: boolean;
}

export function ProductReviews({ productId, productSlug, reviews, isLoggedIn }: ProductReviewsProps) {
  const approved = reviews.filter((r) => r.status === "approved");
  const average =
    approved.length > 0
      ? approved.reduce((sum, r) => sum + (r.rating || 0), 0) / approved.length
      : 0;

  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: "image" | "video";
    author?: string;
  } | null>(null);
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

  return (
    <div className="mt-20 border-t border-border pt-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-h2 text-ink">Customer Reviews</h2>
          {approved.length > 0 ? (
            <div className="mt-2 flex items-center gap-2">
              <StarRow rating={Math.round(average)} />
              <span className="text-sm text-muted">
                {average.toFixed(1)} out of 5 &middot; {approved.length} review{approved.length === 1 ? "" : "s"}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No reviews yet. Be the first to share your thoughts.</p>
          )}
        </div>
      </div>

      {approved.length > 0 ? (
        <div className="mb-10 flex flex-col gap-6">
          {approved.map((review) => (
            <div key={review.id} className="border-b border-border pb-6 last:border-b-0">
              <div className="flex items-center justify-between gap-4">
                <StarRow rating={review.rating || 0} />
                <span className="text-xs text-muted" suppressHydrationWarning>
                  {formatReviewDate(review.createdAt)}
                </span>
              </div>
              {review.title ? <p className="mt-2 font-semibold text-ink">{review.title}</p> : null}
              <p className="mt-1 text-sm leading-relaxed text-muted">{review.body}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink">{review.authorName}</p>

              {/* Review Photos & Video Reels */}
              {(review.photoUrl || review.videoUrl) && (
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  {review.photoUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMedia({
                          url: review.photoUrl!,
                          type: "image",
                          author: review.authorName,
                        })
                      }
                      className="group inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-ink shadow-2xs hover:border-[#1f3d2f] hover:bg-[#1f3d2f] hover:text-white transition cursor-pointer"
                    >
                      <Camera size={13} className="text-[#9c5247] group-hover:text-white transition" />
                      <span>View Photo</span>
                    </button>
                  )}
                  {review.videoUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMedia({
                          url: review.videoUrl!,
                          type: "video",
                          author: review.authorName,
                        })
                      }
                      className="group inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-ink shadow-2xs hover:border-[#1f3d2f] hover:bg-[#1f3d2f] hover:text-white transition cursor-pointer"
                    >
                      <Play size={13} fill="currentColor" className="text-[#9c5247] group-hover:text-white transition" />
                      <span>Watch Reel</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {isLoggedIn ? (
        <ReviewForm productId={productId} productSlug={productSlug} />
      ) : (
        <div className="border border-border p-6 bg-surface text-sm text-muted">
          <Link
            href={`/login?next=/products/${productSlug}`}
            className="font-semibold hover:underline"
            style={{ color: "var(--color-maroon)" }}
          >
            Log in
          </Link>{" "}
          to write a review.
        </div>
      )}

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
            {/* Top Close Button */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/90 hover:bg-white/25 hover:text-white transition-all cursor-pointer border border-white/20 shadow-lg active:scale-95"
                aria-label="Close media preview"
              >
                <X size={22} />
              </button>
            </div>

            {/* Pure Photo / Video Display */}
            <div
              className="relative flex items-center justify-center max-h-[92vh] max-w-[94vw] w-auto h-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === "video" ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[88vh] max-w-[92vw] w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/10"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMedia.url}
                  alt={
                    selectedMedia.author
                      ? `${selectedMedia.author} review photo`
                      : "Customer review photo"
                  }
                  className="max-h-[88vh] max-w-[92vw] w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
                />
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
