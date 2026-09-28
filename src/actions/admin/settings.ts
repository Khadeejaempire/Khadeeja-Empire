"use server";

import {
  couponMutationSchema,
  discoveryMenuMutationSchema,
  profileMutationSchema,
  promoSettingsMutationSchema,
  reorderMutationSchema,
  settingsMutationSchema,
  shippingRateMutationSchema,
} from "@/lib/admin/schemas";
import { ValidationError } from "@/lib/admin/errors";
import { getDataProvider } from "@/lib/data";
import { adminMutation, finishFormAction, inputObject, noData, parseId } from "./common";

function recordId(raw: Record<string, unknown>, id?: string) {
  return id ?? (typeof raw.id === "string" && raw.id ? raw.id : undefined);
}

async function savePromoSettingsMutation(input: unknown) {
  return adminMutation(async () => {
    const value = promoSettingsMutationSchema.parse(inputObject(input, {
      booleans: ["enabled"], numbers: ["maxViews"],
      nullable: ["title", "body", "image", "ctaLabel", "ctaLink", "couponCode", "frequency", "maxViews", "endsAt"],
    }));
    return getDataProvider().updatePromoSettings(value);
  }, ["/admin/home-banner", "/"]);
}

async function saveCouponMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, {
      booleans: ["active"], numbers: ["discountValue", "minimumAmount", "maximumUses"],
      nullable: ["description", "minimumAmount", "maximumUses", "active", "startsAt", "endsAt"],
    }) as Record<string, unknown>;
    const couponId = recordId(raw, id);
    const value = couponMutationSchema.parse(raw);
    const provider = getDataProvider();
    return couponId ? provider.updateCoupon(parseId(couponId), value) : provider.createCoupon(value);
  }, ["/admin/settings/coupons", "/checkout"]);
}

async function deleteCouponMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteCoupon(parseId(id)), ["/admin/settings/coupons", "/checkout"]));
}

async function toggleCouponMutation(id: string, active: boolean) {
  return adminMutation(async () => getDataProvider().setCouponActive(parseId(id), active), ["/admin/settings/coupons", "/checkout"]);
}

async function saveShippingRateMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, {
      booleans: ["codAvailable", "active"], numbers: ["amount", "freeAbove"],
      nullable: ["freeAbove", "codAvailable", "active"],
    }) as Record<string, unknown>;
    const rateId = recordId(raw, id);
    const value = shippingRateMutationSchema.parse(raw);
    const provider = getDataProvider();
    return rateId ? provider.updateShippingRate(parseId(rateId), value) : provider.createShippingRate(value);
  }, ["/admin/settings/shipping", "/checkout", "/shipping-returns"]);
}

async function deleteShippingRateMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteShippingRate(parseId(id)), ["/admin/settings/shipping", "/checkout", "/shipping-returns"]));
}

async function saveProfileMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, { nullable: ["email", "fullName", "phone", "avatarUrl", "role"] }) as Record<string, unknown>;
    const profileId = recordId(raw, id);
    if (!profileId) throw new ValidationError("A profile ID is required.");
    const value = profileMutationSchema.parse(raw);
    const provider = getDataProvider();
    const parsedProfileId = parseId(profileId);
    return (await provider.getProfile(parsedProfileId))
      ? provider.updateProfile(parsedProfileId, value)
      : provider.createProfile({ id: parsedProfileId, ...value });
  }, ["/admin/settings/profile", "/admin"]);
}

const HERO_DESKTOP_IMAGE_KEY = "homepage.hero.desktopImage";
const HERO_MOBILE_IMAGE_KEY = "homepage.hero.mobileImage";

