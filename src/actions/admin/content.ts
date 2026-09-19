"use server";

import {
  announcementMutationSchema,
  faqMutationSchema,
  heroSlideMutationSchema,
  instagramPostMutationSchema,
  reorderMutationSchema,
  testimonialMutationSchema,
} from "@/lib/admin/schemas";
import { ValidationError } from "@/lib/admin/errors";
import { getDataProvider } from "@/lib/data";
import { adminMutation, finishFormAction, inputObject, noData, parseId } from "./common";

function recordId(raw: Record<string, unknown>, id?: string) {
  return id ?? (typeof raw.id === "string" && raw.id ? raw.id : undefined);
}

function reorderInput(input: unknown) {
  return reorderMutationSchema.parse(inputObject(input, { arrays: ["ids"] })).ids;
}

const homePaths = ["/admin", "/"];

async function saveHeroSlideMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, {
      booleans: ["active"], numbers: ["sortOrder"],
      nullable: ["subtitle", "imageAlt", "video", "cta", "ctaLink", "collectionSlug"],
    }) as Record<string, unknown>;
    const slideId = recordId(raw, id);
    const value = heroSlideMutationSchema.parse(raw);
    const provider = getDataProvider();
    if (!slideId && (await provider.listHeroSlides()).length >= 10) {
      throw new ValidationError("Maximum 10 slides are allowed for the hero section.");
    }
    return slideId ? provider.updateHeroSlide(parseId(slideId), value) : provider.createHeroSlide(value);
  }, [...homePaths, "/admin/hero-slides"]);
}

async function deleteHeroSlideMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteHeroSlide(parseId(id)), [...homePaths, "/admin/hero-slides"]));
}

async function toggleHeroSlideMutation(id: string, active: boolean) {
  return adminMutation(async () => getDataProvider().setHeroSlideActive(parseId(id), active), [...homePaths, "/admin/hero-slides"]);
}

async function reorderHeroSlidesMutation(input: unknown) {
  return adminMutation(async () => getDataProvider().reorderHeroSlides(reorderInput(input)), [...homePaths, "/admin/hero-slides"]);
}

async function saveInstagramPostMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, {
      booleans: ["active"], numbers: ["sortOrder"], arrays: ["hashtags"],
      nullable: ["caption", "hashtags", "shortCode", "sourceUrl", "type", "video", "timestamp"],
    }) as Record<string, unknown>;
    const postId = recordId(raw, id);
    const value = instagramPostMutationSchema.parse(raw);
    const provider = getDataProvider();
    return postId ? provider.updateInstagramPost(parseId(postId), value) : provider.createInstagramPost(value);
  }, [...homePaths, "/admin/instagram"]);
}

async function deleteInstagramPostMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteInstagramPost(parseId(id)), [...homePaths, "/admin/instagram"]));
}

async function toggleInstagramPostMutation(id: string, active: boolean) {
  return adminMutation(async () => getDataProvider().updateInstagramPost(parseId(id), { active }), [...homePaths, "/admin/instagram"]);
}

async function reorderInstagramPostsMutation(input: unknown) {
  return adminMutation(async () => getDataProvider().reorderInstagramPosts(reorderInput(input)), [...homePaths, "/admin/instagram"]);
}

async function saveTestimonialMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, {
      booleans: ["active"], numbers: ["sortOrder", "rating"],
      nullable: ["role"],
    }) as Record<string, unknown>;
    const testimonialId = recordId(raw, id);
    const value = testimonialMutationSchema.parse(raw);
    const provider = getDataProvider();
    return testimonialId ? provider.updateTestimonial(parseId(testimonialId), value) : provider.createTestimonial(value);
  }, [...homePaths, "/admin/home-reviews", "/admin/reviews"]);
}

async function deleteTestimonialMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteTestimonial(parseId(id)), [...homePaths, "/admin/home-reviews", "/admin/reviews"]));
}

async function saveAnnouncementMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, {
      booleans: ["active"], numbers: ["sortOrder"],
      nullable: ["startsAt", "endsAt"],
    }) as Record<string, unknown>;
    const announcementId = recordId(raw, id);
    const value = announcementMutationSchema.parse(raw);
    const provider = getDataProvider();
    return announcementId ? provider.updateAnnouncement(parseId(announcementId), value) : provider.createAnnouncement(value);
  }, [...homePaths, "/admin/announcements"]);
}

