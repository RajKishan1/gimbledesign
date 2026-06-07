/**
 * Single source of truth for the dashboard Tools section.
 *
 * To add a new tool:
 *   1. Build an illustration in `illustrations.tsx`.
 *   2. Append a new entry to the `TOOLS` array below.
 *   3. Pick a `tone` value to set the card's color theme.
 *      (See TONE_STYLES at the bottom of this file for the available tones.)
 */

import type { ComponentType } from "react";
import {
  AIMockupsIllustration,
  AppStoreScreensIllustration,
  BrandKitIllustration,
  ContentGeneratorIllustration,
  DesignSystemIllustration,
  DesignToCodeIllustration,
  ExportAssetsIllustration,
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

export type Tool = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: ToolTone;
  badge?: string;
  Illustration: ComponentType;
};

export const TOOLS: Tool[] = [
  {
    id: "wireframe",
    title: "Wireframe",
    description: "Sketch low-fidelity layouts in seconds",
    href: "/dashboard?mini=wireframe",
    tone: "lavender",
    Illustration: WireframeIllustration,
  },
  {
    id: "reimagine",
    title: "Reimagine",
    description: "Turn any screenshot into a better design",
    href: "/dashboard?mini=inspirations",
    tone: "pink",
    Illustration: ReimagineIllustration,
  },
  {
    id: "app-store-screens",
    title: "App Store Screens",
    description: "Generate marketing-ready store screenshots",
    href: "/mini-tools/app-store-screens",
    tone: "amber",
    Illustration: AppStoreScreensIllustration,
  },
  {
    id: "magic-edit",
    title: "Magic Edit",
    description: "Edit any part of your design with simple prompts",
    href: "#",
    tone: "mint",
    badge: "Beta",
    Illustration: MagicEditIllustration,
  },
  {
    id: "design-system",
    title: "Design System",
    description: "Create consistent styles and components",
    href: "#",
    tone: "sky",
    Illustration: DesignSystemIllustration,
  },
  {
    id: "image-generator",
    title: "Image Generator",
    description: "Generate original images for your projects",
    href: "#",
    tone: "sky",
    Illustration: ImageGeneratorIllustration,
  },
  {
    id: "ai-mockups",
    title: "AI Mockups",
    description: "Create realistic device mockups instantly",
    href: "#",
    tone: "lavender",
    Illustration: AIMockupsIllustration,
  },
  {
    id: "icon-generator",
    title: "Icon Generator",
    description: "Generate beautiful icons in any style",
    href: "#",
    tone: "peach",
    Illustration: IconGeneratorIllustration,
  },
  {
    id: "remove-background",
    title: "Remove Background",
    description: "Remove image backgrounds in one click",
    href: "#",
    tone: "rose",
    Illustration: RemoveBackgroundIllustration,
  },
  {
    id: "brand-kit",
    title: "Brand Kit Extractor",
    description: "Extract colors, fonts and assets from any brand",
    href: "#",
    tone: "mint",
    Illustration: BrandKitIllustration,
  },
  {
    id: "illustration-generator",
    title: "Illustration Generator",
    description: "Create stunning illustrations in seconds",
    href: "#",
    tone: "lavender",
    Illustration: IllustrationGeneratorIllustration,
  },
  {
    id: "landing-page",
    title: "Landing Page Generator",
    description: "Generate high-converting landing pages",
    href: "#",
    tone: "violet",
    Illustration: LandingPageIllustration,
  },
  {
    id: "content-generator",
    title: "Content Generator",
    description: "Generate content blocks for your designs",
    href: "#",
    tone: "cream",
    Illustration: ContentGeneratorIllustration,
  },
  {
    id: "design-to-code",
    title: "Design to Code",
    description: "Convert designs into clean frontend code",
    href: "#",
    tone: "rose",
    Illustration: DesignToCodeIllustration,
  },
  {
    id: "export-assets",
    title: "Export Assets",
    description: "Export assets in all formats and sizes",
    href: "#",
    tone: "sky",
    Illustration: ExportAssetsIllustration,
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
    background: "bg-gradient-to-br from-violet-100 via-fuchsia-50/70 to-white",
    glow: "bg-violet-300/50",
  },
  pink: {
    background: "bg-gradient-to-br from-pink-100 via-rose-50/60 to-white",
    glow: "bg-pink-300/50",
  },
  amber: {
    background: "bg-gradient-to-br from-amber-100 via-orange-50/60 to-white",
    glow: "bg-amber-300/50",
  },
  mint: {
    background:
      "bg-gradient-to-br from-emerald-100 via-emerald-50/60 to-white",
    glow: "bg-emerald-300/50",
  },
  sky: {
    background: "bg-gradient-to-br from-sky-100 via-blue-50/60 to-white",
    glow: "bg-sky-300/50",
  },
  peach: {
    background: "bg-gradient-to-br from-orange-100 via-amber-50/60 to-white",
    glow: "bg-orange-300/50",
  },
  rose: {
    background: "bg-gradient-to-br from-rose-100 via-pink-50/60 to-white",
    glow: "bg-rose-300/50",
  },
  cream: {
    background: "bg-gradient-to-br from-yellow-50 via-amber-50/40 to-white",
    glow: "bg-amber-200/50",
  },
  violet: {
    background: "bg-gradient-to-br from-purple-100 via-violet-50/60 to-white",
    glow: "bg-purple-300/50",
  },
};
