/**
 * Design Tree Generation Function
 * 
 * Generates structured Design Tree JSON instead of raw HTML.
 * The Design Tree is then rendered to HTML for display.
 * 
 * OPTIMIZED: Uses fast model for analysis, smart context for generation.
 * RELIABLE: Each screen generated in its own step for 100% completion rate.
 * HIGH CONTEXT: Uses Design DNA + Component Library for consistency across 20+ screens.
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
import { renderDesignTreeToHtml } from "@/lib/design-tree/tree-to-html";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { unsplashTool } from "../tool";
import { DesignTree, generateNodeId } from "@/types/design-tree";
import {
  buildDesignContext,
  generateDesignDNAString,
  updateDesignContext,
  DesignContext,
} from "@/lib/design-context-manager";

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

// Fast model for analysis, quality model for generation
const FAST_MODEL = "google/gemini-3-flash-preview";
const QUALITY_MODEL = "google/gemini-3-pro-preview";

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
      normalized.children = (node.children || []).map((child: any) => 
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
      normalized.children = (node.children || []).map((child: any) => 
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
 * Main Design Tree generation function - RELIABLE sequential approach
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
    const analysis = await step.run("analyze-and-plan-design-tree", async () => {
      await publish({
        channel: CHANNEL,
        topic: "analysis.start",
        data: {
          status: "analyzing",
          projectId: projectId,
        },
      });

      const contextSummary = isExistingGeneration
        ? `Existing app with ${frames.length} screens. Theme: ${existingTheme}. 
           Screen names: ${frames.map((f: FrameType) => f.title).join(", ")}.
           Maintain design system consistency.`
        : "";

      const analysisPrompt = isExistingGeneration
        ? `
          USER REQUEST: ${prompt}
          SELECTED THEME: ${existingTheme}

          ${contextSummary}

          CRITICAL: Maintain design system consistency with existing screens.
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
        model: openrouter.chat(analysisModel),
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

    // PHASE 2: Sequential Generation with HIGH CONTEXT FIDELITY
    // Uses Design DNA approach for consistency across 20+ screens
    const generatedFrames: any[] = isExistingGeneration ? [...frames] : [];
    const selectedTheme = THEME_LIST.find((t) => t.id === analysis.themeToUse);
    const fullThemeCSS = `${BASE_VARIABLES}\n${selectedTheme?.style || ""}`;

    // Design Context - built from first screens, maintained throughout
    let designContext: DesignContext = isExistingGeneration
      ? buildDesignContext(frames.map((f: any) => ({ title: f.title, htmlContent: f.htmlContent || '' })), analysis.themeToUse)
      : buildDesignContext([], analysis.themeToUse);

    for (let i = 0; i < analysis.screens.length; i++) {
      const screenPlan = analysis.screens[i];

      await step.run(`generate-design-tree-${i}`, async () => {
        // After generating first 2-3 screens, rebuild context with extracted Design DNA
        if (generatedFrames.length >= 2 && generatedFrames.length <= 3) {
          const framesForContext = generatedFrames.map((f: any) => ({
            title: f.title,
            htmlContent: f.htmlContent || renderDesignTreeToHtml(f.designTree, {}),
          }));
          designContext = buildDesignContext(framesForContext, analysis.themeToUse);
        }

        // Build context from recent frames - but now with Design DNA
        const previousTreesContext = generatedFrames
          .slice(-2)
          .map((f: any) =>
            f.designTree
              ? `Screen: ${f.title}\nDimensions: ${f.designTree.width}x${f.designTree.height}\nLayout: ${f.designTree.root?.layout?.mode || 'vertical'}`
              : ""
          )
          .filter(Boolean)
          .join("\n\n");

        // Generate Design DNA context string for high fidelity
        const designDNAContext = designContext.isInitialized
          ? generateDesignDNAString(designContext.dna)
          : '';

        const result = await generateText({
          model: openrouter.chat(generationModel),
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

            ${designDNAContext ? `
            ${designDNAContext}
            ` : ''}

            ${previousTreesContext ? `
            PREVIOUS SCREENS (maintain exact same styling):
            ${previousTreesContext}
            ` : 'This is the first screen - establish the Design DNA that ALL subsequent screens will follow.'}

            THEME VARIABLES:
            ${fullThemeCSS}

            ${i === 0 ? `
            **FIRST SCREEN - ESTABLISH DESIGN DNA:**
            Your choices here define the entire app's visual language:
            - Typography: Use consistent font sizes and weights
            - Spacing: Use 4/8/12/16/24/32 scale consistently
            - Colors: Use CSS variables from theme
            - Layout patterns: Establish navigation and component patterns
            ` : `
            **MAINTAIN DESIGN DNA (CRITICAL):**
            This screen MUST match the visual style of screen 1.
            Use IDENTICAL:
            - Font sizes and weights
            - Spacing scale
            - Color usage patterns
            - Component styles (buttons, cards, inputs)
            - Navigation structure (if applicable)
            `}

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
            designTree: normalizedTree as any,
          },
        });

        // Add to context for next screens
        generatedFrames.push({
          ...frame,
          designTree: normalizedTree,
        });

        // Update design context (mainly updates screen graph after first 3)
        designContext = updateDesignContext(
          designContext,
          { title: frame.title, htmlContent: htmlContent },
          generatedFrames.map((f: any) => ({ 
            title: f.title, 
            htmlContent: f.htmlContent || '' 
          }))
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
    const selectedModel = model || QUALITY_MODEL;

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
