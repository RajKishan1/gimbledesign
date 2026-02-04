import { generateObject, generateText } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import prisma from "@/lib/prisma";

// Element in the wireframe with a product rationale (every button, link, section has a reason)
const ElementPlanItemSchema = z.object({
  element: z
    .string()
    .describe(
      "UI element name, e.g. 'Primary CTA button', 'Sidebar nav link: Dashboard', 'Search input'."
    ),
  reason: z
    .string()
    .describe(
      "One sentence: why this element exists from a product/user perspective."
    ),
});

// Single concept: one layout for the product; we generate 3 viewport variants (web, tablet, mobile)
const WireframeConceptSchema = z.object({
  screenType: z
    .string()
    .describe(
      "The EXACT type of page/screen the user asked for. Extract literally from the request. Examples: 'landing page', 'product detail page', 'homepage', 'dashboard', 'checkout', 'catalog', 'pricing page', 'about page', 'contact page', 'login/signup'. If user says 'landing page' or 'landing page for e-commerce', output 'landing page'. If they say 'product page' or 'product detail', output 'product detail page'. Do NOT substitute: landing page ≠ product detail ≠ dashboard."
    ),
  appName: z
    .string()
    .describe("A short name for the app/product based on the user's request."),
  layoutDescription: z
    .string()
    .describe(
      "Wireframe layout only: list content blocks and their placement. MUST match the screenType. E.g. for landing page: Hero, value props, social proof, CTA, Footer. For product detail: Header, breadcrumb, product gallery, product info, add to cart, related products. For dashboard: Sidebar, header, main content area (widgets/cards), Footer. No colors or visual style—only structure and hierarchy."
    ),
  purpose: z
    .string()
    .describe(
      "One sentence: what this screen/product accomplishes (e.g. 'Landing page to convert visitors to sign-up' or 'Dashboard for viewing analytics'). Must align with screenType."
    ),
  principlesApplied: z
    .string()
    .optional()
    .describe(
      "Brief note on how key UI/UX principles will guide this wireframe: visual hierarchy, proximity, clarity, alignment, contrast, simplicity, whitespace, layout, balance & harmony, consistency, visual cues, typography, interaction cost. 2-4 sentences."
    ),
  elementPlan: z
    .array(ElementPlanItemSchema)
    .optional()
    .describe(
      "Every significant UI element that will appear (buttons, links, inputs, sections, nav items). Each entry must have a product reason—why it exists for the user or the product goal."
    ),
});

const UI_UX_PRINCIPLES = `
Apply these UI/UX principles when planning the wireframe:
- Visual hierarchy: Most important content/actions stand out (size, position).
- Proximity: Related items grouped; unrelated items spaced apart.
- Clarity: Clear labels, no ambiguity; one purpose per element.
- Alignment: Consistent alignment (grid, edges) for order and scanability.
- Contrast: Distinct levels (primary vs secondary actions, headings vs body).
- Simplicity: Only necessary elements; remove clutter.
- Whitespace: Adequate breathing room; avoid crowding.
- Layout: Logical flow (F-pattern, Z-pattern) and clear structure.
- Balance & harmony: Visual weight distributed; consistent spacing.
- Consistency: Same patterns for same types (e.g. all primary actions look primary).
- Visual cues: Affordances (buttons look clickable, links recognizable).
- Typography: Clear hierarchy (heading vs body, readable sizes).
- Interaction cost: Fewer steps for key tasks; important actions easy to reach.
`;

const WIREFRAME_ANALYSIS_PROMPT = `You are a senior UX researcher and information architect. Before generating any wireframe, you do thorough research and planning so every element has a product rationale and the layout follows UI/UX best practices.

${UI_UX_PRINCIPLES}

CRITICAL — RESPECT THE EXACT SCREEN TYPE THE USER ASKS FOR:
- If the user says "landing page", "landing page for e-commerce", "landing page for web app", etc., you MUST output screenType: "landing page" and a LANDING PAGE layout: hero section, value proposition, social proof/testimonials, primary CTA, footer. Do NOT output a product detail page, catalog, or dashboard.
- If the user says "product detail", "product page", "product page for e-commerce", output screenType: "product detail page" and a PRODUCT DETAIL layout: product images, title, price, add to cart, description, etc.
- If the user says "dashboard", "admin panel", output screenType: "dashboard" and a dashboard layout (sidebar, widgets, charts).
- If the user says "homepage", treat as landing or main hub per context; if they say "e-commerce homepage" or "store homepage", that can include hero + featured products + categories.
- Extract screenType literally from the request. Never substitute a different page type (e.g. do not turn "landing page" into "product detail" just because the product is e-commerce).

DEFAULT TO WEB-FIRST: Unless the user explicitly says "mobile app" or "mobile only", interpret as a web product. Describe layout for desktop-first; we adapt for tablet and mobile.

YOUR TASKS:
1. Extract screenType: What exact page/screen did the user ask for? (landing page, product detail, dashboard, checkout, etc.)
2. Research: User goal, product context, and the principles above. Decide what this screen must accomplish.
3. Plan: List every significant UI element for THIS screen type. For a landing page: hero, headline, subhead, CTA, trust badges, footer. For product detail: gallery, title, price, add to cart, description. For each element, give a one-sentence product reason.
4. Output: screenType, appName, layoutDescription (structural blocks that match screenType), purpose, principlesApplied, and elementPlan.

RULES:
- layoutDescription MUST match screenType. Landing page ≠ product detail ≠ dashboard.
- elementPlan: every button, link, input, and major section for this screen type. No element without a reason.
- If the user says "mobile app" or "mobile only", use a mobile-appropriate layout and plan elements accordingly.`;

