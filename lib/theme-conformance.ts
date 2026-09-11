import "server-only";
import { generateText } from "ai";
import { llm } from "@/lib/llm";
import { FAST_MODEL } from "@/constant/models";
import { analyzePalette, violatesThemeVariables } from "@/lib/palette-lock";

const REPAIR_SYSTEM_PROMPT = `You are a meticulous front-end engineer. You receive one HTML fragment for an app screen that HARDCODED its colours (hex codes and Tailwind palette classes such as bg-slate-900, text-gray-400) and possibly a font class. The product uses a theme system driven by CSS variables, so every colour must come from a variable. Rewrite the fragment so that it is visually the same design but 100% theme-variable driven.

MAPPING RULES
- Page/root background → bg-[var(--background)]; primary text → text-[var(--foreground)]
- Cards, sheets, elevated surfaces → bg-[var(--card)]; text on them → text-[var(--card-foreground)] or text-[var(--foreground)]
- Subtle fills, chips, inactive segments, dividers' fills → bg-[var(--muted)]; secondary text → text-[var(--muted-foreground)]
- The accent colour (buttons, active tab, highlights, selected states, glow) → bg-[var(--primary)] / text-[var(--primary)] / border-[var(--primary)]; text on accent fills → text-[var(--primary-foreground)]
- Borders and hairlines → border-[var(--border)] (keep opacity modifiers, e.g. border-[var(--border)]/50)
- Inputs → bg-[var(--input)] or bg-[var(--muted)] with border-[var(--border)]; focus rings → ring-[var(--ring)]
- Charts → var(--chart-1) … var(--chart-5)
- Keep ONLY semantic status colours hardcoded (text-green-500/bg-green-500/10, text-red-500/bg-red-500/10, text-yellow-500/bg-yellow-500/10, text-blue-500/bg-blue-500/10). Everything else becomes a variable.
- Opacity modifiers are fine on variables (bg-[var(--primary)]/10, bg-[var(--card)]/80).
- Remove hardcoded font classes like font-['Plus_Jakarta_Sans',sans-serif]; the theme provides the font.
- Gradients: from-[var(--background)] / to-transparent, or from-[var(--primary)]/20.
- Text sitting on top of photos may stay text-white / bg-black/40 scrims.

OUTPUT RULES
- Output ONLY the rewritten HTML fragment, starting with <div and ending with </div>. No markdown, no comments, no explanation.
- Change nothing else: same structure, same classes for layout/spacing/typography, same copy, same icons, same images.`;

/**
 * If a generated screen ignored the theme variables, ask the fast model to
 * rewrite its colours onto the variable system. Returns the original HTML when
 * no repair is needed or the repair looks worse than the input.
 */
export async function conformToThemeVariables(
  html: string,
  opts: { themeCSS: string; label?: string },
): Promise<{ html: string; repaired: boolean }> {
  if (!violatesThemeVariables(html)) return { html, repaired: false };

  const before = analyzePalette([html]);
  console.warn(
    `[theme] ${opts.label ?? "screen"} hardcoded its palette (var()=${before.varCount}, hex=${before.hexes.length} kinds, classes=${before.classes.length} kinds) — repairing`,
  );

  try {
    const { text } = await generateText({
      model: llm.chat(FAST_MODEL),
      system: REPAIR_SYSTEM_PROMPT,
      prompt: `THEME VARIABLES AVAILABLE (already defined by the parent; reference them, never redeclare):\n${opts.themeCSS}\n\nHTML TO REWRITE:\n${html}`,
      maxOutputTokens: 14_000,
      temperature: 0,
    });
    const match = text.match(/<div[\s\S]*<\/div>/);
    if (!match) return { html, repaired: false };
    const repaired = match[0].replace(/```/g, "");

    const after = analyzePalette([repaired]);
    const improved =
      after.varCount > before.varCount &&
      after.hexes.length <= Math.max(2, Math.floor(before.hexes.length / 3)) &&
      repaired.length > html.length * 0.6;
    if (!improved) {
      console.warn(`[theme] repair rejected for ${opts.label ?? "screen"} (var()=${after.varCount}, hex kinds=${after.hexes.length})`);
      return { html, repaired: false };
    }
    return { html: repaired, repaired: true };
  } catch (e) {
    console.warn("[theme] repair failed:", e);
    return { html, repaired: false };
  }
}

/** Strip concrete colour specs from planner / enhancer text so they cannot leak into screens. */
export function scrubColorSpecs(text: string): string {
  return text
    .replace(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, "the theme colour")
    .replace(/\brgba?\([^)]*\)/g, "the theme colour");
}
