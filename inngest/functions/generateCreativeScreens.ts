import { generateObject, generateText, stepCountIs } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import { FrameType } from "@/types/project";
import { CREATIVE_ANALYSIS_PROMPT, CREATIVE_GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { unsplashTool } from "../tool";

// Schema for individual creative screen
const CreativeScreenSchema = z.object({
  id: z
    .string()
    .describe(
      "Unique identifier for the creative (e.g., 'hero-shot', 'feature-tracking', 'social-proof'). Use kebab-case."
    ),
  name: z
    .string()
    .describe(
      "Short, descriptive name of the creative (e.g., 'Hero Shot', 'Track Your Progress', 'Social Proof')"
    ),
  purpose: z
    .string()
    .describe(
      "One clear sentence explaining what this creative accomplishes in the marketing sequence"
    ),
  visualDescription: z
    .string()
    .describe(
      "A dense, high-fidelity visual directive for marketing creative. Describe the background (gradient, colors), headline text, device mockup placement, what UI to show inside the device, and overall composition."
    ),
});

// Schema for creative set
const CreativeSetSchema = z.object({
  theme: z
    .string()
    .describe(
      "The specific visual theme ID (e.g., 'midnight', 'ocean-breeze', 'neo-brutalism')."
    ),
  appName: z
    .string()
    .describe(
      "The name of the app or product these creatives are for."
    ),
  creativeType: z
    .enum(["app-store", "social-media", "marketing-banner", "mixed"])
    .describe("The type of creative set being generated."),
  totalScreenCount: z
    .number()
    .min(1)
    .max(10)
    .describe("Exact number of creatives to generate."),
  screens: z
    .array(CreativeScreenSchema)
    .min(1)
    .max(10)
    .describe(
      "Creative screens/visuals to generate. Typically 5-8 for App Store screenshots."
    ),
});

export const generateCreativeScreens = inngest.createFunction(
  { id: "generate-creative-screens" },
  { event: "ui/generate.creative-screens" },
  async ({ event, step, publish }) => {
    const {
      userId,
      projectId,
      prompt,
      model,
      frames,
      theme: existingTheme,
      dimensions,
    } = event.data;
    const CHANNEL = `user:${userId}`;
    const isExistingGeneration = Array.isArray(frames) && frames.length > 0;
    const selectedModel = model || "google/gemini-3-pro-preview";

    // Default dimensions for App Store screenshots (iPhone)
    const screenDimensions = dimensions || { width: 1290, height: 2796 };

    await publish({
      channel: CHANNEL,
      topic: "generation.start",
      data: {
        status: "running",
        projectId: projectId,
      },
    });

    // Analyze or plan creative set
    const analysis = await step.run("analyze-and-plan-creatives", async () => {
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

      const analysisPrompt = isExistingGeneration
        ? `
          USER REQUEST: ${prompt}
          SELECTED THEME: ${existingTheme}
          DIMENSIONS: ${screenDimensions.width}x${screenDimensions.height}px

          EXISTING CREATIVES (analyze for brand consistency):
          ${contextHTML}

          CRITICAL REQUIREMENTS - MAINTAIN BRAND CONSISTENCY:
          - **Analyze ALL existing creatives' color palette, typography, and visual style
          - **Extract the EXACT gradient colors, headline styling, and device mockup treatment
          - **Maintain consistent branding across all new creatives
          - **New creatives must seamlessly match the existing visual language
        `.trim()
        : `
          USER REQUEST: ${prompt}
          DIMENSIONS: ${screenDimensions.width}x${screenDimensions.height}px

          ANALYZE THE USER'S PROMPT TO DETERMINE:
          1. What type of creatives they want (App Store screenshots, social media, banners)
          2. How many screens they need (typically 5-8 for App Store)
          3. What features or benefits to highlight
          
          RULES FOR CREATIVE GENERATION:
          - If user specifies a number, generate EXACTLY that many
          - If user asks for "App Store screenshots" without count, generate 5-8
          - If user asks for social media, generate 3-6
          - Plan a cohesive marketing sequence that tells a story
          
          SCREENSHOT SEQUENCE (for App Store):
          1. Hero Shot - Most impressive feature, core value proposition
          2. Core Value - Primary benefit
          3-5. Key Features - Individual feature highlights
          6. Social Proof or CTA - Trust signals or closing message
          
          Each creative must have:
          - Clear headline (6-8 words max, benefit-focused)
          - Device mockup showing actual UI
          - Clean, premium background
          - Consistent branding with other creatives in the set
        `.trim();

      const { object } = await generateObject({
        model: openrouter.chat(selectedModel),
        schema: CreativeSetSchema,
        system: CREATIVE_ANALYSIS_PROMPT,
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
            deviceType: "creative",
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
          creativeType: object.creativeType,
        },
      });

      return { ...object, themeToUse };
    });

    // Generate each creative
    const generatedFrames: typeof frames = isExistingGeneration
      ? [...frames]
      : [];

    for (let i = 0; i < analysis.screens.length; i++) {
      const screenPlan = analysis.screens[i];
      const selectedTheme = THEME_LIST.find(
        (t) => t.id === analysis.themeToUse
      );

      // Combine the Theme Styles + Base Variable
      const fullThemeCSS = `
        ${BASE_VARIABLES}
        ${selectedTheme?.style || ""}
      `;

      // Get all previous existing or generated frames
      const allPreviousFrames = generatedFrames.slice(0, i);
      const previousFramesContext = allPreviousFrames
        .map((f: FrameType) => `<!-- ${f.title} -->\n${f.htmlContent}`)
        .join("\n\n");

      await step.run(`generated-creative-${i}`, async () => {
        const result = await generateText({
          model: openrouter.chat(selectedModel),
          system: CREATIVE_GENERATION_SYSTEM_PROMPT,
          tools: {
            searchUnsplash: unsplashTool,
          },
          stopWhen: stepCountIs(5),
          prompt: `
          - Creative ${i + 1}/${analysis.screens.length}
          - Creative ID: ${screenPlan.id}
          - Creative Name: ${screenPlan.name}
          - Creative Purpose: ${screenPlan.purpose}
          - Canvas Dimensions: ${screenDimensions.width}x${screenDimensions.height}px

          VISUAL DESCRIPTION: ${screenPlan.visualDescription}

          EXISTING CREATIVES CONTEXT (CRITICAL - MAINTAIN BRAND CONSISTENCY):
          ${
            previousFramesContext ||
            "No previous creatives - this is the first one. Establish the visual language."
          }

          THEME VARIABLES (Reference ONLY - already defined in parent, do NOT redeclare these):
          ${fullThemeCSS}

          CRITICAL REQUIREMENTS - MARKETING CREATIVE:

          **BRAND CONSISTENCY (HIGHEST PRIORITY):**
          - **If previous creatives exist:** You MUST match their exact visual style:
            - Same gradient colors and direction
            - Same headline typography (size, weight, color)
            - Same device mockup style and positioning
            - Same spacing and composition
          - **All creatives in this set must look unified** - like they belong together

          **APP STORE SCREENSHOT STRUCTURE:**
          - Root: class="relative w-full h-full overflow-hidden" (fills the ${screenDimensions.width}x${screenDimensions.height}px canvas)
          - Background: Full-bleed gradient or solid color
          - Headline: Bold, prominent, benefit-focused (6-8 words max)
          - Device Mockup: Create a realistic phone frame showing actual UI
            - Frame: rounded-[3rem] border-[12px] border-[#1a1a1a] (or white for light themes)
            - Inner screen: rounded-[2.5rem] overflow-hidden
            - Size: Device should take 60-70% of the vertical space
            - Shadow: shadow-2xl for depth
          - Inside the device: Show actual app UI, not placeholder content

          **DEVICE MOCKUP CSS (iPhone Style):**
          The device should look like a real phone:
          - Outer frame with thick border
          - Rounded corners matching real devices
          - Inner screen area with the actual UI
          - Subtle shadow and reflection for depth

          **HEADLINE STYLING:**
          - Size: text-5xl to text-7xl (large and impactful)
          - Weight: font-bold or font-extrabold
          - Color: High contrast against background (white on dark, dark on light)
          - Position: Top third or bottom third of screen
          - Tracking: tracking-tight for impact

          **BACKGROUND TREATMENT:**
          - Use subtle, sophisticated gradients
          - AVOID: Bright purple-pink, neon colors, garish combinations
          - GOOD: Navy blues, warm sunsets, subtle purples, clean whites
          - Can add subtle decorative elements (radial glows, patterns) but keep minimal

          **DESIGN QUALITY:**
          - This is marketing material - it must be PREMIUM quality
          - Clean, uncluttered composition
          - Proper visual hierarchy (headline > device > background)
          - Would this make someone want to download the app?

          1. **Generate ONLY raw HTML markup using Tailwind CSS.**
          2. **Use CSS variables for colors when appropriate, or hardcoded colors for marketing impact.**
          3. **Output raw HTML only, starting with <div>.**
          4. **Do not include markdown, comments, <html>, <body>, or <head>**

          Generate the complete, premium marketing creative HTML now.
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
