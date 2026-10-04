"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { createPortal } from "react-dom";

type Signature = { cloud_name: string; api_key: string; timestamp: number; folder: string; signature: string };

export function MediaUpload({
  name,
  label,
  defaultValue = "",
  folder = "khadeeja/content",
  aspectClassName = "aspect-video",
  fit = "cover",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  folder?: "khadeeja/products" | "khadeeja/hero" | "khadeeja/content" | "khadeeja/instagram" | "khadeeja/categories";
  aspectClassName?: string;
  fit?: "cover" | "contain";
}) {
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const resourceType = file.type.startsWith("video/") ? "video" : "image";
    setStatus("Preparing upload…");
    try {
      const signatureResponse = await fetch("/api/admin/media/signature", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ folder, resourceType, format: extension, fileSize: file.size }),
      });
      const signature = (await signatureResponse.json()) as Signature & { error?: string };
      if (!signatureResponse.ok) throw new Error(signature.error || "Upload is unavailable.");
      const payload = new FormData();
      payload.set("file", file);
      payload.set("api_key", signature.api_key);
      payload.set("timestamp", String(signature.timestamp));
      payload.set("folder", signature.folder);
      payload.set("signature", signature.signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloud_name)}/${resourceType}/upload`, {
        method: "POST",
        body: payload,
      });
      const result = (await response.json()) as { secure_url?: string; error?: { message?: string } };
      if (!response.ok || !result.secure_url) throw new Error(result.error?.message || "Upload failed.");
      setValue(result.secure_url);
      setStatus("Upload complete.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="block text-sm font-medium text-stone-700">{label}</span>
      <input type="hidden" name={name} value={value || ""} />

      {/* File Preview */}
      {value ? (
        <div className="flex flex-col gap-1.5">
          <div
            onClick={() => setLightboxOpen(true)}
            className={`group relative cursor-pointer ${aspectClassName} w-full max-w-[240px] max-h-52 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 flex items-center justify-center shadow-2xs transition hover:border-[#9c5247]/60`}
            title="Click to view full image on black background"
          >
            {value.toLowerCase().match(/\.(mp4|webm|ogv|mov)$/) || value.includes("/video/upload/") ? (
              <video src={value} className="h-full w-full object-contain pointer-events-none" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt={label} className={`h-full w-full ${fit === "contain" ? "object-contain p-1" : "object-cover"}`} />
            )}

            {/* Hover overlay hint */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Full Image
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setValue("");
              }}
              title="Remove media"
              className="absolute right-2 top-2 z-10 rounded-full bg-stone-900/80 p-1 text-white hover:bg-red-600 transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9c5247] hover:underline cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Full Image
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-11 w-full flex-wrap items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2">
        {value ? (
          <span className="min-w-0 flex-1 truncate text-sm text-stone-900" title={value}>
            {value.split("/").pop()}
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm text-stone-400">No file uploaded</span>
        )}
        <div
          onClick={() => inputRef.current?.click()}
          className="shrink-0 cursor-pointer rounded-md bg-[#9c5247]/10 px-3 py-1.5 text-xs font-semibold text-[#9c5247] hover:bg-[#9c5247]/20 transition"
        >
          Upload
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
            onChange={upload}
            className="sr-only"
          />
        </div>
      </div>
      {status ? (
        <p className="text-xs text-stone-500" role="status">
          {status}
        </p>
      ) : null}

      {/* Full-Screen Black Background Lightbox */}
      {lightboxOpen && mounted && typeof document !== "undefined" && value
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/92 p-4 backdrop-blur-md animate-in fade-in duration-200"
              role="dialog"
              aria-modal="true"
              aria-label="Full image preview"
              onClick={() => setLightboxOpen(false)}
            >
              {/* Top Navigation Bar */}
              <div
                className="absolute top-0 inset-x-0 flex items-center justify-between px-4 sm:px-8 py-4 text-white z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-stone-200 truncate max-w-[200px] sm:max-w-md">
                    {value.split("/").pop()}
                  </span>
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-stone-400 hover:text-white underline transition"
                  >
                    Open original ↗
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(false)}
                    className="inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition cursor-pointer"
                    aria-label="Close preview"
                    title="Close preview (Esc)"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Full Image Display - Uncropped, centered */}
              <div
                className="relative max-h-[85vh] max-w-[92vw] flex items-center justify-center select-none"
                onClick={(e) => e.stopPropagation()}
              >
                {value.toLowerCase().match(/\.(mp4|webm|ogv|mov)$/) || value.includes("/video/upload/") ? (
                  <video
                    src={value}
                    controls
                    autoPlay
                    className="max-h-[85vh] max-w-[92vw] rounded-lg shadow-2xl object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={value}
                    alt={label}
                    className="max-h-[85vh] max-w-[92vw] rounded-lg shadow-2xl object-contain block ring-1 ring-white/10"
                  />
                )}
              </div>

              {/* Bottom hint */}
              <p
                className="absolute bottom-4 text-xs text-stone-400 select-none pointer-events-none"
                onClick={(e) => e.stopPropagation()}
              >
                Click outside or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-stone-300">Esc</kbd> to close
              </p>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
