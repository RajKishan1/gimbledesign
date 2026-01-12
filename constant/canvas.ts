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
] as const;