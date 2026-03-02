import { generateText, stepCountIs } from "ai";
import { inngest } from "../client";
import { openrouter } from "@/lib/openrouter";
import { GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { unsplashTool } from "../tool";
import {
  buildDesignContext,
  generateDesignDNAString,
  generateComponentLibraryString,
} from "@/lib/design-context-manager";

export const generateFrameVariations = inngest.createFunction(
  { id: "generate-frame-variations" },
  { event: "ui/generate.frame-variations" },
  async ({ event, step, publish }) => {
    const {
      userId,
      projectId,
      frameId,
      numberOfOptions,
      creativeRange,
      customInstructions,
      aspectsToVary,
      model,
      theme: themeId,
      frame,
      allFrames,
    } = event.data;

    const CHANNEL = `user:${userId}`;
    const selectedModel = model || "google/gemini-3-pro-preview";

    // Generate stable skeleton IDs so the client can match them when real frames arrive
    const skeletonIds = Array.from(
      { length: numberOfOptions },
      (_, i) => `${frameId}-var-${i + 1}`,
    );

    await publish({
      channel: CHANNEL,
      topic: "generation.start",
      data: {
        status: "generating",
        projectId,
      },
    });

    // Publish skeleton placeholders so the canvas shows shimmer immediately
    await publish({
      channel: CHANNEL,
      topic: "analysis.complete",
      data: {
        projectId,
        screens: skeletonIds.map((id, i) => ({
          id,
          name: `${frame.title} — Var ${i + 1}`,
        })),
      },
    });

    // Build creative range instruction
    const rangeInstructions: Record<string, string> = {
      refine:
        "Make subtle, refined changes. Keep the design very close to the original with minor tweaks to the selected aspects. The variations should feel like polished iterations of the same design.",
      explore:
        "Make moderate, creative changes. Explore different approaches to the selected aspects while maintaining the overall feel and purpose. The variations should feel like distinct but related design options.",
      reimagine:
        "Make bold, dramatic changes. Reimagine the selected aspects with fresh creative approaches. The variations should feel like distinctly different design interpretations while serving the same purpose.",
    };

    // Build aspects instruction
    const aspectLabels: Record<string, string> = {
      layout: "layout and arrangement of elements",
      colorScheme: "color palette and color usage",
      images: "imagery, illustrations, and visual assets",
      textFont: "typography, font choices, and text styling",
      textContent: "text content, copy, and messaging — rewrite ALL headings, subheadings, CTAs, and body text with domain-appropriate, human-sounding microcopy. Avoid generic AI filler like 'Unlock your potential' or 'Elevate your experience'. Use specific, benefit-driven language that a real product team would ship.",
    };

    const activeAspects = Object.entries(aspectsToVary || {})
      .filter(([, v]) => v)
      .map(([k]) => aspectLabels[k] || k);

    const aspectsInstruction =
      activeAspects.length > 0
        ? `Focus your variations on these aspects: ${activeAspects.join(", ")}. Keep other aspects consistent with the original.`
        : "Vary the overall design approach including layout, colors, typography, and content.";

    // Generate each variation as a new frame
    for (let i = 0; i < numberOfOptions; i++) {
      await step.run(`generate-variation-${i + 1}`, async () => {
        const selectedTheme = THEME_LIST.find((t) => t.id === themeId);
        const fullThemeCSS = `
          ${BASE_VARIABLES}
          ${selectedTheme?.style || ""}
        `;

        // Build design context for consistency
        let designContextString = "";
        if (allFrames && Array.isArray(allFrames) && allFrames.length > 0) {
          const designContext = buildDesignContext(allFrames, themeId);
          if (designContext.isInitialized) {
            designContextString = `
${generateDesignDNAString(designContext.dna)}
${generateComponentLibraryString(designContext.components)}
`;
          }
        }

        const result = await generateText({
          model: openrouter.chat(selectedModel),
          system: GENERATION_SYSTEM_PROMPT,
          tools: {
            searchUnsplash: unsplashTool,
          },
          stopWhen: stepCountIs(5),
          prompt: `
          You are generating VARIATION ${i + 1} of ${numberOfOptions} based on an existing screen design.

          ORIGINAL SCREEN TITLE: ${frame.title}
          ORIGINAL SCREEN HTML: ${frame.htmlContent}

          ${designContextString}

          THEME VARIABLES (Reference ONLY - already defined in parent, do NOT redeclare these): ${fullThemeCSS}

          VARIATION INSTRUCTIONS:
          - Creative range: ${creativeRange.toUpperCase()} — ${rangeInstructions[creativeRange] || rangeInstructions.explore}
          - ${aspectsInstruction}
          ${customInstructions ? `- Custom instructions from user: ${customInstructions}` : ""}
          - This is variation ${i + 1} of ${numberOfOptions}. Each variation must be UNIQUE and DIFFERENT from the others.
          ${i > 0 ? "- Make this variation distinctly different from previous variations while still being a valid interpretation of the original design." : ""}

          CRITICAL REQUIREMENTS:
          1. This is a NEW VARIATION of the original screen — create a fresh design interpretation, do NOT just copy the original
          2. The variation must serve the SAME PURPOSE as the original screen
          3. Use the SAME theme CSS variables for colors
          4. Keep the same general content/data but present it differently based on the creative range
          5. The variation should be a complete, standalone screen
          6. COPY QUALITY: All text (headings, labels, CTAs, descriptions) must be domain-appropriate and human-sounding. No generic AI filler like "Unlock your potential" or "Discover a world of". Use clear, specific, benefit-driven language matching the app's domain and tone.

          **OUTPUT RULES:**
          1. Generate ONLY raw HTML markup using Tailwind CSS
            - Use theme CSS variables for colors: bg-[var(--background)], text-[var(--foreground)], etc.
          2. All content inside a single root <div>
            - No overflow classes on the root
            - Scrollable content in inner containers with: [&::-webkit-scrollbar]:hidden scrollbar-none
          3. For absolute overlays: Use \`relative w-full h-screen\` on top div
          4. For regular content: Use \`w-full h-full min-h-screen\` on top div
          5. Output raw HTML only, starting with <div> - no markdown, comments, or wrapper tags

          Generate the complete, production-ready HTML for this variation now.
          `.trim(),
        });

        let finalHtml = result.text ?? "";
        const match = finalHtml.match(/<div[\s\S]*<\/div>/);
        finalHtml = match ? match[0] : finalHtml;
        finalHtml = finalHtml.replace(/```/g, "");

        // Create a NEW frame (not update the existing one)
        const newFrame = await prisma.frame.create({
          data: {
            projectId,
            title: `${frame.title} — Var ${i + 1}`,
            htmlContent: finalHtml,
          },
        });

        // screenId matches the skeleton placeholder so the canvas replaces it
        await publish({
          channel: CHANNEL,
          topic: "frame.created",
          data: {
            frame: {
              ...newFrame,
              isLoading: false,
            },
            screenId: skeletonIds[i],
            frameId: newFrame.id,
            projectId,
          },
        });

        return { success: true, frame: newFrame };
      });
    }

    await publish({
      channel: CHANNEL,
      topic: "generation.complete",
      data: {
        status: "completed",
        projectId,
      },
    });
  },
);