async function deleteAnnouncementMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteAnnouncement(parseId(id)), [...homePaths, "/admin/announcements"]));
}

async function reorderAnnouncementsMutation(input: unknown) {
  return adminMutation(async () => getDataProvider().reorderAnnouncements(reorderInput(input)), [...homePaths, "/admin/announcements"]);
}

async function saveFaqMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, {
      booleans: ["active"], numbers: ["sortOrder"], nullable: ["category"],
    }) as Record<string, unknown>;
    const faqId = recordId(raw, id);
    const value = faqMutationSchema.parse(raw);
    const provider = getDataProvider();
    return faqId ? provider.updateFaq(parseId(faqId), value) : provider.createFaq(value);
  }, [...homePaths, "/admin/settings/faqs", "/faqs"]);
}

async function deleteFaqMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteFaq(parseId(id)), [...homePaths, "/admin/settings/faqs", "/faqs"]));
}

async function reorderFaqsMutation(input: unknown) {
  return adminMutation(async () => {
    const ids = reorderInput(input);
    const provider = getDataProvider();
    return Promise.all(ids.map((id, sortOrder) => provider.updateFaq(id, { sortOrder })));
  }, [...homePaths, "/admin/settings/faqs", "/faqs"]);
}

function checkbox(formData: FormData, name: string) {
  if (!formData.has(name)) formData.set(name, "false");
}

function normalizeDate(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (value) formData.set(name, new Date(value).toISOString());
}

export async function saveHeroSlideAction(formData: FormData): Promise<void> {
  checkbox(formData, "active");
  await finishFormAction(saveHeroSlideMutation(formData));
}

export async function deleteHeroSlideAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteHeroSlideMutation(String(formData.get("id") ?? "")));
}

export async function saveInstagramPostAction(formData: FormData): Promise<void> {
  checkbox(formData, "active");
  await finishFormAction(saveInstagramPostMutation(formData));
}

export async function deleteInstagramPostAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteInstagramPostMutation(String(formData.get("id") ?? "")));
}

export async function saveTestimonialAction(formData: FormData): Promise<void> {
  checkbox(formData, "active");
  await finishFormAction(saveTestimonialMutation(formData));
}

export async function deleteTestimonialAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteTestimonialMutation(String(formData.get("id") ?? "")));
}

export async function saveAnnouncementAction(formData: FormData): Promise<void> {
  checkbox(formData, "active");
  normalizeDate(formData, "startsAt");
  normalizeDate(formData, "endsAt");
  await finishFormAction(saveAnnouncementMutation(formData));
}

export async function deleteAnnouncementAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteAnnouncementMutation(String(formData.get("id") ?? "")));
}

export async function saveFaqAction(formData: FormData): Promise<void> {
  checkbox(formData, "active");
  await finishFormAction(saveFaqMutation(formData));
}

export async function deleteFaqAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteFaqMutation(String(formData.get("id") ?? "")));
}

export async function toggleHeroSlideAction(formData: FormData): Promise<void> {
  await finishFormAction(toggleHeroSlideMutation(
    String(formData.get("id") ?? ""),
    String(formData.get("active") ?? "false") === "true"
  ));
}

export async function reorderHeroSlidesAction(formData: FormData): Promise<void> {
  await finishFormAction(reorderHeroSlidesMutation(formData));
}

export async function toggleInstagramPostAction(formData: FormData): Promise<void> {
  await finishFormAction(toggleInstagramPostMutation(
    String(formData.get("id") ?? ""),
    String(formData.get("active") ?? "false") === "true"
  ));
}

export async function reorderInstagramPostsAction(formData: FormData): Promise<void> {
  await finishFormAction(reorderInstagramPostsMutation(formData));
}

export async function reorderAnnouncementsAction(formData: FormData): Promise<void> {
  await finishFormAction(reorderAnnouncementsMutation(formData));
}

export async function reorderFaqsAction(formData: FormData): Promise<void> {
  await finishFormAction(reorderFaqsMutation(formData));
}
