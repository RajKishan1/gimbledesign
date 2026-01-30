/**
 * Design Tree Module
 *
 * This module provides the foundation for a layer-based design system.
 * It enables:
 *
 * 1. Structured design data (not just HTML strings)
 * 2. Click-to-select any element
 * 3. Edit individual elements (text, colors, spacing)
 * 4. Export to Figma as editable layers (via SVG)
 *
 * Architecture:
 *
 *   AI Generation → Design Tree → HTML Renderer → Canvas Display
 *                       ↓
 *                  Figma Export (SVG)
 *
 * The Design Tree is the "source of truth" for all design data.
 */

// Types
export * from "@/types/design-tree";

// Zod Schemas for validation
export {
  DesignTreeSchema,
  DesignNodeSchema,
  FrameNodeSchema,
  TextNodeSchema,
  ImageNodeSchema,
  IconNodeSchema,
  ButtonNodeSchema,
  InputNodeSchema,
  FillSchema,
  StrokeSchema,
  ShadowSchema,
  LayoutPropertiesSchema,
  TextStyleSchema,
  validateDesignTree,
  validateDesignNode,
  parseDesignTree,
  safeParseDesignTree,
} from "./schema";

// HTML to Tree Parser
export {
  parseHtmlToDesignTree,
  parseElement,
  determineNodeType,
} from "./html-to-tree";

// Tree to HTML Renderer
export {
  renderDesignTreeToHtml,
  renderNode,
  buildBaseStyles,
  buildLayoutStyles,
  buildTextStyles,
} from "./tree-to-html";

// Tree to SVG Export (Figma paste - no plugin)
export {
  copyDesignTreeAsSvg,
  convertTreeToSvg,
  collectImageUrlsFromTree,
} from "./tree-to-svg";
export type { SvgExportOptions } from "./tree-to-svg";
