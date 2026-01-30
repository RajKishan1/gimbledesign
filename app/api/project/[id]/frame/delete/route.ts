import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(await headers());
    const user = session?.user;

    if (!user) throw new Error("Unauthorized");

    const { frameId } = await request.json();

    if (!frameId) throw new Error("FrameId is required");
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify frame belongs to project and delete it
    const frame = await prisma.frame.delete({
      where: {
        id: frameId,
        projectId: projectId,
      },
    });

    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Frame deleted successfully",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete frame" },
      { status: 500 },
    );
  }
}
