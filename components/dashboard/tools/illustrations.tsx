/**
 * Illustrations for the dashboard Tools section.
 *
 * Style guide:
 *  - Each illustration is a small, self-contained component (no shared helpers).
 *  - Built with plain divs / SVG and small Lucide icons.
 *  - Each one returns ONLY the illustration — no background. The tool card
 *    draws the colored backdrop behind it.
 *  - Keep illustrations ~110px tall so they sit nicely in the card image area.
 *
 * To add a new illustration:
 *   1. Copy an existing component below.
 *   2. Give it a unique export name (PascalCase, ends with "Illustration").
 *   3. Reference it from `tools-data.ts`.
 */

import {
  Box,
  Code2,
  Image as ImageIcon,
  Layers,
  MousePointer2,
  Pencil,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
} from "lucide-react";

/* ───────────── 1. Wireframe ─────────────
 * Two overlapping browser windows with a cursor — mirrors the existing
 * WireframePreview in app/(routes)/mini-tools/page.tsx.
 */
export function WireframeIllustration() {
  return (
    <div className="relative h-24 w-32">
      {/* Back window */}
      <div className="absolute right-0 top-0 h-16 w-24 rounded-lg border border-violet-300/50 bg-white/80 shadow-sm">
        <div className="flex gap-1 border-b border-violet-200/60 px-2 py-1">
          <span className="size-1 rounded-full bg-violet-300/70" />
          <span className="size-1 rounded-full bg-violet-300/70" />
        </div>
        <div className="space-y-1 p-2">
          <div className="h-1 w-3/4 rounded bg-violet-200/60" />
          <div className="h-1 w-1/2 rounded bg-violet-200/60" />
        </div>
      </div>
      {/* Front window */}
      <div className="absolute bottom-0 left-0 h-16 w-24 rounded-lg border border-violet-300/60 bg-white shadow-md">
        <div className="flex gap-1 border-b border-violet-200/60 px-2 py-1">
          <span className="size-1 rounded-full bg-violet-300/80" />
          <span className="size-1 rounded-full bg-violet-300/80" />
        </div>
        <div className="space-y-1 p-2">
          <div className="h-1 w-3/4 rounded bg-violet-200/70" />
          <div className="h-1 w-1/2 rounded bg-violet-200/70" />
        </div>
      </div>
      {/* Cursor */}
      <MousePointer2
        className="absolute left-14 top-12 size-4 fill-violet-700 text-violet-700"
        strokeWidth={1.5}
      />
    </div>
  );
}

/* ───────────── 2. Reimagine ─────────────
 * A stylized phone with a Sparkles accent — implies AI redesign.
 */
export function ReimagineIllustration() {
  return (
    <div className="relative h-28 w-20">
      {/* Back card (faded) */}
      <div className="absolute -right-3 top-2 h-24 w-16 rounded-xl border border-pink-300/50 bg-white/60" />
      {/* Phone */}
      <div className="relative h-28 w-20 rounded-2xl border border-pink-300/60 bg-white shadow-md">
        <div className="mx-auto mt-1.5 h-1 w-8 rounded-full bg-pink-200/80" />
        <div className="space-y-1.5 p-2.5 pt-3">
          <div className="h-2 w-3/4 rounded bg-pink-200/70" />
          <div className="h-8 w-full rounded-md bg-pink-100" />
          <div className="h-1.5 w-1/2 rounded bg-pink-200/70" />
        </div>
      </div>
      <Sparkles
        className="absolute -right-2 -top-2 size-5 fill-pink-400 text-pink-500"
        strokeWidth={1.5}
      />
    </div>
  );
}

/* ───────────── 3. App Store Screens ─────────────
 * Three phones (center one taller) — like the existing AppStoreScreensPreview.
 */
export function AppStoreScreensIllustration() {
  return (
    <div className="flex items-end gap-1.5">
      <div className="h-20 w-12 -rotate-6 rounded-lg border border-amber-300/60 bg-white/90 shadow-sm">
        <div className="mx-auto mt-1 h-0.5 w-5 rounded-full bg-amber-200" />
      </div>
      <div className="z-10 h-24 w-14 rounded-xl border border-amber-300/70 bg-white shadow-md">
        <div className="mx-auto mt-1 h-0.5 w-6 rounded-full bg-amber-300" />
      </div>
      <div className="h-20 w-12 rotate-6 rounded-lg border border-amber-300/60 bg-white/90 shadow-sm">
        <div className="mx-auto mt-1 h-0.5 w-5 rounded-full bg-amber-200" />
      </div>
    </div>
  );
}

/* ───────────── 4. Magic Edit ─────────────
 * Big "Aa" text wrapped in a dashed selection box with corner handles.
 */
export function MagicEditIllustration() {
  return (
    <div className="relative">
      <div className="rounded-lg border-2 border-dashed border-emerald-500/70 px-5 py-3">
        <span className="text-3xl font-bold text-emerald-700">Aa</span>
      </div>
      {/* Corner handles */}
      <span className="absolute -left-1.5 -top-1.5 size-2.5 rounded-sm border border-emerald-600 bg-white" />
      <span className="absolute -right-1.5 -top-1.5 size-2.5 rounded-sm border border-emerald-600 bg-white" />
      <span className="absolute -bottom-1.5 -left-1.5 size-2.5 rounded-sm border border-emerald-600 bg-white" />
      <span className="absolute -bottom-1.5 -right-1.5 size-2.5 rounded-sm border border-emerald-600 bg-white" />
    </div>
  );
}