const WIREFRAME_VIEWPORTS = [
  { id: "web", name: "Web", width: 1440, minHeight: 800 },
  { id: "tablet", name: "Tablet", width: 768, minHeight: 1024 },
  { id: "mobile", name: "Mobile", width: 430, minHeight: 932 },
] as const;

const THEME_VARIABLES_GUIDE = `
THEME (use Tailwind arbitrary values so the design sidebar theme applies):
- Page/surface: bg-[var(--background)] text-[var(--foreground)]
- Cards/sections: bg-[var(--card)] border-[var(--border)] text-[var(--card-foreground)]
- Primary actions/buttons: bg-[var(--primary)] text-[var(--primary-foreground)]
- Secondary/muted areas: bg-[var(--muted)] text-[var(--muted-foreground)]
- Borders: border-[var(--border)]
- Inputs: border-[var(--input)] or bg-[var(--input)]
- Accent highlights: bg-[var(--accent)] text-[var(--accent-foreground)]
Use these CSS variables for all backgrounds, text, and borders. No hardcoded gray/hex. This lets the user's chosen theme in the design sidebar control the wireframe look.
`;

const WIREFRAME_GENERATION_SYSTEM_PROMPT = `You generate LOW-FIDELITY WIREFRAME HTML that uses the app's theme variables so the design sidebar theme applies.

STRICT RULES:
1. Output a single <div> that represents one screen. Use Tailwind for LAYOUT (flex, grid, gap, p-4, etc.) and for THEME via CSS variables (see below).
2. The root <div> MUST have a fixed width matching the viewport (e.g. w-[1440px] or max-w-full with an inner container at the viewport width) so the layout is correct at that size.
3. STYLING: Use ONLY theme variables—no hardcoded grays or hex. Apply: bg-[var(--background)], text-[var(--foreground)], border-[var(--border)], bg-[var(--card)], bg-[var(--primary)] text-[var(--primary-foreground)], bg-[var(--muted)] text-[var(--muted-foreground)]. This keeps the wireframe themeable from the design sidebar.
4. CONTENT: Placeholder text only: "Label", "Content area", "Nav item 1", "Lorem ipsum...", "Button", "Header", "Footer". No real copy. No images; use "[Icon]" or "≡" where needed.
5. STRUCTURE: Clear blocks (header, nav, main, footer). Match the layoutDescription and elementPlan—each element should exist for its stated reason. Adapt layout for the given viewport (e.g. sidebar on web, stacked on mobile).
6. Do NOT use: images, gradients, heavy shadows, rounded beyond rounded-lg. DO use the theme variables above for all color.
7. Output ONLY raw HTML starting with <div>. No markdown, no \`\`\`, no <html>/<body>/<head>.

${THEME_VARIABLES_GUIDE}

Example: root <div class="flex flex-col w-full min-h-screen bg-[var(--background)] text-[var(--foreground)]">; cards with bg-[var(--card)] border border-[var(--border)]; primary button bg-[var(--primary)] text-[var(--primary-foreground)].`;

