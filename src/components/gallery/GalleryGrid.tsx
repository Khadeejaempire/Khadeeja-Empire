"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Film, Instagram, Play } from "lucide-react";
import { ReelModal } from "@/components/home/VideoStrip";
import type { InstagramPost } from "@/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "reels" | "photos";

const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "reels", label: "Reels" },
  { id: "photos", label: "Photos" },
];

const isReel = (post: InstagramPost) => Boolean(post.video);

export function GalleryGrid({ posts }: { posts: InstagramPost[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      posts.filter((post) =>
        filter === "all" ? true : filter === "reels" ? isReel(post) : !isReel(post)
      ),
    [posts, filter]
  );

  const openIndex = openId ? visible.findIndex((post) => post.id === openId) : -1;
  const openPost = openIndex >= 0 ? visible[openIndex] : null;

  const step = (delta: number) => {
    if (openIndex < 0) return;
    setOpenId(visible[(openIndex + delta + visible.length) % visible.length].id);
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:mb-10">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={cn(
              "rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition",
              filter === item.id
                ? "border-[#7A1F1F] bg-[#7A1F1F] text-white shadow-md"
                : "border-ink/15 bg-white text-ink/70 hover:border-[#7A1F1F]/50 hover:text-[#7A1F1F]"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Nothing here yet. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {visible.map((post) => (
            <GalleryCard key={post.id} post={post} onOpen={() => setOpenId(post.id)} />
          ))}
        </div>
      )}

      {openPost && (
        <ReelModal
          post={openPost}
          onClose={() => setOpenId(null)}
          onNext={() => step(1)}
          onPrev={() => step(-1)}
          hasMultiple={visible.length > 1}
        />
      )}
    </>
  );
}

function GalleryCard({ post, onOpen }: { post: InstagramPost; onOpen: () => void }) {
  const reel = isReel(post);
  const BadgeIcon = reel ? Film : Instagram;
  const badge = reel ? "Reel" : "Photo";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${badge.toLowerCase()}: ${post.caption.slice(0, 60) || "Khadeeja Empire"}`}
      className="group relative block aspect-4/5 w-full overflow-hidden rounded-2xl border border-ink/10 bg-black text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1F1F]"
    >
      <Image
        src={post.image}
        alt={post.caption.slice(0, 80) || "Khadeeja Empire gallery"}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-black/25 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/40 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white backdrop-blur-md">
        <BadgeIcon className="h-2.5 w-2.5 text-amber-400" />
        {badge}
      </span>

      {reel && (
        <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#7A1F1F] shadow-lg transition group-hover:scale-110">
          <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
        </span>
      )}

      {post.caption && (
        <p className="absolute inset-x-3 bottom-3 line-clamp-2 translate-y-2 text-xs leading-snug text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {post.caption}
        </p>
      )}
    </button>
  );
}
