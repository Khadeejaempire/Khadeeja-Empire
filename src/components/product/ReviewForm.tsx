"use client";

import { useRef, useState, useTransition } from "react";
import { Star, Camera, Video, X, Loader2 } from "lucide-react";
import { submitReview, uploadReviewMediaAction } from "@/app/(storefront)/products/[slug]/review-actions";

export function ReviewForm({ productId, productSlug }: { productId: string; productSlug: string }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  type SignatureResponse = {
    cloud_name: string;
    api_key: string;
    timestamp: number;
    folder: string;
    signature: string;
    error?: string;
  };

  const uploadFile = async (file: File, isVideo: boolean): Promise<string> => {
    const extension = (file.name.split(".").pop() || "").toLowerCase();
    const resourceType = isVideo ? "video" : "image";

    // 1. Direct Cloudinary upload (bypasses server body limits completely)
    try {
      const sigRes = await fetch("/api/customer/media/signature", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          folder: "khadeeja/content",
          resourceType,
          format: extension,
          fileSize: file.size,
        }),
      });

      if (sigRes.ok) {
        const sig = (await sigRes.json()) as SignatureResponse;
        if (sig.cloud_name && sig.signature) {
          const payload = new FormData();
          payload.set("file", file);
          payload.set("api_key", sig.api_key);
          payload.set("timestamp", String(sig.timestamp));
          payload.set("folder", sig.folder);
          payload.set("signature", sig.signature);

          const cloudRes = await fetch(
            `https://api.cloudinary.com/v1_1/${encodeURIComponent(sig.cloud_name)}/${resourceType}/upload`,
            { method: "POST", body: payload }
          );

          const cloudData = (await cloudRes.json()) as { secure_url?: string; error?: { message?: string } };
          if (cloudRes.ok && cloudData.secure_url) {
            return cloudData.secure_url;
          }
        }
      }
    } catch {
      // Signature route not available or network error, proceed to fallback
    }

    // 2. Fallback to Server Action upload (with 100MB body limit)
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadReviewMediaAction(fd);
    if (res?.error) {
      throw new Error(res.error);
    }
    if (res?.url) {
      return res.url;
    }
    throw new Error("Upload failed. Please check the file and try again.");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaError(null);
    setUploadingPhoto(true);

    try {
      const url = await uploadFile(file, false);
      setPhotoUrl(url);
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaError(null);
    setUploadingVideo(true);

    try {
      const url = await uploadFile(file, true);
      setVideoUrl(url);
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : "Failed to upload video.");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setMediaError(null);

    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    if (body.trim().length < 1) {
      setError("Please write a few words about the product.");
      return;
    }

    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("productSlug", productSlug);
    formData.append("rating", String(rating));
    formData.append("title", title);
    formData.append("body", body);
    if (photoUrl) formData.append("photoUrl", photoUrl);
    if (videoUrl) formData.append("videoUrl", videoUrl);

    startTransition(async () => {
      const res = await submitReview(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccess(res.success);
        setRating(0);
        setTitle("");
        setBody("");
        setPhotoUrl("");
        setVideoUrl("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 border border-border p-6 bg-surface">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">Write a Review</h3>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink">Your Rating</label>
        <div className="flex gap-1" role="radiogroup" aria-label="Select a star rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(value)}
              className="p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
            >
              <Star
                size={22}
                strokeWidth={1.5}
                style={{ color: "var(--color-maroon)" }}
                fill={(hoverRating || rating) >= value ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink">Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your review"
          maxLength={240}
          className="h-11 px-4 bg-white border border-border rounded-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-ink placeholder:text-muted/60"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink">Your Review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your experience with this product"
          rows={4}
          maxLength={5000}
          required
          className="px-4 py-3 bg-white border border-border rounded-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-ink placeholder:text-muted/60"
        />
      </div>

      {/* Media Upload Options (Photo & Video Reel) */}
      <div className="border-t border-border/70 pt-4 flex flex-col gap-4">
        <div>
          <span className="block text-sm font-semibold text-ink">Customer Media (Optional)</span>
          <p className="text-xs text-muted">
            Share how the outfit looks on you. You can upload a photo, a video reel, or both.
          </p>
        </div>

        {mediaError && <p className="text-xs text-red-500">{mediaError}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Customer Photo Upload */}
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-white/50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5">
              <Camera size={14} className="text-[#9c5247]" /> Customer Wear Photo
            </span>

            {photoUrl ? (
              <div className="relative aspect-[4/5] w-32 max-h-40 overflow-hidden rounded-lg border border-border bg-stone-100 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Uploaded customer wear" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  title="Remove photo"
                  className="absolute right-1.5 top-1.5 rounded-full bg-stone-900/80 p-1 text-white hover:bg-red-600 transition cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <p className="text-[11px] text-muted">Upload photo or outfit showcase (JPG, PNG, WebP up to 10MB)</p>
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => photoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-stone-50 transition cursor-pointer disabled:opacity-60"
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-[#9c5247]" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Camera size={13} className="text-[#9c5247]" /> Choose Photo
                    </>
                  )}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                />
              </div>
            )}
          </div>

          {/* 2. Customer Video Reel Upload */}
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-white/50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5">
              <Video size={14} className="text-[#9c5247]" /> Customer Video / Reel
            </span>

            {videoUrl ? (
              <div className="relative aspect-[9/16] w-28 max-h-40 overflow-hidden rounded-lg border border-border bg-stone-900 shadow-2xs">
                <video src={videoUrl} controls className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setVideoUrl("")}
                  title="Remove video"
                  className="absolute right-1.5 top-1.5 rounded-full bg-stone-900/80 p-1 text-white hover:bg-red-600 transition cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <p className="text-[11px] text-muted">Upload review reel or drape clip (MP4, WebM up to 100MB)</p>
                <button
                  type="button"
                  disabled={uploadingVideo}
                  onClick={() => videoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-stone-50 transition cursor-pointer disabled:opacity-60"
                >
                  {uploadingVideo ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-[#9c5247]" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Video size={13} className="text-[#9c5247]" /> Choose Video
                    </>
                  )}
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoUpload}
                  className="sr-only"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <button
        type="submit"
        disabled={isPending || uploadingPhoto || uploadingVideo}
        className="self-start h-11 px-6 bg-[#2d2520] hover:bg-primary text-white font-semibold tracking-widest text-xs uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
