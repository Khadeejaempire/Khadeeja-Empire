"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { getDataProvider } from "@/lib/data";
import { reviewMutationSchema } from "@/lib/admin/schemas";
import {
  createCloudinaryUploadSignature,
  getCloudinaryServerConfig,
} from "@/lib/cloudinary/signature";

const ALLOWED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"];
const ALLOWED_VIDEO_FORMATS = ["mp4", "webm", "mov"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function uploadReviewMediaAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Please log in to upload photos or videos." };
  }

  const file = formData.get("file") as File | null;
  if (!file || typeof file.size !== "number" || file.size <= 0) {
    return { error: "No file was selected for upload." };
  }

  const extension = (file.name.split(".").pop() || "").toLowerCase();
  const isVideo = file.type.startsWith("video/") || ALLOWED_VIDEO_FORMATS.includes(extension);
  const resourceType = isVideo ? "video" : "image";

  if (isVideo) {
    if (!ALLOWED_VIDEO_FORMATS.includes(extension)) {
      return { error: "Videos must be MP4, WebM, or MOV format." };
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return { error: "Video file size cannot exceed 100MB." };
    }
  } else {
    if (!ALLOWED_IMAGE_FORMATS.includes(extension)) {
      return { error: "Images must be JPG, PNG, WebP, or AVIF format." };
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return { error: "Image file size cannot exceed 10MB." };
    }
  }

  // 1. Try uploading to Cloudinary if server configuration is present
  const hasCloudinary =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  if (hasCloudinary) {
    try {
      const config = getCloudinaryServerConfig();
      const signature = await createCloudinaryUploadSignature(
        {
          folder: "khadeeja/content",
          resourceType,
          format: extension as "jpg" | "jpeg" | "png" | "webp" | "avif" | "mp4" | "webm" | "mov",
          fileSize: file.size,
        },
        config
      );

      const payload = new FormData();
      payload.set("file", file);
      payload.set("api_key", signature.api_key);
      payload.set("timestamp", String(signature.timestamp));
      payload.set("folder", signature.folder);
      payload.set("signature", signature.signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloud_name)}/${resourceType}/upload`,
        { method: "POST", body: payload }
      );

      const result = (await response.json()) as { secure_url?: string; error?: { message?: string } };
      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || "Cloudinary upload failed.");
      }

      return { url: result.secure_url, resourceType };
    } catch {
      // Fallback to local storage if Cloudinary network or quota fails
    }
  }

  // 2. Local fallback storage (public/assets/reviews/) for seamless local dev & staging
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const targetDir = path.resolve(process.cwd(), "public", "assets", "reviews");
    await mkdir(targetDir, { recursive: true });
    const cleanBase = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFilename = `${Date.now()}-${cleanBase}`;
    const filePath = path.resolve(targetDir, uniqueFilename);
    await writeFile(filePath, buffer);

    return { url: `/assets/reviews/${uniqueFilename}`, resourceType };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to store uploaded file." };
  }
}

export async function submitReview(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Please log in to write a review." };
  }

  const productId = String(formData.get("productId") || "");
  const productSlug = String(formData.get("productSlug") || "");
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const photoUrl = String(formData.get("photoUrl") || "").trim() || null;
  const videoUrl = String(formData.get("videoUrl") || "").trim() || null;

  if (!productId) {
    return { error: "Missing product." };
  }

  const dataProvider = getDataProvider();
  const customers = await dataProvider.listCustomers({ search: user.email });
  const customer = customers.find((c) => c.email === user.email);

  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) || "";
  const authorName = customer?.name || fullName || user.email.split("@")[0];

  const parsed = reviewMutationSchema.safeParse({
    productId,
    customerId: customer?.id ?? null,
    authorName,
    authorEmail: user.email,
    rating,
    title: title || null,
    body,
    photoUrl,
    videoUrl,
    status: "pending",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check your review and try again." };
  }

  try {
    await dataProvider.createReview(parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit review." };
  }

  if (productSlug) revalidatePath(`/products/${productSlug}`);
  return { success: "Thanks! Your review has been submitted and will appear once approved." };
}
