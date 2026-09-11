import { generateText } from "ai";
import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import prisma from "@/lib/prisma";
import { llm } from "@/lib/llm";
import { DEFAULT_MODEL } from "@/constant/models";
import { refundCredits } from "@/lib/credits";
import {
  ART_DIRECTOR_SYSTEM_PROMPT,
  buildArtDirectorUserPrompt,
  normalizeArtDirection,
  parseArtDirection,
  type ArtDirectorAsset,
} from "@/lib/app-store/prompts";
import {
  finalizeSetStatus,
  loadRenderContext,
  renderScreen,
} from "@/lib/app-store/render";
import {
  CREDITS_PER_SCREEN,
  type AppStoreBrief,
  type QualityId,
} from "@/lib/app-store/specs";
import type { Prisma } from "@/lib/generated/prisma";

/** How many screens render concurrently after the hero exists. */
const RENDER_BATCH = 3;

type SetEvent = { userId: string; projectId: string; setId: string };

/**
 * Full pipeline for a new set:
 *   art-direct (vision LLM) → render hero → render the rest in batches,
 *   each with the hero attached as the style reference → finalize.
 */
export const generateAppStoreScreens = inngest.createFunction(
  {
    id: "app-store-generate-set",
    retries: 1,
    concurrency: [{ key: "event.data.userId", limit: 1 }],
    onFailure: async ({ event }) => {
      // Reached only if the art-direction step exhausted its retries (render
      // steps never throw). Release the credits and surface the error.
      const data = (event.data.event as { data: SetEvent }).data;
      const err = event.data.error?.message?.slice(0, 400) ?? "Generation failed";
      const set = await prisma.appStoreSet.findFirst({
        where: { id: data.setId, userId: data.userId },
        include: { screens: { select: { id: true, status: true } } },
      });
      if (!set) return;
      const unfinished = set.screens.filter((s) => s.status !== "done");
      await prisma.appStoreScreen.updateMany({
        where: { id: { in: unfinished.map((s) => s.id) } },
        data: { status: "failed", error: err },
      });
      await prisma.appStoreSet.update({
        where: { id: set.id },
        data: { status: "failed", error: err },
      });
      const perScreen = CREDITS_PER_SCREEN[set.quality as QualityId] ?? 0;
      if (unfinished.length > 0 && perScreen > 0) {
        await refundCredits(data.userId, unfinished.length * perScreen);
      }
    },
  },
  { event: "app-store/generate.set" },
  async ({ event, step }) => {
    const { userId, projectId, setId } = event.data as SetEvent;

    // ── 1. Art direction ─────────────────────────────────────────────────────
    const total = await step.run("art-direct", async () => {
      const set = await prisma.appStoreSet.findFirst({
        where: { id: setId, userId, projectId },
        include: {
          assets: { orderBy: { order: "asc" } },
          screens: { orderBy: { index: "asc" }, select: { id: true, index: true } },
        },
      });
      if (!set) throw new NonRetriableError("App Store set not found");
      if (set.styleGuide) return set.screens.length; // idempotent re-run

      const brief = set.brief as unknown as AppStoreBrief;

      // Logo first, then screenshots, then the style reference — the prompt
      // refers to them by position.
      const ordered = [
        ...set.assets.filter((a) => a.kind === "logo"),
        ...set.assets.filter((a) => a.kind === "screenshot"),
        ...set.assets.filter((a) => a.kind === "reference"),
      ];
      const assetsForPrompt: ArtDirectorAsset[] = ordered.map((a, i) => ({
        id: a.id,
        kind: a.kind as ArtDirectorAsset["kind"],
        name: a.name,
        width: a.width,
        height: a.height,
        imageIndex: i + 1,
      }));

      const userPrompt = buildArtDirectorUserPrompt(brief, assetsForPrompt);

      // Runware's chat endpoint is OpenAI-compatible; structured-output support
      // varies by model, so we ask for plain JSON and validate it ourselves.
      const direct = async (withImages: boolean) => {
        const content: Array<
          { type: "text"; text: string } | { type: "image"; image: string }
        > = [
          {
            type: "text",
            text: withImages
              ? userPrompt
              : `${userPrompt}\n\n(The uploaded images could not be attached to this request — rely on their names, dimensions and the brand colours.)`,
          },
        ];
        if (withImages) for (const a of ordered) content.push({ type: "image", image: a.src });

        const { text } = await generateText({
          model: llm.chat(DEFAULT_MODEL),
          system: ART_DIRECTOR_SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
          maxOutputTokens: 6000,
          temperature: 0.6,
        });
        return parseArtDirection(text);
      };

      let raw;
      try {
        raw = await direct(ordered.length > 0);
      } catch (e) {
        // Vision input or JSON shape failed — one more try, text only.
        console.warn("[app-store] art direction failed, retrying without images:", e);
        raw = await direct(false);
      }

      const validIds = new Set(set.assets.filter((a) => a.kind === "screenshot").map((a) => a.id));
      const { styleGuide, screens } = normalizeArtDirection(raw, brief, validIds);

      await prisma.$transaction([
        prisma.appStoreSet.update({
          where: { id: set.id },
          data: {
            styleGuide: styleGuide as unknown as Prisma.InputJsonValue,
            status: "generating",
            error: null,
          },
        }),
        ...screens.map((plan) => {
          const row = set.screens.find((s) => s.index === plan.index);
          return row
            ? prisma.appStoreScreen.update({
                where: { id: row.id },
                data: {
                  headline: plan.headline,
                  subheadline: plan.subheadline ?? null,
                  visualBrief: plan.visualBrief,
                  assetId: plan.screenshotAssetId ?? null,
                  deviceVariant: plan.deviceVariant,
                },
              })
            : prisma.appStoreScreen.create({
                data: {
                  setId: set.id,
                  projectId,
                  index: plan.index,
                  headline: plan.headline,
                  subheadline: plan.subheadline ?? null,
                  visualBrief: plan.visualBrief,
                  assetId: plan.screenshotAssetId ?? null,
                  deviceVariant: plan.deviceVariant,
                },
              });
        }),
      ]);

      return screens.length;
    });

    // ── 2. Hero (defines the look) ───────────────────────────────────────────
    const hero = await step.run("render-screen-0", async () => {
      const ctx = await loadRenderContext(setId, userId);
      return renderScreen(ctx, 0, { masterScreenIndex: null });
    });

    // ── 3. Remaining screens, matched to the hero ────────────────────────────
    const masterIndex = hero.ok ? 0 : null;
    const remaining = Array.from({ length: Math.max(0, total - 1) }, (_, i) => i + 1);
    for (let b = 0; b < remaining.length; b += RENDER_BATCH) {
      const batch = remaining.slice(b, b + RENDER_BATCH);
      await Promise.all(
        batch.map((index) =>
          step.run(`render-screen-${index}`, async () => {
            const ctx = await loadRenderContext(setId, userId);
            // If the hero failed, the first successful screen becomes the master.
            let master = masterIndex;
            if (master == null) {
              const first = await prisma.appStoreScreen.findFirst({
                where: { setId, status: "done" },
                orderBy: { index: "asc" },
                select: { index: true },
              });
              master = first?.index ?? null;
            }
            return renderScreen(ctx, index, { masterScreenIndex: master });
          }),
        ),
      );
    }

    // ── 4. Finalize ──────────────────────────────────────────────────────────
    return step.run("finalize", () => finalizeSetStatus(setId));
  },
);

type RegenEvent = SetEvent & { screenId: string; adjustments?: string | null };

/** Re-render a single screen, keeping it matched to the rest of the set. */
export const regenerateAppStoreScreen = inngest.createFunction(
  {
    id: "app-store-regenerate-screen",
    retries: 0,
    concurrency: [{ key: "event.data.userId", limit: 2 }],
  },
  { event: "app-store/regenerate.screen" },
  async ({ event, step }) => {
    const { userId, setId, screenId, adjustments } = event.data as RegenEvent;

    const result = await step.run("render", async () => {
      const ctx = await loadRenderContext(setId, userId);
      const screen = await prisma.appStoreScreen.findFirst({
        where: { id: screenId, setId },
        select: { index: true },
      });
      if (!screen) throw new NonRetriableError("Screen not found");

      // Use the best available finished screen as the style master.
      const master = await prisma.appStoreScreen.findFirst({
        where: { setId, status: "done", NOT: { id: screenId } },
        orderBy: { index: "asc" },
        select: { index: true },
      });

      return renderScreen(ctx, screen.index, {
        masterScreenIndex: master?.index ?? null,
        adjustments: adjustments ?? null,
      });
    });

    await step.run("finalize", () => finalizeSetStatus(setId));
    return result;
  },
);
