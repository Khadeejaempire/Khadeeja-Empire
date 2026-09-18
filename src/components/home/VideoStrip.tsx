"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import type { InstagramPost } from "@/types";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Instagram,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Film,
  Sparkles,
} from "lucide-react";

export function VideoStrip({ posts }: { posts: InstagramPost[] }) {
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

  if (posts.length === 0) return null;

  const currentModalPost =
    selectedPostIndex !== null ? posts[selectedPostIndex] : null;

  const handleNextModal = () => {
    if (selectedPostIndex !== null) {
      setSelectedPostIndex((selectedPostIndex + 1) % posts.length);
    }
  };

  const handlePrevModal = () => {
    if (selectedPostIndex !== null) {
      setSelectedPostIndex(
        (selectedPostIndex - 1 + posts.length) % posts.length
      );
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface via-bg to-surface py-8 sm:py-12 md:py-16">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-[#7A1F1F]/10 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-64 sm:w-80 h-64 sm:h-80 bg-amber-500/10 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none" />

      <Container className="relative z-10">
        {/* Modern Header */}
        <div className="flex flex-col items-center text-center max-w-xl mx-auto mb-6 sm:mb-8 md:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#7A1F1F]/10 border border-[#7A1F1F]/20 text-[#7A1F1F] text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-2.5 shadow-sm">
            <Instagram className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Follow Along</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display mb-3 font-bold text-ink tracking-tight flex items-center justify-center gap-2">
            <span>@khadeeja_empireofficial</span>
            <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#7A1F1F] text-white text-xs">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            </span>
          </h2>

          <p className="pt-2 sm:mt-2 text-xs sm:text-sm md:text-base text-muted font-light leading-relaxed px-2">
            Real pieces, real moments. Tag us on Instagram to be featured.
          </p>
        </div>

        {/* Responsive Grid with Sleek Compact Height & Clean Cards */}
        <div className="mt-8 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {posts.map((post, index) => (
            <ReelCard
              key={post.id}
              post={post}
              onOpenModal={() => setSelectedPostIndex(index)}
            />
          ))}
        </div>
      </Container>

      {/* Sleek & Compact Reel Lightbox / Modal */}
      {currentModalPost && (
        <ReelModal
          post={currentModalPost}
          onClose={() => setSelectedPostIndex(null)}
          onNext={handleNextModal}
          onPrev={handlePrevModal}
          hasMultiple={posts.length > 1}
        />
      )}
    </section>
  );
}

