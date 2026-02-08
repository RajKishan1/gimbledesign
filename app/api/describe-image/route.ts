import { NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";
import { generateText } from "ai";

const GPT_VISION_MODEL = "openai/gpt-4o";

const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let dataUrl: string;
    let mimeType: string;

    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      const imageBase64 = body.imageBase64 ?? body.image;
      const type = body.mimeType ?? body.type ?? "image/png";
      if (!imageBase64 || typeof imageBase64 !== "string") {
        return NextResponse.json(
          { error: "No image provided (expect imageBase64)" },
          { status: 400 }
        );
      }
      if (!VALID_IMAGE_TYPES.includes(type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed." },
          { status: 400 }
        );
      }
      mimeType = type;
      dataUrl = `data:${mimeType};base64,${String(imageBase64).replace(/^data:image\/\w+;base64,/, "")}`;
    } else {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "No image provided" },
          { status: 400 }
        );
      }
      if (!VALID_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed." },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 10MB." },
          { status: 400 }
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      mimeType = file.type;
      dataUrl = `data:${mimeType};base64,${base64}`;
    }

    const result = await generateText({
      model: openrouter.chat(GPT_VISION_MODEL),
      maxOutputTokens: 1024,
      messages: [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: "Describe what is in this image in detail. Include the main subject, setting, colors, style, and any text or notable elements.",
            },
            {
              type: "image" as const,
              image: dataUrl,
              mediaType: mimeType,
            },
          ],
        },
      ],
    });

    const description = result.text?.trim() ?? "Could not describe image.";
    return NextResponse.json({
      success: true,
      description,
    });
  } catch (error) {
    console.error("describe-image error:", error);
    return NextResponse.json(
      { error: "Failed to describe image" },
      { status: 500 }
    );
  }
}
