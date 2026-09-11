import { z } from "zod";
import {
  PLATFORMS,
  type AppStoreBrief,
  type DeviceVariant,
  type PlatformId,
  type ScreenPlan,
  type StyleGuide,
} from "./specs";

/**
 * App Store Screens — prompts.
 *
 * Two prompt families live here:
 *
 *  1. ART DIRECTION (text/vision LLM). Reads the brief + uploaded assets and
 *     freezes a style guide plus a per-screen plan. This is what makes the set
 *     coherent: every image prompt is rendered from the same JSON.
 *
 *  2. IMAGE PROMPTS (gpt-image-2). One prompt per screen, built from the frozen
 *     style guide ("style bible"), the screen plan, and an explicit contract for
 *     each reference image passed to the model (hero output, logo, real
 *     screenshot, optional style reference).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Art direction
// ─────────────────────────────────────────────────────────────────────────────

export const ART_DIRECTOR_SYSTEM_PROMPT = `You are the creative director of a top-tier mobile growth studio. You have art-directed App Store and Google Play listings for category-leading apps, and you know exactly what separates screenshots that convert from screenshots that look like templates.

Your job: read a product brief (and, when supplied, the app's logo, real UI screenshots and a style reference), then produce ONE frozen visual system and a per-screen plan for a set of store screenshots. A separate image model will render every screen from your plan, so your output must be precise, literal and reproducible — describe things the way you would brief a meticulous junior designer who cannot ask follow-up questions.

════════════════════════════════════════
WHAT GREAT STORE SCREENSHOTS DO
════════════════════════════════════════
1. They tell one story in order. Screen 1 is the promise: the single biggest benefit and the app's signature screen. Screens 2…N each carry exactly ONE idea, ordered by how much the user cares, not by how proud the team is. The last screen is a satisfying close (the outcome, the feeling, or a strong secondary benefit) — never a feature dump.
2. They lead with benefits, not features. "Fall asleep faster" beats "Sleep sounds library". Headlines answer "what do I get?" in the user's language.
3. They look like one product. Same background system, same palette, same type, same device scale and position, same caption position, same shadow — on every screen. Variety comes from the content on the device and the copy, not from the layout.
4. They are legible at thumbnail size. Big headline, high contrast, generous margins, one focal point. If a passer-by scrolling the store cannot read the headline in 1 second, it failed.
5. They show real UI, faithfully. The product is the hero; decoration supports it and never competes with it.

════════════════════════════════════════
COPY RULES
════════════════════════════════════════
- Headline: 2–5 words. Concrete, active, specific. Sentence case unless the brand clearly uses Title Case. No exclamation marks, no emojis, no quotation marks, no ellipses, no ALL CAPS. No "the best", "#1", "amazing", "revolutionary". Do not repeat the app name in headlines (it is allowed once, on screen 1, only if it reads naturally).
- Subheadline: optional, max 9 words, adds a specific detail the headline cannot. Be consistent: either every screen has a subheadline or none does.
- Headlines must work as a sequence when read top to bottom: no two say the same thing; no headline depends on another to make sense.
- Write in the language of the brief. If the brief is in English, write English.
- Never fabricate awards, ratings, review quotes, user counts, prices or "Editor's Choice". Never name competitors or platform vendors.

════════════════════════════════════════
VISUAL SYSTEM RULES
════════════════════════════════════════
PALETTE
- Derive the palette from the supplied brand colors first, then the logo, then the UI screenshots. If none are supplied, choose a palette that fits the category and tone.
- Exactly five roles: background, backgroundSecondary (for gradients/shapes), accent, headline text, subheadline text. All as 6-digit hex.
- Headline text must have very strong contrast against the background (aim for WCAG ≥ 7:1). Light UI usually looks best on a saturated or deep background; dark UI on a light or richly coloured background with a soft glow.
- deviceFrame: pick the frame colour that contrasts best with the background ("black" or "graphite" on light/mid backgrounds, "white" or "silver" on dark backgrounds).

BACKGROUND SYSTEM
- One system reused on every screen, described so precisely it can be redrawn identically: gradient direction and stops (use the palette hexes), any grain/noise, and at most one recurring motif (e.g. one large soft blurred accent orb anchored top-right, or a thin concentric-ring pattern). Absolutely no photographs, no stock illustrations, no busy patterns, no confetti.

TYPOGRAPHY
- One family style only, described by character (e.g. "geometric grotesk in the spirit of Inter / SF Pro Display"). Headline: heavy weight, tight tracking, ~2 lines max. Subheadline: regular/medium weight, ~1 line. Say where the text sits and how it is aligned (centered is the safe default).

DEVICE TREATMENT
- One rule set for the entire set: device scale (typically the device spans 68–78% of the canvas width), vertical anchoring, corner radius, frame colour, a single soft physically plausible shadow, and whether the bottom of the device is allowed to be cropped by the canvas edge. No hands, no perspective camera tricks unless the brief asks.
- deviceVariant per screen: use "straight" for most screens. At most ONE tilted screen (usually the hero, ±6–10°) and at most ONE "zoom-crop" screen (device enlarged to focus on a specific UI region). Never tilt two screens in a row.

CAPTION PLACEMENT
- Choose "top" or "bottom" once for the whole set. Top is the default (the headline is read first). The caption block owns roughly the top (or bottom) 20% of the canvas and never overlaps the device.

LOGO USAGE
- "hero-only": a small logo mark above the headline on screen 1 only (the classic choice). "every-screen": a small mark in the same spot on every screen (only for strong, simple marks). "none": never show it. Never place the logo inside the device or distort it.

SCREENSHOT MAPPING
- If real UI screenshots are supplied, assign each to the screen whose story it best supports (look at what the screenshot actually shows). Use each screenshot at most once unless there are fewer screenshots than screens. Prefer leaving screenshotAssetId null over forcing an unrelated screenshot.
- When a screen has no screenshot, the visualBrief MUST describe the UI to render in concrete detail (screen type, components, realistic sample content) so the image model can draw a believable, on-brand screen.

VISUAL BRIEF (per screen)
- 2–4 sentences. What is on the device display; the single optional callout (one UI element lifted out as a floating card, or none); where the motif sits on this screen. Never introduce colours, fonts or layout rules that are not in the style system.

════════════════════════════════════════
OUTPUT
════════════════════════════════════════
Return ONLY one JSON object — no prose before or after, no markdown fences. Fill every field. Be specific and literal — hexes, degrees, percentages, positions. Exact shape:

{
  "styleGuide": {
    "concept": "one paragraph: the creative concept for the set and why it fits this app",
    "mood": "3–6 adjectives",
    "palette": {
      "background": "#RRGGBB",
      "backgroundSecondary": "#RRGGBB",
      "accent": "#RRGGBB",
      "headline": "#RRGGBB",
      "subheadline": "#RRGGBB",
      "deviceFrame": "black | graphite | white | silver"
    },
    "backgroundStyle": "exact background recipe: gradient direction & stops (hexes), grain, motif position",
    "typography": {
      "family": "type family character, e.g. geometric grotesk in the spirit of Inter",
      "headlineStyle": "weight, relative size, tracking, alignment, max lines",
      "subheadlineStyle": "weight, relative size, colour role, alignment",
      "textCase": "sentence | title"
    },
    "deviceTreatment": "device scale (% of canvas width), vertical anchoring, corner radius, frame colour, shadow, whether bottom crop is allowed",
    "captionPlacement": "top | bottom",
    "logoUsage": "hero-only | every-screen | none",
    "decorativeMotif": "the single recurring decorative element and its rule, or 'none'",
    "avoid": "set-specific things the renderer must never do"
  },
  "screens": [
    {
      "index": 0,
      "headline": "2–5 words",
      "subheadline": "max 9 words, or null",
      "visualBrief": "2–4 sentences",
      "screenshotAssetId": "assetId of the screenshot shown on this screen, or null",
      "deviceVariant": "straight | tilt-left | tilt-right | zoom-crop"
    }
  ]
}`;

/**
 * Parse the art director's reply. Tolerates markdown fences and stray prose
 * around the object; validates against the schema.
 */
