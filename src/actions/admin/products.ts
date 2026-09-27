"use server";

import {
  productColorMutationSchema,
  productImageMutationSchema,
  productInformationMutationSchema,
  productMutationSchema,
  productVariantMutationSchema,
} from "@/lib/admin/schemas";
import { getDataProvider } from "@/lib/data";
import type { ProductMutationInput } from "@/lib/admin/types";
import { adminMutation, finishFormAction, inputObject, noData, parseId } from "./common";

const productOptions = {
  booleans: ["isPrototypeData", "active", "featured"],
  numbers: ["price", "oldPrice"],
  arrays: ["images", "sizes", "tags"],
  json: ["seo"],
  nullable: [
    "sku", "description", "shortDescription", "categoryId", "categorySlug", "collectionId",
    "collectionSlug", "images", "video", "hoverImage", "price", "oldPrice", "currency",
    "priceStatus", "sizes", "tags", "availability", "sourcePostId", "sourceUrl", "badge", "seo",
  ],
};
const paths = ["/admin/products", "/", "/shop"];

async function saveProductMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, productOptions) as Record<string, unknown>;
    const recordId = id ?? (typeof raw?.id === "string" && raw.id ? raw.id : undefined);
    
    // Automatically populate categorySlug/collectionSlug from categoryId/collectionId
    const provider = getDataProvider();
    if (raw.categoryId && String(raw.categoryId).trim() !== "") {
      const category = await provider.getCategory(String(raw.categoryId));
      if (category) {
        raw.categorySlug = category.slug;
      }
    } else {
      raw.categoryId = null;
      raw.categorySlug = null;
    }

    if (raw.collectionId && String(raw.collectionId).trim() !== "") {
      const collection = await provider.getCollection(String(raw.collectionId));
      if (collection) {
        raw.collectionSlug = collection.slug;
      }
    } else {
      raw.collectionId = null;
      raw.collectionSlug = null;
    }

    try {
      const parsed = productMutationSchema.parse(raw);
      const value = parsed as ProductMutationInput;
      return recordId ? provider.updateProduct(parseId(recordId), value) : provider.createProduct(value);
    } catch (err) {
      console.error("Zod Validation Failure in Product Form Save:", JSON.stringify(err, null, 2));
      throw err;
    }
  }, paths);
}

async function deleteProductMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteProduct(parseId(id)), paths));
}

async function toggleProductMutation(id: string, active: boolean) {
  return adminMutation(async () => getDataProvider().setProductActive(parseId(id), active), paths);
}

export async function saveProductAction(formData: FormData): Promise<void> {
  if (!formData.has("active")) formData.set("active", "false");
  if (!formData.has("featured")) formData.set("featured", "false");
  const images = String(formData.get("images") ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  formData.set("images", JSON.stringify(images));
  const seo = {
    title: String(formData.get("seoTitle") ?? "").trim() || null,
    description: String(formData.get("seoDescription") ?? "").trim() || null,
    keywords: String(formData.get("seoKeywords") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
  };
  formData.set("seo", JSON.stringify(seo));
  await finishFormAction(saveProductMutation(formData));
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteProductMutation(String(formData.get("id") ?? "")));
}

export async function toggleProductAction(formData: FormData): Promise<void> {
  await finishFormAction(toggleProductMutation(
    String(formData.get("id") ?? ""),
    String(formData.get("active") ?? "false") === "true"
  ));
}

async function saveProductColorMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, {
      booleans: ["active"], numbers: ["sortOrder"], nullable: ["productId", "hex", "sortOrder"],
    }) as Record<string, unknown>;
    const recordId = id ?? (typeof raw?.id === "string" && raw.id ? raw.id : undefined);
    const value = productColorMutationSchema.parse(raw);
    const provider = getDataProvider();
    return recordId ? provider.updateProductColor(parseId(recordId), value) : provider.createProductColor(value);
  }, paths);
}

async function deleteProductColorMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteProductColor(parseId(id)), paths));
}

async function saveProductVariantMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, {
      booleans: ["active"], numbers: ["price", "stock"],
      nullable: ["name", "sku", "size", "colorId", "price", "stock"],
    }) as Record<string, unknown>;
    const recordId = id ?? (typeof raw?.id === "string" && raw.id ? raw.id : undefined);
    const value = productVariantMutationSchema.parse(raw);
    const provider = getDataProvider();
    return recordId ? provider.updateProductVariant(parseId(recordId), value) : provider.createProductVariant(value);
  }, paths);
}

async function deleteProductVariantMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteProductVariant(parseId(id)), paths));
}

async function saveProductImageMutation(input: unknown, id?: string) {
  return adminMutation(async () => {
    const raw = inputObject(input, {
      booleans: ["isPrimary"], numbers: ["sortOrder"],
      nullable: ["altText", "type", "sortOrder", "isPrimary"],
    }) as Record<string, unknown>;
    const recordId = id ?? (typeof raw?.id === "string" && raw.id ? raw.id : undefined);
    const value = productImageMutationSchema.parse(raw);
    const provider = getDataProvider();
    return recordId ? provider.updateProductImage(parseId(recordId), value) : provider.createProductImage(value);
  }, paths);
}

async function deleteProductImageMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteProductImage(parseId(id)), paths));
}

async function saveProductInformationMutation(productId: string, input: unknown) {
  return adminMutation(async () => {
    const id = parseId(productId);
    const value = productInformationMutationSchema.parse(inputObject(input, {
      json: ["seo", "measurements"], nullable: ["details", "fabric", "care", "fit", "shipping", "seo", "measurements"],
    }));
    return getDataProvider().upsertProductInformation(id, value);
  }, [...paths, `/admin/products/${productId}/edit`]);
}

export async function saveProductColorAction(formData: FormData): Promise<void> {
  if (!formData.has("active")) formData.set("active", "false");
  await finishFormAction(saveProductColorMutation(formData));
}

export async function deleteProductColorAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteProductColorMutation(String(formData.get("id") ?? "")));
}

export async function saveProductVariantAction(formData: FormData): Promise<void> {
  if (!formData.has("active")) formData.set("active", "false");
  await finishFormAction(saveProductVariantMutation(formData));
}

export async function deleteProductVariantAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteProductVariantMutation(String(formData.get("id") ?? "")));
}

export async function saveProductImageAction(formData: FormData): Promise<void> {
  if (!formData.has("isPrimary")) formData.set("isPrimary", "false");
  await finishFormAction(saveProductImageMutation(formData));
}

export async function deleteProductImageAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteProductImageMutation(String(formData.get("id") ?? "")));
}

export async function saveProductInformationAction(formData: FormData): Promise<void> {
  await finishFormAction(saveProductInformationMutation(String(formData.get("productId") ?? ""), formData));
}
