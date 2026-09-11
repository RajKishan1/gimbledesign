import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { chargeCredits, refundCredits } from "@/lib/credits";
import { getRunwareEnv } from "@/lib/runware";
import { normalizeUploadedImage } from "@/lib/app-store/images";
import { buildProjectName } from "@/lib/app-store/prompts";
import {
  ACCEPTED_IMAGE_TYPES,
  CATEGORIES,
  CREDITS_PER_SCREEN,
  LIMITS,
  PLATFORM_IDS,
  QUALITY_IDS,
  TONES,
  type AppStoreBrief,
} from "@/lib/app-store/specs";
import type { Prisma } from "@/lib/generated/prisma";

// Image normalisation + a handful of DB writes; keep generous on slow uploads.
export const maxDuration = 60;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colours must be 6-digit hex");

const briefSchema = z.object({
  appName: z.string().trim().min(1).max(60),
  tagline: z.string().trim().max(120).optional().or(z.literal("")),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(20).max(LIMITS.maxDescription),
  audience: z.string().trim().max(200).optional().or(z.literal("")),
  tone: z.enum(TONES),
  brandColors: z.array(hexColor).max(4).default([]),
  platform: z.enum(PLATFORM_IDS),
  screenCount: z.number().int().min(LIMITS.minScreens).max(LIMITS.maxScreens),
  quality: z.enum(QUALITY_IDS),
  features: z.array(z.string().trim().max(120)).max(LIMITS.maxScreens).default([]),
  extraInstructions: z.string().trim().max(LIMITS.maxInstructions).optional().or(z.literal("")),
});

function isAcceptedFile(file: File) {
  return (
    file.size > 0 &&
    file.size <= LIMITS.maxUploadBytes &&
    (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)
  );
}

