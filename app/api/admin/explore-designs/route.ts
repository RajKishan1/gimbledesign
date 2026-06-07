import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/require-admin";

const VALID_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/** GET — list all explore designs (for admin management UI). */
export async function GET() {
  const gate = await requireAdmin();
  if (gate instanceof NextResponse) return gate;

  const designs = await prisma.exploreDesign.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: designs });
}

/**
 * POST — upload a new explore design.
 *
 * Body (multipart/form-data):
 *   image    — File (required)
 *   title    — string (required)
 *   link     — string (optional)
 *   category — "mobile" | "web" (defaults to "mobile")
 *
 * For very large uploads, swap this for signed direct browser-to-Cloudinary
 * uploads (cloudinary.utils.api_sign_request) — the request body limit on
 * serverless platforms makes server-side relaying flaky past ~10MB.
 */
export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (gate instanceof NextResponse) return gate;

  try {
    const form = await request.formData();
    const file = form.get("image") as File | null;
    const title = (form.get("title") as string | null)?.trim() ?? "";
    const link = (form.get("link") as string | null)?.trim() || null;
    const categoryInput = form.get("category") as string | null;
    const category = categoryInput === "web" ? "web" : "mobile";

    if (!file) {
      return NextResponse.json(
        { error: "Missing image file" },
        { status: 400 },
      );
    }
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }
    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 10MB." },
        { status: 400 },
      );
    }

    // Convert the File to a base64 data URL for the Cloudinary SDK.
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploaded = await cloudinary.uploader.upload(base64, {
      folder: "explore-designs",
      resource_type: "image",
    });

    const design = await prisma.exploreDesign.create({
      data: {
        title,
        imageUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
        link,
        category,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
      },
    });

    return NextResponse.json({ data: design });
  } catch (err) {
    console.error("[admin/explore-designs POST]", err);
    return NextResponse.json(
      { error: "Failed to upload design" },
      { status: 500 },
    );
  }
}
