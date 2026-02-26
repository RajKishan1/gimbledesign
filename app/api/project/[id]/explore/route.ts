import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { normalizeRole } from "@/types/user";

/** PATCH /api/project/[id]/explore — add/remove project from Explore (admin only). Body: { isExplore: true | false } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(await headers());
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { userId: user.id },
    });
    const role = normalizeRole(userRecord?.role);
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin only." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const isExplore = body.isExplore === true || body.isExplore === false ? body.isExplore : true;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { isExplore },
    });

    return NextResponse.json({
      success: true,
      data: { isExplore },
    });
  } catch (error) {
    console.error("PATCH /project/[id]/explore error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
