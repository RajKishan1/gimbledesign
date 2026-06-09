/**
 * Illustrations for the dashboard Tools section.
 *
 * Style guide (every illustration must follow):
 *  - Composite of plain divs / SVG and tiny Lucide accents — never just
 *    a single icon centered in a box.
 *  - Returns ONLY the illustration. The tool card draws the colored
 *    backdrop behind it.
 *  - Sized to fit comfortably inside a card's `aspect-[4/3]` image area,
 *    typically ~100×80px. The card scales it (75–100%) by tier.
 *
 * Tone (color) per illustration must match the `tone` set in `tools-data.ts`
 * so the gradient backdrop + accents read as one piece.
 */

import {
  ArrowRight,
  Heart,
  MousePointer2,
  Pencil,
  Smile,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";

/* ───────────── 1. Wireframe (lavender) ─────────────
 * Two overlapping browser windows + cursor.
 */
export function WireframeIllustration() {
  return (
    <div className="relative h-24 w-32">
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
      <MousePointer2
        className="absolute left-14 top-12 size-4 fill-violet-700 text-violet-700"
        strokeWidth={1.5}
      />
    </div>
  );
}

/* ───────────── 2. Reimagine (pink) ─────────────
 * Stylized phone with sparkle accent.
 */
export function ReimagineIllustration() {
  return (
    <div className="relative h-28 w-20">
      <div className="absolute -right-3 top-2 h-24 w-16 rounded-xl border border-pink-300/50 bg-white/60" />
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

/* ───────────── 3. App Store Screens (amber) ─────────────
 * Three phones — centre one taller.
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

/* ───────────── 4. Magic Edit (mint) ─────────────
 * "Aa" text in a dashed selection box with corner handles.
 */
export function MagicEditIllustration() {
  return (
    <div className="relative">
      <div className="rounded-lg border-2 border-dashed border-emerald-500/70 px-5 py-3">
        <span className="text-3xl font-bold text-emerald-700">Aa</span>
      </div>
      <span className="absolute -left-1.5 -top-1.5 size-2.5 rounded-sm border border-emerald-600 bg-white" />
      <span className="absolute -right-1.5 -top-1.5 size-2.5 rounded-sm border border-emerald-600 bg-white" />
      <span className="absolute -bottom-1.5 -left-1.5 size-2.5 rounded-sm border border-emerald-600 bg-white" />
      <span className="absolute -bottom-1.5 -right-1.5 size-2.5 rounded-sm border border-emerald-600 bg-white" />
    </div>
  );
}

/* ───────────── 5. Design System (sky) ─────────────
 * "Aa" + color palette circles.
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

/* ───────────── 6. Image Generator (sky) ─────────────
 * Mini landscape — sky with sun, double-layer mountains.
 */
export function ImageGeneratorIllustration() {
  return (
    <div className="relative h-24 w-28 overflow-hidden rounded-xl border border-sky-300/60 bg-white shadow-sm">
      {/* Sky */}
      <div className="absolute inset-x-0 top-0 h-3/5 bg-gradient-to-b from-sky-200 to-sky-50">
        {/* Sun */}
        <div className="absolute right-3 top-2 size-3 rounded-full bg-yellow-300 shadow-sm" />
      </div>
      {/* Mountains */}
      <svg
        viewBox="0 0 100 50"
        className="absolute inset-x-0 bottom-0 h-2/5 w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 50 L22 18 L42 36 L60 8 L82 28 L100 16 L100 50 Z"
          fill="rgb(125 211 252 / 0.7)"
        />
        <path
          d="M0 50 L18 32 L38 42 L62 26 L86 40 L100 34 L100 50 Z"
          fill="rgb(56 189 248 / 0.5)"
        />
      </svg>
    </div>
  );
}

/* ───────────── 7. AI Mockups (lavender) ─────────────
 * Phone with content + small back card + sparkle.
 */
export function AIMockupsIllustration() {
  return (
    <div className="relative">
      {/* Faded back card */}
      <div className="absolute -right-3 top-2 h-20 w-12 rounded-xl border border-violet-300/40 bg-white/50" />
      {/* Main phone */}
      <div className="relative h-24 w-16 rounded-2xl border border-violet-300/60 bg-white shadow-md">
        <div className="mx-auto mt-1.5 h-1 w-6 rounded-full bg-violet-200" />
        <div className="space-y-1 p-2 pt-2">
          <div className="h-1.5 w-3/4 rounded bg-violet-200/70" />
          <div className="h-6 w-full rounded-md bg-violet-100" />
          <div className="h-1 w-1/2 rounded bg-violet-200/70" />
          <div className="h-1 w-2/3 rounded bg-violet-200/70" />
        </div>
      </div>
      <Sparkles
        className="absolute -right-1 -top-2 size-4 fill-violet-500 text-violet-600"
        strokeWidth={1.5}
      />
    </div>
  );
}

/* ───────────── 8. Icon Generator (peach) ─────────────
 * 2×2 grid of icon tiles — like a real icon palette.
 */
export function IconGeneratorIllustration() {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <div className="flex size-10 items-center justify-center rounded-lg border border-orange-300/50 bg-white shadow-sm">
        <Star
          className="size-5 fill-orange-200 text-orange-500"
          strokeWidth={1.75}
        />
      </div>
      <div className="flex size-10 items-center justify-center rounded-lg border border-orange-300/50 bg-orange-50">
        <Heart
          className="size-5 fill-orange-200 text-orange-500"
          strokeWidth={1.75}
        />
      </div>
      <div className="flex size-10 items-center justify-center rounded-lg border border-orange-300/50 bg-orange-50">
        <Sparkles className="size-5 text-orange-500" strokeWidth={1.75} />
      </div>
      <div className="flex size-10 items-center justify-center rounded-lg border border-orange-300/50 bg-white shadow-sm">
        <Smile className="size-5 text-orange-500" strokeWidth={1.75} />
      </div>
    </div>
  );
}

/* ───────────── 9. Remove Background (rose) ─────────────
 * 4×4 transparency checker with a magic-wand "subject" on top.
 */
export function RemoveBackgroundIllustration() {
  // 4×4 checkerboard for tighter pattern detail.
  const cells = Array.from({ length: 16 }, (_, i) => {
    const row = Math.floor(i / 4);
    return (row + i) % 2 === 0;
  });
  return (
    <div className="relative">
      <div className="grid size-24 grid-cols-4 gap-0 overflow-hidden rounded-xl border border-rose-200 shadow-sm">
        {cells.map((isDark, i) => (
          <span
            key={i}
            className={isDark ? "bg-rose-200" : "bg-white"}
            aria-hidden
          />
        ))}
      </div>
      {/* Subject pill — implies "background removed, subject remains" */}
      <div
        className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg ring-2 ring-white"
      >
        <Wand2 className="size-5 text-white" strokeWidth={2} />
      </div>
    </div>
  );
}

/* ───────────── 10. Brand Kit Extractor (mint) ─────────────
 * "Aa" + a real swatch row inside a card.
 */
export function BrandKitIllustration() {
  return (
    <div className="flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-xl border border-emerald-300/60 bg-white shadow-sm">
      <span className="text-3xl font-bold leading-none text-emerald-700">
        Aa
      </span>
      <div className="flex gap-1.5">
        <span className="size-3 rounded-full bg-emerald-500 ring-1 ring-emerald-600/20" />
        <span className="size-3 rounded-full bg-emerald-400 ring-1 ring-emerald-600/20" />
        <span className="size-3 rounded-full bg-teal-300 ring-1 ring-emerald-600/20" />
        <span className="size-3 rounded-full bg-yellow-400 ring-1 ring-amber-500/20" />
      </div>
    </div>
  );
}

/* ───────────── 11. Illustration Generator (lavender) ─────────────
 * Scribble path + accent shapes + tiny pencil.
 */
export function IllustrationGeneratorIllustration() {
  return (
    <div className="relative h-24 w-28 overflow-hidden rounded-xl border border-violet-300/60 bg-white p-2 shadow-sm">
      <svg
        viewBox="0 0 80 50"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {/* Scribble */}
        <path
          d="M5 38 Q18 8 32 28 T58 22"
          stroke="#a78bfa"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Accent dots / shapes */}
        <circle cx="14" cy="18" r="3" fill="#fb923c" />
        <rect x="44" y="10" width="6" height="6" rx="1" fill="#fbbf24" />
        <path d="M62 32 L68 26 L74 32 L68 38 Z" fill="#ec4899" />
      </svg>
      <Pencil
        className="absolute bottom-1.5 right-1.5 size-4 rotate-12 text-violet-600"
        strokeWidth={1.75}
      />
    </div>
  );
}

/* ───────────── 12. Landing Page Generator (violet) ─────────────
 * Browser window with hero blocks.
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

/* ───────────── 13. Content Generator (cream) ─────────────
 * Document card with text lines + accent block.
 */
export function ContentGeneratorIllustration() {
  return (
    <div className="h-24 w-24 rounded-xl border border-amber-300/60 bg-white p-2.5 shadow-sm">
      <div className="space-y-1.5">
        <div className="h-2 w-3/4 rounded bg-amber-300" />
        <div className="h-1 w-full rounded bg-amber-100" />
        <div className="h-1 w-5/6 rounded bg-amber-100" />
        <div className="h-1 w-4/5 rounded bg-amber-100" />
        <div className="mt-2 h-3 w-2/3 rounded bg-amber-200" />
        <div className="h-1 w-3/5 rounded bg-amber-100" />
      </div>
    </div>
  );
}

/* ───────────── 14. Design to Code (rose) ─────────────
 * Two cards side-by-side: design preview → code editor with an arrow between.
 */
export function DesignToCodeIllustration() {
  return (
    <div className="flex items-center gap-1.5">
      {/* Design preview */}
      <div className="flex h-20 w-14 flex-col gap-1 rounded-lg border border-rose-300/60 bg-white p-1.5 shadow-sm">
        <div className="h-1.5 w-full rounded bg-rose-200" />
        <div className="h-6 w-full rounded bg-rose-100" />
        <div className="h-1 w-3/4 rounded bg-rose-200" />
        <div className="h-1 w-1/2 rounded bg-rose-200/70" />
      </div>
      <ArrowRight className="size-3 text-rose-500" strokeWidth={2.5} />
      {/* Code editor */}
      <div className="flex h-20 w-14 flex-col gap-1 rounded-lg border border-rose-300/60 bg-neutral-900 p-1.5 shadow-sm">
        <div className="h-1 w-3/4 rounded bg-emerald-400" />
        <div className="h-1 w-1/2 rounded bg-pink-400" />
        <div className="h-1 w-2/3 rounded bg-sky-400" />
        <div className="h-1 w-3/4 rounded bg-amber-400" />
        <div className="h-1 w-1/2 rounded bg-emerald-400" />
      </div>
    </div>
  );
}

/* ───────────── 15. Export Assets (sky) ─────────────
 * Kept around in case the tool is restored in tools-data.ts.
 * (Currently unused.)
 */
export function ExportAssetsIllustration() {
  return (
    <div className="relative">
      <div className="h-16 w-20 rounded-xl border border-sky-300/60 bg-white shadow-sm p-2 space-y-1">
        <div className="h-1.5 w-1/2 rounded bg-sky-200" />
        <div className="h-3 w-full rounded bg-sky-100" />
        <div className="h-1.5 w-3/4 rounded bg-sky-200" />
      </div>
      <div className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-full bg-sky-500 text-white shadow-md ring-2 ring-white">
        <ArrowRight
          className="size-3.5 rotate-90"
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}
