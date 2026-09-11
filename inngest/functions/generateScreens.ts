import { generateText, stepCountIs } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { llm, generateStructured } from "@/lib/llm";
import { FrameType } from "@/types/project";
import { ANALYSIS_PROMPT, GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { imageTools } from "../tool";
import { availableImagesBlock, prefetchImages, type PrefetchedImage } from "@/lib/unsplash";
import { DEFAULT_MODEL, FAST_MODEL } from "@/constant/models";
import { analyzePalette, buildPaletteLockString } from "@/lib/palette-lock";
import { conformToThemeVariables, scrubColorSpecs } from "@/lib/theme-conformance";
import {
  buildDesignContext,
  generateFullContext,
  DesignContext,
} from "@/lib/design-context-manager";
import {
  AppIdentity,
  ComponentRegistry,
  buildComponentRegistry,
  generateFullScreenContext,
  generateAppIdentityString,
  extractAppIdentity,
  detectDesignSystem,
  getActiveNavItem,
} from "@/lib/component-registry";
import { parseScreenCountFromPrompt } from "@/lib/parse-screen-count";

// Schema for individual screen
const ScreenSchema = z.object({
  id: z
    .string()
    .describe(
      "Unique identifier for the screen (e.g., 'home-dashboard', 'profile-settings', 'transaction-history'). Use kebab-case.",
    ),
  name: z
    .string()
    .describe(
      "Short, descriptive name of the screen (e.g., 'Home Dashboard', 'Profile', 'Transaction History')",
    ),
  purpose: z
    .string()
    .describe(
      "One clear sentence explaining what this screen accomplishes for the user and its role in the app",
    ),
  visualDescription: z
    .string()
    .describe(
      "A dense, high-fidelity visual directive (like an image generation prompt). Describe the layout, specific data examples (e.g. 'Oct-Mar'), component hierarchy, and physical attributes (e.g. 'Chunky cards', 'Floating header','Floating action button', 'Bottom navigation',Header with user avatar).",
    ),
  imageQueries: z
    .array(z.string().max(60))
    .max(3)
    .default([])
    .describe(
      "0–3 short photo search phrases this screen needs (e.g. 'grilled salmon bowl'). Empty for screens without photos. Avatars never count.",
    ),
});

// Flexible schema that adapts to user's request
const FlexibleAppSchema = z.object({
  theme: z
    .string()
    .describe(
      "The specific visual theme ID (e.g., 'midnight', 'ocean-breeze', 'neo-brutalism').",
    ),
  appName: z
    .string()
    .describe(
      "A catchy, memorable name for the app based on the user's request.",
    ),
  totalScreenCount: z
    .number()
    .min(1)
    .max(24)
    .describe(
      "Exact number of screens requested by user or appropriate for the app scope.",
    ),
  screens: z
    .array(ScreenSchema)
    .min(1)
    .max(24)
    .describe(
      "Screens matching the user's request. Generate the exact number and types of screens they asked for.",
    ),
});

type ScreenPlan = z.infer<typeof ScreenSchema>;
/** Step outputs are JSON-serialised by Inngest, so keep them Date-free. */
type FrameRow = {
  id: string;
  title: string;
  htmlContent: string;
  projectId: string;
  position: number | null;
};

/**
 * How many screens render at the same time once the design system is
 * established. Each in-flight call holds a credit reservation upstream, so
 * this is deliberately modest.
 */
const PARALLEL_SCREENS = 3;

/** Output cap for one screen. The prompt targets ~120–220 lines (≈4–7k tokens). */
const SCREEN_MAX_OUTPUT_TOKENS = 14_000;

export const generateScreens = inngest.createFunction(
  { id: "generate-ui-screens" },
  { event: "ui/generate.screens" },
  async ({ event, step, publish }) => {
    const {
      userId,
      projectId,
      prompt,
      model,
      frames,
      theme: existingTheme,
    } = event.data;
    const CHANNEL = `user:${userId}`;
    const isExistingGeneration = Array.isArray(frames) && frames.length > 0;
    const requestedScreenCount = parseScreenCountFromPrompt(prompt);

    // Fast model for analysis, user-selected (or default) model for generation
    const analysisModel = FAST_MODEL;
    const generationModel = model || DEFAULT_MODEL;

    // ── Palette lock ─────────────────────────────────────────────────────────
    // Follow-up screens must match what is already on the canvas, even when
    // the first generation hardcoded its colours instead of using the theme
    // variables. Inspect the existing HTML and describe its palette literally.
    const existingPalette = isExistingGeneration
      ? analyzePalette((frames as FrameType[]).map((f) => f.htmlContent))
      : null;
    const existingThemeName =
      THEME_LIST.find((t) => t.id === existingTheme)?.name ?? String(existingTheme ?? "");
    const paletteLock = existingPalette
      ? buildPaletteLockString(existingPalette, existingThemeName)
      : "";
    // New projects, and follow-ups to projects that DO use the theme system,
    // must stay 100% variable-driven so theme switching and later screens work.
    const enforceThemeVariables = !existingPalette || existingPalette.mode === "theme";

    await publish({
      channel: CHANNEL,
      topic: "generation.start",
      data: {
        status: "running",
        projectId: projectId,
      },
    });

    // ── PHASE 1: Analysis (fast model) ────────────────────────────────────────
    const analysis = await step.run("analyze-and-plan-screens", async () => {
      await publish({
        channel: CHANNEL,
        topic: "analysis.start",
        data: {
          status: "analyzing",
          projectId: projectId,
        },
      });

      const analysisPrompt = isExistingGeneration
        ? `
          USER REQUEST: ${prompt}
          SELECTED THEME: ${existingTheme}

          EXISTING SCREENS (already built — DO NOT include these in your output):
          ${frames.map((f: FrameType, i: number) => `  ${i + 1}. ${f.title}`).join("\n")}

          ═══════════════════════════════════════════════════════════════
          CRITICAL: OUTPUT ONLY THE SCREENS THE USER IS REQUESTING NOW
          ═══════════════════════════════════════════════════════════════
          - The existing screens above are ALREADY in the app. Do NOT re-list or regenerate them.
          - ONLY output the NEW screens the user is asking for in this request.
          - Set totalScreenCount to the number of NEW screens only (not the total app count).
          - If the user asks for "login and signup", output exactly 2 screens.
          - Match the navigation patterns, visual style, and design system of the existing screens.
          ${paletteLock ? `\n          ${paletteLock.replace(/\n/g, "\n          ")}\n          In every visualDescription refer to these existing colours by role (background, card surface, accent) — never invent a new palette.\n` : ""}
          ${
            requestedScreenCount != null
              ? `
          MANDATORY: The user explicitly asked for exactly ${requestedScreenCount} screen(s). Output exactly ${requestedScreenCount} new screen(s). No more.
          `
              : ""
          }
        `.trim()
        : `
          USER REQUEST: ${prompt}

          =====================================================
          CRITICAL: READ THE USER'S REQUEST CAREFULLY
          =====================================================

          ANALYZE THE USER'S PROMPT TO DETERMINE:
          1. How many screens they want (look for explicit numbers like "4 screens", "6 screens", etc.)
          2. Whether they named specific screens or flows
          3. Whether they explicitly asked for onboarding, login, signup, or auth flows

          RULES FOR SCREEN GENERATION:
          - If user specifies an exact number (e.g., "4 screens", "6 screens"), generate EXACTLY that many
          - If user names specific screens (e.g., "dashboard and profile"), generate only those
          - If user asks for "single screen" or "one screen", generate exactly 1 screen

          DEFAULT (no count or specific screens mentioned): generate 3-4 CORE screens ONLY:
            * Screen 1: The primary home / dashboard screen (the first screen users see after launch)
            * Screen 2-3: The 2–3 screens reachable directly from the bottom navigation or primary nav
            * Screen 4 (optional): One additional core-feature screen if clearly implied by the prompt
            * STOP there — do NOT pad with extra screens

          STRICT EXCLUSIONS (unless the user explicitly mentions them in the prompt):
            ✗ NO onboarding screens
            ✗ NO splash/welcome screens
            ✗ NO login or signup screens
            ✗ NO authentication flows
            ✗ NO settings or profile screens
            ✗ NO "supporting" or utility screens

          Users can always generate additional screens later via the AI chat. Start lean.

          ${
            requestedScreenCount != null
              ? `
          ═══════════════════════════════════════════════════════════════
          MANDATORY: The user explicitly asked for exactly ${requestedScreenCount} screen(s). You MUST set totalScreenCount to ${requestedScreenCount} and output exactly ${requestedScreenCount} items in the screens array. Do NOT output more than ${requestedScreenCount} screens.
          ═══════════════════════════════════════════════════════════════
          `
              : ""
          }
        `.trim();

      const { object } = await generateStructured({
        model: llm.chat(analysisModel),
        schema: FlexibleAppSchema,
        system: ANALYSIS_PROMPT,
        prompt: analysisPrompt,
        maxOutputTokens: 6000,
      });

      const themeToUse = isExistingGeneration ? existingTheme : object.theme;

      if (!isExistingGeneration) {
        await prisma.project.update({
          where: {
            id: projectId,
            userId: userId,
          },
          data: { theme: themeToUse },
        });
      }

      await publish({
        channel: CHANNEL,
        topic: "analysis.complete",
        data: {
          status: "generating",
          theme: themeToUse,
          totalScreens: object.screens.length,
          screens: object.screens,
          projectId: projectId,
        },
      });

      return { ...object, themeToUse };
    });

    // Enforce user-requested screen limit (e.g. "5 screens" -> only generate 5)
    const analysisToUse =
      requestedScreenCount != null &&
      analysis.screens.length > requestedScreenCount
        ? {
            ...analysis,
            screens: analysis.screens.slice(0, requestedScreenCount),
            totalScreenCount: requestedScreenCount,
          }
        : analysis;
    // Planner text must never carry literal colours into the screens.
    const screens: ScreenPlan[] = analysisToUse.screens.map((s: ScreenPlan) => ({
      ...s,
      visualDescription: scrubColorSpecs(s.visualDescription),
    }));
    const total = screens.length;

    // ── Images: resolve up front so no screen needs a tool round-trip ─────────
    const images = await step.run("prefetch-images", async () => {
      const queries = screens.flatMap((s) =>
        (s.imageQueries ?? []).map((q) => ({ query: q, orientation: "landscape" as const })),
      );
      return prefetchImages(queries);
    });
    const imagesFor = (screen: ScreenPlan): PrefetchedImage[] => {
      const wanted = new Set((screen.imageQueries ?? []).map((q) => q.trim().toLowerCase()));
      return images.filter((img) => wanted.has(img.query));
    };

    // ── Shared design context ────────────────────────────────────────────────
    const selectedTheme = THEME_LIST.find((t) => t.id === analysisToUse.themeToUse);
    const fullThemeCSS = `${BASE_VARIABLES}\n${selectedTheme?.style || ""}`;

    // Stored design system from the FIRST generation (immutable tokens):
    // follow-up generations reuse it so every screen feels like one product,
    // even if the original frames were later edited, regenerated, or deleted.
    const storedDesign = isExistingGeneration
      ? await step.run("load-design-context", async () => {
          const p = await prisma.project.findUnique({
            where: { id: projectId },
            select: { designContext: true },
          });
          return (p?.designContext ?? null) as {
            dna?: DesignContext;
            registry?: ComponentRegistry;
            appIdentity?: AppIdentity;
          } | null;
        })
      : null;

    let designContext: DesignContext = isExistingGeneration
      ? (storedDesign?.dna ?? buildDesignContext(frames, analysisToUse.themeToUse))
      : buildDesignContext([], analysisToUse.themeToUse);

    // Component Registry — exact HTML components for perfect consistency.
    // Built from the first screen, then used for ALL others.
    let componentRegistry: ComponentRegistry | null =
      storedDesign?.registry ??
      (isExistingGeneration && frames.length > 0
        ? buildComponentRegistry(frames[0], prompt)
        : null);

    // Provisional identity built from analysis output — available from screen 0.
    // Upgraded to HTML-extracted identity after screen 1 is generated.
    let frozenAppIdentity: AppIdentity = {
      appName: analysisToUse.appName || "App",
      appTagline: null,
      userName: "Alex Johnson",
      userInitials: "AJ",
      userAvatarUrl: "https://i.pravatar.cc/150?u=AlexJohnson",
      seedData: {
        primaryAmount: "$12,450.00",
        secondaryAmount: "$2,340.50",
        trendPercent: "+2.4%",
        dateLabel: "Mar 2026",
        sampleItemName: "Netflix",
        sampleItemAmount: "-$14.99",
      },
    };
    if (isExistingGeneration && frames.length > 0) {
      frozenAppIdentity =
        storedDesign?.appIdentity ??
        extractAppIdentity(
          (frames[0] as FrameType).htmlContent,
          (frames[0] as FrameType).title,
        );
    }

    // Colour contract — for variable-driven apps: the theme lock; for apps
    // whose existing screens hardcoded a palette: that palette, literally.
    const colorContract = enforceThemeVariables
      ? `THEME LOCK: "${selectedTheme?.name || analysisToUse.themeToUse}" — theme ID: ${analysisToUse.themeToUse}
All colours come from this theme's CSS variables — no hex codes, no Tailwind palette classes, no font-['…'] classes. Do NOT introduce new colours or swap palettes.${paletteLock ? `\n\n${paletteLock}` : ""}`
      : `${paletteLock}

NOTE: the existing screens of this app do NOT use theme CSS variables. Do not introduce var(--…) colours here either — copy the literal palette above so every screen matches.`;

    // Detect if user requested a specific design system
    const designSystemSpec = detectDesignSystem(prompt);
    const designSystemContext = designSystemSpec.detected
      ? `\n\n⚠️ DESIGN SYSTEM REQUIRED: ${designSystemSpec.name}\n${designSystemSpec.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nYou MUST follow these rules on EVERY screen.`
      : "";

    // New frames are appended after any existing ones in display order.
    const basePosition = isExistingGeneration ? frames.length : 0;

    type RenderContext = {
      registry: ComponentRegistry | null;
      identity: AppIdentity;
      designContext: DesignContext;
      /** Finished frames the model may look at for continuity (oldest → newest). */
      referenceFrames: FrameType[];
    };

    // ── One screen ───────────────────────────────────────────────────────────
    const renderScreen = async (i: number, ctx: RenderContext): Promise<FrameRow> => {
      const screenPlan = screens[i];
      const appIdentityString = generateAppIdentityString(ctx.identity);

      let contextString: string;
      if (ctx.registry) {
        // The registry already carries the first screen's HTML; only attach a
        // separate "recent" frame when it adds something the registry lacks.
        const last = ctx.referenceFrames[ctx.referenceFrames.length - 1] ?? null;
        const recentFrame =
          last && last.title !== ctx.registry.sourceScreenTitle ? last : null;
        contextString =
          generateFullScreenContext(ctx.registry, recentFrame, Math.max(i, 1), screenPlan.name, total) +
          "\n\n" +
          generateFullContext(ctx.designContext, screenPlan, [], i, total);
      } else if (ctx.designContext.isInitialized) {
        contextString = generateFullContext(
          ctx.designContext,
          screenPlan,
          ctx.referenceFrames.slice(-2),
          i,
          total,
        );
      } else {
        contextString = `No previous screens - this is the first screen. Establish the Design DNA (typography, spacing, colors, navigation patterns) that ALL subsequent screens will follow.${designSystemContext}`;
      }

      const activeNavItem = ctx.registry?.navigation
        ? getActiveNavItem(screenPlan.name, ctx.registry.navigation)
        : null;
      const navActiveHint = activeNavItem
        ? `\n\nACTIVE NAVIGATION: For this screen ("${screenPlan.name}"), the active nav icon should be: ${activeNavItem}`
        : "";

      const imagesBlock = availableImagesBlock(imagesFor(screenPlan));
      const isFoundation = !ctx.registry;

      const result = await generateText({
        model: llm.chat(generationModel),
        system: GENERATION_SYSTEM_PROMPT,
        tools: imageTools(),
        stopWhen: stepCountIs(3),
        maxOutputTokens: SCREEN_MAX_OUTPUT_TOKENS,
        prompt: `
${appIdentityString}

${colorContract}

- Screen ${i + 1}/${total}
- Screen ID: ${screenPlan.id}
- Screen Name: ${screenPlan.name}
- Screen Purpose: ${screenPlan.purpose}

VISUAL DESCRIPTION: ${screenPlan.visualDescription}
${designSystemContext}

${imagesBlock}

${contextString}
${navActiveHint}

${
  enforceThemeVariables
    ? `THEME CSS VARIABLES (Reference ONLY - already defined in parent, do NOT redeclare):\n${fullThemeCSS}`
    : "(Theme CSS variables intentionally omitted — this app's screens use the literal palette from the PALETTE LOCK.)"
}

════════════════════════════════════════════════════════════════════════════
GENERATION INSTRUCTIONS
════════════════════════════════════════════════════════════════════════════
${
  isFoundation
    ? `
**FIRST SCREEN — ESTABLISH THE DESIGN DNA.**
Every choice here is replicated on every other screen: typography scale, spacing, card/button/input patterns, icon choices, and the tab bar.
- Tab bar: exactly 5 items with Hugeicons names, using the NAVIGATION CONTRACT markup verbatim. These icons and their order are LOCKED for the whole app.
- Make deliberate, professional choices that scale across 20+ screens.
`
    : `
**MAINTAIN THE DESIGN DNA — screen ${i + 1} of ${total}.**
This screen must be indistinguishable in style from the others: copy the tab bar from the registry exactly (only the active item changes), use only Icon Lock icons, same typography, spacing, components, and theme variables. Only the CONTENT changes.
`
}
Generate the complete HTML for this screen now — HTML only, starting with <div.
        `.trim(),
      });

      let finalHtml = result.text ?? "";
      const match = finalHtml.match(/<div[\s\S]*<\/div>/);
      finalHtml = match ? match[0] : finalHtml;
      finalHtml = finalHtml.replace(/```/g, "");

      // A screen that hardcodes its palette breaks theme switching AND every
      // later screen's consistency (they only see the theme variables). Repair
      // it before it is saved and before the registry is built from it.
      if (enforceThemeVariables) {
        const conformed = await conformToThemeVariables(finalHtml, {
          themeCSS: fullThemeCSS,
          label: screenPlan.name,
        });
        finalHtml = conformed.html;
      }

      const frame = await prisma.frame.create({
        data: {
          projectId,
          title: screenPlan.name,
          htmlContent: finalHtml,
          position: basePosition + i,
        },
      });

      await publish({
        channel: CHANNEL,
        topic: "frame.created",
        data: {
          frame: { ...frame, isLoading: false },
          screenId: screenPlan.id,
          frameId: frame.id,
          projectId: projectId,
        },
      });

      return {
        id: frame.id,
        title: frame.title,
        htmlContent: frame.htmlContent,
        projectId: frame.projectId,
        position: frame.position,
      };
    };

    // ── PHASE 2: Generation ──────────────────────────────────────────────────
    // The first screen of a brand-new app defines the design system, so it
    // renders alone. Everything after it (and every screen of a follow-up
    // generation, where the system already exists) renders in parallel
    // batches against the same frozen registry — N screens cost roughly the
    // time of two instead of N.
    let referenceFrames: FrameType[] = isExistingGeneration ? [...frames] : [];
    const produced: Record<number, FrameRow> = {};
    let queue = screens.map((_, i) => i);

    if (!componentRegistry && total > 0) {
      const first = await step.run("generate-screen-0", () =>
        renderScreen(0, {
          registry: null,
          identity: frozenAppIdentity,
          designContext,
          referenceFrames,
        }),
      );
      produced[0] = first;
      componentRegistry = buildComponentRegistry(first as FrameType, prompt);
      frozenAppIdentity = componentRegistry.appIdentity;
      referenceFrames = [...referenceFrames, first as FrameType];
      designContext = buildDesignContext(referenceFrames, analysisToUse.themeToUse);
      queue = queue.slice(1);
    }

    for (let b = 0; b < queue.length; b += PARALLEL_SCREENS) {
      const batch = queue.slice(b, b + PARALLEL_SCREENS);
      const ctx: RenderContext = {
        registry: componentRegistry,
        identity: frozenAppIdentity,
        designContext,
        referenceFrames,
      };
      const results = await Promise.all(
        batch.map((i) => step.run(`generate-screen-${i}`, () => renderScreen(i, ctx))),
      );
      results.forEach((frame, k) => {
        produced[batch[k]] = frame;
      });
      // Later batches get to see what earlier ones produced.
      referenceFrames = [...referenceFrames, ...(results as FrameType[])];
      designContext = buildDesignContext(referenceFrames, analysisToUse.themeToUse);
    }

    // Persist the design system so follow-up generations reuse the exact
    // same tokens, components, and identity (one product, not mockups).
    await step.run("save-design-context", async () => {
      await prisma.project.update({
        where: { id: projectId, userId },
        data: {
          designContext: JSON.parse(
            JSON.stringify({
              dna: designContext,
              registry: componentRegistry,
              appIdentity: frozenAppIdentity,
            }),
          ),
        },
      });
      return { saved: true, screens: Object.keys(produced).length };
    });

    await publish({
      channel: CHANNEL,
      topic: "generation.complete",
      data: {
        status: "completed",
        projectId: projectId,
      },
    });
  },
);