export async function POST(request: Request) {
  const session = await getSession(await headers());
  const user = session?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fail early and loudly if the image provider is not configured.
  let imageModel: string;
  try {
    imageModel = getRunwareEnv().RUNWARE_IMAGE_MODEL;
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Image generation is not configured on this server." },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  // ── Brief ──────────────────────────────────────────────────────────────────
  let brief: AppStoreBrief;
  try {
    const raw = JSON.parse(String(formData.get("brief") ?? "{}"));
    const parsed = briefSchema.parse(raw);
    brief = {
      ...parsed,
      tagline: parsed.tagline || undefined,
      audience: parsed.audience || undefined,
      extraInstructions: parsed.extraInstructions || undefined,
      features: parsed.features.filter((f) => f.length > 0),
      brandColors: parsed.brandColors.map((c) => c.toUpperCase()),
    };
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : "Invalid brief";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── Files ──────────────────────────────────────────────────────────────────
  const logoFile = formData.get("logo");
  const referenceFile = formData.get("reference");
  const screenshotFiles = formData
    .getAll("screenshots")
    .filter((f): f is File => f instanceof File);

  if (logoFile instanceof File && logoFile.size > 0 && !isAcceptedFile(logoFile)) {
    return NextResponse.json({ error: "Logo must be a PNG, JPG or WebP under 10MB." }, { status: 400 });
  }
  if (referenceFile instanceof File && referenceFile.size > 0 && !isAcceptedFile(referenceFile)) {
    return NextResponse.json({ error: "Style reference must be a PNG, JPG or WebP under 10MB." }, { status: 400 });
  }
  if (screenshotFiles.length > LIMITS.maxScreenshots) {
    return NextResponse.json({ error: `Upload at most ${LIMITS.maxScreenshots} screenshots.` }, { status: 400 });
  }
  for (const f of screenshotFiles) {
    if (!isAcceptedFile(f)) {
      return NextResponse.json({ error: `"${f.name}" must be a PNG, JPG or WebP under 10MB.` }, { status: 400 });
    }
  }

  type PreparedAsset = {
    kind: "logo" | "screenshot" | "reference";
    name: string;
    src: string;
    width: number;
    height: number;
    order: number;
  };
  const prepared: PreparedAsset[] = [];
  try {
    if (logoFile instanceof File && logoFile.size > 0) {
      const n = await normalizeUploadedImage(Buffer.from(await logoFile.arrayBuffer()), {
        maxEdge: LIMITS.maxLogoEdge,
      });
      prepared.push({ kind: "logo", name: logoFile.name.slice(0, 80), src: n.dataUrl, width: n.width, height: n.height, order: 0 });
    }
    for (let i = 0; i < screenshotFiles.length; i++) {
      const f = screenshotFiles[i];
      const n = await normalizeUploadedImage(Buffer.from(await f.arrayBuffer()), {
        maxEdge: LIMITS.maxAssetEdge,
      });
      prepared.push({ kind: "screenshot", name: f.name.slice(0, 80), src: n.dataUrl, width: n.width, height: n.height, order: 10 + i });
    }
    if (referenceFile instanceof File && referenceFile.size > 0) {
      const n = await normalizeUploadedImage(Buffer.from(await referenceFile.arrayBuffer()), {
        maxEdge: LIMITS.maxAssetEdge,
      });
      prepared.push({ kind: "reference", name: referenceFile.name.slice(0, 80), src: n.dataUrl, width: n.width, height: n.height, order: 100 });
    }
  } catch (e) {
    console.error("[app-store] image processing failed:", e);
    return NextResponse.json({ error: "One of the uploaded images could not be read." }, { status: 400 });
  }

  // ── Credits (atomic, charged for the whole set up front) ───────────────────
  const cost = brief.screenCount * CREDITS_PER_SCREEN[brief.quality];
  const charge = await chargeCredits(user.id, cost);
  if (!charge.ok) {
    return NextResponse.json(
      {
        error: `Insufficient credits. This set needs ${cost} credits and you have ${Math.floor(charge.credits)}.`,
      },
      { status: 402 },
    );
  }

  // ── Records ────────────────────────────────────────────────────────────────
  let projectId: string | null = null;
  let setId: string | null = null;
  try {
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: buildProjectName(brief),
        deviceType: "app-store",
        initialPrompt: brief.description,
      },
    });
    projectId = project.id;

    const set = await prisma.appStoreSet.create({
      data: {
        projectId: project.id,
        userId: user.id,
        brief: brief as unknown as Prisma.InputJsonValue,
        platform: brief.platform,
        quality: brief.quality,
        model: imageModel,
        status: "planning",
      },
    });
    setId = set.id;

    if (prepared.length > 0) {
      await prisma.appStoreAsset.createMany({
        data: prepared.map((a) => ({ ...a, setId: set.id, projectId: project.id })),
      });
    }
    await prisma.appStoreScreen.createMany({
      data: Array.from({ length: brief.screenCount }, (_, index) => ({
        setId: set.id,
        projectId: project.id,
        index,
        headline: brief.features[index] ?? "",
        status: "pending",
      })),
    });

    await inngest.send({
      name: "app-store/generate.set",
      data: { userId: user.id, projectId: project.id, setId: set.id },
    });

    return NextResponse.json({ success: true, data: { id: project.id, setId: set.id, cost } });
  } catch (e) {
    console.error("[app-store] create failed:", e);
    // Nothing will run — give the credits back and mark what exists as failed.
    await refundCredits(user.id, cost);
    if (setId) {
      await prisma.appStoreSet
        .update({ where: { id: setId }, data: { status: "failed", error: "Could not start generation." } })
        .catch(() => {});
      await prisma.appStoreScreen
        .updateMany({ where: { setId }, data: { status: "failed", error: "Could not start generation." } })
        .catch(() => {});
    }
    return NextResponse.json(
      { error: "Failed to start generation. Your credits were not charged.", projectId },
      { status: 500 },
    );
  }
}
