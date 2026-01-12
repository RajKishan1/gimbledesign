import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getKindeServerSession();
    const user = await session.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { frameId, prompt } = await request.json();

    if (!frameId || !prompt) {
      return NextResponse.json(
        { error: "frameId and prompt are required" },
        { status: 400 }
      );
    }
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const frame = await prisma.frame.findFirst({
      where: {
        id: frameId,
        projectId: projectId,
      },
    });

    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    // Check and deduct credits (0.5 credits for regenerate)
    const creditCost = 0.5;
    let userRecord = await prisma.user.findUnique({
      where: { userId: user.id },
    });

    if (!userRecord) {
      // Create user with 10 free credits
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
          error: "Insufficient credits. You need at least 0.5 credits to regenerate a frame.",
        },
        { status: 402 }
      );
    }

    // Deduct credits
    await prisma.user.update({
      where: { userId: user.id },
      data: { credits: userRecord.credits - creditCost },
    });

    // Trigger inngest function
    await inngest.send({
      name: "ui/regenerate.frame",
      data: {
        userId: user.id,
        projectId: projectId,
        frameId: frameId,
        prompt: prompt,
        theme: project.theme,
        frame: frame,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Frame regeneration started",
    });
  } catch (error) {
    console.log("Regenerate frame error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate frame" },
      { status: 500 }
    );
  }
}
