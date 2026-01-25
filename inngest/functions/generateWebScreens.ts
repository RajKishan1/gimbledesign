import { generateObject, generateText, stepCountIs } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import { FrameType } from "@/types/project";
import { WEB_ANALYSIS_PROMPT, WEB_GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
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
  ComponentRegistry,
  buildComponentRegistry,
  updateRegistryIfNeeded,
  generateFullScreenContext,
  detectDesignSystem,
} from "@/lib/component-registry";

// Schema for individual screen
const ScreenSchema = z.object({
  id: z
    .string()
    .describe(
      "Unique identifier for the screen (e.g., 'home-dashboard', 'profile-settings', 'analytics-overview'). Use kebab-case."
    ),
  name: z
    .string()
    .describe(
      "Short, descriptive name of the screen (e.g., 'Home Dashboard', 'Profile', 'Analytics Overview')"
    ),
  purpose: z
    .string()
    .describe(
      "One clear sentence explaining what this screen accomplishes for the user and its role in the application"
    ),
  visualDescription: z
    .string()
    .describe(
      "A dense, high-fidelity visual directive for desktop web interface. Describe the layout (sidebar navigation, top navbar, content area), specific data examples, component hierarchy, grid systems, and physical attributes suitable for 1440px width displays."
    ),
});

// Flexible schema that adapts to user's request
const FlexibleAppSchema = z.object({
  theme: z
    .string()
    .describe(
      "The specific visual theme ID (e.g., 'midnight', 'ocean-breeze', 'neo-brutalism')."
    ),
  appName: z
    .string()
    .describe(
      "A catchy, memorable name for the web application based on the user's request."
    ),
  totalScreenCount: z
    .number()
    .min(1)
    .max(20)
    .describe("Exact number of screens requested by user or appropriate for the app scope."),
  screens: z
    .array(ScreenSchema)
    .min(1)
    .max(20)
    .describe(
      "Screens matching the user's request. Generate the exact number and types of screens they asked for."
    ),
});

