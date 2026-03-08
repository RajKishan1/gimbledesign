import { generateObject, generateText, stepCountIs } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import { FrameType } from "@/types/project";
import { ANALYSIS_PROMPT, GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { unsplashTool } from "../tool";
import {
  buildDesignContext,
  generateFullContext,
  updateDesignContext,
  DesignContext,
} from "@/lib/design-context-manager";
import {
  AppIdentity,
  ComponentRegistry,
  buildComponentRegistry,
  updateRegistryIfNeeded,
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

// Fast model for analysis, quality model for generation
const FAST_MODEL = "google/gemini-3-flash-preview";
const QUALITY_MODEL = "google/gemini-3-pro-preview";

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

    // Use fast model for analysis, user-selected or quality model for generation
    const analysisModel = FAST_MODEL;
    const generationModel = model || QUALITY_MODEL;

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
          - Match the navigation patterns, visual style, and design system of the existing screens.
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

      const { object } = await generateObject({
        model: openrouter.chat(analysisModel),
        schema: FlexibleAppSchema,
        system: ANALYSIS_PROMPT,
        prompt: analysisPrompt,
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

    // PHASE 2: Sequential Generation with ENHANCED CONTEXT FIDELITY
    // Uses Component Registry (immutable) + Design DNA + Recent Screen approach
    const generatedFrames: typeof frames = isExistingGeneration
      ? [...frames]
      : [];
    const selectedTheme = THEME_LIST.find(
      (t) => t.id === analysisToUse.themeToUse,
    );
    const fullThemeCSS = `${BASE_VARIABLES}\n${selectedTheme?.style || ""}`;

    // Design Context - built from first screens, maintained throughout
    let designContext: DesignContext = isExistingGeneration
      ? buildDesignContext(frames, analysisToUse.themeToUse)
      : buildDesignContext([], analysisToUse.themeToUse);

    // Component Registry - stores exact HTML components for perfect consistency
    // Built after first screen, used for ALL subsequent screens
    let componentRegistry: ComponentRegistry | null =
      isExistingGeneration && frames.length > 0
        ? buildComponentRegistry(frames[0], prompt)
        : null;

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
    // If we already have frames (continuing generation), extract from existing first frame
    if (isExistingGeneration && frames.length > 0) {
      frozenAppIdentity = extractAppIdentity(
        (frames[0] as FrameType).htmlContent,
        (frames[0] as FrameType).title,
      );
    }

    // Theme lock — tells the AI exactly which theme is active and must never change
    const themeLockString = `THEME LOCK: "${selectedTheme?.name || analysisToUse.themeToUse}" — theme ID: ${analysisToUse.themeToUse}
All screens MUST use this theme's CSS variables unchanged. Do NOT introduce new colors, swap to a different palette, or change any CSS variable values.`;

    // Detect if user requested a specific design system
    const designSystemSpec = detectDesignSystem(prompt);
    const designSystemContext = designSystemSpec.detected
      ? `\n\n⚠️ DESIGN SYSTEM REQUIRED: ${designSystemSpec.name}\n${designSystemSpec.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nYou MUST follow these rules on EVERY screen.`
      : "";

    for (let i = 0; i < analysisToUse.screens.length; i++) {
      const screenPlan = analysisToUse.screens[i];

      await step.run(`generate-screen-${i}`, async () => {
        // After generating first screen, build Component Registry + upgrade identity from real HTML
        if (generatedFrames.length === 1 && !componentRegistry) {
          componentRegistry = buildComponentRegistry(
            generatedFrames[0] as FrameType,
            prompt,
          );
          // Upgrade from provisional (analysis appName) to HTML-extracted identity
          frozenAppIdentity = componentRegistry.appIdentity;
        }

        // After generating second screen, update registry if needed
        if (generatedFrames.length === 2 && componentRegistry) {
          componentRegistry = updateRegistryIfNeeded(
            componentRegistry,
            generatedFrames[1] as FrameType,
          );
        }

        // After generating first 2-3 screens, rebuild design context
        if (generatedFrames.length >= 2 && generatedFrames.length <= 3) {
          designContext = buildDesignContext(
            generatedFrames,
            analysisToUse.themeToUse,
          );
        }

        // Always build from frozenAppIdentity — available from screen 0 onwards
        const appIdentityString = generateAppIdentityString(frozenAppIdentity);

        // Generate context string based on whether we have a Component Registry
        let contextString: string;

        if (componentRegistry && i > 0) {
          // Use Component Registry for enhanced consistency
          const recentFrame =
            generatedFrames.length > 0
              ? (generatedFrames[generatedFrames.length - 1] as FrameType)
              : null;

          contextString = generateFullScreenContext(
            componentRegistry,
            recentFrame,
            i,
            screenPlan.name,
            analysisToUse.screens.length,
          );

          // Also include Design DNA for additional patterns
          contextString +=
            "\n\n" +
            generateFullContext(
              designContext,
              screenPlan,
              [], // Don't include recent frames again
              i,
              analysisToUse.screens.length,
            );
        } else if (designContext.isInitialized) {
          // Fallback to Design DNA approach
          const recentFrames = generatedFrames.slice(-2);
          contextString = generateFullContext(
            designContext,
            screenPlan,
            recentFrames,
            i,
            analysisToUse.screens.length,
          );
        } else {
          contextString = `No previous screens - this is the first screen. Establish the Design DNA (typography, spacing, colors, navigation patterns) that ALL subsequent screens will follow.${designSystemContext}`;
        }

        // Determine active navigation item
        const activeNavItem = componentRegistry?.navigation
          ? getActiveNavItem(screenPlan.name, componentRegistry.navigation)
          : null;
        const navActiveHint = activeNavItem
          ? `\n\nACTIVE NAVIGATION: For this screen ("${screenPlan.name}"), the active nav icon should be: ${activeNavItem}`
          : "";

        const result = await generateText({
          model: openrouter.chat(generationModel),
          system: GENERATION_SYSTEM_PROMPT,
          tools: {
            searchUnsplash: unsplashTool,
          },
          stopWhen: stepCountIs(5),
          prompt: `
          ${appIdentityString}

          ${themeLockString}

          - Screen ${i + 1}/${analysisToUse.screens.length}
          - Screen ID: ${screenPlan.id}
          - Screen Name: ${screenPlan.name}
          - Screen Purpose: ${screenPlan.purpose}

          VISUAL DESCRIPTION: ${screenPlan.visualDescription}
          ${designSystemContext}

          ${contextString}
          ${navActiveHint}

          THEME CSS VARIABLES (Reference ONLY - already defined in parent, do NOT redeclare):
          ${fullThemeCSS}

          ════════════════════════════════════════════════════════════════════════════
          GENERATION INSTRUCTIONS
          ════════════════════════════════════════════════════════════════════════════

          ${
            i === 0
              ? `
          **FIRST SCREEN - ESTABLISH DESIGN DNA:**
          You are creating the FOUNDATION for all subsequent screens. Every decision you make here will be replicated EXACTLY:
          - Typography hierarchy (heading sizes, body text, captions)
          - Spacing system (padding, margins, gaps)
          - Component patterns (cards, buttons, inputs)
          - Navigation pattern (bottom nav for main screens - use 5 icons consistently)
          - Icon choices (these EXACT icons will be used on ALL screens)
          - Visual style (shadows, borders, glass effects)

          Make deliberate, professional choices that will scale across 20+ screens.
          The navigation icons you choose here are LOCKED for the entire app.

          **BOTTOM NAV CONTRACT (LOCKED AFTER THIS SCREEN):**
          The bottom navigation bar you create here becomes the IMMUTABLE template.
          - Choose exactly 5 icons with appropriate Hugeicons names
          - Use: fixed bottom-6 left-6 right-6, h-16, z-30, rounded-full
          - Background: bg-[var(--card)]/80 backdrop-blur-xl shadow-2xl border border-[var(--border)]/50
          - Active: text-[var(--primary)] + drop-shadow-[0_0_4px_var(--primary)]
          - Inactive: text-[var(--muted-foreground)]
          - Every subsequent screen will copy this EXACTLY — only the active icon changes.
          `
              : `
          **MAINTAIN DESIGN DNA (CRITICAL - SCREEN ${i + 1} OF ${analysisToUse.screens.length}):**
          This screen MUST be indistinguishable in style from previous screens.

          MANDATORY REQUIREMENTS:
          1. BOTTOM NAV: Copy the EXACT same bottom navigation bar from Screen 1 — same icons, same order, same styling, same dimensions. ONLY change which icon is active for this screen.
          2. ICONS: Use ONLY the icons from Icon Lock - NO substitutions allowed
          3. TYPOGRAPHY: Same heading sizes, font weights, text colors
          4. SPACING: Same padding, margins, gaps as previous screens
          5. COMPONENTS: Same card, button, input styling
          6. THEME: Same colors, same CSS variables usage — no alternate palettes or opacity changes
          7. Only the CONTENT changes - the VISUAL FRAMEWORK stays IDENTICAL

          ⚠️ If you change the bottom navigation bar (icons, order, style, layout) or the theme, the app will look broken. This is the #1 consistency rule.
          `
          }

          **OUTPUT RULES:**
          1. Generate ONLY raw HTML starting with <div>
          2. Use Tailwind CSS for layout/spacing, CSS variables for colors
          3. Root: class="relative w-full h-screen bg-[var(--background)] overflow-hidden" — use h-screen NOT min-h-screen. The screen must fit within a single iPhone viewport (393×852px). Put scrollable content inside an inner container with flex-1 overflow-y-auto.
          4. Hidden scrollbars: [&::-webkit-scrollbar]:hidden scrollbar-none
          5. No markdown, comments, <html>, <body>, or <head>
          6. CONTENT DENSITY: Show only 3-5 cards/items in the visible area. Do NOT create endlessly tall pages with 10+ sections. Prioritize above-the-fold content.
          
          Generate the complete, production-ready HTML for this screen now.
      `.trim(),
        });

        let finalHtml = result.text ?? "";
        const match = finalHtml.match(/<div[\s\S]*<\/div>/);
        finalHtml = match ? match[0] : finalHtml;
        finalHtml = finalHtml.replace(/```/g, "");

        // Create the frame
        const frame = await prisma.frame.create({
          data: {
            projectId,
            title: screenPlan.name,
            htmlContent: finalHtml,
          },
        });

        // Add to generatedFrames for next iteration's context
        generatedFrames.push(frame);

        // Update design context (mainly updates screen graph after first 3)
        designContext = updateDesignContext(
          designContext,
          frame,
          generatedFrames,
        );

        await publish({
          channel: CHANNEL,
          topic: "frame.created",
          data: {
            frame: {
              ...frame,
              isLoading: false,
            },
            screenId: screenPlan.id,
            frameId: frame.id,
            projectId: projectId,
          },
        });

        return { success: true, frame: frame };
      });
    }

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
