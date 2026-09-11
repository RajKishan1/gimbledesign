import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { llm, generateStructured } from "@/lib/llm";

// AI-predicted attention heatmap: a vision model estimates where users will
// look and tap first on a screen. Client-side rendering turns the regions
// into gradient blobs over the frame.

const VISION_MODEL = "google:gemini@3.5-flash";

const HeatmapSchema = z.object({
  regions: z
    .array(
      z.object({
        x: z.number().min(0).max(100).describe("Left edge, % of screen width"),
        y: z.number().min(0).max(100).describe("Top edge, % of screen height"),
        width: z.number().min(1).max(100).describe("% of screen width"),
        height: z.number().min(1).max(100).describe("% of screen height"),
        intensity: z
          .number()
          .min(0)
          .max(1)
          .describe("Predicted attention, 1 = strongest"),
        label: z.string().describe("What the region is, 2-4 words"),
      }),
    )
    .min(3)
    .max(10),
});

export async function POST(request: Request) {
  try {
    const session = await getSession(await headers());
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageBase64, mimeType = "image/png" } = await request.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 },
      );
    }

    const { object } = await generateStructured({
      model: llm.chat(VISION_MODEL),
      schema: HeatmapSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a UX attention-prediction expert. Analyze this UI screen and predict where users' visual attention will concentrate in the first seconds of viewing, based on established saliency principles: F/Z scanning patterns, visual hierarchy, contrast, faces, large numerals, primary CTAs, and motion cues.

Return 4-8 attention regions covering the strongest hotspots, each with position/size as percentages of the screen and an intensity from 0 (weak) to 1 (dominant focal point). Regions should be tight around their target elements, not huge sweeping areas. The highest-intensity region should be the single most eye-catching element.`,
            },
            {
              type: "image",
              image: `data:${mimeType};base64,${imageBase64}`,
            },
          ],
        },
      ],
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("Heatmap prediction failed:", error);
    return NextResponse.json(
      { error: "Failed to predict heatmap" },
      { status: 500 },
    );
  }
}
