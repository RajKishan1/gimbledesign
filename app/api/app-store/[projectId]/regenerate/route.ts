import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { chargeCredits, refundCredits } from "@/lib/credits";
import { CREDITS_PER_SCREEN, LIMITS, type QualityId } from "@/lib/app-store/specs";

const bodySchema = z.object({
  screenId: z.string().min(1),
  adjustments: z.string().trim().max(LIMITS.maxInstructions).optional(),
});

/** Re-render one screen (charges one screen's worth of credits). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const session = await getSession(await headers());
    const user = session?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "screenId is required" }, { status: 400 });
    }
    const { screenId, adjustments } = parsed.data;

    const set = await prisma.appStoreSet.findFirst({
      where: { projectId, userId: user.id },
      select: { id: true, status: true, quality: true, styleGuide: true },
    });
    if (!set) return NextResponse.json({ error: "Set not found" }, { status: 404 });
    if (!set.styleGuide || set.status === "planning") {
      return NextResponse.json(
        { error: "The set is still being planned. Try again in a moment." },
        { status: 409 },
      );
    }

    const screen = await prisma.appStoreScreen.findFirst({
      where: { id: screenId, setId: set.id },
      select: { id: true, status: true },
    });
    if (!screen) return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    if (screen.status === "generating") {
      return NextResponse.json({ error: "This screen is already rendering." }, { status: 409 });
    }

    const cost = CREDITS_PER_SCREEN[set.quality as QualityId];
    const charge = await chargeCredits(user.id, cost);
    if (!charge.ok) {
      return NextResponse.json(
        { error: `Insufficient credits. Re-rendering costs ${cost} credits.` },
        { status: 402 },
      );
    }

    await prisma.appStoreScreen.update({
      where: { id: screen.id },
      data: { status: "generating", error: null },
    });
    await prisma.appStoreSet.update({
      where: { id: set.id },
      data: { status: "generating" },
    });

    try {
      await inngest.send({
        name: "app-store/regenerate.screen",
        data: {
          userId: user.id,
          projectId,
          setId: set.id,
          screenId: screen.id,
          adjustments: adjustments || null,
        },
      });
    } catch (e) {
      console.error("[app-store] regenerate send failed:", e);
      await refundCredits(user.id, cost);
      await prisma.appStoreScreen.update({
        where: { id: screen.id },
        data: { status: "failed", error: "Could not start re-render." },
      });
      return NextResponse.json({ error: "Could not start re-render." }, { status: 500 });
    }

    return NextResponse.json({ success: true, cost });
  } catch (error) {
    console.error("[app-store] regenerate failed:", error);
    return NextResponse.json({ error: "Failed to re-render screen" }, { status: 500 });
  }
}
