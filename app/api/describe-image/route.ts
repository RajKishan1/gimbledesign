import { NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";
import { generateText } from "ai";

const GPT_VISION_MODEL = "openai/gpt-5.4-mini";

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
      maxOutputTokens: 1600,
      messages: [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: `You are extracting a design spec from a reference image so a UI generator can faithfully reuse its layout. Be precise and structural, not poetic.

IF THIS IS A UI/APP/WEB DESIGN SCREENSHOT, output this spec:

1. TYPE: platform (mobile app / web app / component) and what screen it is (e.g. "fitness dashboard home screen").
2. LAYOUT STRUCTURE (most important — describe top to bottom, in order):
   - Every section in vertical order with its layout: e.g. "status bar → header with avatar left + bell right → full-width hero card with large metric → 2-column grid of 2 stat cards → horizontal scroll row of 4 chips → list of 3 rows → floating bottom nav with 5 icons".
   - Grid arrangements: exact column counts and any cards that span wider.
   - Navigation: type (bottom tab bar / sidebar / top tabs), item count, icon+label or icon-only, active item, floating vs full-width.
3. COMPONENT INVENTORY: each distinct component with its key traits (card with big numeral + sparkline; progress ring; segmented control with N options; list row = avatar + title + trailing value).
4. VISIBLE CONTENT: real labels, headings, numbers, and button text exactly as shown — these anchor the recreation.
5. STYLE SIGNALS: corner radius (sharp/rounded/very rounded), shadow depth, border usage, spacing density (compact/comfortable/airy), light or dark, dominant palette with approximate hex values, accent color and WHERE it is used, typography weight/casing patterns (e.g. all-caps micro-labels, black-weight numerals).
6. MOOD: 3-5 adjectives (e.g. "premium fintech, high-contrast, data-dense").

IF IT IS NOT A UI DESIGN (photo, illustration, logo, moodboard), instead describe: the subject, composition, color palette with hex approximations, textures, typography if any, and the aesthetic mood — framed as inspiration signals a designer could apply to an interface.

Output plain prose/bullets, no markdown headers, under 400 words.`,
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
