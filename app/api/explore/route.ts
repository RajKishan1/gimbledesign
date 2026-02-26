import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

/** GET /api/explore — list projects that admins have moved to Explore (visible to all users) */
export async function GET(request: Request) {
  try {
    const session = await getSession(await headers());
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20;

    const projects = await prisma.project.findMany({
      where: { isExplore: true },
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        thumbnail: true,
        deviceType: true,
        theme: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching explore projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch explore projects" },
      { status: 500 }
    );
  }
}
