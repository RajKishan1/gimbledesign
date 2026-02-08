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

// One recommended section from research (e.g. Hero, Value props, Testimonials)
const RecommendedSectionSchema = z.object({
  name: z
    .string()
    .describe(
      "Section name as it appears in the layout, e.g. 'Hero', 'Value propositions', 'Features grid', 'Testimonials', 'Pricing', 'FAQ', 'Footer'."
    ),
  purpose: z
    .string()
    .describe(
      "One sentence: what this section accomplishes for the user or product goal."
    ),
  keyElements: z
    .array(z.string())
    .describe(
      "List of 2-6 specific UI elements in this section, e.g. ['Headline', 'Subheadline', 'Primary CTA', 'Secondary link']."
    ),
});

// Detailed research output before any wireframe planning (product, users, UI/UX, sections)
const WireframeResearchSchema = z.object({
  productSummary: z
    .string()
    .describe(
      "2-4 sentences: what the product is, who it's for, and the main value proposition."
    ),
  userGoals: z
    .array(z.string())
    .describe(
      "3-6 specific goals users have when they land on this screen (e.g. 'Understand the product quickly', 'Find pricing', 'Sign up')."
    ),
  targetUsers: z
    .string()
    .describe(
      "1-2 sentences: primary audience (e.g. 'SMB owners looking for project management', 'Shoppers comparing prices')."
    ),
  uxResearchSummary: z
    .string()
    .describe(
      "3-5 sentences: UX best practices for this screen type—what works in the industry, common patterns, conversion and clarity principles. Reference real-world examples or patterns (e.g. 'Landing pages with a single clear CTA above the fold convert better')."
    ),
  uiBestPractices: z
    .array(z.string())
    .describe(
      "4-8 concrete UI/UX principles to apply: visual hierarchy, F-pattern, whitespace, one primary CTA, trust signals, etc. Be specific to this screen type."
    ),
  recommendedSections: z
    .array(RecommendedSectionSchema)
    .min(6)
    .describe(
      "MANDATORY: 6-14 sections that this screen type should include. For landing: Hero, Navigation, Value props (or Problem/solution), Features, Social proof/Testimonials, Pricing or use cases, FAQ or objections, Final CTA, Footer. For product detail: Breadcrumb, Gallery, Title/price, Add to cart, Description, Specs, Reviews, Related products, Footer. For dashboard: Sidebar nav, Header, Key metrics row, Main content widgets (list 4-6), Footer. Each section has name, purpose, and keyElements. Do NOT output fewer than 6 sections—comprehensive screens have many sections."
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
      "Wireframe layout: list EVERY section in order from top to bottom. MUST include every section from the research (do not skip or merge). E.g. for landing: 1. Hero, 2. Navigation, 3. Value propositions (3 cards), 4. Features grid, 5. Social proof/Testimonials, 6. Pricing/Use cases, 7. FAQ, 8. Final CTA, 9. Footer. For product detail: 1. Header, 2. Breadcrumb, 3. Product gallery, 4. Product info (title, price, add to cart), 5. Description, 6. Specs, 7. Reviews, 8. Related products, 9. Footer. No colors—only structure and hierarchy. Minimum 6-10 sections for a full page."
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

const WIREFRAME_RESEARCH_PROMPT = `You are a senior UX researcher and product strategist. Your job is to do DETAILED RESEARCH before any wireframe is built. You think like a consultant: understand the product, the users, and UI/UX best practices so the final wireframe is comprehensive and follows proven patterns.

${UI_UX_PRINCIPLES}

CRITICAL — RESPECT THE EXACT SCREEN TYPE THE USER ASKS FOR:
- "Landing page" → research landing page best practices: hero, value props, social proof, CTA, trust, FAQ. Output 8-12 sections.
- "Product detail page" → research product page patterns: gallery, info, add to cart, description, specs, reviews, related. Output 8-10 sections.
- "Dashboard" → research dashboard patterns: sidebar, header, KPI cards, main content widgets, filters. Output 6-10 sections.
- "Pricing page", "About page", "Checkout", etc. → research that screen type and list 6-12 sections as appropriate.
- Never substitute a different screen type. Extract literally from the request.

YOUR TASKS:
1. Summarize the product and target users.
2. List clear user goals for this screen (what do they want to accomplish?).
3. Write a short UX research summary: what works in the industry for this screen type, conversion and clarity best practices.
4. List 4-8 specific UI/UX principles to apply (hierarchy, F-pattern, one primary CTA, trust signals, etc.).
5. MANDATORY: Output recommendedSections with AT LAST 6 and preferably 8-14 sections. Each section has: name (e.g. "Hero", "Value propositions"), purpose (one sentence), and keyElements (2-6 specific elements like "Headline", "CTA button"). Do NOT be minimal—full pages have many sections. For a landing page you MUST include: Hero, Navigation, Value props, Features (or benefits), Social proof/Testimonials, Pricing or use cases, FAQ or objection handling, Final CTA, Footer (with links). For product detail: Header, Breadcrumb, Gallery, Product info + CTA, Description, Specs, Reviews, Related products, Footer. Omit only if the screen type truly does not need them.

RULES:
- recommendedSections MUST have at least 6 items. Prefer 8-14 for landing/product/dashboard.
- Each section must have 2-6 keyElements so the wireframe generator knows what to draw.
- Base sections on real UI/UX best practices and conversion-focused layouts.`;

const WIREFRAME_ANALYSIS_PROMPT = `You are a senior UX researcher and information architect. You receive detailed RESEARCH (product summary, user goals, UX best practices, and recommendedSections). Your job is to produce ONE wireframe concept that uses ALL of that research and includes EVERY recommended section.

${UI_UX_PRINCIPLES}

CRITICAL — USE THE RESEARCH:
- You are given recommendedSections from the research phase. Your layoutDescription MUST list every one of those sections in order. Do not skip, merge, or shorten the list. The wireframe will be generated from your layoutDescription, so 6-14 sections means a rich, full page.
- Respect the exact screenType (landing page, product detail, dashboard, etc.). layoutDescription must match that type and include all research sections.
- elementPlan must cover every section and every keyElement from the research (plus global chrome like header/nav/footer). Every button, link, and block needs a one-sentence reason.

DEFAULT TO WEB-FIRST: Unless the user said "mobile app" or "mobile only", describe layout for desktop-first.

YOUR TASKS:
1. Set screenType from the user request (and research) — e.g. "landing page", "product detail page".
2. Set appName, purpose, principlesApplied (reference the research's UI/UX principles).
3. layoutDescription: Write a numbered list of EVERY section from the research, in order. E.g. "1. Hero (headline, subhead, primary CTA). 2. Navigation (logo, links, CTA). 3. Value propositions (3 cards). 4. Features grid (6 items). ..." Do not output fewer sections than research recommended.
4. elementPlan: Flatten all keyElements from all sections into one list, each with a product reason. Add header/nav/footer elements. Every element from recommendedSections must appear.

RULES:
- layoutDescription MUST include every section from recommendedSections. Minimum 6 sections; prefer 8-14.
- elementPlan: every button, link, input, and section from the research. No element without a reason.
- If the user said "mobile app" or "mobile only", use mobile-appropriate layout (stacked, fewer columns) but still include all sections.`;

const WIREFRAME_VIEWPORTS = [
  { id: "web", name: "Web", width: 1440, minHeight: 800 },
  { id: "tablet", name: "Tablet", width: 768, minHeight: 1024 },
  { id: "mobile", name: "Mobile", width: 393, minHeight: 852 },
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
5. STRUCTURE: Include EVERY section from the prompt (typically 8-14 sections). Clear blocks (header, nav, main content sections, footer). Match the layoutDescription and elementPlan—each element should exist for its stated reason. Do not produce a minimal layout; each section must be a visible block. Adapt layout for the given viewport (e.g. sidebar on web, stacked on mobile).
6. Do NOT use: images, gradients, heavy shadows, rounded beyond rounded-lg. DO use the theme variables above for all color.
7. Output ONLY raw HTML starting with <div>. No markdown, no \`\`\`, no <html>/<body>/<head>.

${THEME_VARIABLES_GUIDE}

Example: root <div class="flex flex-col w-full min-h-screen bg-[var(--background)] text-[var(--foreground)]">; cards with bg-[var(--card)] border border-[var(--border)]; primary button bg-[var(--primary)] text-[var(--primary-foreground)].`;

const WIREFRAME_RESPONSIVE_SYSTEM_PROMPT = `You generate a single LOW-FIDELITY RESPONSIVE WIREFRAME HTML that uses the app's theme variables so the design sidebar theme applies. One layout that adapts from mobile (393px) to desktop (1440px) using Tailwind responsive classes.

STRICT RULES:
1. Output ONE <div> that represents one screen. Use Tailwind LAYOUT and RESPONSIVE utilities: w-full, max-w-7xl, mx-auto, flex, flex-col md:flex-row, grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3, hidden md:block, etc.
2. Do NOT set a fixed width on the root. Use w-full so the design fills the viewport at any size. Use responsive breakpoints (sm:, md:, lg:, xl:) so the layout adapts: e.g. sidebar hidden on mobile (hidden md:block), single column on mobile and multi-column on desktop.
3. STYLING: Use ONLY theme variables—no hardcoded grays or hex. Apply: bg-[var(--background)], text-[var(--foreground)], border-[var(--border)], bg-[var(--card)], bg-[var(--primary)] text-[var(--primary-foreground)], bg-[var(--muted)] text-[var(--muted-foreground)]. This keeps the wireframe themeable from the design sidebar.
4. CONTENT: Placeholder text only. No images; use "[Icon]" or "≡" where needed. Match the elementPlan so every planned element appears with a clear purpose.
5. STRUCTURE: Include EVERY section listed in the prompt (typically 8-14 sections). Do not produce a minimal layout—each section (Hero, Value props, Features, Testimonials, Pricing, FAQ, CTA, Footer, etc.) must be a visible block. Clear blocks (header, nav, main content sections, footer). Layout should work at 393px (stacked), 768px (condensed), and 1440px (full desktop with sidebar if appropriate).
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

    // PHASE 0: Detailed research – product, users, UI/UX best practices, and 6–14 sections
    const research = await step.run("research-wireframe", async () => {
      await publish({
        channel: CHANNEL,
        topic: "analysis.start",
        data: { status: "researching", projectId },
      });

      const researchPrompt = isExistingGeneration
        ? `
          USER REQUEST: ${prompt}
          Existing wireframe project. Do detailed research: productSummary, userGoals, targetUsers, uxResearchSummary, uiBestPractices, and recommendedSections (at least 6, preferably 8-14 sections with name, purpose, keyElements for each). Preserve the exact screen type the user asked for.
        `.trim()
        : `
          USER REQUEST: ${prompt}

          Do thorough research before any wireframe is built. 1) Summarize the product and who it's for. 2) List user goals for this screen. 3) Summarize UX best practices for this screen type. 4) List 4-8 UI/UX principles to apply. 5) Output recommendedSections: at least 6 and preferably 8-14 sections. Each section needs: name (e.g. "Hero", "Value propositions"), purpose (one sentence), and keyElements (2-6 specific elements). Base this on the exact screen type the user asked for (landing page, product detail, dashboard, etc.) and industry best practices. Do not output fewer than 6 sections—full pages have many sections.
        `.trim();

      const { object } = await generateObject({
        model: openrouter.chat(analysisModel),
        schema: WireframeResearchSchema,
        system: WIREFRAME_RESEARCH_PROMPT,
        prompt: researchPrompt,
      });

      return object;
    });

    // PHASE 1: Analysis – one concept using research (all sections from research must appear)
    const analysis = await step.run("analyze-and-plan-wireframes", async () => {
      await publish({
        channel: CHANNEL,
        topic: "analysis.start",
        data: { status: "analyzing", projectId },
      });

      const sectionsList =
        research.recommendedSections
          .map(
            (s) =>
              `- ${s.name}: ${s.purpose}. Key elements: ${s.keyElements.join(", ")}`
          )
          .join("\n") || "";

      const analysisPrompt = `
          USER REQUEST: ${prompt}

          RESEARCH OUTPUT (use all of this):
          Product: ${research.productSummary}
          User goals: ${research.userGoals.join("; ")}
          Target users: ${research.targetUsers}
          UX research: ${research.uxResearchSummary}
          UI best practices: ${research.uiBestPractices.join("; ")}

          RECOMMENDED SECTIONS (your layoutDescription MUST include every one, in this order):
          ${sectionsList}

          Output ONE wireframe concept: screenType (exact page type from the request), appName, layoutDescription (numbered list of EVERY section above—do not skip any), purpose, principlesApplied, and elementPlan (every element from every section plus header/nav/footer, each with a reason). Default to WEB-FIRST unless they said "mobile app" or "mobile only".
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
    const sectionsToInclude =
      research.recommendedSections
        .map((s, i) => `${i + 1}. ${s.name} (${s.keyElements.join(", ")})`)
        .join("\n") || analysis.layoutDescription;

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

          SECTIONS YOU MUST INCLUDE (in this order; do not omit or merge any):
          ${sectionsToInclude}

          ${principlesNote}
          ELEMENT PLAN (include each with its product reason in mind):
          ${elementPlanText || "(Use layout description above.)"}

          Generate ONE responsive wireframe HTML for a ${
            analysis.screenType
          }. Include EVERY section listed above so the page is comprehensive (8-14 sections). Use w-full and Tailwind responsive classes (md:, lg:, etc.) for 393px, 768px, and 1440px. Use theme variables (bg-[var(--background)], text-[var(--foreground)], border-[var(--border)], bg-[var(--primary)] text-[var(--primary-foreground)], etc.) so the design sidebar theme applies. Placeholder text only; no images. Do not generate a different page type (e.g. if this is a landing page, do not output a product detail layout). Do not skip sections—each section must be visibly present.
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
      // One mobile-only screen (393px iPhone 16)
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

          SECTIONS YOU MUST INCLUDE (in this order; do not omit or merge any):
          ${sectionsToInclude}

          ${principlesNote}
          ELEMENT PLAN: ${elementPlanText || "(Use layout description above.)"}

          Generate wireframe HTML for a ${
            analysis.screenType
          } on mobile. Root <div> width ${
            viewport.width
          }px. Include EVERY section listed above (stacked). Single column, stacked blocks. Use theme variables. Placeholder text only; no images. Do not generate a different page type. Do not skip sections—each section must be visibly present.
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

          SECTIONS YOU MUST INCLUDE (in this order; do not omit or merge any):
          ${sectionsToInclude}

          ${principlesNote}
          ELEMENT PLAN: ${elementPlanText || "(Use layout description above.)"}

          Generate wireframe HTML for a ${analysis.screenType}. Viewport: ${
              viewport.name
            }. Root <div> width ${viewport.width}px. Include EVERY section listed above. Adapt for ${
              viewport.id === "web"
                ? "desktop"
                : viewport.id === "tablet"
                ? "tablet"
                : "mobile"
            }. Use theme variables. Placeholder text only; no images. Do not generate a different page type. Do not skip sections.
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