export function parseArtDirection(text: string): ArtDirection {
  let candidate = text.trim();
  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidate = fenced[1].trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Art director reply contained no JSON object");
  }
  const json = JSON.parse(candidate.slice(start, end + 1));
  return ArtDirectionSchema.parse(json);
}

export const StyleGuideSchema = z.object({
  concept: z
    .string()
    .describe("One paragraph: the creative concept for the whole set and why it fits this app."),
  mood: z.string().describe("3–6 adjectives that describe the finished look."),
  palette: z.object({
    background: z.string().describe("6-digit hex, main canvas colour"),
    backgroundSecondary: z.string().describe("6-digit hex, second gradient stop / shapes"),
    accent: z.string().describe("6-digit hex, brand accent used sparingly"),
    headline: z.string().describe("6-digit hex, headline text colour"),
    subheadline: z.string().describe("6-digit hex, subheadline text colour"),
    deviceFrame: z.enum(["black", "graphite", "white", "silver"]),
  }),
  backgroundStyle: z
    .string()
    .describe("Exact background recipe: gradient direction & stops (hexes), grain, motif position. Reused identically on every screen."),
  typography: z.object({
    family: z.string().describe("Type family character, e.g. 'geometric grotesk in the spirit of Inter'"),
    headlineStyle: z.string().describe("Weight, relative size, tracking, alignment, max lines"),
    subheadlineStyle: z.string().describe("Weight, relative size, colour role, alignment"),
    textCase: z.enum(["sentence", "title"]),
  }),
  deviceTreatment: z
    .string()
    .describe("Device scale (% of canvas width), vertical anchoring, corner radius, frame colour, shadow, whether bottom crop is allowed."),
  captionPlacement: z.enum(["top", "bottom"]),
  logoUsage: z.enum(["hero-only", "every-screen", "none"]),
  decorativeMotif: z
    .string()
    .describe("The single recurring decorative element and its rule, or 'none'."),
  avoid: z.string().describe("Set-specific things the renderer must never do."),
});

