import "server-only";

import { realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import {
  createLocalMediaResult,
  resolveLocalAssetUrl,
  type CloudinaryResourceType,
  type LocalMediaResult,
} from "./upload";

const PUBLIC_ASSETS_DIRECTORY = resolve(process.cwd(), "public", "assets");

function localAssetFilePath(value: unknown, origin?: string): { url: string; path: string } | null {
  const url = resolveLocalAssetUrl(value, origin);
  if (!url) return null;

  try {
    const parsed = new URL(url, origin ?? "https://local-assets.invalid");
    if (parsed.search || parsed.hash) return null;
    const decodedPath = decodeURIComponent(parsed.pathname);
    if (!decodedPath.startsWith("/assets/")) return null;

    const assetPath = resolve(PUBLIC_ASSETS_DIRECTORY, decodedPath.slice("/assets/".length));
    const relativePath = relative(PUBLIC_ASSETS_DIRECTORY, assetPath);
    if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) return null;
    return { url, path: assetPath };
  } catch {
    return null;
  }
}

export async function resolveExistingLocalAssetUrl(
  value: unknown,
  origin?: string
): Promise<string | null> {
  const candidate = localAssetFilePath(value, origin);
  if (!candidate) return null;

  try {
    const [assetsRoot, filePath] = await Promise.all([
      realpath(PUBLIC_ASSETS_DIRECTORY),
      realpath(/*turbopackIgnore: true*/ candidate.path),
    ]);
    const relativePath = relative(assetsRoot, filePath);
    if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) return null;
    return (await stat(filePath)).isFile() ? candidate.url : null;
  } catch {
    return null;
  }
}

export async function createExistingLocalMediaResult(
  value: unknown,
  resourceType: CloudinaryResourceType,
  origin?: string
): Promise<LocalMediaResult | null> {
  const url = await resolveExistingLocalAssetUrl(value, origin);
  return url ? createLocalMediaResult(url, resourceType, origin) : null;
}
