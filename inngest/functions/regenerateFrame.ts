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

export const regenerateFrame = inngest.createFunction(
  { id: "regenerate-frame" },
  { event: "ui/regenerate.frame" },
  async ({ event, step, publish }) => {
    const {
      userId,
      projectId,
      frameId,
      prompt,
      model,
      theme: themeId,
      frame,
      allFrames, // Optional: all frames in the project for context
    } = event.data;
    const CHANNEL = `user:${userId}`;
    const selectedModel = model || "google/gemini-3-pro-preview";

    await publish({
      channel: CHANNEL,
      topic: "generation.start",
      data: {
        status: "generating",
        projectId: projectId,
      },
    });

    // Generate new frame with the user's prompt
    await step.run("regenerate-screen", async () => {
      const selectedTheme = THEME_LIST.find((t) => t.id === themeId);

      //Combine the Theme Styles + Base Variable
      const fullThemeCSS = `
        ${BASE_VARIABLES}
        ${selectedTheme?.style || ""}
      `;

      // Build design context from all frames if available, for consistency
      let designContextString = "";
      if (allFrames && Array.isArray(allFrames) && allFrames.length > 0) {
        const designContext = buildDesignContext(allFrames, themeId);
        if (designContext.isInitialized) {
          designContextString = `
${generateDesignDNAString(designContext.dna)}

${generateComponentLibraryString(designContext.components)}

CRITICAL: When modifying this screen, you MUST maintain the Design DNA above.
Any changes should seamlessly blend with the app's established visual style.
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
        USER REQUEST: ${prompt}

        ORIGINAL SCREEN TITLE: ${frame.title}
        ORIGINAL SCREEN HTML: ${frame.htmlContent}

        ${designContextString}

        THEME VARIABLES (Reference ONLY - already defined in parent, do NOT redeclare these): ${fullThemeCSS}


        CRITICAL REQUIREMENTS - READ CAREFULLY:
        
        **PRESERVE DESIGN DNA:**
        1. PRESERVE the overall structure and layout - ONLY modify what the user explicitly requested
          - Keep all existing components, styling, and layout that are NOT mentioned in the user request
          - Only change the specific elements the user asked for
          - Do not add or remove sections unless requested
          - Maintain the exact same HTML structure and CSS classes except for requested changes
        2. If Design DNA context is provided above, ensure changes maintain consistency with it
        3. Keep navigation components (bottom nav, sidebar) EXACTLY as they are unless explicitly requested to change

        **OUTPUT RULES:**
        1. Generate ONLY raw HTML markup using Tailwind CSS
          - Use theme CSS variables for colors: bg-[var(--background)], text-[var(--foreground)], etc.
        2. All content inside a single root <div>
          - No overflow classes on the root
          - Scrollable content in inner containers with: [&::-webkit-scrollbar]:hidden scrollbar-none
        3. For absolute overlays: Use \`relative w-full h-screen\` on top div
        4. For regular content: Use \`w-full h-full min-h-screen\` on top div
        5. Output raw HTML only, starting with <div> - no markdown, comments, or wrapper tags
        
        Generate the complete, production-ready HTML for this screen now
        `.trim(),
      });

      let finalHtml = result.text ?? "";
      const match = finalHtml.match(/<div[\s\S]*<\/div>/);
      finalHtml = match ? match[0] : finalHtml;
      finalHtml = finalHtml.replace(/```/g, "");

      // Update the frame
      const updatedFrame = await prisma.frame.update({
        where: {
          id: frameId,
        },
        data: {
          htmlContent: finalHtml,
        },
      });

      await publish({
        channel: CHANNEL,
        topic: "frame.created",
        data: {
          frame: {
            ...updatedFrame,
            isLoading: false,
          },
          screenId: frameId,
          frameId: updatedFrame.id,
          projectId: projectId,
        },
      });

      return { success: true, frame: updatedFrame };
    });

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
