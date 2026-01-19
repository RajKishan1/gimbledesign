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

// Device type enum for Mobile vs Web vs Creative designs
export const DEVICE_TYPE_ENUM = {
  MOBILE: "mobile",
  WEB: "web",
  CREATIVE: "creative",
} as const;

export type DeviceType = (typeof DEVICE_TYPE_ENUM)[keyof typeof DEVICE_TYPE_ENUM];

// Device dimensions
// Note: Web has flexible height (minHeight only), Mobile and Creative have fixed heights
export const DEVICE_DIMENSIONS = {
  MOBILE: {
    width: 430,
    height: 932,
    minHeight: 932,
    flexibleHeight: false,
    label: "iPhone 17 Pro Max",
  },
  WEB: {
    width: 1440,
    height: null, // Flexible - determined by content
    minHeight: 800,
    flexibleHeight: true,
    label: "Desktop (1440px)",
  },
  CREATIVE: {
    width: 1290,
    height: 2796,
    minHeight: 2796,
    flexibleHeight: false,
    label: "App Store Screenshot",
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