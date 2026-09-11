import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type {
  AppStoreBrief,
  AppStoreSetDTO,
  DeviceVariant,
  PlatformId,
  QualityId,
  ScreenStatus,
  SetStatus,
  StyleGuide,
} from "@/lib/app-store/specs";

/** Status + plan for the project's App Store set. Polled while generating. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const session = await getSession(await headers());
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const set = await prisma.appStoreSet.findUnique({
      where: { projectId },
      include: {
        screens: {
          orderBy: { index: "asc" },
          select: {
            id: true,
            index: true,
            headline: true,
            subheadline: true,
            visualBrief: true,
            deviceVariant: true,
            status: true,
            error: true,
            canvasImageId: true,
            genWidth: true,
            genHeight: true,
            updatedAt: true,
          },
        },
        assets: {
          orderBy: { order: "asc" },
          // Deliberately no `src` — thumbnails would bloat every poll.
          select: { id: true, kind: true, name: true, width: true, height: true, order: true },
        },
      },
    });
    if (!set) {
      return NextResponse.json({ error: "No App Store set for this project" }, { status: 404 });
    }

    const dto: AppStoreSetDTO = {
      id: set.id,
      projectId: set.projectId,
      platform: set.platform as PlatformId,
      quality: set.quality as QualityId,
      model: set.model,
      status: set.status as SetStatus,
      error: set.error,
      brief: set.brief as unknown as AppStoreBrief,
      styleGuide: (set.styleGuide as unknown as StyleGuide | null) ?? null,
      screens: set.screens.map((s) => ({
        id: s.id,
        index: s.index,
        headline: s.headline,
        subheadline: s.subheadline,
        visualBrief: s.visualBrief,
        deviceVariant: s.deviceVariant as DeviceVariant,
        status: s.status as ScreenStatus,
        error: s.error,
        canvasImageId: s.canvasImageId,
        genWidth: s.genWidth,
        genHeight: s.genHeight,
        updatedAt: s.updatedAt.toISOString(),
      })),
      assets: set.assets.map((a) => ({
        id: a.id,
        kind: a.kind as "logo" | "screenshot" | "reference",
        name: a.name,
        width: a.width,
        height: a.height,
        order: a.order,
      })),
      createdAt: set.createdAt.toISOString(),
      updatedAt: set.updatedAt.toISOString(),
    };

    return NextResponse.json({ set: dto });
  } catch (error) {
    console.error("[app-store] GET failed:", error);
    return NextResponse.json({ error: "Failed to load App Store set" }, { status: 500 });
  }
}
