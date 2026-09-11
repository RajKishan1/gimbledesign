import "server-only";
import prisma from "@/lib/prisma";
import { refundCredits } from "@/lib/credits";
import {
  generateStoreImage,
  getRunwareEnv,
  resolveGenerationSize,
  type ReferenceImage,
} from "@/lib/runware";
import { dataUrlToBuffer, makeThumbnail, pngToWebpDataUrl } from "./images";
import { buildScreenPrompt, type ScreenReferenceRoles } from "./prompts";
import {
  CREDITS_PER_SCREEN,
  PLATFORMS,
  QUALITY_OPTIONS,
  slotPosition,
  slotSize,
  type AppStoreBrief,
  type DeviceVariant,
  type PlatformId,
  type QualityId,
  type ScreenPlan,
  type StyleGuide,
} from "./specs";

export type RenderContext = {
  setId: string;
  userId: string;
  projectId: string;
  platform: PlatformId;
  quality: QualityId;
  brief: AppStoreBrief;
  styleGuide: StyleGuide;
  total: number;
};

export type RenderResult =
  | { ok: true; screenId: string; canvasImageId: string }
  | { ok: false; screenId: string; error: string };

/** Load the frozen context for a set from the DB (used by every render step). */
export async function loadRenderContext(setId: string, userId: string): Promise<RenderContext> {
  const set = await prisma.appStoreSet.findFirst({
    where: { id: setId, userId },
    select: {
      id: true,
      userId: true,
      projectId: true,
      platform: true,
      quality: true,
      brief: true,
      styleGuide: true,
      _count: { select: { screens: true } },
    },
  });
  if (!set) throw new Error("App Store set not found");
  if (!set.styleGuide) throw new Error("App Store set has no style guide yet");
  return {
    setId: set.id,
    userId: set.userId,
    projectId: set.projectId,
    platform: set.platform as PlatformId,
    quality: set.quality as QualityId,
    brief: set.brief as unknown as AppStoreBrief,
    styleGuide: set.styleGuide as unknown as StyleGuide,
    total: set._count.screens,
  };
}

async function assetToReference(assetId: string): Promise<ReferenceImage | null> {
  const asset = await prisma.appStoreAsset.findUnique({
    where: { id: assetId },
    select: { src: true, name: true, kind: true },
  });
  if (!asset) return null;
  const { buffer, mimeType } = dataUrlToBuffer(asset.src);
  return { buffer, mimeType, name: `${asset.kind}.png` };
}

async function canvasImageToReference(canvasImageId: string): Promise<ReferenceImage | null> {
  const img = await prisma.canvasImage.findUnique({
    where: { id: canvasImageId },
    select: { src: true },
  });
  if (!img) return null;
  const { buffer, mimeType } = dataUrlToBuffer(img.src);
  const ext = mimeType.includes("webp") ? "webp" : "png";
  return { buffer, mimeType, name: `master-reference.${ext}` };
}

/**
 * Render one screen of a set and persist it as a canvas image.
 *
 * `masterScreenIndex` — index of an already finished screen whose output is
 * attached as the style reference (null for the hero's first render). Never
 * throws for model/render failures: the screen is marked failed and the
 * per-screen credits are refunded, so an Inngest retry can't double-bill.
 */
