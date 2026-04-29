import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse, after } from "next/server";
import { headers } from "next/headers";
import { normalizeRole } from "@/types/user";
import { generateProjectThumbnail } from "@/lib/thumbnail-generator";

/**
 * POST /api/admin/thumbnail/regen-all
 *
 * Admin-only one-shot migration. Clears every project's stored thumbnail and
 * schedules background regeneration through the new template-based system.
 * The work runs in `after()` after the response is sent, so the request
 * returns quickly and the actual regeneration happens server-side without
 * blocking the user.
 *
 * Optional body: `{ "limit": number }` to cap how many projects are processed
 * in this run (useful while dialing things in).
 */

const CONCURRENCY = 5;

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<{ done: number; failed: number }> {
  let done = 0;
  let failed = 0;
  let cursor = 0;

  const runners = Array.from({ length: concurrency }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        await worker(items[idx]);
        done++;
      } catch (err) {
        failed++;
        console.error("[thumbnail/regen-all] worker error:", err);
      }
    }
  });

  await Promise.all(runners);
  return { done, failed };
}

export async function POST(request: NextRequest) {
  try {
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
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
    };
    const limit =
      typeof body.limit === "number" && body.limit > 0
        ? Math.floor(body.limit)
        : undefined;

    await prisma.project.updateMany({
      where: { thumbnail: { not: null } },
      data: { thumbnail: null },
    });

    const projects = await prisma.project.findMany({
      select: { id: true },
      orderBy: { updatedAt: "desc" },
      ...(limit ? { take: limit } : {}),
    });
    const ids = projects.map((p) => p.id);

    after(async () => {
      const startedAt = Date.now();
      const result = await runWithConcurrency(ids, CONCURRENCY, async (id) => {
        await generateProjectThumbnail(id);
      });
      const elapsedMs = Date.now() - startedAt;
      console.log(
        `[thumbnail/regen-all] finished. total=${ids.length} done=${result.done} failed=${result.failed} elapsedMs=${elapsedMs}`,
      );
    });

    return NextResponse.json({
      success: true,
      cleared: true,
      scheduled: ids.length,
      concurrency: CONCURRENCY,
    });
  } catch (error) {
    console.error("POST /api/admin/thumbnail/regen-all error:", error);
    return NextResponse.json(
      { error: "Failed to schedule thumbnail regeneration" },
      { status: 500 },
    );
  }
}
