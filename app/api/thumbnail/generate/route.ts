import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateProjectThumbnail } from "@/lib/thumbnail-generator";

/**
 * POST /api/thumbnail/generate
 *
 * Body: { projectId: string }
 *
 * Generates an AI thumbnail (compact SVG via Gemini Flash) for the caller's
 * project and stores it in `project.thumbnail` as a data URL. Used both for:
 *   - Manual / on-demand regeneration from the client.
 *   - Internal "retry" calls if the fire-and-forget hook on project creation
 *     ever fails.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession(await headers());
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const projectId = body?.projectId;
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid projectId" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const thumbnail = await generateProjectThumbnail(projectId);
    if (!thumbnail) {
      return NextResponse.json(
        { error: "Failed to generate thumbnail" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, thumbnail });
  } catch (error) {
    console.error("[thumbnail.generate] error:", error);
    return NextResponse.json(
      { error: "Failed to generate thumbnail" },
      { status: 500 },
    );
  }
}