const WIREFRAME_RESPONSIVE_SYSTEM_PROMPT = `You generate a single LOW-FIDELITY RESPONSIVE WIREFRAME HTML that uses the app's theme variables so the design sidebar theme applies. One layout that adapts from mobile (430px) to desktop (1440px) using Tailwind responsive classes.

STRICT RULES:
1. Output ONE <div> that represents one screen. Use Tailwind LAYOUT and RESPONSIVE utilities: w-full, max-w-7xl, mx-auto, flex, flex-col md:flex-row, grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3, hidden md:block, etc.
2. Do NOT set a fixed width on the root. Use w-full so the design fills the viewport at any size. Use responsive breakpoints (sm:, md:, lg:, xl:) so the layout adapts: e.g. sidebar hidden on mobile (hidden md:block), single column on mobile and multi-column on desktop.
3. STYLING: Use ONLY theme variables—no hardcoded grays or hex. Apply: bg-[var(--background)], text-[var(--foreground)], border-[var(--border)], bg-[var(--card)], bg-[var(--primary)] text-[var(--primary-foreground)], bg-[var(--muted)] text-[var(--muted-foreground)]. This keeps the wireframe themeable from the design sidebar.
4. CONTENT: Placeholder text only. No images; use "[Icon]" or "≡" where needed. Match the elementPlan so every planned element appears with a clear purpose.
5. STRUCTURE: Clear blocks (header, nav, main, footer). Layout should work at 430px (stacked), 768px (condensed), and 1440px (full desktop with sidebar if appropriate).
6. Output ONLY raw HTML starting with <div>. No markdown, no \`\`\`, no <html>/<body>/<head>.

${THEME_VARIABLES_GUIDE}`;

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
          Existing wireframe project. Output one full concept: screenType (exact page type the user asked for), appName, layoutDescription (must match screenType), purpose, principlesApplied, and elementPlan. Default to web-first. Do not substitute a different screen type than the user requested.
        `.trim()
        : `
          USER REQUEST: ${prompt}

          Analyze the request and output ONE wireframe concept. First extract screenType: what exact page did the user ask for? (e.g. "landing page", "product detail page", "dashboard"). If they said "landing page for e-commerce", screenType is "landing page"—not "product detail". Then output layoutDescription that matches that screen type, purpose, principlesApplied, and elementPlan. Default to WEB-FIRST unless they said "mobile app" or "mobile only".
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
    const elementPlanText =
      (analysis.elementPlan?.length ?? 0) > 0
        ? (analysis.elementPlan ?? [])
            .map((e) => `- ${e.element}: ${e.reason}`)
            .join("\n")
        : "";
    const principlesNote = analysis.principlesApplied
      ? `Principles applied: ${analysis.principlesApplied}\n\n`
      : "";

    if (wireframeKind === "web") {
      // One responsive layout – single HTML with Tailwind responsive classes, shown at 3 viewport sizes in the UI
      await step.run("generate-wireframe-responsive", async () => {
        const result = await generateText({
          model: openrouter.chat(generationModel),
          system: WIREFRAME_RESPONSIVE_SYSTEM_PROMPT,
          prompt: `
          SCREEN TYPE (generate exactly this—do not switch to another page type): ${
            analysis.screenType
          }

          RESPONSIVE wireframe (one layout for all viewport sizes)
          - Purpose: ${analysis.purpose}
          - LAYOUT (must match screen type above): ${analysis.layoutDescription}

          ${principlesNote}
          ELEMENT PLAN (include each with its product reason in mind):
          ${elementPlanText || "(Use layout description above.)"}

          Generate ONE responsive wireframe HTML for a ${
            analysis.screenType
          }. Use w-full and Tailwind responsive classes (md:, lg:, etc.) for 430px, 768px, and 1440px. Use theme variables (bg-[var(--background)], text-[var(--foreground)], border-[var(--border)], bg-[var(--primary)] text-[var(--primary-foreground)], etc.) so the design sidebar theme applies. Placeholder text only; no images. Do not generate a different page type (e.g. if this is a landing page, do not output a product detail layout).
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
          SCREEN TYPE (generate exactly this): ${analysis.screenType}

          Wireframe: Mobile only (${viewport.width}px width)
          - Purpose: ${analysis.purpose}
          - LAYOUT (must match screen type): ${analysis.layoutDescription}

          ${principlesNote}
          ELEMENT PLAN: ${elementPlanText || "(Use layout description above.)"}

          Generate wireframe HTML for a ${
            analysis.screenType
          } on mobile. Root <div> width ${
            viewport.width
          }px. Single column, stacked blocks. Use theme variables. Placeholder text only; no images. Do not generate a different page type.
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
          SCREEN TYPE (generate exactly this): ${analysis.screenType}

          Wireframe viewport ${i + 1}/3: ${viewport.name} (${
              viewport.width
            }px width)
          - Purpose: ${analysis.purpose}
          - LAYOUT (must match screen type): ${analysis.layoutDescription}

          ${principlesNote}
          ELEMENT PLAN: ${elementPlanText || "(Use layout description above.)"}

          Generate wireframe HTML for a ${analysis.screenType}. Viewport: ${
              viewport.name
            }. Root <div> width ${viewport.width}px. Adapt for ${
              viewport.id === "web"
                ? "desktop"
                : viewport.id === "tablet"
                ? "tablet"
                : "mobile"
            }. Use theme variables. Placeholder text only; no images. Do not generate a different page type.
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