function ReelCard({
  post,
  onOpenModal,
}: {
  post: InstagramPost;
  onOpenModal: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div
      onClick={onOpenModal}
      className="group relative w-full aspect-[3/4.2] sm:aspect-[4/5] overflow-hidden rounded-xl sm:rounded-2xl border border-ink/10 shadow-sm sm:shadow-md hover:shadow-xl transition-all duration-300 bg-black cursor-pointer transform hover:-translate-y-1"
    >
      {/* Video or Image */}
      {post.video ? (
        <video
          ref={videoRef}
          src={post.video}
          poster={post.image}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <Image
          src={post.image}
          alt={post.caption?.slice(0, 80) || "Instagram reel"}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
      )}

      {/* Gradient Overlay for Controls */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

      {/* Top Bar Indicators */}
      <div className="absolute top-2 left-2 right-2 sm:top-2.5 sm:left-2.5 sm:right-2.5 flex items-center justify-between z-10">
        <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[9px] sm:text-[10px] font-medium tracking-wide">
          <Film className="w-2.5 h-2.5 text-amber-400" />
          <span>REEL</span>
        </div>

        {post.video && (
          <div className="flex items-center gap-1">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              className="p-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              ) : (
                <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
              className="p-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/80" />
              ) : (
                <Volume2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Clean Bottom Overlay */}
      <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="p-1.5 sm:p-2 rounded-full bg-[#7A1F1F] text-white shadow-lg flex items-center justify-center">
          <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
    </div>
  );
}

function ReelModal({
  post,
  onClose,
  onNext,
  onPrev,
  hasMultiple,
}: {
  post: InstagramPost;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasMultiple: boolean;
}) {
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (modalVideoRef.current) {
      if (isPlaying) {
        modalVideoRef.current.pause();
        setIsPlaying(false);
      } else {
        modalVideoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      {/* High-visibility Close Button (Top Right of Screen) */}
      <button
        onClick={onClose}
        className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[120] p-2.5 sm:p-3 rounded-full bg-[#7A1F1F] text-white border-2 border-white/40 shadow-2xl hover:bg-black hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
        aria-label="Close reel modal"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
      </button>

      {/* Navigation - Prev */}
      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="fixed left-1.5 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-[110] p-2 sm:p-3 rounded-full bg-black/60 border border-white/30 text-white hover:bg-[#7A1F1F] transition-all shadow-xl"
          aria-label="Previous reel"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Navigation - Next */}
      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="fixed right-1.5 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-[110] p-2 sm:p-3 rounded-full bg-black/60 border border-white/30 text-white hover:bg-[#7A1F1F] transition-all shadow-xl"
          aria-label="Next reel"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Popup Container: Mobile compact vertical stack & Desktop side-by-side */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[90vw] max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl bg-surface rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/20 max-h-[82vh] md:max-h-[500px] flex flex-col md:flex-row my-auto"
      >
        {/* Left Side (Desktop 46% width / Mobile top video): Vertical Reel Video Container */}
        <div
          onClick={toggleMute}
          className="w-full md:w-[46%] bg-black relative aspect-[3/4] sm:aspect-[4/3] md:aspect-auto h-[260px] xs:h-[280px] sm:h-[320px] md:h-[500px] flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
        >
          {post.video ? (
            <video
              ref={modalVideoRef}
              src={post.video}
              poster={post.image}
              className="w-full h-full object-cover bg-black"
              autoPlay
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <Image
              src={post.image}
              alt={post.caption || "Reel preview"}
              fill
              sizes="100vw"
              className="object-cover bg-black"
            />
          )}

          {/* Top Bar Overlay on Modal Video */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] font-medium tracking-wide">
              <Film className="w-2.5 h-2.5 text-amber-400" />
              <span>REEL</span>
            </div>

            {post.video && (
              <div className="flex items-center gap-1">
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                  className="p-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3 text-white" />
                  ) : (
                    <Play className="w-3 h-3 fill-current text-white ml-0.5" />
                  )}
                </button>
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                  className="p-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-3 h-3 text-white" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-amber-400" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side (Desktop 54% width / Mobile bottom panel): Instagram Profile, Caption & Anchored Bottom CTA */}
        <div className="w-full md:w-[54%] p-3.5 sm:p-5 flex flex-col justify-between bg-surface text-ink flex-1 min-h-0 md:h-[500px] overflow-hidden">
          <div className="flex flex-col gap-2.5 sm:gap-3 flex-1 min-h-0 overflow-y-auto pr-0.5">
            {/* Header inside popup */}
            <div className="flex items-center justify-between border-b border-ink/10 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px]">
                  <div className="w-full h-full rounded-full bg-surface p-0.5 flex items-center justify-center">
                    <Instagram className="w-3.5 h-3.5 text-[#7A1F1F]" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-ink leading-tight">
                    Khadeeja Empire
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-muted">@khadeeja_empireofficial</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-black/10 hover:bg-[#7A1F1F] hover:text-white text-ink transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Caption text */}
            {post.caption && (
              <div className="space-y-1 text-xs sm:text-sm text-ink/80 font-light leading-relaxed">
                <p className="line-clamp-3 sm:line-clamp-5 md:line-clamp-8">{post.caption}</p>
                {post.hashtags && post.hashtags.length > 0 && (
                  <p className="text-[10px] sm:text-[11px] font-medium text-[#7A1F1F]">
                    {post.hashtags.map((t) => `#${t}`).join(" ")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* CTA Button anchored to the absolute bottom of the container */}
          <div className="pt-2.5 sm:pt-3 border-t border-ink/10 mt-auto shrink-0 bg-surface">
            <a
              href="https://www.instagram.com/khadeeja_empireofficial/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#7A1F1F] text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#5f1717] transition-colors shadow-md"
            >
              <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-none stroke-white" />
              <span className="text-white font-bold">Watch on Instagram</span>
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white opacity-90 stroke-white" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