async function saveHeroImagesMutation(input: unknown) {
  return adminMutation(async () => {
    const raw = inputObject(input) as Record<string, unknown>;
    const desktopImage = typeof raw.desktopImage === "string" ? raw.desktopImage.trim() : "";
    const mobileImage = typeof raw.mobileImage === "string" ? raw.mobileImage.trim() : "";
    const provider = getDataProvider();
    await provider.upsertSetting(HERO_DESKTOP_IMAGE_KEY, desktopImage || null, "Homepage hero image (desktop).");
    await provider.upsertSetting(HERO_MOBILE_IMAGE_KEY, mobileImage || null, "Homepage hero image (mobile).");
  }, ["/admin/hero-images", "/"]);
}

async function saveSettingMutation(input: unknown) {
  return adminMutation(async () => {
    const value = settingsMutationSchema.parse(inputObject(input, {
      json: ["value"], nullable: ["description"],
    }));
    return getDataProvider().upsertSetting(value.key, value.value, value.description);
  }, ["/admin", "/"]);
}

async function deleteSettingMutation(key: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteSetting(settingsMutationSchema.shape.key.parse(key)), ["/admin", "/"]));
}

async function saveDiscoveryMenuEntryMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, {
      booleans: ["active"], numbers: ["sortOrder"], nullable: ["categoryId", "active", "sortOrder"],
    }) as Record<string, unknown>;
    const entryId = recordId(raw, id);
    const value = discoveryMenuMutationSchema.parse(raw);
    const provider = getDataProvider();
    return entryId ? provider.updateDiscoveryMenuEntry(parseId(entryId), value) : provider.createDiscoveryMenuEntry(value);
  }, ["/admin/categories", "/"]);
}

async function deleteDiscoveryMenuEntryMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteDiscoveryMenuEntry(parseId(id)), ["/admin/categories", "/"]));
}

async function reorderDiscoveryMenuEntriesMutation(input: unknown) {
  return adminMutation(async () => {
    const { ids } = reorderMutationSchema.parse(inputObject(input, { arrays: ["ids"] }));
    return getDataProvider().reorderDiscoveryMenuEntries(ids);
  }, ["/admin/categories", "/"]);
}

function checkbox(formData: FormData, name: string) {
  if (!formData.has(name)) formData.set(name, "false");
}

export async function savePromoSettingsAction(formData: FormData): Promise<void> {
  checkbox(formData, "enabled");
  await finishFormAction(savePromoSettingsMutation(formData));
}

export async function saveCouponAction(formData: FormData): Promise<void> {
  checkbox(formData, "active");
  await finishFormAction(saveCouponMutation(formData));
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteCouponMutation(String(formData.get("id") ?? "")));
}

export async function saveShippingRateAction(formData: FormData): Promise<void> {
  checkbox(formData, "codAvailable");
  checkbox(formData, "active");
  await finishFormAction(saveShippingRateMutation(formData));
}

export async function deleteShippingRateAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteShippingRateMutation(String(formData.get("id") ?? "")));
}

export async function saveProfileAction(formData: FormData): Promise<void> {
  await finishFormAction(saveProfileMutation(formData));
}

export async function toggleCouponAction(formData: FormData): Promise<void> {
  await finishFormAction(toggleCouponMutation(
    String(formData.get("id") ?? ""),
    String(formData.get("active") ?? "false") === "true"
  ));
}

export async function saveHeroImagesAction(formData: FormData): Promise<void> {
  await finishFormAction(saveHeroImagesMutation(formData));
}

export async function saveSettingAction(formData: FormData): Promise<void> {
  await finishFormAction(saveSettingMutation(formData));
}

export async function deleteSettingAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteSettingMutation(String(formData.get("key") ?? "")));
}

export async function saveDiscoveryMenuEntryAction(formData: FormData): Promise<void> {
  checkbox(formData, "active");
  await finishFormAction(saveDiscoveryMenuEntryMutation(formData));
}

export async function deleteDiscoveryMenuEntryAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteDiscoveryMenuEntryMutation(String(formData.get("id") ?? "")));
}

export async function reorderDiscoveryMenuEntriesAction(formData: FormData): Promise<void> {
  await finishFormAction(reorderDiscoveryMenuEntriesMutation(formData));
}
