import { generateObject, generateText, stepCountIs } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import { FrameType } from "@/types/project";
import { WEB_ANALYSIS_PROMPT, WEB_GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { unsplashTool } from "../tool";

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

// Schema for COMPLETE web app - enforces minimum 8 screens
const CompleteAppSchema = z.object({
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
    .min(8)
    .max(20)
    .describe("Total screens to generate. MUST be 10-15 for complete web app."),
  screens: z
    .array(ScreenSchema)
    .min(8)
    .max(20)
    .describe(
      "MANDATORY 8-20 screens: 2-3 auth + 6-10 core features + 3-5 secondary screens."
    ),
});

// Schema for single/few screens (only used when explicitly requested)
const SingleScreenSchema = z.object({
  theme: z
    .string()
    .describe(
      "The specific visual theme ID (e.g., 'midnight', 'ocean-breeze', 'neo-brutalism')."
    ),
  screens: z
    .array(ScreenSchema)
    .min(1)
    .max(4)
    .describe("1-4 screens as explicitly requested by user."),
});

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
    const selectedModel = model || "google/gemini-3-pro-preview";

    await publish({
      channel: CHANNEL,
      topic: "generation.start",
      data: {
        status: "running",
        projectId: projectId,
      },
    });

    //Analyze or plan
    const analysis = await step.run("analyze-and-plan-screens", async () => {
      await publish({
        channel: CHANNEL,
        topic: "analysis.start",
        data: {
          status: "analyzing",
          projectId: projectId,
        },
      });

      const contextHTML = isExistingGeneration
        ? frames
            .map(
              (frame: FrameType) =>
                `<!-- ${frame.title} -->\n${frame.htmlContent}`
            )
            .join("\n\n")
        : "";

      // Check if user explicitly wants just one or few screens
      const wantsSingleScreen =
        /\b(one screen|single screen|just one|only one|1 screen)\b/i.test(
          prompt
        );

      const analysisPrompt = isExistingGeneration
        ? `
          USER REQUEST: ${prompt}
          SELECTED THEME: ${existingTheme}

          EXISTING SCREENS (analyze for consistency, navigation, layout, design system):
          ${contextHTML}

         CRITICAL REQUIREMENTS - MAINTAIN DETAILED CONTEXT:
          - **Analyze ALL existing screens' layout, navigation patterns, and design system
          - **Extract the EXACT sidebar navigation structure, menu items, and styling - MUST reuse identically
          - **Identify common components (cards, buttons, headers, spacing patterns) for exact reuse
          - **Maintain the same visual hierarchy, spacing scale, typography, and color usage
          - **Generate new screens that seamlessly blend - users should see perfect visual continuity
          - **Context awareness: Each new screen must reference and maintain consistency with ALL previous screens
          - **Design system: All screens must share the same design language and component patterns
        `.trim()
        : `
          USER REQUEST: ${prompt}

          =====================================================
          CRITICAL: YOU MUST GENERATE EXACTLY 10-15 SCREENS
          =====================================================
          
          This is a COMPLETE web application. You are generating the ENTIRE app, not just a preview.
          
          MANDATORY SCREEN STRUCTURE (10-15 screens total):
          
          1. AUTHENTICATION (2-3 screens - REQUIRED if login needed):
             - Screen 1: Login - Email/password, social login options
             - Screen 2: Sign Up - Registration form
             - Screen 3: Forgot Password (optional) - Email input for reset
          
          2. CORE FEATURES (6-10 screens - based on app type):
             - Screen 1: Dashboard/Home - Main application screen with overview
             - Screen 2-8: All primary feature screens (lists, details, actions, analytics)
             - Think about EVERY major feature the web app would have
          
          3. SECONDARY FEATURES (3-5 screens - REQUIRED):
             - Settings/Preferences screen
             - User Profile screen
             - Help/Documentation screen
             - Admin/Management screen (if applicable)
             - Reports/Analytics screen (if applicable)
          
          SET totalScreenCount TO: 10, 12, 13, or 15
          
          DO NOT generate only 3-4 screens. That is WRONG.
          The schema REQUIRES minimum 8 screens. Generate 10-15.
        `.trim();

      // Use appropriate schema based on request type
      const schemaToUse =
        isExistingGeneration || wantsSingleScreen
          ? SingleScreenSchema
          : CompleteAppSchema;

      const { object } = await generateObject({
        model: openrouter.chat(selectedModel),
        schema: schemaToUse,
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

    // Actual generation of each screen
    const generatedFrames: typeof frames = isExistingGeneration
      ? [...frames]
      : [];

    for (let i = 0; i < analysis.screens.length; i++) {
      const screenPlan = analysis.screens[i];
      const selectedTheme = THEME_LIST.find(
        (t) => t.id === analysis.themeToUse
      );

      //Combine the Theme Styles + Base Variable
      const fullThemeCSS = `
        ${BASE_VARIABLES}
        ${selectedTheme?.style || ""}
      `;

      // Get all previous existing or generated frames
      const allPreviousFrames = generatedFrames.slice(0, i);
      const previousFramesContext = allPreviousFrames
        .map((f: FrameType) => `<!-- ${f.title} -->\n${f.htmlContent}`)
        .join("\n\n");

      await step.run(`generated-screen-${i}`, async () => {
        const result = await generateText({
          model: openrouter.chat(selectedModel),
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

          EXISTING SCREENS CONTEXT (CRITICAL - MAINTAIN CONSISTENCY):
          ${
            previousFramesContext ||
            "No previous screens - this is the first screen"
          }

          THEME VARIABLES (Reference ONLY - already defined in parent, do NOT redeclare these):
          ${fullThemeCSS}

        CRITICAL REQUIREMENTS - WEB DESKTOP INTERFACE (1440px WIDTH):

        **CONTEXT MAINTENANCE (HIGHEST PRIORITY):**
        - **If previous screens exist:** You MUST extract and EXACTLY reuse their design patterns:
          - Copy the EXACT sidebar navigation structure, menu items, and styling - do NOT recreate or modify it
          - Extract header/navbar components and reuse their exact styling
          - Reuse card designs, button styles, spacing patterns from previous screens
          - Maintain the exact same visual hierarchy, spacing scale, and color usage
          - Use the same icon sizes and styles
          - Keep typography hierarchy consistent
        - **This screen MUST look like it belongs in the same app** - users should see seamless visual continuity
        - **Design System Consistency:** All screens share the same design language, components, and patterns

        **PROFESSIONAL WEB DESIGN STANDARDS:**
        - Desktop-first layout optimized for 1440px width
        - Use sidebar navigation (fixed left side, typically 240-280px wide) OR top navbar with horizontal menu
        - Main content area should utilize the full remaining width
        - Grid systems: Use CSS Grid or Flexbox for responsive layouts
        - Generous whitespace and professional spacing (16px, 24px, 32px, 48px scale)
        - Modern, clean aesthetics - subtle shadows, purposeful gradients
        - Clear visual hierarchy - primary content prominent, secondary content subtle
        - Use modern Lucide icons exclusively
        - Ensure proper hover states for all interactive elements

        1. **Generate ONLY raw HTML markup for this web application screen using Tailwind CSS.**
          Use Tailwind classes for layout, spacing, typography, shadows, etc.
          Use theme CSS variables ONLY for color-related properties (bg-[var(--background)], text-[var(--foreground)], border-[var(--border)], ring-[var(--ring)], etc.)
        2. **Layout structure for web (1440px):**
          - Root: \`relative w-full min-h-screen flex\` (for sidebar + content layout)
          - Sidebar (if applicable): \`fixed left-0 top-0 h-screen w-64 bg-[var(--card)]\` with navigation items
          - Main content: \`flex-1 ml-64\` (if sidebar exists) or full width
          - Top navbar (if no sidebar): \`fixed top-0 left-0 right-0 h-16 bg-[var(--card)]\`
        3. **All content must be inside proper semantic HTML structure.**
          - Use proper sections, headers, main, aside tags
          - Scrollable content in inner containers with hidden scrollbars: [&::-webkit-scrollbar]:hidden scrollbar-none
        4. **For regular content:**
          - Use \`w-full min-h-screen\` on the main container
        5. **For z-index layering:**
          - Sidebar/navbar: z-40, Dropdowns: z-50, Modals: z-60
        6. **Output raw HTML only, starting with <div>.**
          - Do not include markdown, comments, <html>, <body>, or <head>
        7. **Ensure desktop-optimized rendering:**
          - Multi-column layouts where appropriate
          - Data tables with proper structure
          - Charts and visualizations sized for desktop viewing
        Generate the complete, production-ready HTML for this web screen now
      `.trim(),
        });

        let finalHtml = result.text ?? "";
        const match = finalHtml.match(/<div[\s\S]*<\/div>/);
        finalHtml = match ? match[0] : finalHtml;
        finalHtml = finalHtml.replace(/```/g, "");

        //Create the frame
        const frame = await prisma.frame.create({
          data: {
            projectId,
            title: screenPlan.name,
            htmlContent: finalHtml,
          },
        });

        // Add to generatedFrames for next iteration's context
        generatedFrames.push(frame);

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
