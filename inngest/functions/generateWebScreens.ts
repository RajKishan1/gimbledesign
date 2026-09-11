import { generateText, stepCountIs } from "ai";
import { DEFAULT_MODEL } from "@/constant/models";
import { inngest } from "../client";
import { z } from "zod";
import { llm, generateStructured } from "@/lib/llm";
import { FrameType } from "@/types/project";
import {
  WEB_ANALYSIS_PROMPT,
  WEB_GENERATION_SYSTEM_PROMPT,
} from "@/lib/prompt";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { imageTools } from "../tool";
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
} from "@/lib/component-registry";
import { parseScreenCountFromPrompt } from "@/lib/parse-screen-count";

// Schema for individual screen
const ScreenSchema = z.object({
  id: z
    .string()
    .describe(
      "Unique identifier for the screen (e.g., 'home-dashboard', 'profile-settings', 'analytics-overview'). Use kebab-case.",
    ),
  name: z
    .string()
    .describe(
      "Short, descriptive name of the screen (e.g., 'Home Dashboard', 'Profile', 'Analytics Overview')",
    ),
  purpose: z
    .string()
    .describe(
      "One clear sentence explaining what this screen accomplishes for the user and its role in the application",
    ),
  visualDescription: z
    .string()
    .describe(
      "A dense, high-fidelity visual directive for desktop web interface. Describe the layout (sidebar navigation, top navbar, content area), specific data examples, component hierarchy, grid systems, and physical attributes suitable for 1440px width displays.",
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
      "A catchy, memorable name for the web application based on the user's request.",
    ),
  totalScreenCount: z
    .number()
    .min(1)
    .max(24)
    .describe(
      "Number of screens to generate. Default is 3-4 unless user explicitly requested more.",
    ),
  screens: z
    .array(ScreenSchema)
    .min(1)
    .max(24)
    .describe(
      "Screens to generate. Default 3-4 core screens only. Generate more ONLY if user explicitly requested a specific count or named specific screens.",
    ),
});

// Fast model for analysis, quality model for generation
const FAST_MODEL = "google:gemini@3.5-flash";
const QUALITY_MODEL = DEFAULT_MODEL;