export async function renderScreen(
  ctx: RenderContext,
  index: number,
  opts: { masterScreenIndex: number | null; adjustments?: string | null },
): Promise<RenderResult> {
  const screen = await prisma.appStoreScreen.findFirst({
    where: { setId: ctx.setId, index },
  });
  if (!screen) throw new Error(`Screen ${index} not found for set ${ctx.setId}`);

  await prisma.appStoreScreen.update({
    where: { id: screen.id },
    data: { status: "generating", error: null },
  });

  try {
    // ── Gather reference images (order matters: it is echoed in the prompt) ──
    const references: ReferenceImage[] = [];
    const roles: ScreenReferenceRoles = {};

    if (opts.masterScreenIndex != null && opts.masterScreenIndex !== index) {
      const master = await prisma.appStoreScreen.findFirst({
        where: { setId: ctx.setId, index: opts.masterScreenIndex, status: "done" },
        select: { canvasImageId: true },
      });
      if (master?.canvasImageId) {
        const ref = await canvasImageToReference(master.canvasImageId);
        if (ref) {
          references.push(ref);
          roles.hero = references.length;
        }
      }
    }

    const assets = await prisma.appStoreAsset.findMany({
      where: { setId: ctx.setId },
      select: { id: true, kind: true },
      orderBy: { order: "asc" },
    });
    const logo = assets.find((a) => a.kind === "logo");
    const styleRef = assets.find((a) => a.kind === "reference");

    const wantsLogo =
      ctx.styleGuide.logoUsage === "every-screen" ||
      (ctx.styleGuide.logoUsage === "hero-only" && index === 0);
    if (logo && wantsLogo) {
      const ref = await assetToReference(logo.id);
      if (ref) {
        references.push(ref);
        roles.logo = references.length;
      }
    }

    if (screen.assetId) {
      const ref = await assetToReference(screen.assetId);
      if (ref) {
        references.push(ref);
        roles.screenshot = references.length;
      }
    }

    // The user's style reference only informs the master; later screens copy the master.
    if (styleRef && !roles.hero) {
      const ref = await assetToReference(styleRef.id);
      if (ref) {
        references.push(ref);
        roles.reference = references.length;
      }
    }

    // ── Prompt ────────────────────────────────────────────────────────────────
    const { RUNWARE_IMAGE_MODEL } = getRunwareEnv();
    const size = resolveGenerationSize(
      RUNWARE_IMAGE_MODEL,
      PLATFORMS[ctx.platform].generate[ctx.quality],
    );
    const plan: ScreenPlan = {
      index: screen.index,
      headline: screen.headline,
      subheadline: screen.subheadline,
      visualBrief: screen.visualBrief ?? "",
      screenshotAssetId: screen.assetId,
      deviceVariant: (screen.deviceVariant as DeviceVariant) || "straight",
    };
    const prompt = buildScreenPrompt({
      brief: ctx.brief,
      guide: ctx.styleGuide,
      platform: ctx.platform,
      size,
      screen: plan,
      total: ctx.total,
      refs: roles,
      adjustments: opts.adjustments ?? null,
    });

    await prisma.appStoreScreen.update({ where: { id: screen.id }, data: { prompt } });

    // ── Render ────────────────────────────────────────────────────────────────
    const { png, size: outSize } = await generateStoreImage({
      prompt,
      references,
      size,
      quality: QUALITY_OPTIONS[ctx.quality].openai,
    });

    const webp = await pngToWebpDataUrl(png, 92);

    // ── Persist onto the canvas ───────────────────────────────────────────────
    let canvasImageId = screen.canvasImageId;
    if (canvasImageId) {
      const existing = await prisma.canvasImage.findFirst({
        where: { id: canvasImageId, projectId: ctx.projectId },
      });
      if (existing) {
        await prisma.canvasImage.update({
          where: { id: canvasImageId },
          data: { src: webp.dataUrl },
        });
      } else {
        canvasImageId = null;
      }
    }
    if (!canvasImageId) {
      const pos = slotPosition(index);
      const dims = slotSize(ctx.platform);
      const created = await prisma.canvasImage.create({
        data: {
          projectId: ctx.projectId,
          src: webp.dataUrl,
          x: pos.x,
          y: pos.y,
          width: dims.width,
          height: Math.round(dims.width * (webp.height / webp.width)),
        },
      });
      canvasImageId = created.id;
    }

    await prisma.appStoreScreen.update({
      where: { id: screen.id },
      data: {
        status: "done",
        error: null,
        canvasImageId,
        genWidth: outSize.width,
        genHeight: outSize.height,
      },
    });

    if (index === 0) {
      try {
        const thumb = await makeThumbnail(png);
        await prisma.project.update({
          where: { id: ctx.projectId },
          data: { thumbnail: thumb },
        });
      } catch (e) {
        console.warn("[app-store] thumbnail failed:", e);
      }
    }

    return { ok: true, screenId: screen.id, canvasImageId };
  } catch (err) {
    const message = (err instanceof Error ? err.message : String(err)).slice(0, 400);
    console.error(`[app-store] screen ${index} failed:`, message);
    await prisma.appStoreScreen.update({
      where: { id: screen.id },
      data: { status: "failed", error: message },
    });
    await refundCredits(ctx.userId, CREDITS_PER_SCREEN[ctx.quality]);
    return { ok: false, screenId: screen.id, error: message };
  }
}

/** Recompute the set status from its screens. */
export async function finalizeSetStatus(setId: string) {
  const screens = await prisma.appStoreScreen.findMany({
    where: { setId },
    select: { status: true, error: true },
  });
  const done = screens.filter((s) => s.status === "done").length;
  const failed = screens.filter((s) => s.status === "failed");
  const status = done > 0 ? "completed" : "failed";
  const error =
    failed.length > 0
      ? `${failed.length} of ${screens.length} screens failed: ${failed[0]?.error ?? "unknown error"}`
      : null;
  await prisma.appStoreSet.update({ where: { id: setId }, data: { status, error } });
  return { done, failed: failed.length, status };
}
