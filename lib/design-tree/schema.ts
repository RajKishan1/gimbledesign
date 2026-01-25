/**
 * Zod Validation Schemas for Design Tree
 * 
 * These schemas validate AI-generated Design Tree JSON output.
 * They mirror the TypeScript types in types/design-tree.ts.
 */

import { z } from "zod";

// ============================================================================
// STYLE SCHEMAS
// ============================================================================

export const FillSchema = z.object({
  type: z.enum(["solid", "gradient", "image"]),
  color: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  gradientStops: z.array(z.object({
    color: z.string(),
    position: z.number(),
  })).optional(),
  gradientAngle: z.number().optional(),
  imageUrl: z.string().optional(),
  imageScaleMode: z.enum(["fill", "fit", "crop", "tile"]).optional(),
});

export const StrokeSchema = z.object({
  color: z.string(),
  width: z.number(),
  style: z.enum(["solid", "dashed", "dotted"]),
  position: z.enum(["inside", "outside", "center"]),
});

export const ShadowSchema = z.object({
  type: z.enum(["drop", "inner"]),
  color: z.string(),
  offsetX: z.number(),
  offsetY: z.number(),
  blur: z.number(),
  spread: z.number(),
});

export const CornerRadiusSchema = z.union([
  z.number(),
  z.object({
    topLeft: z.number(),
    topRight: z.number(),
    bottomRight: z.number(),
    bottomLeft: z.number(),
  }),
]);

export const TextStyleSchema = z.object({
  fontFamily: z.string(),
  fontSize: z.number(),
  fontWeight: z.number().min(100).max(900),
  lineHeight: z.union([z.number(), z.literal("auto")]),
  letterSpacing: z.number(),
  textAlign: z.enum(["left", "center", "right", "justify"]),
  textDecoration: z.enum(["none", "underline", "line-through"]),
  textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]),
});

// Partial text style for flexible AI output
export const PartialTextStyleSchema = z.object({
  fontFamily: z.string().optional().default("var(--font-sans)"),
  fontSize: z.number().optional().default(16),
  fontWeight: z.number().min(100).max(900).optional().default(400),
  lineHeight: z.union([z.number(), z.literal("auto")]).optional().default(1.5),
  letterSpacing: z.number().optional().default(0),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional().default("left"),
  textDecoration: z.enum(["none", "underline", "line-through"]).optional().default("none"),
  textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional().default("none"),
});

// ============================================================================
// LAYOUT SCHEMAS
// ============================================================================

export const PaddingSchema = z.object({
  top: z.number(),
  right: z.number(),
  bottom: z.number(),
  left: z.number(),
});

export const LayoutPropertiesSchema = z.object({
  mode: z.enum(["none", "horizontal", "vertical", "wrap"]),
  padding: PaddingSchema.optional().default({ top: 0, right: 0, bottom: 0, left: 0 }),
  gap: z.number().optional().default(0),
  alignItems: z.enum(["start", "center", "end", "stretch", "baseline"]).optional().default("start"),
  justifyContent: z.enum(["start", "center", "end", "space-between", "space-around", "space-evenly"]).optional().default("start"),
  wrap: z.boolean().optional().default(false),
});

export const ConstraintsSchema = z.object({
  horizontal: z.enum(["left", "right", "center", "stretch", "scale"]),
  vertical: z.enum(["top", "bottom", "center", "stretch", "scale"]),
});

// ============================================================================
// BASE NODE SCHEMA
// ============================================================================

const BaseDesignNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  visible: z.boolean().optional().default(true),
  locked: z.boolean().optional().default(false),
  x: z.number().optional().default(0),
  y: z.number().optional().default(0),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional(),
  constraints: ConstraintsSchema.optional(),
  opacity: z.number().min(0).max(1).optional().default(1),
  fills: z.array(FillSchema).optional(),
  strokes: z.array(StrokeSchema).optional(),
  shadows: z.array(ShadowSchema).optional(),
  cornerRadius: CornerRadiusSchema.optional(),
  clipContent: z.boolean().optional(),
  blur: z.number().optional(),
  backdropBlur: z.number().optional(),
  tags: z.array(z.string()).optional(),
  cssClasses: z.array(z.string()).optional(),
});

// ============================================================================
// SPECIFIC NODE SCHEMAS
// ============================================================================

// Forward declaration for recursive types
type DesignNodeType = z.infer<typeof DesignNodeSchema>;

export const TextNodeSchema = BaseDesignNodeSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  textStyle: PartialTextStyleSchema.optional().default({
    fontFamily: "var(--font-sans)",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
    textAlign: "left",
    textDecoration: "none",
    textTransform: "none",
  }),
  autoWidth: z.boolean().optional(),
  autoHeight: z.boolean().optional(),
  maxLines: z.number().optional(),
});

export const ImageNodeSchema = BaseDesignNodeSchema.extend({
  type: z.literal("image"),
  src: z.string(),
  alt: z.string().optional(),
  objectFit: z.enum(["cover", "contain", "fill", "none"]).optional().default("cover"),
});

