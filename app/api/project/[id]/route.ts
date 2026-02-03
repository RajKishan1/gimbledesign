import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { headers } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(await headers());
    const user = session?.user;

    if (!user) throw new Error("Unauthorized");

    const project = await prisma.project.findFirst({
      where: {
        userId: user.id,
        id: id,
      },
      include: {
        frames: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error: "Fail to fetch project",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let prompt: string;
    try {
      const body = await request.json();
      prompt = body.prompt;
      if (!prompt || typeof prompt !== "string") {
        return NextResponse.json(
          { error: "Missing or invalid prompt" },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const session = await getSession(await headers());
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Check and deduct credits (1 credit for design-sidebar submit)
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
            "Insufficient credits. You need at least 1 credit to generate designs.",
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

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
      include: { frames: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    //Trigger the appropriate Inngest function based on device type
    // The function will be retried automatically by Inngest if it's configured
    try {
      // Determine the correct event name based on device type
      const eventName =
        project.deviceType === "web"
          ? "ui/generate.web-screens"
          : project.deviceType === "wireframe"
          ? "ui/generate.wireframe-screens"
          : "ui/generate.screens";

      await inngest.send({
        name: eventName,
        data: {
          userId,
          projectId: id,
          prompt,
          frames: project.frames,
          theme: project.theme,
          ...(project.deviceType === "wireframe" &&
            project.wireframeKind != null && {
              wireframeKind: project.wireframeKind,
            }),
        },
      });
      console.log(
        `Inngest event ${eventName} sent successfully for project:`,
        id
      );
    } catch (inngestError) {
      console.error("Failed to send Inngest event:", inngestError);
      console.error("Inngest error details:", {
        message:
          inngestError instanceof Error
            ? inngestError.message
            : String(inngestError),
        stack: inngestError instanceof Error ? inngestError.stack : undefined,
      });
      // In development, check if Inngest dev server is running
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "⚠️  Inngest dev server may not be running. Start it with: npx inngest-cli dev"
        );
      }
      // Continue anyway - don't fail the request
      // In production, events will be queued and retried
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("POST /project/[id] Error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to generate frame",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { themeId } = await request.json();
    const session = await getSession(await headers());
    const user = session?.user;

    if (!user) throw new Error("Unauthorized");
    if (!themeId) throw new Error("Missing Theme");

    const userId = user.id;

    const project = await prisma.project.update({
      where: { id, userId },
      data: {
        theme: themeId,
      },
    });

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.log("Error occured ", error);
    return NextResponse.json(
      {
        error: "Failed to update project",
      },
      { status: 500 }
    );
  }
}