export const generateWebScreens = inngest.createFunction(
  { id: "generate-web-screens" },
  { event: "ui/generate.web-screens" },
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

    // Use fast model for analysis, user-selected or quality model for generation
    const analysisModel = FAST_MODEL;
    const generationModel = model || QUALITY_MODEL;

    // Palette lock — follow-ups must match the colours already on the canvas
    // even if the first generation hardcoded them (see lib/palette-lock.ts).
    const existingPalette = isExistingGeneration
      ? analyzePalette((frames as FrameType[]).map((f) => f.htmlContent))
      : null;
    const existingThemeName =
      THEME_LIST.find((t) => t.id === existingTheme)?.name ?? String(existingTheme ?? "");
    const paletteLock = existingPalette
      ? buildPaletteLockString(existingPalette, existingThemeName)
      : "";
    const enforceThemeVariables = !existingPalette || existingPalette.mode === "theme";

    await publish({
      channel: CHANNEL,
      topic: "generation.start",
      data: {
        status: "running",
        projectId: projectId,
      },
    });

    // PHASE 1: Analysis (using fast model)
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
          - Match the sidebar navigation, visual style, and design system of the existing screens.
          ${paletteLock ? `\n          ${paletteLock.replace(/\n/g, "\n          ")}\n          In every visualDescription refer to these existing colours by role — never invent a new palette.\n` : ""}
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
          2. Whether they named specific screens or sections
          3. Whether they explicitly asked for login, signup, or auth flows

          RULES FOR SCREEN GENERATION:
          - If user specifies an exact number (e.g., "4 screens", "6 screens"), generate EXACTLY that many
          - If user names specific screens (e.g., "dashboard and analytics"), generate only those
          - If user asks for "single screen" or "one screen", generate exactly 1 screen

          DEFAULT (no count or specific screens mentioned): generate 3-4 CORE screens ONLY:
            * Screen 1: The primary dashboard / home screen (the main view users land on)
            * Screen 2-3: The 2–3 screens directly reachable from the top navbar or sidebar nav
            * Screen 4 (optional): One additional core-feature screen if clearly implied by the prompt
            * STOP there — do NOT pad with extra screens

          STRICT EXCLUSIONS (unless the user explicitly mentions them in the prompt):
            ✗ NO login or signup screens
            ✗ NO authentication or onboarding flows
            ✗ NO admin panels (unless explicitly requested)
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
        system: WEB_ANALYSIS_PROMPT,
        prompt: analysisPrompt,
      });

      const themeToUse = isExistingGeneration ? existingTheme : object.theme;

      if (!isExistingGeneration) {
        await prisma.project.update({
          where: {
            id: projectId,
            userId: userId,
          },
          data: {
            theme: themeToUse,
            deviceType: "web",
          },
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

    // PHASE 2: Sequential Generation with ENHANCED CONTEXT FIDELITY
    // Uses Component Registry (immutable) + Design DNA + Recent Screen approach
    const generatedFrames: typeof frames = isExistingGeneration
      ? [...frames]
      : [];
    const selectedTheme = THEME_LIST.find(
      (t) => t.id === analysisToUse.themeToUse,
    );
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

    // Design Context - stored tokens first, else derived from existing frames
    let designContext: DesignContext = isExistingGeneration
      ? (storedDesign?.dna ?? buildDesignContext(frames, analysisToUse.themeToUse))
      : buildDesignContext([], analysisToUse.themeToUse);

    // Component Registry - stores exact HTML components for perfect consistency
    // Built after first screen, used for ALL subsequent screens
    let componentRegistry: ComponentRegistry | null =
      storedDesign?.registry ??
      (isExistingGeneration && frames.length > 0
        ? buildComponentRegistry(frames[0], prompt)
        : null);

    // Provisional identity from analysis appName — available from screen 0.
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

    // Colour contract — theme lock for variable-driven apps, literal palette otherwise.
    const themeLockString = enforceThemeVariables
      ? `THEME LOCK: "${selectedTheme?.name || analysisToUse.themeToUse}" — theme ID: ${analysisToUse.themeToUse}
All colours come from this theme's CSS variables — no hex codes, no Tailwind palette classes, no font-['…'] classes. Do NOT introduce new colours or swap palettes.${paletteLock ? `\n\n${paletteLock}` : ""}`
      : `${paletteLock}

NOTE: the existing screens of this app do NOT use theme CSS variables. Do not introduce var(--…) colours here either — copy the literal palette above so every screen matches.`;

    // Detect if user requested a specific design system
    const designSystemSpec = detectDesignSystem(prompt);
    const designSystemContext = designSystemSpec.detected
      ? `

╔══════════════════════════════════════════════════════════════════════════════╗
║  DESIGN SYSTEM REQUIRED: ${designSystemSpec.name?.toUpperCase()}
╚══════════════════════════════════════════════════════════════════════════════╝

You MUST follow these rules on EVERY screen:
${designSystemSpec.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

⚠️  VIOLATION OF THESE RULES WILL BREAK DESIGN CONSISTENCY
`
      : "";

    const totalScreens = analysisToUse.screens.length;
    const basePosition = isExistingGeneration ? frames.length : 0;
    const PARALLEL_SCREENS = 3;

    type RenderContext = {
      registry: ComponentRegistry | null;
      identity: AppIdentity;
      designContext: DesignContext;
      referenceFrames: FrameType[];
    };

    // ── One web screen ───────────────────────────────────────────────────────
    const renderScreen = async (i: number, ctx: RenderContext) => {
      const screenPlan = analysisToUse.screens[i];
      const appIdentityString = generateAppIdentityString(ctx.identity);

      let contextString: string;
      if (ctx.registry) {
        const last = ctx.referenceFrames[ctx.referenceFrames.length - 1] ?? null;
        const recentFrame =
          last && last.title !== ctx.registry.sourceScreenTitle ? last : null;
        contextString =
          generateFullScreenContext(ctx.registry, recentFrame, Math.max(i, 1), screenPlan.name, totalScreens) +
          "\n\n" +
          generateFullContext(ctx.designContext, screenPlan, [], i, totalScreens);
      } else if (ctx.designContext.isInitialized) {
        contextString = generateFullContext(
          ctx.designContext,
          screenPlan,
          ctx.referenceFrames.slice(-2),
          i,
          totalScreens,
        );
      } else {
        contextString = `No previous screens - this is the first screen. Establish the Design DNA that ALL subsequent screens will follow.`;
      }

      const sidebarActiveHint = ctx.registry?.sidebar
        ? `\n\nACTIVE SIDEBAR ITEM: For this screen ("${screenPlan.name}"), highlight the appropriate sidebar navigation item.`
        : "";
      const isFoundation = !ctx.registry;

      const result = await generateText({
        model: llm.chat(generationModel),
        system: WEB_GENERATION_SYSTEM_PROMPT,
        tools: imageTools(),
        stopWhen: stepCountIs(3),
        maxOutputTokens: 16_000,
        prompt: `
          ${appIdentityString}

          ${themeLockString}

          - Screen ${i + 1}/${totalScreens}
          - Screen ID: ${screenPlan.id}
          - Screen Name: ${screenPlan.name}
          - Screen Purpose: ${screenPlan.purpose}

          VISUAL DESCRIPTION: ${scrubColorSpecs(screenPlan.visualDescription)}
          ${designSystemContext}

          ${contextString}
          ${sidebarActiveHint}

          ${
            enforceThemeVariables
              ? `THEME CSS VARIABLES (Reference ONLY - already defined in parent, do NOT redeclare):\n${fullThemeCSS}`
              : "(Theme CSS variables intentionally omitted — this app's screens use the literal palette from the PALETTE LOCK.)"
          }

          IMAGES: avatars use https://i.pravatar.cc/150?u=<unique-name>; photos use https://picsum.photos/seed/<descriptive-slug>/<width>/<height> inside a fixed-aspect box with object-cover. Never invent other image hosts.

          ════════════════════════════════════════════════════════════════════════════
          WEB DESKTOP INTERFACE INSTRUCTIONS (1440px WIDTH)
          ════════════════════════════════════════════════════════════════════════════

          ${
            isFoundation
              ? `
          **FIRST SCREEN - ESTABLISH DESIGN DNA:**
          You are creating the FOUNDATION for all subsequent web screens. Every decision you make here will be replicated:
          - Sidebar navigation structure (items, icons, styling) - THESE ARE LOCKED
          - Typography hierarchy (heading sizes, body text, captions)
          - Spacing system (padding, margins, gaps - use 16px, 24px, 32px, 48px scale)
          - Component patterns (cards, buttons, tables, inputs)
          - Visual style (shadows, borders, hover states)

          Make deliberate, professional choices that will scale across all screens.
          The sidebar items and icons you choose here are LOCKED for the entire app.
          `
              : `
          **MAINTAIN DESIGN DNA (CRITICAL - SCREEN ${i + 1} OF ${totalScreens}):**
          This screen MUST be indistinguishable in style from previous screens.

          MANDATORY REQUIREMENTS:
          1. SIDEBAR: Copy EXACTLY from Component Registry - same items, icons, order, styling
          2. HEADER: Use same header structure and elements
          3. ICONS: Use ONLY icons from Icon Lock - NO substitutions
          4. TYPOGRAPHY: Same heading sizes, font weights, text colors
          5. SPACING: Same padding, margins, gaps (16px, 24px, 32px, 48px scale)
          6. Only the main CONTENT area changes - sidebar and chrome stay IDENTICAL
          7. Highlight the appropriate sidebar item for "${screenPlan.name}"

          ⚠️ If you change sidebar items, icons, or styling, the app will look broken.
          `
          }

          **LAYOUT STRUCTURE:**
          - Root: \`relative w-full min-h-screen flex\`
          - Sidebar: \`fixed left-0 top-0 h-screen w-64 bg-[var(--card)]\`
          - Main: \`flex-1 ml-64 p-8\`

          **OUTPUT RULES:**
          1. Generate ONLY raw HTML starting with <div>
          2. Use Tailwind CSS for layout/spacing, CSS variables for colors
          3. No markdown, comments, <html>, <body>, or <head>
          4. Keep it lean: one focal section, 3–6 rows per table/list, icons via <iconify-icon> only (no inline SVG except charts)

          Generate the complete, production-ready HTML for this web screen now.
      `.trim(),
      });

      let finalHtml = result.text ?? "";
      const match = finalHtml.match(/<div[\s\S]*<\/div>/);
      finalHtml = match ? match[0] : finalHtml;
      finalHtml = finalHtml.replace(/```/g, "");

      // Keep new screens variable-driven so theme switching and later
      // follow-ups stay consistent (see lib/theme-conformance.ts).
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

      // Step outputs are JSON-serialised by Inngest, so keep them Date-free.
      const row: { id: string; title: string; htmlContent: string; projectId: string; position: number | null } = {
        id: frame.id,
        title: frame.title,
        htmlContent: frame.htmlContent,
        projectId: frame.projectId,
        position: frame.position,
      };
      return row;
    };

    // First screen alone when the design system does not exist yet; then
    // parallel batches against the frozen registry.
    let referenceFrames: FrameType[] = isExistingGeneration ? [...frames] : [];
    let queue = analysisToUse.screens.map((_: unknown, i: number) => i);

    if (!componentRegistry && totalScreens > 0) {
      const first = await step.run("generate-screen-0", () =>
        renderScreen(0, {
          registry: null,
          identity: frozenAppIdentity,
          designContext,
          referenceFrames,
        }),
      );
      generatedFrames.push(first);
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
        batch.map((i: number) => step.run(`generate-screen-${i}`, () => renderScreen(i, ctx))),
      );
      generatedFrames.push(...results);
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
      return { saved: true };
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
