import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { generateProjectName } from "@/app/action/action";
import { inngest } from "@/inngest/client";
import { describeImageFromBuffer } from "@/lib/describe-image-server";
import { getImageDimensions, DEFAULT_WIDTH, DEFAULT_HEIGHT } from "@/lib/get-image-dimensions";
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
    const model = modelInput ? getGenerationModel(modelInput) : getGenerationModel("auto");

    if (!imageFile && !prompt) {
      return NextResponse.json(
        { error: "Provide at least an image or a prompt (or both)." },
        { status: 400 }
      );
    }

    let combinedPrompt: string;
    let width = DEFAULT_WIDTH;
    let height = DEFAULT_HEIGHT;

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

      const [imageDescription, dimensions] = await Promise.all([
        describeImageFromBuffer(buffer, imageFile.type),
        Promise.resolve(getImageDimensions(buffer)),
      ]);

      width = dimensions.width;
      height = dimensions.height;

      combinedPrompt = `Redesign this design for inspiration. Same type of content, four different visual styles.\n\nReference design (from image): ${imageDescription}.${prompt ? `\n\nAdditional context from user: ${prompt}` : ""}`;
    } else {
      combinedPrompt = `Generate four design variations for inspiration. Same concept, four different visual styles (e.g. minimal, bold, classic, modern).\n\nUser request: ${prompt}`;
    }

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

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: projectName,
        deviceType: "inspirations",
      },
    });

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
