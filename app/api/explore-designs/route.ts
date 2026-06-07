import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/explore-designs?category=&limit=
 *
 * Public, authenticated fetch of admin-curated explore designs.
 *  - `category` — "mobile" | "web" | "all" (default: all)
 *  - `limit`    — max items (default 24, hard cap 100)
 */
export async function GET(req: Request) {
  const session = await getSession(await headers());
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 24;

  const where =
    category && category !== "all" ? { category } : undefined;

  const designs = await prisma.exploreDesign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      imageUrl: true,
      link: true,
      category: true,
      width: true,
      height: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: designs });
}
