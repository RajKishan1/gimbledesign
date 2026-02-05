import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

const MAX_DUPLICATES_PER_PROJECT = 2;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceProjectId } = await params;
    const session = await getSession(await headers());
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const sourceProject = await prisma.project.findFirst({
      where: { id: sourceProjectId, userId },
      include: { frames: true },
    });

    if (!sourceProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const baseName = sourceProject.name.replace(/\s*\(Duplicate(\s*\d*)\)\s*$/i, "").trim() || sourceProject.name;
    const duplicateNames = [
      `${baseName} (Duplicate)`,
      `${baseName} (Duplicate 2)`,
    ];

    const existingDuplicates = await prisma.project.count({
      where: {
        userId,
        name: { in: duplicateNames },
      },
    });

    if (existingDuplicates >= MAX_DUPLICATES_PER_PROJECT) {
      return NextResponse.json(
        {
          error: `You can only create up to ${MAX_DUPLICATES_PER_PROJECT} duplicates of a project.`,
        },
        { status: 400 }
      );
    }

    const newName =
      existingDuplicates === 0
        ? `${baseName} (Duplicate)`
        : `${baseName} (Duplicate 2)`;

    const newProject = await prisma.project.create({
      data: {
        userId,
        name: newName,
        theme: sourceProject.theme ?? undefined,
        thumbnail: sourceProject.thumbnail ?? undefined,
        deviceType: sourceProject.deviceType,
        wireframeKind: sourceProject.wireframeKind ?? undefined,
        width: sourceProject.width ?? undefined,
        height: sourceProject.height ?? undefined,
      },
    });

    if (sourceProject.frames.length > 0) {
      await prisma.frame.createMany({
        data: sourceProject.frames.map((f) => ({
          projectId: newProject.id,
          title: f.title,
          htmlContent: f.htmlContent,
          designTree: f.designTree ?? undefined,
        })),
      });
    }

    const projectWithFrames = await prisma.project.findUnique({
      where: { id: newProject.id },
      include: { frames: true },
    });

    return NextResponse.json({
      success: true,
      data: projectWithFrames ?? newProject,
    });
  } catch (error) {
    console.error("POST /project/[id]/duplicate Error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate project" },
      { status: 500 }
    );
  }
}
