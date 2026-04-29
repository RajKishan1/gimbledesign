/**
 * Curated SVG thumbnail templates for project cards.
 *
 * Each template uses three color placeholders that the generator replaces
 * with hex values picked by a tiny LLM call (or by a deterministic
 * device-type fallback when the call fails):
 *
 *   {c1} = primary background / dominant color
 *   {c2} = secondary accent
 *   {c3} = highlight / pop
 *
 * Design constraints baked in:
 * - viewBox 400x300 with preserveAspectRatio xMidYMid slice (matches the
 *   <img object-cover> consumer in components/ui/project-thumbnail.tsx).
 * - Compositions use bold, large shapes designed to stay legible when
 *   downscaled to ~270x144 dashboard cards.
 * - Pure abstract geometry. No text, no icons, no thin strokes.
 * - Each template is a self-contained SVG document so it can be base64
 *   encoded and inlined as a data URL.
 */

export type TemplateColors = { c1: string; c2: string; c3: string };

const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">';

/** 1. Soft Blobs — gradient backdrop with two blurred organic blobs. */
const T_SOFT_BLOBS = `${SVG_OPEN}
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="{c1}"/>
    <stop offset="100%" stop-color="{c2}"/>
  </linearGradient>
  <filter id="b" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="22"/>
  </filter>
</defs>
<rect width="400" height="300" fill="url(#g)"/>
<circle cx="110" cy="90" r="90" fill="{c3}" opacity="0.55" filter="url(#b)"/>
<circle cx="320" cy="220" r="110" fill="{c3}" opacity="0.4" filter="url(#b)"/>
</svg>`;

/** 2. Bauhaus — circle + square + triangle composition on a flat field. */
const T_BAUHAUS = `${SVG_OPEN}
<rect width="400" height="300" fill="{c1}"/>
<rect x="40" y="60" width="160" height="160" fill="{c2}"/>
<circle cx="280" cy="120" r="72" fill="{c3}"/>
<polygon points="220,300 360,300 290,200" fill="{c2}" opacity="0.85"/>
</svg>`;

/** 3. Aurora Mesh — three radial gradients overlapped for a mesh feel. */
const T_AURORA = `${SVG_OPEN}
<defs>
  <radialGradient id="r1" cx="20%" cy="30%" r="60%">
    <stop offset="0%" stop-color="{c2}" stop-opacity="0.95"/>
    <stop offset="100%" stop-color="{c2}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="r2" cx="85%" cy="75%" r="60%">
    <stop offset="0%" stop-color="{c3}" stop-opacity="0.9"/>
    <stop offset="100%" stop-color="{c3}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="r3" cx="65%" cy="15%" r="55%">
    <stop offset="0%" stop-color="{c3}" stop-opacity="0.6"/>
    <stop offset="100%" stop-color="{c3}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="400" height="300" fill="{c1}"/>
<rect width="400" height="300" fill="url(#r1)"/>
<rect width="400" height="300" fill="url(#r2)"/>
<rect width="400" height="300" fill="url(#r3)"/>
</svg>`;

/** 4. Wave Forms — two flowing sine waves stacked over a flat background. */
const T_WAVES = `${SVG_OPEN}
<rect width="400" height="300" fill="{c1}"/>
<path d="M0,170 Q100,120 200,170 T400,170 L400,300 L0,300 Z" fill="{c2}" opacity="0.85"/>
<path d="M0,215 Q100,170 200,215 T400,215 L400,300 L0,300 Z" fill="{c3}"/>
</svg>`;

/** 5. Concentric Arcs — off-center stacked rings with a solid core. */
const T_CONCENTRIC = `${SVG_OPEN}
<rect width="400" height="300" fill="{c1}"/>
<circle cx="100" cy="150" r="220" fill="none" stroke="{c2}" stroke-width="22" opacity="0.45"/>
<circle cx="100" cy="150" r="160" fill="none" stroke="{c3}" stroke-width="22" opacity="0.6"/>
<circle cx="100" cy="150" r="100" fill="none" stroke="{c2}" stroke-width="22" opacity="0.8"/>
<circle cx="100" cy="150" r="48" fill="{c3}"/>
</svg>`;

/** 6. Sunburst — three diagonal bands sweeping across the canvas. */
const T_SUNBURST = `${SVG_OPEN}
<rect width="400" height="300" fill="{c1}"/>
<polygon points="0,0 400,80 400,120 0,30" fill="{c2}" opacity="0.75"/>
<polygon points="0,80 400,160 400,200 0,110" fill="{c3}" opacity="0.85"/>
<polygon points="0,170 400,250 400,290 0,210" fill="{c2}" opacity="0.65"/>
</svg>`;

