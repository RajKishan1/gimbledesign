import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(await headers());
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { frameId } = await request.json();
    if (!frameId) {
      return NextResponse.json({ error: "frameId is required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const source = await prisma.frame.findFirst({
      where: { id: frameId, projectId },
    });
    if (!source) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    const copy = await prisma.frame.create({
      data: {
        title: `${source.title} (Copy)`,
        htmlContent: source.htmlContent,
        designTree: source.designTree ?? undefined,
        projectId,
      },
    });

    return NextResponse.json({ frame: copy });
  } catch (error) {
    console.error("Duplicate frame failed:", error);
    return NextResponse.json(
      { error: "Failed to duplicate frame" },
      { status: 500 },
    );
  }
}