export const ScreenPlanSchema = z.object({
  index: z.number().int().min(0),
  headline: z.string().min(2).max(60),
  subheadline: z.string().max(90).nullable(),
  visualBrief: z.string().min(20),
  screenshotAssetId: z.string().nullable(),
  deviceVariant: z.enum(["straight", "tilt-left", "tilt-right", "zoom-crop"]),
});

export const ArtDirectionSchema = z.object({
  styleGuide: StyleGuideSchema,
  screens: z.array(ScreenPlanSchema).min(1),
});

export type ArtDirection = z.infer<typeof ArtDirectionSchema>;

export type ArtDirectorAsset = {
  id: string;
  kind: "logo" | "screenshot" | "reference";
  name: string;
  width: number;
  height: number;
  /** 1-based position of this asset among the images attached to the message. */
  imageIndex: number;
};

export function buildArtDirectorUserPrompt(
  brief: AppStoreBrief,
  assets: ArtDirectorAsset[],
): string {
  const platform = PLATFORMS[brief.platform];
  const features = brief.features.filter((f) => f.trim().length > 0);

  const assetLines =
    assets.length === 0
      ? "No images were uploaded. Derive the palette from the brand colours (if any), the category and the tone. Every screen will need a fully described UI in its visualBrief."
      : assets
          .map((a) => {
            const role =
              a.kind === "logo"
                ? "APP LOGO"
                : a.kind === "screenshot"
                  ? `REAL APP SCREENSHOT (assetId: ${a.id})`
                  : "STYLE REFERENCE (mood only, do not copy content)";
            return `- Image ${a.imageIndex}: ${role} — "${a.name}", ${a.width}×${a.height}px`;
          })
          .join("\n");

  const featureBlock =
    features.length > 0
      ? `KEY MOMENTS PROVIDED BY THE USER (map them to screens in this order; one moment per screen, then fill any remaining screens with the next most valuable benefits):\n${features
          .map((f, i) => `  ${i + 1}. ${f.trim()}`)
          .join("\n")}`
      : "KEY MOMENTS: none provided — decide the narrative yourself from the description.";

  return `PRODUCT BRIEF
- App name: ${brief.appName}
- Tagline: ${brief.tagline?.trim() || "(none)"}
- Category: ${brief.category}
- Target platform: ${platform.label} (portrait, aspect ${platform.aspect.toFixed(3)})
- Tone: ${brief.tone}
- Brand colours: ${brief.brandColors.length ? brief.brandColors.join(", ") : "(none given — derive from assets)"}
- Audience: ${brief.audience?.trim() || "(not specified)"}
- Description:
${brief.description.trim()}
${brief.extraInstructions?.trim() ? `\n- Extra instructions from the user (must be honoured):\n${brief.extraInstructions.trim()}\n` : ""}
UPLOADED ASSETS
${assetLines}

${featureBlock}

REQUIRED OUTPUT
- Exactly ${brief.screenCount} screens, index 0…${brief.screenCount - 1}, in display order. Screen 0 is the hero.
- For each screenshot asset, decide which screen shows it (screenshotAssetId = the assetId above) or leave null.
- Keep the whole set on one visual system as described in your instructions.`;
}

