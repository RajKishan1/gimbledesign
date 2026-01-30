import { generateObject, generateText, stepCountIs } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import { GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { unsplashTool } from "../tool";

const INSPIRATION_ANALYSIS_PROMPT = `You are a Lead UI/UX designer planning inspiration design variations.

Your task: From the user's redesign brief (which may describe an existing design from an image and/or a text prompt), output ONE design concept and EXACTLY 4 different visual styles for that same concept.

Examples:
- Concept: "Calendar" → 4 styles: Minimal (clean grid, lots of whitespace), Bold (strong typography, dark accents), Classic (serif, traditional layout), Modern (glassmorphism, soft gradients).
- Concept: "Event card" → 4 styles: Minimal, Editorial, Playful, Corporate.

Each style must be distinctly different (layout, typography, color feel, density) so the user gets real inspiration variety.`;

const StyleSchema = z.object({
  name: z.string().describe("Short style name (e.g. Minimal, Bold, Classic, Modern)"),
  visualDescription: z
    .string()
    .describe(
      "Dense visual directive for this variation: layout, typography, colors, components, mood. One paragraph."
    ),
});

const InspirationAnalysisSchema = z.object({
  concept: z
    .string()
    .describe(
      "Single design concept (e.g. 'Calendar', 'Event card', 'Dashboard widget')"
    ),
  styles: z
    .array(StyleSchema)
    .length(4)
    .describe("Exactly 4 style variations for the same concept"),
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
        prompt: `Redesign brief:\n\n${prompt}\n\nOutput one concept and exactly 4 style variations (same content, 4 different visual formats).`,
      });

      await publish({
        channel: CHANNEL,
        topic: "analysis.complete",
        data: {
          status: "generating",
          totalScreens: 4,
          concept: object.concept,
          projectId,
        },
      });

      return object;
    });

    const theme = THEME_LIST[0];
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
THIS VARIATION: ${style.name}
VISUAL DESCRIPTION: ${style.visualDescription}

CANVAS: Generate for a single screen/view with width ${width}px and min-height ${height}px. Root container should feel like a complete, self-contained design at this size (e.g. one calendar, one card, one widget).

THEME CSS VARIABLES (reference only, do not redeclare):
${fullThemeCSS}

OUTPUT RULES:
1. Generate ONLY raw HTML starting with <div>
2. Root: class="relative w-full min-h-screen bg-[var(--background)]" (or use min-height that fits ${height}px content)
3. Use Tailwind and CSS variables. No markdown, no <html>/<body>/<head>
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
