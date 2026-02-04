import { NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";
import { generateText } from "ai";

/** GPT vision model for image description (OpenRouter) */
const GPT_VISION_MODEL = "openai/gpt-4o";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.",
        },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const { text: description } = await generateText({
      model: openrouter.chat(GPT_VISION_MODEL),
      maxOutputTokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe what is in this image in detail. Include the main subject, setting, colors, style, and any text or notable elements.",
            },
            {
              type: "image",
              image: dataUrl,
              mediaType: file.type,
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      success: true,
      description: description?.trim() ?? "Could not describe image.",
    });
  } catch (error) {
    console.error("describe-image error:", error);
    return NextResponse.json(
      { error: "Failed to describe image" },
      { status: 500 }
    );
  }
}