/** Make the LLM's plan safe to use: correct count, indices, and asset ids. */
export function normalizeArtDirection(
  raw: ArtDirection,
  brief: AppStoreBrief,
  validAssetIds: Set<string>,
): { styleGuide: StyleGuide; screens: ScreenPlan[] } {
  const count = brief.screenCount;
  const hex = (v: string, fallback: string) =>
    /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim().toUpperCase() : fallback;

  const g = raw.styleGuide;
  const styleGuide: StyleGuide = {
    concept: g.concept,
    mood: g.mood,
    palette: {
      background: hex(g.palette.background, "#0F172A"),
      backgroundSecondary: hex(g.palette.backgroundSecondary, "#1E293B"),
      accent: hex(g.palette.accent, "#38BDF8"),
      headline: hex(g.palette.headline, "#FFFFFF"),
      subheadline: hex(g.palette.subheadline, "#CBD5E1"),
      deviceFrame: g.palette.deviceFrame,
    },
    backgroundStyle: g.backgroundStyle,
    typography: g.typography,
    deviceTreatment: g.deviceTreatment,
    captionPlacement: g.captionPlacement,
    logoUsage: g.logoUsage,
    decorativeMotif: g.decorativeMotif,
    avoid: g.avoid,
  };

  const usedAssets = new Set<string>();
  const sorted = [...raw.screens].sort((a, b) => a.index - b.index).slice(0, count);
  const screens: ScreenPlan[] = [];
  for (let i = 0; i < count; i++) {
    const s = sorted[i];
    const fallbackHeadline = brief.features[i]?.trim() || `${brief.appName} highlight ${i + 1}`;
    let assetId = s?.screenshotAssetId ?? null;
    if (assetId && (!validAssetIds.has(assetId) || usedAssets.has(assetId))) assetId = null;
    if (assetId) usedAssets.add(assetId);
    screens.push({
      index: i,
      headline: (s?.headline || fallbackHeadline).trim().slice(0, 60),
      subheadline: s?.subheadline?.trim() ? s.subheadline.trim().slice(0, 90) : null,
      visualBrief:
        s?.visualBrief?.trim() ||
        `The device shows the ${brief.appName} screen that best demonstrates: ${fallbackHeadline}. Realistic, on-brand UI with believable sample content.`,
      screenshotAssetId: assetId,
      deviceVariant: (s?.deviceVariant as DeviceVariant) || "straight",
    });
  }
  // Enforce "no two tilted screens in a row" and at most one zoom-crop.
  let zoomUsed = false;
  for (let i = 0; i < screens.length; i++) {
    const v = screens[i].deviceVariant;
    const prev = screens[i - 1]?.deviceVariant;
    if ((v === "tilt-left" || v === "tilt-right") && (prev === "tilt-left" || prev === "tilt-right")) {
      screens[i].deviceVariant = "straight";
    }
    if (v === "zoom-crop") {
      if (zoomUsed) screens[i].deviceVariant = "straight";
      zoomUsed = true;
    }
  }
  return { styleGuide, screens };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Image prompts
// ─────────────────────────────────────────────────────────────────────────────

const HARD_RULES = `HARD RULES (apply to every screen in the set)
- Full-bleed artwork that fills the entire canvas. No outer border, no rounded canvas corners, no drop shadow around the canvas, no mock "phone in a phone".
- The ONLY text outside the device is the headline (and subheadline if given). No captions, labels, arrows with words, watermarks, URLs, hashtags, app-store badges, "Download" buttons, prices, star ratings, award seals, or review quotes.
- Spell every word exactly as given. Do not translate, paraphrase, abbreviate, hyphenate across lines, or add punctuation.
- Keep a safe margin of at least 6% of the canvas width on all sides: no text and no critical UI touches the edges. (A device whose bottom is deliberately cropped by the canvas edge, when the style bible says so, is fine.)
- Headline and device never overlap. The caption block and the device each get their own region.
- No hands, people, faces, pets, or photographs unless the visual brief explicitly asks.
- No vendor branding: no Apple/Google logos, no "iPhone"/"Pixel" wordmarks on the device, no store badges.
- The device display shows ONLY the app UI: no reflections that obscure it, no fake cracks, no fingerprints. Status bar: time 9:41, full signal, full battery, no carrier name.
- Commercial-grade finish: crisp vector-like edges, correct kerning, no artefacts, no blur except the single intentional soft shadow and background glow, no chromatic aberration, no film grain heavier than a whisper.`;

function paletteBlock(guide: StyleGuide) {
  const p = guide.palette;
  return `Palette (use ONLY these colours for everything outside the device; the UI inside the device keeps its own real colours):
  background ............ ${p.background}
  background secondary .. ${p.backgroundSecondary}
  accent ................ ${p.accent}
  headline text ......... ${p.headline}
  subheadline text ...... ${p.subheadline}
  device frame .......... ${p.deviceFrame}`;
}

/** The block that is identical for every screen in a set. */
export function buildStyleBible(
  brief: AppStoreBrief,
  guide: StyleGuide,
  platform: PlatformId,
  size: { width: number; height: number },
): string {
  const p = PLATFORMS[platform];
  const captionRegion =
    guide.captionPlacement === "top"
      ? "the caption block occupies roughly the top 20% of the canvas (headline first, subheadline beneath), and the device sits below it"
      : "the caption block occupies roughly the bottom 20% of the canvas (headline above subheadline), and the device sits above it";

  const logoRule =
    guide.logoUsage === "every-screen"
      ? "Logo: the supplied logo mark appears small (about 6% of canvas width) in the same spot above the headline on every screen, untouched and undistorted."
      : guide.logoUsage === "none"
        ? "Logo: never shown."
        : "Logo: the supplied logo mark appears small (about 6% of canvas width) above the headline on screen 1 ONLY; other screens show no logo.";

  return `══════════ STYLE BIBLE — identical for every screen of this set ══════════
Canvas: ${size.width}×${size.height}px portrait ${p.store} screenshot for ${p.short}. Aspect ${p.aspect.toFixed(3)}.
Brand: "${brief.appName}"${brief.tagline ? ` — ${brief.tagline}` : ""}. Category: ${brief.category}. Tone: ${brief.tone}.
Concept: ${guide.concept}
Mood: ${guide.mood}

${paletteBlock(guide)}

Background system (redraw this identically every time): ${guide.backgroundStyle}
Recurring motif: ${guide.decorativeMotif}

Typography: ${guide.typography.family}. Headline — ${guide.typography.headlineStyle}. Subheadline — ${guide.typography.subheadlineStyle}. Text case: ${guide.typography.textCase} case. Headline colour ${guide.palette.headline}, subheadline colour ${guide.palette.subheadline}.
Layout: ${captionRegion}. Text is horizontally centered unless the typography rule says otherwise.
Device: a ${p.deviceNoun}, ${guide.palette.deviceFrame} frame. ${guide.deviceTreatment} The display is filled edge-to-edge by the app UI with realistic screen corner radius; the frame has thin, even bezels and a single soft, physically plausible shadow consistent with one light source from the top-left.
${logoRule}
Set-specific things to avoid: ${guide.avoid}

${HARD_RULES}`;
}

export type ScreenReferenceRoles = {
  /** 1-based index of the finished hero image among the attached images, if attached. */
  hero?: number;
  logo?: number;
  screenshot?: number;
  reference?: number;
};

export type BuildScreenPromptArgs = {
  brief: AppStoreBrief;
  guide: StyleGuide;
  platform: PlatformId;
  size: { width: number; height: number };
  screen: ScreenPlan;
  total: number;
  refs: ScreenReferenceRoles;
  /** Free-text adjustments for a regeneration; everything else stays identical. */
  adjustments?: string | null;
};

function variantInstruction(v: DeviceVariant): string {
  switch (v) {
    case "tilt-left":
      return "Device variant: rotated about 7° counter-clockwise (top leaning left), same scale and shadow as the straight variant.";
    case "tilt-right":
      return "Device variant: rotated about 7° clockwise (top leaning right), same scale and shadow as the straight variant.";
    case "zoom-crop":
      return "Device variant: the device is enlarged to roughly 135% of the standard scale and cropped by the canvas edges so the viewer's eye lands on the UI region named in the visual brief. The visible part of the frame keeps the same colour, radius and shadow.";
    default:
      return "Device variant: upright, centered horizontally, standard scale and position from the style bible.";
  }
}

export function buildScreenPrompt(args: BuildScreenPromptArgs): string {
  const { brief, guide, platform, size, screen, total, refs, adjustments } = args;
  const n = screen.index + 1;
  const p = PLATFORMS[platform];

  // ── Reference image contract ──────────────────────────────────────────────
  const refLines: string[] = [];
  if (refs.hero) {
    refLines.push(
      `- Image ${refs.hero} = MASTER STYLE REFERENCE. This is finished screen 1 of the same set. Match it EXACTLY: same background gradient and motif, same palette, same lighting and shadow, same typeface, headline size, weight and position, same device frame colour, scale and vertical position. The new image must look like it was exported from the same design file. Do NOT copy its headline words and do NOT copy the UI shown on its device — only the visual system.`,
    );
  }
  if (refs.logo) {
    refLines.push(
      `- Image ${refs.logo} = OFFICIAL APP LOGO. Use it only where the style bible allows (logo rule). Reproduce it pixel-faithfully: never redraw, recolour, stretch, outline, add effects, or place it inside the device.`,
    );
  }
  if (refs.screenshot) {
    refLines.push(
      `- Image ${refs.screenshot} = THE REAL APP SCREEN to display inside the device. Reproduce it faithfully — the same layout, colours, icons, imagery and text, scaled to fill the device display edge to edge. Do not invent, rearrange, restyle, "improve" or translate the UI. All UI text stays legible and correctly spelled. Replace only the status bar contents with 9:41 / full signal / full battery.`,
    );
  }
  if (refs.reference) {
    refLines.push(
      `- Image ${refs.reference} = STYLE INSPIRATION uploaded by the user. Borrow its mood and finish only if it agrees with the style bible; never copy its content, text, logos or UI.`,
    );
  }
  const referenceBlock =
    refLines.length > 0
      ? `REFERENCE IMAGES (attached, in this order)\n${refLines.join("\n")}`
      : "REFERENCE IMAGES: none attached. Render everything from the description below.";

  // ── UI on the device when no screenshot exists ────────────────────────────
  const uiGuidance = refs.screenshot
    ? ""
    : `\nUI ON THE DEVICE (no screenshot supplied — design it): a polished, realistic ${p.short} screen of "${brief.appName}" (${brief.category}) that shows exactly what the visual brief describes. Native-feeling components, clear hierarchy, the brand accent ${guide.palette.accent} used for primary actions and highlights, believable sample content (real-looking names, numbers, dates, labels — never "lorem ipsum" or grey placeholder boxes), every word legible and correctly spelled, status bar 9:41.`;

  // ── Copy ──────────────────────────────────────────────────────────────────
  const copyBlock = `COPY FOR THIS SCREEN (render exactly, character for character)
Headline: «${screen.headline}»
${
  screen.subheadline
    ? `Subheadline: «${screen.subheadline}»`
    : "Subheadline: none — leave that space empty. Do not invent a subheadline."
}`;

  const heroNote =
    n === 1 && !refs.hero
      ? `\nTHIS IS SCREEN 1 — THE MASTER. It defines the look of the whole set: follow the style bible literally, because screens 2–${total} will be matched to this exact image. Make the background, caption block and device treatment clean and repeatable.`
      : "";

  const adjustmentBlock = adjustments?.trim()
    ? `\nADJUSTMENTS REQUESTED FOR THIS RE-RENDER (apply these, keep everything else identical to the set):\n${adjustments.trim()}\n`
    : "";

  return `Create screenshot ${n} of ${total} for the ${p.store} listing of "${brief.appName}". Output one ${size.width}×${size.height}px portrait image.
${adjustmentBlock}
${referenceBlock}

${copyBlock}

VISUAL BRIEF FOR THIS SCREEN
${screen.visualBrief}
${variantInstruction(screen.deviceVariant)}${uiGuidance}
${heroNote}

${buildStyleBible(brief, guide, platform, size)}

FINAL CHECK before you render: the headline reads «${screen.headline}» with no other words added; the palette matches the bible; the device scale, frame and caption position are identical to the rest of the set; margins are respected; nothing is cut off; the artwork looks like it belongs on a category-leading app's store page.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Misc
// ─────────────────────────────────────────────────────────────────────────────

export function buildProjectName(brief: AppStoreBrief) {
  const p = PLATFORMS[brief.platform];
  return `${brief.appName.trim()} · ${p.store} screens`;
}
