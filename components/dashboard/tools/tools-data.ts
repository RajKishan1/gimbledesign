/**
 * Single source of truth for the dashboard Tools section.
 *
 * Tools are arranged in two tiers, both rendered as horizontal rows:
 *  - `tier: "featured"` — top row, fewer-per-row (so each card is larger),
 *    slightly heavier typography. The six tools users hit most often.
 *  - `tier: "standard"` — bottom row, more-per-row (smaller cards),
 *    lighter typography. Supporting utilities.
 *
 * To add a new tool:
 *   1. Build an illustration in `illustrations.tsx`.
 *   2. Append a new entry to the `TOOLS` array below.
 *   3. Pick a `tier` ("featured" or "standard") and a `tone` color.
 */

import type { ComponentType } from "react";
import {
  AIMockupsIllustration,
  AppStoreScreensIllustration,
  BrandKitIllustration,
  ContentGeneratorIllustration,
  DesignSystemIllustration,
  DesignToCodeIllustration,
  IconGeneratorIllustration,
  IllustrationGeneratorIllustration,
  ImageGeneratorIllustration,
  LandingPageIllustration,
  MagicEditIllustration,
  ReimagineIllustration,
  RemoveBackgroundIllustration,
  WireframeIllustration,
} from "./illustrations";

export type ToolTone =
  | "lavender"
  | "pink"
  | "amber"
  | "mint"
  | "sky"
  | "peach"
  | "rose"
  | "cream"
  | "violet";

export type ToolTier = "featured" | "standard";

export type Tool = {
  id: string;
  title: string;
  href: string;
  tone: ToolTone;
  tier: ToolTier;
  /** Optional inline tag — rendered as "(Beta)" next to the title. */
  badge?: string;
  Illustration: ComponentType;
};

export const TOOLS: Tool[] = [
  // ────────────────── Featured row (top, 6 tools) ──────────────────
  {
    id: "wireframe",
    title: "Wireframe",
    href: "/dashboard?mini=wireframe",
    tone: "lavender",
    tier: "featured",
    Illustration: WireframeIllustration,
  },
  {
    id: "reimagine",
    title: "Reimagine",
    href: "/dashboard?mini=inspirations",
    tone: "pink",
    tier: "featured",
    Illustration: ReimagineIllustration,
  },
  {
    id: "app-store-screens",
    title: "App Store Screens",
    href: "/mini-tools/app-store-screens",
    tone: "amber",
    tier: "featured",
    Illustration: AppStoreScreensIllustration,
  },
  {
    id: "magic-edit",
    title: "Magic Edit",
    href: "#",
    tone: "mint",
    tier: "featured",
    badge: "Beta",
    Illustration: MagicEditIllustration,
  },
  {
    id: "design-system",
    title: "Design System",
    href: "#",
    tone: "sky",
    tier: "featured",
    Illustration: DesignSystemIllustration,
  },
  {
    id: "design-to-code",
    title: "Design to Code",
    href: "#",
    tone: "rose",
    tier: "featured",
    Illustration: DesignToCodeIllustration,
  },

  // ────────────────── Standard row (bottom, 8 tools) ──────────────────
  {
    id: "ai-mockups",
    title: "AI Mockups",
    href: "#",
    tone: "lavender",
    tier: "standard",
    Illustration: AIMockupsIllustration,
  },
  {
    id: "icon-generator",
    title: "Icon Generator",
    href: "#",
    tone: "peach",
    tier: "standard",
    Illustration: IconGeneratorIllustration,
  },
  {
    id: "image-generator",
    title: "Image Generator",
    href: "#",
    tone: "sky",
    tier: "standard",
    Illustration: ImageGeneratorIllustration,
  },
  {
    id: "brand-kit",
    title: "Brand Kit Extractor",
    href: "#",
    tone: "mint",
    tier: "standard",
    Illustration: BrandKitIllustration,
  },
  {
    id: "remove-background",
    title: "Remove Background",
    href: "#",
    tone: "rose",
    tier: "standard",
    Illustration: RemoveBackgroundIllustration,
  },
  {
    id: "illustration-generator",
    title: "Illustration Generator",
    href: "#",
    tone: "lavender",
    tier: "standard",
    Illustration: IllustrationGeneratorIllustration,
  },
  {
    id: "landing-page",
    title: "Landing Page Generator",
    href: "#",
    tone: "violet",
    tier: "standard",
    Illustration: LandingPageIllustration,
  },
  {
    id: "content-generator",
    title: "Content Generator",
    href: "#",
    tone: "cream",
    tier: "standard",
    Illustration: ContentGeneratorIllustration,
  },
];

/**
 * Color theme for the card's image area (top section of each card).
 *
 * Each tone has:
 *  - `background`: the soft pastel gradient behind the illustration.
 *  - `glow`: the colored halo blurred behind the illustration.
 *
 * Full class strings are written out so Tailwind's compiler picks them up.
 * (Don't build class names dynamically — Tailwind v4 won't see them.)
 */
export const TONE_STYLES: Record<
  ToolTone,
  { background: string; glow: string }
> = {
  lavender: {
    background:
      "bg-linear-to-br from-violet-100 via-fuchsia-50/70 to-white dark:from-violet-500/20 dark:via-violet-500/8 dark:to-zinc-900",
    glow: "bg-violet-300/50 dark:bg-violet-500/25",
  },
  pink: {
    background:
      "bg-linear-to-br from-pink-100 via-rose-50/60 to-white dark:from-pink-500/20 dark:via-pink-500/8 dark:to-zinc-900",
    glow: "bg-pink-300/50 dark:bg-pink-500/25",
  },
  amber: {
    background:
      "bg-linear-to-br from-amber-100 via-orange-50/60 to-white dark:from-amber-500/20 dark:via-amber-500/8 dark:to-zinc-900",
    glow: "bg-amber-300/50 dark:bg-amber-500/25",
  },
  mint: {
    background:
      "bg-linear-to-br from-emerald-100 via-emerald-50/60 to-white dark:from-emerald-500/20 dark:via-emerald-500/8 dark:to-zinc-900",
    glow: "bg-emerald-300/50 dark:bg-emerald-500/25",
  },
  sky: {
    background:
      "bg-linear-to-br from-sky-100 via-blue-50/60 to-white dark:from-sky-500/20 dark:via-sky-500/8 dark:to-zinc-900",
    glow: "bg-sky-300/50 dark:bg-sky-500/25",
  },
  peach: {
    background:
      "bg-linear-to-br from-orange-100 via-amber-50/60 to-white dark:from-orange-500/20 dark:via-orange-500/8 dark:to-zinc-900",
    glow: "bg-orange-300/50 dark:bg-orange-500/25",
  },
  rose: {
    background:
      "bg-linear-to-br from-rose-100 via-pink-50/60 to-white dark:from-rose-500/20 dark:via-rose-500/8 dark:to-zinc-900",
    glow: "bg-rose-300/50 dark:bg-rose-500/25",
  },
  cream: {
    background:
      "bg-linear-to-br from-yellow-50 via-amber-50/40 to-white dark:from-yellow-500/15 dark:via-yellow-500/8 dark:to-zinc-900",
    glow: "bg-amber-200/50 dark:bg-amber-500/20",
  },
  violet: {
    background:
      "bg-linear-to-br from-purple-100 via-violet-50/60 to-white dark:from-purple-500/20 dark:via-purple-500/8 dark:to-zinc-900",
    glow: "bg-purple-300/50 dark:bg-purple-500/25",
  },
};
