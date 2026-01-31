import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateProjectName } from "@/app/action/action";
import { inngest } from "@/inngest/client";
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    const session = await getSession(await headers());
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get limit from query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    try {
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
    } catch (dbError) {
      console.error("Database error fetching projects:", dbError);
      // Check if it's a Prisma client issue
      if (dbError instanceof Error && dbError.message.includes("chatMessage")) {
        return NextResponse.json(
          {
            error: "Database schema mismatch. Please run: npx prisma generate",
            details:
              process.env.NODE_ENV === "development"
                ? dbError.message
                : undefined,
          },
          { status: 500 },
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch projects",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      prompt,
      model,
      deviceType = "mobile",
      dimensions,
    } = await request.json();
    const session = await getSession(await headers());
    const user = session?.user;

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
          error:
            "Insufficient credits. You need at least 1 credit to create a project.",
        },
        { status: 402 },
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

    // Store the device type (mobile or web)
    const project = await prisma.project.create({
      data: {
        userId,
        name: projectName,
        deviceType: deviceType,
      },
    });

    // Trigger the appropriate Inngest function based on device type
    try {
      const eventName =
        deviceType === "web"
          ? "ui/generate.web-screens"
          : deviceType === "wireframe"
            ? "ui/generate.wireframe-screens"
            : "ui/generate.screens";

      await inngest.send({
        name: eventName,
        data: {
          userId,
          projectId: project.id,
          prompt,
          model: selectedModel,
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
      { status: 500 },
    );
  }
}
