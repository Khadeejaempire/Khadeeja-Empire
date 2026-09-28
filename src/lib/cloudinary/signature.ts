import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import { ConfigurationError } from "../admin/errors";

const CLOUDINARY_FOLDERS = [
  "products",
  "hero",
  "content",
  "instagram",
  "khadeeja/products",
  "khadeeja/hero",
  "khadeeja/content",
  "khadeeja/instagram",
  "khadeeja/categories",
] as const;

export const CLOUDINARY_ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "mp4",
  "webm",
  "mov",
  "pdf",
] as const;

export const CLOUDINARY_MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  raw: 25 * 1024 * 1024,
} as const;

const cloudinaryUploadBaseSchema = z
  .object({
    folder: z.enum(CLOUDINARY_FOLDERS),
    resourceType: z.enum(["image", "video", "raw"]),
    format: z.enum(CLOUDINARY_ALLOWED_FORMATS).optional(),
    fileSize: z.number().int().positive().max(Math.max(...Object.values(CLOUDINARY_MAX_FILE_SIZE))).optional(),
    localUrl: z.string().min(1).max(2048).optional(),
  })
  .strict();

const formatsByResourceType: Record<CloudinaryUploadRequest["resourceType"], readonly string[]> = {
  image: ["jpg", "jpeg", "png", "webp", "avif"],
  video: ["mp4", "webm", "mov"],
  raw: ["pdf"],
};

function addUploadMetadataIssues(
  value: z.infer<typeof cloudinaryUploadBaseSchema>,
  context: z.RefinementCtx
) {
  if (value.format && !formatsByResourceType[value.resourceType].includes(value.format)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["format"],
      message: `The ${value.format} format is not allowed for ${value.resourceType} uploads.`,
    });
  }
  if (
    value.fileSize !== undefined &&
    value.fileSize > CLOUDINARY_MAX_FILE_SIZE[value.resourceType]
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fileSize"],
      message: `The ${value.resourceType} upload exceeds its size limit.`,
    });
  }
}

export const mediaUploadRequestSchema = cloudinaryUploadBaseSchema.superRefine(
  addUploadMetadataIssues
);

export const cloudinaryUploadRequestSchema = cloudinaryUploadBaseSchema
  .omit({ localUrl: true })
  .extend({
    format: z.enum(CLOUDINARY_ALLOWED_FORMATS),
    fileSize: z
      .number()
      .int()
      .positive()
      .max(Math.max(...Object.values(CLOUDINARY_MAX_FILE_SIZE))),
  })
  .superRefine(addUploadMetadataIssues);

export type CloudinaryUploadRequest = z.infer<typeof cloudinaryUploadRequestSchema>;

export interface CloudinaryServerConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface CloudinaryUploadSignature {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  signature: string;
}

type CloudinaryEnv = Record<string, string | undefined>;

function requiredValue(env: CloudinaryEnv, name: string): string {
  const value = env[name]?.trim();
  if (
    !value ||
    /^your[-_]/i.test(value) ||
    /^replace[-_]?me$/i.test(value) ||
    /^change[-_]?me$/i.test(value) ||
    /^\$\{[^}]+\}$/.test(value)
  ) {
    throw new ConfigurationError(`Missing required Cloudinary configuration: ${name}.`);
  }
  return value;
}

export function getCloudinaryServerConfig(
  env: CloudinaryEnv = process.env
): CloudinaryServerConfig {
  return {
    cloudName: requiredValue(env, "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
    apiKey: requiredValue(env, "NEXT_PUBLIC_CLOUDINARY_API_KEY"),
    apiSecret: requiredValue(env, "CLOUDINARY_API_SECRET"),
  };
}

function cloudinaryStringToSign(params: Record<string, string | number>): string {
  return Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${String(value).replace(/&/g, "%26")}`)
    .join("&");
}

export async function createCloudinaryUploadSignature(
  input: CloudinaryUploadRequest,
  config: CloudinaryServerConfig,
  timestamp = Math.floor(Date.now() / 1000)
): Promise<CloudinaryUploadSignature> {
  const validated = cloudinaryUploadRequestSchema.parse(input);
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) {
    throw new Error("Cloudinary timestamp must be a positive integer.");
  }
  const toSign = cloudinaryStringToSign({ timestamp, folder: validated.folder });
  const signature = createHash("sha1")
    .update(`${toSign}${config.apiSecret}`, "utf8")
    .digest("hex");

  return {
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    timestamp,
    folder: validated.folder,
    signature,
  };
}