/** 7. Frosted Layers — two rotated rounded rectangles over a flat field. */
const T_FROSTED = `${SVG_OPEN}
<rect width="400" height="300" fill="{c1}"/>
<rect x="50" y="60" width="220" height="180" rx="22" fill="{c2}" opacity="0.7" transform="rotate(-8 160 150)"/>
<rect x="130" y="80" width="220" height="180" rx="22" fill="{c3}" opacity="0.7" transform="rotate(6 240 170)"/>
</svg>`;

/** 8. Orb — single glowing sphere on a flat backdrop. */
const T_ORB = `${SVG_OPEN}
<defs>
  <radialGradient id="orb" cx="40%" cy="35%" r="60%">
    <stop offset="0%" stop-color="{c3}"/>
    <stop offset="55%" stop-color="{c2}"/>
    <stop offset="100%" stop-color="{c1}"/>
  </radialGradient>
</defs>
<rect width="400" height="300" fill="{c1}"/>
<circle cx="200" cy="150" r="120" fill="url(#orb)"/>
<circle cx="170" cy="120" r="36" fill="{c3}" opacity="0.45"/>
</svg>`;

/** 9. Grid Tiles — 2x2 rounded tiles with a slight offset. */
const T_GRID = `${SVG_OPEN}
<rect width="400" height="300" fill="{c1}"/>
<rect x="40" y="40" width="150" height="100" rx="14" fill="{c2}"/>
<rect x="220" y="60" width="150" height="100" rx="14" fill="{c3}"/>
<rect x="60" y="170" width="150" height="100" rx="14" fill="{c3}" opacity="0.85"/>
<rect x="240" y="190" width="150" height="100" rx="14" fill="{c2}" opacity="0.85"/>
</svg>`;

/** 10. Liquid Curves — two large curved sweeps filling the lower half. */
const T_LIQUID = `${SVG_OPEN}
<rect width="400" height="300" fill="{c1}"/>
<path d="M-20,200 C100,100 260,250 420,80 L420,300 L-20,300 Z" fill="{c2}"/>
<path d="M-20,250 C100,160 280,290 420,150 L420,300 L-20,300 Z" fill="{c3}" opacity="0.9"/>
</svg>`;

/** 11. Stacked Peaks — layered mountain silhouettes. */
const T_PEAKS = `${SVG_OPEN}
<rect width="400" height="300" fill="{c1}"/>
<polygon points="-20,300 80,160 200,260 320,140 420,260 420,300" fill="{c2}" opacity="0.7"/>
<polygon points="-20,300 60,200 160,280 280,180 360,250 420,200 420,300" fill="{c3}"/>
</svg>`;

/** 12. Confetti — gradient backdrop with scattered highlight dots. */
const T_CONFETTI = `${SVG_OPEN}
<defs>
  <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="{c1}"/>
    <stop offset="100%" stop-color="{c2}"/>
  </linearGradient>
</defs>
<rect width="400" height="300" fill="url(#cg)"/>
<circle cx="60" cy="80" r="14" fill="{c3}" opacity="0.85"/>
<circle cx="140" cy="40" r="8" fill="{c3}" opacity="0.7"/>
<circle cx="220" cy="100" r="20" fill="{c3}"/>
<circle cx="320" cy="60" r="12" fill="{c3}" opacity="0.9"/>
<circle cx="80" cy="200" r="18" fill="{c3}" opacity="0.8"/>
<circle cx="180" cy="240" r="10" fill="{c3}" opacity="0.7"/>
<circle cx="280" cy="200" r="22" fill="{c3}" opacity="0.85"/>
<circle cx="360" cy="240" r="14" fill="{c3}" opacity="0.75"/>
</svg>`;

export const TEMPLATES: ReadonlyArray<string> = Object.freeze([
  T_SOFT_BLOBS,
  T_BAUHAUS,
  T_AURORA,
  T_WAVES,
  T_CONCENTRIC,
  T_SUNBURST,
  T_FROSTED,
  T_ORB,
  T_GRID,
  T_LIQUID,
  T_PEAKS,
  T_CONFETTI,
]);

/** Stable, distribution-friendly index from a string key (e.g. project id). */
export function pickTemplateIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % TEMPLATES.length + TEMPLATES.length) % TEMPLATES.length;
}

/** Replace {c1}/{c2}/{c3} placeholders with the provided hex values. */
export function renderTemplate(
  template: string,
  colors: TemplateColors,
): string {
  return template
    .replace(/\{c1\}/g, colors.c1)
    .replace(/\{c2\}/g, colors.c2)
    .replace(/\{c3\}/g, colors.c3);
}
