/**
 * App Store Screens — shared, client-safe constants and types.
 * No server imports here: this file is used by the brief form, the sidebar,
 * the API routes and the Inngest job.
 */

export const PLATFORM_IDS = ["iphone", "android", "ipad"] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];

export const QUALITY_IDS = ["standard", "premium"] as const;
export type QualityId = (typeof QUALITY_IDS)[number];

export type GenSize = { width: number; height: number };

/**
 * Generation sizes are chosen so that:
 *  - both edges are multiples of 16 (gpt-image-2 requirement),
 *  - aspect matches the store's required screenshot aspect (≤ 3:1),
 *  - total pixels stay in the 0.65–8.3 MP window,
 *  - "standard" keeps token cost down, "premium" renders close to native size.
 */
export const PLATFORMS: Record<
  PlatformId,
  {
    id: PlatformId;
    label: string;
    short: string;
    store: "App Store" | "Play Store";
    /** width / height */
    aspect: number;
    generate: Record<QualityId, GenSize>;
    exportTargets: ExportTargetId[];
    deviceNoun: string;
  }
> = {
  iphone: {
    id: "iphone",
    label: "iPhone · App Store",
    short: "iPhone",
    store: "App Store",
    aspect: 1290 / 2796,
    generate: {
      standard: { width: 1040, height: 2256 },
      premium: { width: 1296, height: 2800 },
    },
    exportTargets: ["iphone-6.9", "iphone-6.5"],
    deviceNoun: "modern edge-to-edge smartphone with a dynamic-island style camera cutout",
  },
  android: {
    id: "android",
    label: "Android phone · Play Store",
    short: "Android",
    store: "Play Store",
    aspect: 9 / 16,
    generate: {
      standard: { width: 1088, height: 1920 },
      premium: { width: 1440, height: 2560 },
    },
    exportTargets: ["android-phone"],
    deviceNoun: "modern edge-to-edge Android smartphone with a centered punch-hole camera",
  },
  ipad: {
    id: "ipad",
    label: "iPad · App Store",
    short: "iPad",
    store: "App Store",
    aspect: 3 / 4,
    generate: {
      standard: { width: 1152, height: 1536 },
      premium: { width: 1536, height: 2048 },
    },
    exportTargets: ["ipad-13"],
    deviceNoun: "modern thin-bezel tablet in portrait orientation",
  },
};

export const EXPORT_TARGET_IDS = [
  "iphone-6.9",
  "iphone-6.5",
  "ipad-13",
  "android-phone",
] as const;
export type ExportTargetId = (typeof EXPORT_TARGET_IDS)[number];

export const EXPORT_TARGETS: Record<
  ExportTargetId,
  { id: ExportTargetId; label: string; width: number; height: number; note: string }
> = {
  "iphone-6.9": {
    id: "iphone-6.9",
    label: "iPhone 6.9″",
    width: 1290,
    height: 2796,
    note: "Required for App Store Connect (iPhone 16 Pro Max class)",
  },
  "iphone-6.5": {
    id: "iphone-6.5",
    label: "iPhone 6.5″",
    width: 1284,
    height: 2778,
    note: "Older large iPhones (optional)",
  },
  "ipad-13": {
    id: "ipad-13",
    label: "iPad 13″",
    width: 2064,
    height: 2752,
    note: "Required for iPad apps",
  },
  "android-phone": {
    id: "android-phone",
    label: "Android phone",
    width: 1080,
    height: 1920,
    note: "Play Store phone screenshots (9:16)",
  },
};

/** Fixed-size fallback for gpt-image-1 / 1.5, which only accept preset sizes. */
export const LEGACY_PORTRAIT_SIZE: GenSize = { width: 1024, height: 1536 };

/**
 * Credit pricing per rendered screen.
 * Basis: GPT Image 2 (via Runware) is token billed; medium quality at ~2.3 MP
 * lands around $0.10–0.15, high quality 3–4× that. Plans price 1 credit ≈ $0.018.
 */
export const CREDITS_PER_SCREEN: Record<QualityId, number> = {
  standard: 6,
  premium: 18,
};

/** `openai` = value sent as providerSettings.openai.quality on Runware. */
export const QUALITY_OPTIONS: Record<
  QualityId,
  { id: QualityId; label: string; description: string; openai: "medium" | "high" }
> = {
  standard: {
    id: "standard",
    label: "Standard",
    description: "Fast, sharp, store-ready. Best for iterating on the concept.",
    openai: "medium",
  },
  premium: {
    id: "premium",
    label: "Premium",
    description: "Highest detail and text crispness, rendered near native size.",
    openai: "high",
  },
};

