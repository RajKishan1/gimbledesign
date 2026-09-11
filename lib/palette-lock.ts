/**
 * Palette lock — makes follow-up generations match what is ALREADY on the
 * canvas, whatever it is.
 *
 * Root cause this addresses: a first generation may hardcode a palette
 * (hex codes, Tailwind colour classes, a font) instead of using the theme's
 * CSS variables. A later "add a screen" request that only sees the theme
 * variables then renders in the theme's real colours and looks like a
 * different app. The lock inspects the existing HTML and tells the model,
 * literally, which colours and font the app uses.
 *
 * Pure functions, safe to import anywhere.
 */

export type PaletteMode = "theme" | "hardcoded" | "mixed" | "unknown";

export type PaletteAnalysis = {
  mode: PaletteMode;
  varCount: number;
  /** hex → uses, most used first */
  hexes: Array<[string, number]>;
  /** Tailwind palette classes (bg-slate-900, text-gray-400 …) → uses */
  classes: Array<[string, number]>;
  fonts: string[];
  /** Best guesses for roles, derived from usage patterns */
  roles: { background?: string; surface?: string; accent?: string; text?: string };
};

const TAILWIND_COLOR_CLASS =
  /\b(?:bg|text|border|from|to|via|ring|stroke|fill|divide|outline|shadow)-(?:red|amber|yellow|orange|slate|zinc|neutral|gray|stone|blue|indigo|violet|purple|fuchsia|emerald|green|teal|cyan|sky|rose|pink|lime)-\d{2,3}(?:\/\d{1,3})?\b/g;
const BLACK_WHITE_CLASS = /\b(?:bg|text|border|from|to|via|ring)-(?:white|black)(?:\/\d{1,3})?\b/g;
const HEX = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
const CSS_VAR = /var\(--[a-z0-9-]+\)/g;
const FONT_CLASS = /font-\['([^']+)'[^\]]*\]/g;

function tally(matches: string[]): Array<[string, number]> {
  const m = new Map<string, number>();
  for (const x of matches) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function normalizeHex(hex: string): string {
  const h = hex.toUpperCase();
  if (h.length === 4) return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  return h;
}

function hsl(hex: string): { h: number; s: number; l: number } {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s, l };
}

export function analyzePalette(htmls: string[]): PaletteAnalysis {
  const all = htmls.join("\n");
  const varCount = (all.match(CSS_VAR) ?? []).length;
  const hexes = tally((all.match(HEX) ?? []).map(normalizeHex));
  const classes = tally([
    ...(all.match(TAILWIND_COLOR_CLASS) ?? []),
    ...(all.match(BLACK_WHITE_CLASS) ?? []),
  ]);
  const fonts = [...new Set([...all.matchAll(FONT_CLASS)].map((m) => m[0]))];

  const hardcodedWeight = hexes.reduce((s, [, n]) => s + n, 0) + classes.reduce((s, [, n]) => s + n, 0);
  let mode: PaletteMode = "unknown";
  if (varCount === 0 && hardcodedWeight === 0) mode = "unknown";
  else if (varCount >= 8 && hardcodedWeight <= Math.max(6, varCount * 0.25)) mode = "theme";
  else if (varCount <= 2 && hardcodedWeight >= 6) mode = "hardcoded";
  else mode = "mixed";

  // Role inference from hex usage.
  const roles: PaletteAnalysis["roles"] = {};
  const rootMatch = htmls[0]?.match(/^\s*<div[^>]*class="([^"]*)"/);
  const rootBg = rootMatch?.[1].match(/bg-\[(#[0-9a-fA-F]{3,6})\]/)?.[1];
  if (rootBg) roles.background = normalizeHex(rootBg);
  const colored = hexes
    .map(([hex, n]) => ({ hex, n, ...hsl(hex) }))
    .filter((c) => c.n >= 2);
  const accent = colored
    .filter((c) => c.s > 0.45 && c.l > 0.25 && c.l < 0.8)
    .sort((a, b) => b.n - a.n)[0];
  if (accent) roles.accent = accent.hex;
  const surface = colored
    .filter((c) => c.hex !== roles.background && c.hex !== roles.accent && c.s < 0.45)
    .sort((a, b) => b.n - a.n)[0];
  if (surface) roles.surface = surface.hex;
  const textClass = classes.find(([c]) => c.startsWith("text-white") || c.startsWith("text-black") || /^text-(?:gray|slate|zinc|neutral)-(?:50|100|900|950)$/.test(c));
  if (textClass) roles.text = textClass[0];

  return { mode, varCount, hexes, classes, fonts, roles };
}

/**
 * Prompt block telling the model exactly what palette to use for a follow-up
 * screen. Returns "" when there is nothing to lock (no existing screens).
 */
export function buildPaletteLockString(analysis: PaletteAnalysis, themeName: string): string {
  if (analysis.mode === "unknown") return "";

  if (analysis.mode === "theme") {
    return `PALETTE LOCK (from the existing screens): they use the "${themeName}" theme CSS variables exclusively — var(--background), var(--card), var(--primary), var(--muted-foreground) and friends. Do exactly the same. No hex codes, no Tailwind palette classes (bg-slate-900, text-gray-400…), no custom font classes.`;
  }

  const hexLines = analysis.hexes
    .slice(0, 10)
    .map(([hex, n]) => {
      const role =
        hex === analysis.roles.background
          ? " — page background"
          : hex === analysis.roles.accent
            ? " — ACCENT (primary actions, active states, highlights)"
            : hex === analysis.roles.surface
              ? " — cards / surfaces"
              : "";
      return `  ${hex} (${n}×)${role}`;
    })
    .join("\n");
  const classLines = analysis.classes
    .slice(0, 14)
    .map(([c, n]) => `${c} (${n}×)`)
    .join(", ");
  const fontLine = analysis.fonts.length ? `\n- Font class used on the root: ${analysis.fonts.join(", ")}` : "";
  const mixedNote =
    analysis.mode === "mixed"
      ? `\n- Where the existing screens use theme variables, keep using the same variables; where they use the literal values below, use the same literal values.`
      : "";

  return `PALETTE LOCK (extracted from the existing screens — this IS the app's palette; match it EXACTLY):
- Literal colours in use:
${hexLines}
- Colour utility classes in use: ${classLines}${fontLine}${mixedNote}
- Reuse these exact values for the same roles (background, surfaces, text, accent). Do NOT switch to the "${themeName}" theme's default colours, do NOT introduce any new hue, and do NOT restyle the accent. A screen whose background or accent differs from the existing screens is a broken app.`;
}

/**
 * True when a freshly generated screen ignored the theme system (a brand-new
 * project should be 100% CSS-variable driven so theme switching works and
 * every later screen inherits the palette).
 */
export function violatesThemeVariables(html: string): boolean {
  const a = analyzePalette([html]);
  const hardcoded = a.hexes.reduce((s, [, n]) => s + n, 0) + a.classes.filter(([c]) => !/^(?:bg|text|border)-(?:white|black)\/\d+$/.test(c)).reduce((s, [, n]) => s + n, 0);
  // Allow a handful of status colours / white-on-image text; reject palettes.
  return a.varCount < 6 && hardcoded >= 6;
}