/* ───────────── 5. Design System ─────────────
 * "Aa" + a small color palette.
 */
export function DesignSystemIllustration() {
  return (
    <div className="flex items-center gap-4">
      <span className="text-4xl font-bold text-sky-700">Aa</span>
      <div className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-sky-400" />
        <span className="size-3 rounded-full bg-blue-500" />
        <span
          className="size-3 rounded-full"
          style={{
            background: "conic-gradient(#0ea5e9 0 50%, #e5e7eb 50% 100%)",
          }}
        />
      </div>
    </div>
  );
}

/* ───────────── 6. Image Generator ─────────────
 * A picture-frame icon with a soft halo.
 */
export function ImageGeneratorIllustration() {
  return (
    <div className="flex size-20 items-center justify-center rounded-2xl bg-white shadow-sm">
      <ImageIcon className="size-10 text-sky-600" strokeWidth={1.5} />
    </div>
  );
}

/* ───────────── 7. AI Mockups ─────────────
 * A simple phone outline.
 */
export function AIMockupsIllustration() {
  return (
    <div className="flex size-20 items-center justify-center rounded-2xl bg-white shadow-sm">
      <Smartphone className="size-10 text-violet-600" strokeWidth={1.5} />
    </div>
  );
}

/* ───────────── 8. Icon Generator ─────────────
 * Star outline.
 */
export function IconGeneratorIllustration() {
  return (
    <div className="flex size-20 items-center justify-center rounded-2xl bg-white shadow-sm">
      <Star className="size-10 text-orange-500" strokeWidth={1.5} />
    </div>
  );
}

/* ───────────── 9. Remove Background ─────────────
 * Classic 3x3 checkerboard pattern (transparent-background indicator).
 */
export function RemoveBackgroundIllustration() {
  // 9 cells, alternating between white and rose-200 to make a checkerboard.
  const cells = Array.from({ length: 9 }, (_, i) => {
    const row = Math.floor(i / 3);
    const isDark = (row + i) % 2 === 0;
    return isDark;
  });
  return (
    <div className="grid size-20 grid-cols-3 gap-0 overflow-hidden rounded-lg border border-rose-200 shadow-sm">
      {cells.map((isDark, i) => (
        <span
          key={i}
          className={isDark ? "bg-rose-200" : "bg-white"}
          aria-hidden
        />
      ))}
    </div>
  );
}

/* ───────────── 10. Brand Kit Extractor ─────────────
 * Shopping bag icon — like a kit you take away.
 */
export function BrandKitIllustration() {
  return (
    <div className="flex size-20 items-center justify-center rounded-2xl bg-white shadow-sm">
      <ShoppingBag className="size-10 text-emerald-600" strokeWidth={1.5} />
    </div>
  );
}

/* ───────────── 11. Illustration Generator ─────────────
 * Pencil icon.
 */
export function IllustrationGeneratorIllustration() {
  return (
    <div className="flex size-20 items-center justify-center rounded-2xl bg-white shadow-sm">
      <Pencil className="size-10 text-violet-600" strokeWidth={1.5} />
    </div>
  );
}

/* ───────────── 12. Landing Page Generator ─────────────
 * Stylized browser window with content blocks inside.
 */
export function LandingPageIllustration() {
  return (
    <div className="h-24 w-28 rounded-lg border border-purple-300/60 bg-white shadow-sm">
      <div className="flex gap-1 border-b border-purple-200/70 px-2 py-1">
        <span className="size-1.5 rounded-full bg-purple-300/80" />
        <span className="size-1.5 rounded-full bg-purple-300/80" />
        <span className="size-1.5 rounded-full bg-purple-300/80" />
      </div>
      <div className="space-y-1.5 p-2">
        <div className="h-2 w-3/4 rounded bg-purple-200/70" />
        <div className="h-1 w-full rounded bg-purple-200/50" />
        <div className="h-1 w-2/3 rounded bg-purple-200/50" />
        <div className="mt-1 flex gap-1">
          <div className="h-4 w-1/2 rounded bg-purple-300/60" />
          <div className="h-4 w-1/2 rounded bg-purple-200/60" />
        </div>
      </div>
    </div>
  );
}

/* ───────────── 13. Content Generator ─────────────
 * 3D cube — represents structured content blocks.
 */
export function ContentGeneratorIllustration() {
  return (
    <div className="flex size-20 items-center justify-center rounded-2xl bg-white shadow-sm">
      <Box className="size-10 text-amber-600" strokeWidth={1.5} />
    </div>
  );
}

/* ───────────── 14. Design to Code ─────────────
 * </> code symbol.
 */
export function DesignToCodeIllustration() {
  return (
    <div className="flex size-20 items-center justify-center rounded-2xl bg-white shadow-sm">
      <Code2 className="size-10 text-rose-600" strokeWidth={1.5} />
    </div>
  );
}

/* ───────────── 15. Export Assets ─────────────
 * Stacked layers.
 */
export function ExportAssetsIllustration() {
  return (
    <div className="flex size-20 items-center justify-center rounded-2xl bg-white shadow-sm">
      <Layers className="size-10 text-sky-600" strokeWidth={1.5} />
    </div>
  );
}