export const LIMITS = {
  minScreens: 3,
  maxScreens: 8,
  maxScreenshots: 8,
  maxUploadBytes: 10 * 1024 * 1024,
  maxAssetEdge: 1600, // uploaded images are downscaled to this longest edge
  maxLogoEdge: 1024,
  maxTextField: 600,
  maxDescription: 1500,
  maxInstructions: 800,
} as const;

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

export const TONES = [
  "clean & minimal",
  "bold & energetic",
  "playful & friendly",
  "premium & elegant",
  "trustworthy & calm",
  "techy & futuristic",
] as const;
export type Tone = (typeof TONES)[number];

export const CATEGORIES = [
  "Productivity",
  "Finance",
  "Health & Fitness",
  "Social",
  "Photo & Video",
  "Education",
  "Travel",
  "Food & Drink",
  "Shopping",
  "Music",
  "Lifestyle",
  "Utilities",
  "Business",
  "Entertainment",
  "Games",
  "Developer Tools",
  "Other",
] as const;

// ─── Brief (what the user fills in) ────────────────────────────────────────────

export type AppStoreBrief = {
  appName: string;
  tagline?: string;
  category: string;
  description: string;
  audience?: string;
  tone: Tone;
  /** Hex colors, e.g. ["#6D28D9", "#F5F3FF"]. Empty = derive from logo/screenshots. */
  brandColors: string[];
  platform: PlatformId;
  screenCount: number;
  quality: QualityId;
  /** Key moments / features, one per screen (may be shorter than screenCount). */
  features: string[];
  extraInstructions?: string;
};

// ─── Style guide (what the art director decides) ───────────────────────────────

export type StyleGuide = {
  concept: string;
  mood: string;
  palette: {
    background: string;
    backgroundSecondary: string;
    accent: string;
    headline: string;
    subheadline: string;
    deviceFrame: "black" | "graphite" | "white" | "silver";
  };
  backgroundStyle: string;
  typography: {
    family: string;
    headlineStyle: string;
    subheadlineStyle: string;
    textCase: "sentence" | "title";
  };
  deviceTreatment: string;
  captionPlacement: "top" | "bottom";
  logoUsage: "hero-only" | "every-screen" | "none";
  decorativeMotif: string;
  avoid: string;
};

export type DeviceVariant = "straight" | "tilt-left" | "tilt-right" | "zoom-crop";

export type ScreenPlan = {
  index: number;
  headline: string;
  subheadline?: string | null;
  visualBrief: string;
  /** AppStoreAsset id of the screenshot to show inside the device, or null. */
  screenshotAssetId?: string | null;
  deviceVariant: DeviceVariant;
};

// ─── Status types shared with the client ───────────────────────────────────────

export type SetStatus = "planning" | "generating" | "completed" | "failed";
export type ScreenStatus = "pending" | "generating" | "done" | "failed";

export type AppStoreScreenDTO = {
  id: string;
  index: number;
  headline: string;
  subheadline: string | null;
  visualBrief: string | null;
  deviceVariant: DeviceVariant;
  status: ScreenStatus;
  error: string | null;
  canvasImageId: string | null;
  genWidth: number | null;
  genHeight: number | null;
  updatedAt: string;
};

export type AppStoreAssetDTO = {
  id: string;
  kind: "logo" | "screenshot" | "reference";
  name: string;
  width: number;
  height: number;
  order: number;
};

export type AppStoreSetDTO = {
  id: string;
  projectId: string;
  platform: PlatformId;
  quality: QualityId;
  model: string;
  status: SetStatus;
  error: string | null;
  brief: AppStoreBrief;
  styleGuide: StyleGuide | null;
  screens: AppStoreScreenDTO[];
  assets: AppStoreAssetDTO[];
  createdAt: string;
  updatedAt: string;
};

// ─── Canvas layout ─────────────────────────────────────────────────────────────

/** Display width of one screen on the canvas (canvas units). */
export const CANVAS_SLOT_WIDTH = 360;
export const CANVAS_SLOT_GAP = 60;
export const CANVAS_SLOT_ORIGIN = { x: 100, y: 100 };

export function slotSize(platform: PlatformId) {
  const width = CANVAS_SLOT_WIDTH;
  const height = Math.round(width / PLATFORMS[platform].aspect);
  return { width, height };
}

export function slotPosition(index: number) {
  return {
    x: CANVAS_SLOT_ORIGIN.x + index * (CANVAS_SLOT_WIDTH + CANVAS_SLOT_GAP),
    y: CANVAS_SLOT_ORIGIN.y,
  };
}

export function isActiveSetStatus(status: SetStatus | undefined) {
  return status === "planning" || status === "generating";
}
