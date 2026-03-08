import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Public API: get project by share token (no auth required).
 * Returns project + frames for read-only share view at /p/[shareToken].
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    if (!shareToken?.trim()) {
      return NextResponse.json(
        { error: "Share token is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: { shareToken: shareToken.trim() },
      include: { frames: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or link has been revoked" },
        { status: 404 }
      );
    }

    // Return same shape as GET /api/project/[id] for compatibility with canvas
    return NextResponse.json(project);
  } catch (error) {
    console.error("[share] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load shared project" },
      { status: 500 }
    );
  }
}
