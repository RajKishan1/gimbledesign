import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { generateProjectName } from "@/app/action/action";
import { inngest } from "@/inngest/client";
import { describeImageFromBuffer } from "@/lib/describe-image-server";
import { getImageDimensions } from "@/lib/get-image-dimensions";
import { PRESETS } from "@/lib/infer-design-dimensions";
import { getGenerationModel } from "@/constant/models";

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
    const session = await getSession(await headers());
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const promptInput = formData.get("prompt") as string | null;
    const prompt = typeof promptInput === "string" ? promptInput.trim() : "";
    const modelInput = formData.get("model") as string | null;
    const model = modelInput
      ? getGenerationModel(modelInput)
      : getGenerationModel("auto");
    const inspirationKindInput = formData.get("inspirationKind") as
      | string
      | null;
    const inspirationKind =
      inspirationKindInput === "mobile" ? "mobile" : "web";

    if (!imageFile && !prompt) {
      return NextResponse.json(
        { error: "Provide at least an image or a prompt (or both)." },
        { status: 400 }
      );
    }

    let combinedPrompt: string;
    let imageDescription: string | undefined;
    let imageDimensions: { width: number; height: number } | undefined;

    if (imageFile && imageFile.size > 0) {
      if (!VALID_IMAGE_TYPES.includes(imageFile.type)) {
        return NextResponse.json(
          { error: "Invalid image type. Use JPEG, PNG, GIF, or WebP." },
          { status: 400 }
        );
      }
      if (imageFile.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "Image too large. Maximum size is 10MB." },
          { status: 400 }
        );
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const [desc, dims] = await Promise.all([
        describeImageFromBuffer(buffer, imageFile.type),
        Promise.resolve(getImageDimensions(buffer)),
      ]);
      imageDescription = desc;
      imageDimensions = dims;

      combinedPrompt = `Re-design this exact design for inspiration. Keep the SAME content and context—only change the visual style across four variations.

Reference design (from image):
${imageDescription}

Rules: Generate ONLY what the reference shows (e.g. if it is a component like a calendar or a card grid, generate only that component, not a full app screen). Four variations = same type of content, four different layouts/visual treatments. Preserve the design's scope (component vs full screen) from the description.${
        prompt ? `\n\nAdditional context from user: ${prompt}` : ""
      }`;
    } else {
      combinedPrompt = `Generate four design variations for inspiration. Same concept, four different visual styles.

CRITICAL - Generate EXACTLY what the user asked for:
- If the user asks for a "calendar", generate only a calendar component (not a full app with a calendar inside).
- If the user asks for "pricing cards", generate only the pricing cards section.
- If the user asks for a "dashboard", then a full screen is appropriate.
Match the scope to the request: single component = output only that component; full page/screen = output full layout.

User request: ${prompt}`;
    }

    const { width, height } =
      inspirationKind === "mobile" ? PRESETS.mobile : PRESETS.web;

    const creditCost = 1.0;
    let userRecord = await prisma.user.findUnique({
      where: { userId: user.id },
    });
    if (!userRecord) {
      userRecord = await prisma.user.create({
        data: { userId: user.id, credits: 10.0 },
      });
    }
    if (userRecord.credits < creditCost) {
      return NextResponse.json(
        { error: "Insufficient credits. You need at least 1 credit." },
        { status: 402 }
      );
    }

    await prisma.user.update({
      where: { userId: user.id },
      data: {
        credits: userRecord.credits - creditCost,
        totalCreditsUsed: (userRecord.totalCreditsUsed || 0) + creditCost,
      },
    });

    const projectName = await generateProjectName(combinedPrompt, model);

    let project: {
      id: string;
      userId: string;
      name: string;
      deviceType: string;
    };
    try {
      project = await prisma.project.create({
        data: {
          userId: user.id,
          name: projectName,
          deviceType: "inspirations",
          width,
          height,
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Unknown argument") && msg.includes("width")) {
        project = await prisma.project.create({
          data: {
            userId: user.id,
            name: projectName,
            deviceType: "inspirations",
          },
        });
      } else {
        throw e;
      }
    }

    try {
      await inngest.send({
        name: "ui/generate.inspiration",
        data: {
          userId: user.id,
          projectId: project.id,
          prompt: combinedPrompt,
          model,
          dimensions: { width, height },
        },
      });
    } catch (err) {
      console.error("Failed to send Inngest inspiration event:", err);
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error("inspiration-redesign error:", error);
    return NextResponse.json(
      { error: "Failed to create inspiration redesign" },
      { status: 500 }
    );
  }
}
