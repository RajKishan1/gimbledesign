/**
 * Design Tree Generation Function
 * 
 * Generates structured Design Tree JSON instead of raw HTML.
 * The Design Tree is then rendered to HTML for display.
 */

import { generateObject, generateText, stepCountIs } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import { FrameType } from "@/types/project";
import {
  DESIGN_TREE_GENERATION_PROMPT,
  DESIGN_TREE_ANALYSIS_PROMPT,
} from "@/lib/prompt-design-tree";
import { DesignTreeSchema } from "@/lib/design-tree/schema";
import { renderDesignTreeToHtml } from "@/lib/design-tree/tree-to-html";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { unsplashTool } from "../tool";
import { DesignTree, generateNodeId } from "@/types/design-tree";

// Schema for individual screen planning
const ScreenPlanSchema = z.object({
  id: z.string().describe("Unique kebab-case identifier for the screen"),
  name: z.string().describe("Display name of the screen"),
  purpose: z.string().describe("What this screen accomplishes"),
  visualDescription: z.string().describe("Detailed visual description for generation"),
});

// Analysis schema for planning screens
const DesignTreeAnalysisSchema = z.object({
  theme: z.string().describe("Theme ID to use"),
  appName: z.string().describe("App name"),
  totalScreenCount: z.number().min(1).max(24),
  screens: z.array(ScreenPlanSchema).min(1).max(24),
});

// Simplified Design Tree schema for AI generation (with sensible defaults)
const AIDesignTreeSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number().default(430),
  height: z.number().default(932),
  backgroundColor: z.string().optional(),
  root: z.any(), // We'll validate the full tree structure after
});

/**
 * Add required properties and IDs to a node recursively
 */
function normalizeNode(node: any, depth: number = 0): any {
  const normalized: any = {
    id: node.id || generateNodeId(),
    name: node.name || `${node.type}-${depth}`,
    type: node.type,
    visible: node.visible ?? true,
    locked: node.locked ?? false,
    x: node.x ?? 0,
    y: node.y ?? 0,
    width: node.width ?? 100,
    height: node.height ?? 100,
    opacity: node.opacity ?? 1,
  };

  // Copy optional properties
  if (node.fills) normalized.fills = node.fills;
  if (node.strokes) normalized.strokes = node.strokes;
  if (node.shadows) normalized.shadows = node.shadows;
  if (node.cornerRadius !== undefined) normalized.cornerRadius = node.cornerRadius;
  if (node.clipContent !== undefined) normalized.clipContent = node.clipContent;
  if (node.blur !== undefined) normalized.blur = node.blur;
  if (node.backdropBlur !== undefined) normalized.backdropBlur = node.backdropBlur;

  // Type-specific properties
  switch (node.type) {
    case 'frame':
    case 'group':
      if (node.layout) normalized.layout = node.layout;
      normalized.children = (node.children || []).map((child: any, i: number) => 
        normalizeNode(child, depth + 1)
      );
      break;
    case 'text':
      normalized.content = node.content || '';
      normalized.textStyle = {
        fontFamily: node.textStyle?.fontFamily || 'var(--font-sans)',
        fontSize: node.textStyle?.fontSize || 16,
        fontWeight: node.textStyle?.fontWeight || 400,
        lineHeight: node.textStyle?.lineHeight || 1.5,
        letterSpacing: node.textStyle?.letterSpacing || 0,
        textAlign: node.textStyle?.textAlign || 'left',
        textDecoration: node.textStyle?.textDecoration || 'none',
        textTransform: node.textStyle?.textTransform || 'none',
      };
      if (node.autoWidth !== undefined) normalized.autoWidth = node.autoWidth;
      if (node.autoHeight !== undefined) normalized.autoHeight = node.autoHeight;
      break;
    case 'image':
      normalized.src = node.src || '';
      normalized.alt = node.alt || '';
      normalized.objectFit = node.objectFit || 'cover';
      break;
    case 'icon':
      normalized.iconName = node.iconName || 'home-01';
      normalized.iconLibrary = node.iconLibrary || 'hugeicons';
      if (node.color) normalized.color = node.color;
      break;
    case 'button':
      if (node.layout) normalized.layout = node.layout;
      normalized.children = (node.children || []).map((child: any, i: number) => 
        normalizeNode(child, depth + 1)
      );
      if (node.variant) normalized.variant = node.variant;
      if (node.disabled !== undefined) normalized.disabled = node.disabled;
      break;
    case 'input':
      normalized.inputType = node.inputType || 'text';
      if (node.placeholder) normalized.placeholder = node.placeholder;
      if (node.value) normalized.value = node.value;
      if (node.disabled !== undefined) normalized.disabled = node.disabled;
      break;
    case 'rectangle':
      // No additional properties
      break;
    case 'svg':
      normalized.svgContent = node.svgContent || '';
      if (node.viewBox) normalized.viewBox = node.viewBox;
      break;
  }

  return normalized;
}

