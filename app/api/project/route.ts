import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateProjectName } from "@/app/action/action";
import { inngest } from "@/inngest/client";

export async function GET(request: Request) {
  try {
    const session = await getKindeServerSession();
    const user = await session.getUser();

    if (!user) throw new Error("Unauthorized");

    // Get limit from query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
      },
      ...(limit && { take: limit }),
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.log("Error occured ", error);
    return NextResponse.json(
      {
        error: "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, model, deviceType = "mobile", dimensions } = await request.json();
    const session = await getKindeServerSession();
    const user = await session.getUser();

    if (!user) throw new Error("Unauthorized");
    if (!prompt) throw new Error("Missing Prompt");

    const userId = user.id;
    const selectedModel = model || "google/gemini-3-pro-preview";

    // Check and deduct credits (1 credit for landing page submit)
    const creditCost = 1.0;
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
          error: "Insufficient credits. You need at least 1 credit to create a project.",
        },
        { status: 402 }
      );
    }

    // Deduct credits and track total used
    await prisma.user.update({
      where: { userId: user.id },
      data: { 
        credits: userRecord.credits - creditCost,
        totalCreditsUsed: (userRecord.totalCreditsUsed || 0) + creditCost,
      },
    });

    const projectName = await generateProjectName(prompt, selectedModel);

    // Store the device type (creative maps to a specific type with custom dimensions)
    const project = await prisma.project.create({
      data: {
        userId,
        name: projectName,
        deviceType: deviceType,
      },
    });

    // Trigger the appropriate Inngest function based on device type
    try {
      let eventName: string;
      
      switch (deviceType) {
        case "web":
          eventName = "ui/generate.web-screens";
          break;
        case "creative":
          eventName = "ui/generate.creative-screens";
          break;
        default:
          eventName = "ui/generate.screens";
      }
      
      await inngest.send({
        name: eventName,
        data: {
          userId,
          projectId: project.id,
          prompt,
          model: selectedModel,
          dimensions: dimensions, // Pass dimensions for creative designs
        },
      });
    } catch (error) {
      console.error("Failed to send Inngest event:", error);
      // Don't fail the request if Inngest is down - log it but return success
      // The user can retry later
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.log("Error occured ", error);
    return NextResponse.json(
      {
        error: "Failed to create project",
      },
      { status: 500 }
    );
  }
}