export const IconNodeSchema = BaseDesignNodeSchema.extend({
  type: z.literal("icon"),
  iconName: z.string(),
  iconLibrary: z.string().optional().default("hugeicons"),
  color: z.string().optional(),
});

export const RectangleNodeSchema = BaseDesignNodeSchema.extend({
  type: z.literal("rectangle"),
});

export const InputNodeSchema = BaseDesignNodeSchema.extend({
  type: z.literal("input"),
  inputType: z.enum(["text", "email", "password", "number", "search"]),
  placeholder: z.string().optional(),
  value: z.string().optional(),
  disabled: z.boolean().optional(),
});

export const SvgNodeSchema = BaseDesignNodeSchema.extend({
  type: z.literal("svg"),
  svgContent: z.string(),
  viewBox: z.string().optional(),
});

// Lazy schemas for recursive types
export const FrameNodeSchema = BaseDesignNodeSchema.extend({
  type: z.literal("frame"),
  children: z.lazy(() => z.array(DesignNodeSchema)),
  layout: LayoutPropertiesSchema.optional(),
  isComponent: z.boolean().optional(),
  componentId: z.string().optional(),
});

export const GroupNodeSchema = BaseDesignNodeSchema.extend({
  type: z.literal("group"),
  children: z.lazy(() => z.array(DesignNodeSchema)),
});

export const ButtonNodeSchema = BaseDesignNodeSchema.extend({
  type: z.literal("button"),
  children: z.lazy(() => z.array(DesignNodeSchema)),
  layout: LayoutPropertiesSchema.optional(),
  variant: z.enum(["primary", "secondary", "outline", "ghost"]).optional(),
  disabled: z.boolean().optional(),
});

// Union of all node types
export const DesignNodeSchema: z.ZodType<any> = z.lazy(() => 
  z.discriminatedUnion("type", [
    FrameNodeSchema,
    GroupNodeSchema,
    TextNodeSchema,
    ImageNodeSchema,
    IconNodeSchema,
    RectangleNodeSchema,
    ButtonNodeSchema,
    InputNodeSchema,
    SvgNodeSchema,
  ] as const)
);

// ============================================================================
// DESIGN TREE SCHEMA
// ============================================================================

export const DesignTreeSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  backgroundColor: z.string().optional(),
  root: FrameNodeSchema,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  version: z.number().optional().default(1),
  themeId: z.string().optional(),
  themeVariables: z.record(z.string(), z.string()).optional(),
});

// ============================================================================
// COMPONENT DEFINITION SCHEMA
// ============================================================================

export const ComponentDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum([
    "navigation",
    "card",
    "form",
    "button",
    "header",
    "footer",
    "list",
    "modal",
    "other",
  ]),
  tree: FrameNodeSchema,
  variants: z.array(z.object({
    name: z.string(),
    overrides: z.record(z.string(), z.unknown()),
  })).optional(),
  defaultProps: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a Design Tree JSON object
 */
export function validateDesignTree(data: unknown): {
  success: boolean;
  data?: z.infer<typeof DesignTreeSchema>;
  error?: z.ZodError;
} {
  const result = DesignTreeSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate a single Design Node
 */
export function validateDesignNode(data: unknown): {
  success: boolean;
  data?: z.infer<typeof DesignNodeSchema>;
  error?: z.ZodError;
} {
  const result = DesignNodeSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Parse Design Tree with error messages
 */
export function parseDesignTree(json: string): z.infer<typeof DesignTreeSchema> {
  try {
    const data = JSON.parse(json);
    return DesignTreeSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new Error(`Invalid Design Tree: ${issues}`);
    }
    throw error;
  }
}

/**
 * Safely parse Design Tree, returning null on error
 */
export function safeParseDesignTree(json: string): z.infer<typeof DesignTreeSchema> | null {
  try {
    return parseDesignTree(json);
  } catch {
    return null;
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Fill = z.infer<typeof FillSchema>;
export type Stroke = z.infer<typeof StrokeSchema>;
export type Shadow = z.infer<typeof ShadowSchema>;
export type TextStyle = z.infer<typeof TextStyleSchema>;
export type LayoutProperties = z.infer<typeof LayoutPropertiesSchema>;
export type Constraints = z.infer<typeof ConstraintsSchema>;
export type DesignNode = z.infer<typeof DesignNodeSchema>;
export type FrameNode = z.infer<typeof FrameNodeSchema>;
export type TextNode = z.infer<typeof TextNodeSchema>;
export type ImageNode = z.infer<typeof ImageNodeSchema>;
export type IconNode = z.infer<typeof IconNodeSchema>;
export type ButtonNode = z.infer<typeof ButtonNodeSchema>;
export type InputNode = z.infer<typeof InputNodeSchema>;
export type DesignTree = z.infer<typeof DesignTreeSchema>;
export type ComponentDefinition = z.infer<typeof ComponentDefinitionSchema>;
