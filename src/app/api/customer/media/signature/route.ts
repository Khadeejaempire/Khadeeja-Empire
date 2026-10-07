import { NextResponse } from "next/server";
import { ConfigurationError } from "@/lib/admin/errors";
import { getCurrentCustomer } from "@/lib/auth/customer";
import {
  cloudinaryUploadRequestSchema,
  getCloudinaryServerConfig,
  mediaUploadRequestSchema,
  createCloudinaryUploadSignature,
} from "@/lib/cloudinary/signature";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await getCurrentCustomer())) {
    return NextResponse.json({ error: "Please log in to upload media." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid media request." }, { status: 400 });
  }

  const parsed = mediaUploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "The media folder, format, resource type, and size are invalid." },
      { status: 400 }
    );
  }

  const cloudinaryInput = cloudinaryUploadRequestSchema.safeParse(parsed.data);
  if (!cloudinaryInput.success) {
    return NextResponse.json(
      { error: "Cloudinary uploads require an allowed format and file size." },
      { status: 400 }
    );
  }

  try {
    const signature = await createCloudinaryUploadSignature(
      cloudinaryInput.data,
      getCloudinaryServerConfig()
    );
    return NextResponse.json(signature);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return NextResponse.json(
        { error: "Cloudinary is not configured on this server." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Could not prepare upload signature." }, { status: 500 });
  }
}
