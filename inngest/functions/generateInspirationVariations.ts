import { generateObject, generateText, stepCountIs } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import { INSPIRATION_GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { unsplashTool } from "../tool";

const THEME_IDS = [
  "ocean-breeze",
  "netflix",
  "acid-lime",
  "purple-yellow",
  "green-lime",
  "teal-coral",
  "lilac-teal",
  "orange-gray",
  "neo-brutalism",
  "glassmorphism",
  "swiss-style",
  "sunset",
  "ocean",
  "forest",
  "lavender",
  "monochrome",
  "neon",
  "midnight",
  "peach",
  "glacier",
  "rose-gold",
  "cyber",
];

const INSPIRATION_ANALYSIS_PROMPT = `You are a Lead UI/UX designer planning inspiration design variations. Your output guides four variations that share the same context and quality bar.

SCOPE (critical):
- From the brief, determine if the request is for a single COMPONENT (e.g. calendar, card grid, form, principle cards) or a full SCREEN (e.g. dashboard, full page). If the brief says "component" or describes one widget/section, set scope to "component". If it describes a full app screen or dashboard, set scope to "full_screen". When in doubt (e.g. "calendar"), prefer "component" so we generate only that—not an app with a calendar inside.

THEME:
- Pick exactly ONE theme for all 4 variations. All 4 must use the SAME theme.
- If the brief includes a reference design description (e.g. from an image), choose the theme that BEST MATCHES the reference's color palette and mood. Do not drastically change the look—preserve the overall feel (e.g. light/minimal → ocean-breeze or swiss-style; purple accents → lavender or purple-yellow; dark → midnight or netflix).
- If no reference is given, pick the theme that fits the concept. Theme IDs: ${THEME_IDS.join(
  ", "
)}

VARIATIONS:
- The 4 variations must differ only in LAYOUT and COMPOSITION (grid vs list, card layout vs full-bleed, centered vs asymmetric, dense vs spacious, etc.). Same concept, same theme, same content type—different visual arrangement and style.

Apply UI/UX principles: visual hierarchy, proximity, clarity, alignment, contrast, simplicity, whitespace, balance, consistency. Output: scope, concept, one theme id, and exactly 4 layout/style descriptions.`;

const StyleSchema = z.object({
  name: z
    .string()
    .describe(
      "Short layout style name (e.g. Grid Layout, Card Stack, Centered Minimal, Bento Grid)"
    ),
  visualDescription: z
    .string()
    .describe(
      "Layout and composition only: structure, arrangement, spacing, hierarchy. No colors—those come from the chosen theme. One paragraph."
    ),
});

const InspirationAnalysisSchema = z.object({
  scope: z
    .enum(["component", "full_screen"])
    .describe(
      "component = generate only the single component/widget; full_screen = generate full page/screen layout"
    ),
  concept: z
    .string()
    .describe(
      "Exact design concept (e.g. 'Calendar component', '16 UI/UX principle cards', 'Pricing table'). Must match what the user or reference asked for—no broadening."
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
    const width = dimensions?.width ?? 393;
    const height = dimensions?.height ?? 852;
    const generationModel = model || QUALITY_MODEL;

    await publish({
      channel: CHANNEL,
      topic: "generation.start",
      data: { status: "running", projectId },
    });

    const analysis = await step.run(
      "analyze-inspiration-variations",
      async () => {
        await publish({
          channel: CHANNEL,
          topic: "analysis.start",
          data: { status: "analyzing", projectId },
        });

        const { object } = await generateObject({
          model: openrouter.chat(FAST_MODEL),
          schema: InspirationAnalysisSchema,
          system: INSPIRATION_ANALYSIS_PROMPT,
          prompt: `Redesign brief:\n\n${prompt}\n\nOutput: scope (component or full_screen from the brief), one concept, one theme id that best matches the reference (if any), and exactly 4 layout variations. Same theme for all; only layout/structure differs.`,
        });

        const themeId = THEME_IDS.includes(object.theme)
          ? object.theme
          : THEME_IDS[0];
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

        return { ...object, themeToUse: themeId, scope: object.scope };
      }
    );

    const theme =
      THEME_LIST.find((t) => t.id === analysis.themeToUse) ?? THEME_LIST[0];
    const fullThemeCSS = `${BASE_VARIABLES}\n${theme?.style || ""}`;

    const scopeInstruction =
      analysis.scope === "component"
        ? `SCOPE: Generate ONLY the "${analysis.concept}" component. Do NOT add app chrome, navigation bars, full-screen layout, or surrounding UI. Output just this single component, centered or appropriately placed in the viewport.`
        : `SCOPE: Full screen. Generate a complete layout for "${analysis.concept}".`;

    for (let i = 0; i < 4; i++) {
      const style = analysis.styles[i];
      await step.run(`generate-inspiration-frame-${i}`, async () => {
        const result = await generateText({
          model: openrouter.chat(generationModel),
          system: INSPIRATION_GENERATION_SYSTEM_PROMPT,
          tools: { searchUnsplash: unsplashTool },
          stopWhen: stepCountIs(5),
          prompt: `
Single design variation ${i + 1}/4 — Inspiration re-design.

${scopeInstruction}

CONCEPT: ${analysis.concept}
THIS LAYOUT VARIATION: ${style.name}
LAYOUT DESCRIPTION (structure and composition only; use the theme colors below): ${
            style.visualDescription
          }

VIEWPORT: Width ${width}px, min-height ${height}px. Root div MUST have width ${width}px and min-height ${height}px (e.g. style="width: ${width}px; min-height: ${height}px" or Tailwind max-w-[${width}px]). Match the canvas size.

THEME (use for ALL colors—do not invent new colors): Same theme for all 4 variations. Use these CSS variables only:
${fullThemeCSS}

OUTPUT RULES:
1. Generate ONLY raw HTML starting with <div>
2. Root div: width ${width}px, min-height ${height}px
3. Use Tailwind and the theme CSS variables above. No markdown, no <html>/<body>/<head>
4. Hidden scrollbars: [&::-webkit-scrollbar]:hidden scrollbar-none
5. Apply UI/UX principles: clear hierarchy, alignment, whitespace, consistency. Avoid generic "AI" look—be intentional and purposeful.

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
