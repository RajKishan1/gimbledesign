import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { headers } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(await headers());
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { frameId, numberOfOptions, creativeRange, customInstructions, aspectsToVary, model } =
      await request.json();

    if (!frameId || !numberOfOptions) {
      return NextResponse.json(
        { error: "frameId and numberOfOptions are required" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
      include: { frames: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const frame = project.frames.find((f) => f.id === frameId);
    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    // 0.5 credits per variation
    const creditCost = 0.5 * numberOfOptions;
    let userRecord = await prisma.user.findUnique({
      where: { userId: user.id },
    });

    if (!userRecord) {
      userRecord = await prisma.user.create({
        data: {
          userId: user.id,
          credits: 10.0,
        },
      });
    }

    if (userRecord.credits < creditCost) {
      return NextResponse.json(
        {
          error: `Insufficient credits. You need at least ${creditCost} credits to generate ${numberOfOptions} variations.`,
        },
        { status: 402 },
      );
    }

    // Deduct credits
    await prisma.user.update({
      where: { userId: user.id },
      data: {
        credits: userRecord.credits - creditCost,
        totalCreditsUsed: (userRecord.totalCreditsUsed || 0) + creditCost,
      },
    });

    // Trigger inngest function
    await inngest.send({
      name: "ui/generate.frame-variations",
      data: {
        userId: user.id,
        projectId,
        frameId,
        numberOfOptions,
        creativeRange: creativeRange || "explore",
        customInstructions: customInstructions || "",
        aspectsToVary: aspectsToVary || {},
        theme: project.theme,
        frame,
        allFrames: project.frames,
        ...(model && { model }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Generating ${numberOfOptions} variations`,
    });
  } catch (error) {
    console.log("Generate variations error:", error);
    return NextResponse.json(
      { error: "Failed to generate variations" },
      { status: 500 },
    );
  }
}