// Fast model for analysis, quality model for generation
const FAST_MODEL = "google/gemini-3-flash-preview";
const QUALITY_MODEL = "google/gemini-3-pro-preview";

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

      const contextSummary = isExistingGeneration
        ? `Existing web app with ${frames.length} screens. Theme: ${existingTheme}. 
           Screen names: ${frames.map((f: FrameType) => f.title).join(", ")}.
           Maintain exact same sidebar, navigation, design patterns, and visual style.`
        : "";

      const analysisPrompt = isExistingGeneration
        ? `
          USER REQUEST: ${prompt}
          SELECTED THEME: ${existingTheme}

          ${contextSummary}

         CRITICAL REQUIREMENTS - MAINTAIN DETAILED CONTEXT:
          - Generate NEW screens that seamlessly blend with existing ones
          - Match the sidebar navigation and design system already established
          - Context awareness: Each new screen must maintain consistency with ALL previous screens
          - Design system: All screens must share the same design language and component patterns
        `.trim()
        : `
          USER REQUEST: ${prompt}

          =====================================================
          CRITICAL: READ THE USER'S REQUEST CAREFULLY
          =====================================================
          
          ANALYZE THE USER'S PROMPT TO DETERMINE:
          1. How many screens they want (look for numbers like "4 screens", "12 screens", "6 screens", etc.)
          2. What type of screens they need (specific features vs complete app)
          3. Whether they mentioned authentication, dashboard, or specific flows
          
          RULES FOR SCREEN GENERATION:
          - If user specifies a number (e.g., "4 screens", "12 screens"), generate EXACTLY that many
          - If user asks for specific screens (e.g., "dashboard and analytics"), generate only those
          - If user asks for a "complete web app" without specifying count, generate 8-15 screens with:
            * Authentication (login, signup) if the app needs user accounts
            * Dashboard/Home as the main screen
            * Core feature screens (the main functionality)
            * Supporting screens (settings, profile, admin) if relevant
          - If user asks for "single screen" or "one screen", generate exactly 1 screen
          
          FLEXIBILITY IS KEY:
          - NOT all web apps need authentication (e.g., landing pages, documentation sites)
          - NOT all web apps need admin panels
          - Focus on what the user ACTUALLY requested
          - Don't force a structure that doesn't fit the request
          
          Set totalScreenCount based on the user's actual request, not a predetermined formula.
        `.trim();

      const { object } = await generateObject({
        model: openrouter.chat(analysisModel),
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

    // PHASE 2: Sequential Generation with ENHANCED CONTEXT FIDELITY
    // Uses Component Registry (immutable) + Design DNA + Recent Screen approach
    const generatedFrames: typeof frames = isExistingGeneration ? [...frames] : [];
    const selectedTheme = THEME_LIST.find((t) => t.id === analysis.themeToUse);
    const fullThemeCSS = `${BASE_VARIABLES}\n${selectedTheme?.style || ""}`;

    // Design Context - built from first screens, maintained throughout
    let designContext: DesignContext = isExistingGeneration
      ? buildDesignContext(frames, analysis.themeToUse)
      : buildDesignContext([], analysis.themeToUse);

    // Component Registry - stores exact HTML components for perfect consistency
    // Built after first screen, used for ALL subsequent screens
    let componentRegistry: ComponentRegistry | null = isExistingGeneration && frames.length > 0
      ? buildComponentRegistry(frames[0], prompt)
      : null;

    // Detect if user requested a specific design system
    const designSystemSpec = detectDesignSystem(prompt);
    const designSystemContext = designSystemSpec.detected 
      ? `

╔══════════════════════════════════════════════════════════════════════════════╗
║  DESIGN SYSTEM REQUIRED: ${designSystemSpec.name?.toUpperCase()}
╚══════════════════════════════════════════════════════════════════════════════╝

You MUST follow these rules on EVERY screen:
${designSystemSpec.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

⚠️  VIOLATION OF THESE RULES WILL BREAK DESIGN CONSISTENCY
`
      : '';

    for (let i = 0; i < analysis.screens.length; i++) {
      const screenPlan = analysis.screens[i];

      await step.run(`generate-screen-${i}`, async () => {
        // After generating first screen, build Component Registry
        if (generatedFrames.length === 1 && !componentRegistry) {
          componentRegistry = buildComponentRegistry(generatedFrames[0] as FrameType, prompt);
        }
        
        // After generating second screen, update registry if needed
        if (generatedFrames.length === 2 && componentRegistry) {
          componentRegistry = updateRegistryIfNeeded(componentRegistry, generatedFrames[1] as FrameType);
        }

        // After generating first 2-3 screens, rebuild design context
        if (generatedFrames.length >= 2 && generatedFrames.length <= 3) {
          designContext = buildDesignContext(generatedFrames, analysis.themeToUse);
        }

        // Generate context string based on whether we have a Component Registry
        let contextString: string;
        
        if (componentRegistry && i > 0) {
          // Use Component Registry for enhanced consistency
          const recentFrame = generatedFrames.length > 0 
            ? generatedFrames[generatedFrames.length - 1] as FrameType 
            : null;
          
          contextString = generateFullScreenContext(
            componentRegistry,
            recentFrame,
            i,
            screenPlan.name,
            analysis.screens.length
          );
          
          // Also include Design DNA for additional patterns
          contextString += '\n\n' + generateFullContext(
            designContext,
            screenPlan,
            [], // Don't include recent frames again
            i,
            analysis.screens.length
          );
        } else if (designContext.isInitialized) {
          // Fallback to Design DNA approach
          const recentFrames = generatedFrames.slice(-2);
          contextString = generateFullContext(
            designContext,
            screenPlan,
            recentFrames,
            i,
            analysis.screens.length
          );
        } else {
          contextString = `No previous screens - this is the first screen. Establish the Design DNA that ALL subsequent screens will follow.`;
        }

        // Determine which sidebar item should be active
        const sidebarActiveHint = componentRegistry?.sidebar 
          ? `\n\nACTIVE SIDEBAR ITEM: For this screen ("${screenPlan.name}"), highlight the appropriate sidebar navigation item.`
          : '';

        const result = await generateText({
          model: openrouter.chat(generationModel),
          system: WEB_GENERATION_SYSTEM_PROMPT,
          tools: {
            searchUnsplash: unsplashTool,
          },
          stopWhen: stepCountIs(5),
          prompt: `
          - Screen ${i + 1}/${analysis.screens.length}
          - Screen ID: ${screenPlan.id}
          - Screen Name: ${screenPlan.name}
          - Screen Purpose: ${screenPlan.purpose}

          VISUAL DESCRIPTION: ${screenPlan.visualDescription}
          ${designSystemContext}

          ${contextString}
          ${sidebarActiveHint}

          THEME CSS VARIABLES (Reference ONLY - already defined in parent, do NOT redeclare):
          ${fullThemeCSS}

          ════════════════════════════════════════════════════════════════════════════
          WEB DESKTOP INTERFACE INSTRUCTIONS (1440px WIDTH)
          ════════════════════════════════════════════════════════════════════════════

          ${i === 0 ? `
          **FIRST SCREEN - ESTABLISH DESIGN DNA:**
          You are creating the FOUNDATION for all subsequent web screens. Every decision you make here will be replicated:
          - Sidebar navigation structure (items, icons, styling) - THESE ARE LOCKED
          - Typography hierarchy (heading sizes, body text, captions)
          - Spacing system (padding, margins, gaps - use 16px, 24px, 32px, 48px scale)
          - Component patterns (cards, buttons, tables, inputs)
          - Visual style (shadows, borders, hover states)
          
          Make deliberate, professional choices that will scale across all screens.
          The sidebar items and icons you choose here are LOCKED for the entire app.
          ` : `
          **MAINTAIN DESIGN DNA (CRITICAL - SCREEN ${i + 1} OF ${analysis.screens.length}):**
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
          `}

          **LAYOUT STRUCTURE:**
          - Root: \`relative w-full min-h-screen flex\`
          - Sidebar: \`fixed left-0 top-0 h-screen w-64 bg-[var(--card)]\`
          - Main: \`flex-1 ml-64 p-8\`

          **OUTPUT RULES:**
          1. Generate ONLY raw HTML starting with <div>
          2. Use Tailwind CSS for layout/spacing, CSS variables for colors
          3. No markdown, comments, <html>, <body>, or <head>
          
          Generate the complete, production-ready HTML for this web screen now.
      `.trim(),
        });

        let finalHtml = result.text ?? "";
        const match = finalHtml.match(/<div[\s\S]*<\/div>/);
        finalHtml = match ? match[0] : finalHtml;
        finalHtml = finalHtml.replace(/```/g, "");

        const frame = await prisma.frame.create({
          data: {
            projectId,
            title: screenPlan.name,
            htmlContent: finalHtml,
          },
        });

        generatedFrames.push(frame);

        // Update design context
        designContext = updateDesignContext(
          designContext,
          frame,
          generatedFrames
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
  }
);
