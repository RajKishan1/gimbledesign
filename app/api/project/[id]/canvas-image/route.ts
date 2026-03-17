import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

// GET — list all canvas images for a project
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(await headers());
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const images = await prisma.canvasImage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Get canvas images error:", error);
    return NextResponse.json({ error: "Failed to retrieve canvas images" }, { status: 500 });
  }
}

// POST — create a new canvas image
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(await headers());
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { src, x, y, width, height } = await request.json();
    if (!src) {
      return NextResponse.json({ error: "src is required" }, { status: 400 });
    }

    const image = await prisma.canvasImage.create({
      data: { projectId, src, x: x ?? 0, y: y ?? 0, width: width ?? 300, height: height ?? 200 },
    });

    return NextResponse.json({ image });
  } catch (error) {
    console.error("Create canvas image error:", error);
    return NextResponse.json({ error: "Failed to create canvas image" }, { status: 500 });
  }
}

// PATCH — update position / size of a canvas image
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(await headers());
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { imageId, x, y, width, height } = await request.json();
    if (!imageId) {
      return NextResponse.json({ error: "imageId is required" }, { status: 400 });
    }

    // Verify image belongs to this project
    const existing = await prisma.canvasImage.findFirst({
      where: { id: imageId, projectId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const image = await prisma.canvasImage.update({
      where: { id: imageId },
      data: {
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
      },
    });

    return NextResponse.json({ image });
  } catch (error) {
    console.error("Update canvas image error:", error);
    return NextResponse.json({ error: "Failed to update canvas image" }, { status: 500 });
  }
}

// DELETE — remove a canvas image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(await headers());
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { imageId } = await request.json();
    if (!imageId) {
      return NextResponse.json({ error: "imageId is required" }, { status: 400 });
    }

    const existing = await prisma.canvasImage.findFirst({
      where: { id: imageId, projectId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    await prisma.canvasImage.delete({ where: { id: imageId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete canvas image error:", error);
    return NextResponse.json({ error: "Failed to delete canvas image" }, { status: 500 });
  }
}
