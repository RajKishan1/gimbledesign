import { generateObject, generateText } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import prisma from "@/lib/prisma";

// Single concept: one layout for the product; we generate 3 viewport variants (web, tablet, mobile)
const WireframeConceptSchema = z.object({
  appName: z
    .string()
    .describe("A short name for the app/product based on the user's request."),
  layoutDescription: z
    .string()
    .describe(
      "Wireframe layout only: list content blocks and their placement. E.g. 'Header bar, Nav, Main content area, Footer'. Describe the structure for the main view. No colors or visual style—only structure and hierarchy."
    ),
  purpose: z
    .string()
    .describe(
      "One sentence: what this screen/product accomplishes (e.g. 'Dashboard for viewing analytics')."
    ),
});

const WIREFRAME_ANALYSIS_PROMPT = `You are a UX researcher and information architect. Your job is to analyze the user's prompt and produce ONE wireframe concept that will be shown at three viewport sizes: web (desktop), tablet, and mobile.

DEFAULT TO WEB-FIRST: Unless the user explicitly says "mobile app" or "mobile only", interpret the prompt as a web product (website or web app). Describe layout as for a desktop-first experience (e.g. sidebar, main content, header). We will then adapt the same concept for tablet and mobile widths.

RULES:
- Output exactly one concept: appName, layoutDescription, purpose.
- layoutDescription: list structural blocks only (e.g. "Header, Sidebar nav, Main content (grid or list), Footer"). No visual design.
- Focus on web/desktop layout when the prompt does not specify mobile. If the user says "mobile app", then describe a mobile-appropriate layout (e.g. bottom nav, single column).`;

const WIREFRAME_VIEWPORTS = [
  { id: "web", name: "Web", width: 1440, minHeight: 800 },
  { id: "tablet", name: "Tablet", width: 768, minHeight: 1024 },
  { id: "mobile", name: "Mobile", width: 430, minHeight: 932 },
] as const;

const WIREFRAME_GENERATION_SYSTEM_PROMPT = `You generate LOW-FIDELITY WIREFRAME HTML only. No high-fidelity UI.

STRICT RULES:
1. Output a single <div> that represents one screen. Use Tailwind for LAYOUT only (flex, grid, gap, p-4, etc.).
2. The root <div> MUST have a fixed width matching the viewport (e.g. w-[1440px] or max-w-full with an inner container at the viewport width) so the layout is correct at that size.
3. STYLING: Grayscale only. Use bg-gray-100, bg-white, border border-gray-300, text-gray-700. No colors, no images, no icons (use placeholder text like "[Icon]" or "≡").
4. CONTENT: Use placeholder text: "Label", "Content area", "Nav item 1", "Lorem ipsum...", "Button", "Header", "Footer". No real copy.
5. STRUCTURE: Show clear blocks—rectangles with borders or background. Header block, nav block, main content block, etc. Match the layoutDescription exactly. Adapt layout for the given viewport width (e.g. sidebar on web, stacked on mobile).
6. Do NOT use: images, gradients, shadows (or very subtle), rounded corners beyond rounded-lg, CSS variables for theme colors.
7. Output ONLY raw HTML starting with <div>. No markdown, no \`\`\`, no <html>/<body>/<head>.

Example style: simple bordered boxes, placeholder text inside, clear hierarchy. Like a pen-and-paper wireframe translated to HTML.`;

const WIREFRAME_RESPONSIVE_SYSTEM_PROMPT = `You generate a single LOW-FIDELITY RESPONSIVE WIREFRAME HTML. One layout that adapts from mobile (430px) to desktop (1440px) using Tailwind responsive classes.

STRICT RULES:
1. Output ONE <div> that represents one screen. Use Tailwind LAYOUT and RESPONSIVE utilities: w-full, max-w-7xl, mx-auto, flex, flex-col md:flex-row, grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3, hidden md:block, etc.
2. Do NOT set a fixed width on the root. Use w-full so the design fills the viewport at any size. Use max-width and responsive breakpoints (sm:, md:, lg:, xl:) so the layout adapts: e.g. sidebar hidden on mobile (hidden md:block), single column on mobile and multi-column on desktop.
3. STYLING: Grayscale only. bg-gray-100, bg-white, border border-gray-300, text-gray-700. No colors, no images. Placeholder text: "Header", "Nav", "Content", "Footer".
4. STRUCTURE: Clear blocks (header, nav, main, footer). Layout should look good at 430px (stacked), 768px (condensed), and 1440px (full desktop with sidebar if appropriate).
5. Output ONLY raw HTML starting with <div>. No markdown, no \`\`\`, no <html>/<body>/<head>.`;