/**
 * Normalize and validate a Design Tree from AI output
 */
function normalizeDesignTree(tree: any): DesignTree {
  return {
    id: tree.id || generateNodeId(),
    name: tree.name || 'Screen',
    width: tree.width || 430,
    height: tree.height || 932,
    backgroundColor: tree.backgroundColor,
    root: normalizeNode(tree.root || {
      type: 'frame',
      name: 'Root',
      children: [],
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    themeId: tree.themeId,
    themeVariables: tree.themeVariables,
  } as DesignTree;
}

/**
 * Main Design Tree generation function
 */
export const generateDesignTree = inngest.createFunction(
  { id: "generate-design-tree" },
  { event: "ui/generate.design-tree" },
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

    // Step 1: Analyze and plan screens
    const analysis = await step.run("analyze-and-plan-design-tree", async () => {
      await publish({
        channel: CHANNEL,
        topic: "analysis.start",
        data: {
          status: "analyzing",
          projectId: projectId,
        },
      });

      // Get context from existing frames (their design trees if available)
      const contextJSON = isExistingGeneration
        ? frames
            .map((frame: FrameType & { designTree?: any }) =>
              frame.designTree
                ? `<!-- ${frame.title} -->\n${JSON.stringify(frame.designTree, null, 2)}`
                : `<!-- ${frame.title} (HTML only) -->`
            )
            .join("\n\n")
        : "";

      const analysisPrompt = isExistingGeneration
        ? `
          USER REQUEST: ${prompt}
          SELECTED THEME: ${existingTheme}

          EXISTING SCREENS (Design Trees - analyze for consistency):
          ${contextJSON}

          CRITICAL: Maintain design system consistency with existing screens.
          Extract and reuse layout patterns, spacing, typography, and component styles.
        `.trim()
        : `
          USER REQUEST: ${prompt}

          ANALYZE THE USER'S REQUEST:
          1. Determine how many screens they want
          2. What type of screens are needed
          3. Select appropriate theme
          
          RULES:
          - If user specifies a number, generate exactly that many
          - For "complete app" without count: 12-18 screens
          - For specific screens: only those requested
        `.trim();

      const { object } = await generateObject({
        model: openrouter.chat(selectedModel),
        schema: DesignTreeAnalysisSchema,
        system: DESIGN_TREE_ANALYSIS_PROMPT,
        prompt: analysisPrompt,
      });

      const themeToUse = isExistingGeneration ? existingTheme : object.theme;

      if (!isExistingGeneration) {
        await prisma.project.update({
          where: { id: projectId, userId: userId },
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

    // Step 2: Generate each screen as a Design Tree
    const generatedFrames: any[] = isExistingGeneration ? [...frames] : [];

    for (let i = 0; i < analysis.screens.length; i++) {
      const screenPlan = analysis.screens[i];
      const selectedTheme = THEME_LIST.find((t) => t.id === analysis.themeToUse);

      const fullThemeCSS = `
        ${BASE_VARIABLES}
        ${selectedTheme?.style || ""}
      `;

      // Get context from previous frames
      const previousTreesContext = generatedFrames
        .slice(0, Math.min(i, 3)) // Last 3 frames for context
        .map((f: any) =>
          f.designTree
            ? `Screen: ${f.title}\n${JSON.stringify(f.designTree, null, 2)}`
            : ""
        )
        .filter(Boolean)
        .join("\n\n---\n\n");

      await step.run(`generate-design-tree-${i}`, async () => {
        // Generate Design Tree JSON
        const result = await generateText({
          model: openrouter.chat(selectedModel),
          system: DESIGN_TREE_GENERATION_PROMPT,
          tools: {
            searchUnsplash: unsplashTool,
          },
          stopWhen: stepCountIs(5),
          prompt: `
            Generate a Design Tree JSON for this screen:

            - Screen ${i + 1}/${analysis.screens.length}
            - Screen ID: ${screenPlan.id}
            - Screen Name: ${screenPlan.name}
            - Screen Purpose: ${screenPlan.purpose}

            VISUAL DESCRIPTION:
            ${screenPlan.visualDescription}

            ${previousTreesContext ? `
            PREVIOUS SCREENS (maintain consistency):
            ${previousTreesContext}
            ` : 'This is the first screen.'}

            THEME VARIABLES:
            ${fullThemeCSS}

            Generate the complete Design Tree JSON for this screen.
            The root frame should have:
            - width: 430
            - height: 932 (or taller for scrollable content)
            
            Output ONLY valid JSON, starting with { and ending with }.
          `.trim(),
        });

        // Parse the JSON response
        let designTreeJson: any;
        try {
          // Extract JSON from response (may have markdown code blocks)
          let jsonText = result.text || '{}';
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          }
          designTreeJson = JSON.parse(jsonText);
        } catch (parseError) {
          console.error('Failed to parse Design Tree JSON:', parseError);
          // Create a fallback empty tree
          designTreeJson = {
            id: screenPlan.id,
            name: screenPlan.name,
            width: 430,
            height: 932,
            root: {
              type: 'frame',
              name: 'Root',
              width: 430,
              height: 932,
              layout: { mode: 'vertical', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0 },
              fills: [{ type: 'solid', color: 'var(--background)' }],
              children: [
                {
                  type: 'text',
                  name: 'Placeholder',
                  content: `${screenPlan.name} - Generation failed, please regenerate`,
                  width: 390,
                  height: 50,
                  textStyle: { fontSize: 16, fontWeight: 400, textAlign: 'center' },
                  fills: [{ type: 'solid', color: 'var(--foreground)' }],
                }
              ],
            },
          };
        }

        // Normalize and validate the Design Tree
        const normalizedTree = normalizeDesignTree(designTreeJson);

        // Render to HTML
        const htmlContent = renderDesignTreeToHtml(normalizedTree, {
          includeDataAttributes: true,
          theme: selectedTheme ? parseThemeToObject(selectedTheme.style) : {},
        });

        // Create the frame with both Design Tree and HTML
        const frame = await prisma.frame.create({
          data: {
            projectId,
            title: screenPlan.name,
            htmlContent: htmlContent,
            designTree: normalizedTree as any, // Store as JSON
          },
        });

        // Add to context for next screens
        generatedFrames.push({
          ...frame,
          designTree: normalizedTree,
        });

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

        return { success: true, frame };
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

/**
 * Parse theme CSS string to object
 */
function parseThemeToObject(themeCss: string): Record<string, string> {
  const theme: Record<string, string> = {};
  const matches = themeCss.matchAll(/--([a-z-]+):\s*([^;]+);/g);
  for (const match of matches) {
    theme[`--${match[1]}`] = match[2].trim();
  }
  return theme;
}

/**
 * Regenerate a single frame as Design Tree
 */
export const regenerateDesignTreeFrame = inngest.createFunction(
  { id: "regenerate-design-tree-frame" },
  { event: "ui/regenerate.design-tree-frame" },
  async ({ event, step, publish }) => {
    const {
      userId,
      projectId,
      frameId,
      prompt,
      model,
      theme: themeId,
      frame,
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

    await step.run("regenerate-design-tree", async () => {
      const selectedTheme = THEME_LIST.find((t) => t.id === themeId);
      const fullThemeCSS = `
        ${BASE_VARIABLES}
        ${selectedTheme?.style || ""}
      `;

      // Get existing Design Tree for context
      const existingTree = frame.designTree
        ? JSON.stringify(frame.designTree, null, 2)
        : '';

      const result = await generateText({
        model: openrouter.chat(selectedModel),
        system: DESIGN_TREE_GENERATION_PROMPT,
        tools: {
          searchUnsplash: unsplashTool,
        },
        stopWhen: stepCountIs(5),
        prompt: `
          USER REQUEST: ${prompt}

          ORIGINAL SCREEN TITLE: ${frame.title}
          ${existingTree ? `ORIGINAL DESIGN TREE:\n${existingTree}` : ''}

          THEME VARIABLES:
          ${fullThemeCSS}

          CRITICAL REQUIREMENTS:
          1. PRESERVE the overall structure - ONLY modify what the user explicitly requested
          2. Keep all existing components that are NOT mentioned in the user request
          3. Maintain the exact same design patterns and styling

          Generate the updated Design Tree JSON.
          Output ONLY valid JSON, starting with { and ending with }.
        `.trim(),
      });

      // Parse the response
      let designTreeJson: any;
      try {
        let jsonText = result.text || '{}';
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
        designTreeJson = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse Design Tree JSON:', parseError);
        throw new Error('Failed to generate valid Design Tree');
      }

      const normalizedTree = normalizeDesignTree(designTreeJson);
      const htmlContent = renderDesignTreeToHtml(normalizedTree, {
        includeDataAttributes: true,
        theme: selectedTheme ? parseThemeToObject(selectedTheme.style) : {},
      });

      const updatedFrame = await prisma.frame.update({
        where: { id: frameId },
        data: {
          htmlContent: htmlContent,
          designTree: normalizedTree as any,
        },
      });

      await publish({
        channel: CHANNEL,
        topic: "frame.updated",
        data: {
          frame: updatedFrame,
          frameId: frameId,
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
