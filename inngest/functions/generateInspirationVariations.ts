import { generateObject, generateText, stepCountIs } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import { GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { unsplashTool } from "../tool";

const THEME_IDS = [
  "ocean-breeze", "netflix", "acid-lime", "purple-yellow", "green-lime",
  "teal-coral", "lilac-teal", "orange-gray", "neo-brutalism", "glassmorphism",
  "swiss-style", "sunset", "ocean", "forest", "lavender", "monochrome",
  "neon", "midnight", "peach", "glacier", "rose-gold", "cyber",
];

const INSPIRATION_ANALYSIS_PROMPT = `You are a Lead UI/UX designer planning inspiration design variations.

CRITICAL: Pick exactly ONE theme for all 4 variations. All 4 must use the SAME theme (same colors, same CSS variables). The 4 variations must differ ONLY in LAYOUT and COMPOSITION—not in theme or color scheme.

Layout differences to use: grid vs list, sidebar vs top nav, card layout vs full-bleed, centered vs asymmetric, dense vs spacious, single column vs multi-column, etc.

Theme IDs (pick one): ${THEME_IDS.join(", ")}

Output: one concept, one theme id, and exactly 4 layout/style descriptions (structure and composition only; colors come from the chosen theme).`;

const StyleSchema = z.object({
  name: z.string().describe("Short layout style name (e.g. Grid Layout, Sidebar Layout, Card Stack, Full-bleed)"),
  visualDescription: z
    .string()
    .describe(
      "Layout and composition only: structure, component arrangement, spacing, hierarchy. No colors or theme—those are fixed. One paragraph."
    ),
});

const InspirationAnalysisSchema = z.object({
  concept: z
    .string()
    .describe(
      "Single design concept (e.g. 'Calendar', 'Web app dashboard', 'Event card')"
    ),
  theme: z
    .string()
    .describe(`Exactly one theme ID from: ${THEME_IDS.join(", ")}`),
  styles: z
    .array(StyleSchema)
    .length(4)
    .describe("Exactly 4 layout/composition variations for the same concept"),
});

const FAST_MODEL = "google/gemini-3-flash-preview";
const QUALITY_MODEL = "google/gemini-3-pro-preview";

export const generateInspirationVariations = inngest.createFunction(
  { id: "generate-inspiration-variations" },
  { event: "ui/generate.inspiration" },
  async ({ event, step, publish }) => {
    const { userId, projectId, prompt, model, dimensions } = event.data;
    const CHANNEL = `user:${userId}`;
    const width = dimensions?.width ?? 430;
    const height = dimensions?.height ?? 932;
    const generationModel = model || QUALITY_MODEL;

    await publish({
      channel: CHANNEL,
      topic: "generation.start",
      data: { status: "running", projectId },
    });

    const analysis = await step.run("analyze-inspiration-variations", async () => {
      await publish({
        channel: CHANNEL,
        topic: "analysis.start",
        data: { status: "analyzing", projectId },
      });

      const { object } = await generateObject({
        model: openrouter.chat(FAST_MODEL),
        schema: InspirationAnalysisSchema,
        system: INSPIRATION_ANALYSIS_PROMPT,
        prompt: `Redesign brief:\n\n${prompt}\n\nOutput one concept, one theme id (from the list), and exactly 4 layout variations (same theme for all; only layout/structure differs).`,
      });

      const themeId = THEME_IDS.includes(object.theme) ? object.theme : THEME_IDS[0];
      await prisma.project.update({
        where: { id: projectId, userId },
        data: { theme: themeId },
      });

      await publish({
        channel: CHANNEL,
        topic: "analysis.complete",
        data: {
          status: "generating",
          totalScreens: 4,
          concept: object.concept,
          theme: themeId,
          projectId,
        },
      });

      return { ...object, themeToUse: themeId };
    });

    const theme = THEME_LIST.find((t) => t.id === analysis.themeToUse) ?? THEME_LIST[0];
    const fullThemeCSS = `${BASE_VARIABLES}\n${theme?.style || ""}`;

    for (let i = 0; i < 4; i++) {
      const style = analysis.styles[i];
      await step.run(`generate-inspiration-frame-${i}`, async () => {
        const result = await generateText({
          model: openrouter.chat(generationModel),
          system: GENERATION_SYSTEM_PROMPT,
          tools: { searchUnsplash: unsplashTool },
          stopWhen: stepCountIs(5),
          prompt: `
Single design variation ${i + 1}/4 — Inspiration re-design.

CONCEPT: ${analysis.concept}
THIS LAYOUT VARIATION: ${style.name}
LAYOUT DESCRIPTION (structure and composition only; use the theme colors below): ${style.visualDescription}

VIEWPORT: Width is exactly ${width}px, min-height ${height}px. The root div MUST have style="width: ${width}px; min-height: ${height}px" or equivalent Tailwind so the design fits this canvas. For web/desktop (${width}px wide) use full-width layout; for mobile/narrow use single-column. Do not assume mobile-only—match the ${width}px width.

THEME (use for ALL colors—do not invent new colors): Same theme for all 4 variations. Use these CSS variables only:
${fullThemeCSS}

OUTPUT RULES:
1. Generate ONLY raw HTML starting with <div>
2. Root div: width ${width}px, min-height ${height}px (e.g. class="w-full" with a wrapper that has max-w-[${width}px] or inline style width:${width}px)
3. Use Tailwind and the theme CSS variables above. No markdown, no <html>/<body>/<head>
4. Hidden scrollbars: [&::-webkit-scrollbar]:hidden scrollbar-none

Generate the complete HTML for this single design variation now.
`.trim(),
        });

        let finalHtml = result.text ?? "";
        const match = finalHtml.match(/<div[\s\S]*<\/div>/);
        finalHtml = match ? match[0] : finalHtml;
        finalHtml = finalHtml.replace(/```/g, "");

        const frame = await prisma.frame.create({
          data: {
            projectId,
            title: `${analysis.concept} — ${style.name}`,
            htmlContent: finalHtml,
          },
        });

        await publish({
          channel: CHANNEL,
          topic: "frame.created",
          data: {
            frame: { ...frame, isLoading: false },
            frameId: frame.id,
            projectId,
          },
        });

        return { success: true, frame };
      });
    }

    await publish({
      channel: CHANNEL,
      topic: "generation.complete",
      data: { status: "completed", projectId },
    });
  }
);