const FAST_MODEL = "google/gemini-3-flash-preview";
const QUALITY_MODEL = "google/gemini-3-pro-preview";

export const generateWireframeScreens = inngest.createFunction(
  { id: "generate-wireframe-screens" },
  { event: "ui/generate.wireframe-screens" },
  async ({ event, step, publish }) => {
    const {
      userId,
      projectId,
      prompt,
      model,
      frames,
      theme: existingTheme,
      wireframeKind = "web", // "web" = one responsive screen (shown at 3 sizes), "mobile" = one mobile screen
    } = event.data;
    const CHANNEL = `user:${userId}`;
    const isExistingGeneration = Array.isArray(frames) && frames.length > 0;
    const analysisModel = FAST_MODEL;
    const generationModel = model || QUALITY_MODEL;
    const totalScreens =
      wireframeKind === "mobile" ? 1 : wireframeKind === "web" ? 1 : 3; // legacy 3 when not specified

    await publish({
      channel: CHANNEL,
      topic: "generation.start",
      data: { status: "running", projectId },
    });

    // PHASE 1: Analysis – one concept (web-first unless prompt says mobile)
    const analysis = await step.run("analyze-and-plan-wireframes", async () => {
      await publish({
        channel: CHANNEL,
        topic: "analysis.start",
        data: { status: "analyzing", projectId },
      });

      const analysisPrompt = isExistingGeneration
        ? `
          USER REQUEST: ${prompt}
          Existing wireframe project. Output one concept (appName, layoutDescription, purpose) for the same request. Default to web-first layout.
        `.trim()
        : `
          USER REQUEST: ${prompt}

          Analyze the request and output ONE wireframe concept that will be shown at 3 viewport sizes (web, tablet, mobile).
          Default to WEB-FIRST: interpret as a web product (website or web app) unless the user explicitly says "mobile app" or "mobile only".
          Output appName, layoutDescription (structural blocks only, e.g. Header, Nav, Main content, Footer), and purpose.
        `.trim();

      const { object } = await generateObject({
        model: openrouter.chat(analysisModel),
        schema: WireframeConceptSchema,
        system: WIREFRAME_ANALYSIS_PROMPT,
        prompt: analysisPrompt,
      });

      const themeToUse = existingTheme || "wireframe";
      if (!isExistingGeneration) {
        await prisma.project.update({
          where: { id: projectId, userId },
          data: { theme: themeToUse },
        });
      }

      await publish({
        channel: CHANNEL,
        topic: "analysis.complete",
        data: {
          status: "generating",
          theme: themeToUse,
          totalScreens,
          projectId,
        },
      });

      return { ...object, themeToUse };
    });

    const generatedFrames: typeof frames = isExistingGeneration
      ? [...frames]
      : [];

    // PHASE 2: Generate screen(s) based on wireframeKind
    if (wireframeKind === "web") {
      // One responsive layout – single HTML with Tailwind responsive classes, shown at 3 viewport sizes in the UI
      await step.run("generate-wireframe-responsive", async () => {
        const result = await generateText({
          model: openrouter.chat(generationModel),
          system: WIREFRAME_RESPONSIVE_SYSTEM_PROMPT,
          prompt: `
          RESPONSIVE wireframe (one layout for all viewport sizes)
          - Purpose: ${analysis.purpose}
          - LAYOUT (structure only): ${analysis.layoutDescription}

          Generate ONE responsive wireframe HTML. Use w-full and Tailwind responsive classes (md:, lg:, etc.) so the same HTML looks correct at 430px (mobile), 768px (tablet), and 1440px (desktop). No fixed width on root. Grayscale, placeholder text, clear blocks.
          `.trim(),
        });

        let finalHtml = result.text ?? "";
        const match = finalHtml.match(/<div[\s\S]*<\/div>/);
        finalHtml = match ? match[0] : finalHtml;
        finalHtml = finalHtml.replace(/```/g, "");

        const frame = await prisma.frame.create({
          data: {
            projectId,
            title: "Responsive",
            htmlContent: finalHtml,
          },
        });

        generatedFrames.push(frame);

        await publish({
          channel: CHANNEL,
          topic: "frame.created",
          data: {
            frame: { ...frame, isLoading: false },
            screenId: "responsive",
            frameId: frame.id,
            projectId,
          },
        });

        return { success: true, frame };
      });
    } else if (wireframeKind === "mobile") {
      // One mobile-only screen (430px)
      const viewport = WIREFRAME_VIEWPORTS[2]; // mobile
      await step.run("generate-wireframe-mobile", async () => {
        const result = await generateText({
          model: openrouter.chat(generationModel),
          system: WIREFRAME_GENERATION_SYSTEM_PROMPT,
          prompt: `
          Wireframe: Mobile only (${viewport.width}px width)
          - Purpose: ${analysis.purpose}
          - LAYOUT (structure only): ${analysis.layoutDescription}

          Generate LOW-FIDELITY wireframe HTML for mobile. Use a root <div> with width ${viewport.width}px (e.g. w-[${viewport.width}px] or style="width:${viewport.width}px"). Single column, stacked blocks. Grayscale, placeholder text, clear blocks. No colors, no images.
          `.trim(),
        });

        let finalHtml = result.text ?? "";
        const match = finalHtml.match(/<div[\s\S]*<\/div>/);
        finalHtml = match ? match[0] : finalHtml;
        finalHtml = finalHtml.replace(/```/g, "");

        const frame = await prisma.frame.create({
          data: {
            projectId,
            title: "Mobile",
            htmlContent: finalHtml,
          },
        });

        generatedFrames.push(frame);

        await publish({
          channel: CHANNEL,
          topic: "frame.created",
          data: {
            frame: { ...frame, isLoading: false },
            screenId: "mobile",
            frameId: frame.id,
            projectId,
          },
        });

        return { success: true, frame };
      });
    } else {
      // Legacy: 3 separate viewports (web, tablet, mobile)
      for (let i = 0; i < WIREFRAME_VIEWPORTS.length; i++) {
        const viewport = WIREFRAME_VIEWPORTS[i];

        await step.run(`generate-wireframe-${viewport.id}`, async () => {
          const result = await generateText({
            model: openrouter.chat(generationModel),
            system: WIREFRAME_GENERATION_SYSTEM_PROMPT,
            prompt: `
          Wireframe viewport ${i + 1}/3: ${viewport.name} (${
              viewport.width
            }px width)
          - Purpose: ${analysis.purpose}
          - LAYOUT (structure only): ${analysis.layoutDescription}

          Generate LOW-FIDELITY wireframe HTML for this viewport. Use a root <div> with width ${
            viewport.width
          }px (e.g. w-[${viewport.width}px] or style="width:${
              viewport.width
            }px") so the layout is correct at ${
              viewport.width
            }px. Adapt the layout for this viewport: ${
              viewport.id === "web"
                ? "desktop (e.g. sidebar, wide content)"
                : viewport.id === "tablet"
                ? "tablet (e.g. condensed nav, flexible grid)"
                : "mobile (e.g. single column, stacked blocks)"
            }. Grayscale, placeholder text, clear blocks. No colors, no images.
          `.trim(),
          });

          let finalHtml = result.text ?? "";
          const match = finalHtml.match(/<div[\s\S]*<\/div>/);
          finalHtml = match ? match[0] : finalHtml;
          finalHtml = finalHtml.replace(/```/g, "");

          const frame = await prisma.frame.create({
            data: {
              projectId,
              title: viewport.name,
              htmlContent: finalHtml,
            },
          });

          generatedFrames.push(frame);

          await publish({
            channel: CHANNEL,
            topic: "frame.created",
            data: {
              frame: { ...frame, isLoading: false },
              screenId: viewport.id,
              frameId: frame.id,
              projectId,
            },
          });

          return { success: true, frame };
        });
      }
    }

    await publish({
      channel: CHANNEL,
      topic: "generation.complete",
      data: { status: "completed", projectId },
    });
  }
);
