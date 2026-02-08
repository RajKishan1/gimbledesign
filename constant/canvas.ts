export const TOOL_MODE_ENUM = {
  SELECT: "SELECT",
  HAND: "HAND",
} as const;

export type ToolModeType = keyof typeof TOOL_MODE_ENUM;

// Canvas mode enum for Design vs Prototype modes
export const CANVAS_MODE_ENUM = {
  DESIGN: "design",
  PROTOTYPE: "prototype",
} as const;

export type CanvasModeType = (typeof CANVAS_MODE_ENUM)[keyof typeof CANVAS_MODE_ENUM];

// Device type enum for Mobile vs Web designs
export const DEVICE_TYPE_ENUM = {
  MOBILE: "mobile",
  WEB: "web",
} as const;

export type DeviceType = (typeof DEVICE_TYPE_ENUM)[keyof typeof DEVICE_TYPE_ENUM];

// iPhone 16 width (CSS pixels) — used for mobile frame width; height is content-driven, no fixed height.
export const IPHONE_16_VIEWPORT = {
  width: 393,
  height: 852, // used for loading skeleton / shimmer so placeholder matches iPhone proportions
} as const;

// Device dimensions — width fixed per device type; height is content-driven. Skeleton uses iPhone height for placeholder.
export const DEVICE_DIMENSIONS = {
  MOBILE: {
    width: IPHONE_16_VIEWPORT.width,
    height: null,
    minHeight: 300, // floor so frame is visible before content loads
    skeletonHeight: IPHONE_16_VIEWPORT.height, // shimmer/skeleton matches iPhone proportions
    flexibleHeight: true,
    label: "iPhone 16",
  },
  WEB: {
    width: 1440,
    height: null,
    minHeight: 300,
    skeletonHeight: 800,
    flexibleHeight: true,
    label: "Desktop (1440px)",
  },
} as const;

// Interactive element selectors for prototype mode
export const INTERACTIVE_ELEMENT_SELECTORS = [
  "button",
  "a",
  "[role='button']",
  "[data-interactive]",
  ".btn",
  ".card",
  ".nav-item",
  ".menu-item",
  "[onclick]",
  "input[type='submit']",
  "input[type='button']",
  "div",
] as const;