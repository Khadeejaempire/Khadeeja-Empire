"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  Smartphone,
  Monitor,
  X,
  Layers,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import type { CategoryRecord, HeroSlideRecord } from "@/lib/admin/types";
import { MediaUpload } from "@/components/admin/MediaUpload";
import {
  saveHeroSlideAction,
  deleteHeroSlideAction,
  toggleHeroSlideAction,
  reorderHeroSlidesAction,
} from "@/actions/admin/content";
import { toast } from "sonner";

export function HeroSlidesManager({
  slides: initialSlides,
  categories,
}: {
  slides: HeroSlideRecord[];
  categories: CategoryRecord[];
}) {
  const [slides, setSlides] = useState<HeroSlideRecord[]>(initialSlides);
  const [editingSlide, setEditingSlide] = useState<HeroSlideRecord | "new" | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showSimulator, setShowSimulator] = useState(true);
  const [isPending, startTransition] = useTransition();

  const activeSlides = slides.filter((s) => s.active !== false);

  const handleToggleActive = (slide: HeroSlideRecord) => {
    const nextActive = !slide.active;
    const formData = new FormData();
    formData.set("id", String(slide.id));
    formData.set("active", String(nextActive));

    startTransition(async () => {
      try {
        await toggleHeroSlideAction(formData);
        setSlides((prev) =>
          prev.map((s) => (s.id === slide.id ? { ...s, active: nextActive } : s))
        );
        toast.success(nextActive ? "Slide activated on homepage" : "Slide hidden from homepage");
      } catch (err) {
        toast.error("Failed to update status");
      }
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    const reorderedIds = newSlides.map((s) => String(s.id));
    const formData = new FormData();
    reorderedIds.forEach((id) => formData.append("ids[]", id));

    startTransition(async () => {
      try {
        await reorderHeroSlidesAction(formData);
        setSlides(newSlides);
        toast.success("Slides reordered successfully");
      } catch (err) {
        toast.error("Failed to reorder slides");
      }
    });
  };

  const handleDelete = (id: string) => {
    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      try {
        await deleteHeroSlideAction(formData);
        setSlides((prev) => prev.filter((s) => String(s.id) !== id));
        setDeleteConfirmId(null);
        toast.success("Slide deleted successfully");
      } catch (err) {
        toast.error("Failed to delete slide");
      }
    });
  };

  const currentPreviewSlide = activeSlides[previewIndex] || slides[0];

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header & Actions Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-2xs">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#9c5247]/10 px-2.5 py-0.5 text-xs font-semibold text-[#9c5247]">
                <Layers className="h-3.5 w-3.5" />
                Storefront Hero Carousel
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-500 font-medium">
                {activeSlides.length} of {slides.length} active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-sans">
              Hero Slides
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 max-w-xl">
              Curate full-bleed homepage hero banners, typography overlays, call-to-actions, and mobile-optimized slides.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 shadow-2xs hover:bg-stone-100 hover:border-stone-400 transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-stone-600 stroke-[2.5]" />
              <span>View Storefront</span>
            </Link>

            <button
              type="button"
              onClick={() => setEditingSlide("new")}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-4 py-2 text-xs font-bold text-[#7f2d22] shadow-2xs hover:bg-[#f4e7e4] hover:border-[#7f2016] hover:text-[#5c160f] transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Hero Slide</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {/* Card 1: Active Slides */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Live on Store
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 font-sans">
              {activeSlides.length}
            </span>
            <span className="text-xs text-stone-500">slides live</span>
          </div>
          <p className="mt-2 text-[11px] text-stone-400 border-t border-stone-100 pt-2">
            Visible in homepage rotation
          </p>
        </div>

        {/* Card 2: Total Slides */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Created
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 font-sans">
              {slides.length}
            </span>
            <span className="text-xs text-stone-500">/ 10 max</span>
          </div>
          <p className="mt-2 text-[11px] text-stone-400 border-t border-stone-100 pt-2">
            {10 - slides.length} slots remaining
          </p>
        </div>

        {/* Card 3: Mobile Optimized */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Mobile Adapted
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 font-sans">
              {slides.filter((s) => s.mobileImage).length}
            </span>
            <span className="text-xs text-stone-500">with 1:1 image</span>
          </div>
          <p className="mt-2 text-[11px] text-stone-400 border-t border-stone-100 pt-2">
            Dedicated mobile banners
          </p>
        </div>

        {/* Card 4: Slide Display Mode */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Autoplay Sequence
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-stone-900 font-sans">
              5s Interval
            </span>
          </div>
          <p className="mt-2 text-[11px] text-stone-400 border-t border-stone-100 pt-2">
            Fluid loop on homepage
          </p>
        </div>
      </div>

      {/* ── Live Carousel Interactive Preview Simulator ── */}
      {currentPreviewSlide && (
        <div className="rounded-2xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 sm:px-6 py-3.5 bg-stone-50/60">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-sans">
                  Storefront Live Simulator
                </h2>
                <p className="text-[11px] text-stone-500">
                  Slide {previewIndex + 1} of {activeSlides.length || 1}: &ldquo;{currentPreviewSlide.title}&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPreviewIndex((prev) => (prev > 0 ? prev - 1 : activeSlides.length - 1))
                }
                disabled={activeSlides.length <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPreviewIndex((prev) => (prev < activeSlides.length - 1 ? prev + 1 : 0))
                }
                disabled={activeSlides.length <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowSimulator(!showSimulator)}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 ml-2 cursor-pointer"
              >
                {showSimulator ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
          </div>

          {showSimulator && (
            <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden bg-stone-900">
              {/* Background Media */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentPreviewSlide.image}
                alt={currentPreviewSlide.imageAlt || currentPreviewSlide.title}
                className="h-full w-full object-cover opacity-85 transition-all duration-700"
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-stone-950/40 to-transparent flex items-center">
                <div className="px-6 sm:px-12 max-w-xl text-white space-y-2">
                  {currentPreviewSlide.subtitle && (
                    <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#e8b595]">
                      {currentPreviewSlide.subtitle}
                    </p>
                  )}
                  <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight font-sans drop-shadow-sm">
                    {currentPreviewSlide.title}
                  </h3>
                  {currentPreviewSlide.cta && (
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-stone-900 shadow-md">
                        {currentPreviewSlide.cta}
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Slide Dots Indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full">
                {activeSlides.map((s, idx) => (
                  <button
                    key={String(s.id)}
                    type="button"
                    onClick={() => setPreviewIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === previewIndex ? "w-6 bg-white" : "w-2 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Slide Cards Workspace ── */}
      <div className="rounded-2xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 sm:px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 font-sans">
                Hero Slide Sequence ({slides.length})
              </h2>
              <p className="text-xs text-stone-500">
                Order determines the playback sequence on the storefront carousel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditingSlide("new")}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-3.5 py-1.5 text-xs font-bold text-[#7f2d22] shadow-2xs hover:bg-[#f4e7e4] hover:border-[#7f2016] hover:text-[#5c160f] transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Slide</span>
          </button>
        </div>

        {slides.length === 0 ? (
          <div className="py-16 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-stone-300 stroke-[1.5]" />
            <h3 className="mt-3 text-base font-bold text-stone-900">No Hero Slides Configured</h3>
            <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
              Add your first homepage hero banner to welcome shoppers with high-impact visual luxury.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setEditingSlide("new")}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-5 py-2.5 text-xs font-bold text-[#7f2d22] shadow-sm hover:bg-[#f4e7e4] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Create First Slide</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {slides.map((slide, index) => {
              const isActive = slide.active !== false;
              const isDeleting = deleteConfirmId === String(slide.id);

              return (
                <div
                  key={String(slide.id)}
                  className={`group p-4 sm:p-5 transition hover:bg-stone-50/70 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
                    !isActive ? "opacity-75 bg-stone-50/30" : ""
                  }`}
                >
                  {/* Left: Position + Media Preview + Details */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    {/* Position Controls */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-xs font-extrabold text-stone-700 font-mono">
                        #{index + 1}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0}
                          title="Move up"
                          className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200 disabled:opacity-20 transition cursor-pointer"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, "down")}
                          disabled={index === slides.length - 1}
                          title="Move down"
                          className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200 disabled:opacity-20 transition cursor-pointer"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Media Thumbnail */}
                    <div className="relative aspect-video w-28 sm:w-36 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.image}
                        alt={slide.imageAlt || slide.title}
                        className="h-full w-full object-cover"
                      />
                      {slide.mobileImage && (
                        <span
                          title="Has dedicated mobile banner"
                          className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded bg-black/75 px-1 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs"
                        >
                          <Smartphone className="h-2.5 w-2.5" />
                          1:1
                        </span>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 truncate font-sans">
                          {slide.title}
                        </h3>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-stone-100 text-stone-600 border-stone-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-stone-400"
                            }`}
                          />
                          {isActive ? "Live on Store" : "Hidden"}
                        </span>
                      </div>

                      {slide.subtitle && (
                        <p className="text-xs text-stone-500 truncate max-w-md">
                          {slide.subtitle}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-stone-500">
                        {slide.cta && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 font-medium text-stone-700">
                            CTA: <strong className="text-stone-900">{slide.cta}</strong>
                          </span>
                        )}
                        {slide.ctaLink && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-stone-400 truncate max-w-[200px]">
                            {slide.ctaLink}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t border-stone-100 lg:border-t-0">
                    {/* Toggle Active Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(slide)}
                      title={isActive ? "Hide from homepage" : "Make live on homepage"}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                          : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-stone-500" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Publish</span>
                        </>
                      )}
                    </button>

                    {/* Edit Slide Button */}
                    <button
                      type="button"
                      onClick={() => setEditingSlide(slide)}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-3.5 py-1.5 text-xs font-bold text-[#7f2d22] shadow-2xs hover:bg-[#f4e7e4] hover:border-[#7f2016] hover:text-[#5c160f] transition cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Slide Button */}
                    {isDeleting ? (
                      <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                        <button
                          type="button"
                          onClick={() => handleDelete(String(slide.id))}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700 transition cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-stone-600 border border-stone-200 hover:bg-stone-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(String(slide.id))}
                        title="Delete slide"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Slide Create / Edit Modal Dialog ── */}
      {editingSlide && (
        <SlideEditorModal
          slide={editingSlide === "new" ? null : editingSlide}
          categories={categories}
          nextSortOrder={slides.length}
          onClose={() => setEditingSlide(null)}
        />
      )}
    </div>
  );
}

function SlideEditorModal({
  slide,
  categories,
  nextSortOrder,
  onClose,
}: {
  slide: HeroSlideRecord | null;
  categories: CategoryRecord[];
  nextSortOrder: number;
  onClose: () => void;
}) {
  const isEditing = Boolean(slide);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 font-sans">
                {isEditing ? "Edit Hero Slide" : "Add New Hero Slide"}
              </h2>
              <p className="text-xs text-stone-500">
                {isEditing ? `Modifying: ${slide?.title}` : "Upload media and define call-to-action"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form action={saveHeroSlideAction} className="p-6 space-y-5">
          {isEditing && <input type="hidden" name="id" value={String(slide?.id)} />}

          {/* Title & Subtitle */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="slide-title"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700"
              >
                Slide Title <span className="text-red-500">*</span>
              </label>
              <input
                id="slide-title"
                name="title"
                type="text"
                required
                defaultValue={slide?.title || ""}
                placeholder="e.g. ETHNIC WEAR or FESTIVE 2026"
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/20"
              />
            </div>

            <div>
              <label
                htmlFor="slide-subtitle"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700"
              >
                Subtitle / Tagline
              </label>
              <input
                id="slide-subtitle"
                name="subtitle"
                type="text"
                defaultValue={slide?.subtitle || ""}
                placeholder="e.g. Everyday Elegance"
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/20"
              />
            </div>
          </div>

          {/* Media Section: Desktop & Mobile */}
          <div className="space-y-4 rounded-xl border border-stone-200/90 bg-stone-50/50 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5 text-[#9c5247]" />
              Banner Media Assets
            </h3>

            {/* Desktop Banner */}
            <div>
              <MediaUpload
                name="image"
                label="Desktop Banner Image (16:9 or 21:9 ratio) *"
                defaultValue={slide?.image || ""}
                folder="khadeeja/hero"
                aspectClassName="aspect-video"
                fit="cover"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                Recommended 1920×1080px. High resolution full-width banner for laptops and desktops.
              </p>
            </div>

            {/* Mobile Banner (Optional) */}
            <div className="pt-3 border-t border-stone-200">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Smartphone className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-xs font-semibold text-stone-700">
                  Mobile Banner Image (Optional)
                </span>
              </div>
              <MediaUpload
                name="mobileImage"
                label="Mobile 1:1 Square Image"
                defaultValue={slide?.mobileImage || ""}
                folder="khadeeja/hero"
                aspectClassName="aspect-square"
                fit="cover"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                Recommended 1080×1080px (1:1 square). If left empty, the desktop image will be shown on phones too.
              </p>
            </div>

            {/* Image Alt */}
            <div>
              <label
                htmlFor="slide-imageAlt"
                className="block text-xs font-semibold text-stone-600"
              >
                Image Alt Text (Accessibility & SEO)
              </label>
              <input
                id="slide-imageAlt"
                name="imageAlt"
                type="text"
                defaultValue={slide?.imageAlt || ""}
                placeholder="Describe image for screen readers & Google SEO"
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#9c5247] focus:ring-1 focus:ring-[#9c5247]/20"
              />
            </div>
          </div>

          {/* Call to Action (CTA) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Call to Action Button
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="slide-cta"
                  className="block text-xs font-semibold text-stone-600"
                >
                  Button Label
                </label>
                <input
                  id="slide-cta"
                  name="cta"
                  type="text"
                  defaultValue={slide?.cta || "Explore"}
                  placeholder="e.g. Explore or Shop Collection"
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-900 outline-none focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="slide-ctaLink"
                  className="block text-xs font-semibold text-stone-600"
                >
                  Button Link Target
                </label>
                <input
                  id="slide-ctaLink"
                  name="ctaLink"
                  type="text"
                  defaultValue={slide?.ctaLink || "/products"}
                  placeholder="e.g. /collections/short-kurtis or /products"
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-900 font-mono outline-none focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/20"
                />
              </div>
            </div>

            {/* Quick Category Link Chips */}
            {categories.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] font-medium text-stone-400 block mb-1.5">
                  Quick link suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("slide-ctaLink") as HTMLInputElement;
                      if (input) input.value = "/products";
                    }}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                  >
                    All Products (/products)
                  </button>
                  {categories.slice(0, 5).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const input = document.getElementById("slide-ctaLink") as HTMLInputElement;
                        if (input) input.value = `/collections/${cat.slug}`;
                      }}
                      className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                    >
                      {cat.name} (/collections/{cat.slug})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Visibility & Sort Order */}
          <div className="flex items-center justify-between border-t border-stone-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="active"
                defaultChecked={slide ? slide.active !== false : true}
                className="h-4 w-4 rounded accent-[#9c5247]"
              />
              <span className="text-xs font-bold text-stone-800">
                Active & Live on Storefront
              </span>
            </label>

            <div className="flex items-center gap-2">
              <label htmlFor="slide-sort" className="text-xs font-semibold text-stone-600">
                Order:
              </label>
              <input
                id="slide-sort"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={slide?.sortOrder ?? nextSortOrder}
                className="w-16 rounded-lg border border-stone-300 px-2 py-1 text-xs text-stone-900 text-center font-mono"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-5 py-2 text-xs font-bold text-[#7f2d22] shadow-sm hover:bg-[#f4e7e4] hover:border-[#7f2016] hover:text-[#5c160f] transition active:scale-95 cursor-pointer"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>{isEditing ? "Save Changes" : "Create Slide"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
