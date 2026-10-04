"use server";

import { categoryMutationSchema } from "@/lib/admin/schemas";
import { getDataProvider } from "@/lib/data";
import { adminMutation, finishFormAction, inputObject, noData, parseId } from "./common";

const options = {
  booleans: ["active", "isFeatured"],
  numbers: ["sortOrder"],
  nullable: ["description", "image", "parentId"],
};

const paths = ["/admin/categories", "/", "/shop"];

async function saveCategoryMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, options) as Record<string, unknown>;
    const recordId = id ?? (typeof raw?.id === "string" && raw.id ? raw.id : undefined);
    const value = categoryMutationSchema.parse(raw);
    const provider = getDataProvider();

    if (value.isFeatured) {
      const allCategories = await provider.listCategories();
      const currentFeatured = allCategories.filter(
        (c) => Boolean(c.isFeatured) && (!recordId || c.id !== recordId)
      );
      if (currentFeatured.length >= 3) {
        throw new Error(
          "Maximum 3 categories hi navbar mein feature ho sakti hain. Pehle kisi category ko unfeature karein."
        );
      }
    }

    return recordId ? provider.updateCategory(parseId(recordId), value) : provider.createCategory(value);
  }, paths);
}

async function deleteCategoryMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteCategory(parseId(id)), paths));
}

async function toggleCategoryMutation(id: string, active: boolean) {
  return adminMutation(
    async () => getDataProvider().setCategoryActive(parseId(id), active),
    paths
  );
}

async function toggleCategoryFeaturedMutation(id: string, isFeatured: boolean) {
  return adminMutation(async () => {
    const provider = getDataProvider();
    if (isFeatured) {
      const allCategories = await provider.listCategories();
      const currentFeatured = allCategories.filter((c) => Boolean(c.isFeatured) && c.id !== id);
      if (currentFeatured.length >= 3) {
        throw new Error(
          "Maximum 3 categories hi navbar mein feature ho sakti hain. Pehle kisi category ko unfeature karein."
        );
      }
    }
    return provider.updateCategory(parseId(id), { isFeatured });
  }, paths);
}

export async function saveCategoryAction(formData: FormData): Promise<void> {
  if (!formData.has("active")) formData.set("active", "false");
  await finishFormAction(saveCategoryMutation(formData));
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteCategoryMutation(String(formData.get("id") ?? "")));
}

export async function toggleCategoryAction(formData: FormData): Promise<void> {
  await finishFormAction(toggleCategoryMutation(
    String(formData.get("id") ?? ""),
    String(formData.get("active") ?? "false") === "true"
  ));
}

export async function toggleCategoryFeaturedAction(formData: FormData): Promise<void> {
  await finishFormAction(toggleCategoryFeaturedMutation(
    String(formData.get("id") ?? ""),
    String(formData.get("isFeatured") ?? "false") === "true"
  ));
}
