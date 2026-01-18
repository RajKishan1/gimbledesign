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

// Device dimensions
export const DEVICE_DIMENSIONS = {
  MOBILE: {
    width: 430,
    height: 932,
    label: "iPhone 17 Pro Max",
  },
  WEB: {
    width: 1440,
    height: 900,
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